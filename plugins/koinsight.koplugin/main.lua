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

local koinsight = WidgetContainer:extend{
    name = "koinsight",
    is_doc_only = false
}

function koinsight:init()
    self:onDispatcherRegisterActions()
    self.ui.menu:registerToMainMenu(self)
    self.koinsight_settings = KoInsightSettings:new{}
end

function koinsight:addToMainMenu(menu_items)
    menu_items.koinsight = {
        text = _("KoInsight"),
        sorting_hint = "tools",
        sub_item_table = {{
            text = _("Configure KoInsight"),
            keep_menu_open = true,
            separator = true,
            callback = function()
                self.koinsight_settings:editServerSettings()
            end
        }, {
            text = _("Synchronize data"),
            separator = true,
            callback = function()
                onUpload(self.koinsight_settings.server_url)
            end
        }, {
            text = _("About KoInsight"),
            keep_menu_open = true,
            callback = function()
                local const = require("const")
                UIManager:show(InfoMessage:new{
                    text = "KoInsight is a sync plugin for KoInsight instances.\n\nPlugin version: " .. const.VERSION ..
                        "\n\nSee https://github.com/GeorgeSG/koinsight."
                })
            end
        }}
    }
end

-- Register sync action to make it available in gestures
function koinsight:onDispatcherRegisterActions()
    Dispatcher:registerAction(
        "koinsight_sync",
        {
            category = "network",
            event    = "KoInsightSync",
            title    = _("KoInsight: Sync stats"),
            general  = true
        }
    )
end

function koinsight:onKoInsightSync()
    onUpload(self.koinsight_settings.server_url)
end

return koinsight
