local socketutil = require("socketutil")
local ltn12 = require("ltn12")
local logger = require("logger")
local socket = require("socket")
local http = require("socket.http")
local UIManager = require("ui/uimanager")
local JSON = require("json")
local InfoMessage = require("ui/widget/infomessage")
local _ = require("gettext")

local MAX_RETRIES = 3
local RETRY_DELAYS = {1, 2, 4} -- seconds, exponential backoff

local function response_not_valid(content)
  logger.err("[KoInsight] callApi: response was not valid JSON", content)
  UIManager:show(InfoMessage:new({
    text = _("Server response is not valid."),
  }))
end

return function(method, url, headers, body, filepath, quiet)
  quiet = quiet or false

  local last_error
  for attempt = 1, MAX_RETRIES do
    local sink = {}
    local request = {
      method = method,
      url = url,
      headers = headers or {},
      sink = ltn12.sink.table(sink),
    }

    if body ~= nil then
      request.source = ltn12.source.string(body)
    end

    if attempt == 1 then
      logger.dbg("[KoInsight] callApi:", request.method, request.url)
    else
      logger.info("[KoInsight] callApi: retry attempt", attempt, "of", MAX_RETRIES)
    end

    socketutil:set_timeout(socketutil.LARGE_BLOCK_TIMEOUT, 60)
    local code, resp_headers, status = socket.skip(1, http.request(request))
    socketutil:reset_timeout()

    -- If we got a response (success or HTTP error), process it
    if resp_headers ~= nil then
      -- If the request returned successfully
      if code == 200 then
        local content = table.concat(sink)

        if content == nil or content == "" or string.sub(content, 1, 1) ~= "{" then
          response_not_valid(content)
          return false, "empty_response"
        end

        local ok, result = pcall(JSON.decode, content)

        if ok and result then
          return true, result
        else
          response_not_valid(content)
          return false, "invalid_response"
        end
      else
        -- HTTP error - don't retry, server received the request
        if not quiet then
          local content = table.concat(sink)
          local error_detail = ""
          local decode_ok, decoded = pcall(JSON.decode, content)
          if decode_ok and type(decoded) == "table" and decoded.error then
            error_detail = ": " .. tostring(decoded.error)
          end
          logger.err("[KoInsight] callApi: HTTP error", status or code, resp_headers)
          UIManager:show(InfoMessage:new({
            text = _("Server error") .. error_detail,
          }))
        end

        return false, "http_error", code
      end
    end

    -- Network error - retry with delay
    last_error = status or code
    logger.warn("[KoInsight] Network error, attempt", attempt, "of", MAX_RETRIES, ":", last_error)

    if attempt < MAX_RETRIES then
      socket.sleep(RETRY_DELAYS[attempt])
    end
  end

  -- All retries exhausted
  logger.err("[KoInsight] callApi: network error after", MAX_RETRIES, "attempts:", last_error)
  if not quiet then
    UIManager:show(InfoMessage:new({
      text = _("Network error. Please check your connection."),
    }))
  end
  return false, "network_error"
end
