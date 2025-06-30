local _ = require("gettext")
local BD = require("ui/bidi")
local DataStorage = require("datastorage")
local InfoMessage = require("ui/widget/infomessage")
local logger = require("logger")
local LuaSettings = require("luasettings")
local MultiInputDialog = require("ui/widget/multiinputdialog")
local UIManager = require("ui/uimanager")

local KoInsightSettings = {
  server_url = nil,
}
KoInsightSettings.__index = KoInsightSettings

local SETTING_KEY = "koinsight"

function KoInsightSettings:new()
  local obj = setmetatable({}, self)
  obj.settings = obj:readSettings()
  obj.server_url = obj.settings.data.koinsight.server_url
  return obj
end

function KoInsightSettings:readSettings()
  local settings = LuaSettings:open(DataStorage:getSettingsDir() .. "/" .. SETTING_KEY .. ".lua")
  settings:readSetting(SETTING_KEY, {})
  return settings
end

function KoInsightSettings:persistSettings()
  local new_settings = {
    server_url = self.server_url,
  }

  self.settings:saveSetting(SETTING_KEY, new_settings)
  self.settings:flush()
end

function KoInsightSettings:editServerSettings()
  self.settings_dialog = MultiInputDialog:new({
    title = _("KoInsight settings"),
    fields = {
      {
        text = self.server_url,
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
            self.server_url = myfields[1]:gsub("/*$", "") -- remove all trailing slashes
            self:persistSettings()
            UIManager:close(self.settings_dialog)
          end,
        },
      },
    },
  })

  UIManager:show(self.settings_dialog)
  self.settings_dialog:onShowKeyboard()
end

return KoInsightSettings
