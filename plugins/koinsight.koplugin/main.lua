local _ = require("gettext")
local Dispatcher = require("dispatcher") -- luacheck:ignore
local InfoMessage = require("ui/widget/infomessage")
local logger = require("logger")
local onUpload = require("upload")
local UIManager = require("ui/uimanager")
local WidgetContainer = require("ui/widget/container/widgetcontainer")
local KoInsightSettings = require("settings")
local KoInsightDbReader = require("db_reader")
local JSON = require("json")

local koinsight = WidgetContainer:extend({
  name = "koinsight",
  is_doc_only = false,
})

function koinsight:init()
  self:onDispatcherRegisterActions()
  self.ui.menu:registerToMainMenu(self)
  self.koinsight_settings = KoInsightSettings:new({})
  self:initMenuOrder()
end

function koinsight:addToMainMenu(menu_items)
  menu_items.koinsight = {
    text = _("KoInsight"),
    sorting_hint = "tools",
    sub_item_table = {
      {
        text = _("Configure KoInsight"),
        keep_menu_open = true,
        separator = true,
        callback = function()
          self.koinsight_settings:editServerSettings()
        end,
      },
      {
        text = _("Synchronize data"),
        separator = true,
        callback = function()
          onUpload(self.koinsight_settings.server_url)
        end,
      },
      {
        text = _("Sync on suspend"),
        checked_func = function() return self:getSyncOnSuspendEnabled() end,
        callback = function()
          self:toggleSyncOnSuspend()
        end,
      },
      {
        text = _("About KoInsight"),
        keep_menu_open = true,
        callback = function()
          local const = require("const")
          UIManager:show(InfoMessage:new({
            text = "KoInsight is a sync plugin for KoInsight instances.\n\nPlugin version: "
              .. const.VERSION
              .. "\n\nSee https://github.com/GeorgeSG/koinsight.",
          }))
        end,
      },
    },
  }
end

-- Register sync action to make it available in gestures
function koinsight:onDispatcherRegisterActions()
  Dispatcher:registerAction("koinsight_sync", {
    category = "none",
    event = "KoInsightSync",
    title = _("KoInsight: Sync stats"),
    general = true,
  })
end

function koinsight:onKoInsightSync()
  onUpload(self.koinsight_settings.server_url)
end

-- Sync when device suspends
function koinsight:onSuspend()
  if not self:getSyncOnSuspendEnabled() then
    logger.dbg("[KoInsight] Sync on suspend is disabled, skipping")
    return
  end
  
  logger.info("[KoInsight] Device suspending - syncing data")
  self:performSyncOnSuspend()
end

-- Also sync on other relevant events for completeness
function koinsight:onClose()
  if not self:getSyncOnSuspendEnabled() then
    return
  end
  
  logger.info("[KoInsight] System closing - syncing data")
  self:performSyncOnSuspend()
end

function koinsight:onPowerOff()
  if not self:getSyncOnSuspendEnabled() then
    return
  end
  
  logger.info("[KoInsight] Device powering off - syncing data")
  self:performSyncOnSuspend()
end

function koinsight:onReboot()
  if not self:getSyncOnSuspendEnabled() then
    return
  end
  
  logger.info("[KoInsight] Device rebooting - syncing data")
  self:performSyncOnSuspend()
end

-- Perform the actual sync with error handling
function koinsight:performSyncOnSuspend()
  -- Check if we have a server URL configured
  if not self.koinsight_settings.server_url or self.koinsight_settings.server_url == "" then
    logger.info("[KoInsight] No server URL configured, skipping sync on suspend")
    return
  end
  
  -- Check WiFi connectivity before attempting sync
  if not self:isWiFiConnected() then
    logger.info("[KoInsight] WiFi not connected, skipping sync on suspend")
    return
  end
  
  -- Perform sync in a protected call to avoid crashing on suspend
  local success, error_msg = pcall(function()
    onUpload(self.koinsight_settings.server_url, true) -- true = silent mode
  end)
  
  if not success then
    message = "Error during auto sync: " .. tostring(error_msg)
    logger.err("[KoInsight] " .. message)
    UIManager:show(InfoMessage:new({
      text = _(message),
    }))
  else
    logger.info("[KoInsight] Suspend sync completed successfully")
  end
end

-- Check if WiFi is connected
function koinsight:isWiFiConnected()
  local success, result = pcall(function()
    local NetworkMgr = require("ui/network/manager")
    
    -- NetworkMgr handles all the platform-specific logic for us
    -- isWifiOn() returns true on devices without WiFi toggle (like some tablets)
    -- isConnected() checks actual network connectivity
    return NetworkMgr:isWifiOn() and NetworkMgr:isConnected()
  end)
  
  if not success then
    logger.err("[KoInsight] Error checking WiFi status:", result)
    -- If we can't check WiFi status, assume it's available
    return true
  end
  
  logger.dbg("[KoInsight] WiFi status - On:", result and "true" or "false")
  return result
end

-- Setting management for sync on suspend toggle
function koinsight:getSyncOnSuspendEnabled()
  -- Safer settings access with error handling
  local success, result = pcall(function()
    local settings = self.koinsight_settings.settings
    if not settings then
      logger.dbg("[KoInsight] No settings object found")
      return true -- default
    end
    
    local koinsight_data = settings:readSetting("koinsight", {})
    if koinsight_data.sync_on_suspend == nil then
      logger.dbg("[KoInsight] sync_on_suspend not set, defaulting to true")
      return true
    end
    
    logger.dbg("[KoInsight] sync_on_suspend current value:", koinsight_data.sync_on_suspend)
    return koinsight_data.sync_on_suspend
  end)
  
  if not success then
    logger.err("[KoInsight] Error reading sync_on_suspend setting:", result)
    return true -- safe default
  end
  
  return result
end

function koinsight:setSyncOnSuspendEnabled(enabled)
  local success, error_msg = pcall(function()
    logger.dbg("[KoInsight] Attempting to save sync_on_suspend:", enabled)
    
    local settings = self.koinsight_settings.settings
    if not settings then
      logger.err("[KoInsight] No settings object available")
      return
    end
    
    local current_data = settings:readSetting("koinsight", {})
    current_data.sync_on_suspend = enabled
    
    -- Preserve existing server_url if it exists
    if self.koinsight_settings.server_url then
      current_data.server_url = self.koinsight_settings.server_url
    end
    
    logger.dbg("[KoInsight] Saving data:", current_data)
    settings:saveSetting("koinsight", current_data)
    settings:flush()
    logger.dbg("[KoInsight] Settings saved successfully")
  end)
  
  if not success then
    logger.err("[KoInsight] Error saving sync_on_suspend setting:", error_msg)
  end
end

function koinsight:toggleSyncOnSuspend()
  local success, error_msg = pcall(function()
    local current_state = self:getSyncOnSuspendEnabled()
    logger.dbg("[KoInsight] Current sync_on_suspend state:", current_state)
    
    local new_state = not current_state
    logger.dbg("[KoInsight] Toggling to new state:", new_state)
    
    self:setSyncOnSuspendEnabled(new_state)
    
    local message = new_state and _("Sync on suspend enabled") or _("Sync on suspend disabled")
    UIManager:show(InfoMessage:new({
      text = message,
      timeout = 2,
    }))
    
    logger.info("[KoInsight] Sync on suspend toggled from", current_state, "to", new_state)
  end)
  
  if not success then
    logger.err("[KoInsight] Error in toggleSyncOnSuspend:", error_msg)
    UIManager:show(InfoMessage:new({
      text = _("Error toggling sync setting"),
      timeout = 3,
    }))
  end
end

function koinsight:initMenuOrder()
  local menu_order_modules = {
    "ui/elements/filemanager_menu_order",
    "ui/elements/reader_menu_order",
  }

  for _, module_name in ipairs(menu_order_modules) do
    local success, menu_order = pcall(require, module_name)
    if success and menu_order and menu_order.tools then
      local pos = 1
      for i, val in ipairs(menu_order.tools) do
        if val == "statistics" then
          pos = i + 1
          break
        end
      end
      table.insert(menu_order.tools, pos, "koinsight")
      logger.info("[KoInsight] Added to menu order using module: " .. module_name)
    end
  end
end

return koinsight
