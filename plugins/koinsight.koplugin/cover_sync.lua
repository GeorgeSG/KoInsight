local logger = require("logger")
local socket = require("socket")
local const = require("./const")
local call_multipart = require("call_multipart")
local cover_extract = require("cover_extract")
local cover_path_resolver = require("cover_path_resolver")

local M = {}

--- Upload covers for md5 values the server reported as missing (see POST /api/plugin/import).
function M.syncMissingCovers(server_url, missing_md5_list, quiet)
  if not server_url or server_url == "" then
    return
  end
  if type(missing_md5_list) ~= "table" or #missing_md5_list == 0 then
    return
  end

  local map = cover_path_resolver.buildMd5ToPathMap()
  for _, md5 in ipairs(missing_md5_list) do
    local path = map[md5]
    if not path then
      logger.warn(
        "[KoInsight] Cover sync skipped (open the book once so it appears in history):",
        md5
      )
    else
      local png_path = cover_extract.extractCoverToTempPng(path)
      if png_path then
        local upload_url = server_url .. "/api/plugin/books/" .. md5 .. "/cover"
        local ok, err = call_multipart(
          upload_url,
          { version = const.VERSION },
          png_path,
          "file",
          "cover.png",
          "image/png",
          quiet
        )
        os.remove(png_path)
        if not ok then
          logger.warn("[KoInsight] Cover upload failed:", md5, err)
        else
          logger.info("[KoInsight] Cover uploaded:", md5)
        end
      end
    end
    socket.sleep(0.15)
  end
end

return M
