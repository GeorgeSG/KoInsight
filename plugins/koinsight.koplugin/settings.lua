local _ = require("gettext")
local BD = require("ui/bidi")
local DataStorage = require("datastorage")
local InfoMessage = require("ui/widget/infomessage")
local logger = require("logger")
local LuaSettings = require("luasettings")
local MultiInputDialog = require("ui/widget/multiinputdialog")
local UIManager = require("ui/uimanager")
local Menu = require("ui/widget/menu")

local KoInsightSettings = {
  settings = nil, -- LuaSettings handle
  data = nil, -- in-memory normalized table
}
KoInsightSettings.__index = KoInsightSettings

local SETTING_KEY = "koinsight"
local DEFAULTS = {
  server_url = "",
  sync_on_suspend = true,
  aggressive_suspend_sync = false,
  suspend_connect_timeout_s = 10, -- clamped to [3, 60]
}

local function open_settings_handle()
  local path = DataStorage:getSettingsDir() .. "/" .. SETTING_KEY .. ".lua"
  return LuaSettings:open(path)
end

-- small helper function to clamp numeric values, e.g. timeout
local function clamp(v, lo, hi)
  if v < lo then
    return lo
  end
  if v > hi then
    return hi
  end
  return v
end

function KoInsightSettings:new()
  local obj = setmetatable({}, self)
  obj.settings = open_settings_handle()
  obj.data = obj.settings:readSetting(SETTING_KEY, {}) or {}
  return obj
end

-- optional for now, if we ever want to re-read from disk
function KoInsightSettings:reload()
  self.data = self.settings:readSetting(SETTING_KEY, {}) or {}
end

function KoInsightSettings:writeData()
  self.settings:saveSetting(SETTING_KEY, self.data)
  self.settings:flush()
end

function KoInsightSettings:update(patch)
  for k, v in pairs(patch or {}) do
    self.data[k] = v
  end
  self:writeData()
end

-- getters/setters
function KoInsightSettings:getServerURL()
  return self.data.server_url or DEFAULTS.server_url
end
function KoInsightSettings:setServerURL(url)
  url = tostring(url or ""):gsub("/*$", "")
  self:update({ server_url = url })
end

function KoInsightSettings:getSyncOnSuspendEnabled()
  return self.data.sync_on_suspend or DEFAULTS.sync_on_suspend
end
function KoInsightSettings:setSyncOnSuspendEnabled(enabled)
  self:update({ ["sync_on_suspend"] = (enabled == true) })
end

function KoInsightSettings:getAggressiveSuspendEnabled()
  return self.data.aggressive_suspend_sync or DEFAULTS.aggressive_suspend_sync
end
function KoInsightSettings:setAggressiveSuspendEnabled(enabled)
  self:update({ ["aggressive_suspend_sync"] = (enabled == true) })
end

function KoInsightSettings:getSuspendConnectTimeout()
  local t = tonumber(self.data.suspend_connect_timeout_s)
  -- íf its an actual number, not nan
  if not (t and t == t) then
    return DEFAULTS.suspend_connect_timeout_s
  end
  return clamp(t, 3, 60)
end
function KoInsightSettings:setSuspendConnectTimeout(sec)
  local t = tonumber(sec)
  -- íf its an actual number, not nan
  if not (t and t == t) then
    t = DEFAULTS.suspend_connect_timeout_s
  end
  t = clamp(t, 3, 60)
  self:update({ suspend_connect_timeout_s = t })
end

function KoInsightSettings:editServerSettings()
  self.settings_dialog = MultiInputDialog:new({
    title = _("KoInsight settings"),
    fields = {
      {
        text = self.data.server_url,
        description = _("Server URL:"),
        hint = _("http://example.com:port"),
      },
    },
    buttons = {
      {
        {
          text = _("Cancel"),
          id = "close",
          callback = function()
            UIManager:close(self.settings_dialog)
          end,
        },
        {
          text = _("Info"),
          callback = function()
            UIManager:show(InfoMessage:new({
              text = _("Enter the location of your KoInsight server"),
            }))
          end,
        },
        {
          text = _("Apply"),
          callback = function()
            local myfields = self.settings_dialog:getFields()
            self:setServerURL(myfields[1])
            UIManager:close(self.settings_dialog)
            UIManager:show(InfoMessage:new({ text = _("KoInsight settings saved."), timeout = 2 }))
          end,
        },
      },
    },
  })

  UIManager:show(self.settings_dialog)
  self.settings_dialog:onShowKeyboard()
end

function KoInsightSettings:showOptionsMenu()
  UIManager:show(Menu:new({
    title = _("KoInsight: Sync options"),
    item_table = {
      {
        text = _("Sync on suspend"),
        checked_func = function()
          return self:getSyncOnSuspendEnabled()
        end,
        callback = function()
          self:toggleSyncOnSuspend()
        end,
      },
      {
        text = _("Aggressive sync (auto Wi-Fi)"),
        checked_func = function()
          return self:getAggressiveSuspendEnabled()
        end,
        callback = function()
          self:toggleAggressiveSuspend()
        end,
      },
      {
        text = _("Set suspend connect timeout…"),
        keep_menu_open = true,
        callback = function()
          self:editTimeoutDialog()
        end,
      },
    },
    is_popout = false,
    is_borderless = true,
  }))
end

function KoInsightSettings:toggleSyncOnSuspend()
  local newv = not self:getSyncOnSuspendEnabled()
  self:setSyncOnSuspendEnabled(newv)
  UIManager:show(InfoMessage:new({
    text = newv and _("Sync on suspend enabled") or _("Sync on suspend disabled"),
    timeout = 2,
  }))
end

function KoInsightSettings:toggleAggressiveSuspend()
  local newv = not self:getAggressiveSuspendEnabled()
  self:setAggressiveSuspendEnabled(newv)
  UIManager:show(InfoMessage:new({
    text = newv and _("Aggressive suspend sync enabled") or _("Aggressive suspend sync disabled"),
    timeout = 2,
  }))
end

function KoInsightSettings:editTimeoutDialog()
  local current = tostring(self:getSuspendConnectTimeout())
  self.timeout_dialog = MultiInputDialog:new({
    title = _("Suspend connect timeout (seconds)"),
    fields = {
      {
        text = current,
        description = _("Timeout (3..60):"),
        hint = _("10"),
        input_type = "number",
      },
    },
    buttons = {
      {
        {
          text = _("Cancel"),
          id = "close",
          callback = function()
            UIManager:close(self.timeout_dialog)
          end,
        },
        {
          text = _("Apply"),
          callback = function()
            local fields = self.timeout_dialog:getFields()
            self:setSuspendConnectTimeout(fields[1])
            UIManager:close(self.timeout_dialog)
            UIManager:show(InfoMessage:new({ text = _("Timeout saved."), timeout = 2 }))
          end,
        },
      },
    },
  })
  UIManager:show(self.timeout_dialog)
  self.timeout_dialog:onShowKeyboard()
end

return KoInsightSettings
