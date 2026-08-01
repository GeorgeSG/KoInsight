local JSON = require("json")
local logger = require("logger")
local ltn12 = require("ltn12")
local socket = require("socket")
local http = require("socket.http")
local socketutil = require("socketutil")
local UIManager = require("ui/uimanager")
local InfoMessage = require("ui/widget/infomessage")
local _ = require("gettext")

local function build_multipart_body(boundary, fields, file_content, file_field, filename, mime)
  local parts = {}
  for k, v in pairs(fields) do
    table.insert(parts, "--" .. boundary .. "\r\n")
    table.insert(
      parts,
      string.format('Content-Disposition: form-data; name="%s"\r\n\r\n%s\r\n', k, tostring(v))
    )
  end
  table.insert(parts, "--" .. boundary .. "\r\n")
  table.insert(
    parts,
    string.format(
      'Content-Disposition: form-data; name="%s"; filename="%s"\r\n',
      file_field,
      filename
    )
  )
  table.insert(parts, "Content-Type: " .. mime .. "\r\n\r\n")
  table.insert(parts, file_content)
  table.insert(parts, "\r\n--" .. boundary .. "--\r\n")
  return table.concat(parts)
end

--- POST multipart/form-data; returns same shape as call_api: ok, result_or_key [, http_code]
return function(url, fields, filepath, file_field_name, filename, mime, quiet)
  quiet = quiet or false
  file_field_name = file_field_name or "file"
  filename = filename or "cover.png"
  mime = mime or "image/png"

  local fh, data = io.open(filepath, "rb"), nil
  if not fh then
    logger.err("[KoInsight] callMultipart: cannot read file", filepath)
    return false, "file_read_error"
  end
  data = fh:read("*a")
  fh:close()

  local boundary = "----KoInsightFormBoundary" .. tostring(os.time())
  local body = build_multipart_body(boundary, fields, data, file_field_name, filename, mime)

  local sink = {}
  local request = {
    method = "POST",
    url = url,
    headers = {
      ["Content-Type"] = "multipart/form-data; boundary=" .. boundary,
      ["Content-Length"] = tostring(#body),
    },
    source = ltn12.source.string(body),
    sink = ltn12.sink.table(sink),
  }

  logger.dbg("[KoInsight] callMultipart:", request.method, request.url)
  socketutil:set_timeout(socketutil.LARGE_BLOCK_TIMEOUT, socketutil.LARGE_TOTAL_TIMEOUT)
  local code, resp_headers, status = socket.skip(1, http.request(request))
  socketutil:reset_timeout()

  if resp_headers == nil then
    logger.err("[KoInsight] callMultipart: network error", status or code)
    return false, "network_error"
  end

  if code == 200 then
    local content = table.concat(sink)
    if content == nil or content == "" or string.sub(content, 1, 1) ~= "{" then
      logger.err("[KoInsight] callMultipart: invalid JSON response", content)
      return false, "empty_response"
    end
    local ok, result = pcall(JSON.decode, content)
    if ok and result then
      return true, result
    end
    logger.err("[KoInsight] callMultipart: JSON decode failed", content)
    return false, "invalid_response"
  end

  if not quiet then
    logger.err("[KoInsight] callMultipart: HTTP error", status or code)
    UIManager:show(InfoMessage:new({
      text = _("Could not upload cover."),
    }))
  end
  return false, "http_error", code
end
