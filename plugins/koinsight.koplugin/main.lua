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
    self.ui.menu:registerToMainMenu(self)
    self.koinsight_settings = KoInsightSettings:new{}
    self:initMenuOrder()
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
