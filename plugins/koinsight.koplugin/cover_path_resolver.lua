local ReadHistory = require("readhistory")
local logger = require("logger")
local lfs = require("libs/libkoreader-lfs")
local util = require("util")

local M = {}

--- Build partial_md5 -> absolute filepath using reading history (existing files only).
function M.buildMd5ToPathMap()
  ReadHistory:_read(true)
  local map = {}
  for _, item in ipairs(ReadHistory.hist) do
    local fp = item.file
    if fp and lfs.attributes(fp, "mode") == "file" then
      local md5 = util.partialMD5(fp)
      if md5 then
        if map[md5] and map[md5] ~= fp then
          logger.dbg("[KoInsight] Duplicate partial md5 in history; keeping first path:", md5)
        elseif not map[md5] then
          map[md5] = fp
        end
      end
    end
  end
  return map
end

return M
