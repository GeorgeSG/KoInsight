local _ = require("gettext")
local callApi = require("call_api")
local InfoMessage = require("ui/widget/infomessage")
local JSON = require("json")
local KoInsightDbReader = require("db_reader")
local logger = require("logger")
local UIManager = require("ui/uimanager")
local const = require("const")
local Device = require("device")

local API_UPLOAD_LOCATION = "/api/plugin/import"
local API_DEVICE_LOCATION = "/api/plugin/device"

function get_headers(body)
    local headers = {
        ["Content-Type"] = "application/json",
        ["Content-Length"] = tostring(#body)
    }
    return headers
end

function render_response_message(response, prefix, default_text)
    local text = prefix .. " " .. default_text
    if response ~= nil and response['message'] ~= nil then
        logger.dbg("[KoInsight] API message received: ", JSON.encode(response))
        text = prefix .. " " .. response['message']
    end

    UIManager:show(InfoMessage:new{
        text = _(text)
    })
end

function send_device_data(server_url)
    local url = server_url .. API_DEVICE_LOCATION
    local body = {
        id = G_reader_settings:readSetting("device_id"),
        model = Device.model,
        version = const.VERSION
    }
    body = JSON.encode(body)

    local ok, response = callApi("POST", url, get_headers(body), body)

    if ok ~= true then
        render_response_message(response, "Error:", "Unable to register device.")
    end
end

function send_statistics_data(server_url)
    local url = server_url .. API_UPLOAD_LOCATION

    local body = {
        stats = KoInsightDbReader.progressData(),
        books = KoInsightDbReader.bookData(),
        version = const.VERSION
    }

    body = JSON.encode(body)

    local ok, response = callApi("POST", url, get_headers(body), body)

    if ok then
        render_response_message(response, "Success:", "Data uploaded.")
    else
        render_response_message(response, "Error:", "Data upload failed.")
    end
end

return function(server_url)
    if server_url == nil or server_url == "" then
        UIManager:show(InfoMessage:new{
            text = _("Please configure the server URL first.")
        })
        return
    end

    send_device_data(server_url)
    send_statistics_data(server_url)
end
