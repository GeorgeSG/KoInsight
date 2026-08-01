local DataStorage = require("datastorage")
local DocSettings = require("docsettings")
local DocumentRegistry = require("document/documentregistry")
local logger = require("logger")
local lfs = require("libs/libkoreader-lfs")

local M = {}

local function ensure_cache_dir()
  local dir = DataStorage:getDataDir() .. "/cache"
  if lfs.attributes(dir, "mode") ~= "directory" then
    lfs.mkdir(dir)
  end
  return dir
end

--- Try CoverBrowser bookinfo cache (if module is available).
local function cover_bb_from_bookinfo(filepath)
  local ok, BookInfoManager = pcall(require, "bookinfomanager")
  if not ok or not BookInfoManager or not BookInfoManager.getBookInfo then
    return nil
  end
  local bookinfo = BookInfoManager:getBookInfo(filepath, true)
  if bookinfo and bookinfo.has_cover and bookinfo.cover_bb then
    return bookinfo.cover_bb
  end
  return nil
end

--- Open document and read cover page (same strategy as FileManagerBookInfo:getCoverImage, without custom UI).
local function cover_bb_from_document(filepath)
  local custom_cover = DocSettings:findCustomCoverFile(filepath)
  if custom_cover then
    local cover_doc = DocumentRegistry:openDocument(custom_cover)
    if cover_doc then
      local bb = cover_doc:getCoverPageImage()
      cover_doc:close()
      if bb then
        return bb
      end
    end
  end

  local doc = DocumentRegistry:openDocument(filepath)
  if not doc then
    return nil
  end
  if doc.loadDocument then
    doc:loadDocument(false)
  end
  local bb = doc:getCoverPageImage()
  doc:close()
  return bb
end

--- Extract cover to a temporary PNG under koreader/cache; caller should os.remove when done.
function M.extractCoverToTempPng(filepath)
  if not filepath then
    return nil
  end

  local bb = cover_bb_from_bookinfo(filepath)
  if not bb then
    bb = cover_bb_from_document(filepath)
  end
  if not bb then
    logger.warn("[KoInsight] No cover image for:", filepath)
    return nil
  end

  local dir = ensure_cache_dir()
  local tmp = string.format("%s/koinsight_cover_%s.png", dir, tostring(os.time()))
  local ok, err = pcall(function()
    bb:writePNG(tmp)
  end)
  bb:free()

  if not ok then
    logger.warn("[KoInsight] writePNG failed:", filepath, err)
    return nil
  end
  return tmp
end

return M
