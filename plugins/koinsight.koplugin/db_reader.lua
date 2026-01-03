local SQ3 = require("lua-ljsqlite3/init")
local DataStorage = require("datastorage")
local LuaSettings = require("luasettings")
local logger = require("logger")
local lfs = require("libs/libkoreader-lfs")

local db_location = DataStorage:getSettingsDir() .. "/statistics.sqlite3"
local docsettings_dir = DataStorage:getDocSettingsDir()
local home_dir = DataStorage:getDataDir() -- Where KOReader is installed

-- Get user's configured home directory from KOReader settings
local user_home_dir = G_reader_settings:readSetting("home_dir")

-- Common library paths on different devices
local library_paths = {
  "/mnt/us/documents",      -- Kindle
  "/mnt/onboard",           -- Kobo
  "/storage/emulated/0",    -- Android
}

local KoInsightDbReader = {}

function KoInsightDbReader.bookData()
  local conn = SQ3.open(db_location)
  local ok, books_or_err = pcall(function()
    local result, rows = conn:exec("SELECT * FROM book")
    local books = {}

    for i = 1, rows do
      local book = {
        id = tonumber(result[1][i]),
        title = result[2][i],
        authors = result[3][i],
        notes = tonumber(result[4][i]),
        last_open = tonumber(result[5][i]),
        highlights = tonumber(result[6][i]),
        pages = tonumber(result[7][i]),
        series = result[8][i],
        language = result[9][i],
        md5 = result[10][i],
        total_read_time = tonumber(result[11][i]),
        total_read_pages = tonumber(result[12][i]),
      }
      table.insert(books, book)
    end

    return books
  end)
  conn:close()

  if not ok then
    logger.err("[KoInsight] Error reading book data:", books_or_err)
    return {}
  end
  return books_or_err
end

local function get_md5_by_id(books, target_id)
  for _, book in ipairs(books) do
    if book.id == target_id then
      return book.md5
    end
  end
  return nil
end

function KoInsightDbReader.progressData()
  local book_data = KoInsightDbReader.bookData()
  local device_id = G_reader_settings:readSetting("device_id")

  local conn = SQ3.open(db_location)
  local ok, results_or_err = pcall(function()
    local result, rows = conn:exec("SELECT * FROM page_stat_data")
    local results = {}

    for i = 1, rows do
      local book_id = tonumber(result[1][i])
      local book_md5 = get_md5_by_id(book_data, book_id)

      if book_md5 == nil then
        logger.warn("[KoInsight] Book MD5 not found in book data:" .. book_id)
        goto continue
      end

      table.insert(results, {
        page = tonumber(result[2][i]),
        start_time = tonumber(result[3][i]),
        duration = tonumber(result[4][i]),
        total_pages = tonumber(result[5][i]),
        book_md5 = book_md5,
        device_id = device_id,
      })

      ::continue::
    end

    return results
  end)
  conn:close()

  if not ok then
    logger.err("[KoInsight] Error reading progress data:", results_or_err)
    return {}
  end
  return results_or_err
end

-- Recursively scan a directory for .sdr folders containing metadata.lua
local function scanForSidecarFiles(dir, results)
  results = results or {}

  local ok, iter, dir_obj = pcall(lfs.dir, dir)
  if not ok then
    return results
  end

  for entry in iter, dir_obj do
    if entry ~= "." and entry ~= ".." then
      local full_path = dir .. "/" .. entry
      local mode = lfs.attributes(full_path, "mode")

      if mode == "directory" then
        if entry:match("%.sdr$") then
          -- This is a sidecar directory, look for metadata*.lua files
          local sdr_ok, sdr_iter, sdr_obj = pcall(lfs.dir, full_path)
          if sdr_ok then
            for sdr_entry in sdr_iter, sdr_obj do
              if sdr_entry:match("^metadata.*%.lua$") then
                table.insert(results, full_path .. "/" .. sdr_entry)
                break -- Only need one metadata file per sdr
              end
            end
          end
        else
          -- Recurse into subdirectory
          scanForSidecarFiles(full_path, results)
        end
      end
    end
  end

  return results
end

-- Read book statuses from sidecar files and return a mapping of md5 -> status
function KoInsightDbReader.getBookStatuses()
  local statuses = {}
  local sidecar_files = {}

  -- Build list of directories to scan (avoiding duplicates)
  local dirs_to_scan = {}
  local seen = {}

  local function add_dir(dir)
    if dir and dir ~= "" and not seen[dir] then
      seen[dir] = true
      table.insert(dirs_to_scan, dir)
    end
  end

  -- Add core directories
  add_dir(docsettings_dir)
  add_dir(home_dir)
  add_dir(user_home_dir)

  -- Add common library paths
  for _, path in ipairs(library_paths) do
    add_dir(path)
  end

  for _, dir in ipairs(dirs_to_scan) do
    logger.info("[KoInsight] Scanning for sidecar files in:", dir)
    scanForSidecarFiles(dir, sidecar_files)
  end

  logger.info("[KoInsight] Found", #sidecar_files, "sidecar files total")

  for _, metadata_path in ipairs(sidecar_files) do
    logger.dbg("[KoInsight] Reading metadata from:", metadata_path)
    local ok, settings = pcall(function()
      return LuaSettings:open(metadata_path)
    end)

    if ok and settings then
      -- Get the MD5 checksum (stored at root level as partial_md5_checksum)
      local md5 = settings:readSetting("partial_md5_checksum")
      local summary = settings:readSetting("summary")

      logger.dbg("[KoInsight] partial_md5_checksum:", md5 or "nil")
      logger.dbg("[KoInsight] summary:", summary and "found" or "nil")

      if md5 then
        if summary and summary.status then
          local status = summary.status

          -- Normalize status values
          if status == "complete" or status == "completed" then
            status = "complete"
          elseif status == "on hold" then
            status = "on_hold"
          end

          statuses[md5] = status
          logger.info("[KoInsight] Found status for", md5, ":", status)
        else
          logger.dbg("[KoInsight] No status set for book:", md5)
        end
      end
    else
      logger.warn("[KoInsight] Failed to read metadata:", metadata_path)
    end
  end

  -- Count table entries (# doesn't work for tables with string keys)
  local count = 0
  for _ in pairs(statuses) do
    count = count + 1
  end
  logger.info("[KoInsight] Loaded statuses for", count, "books")
  return statuses
end

return KoInsightDbReader
