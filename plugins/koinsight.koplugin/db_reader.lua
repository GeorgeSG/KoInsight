local SQ3 = require("lua-ljsqlite3/init")
local DataStorage = require("datastorage")
local logger = require("logger")

local db_location = DataStorage:getSettingsDir() .. "/statistics.sqlite3"

local KoInsightDbReader = {}

-- Get the current page count from the currently opened document
-- This is more accurate than the statistics database which may be stale
function KoInsightDbReader.getCurrentDocumentPages(book_md5)
  local ReaderUI = require("apps/reader/readerui")
  local ui = ReaderUI.instance

  if not (ui and ui.document) then
    return nil
  end

  -- Get the MD5 of the currently opened document by looking up title in DB
  -- This matches the approach used in annotation_reader.lua
  local doc_props = ui.document:getProps()
  if not (doc_props and doc_props.title) then
    return nil
  end

  -- Look up MD5 by title in statistics database
  local conn = SQ3.open(db_location)

  -- Escape single quotes in title for SQL
  local safe_title = doc_props.title:gsub("'", "''")
  local query = string.format("SELECT md5 FROM book WHERE title = '%s'", safe_title)

  local result, rows = conn:exec(query)
  conn:close()

  if rows > 0 and result[1] and result[1][1] then
    local current_md5 = result[1][1]

    -- Only return page count if this is the book we're asking about
    if current_md5 == book_md5 then
      local page_count = ui.document:getPageCount()
      logger.info(
        string.format(
          "[KoInsight] Using live page count for book %s: %d",
          doc_props.title,
          page_count
        )
      )
      return page_count
    end
  end

  return nil
end

function KoInsightDbReader.bookData()
  local conn = SQ3.open(db_location)
  local result, rows = conn:exec("SELECT * FROM book")
  local books = {}

  for i = 1, rows do
    local book_md5 = result[10][i]
    local db_pages = tonumber(result[7][i])

    -- Try to get current page count from opened document
    -- Falls back to database value if book is not currently open
    local current_pages = KoInsightDbReader.getCurrentDocumentPages(book_md5)
    local pages = current_pages or db_pages

    -- Log if we're using live data vs stale database data
    if current_pages and current_pages ~= db_pages then
      logger.info(
        string.format(
          "[KoInsight] Using live page count for book %s: %d (DB has: %d)",
          result[2][i],
          current_pages,
          db_pages
        )
      )
    end

    local book = {
      id = tonumber(result[1][i]),
      title = result[2][i],
      authors = result[3][i],
      notes = tonumber(result[4][i]),
      last_open = tonumber(result[5][i]),
      highlights = tonumber(result[6][i]),
      pages = pages, -- Use live count if available, otherwise DB value
      series = result[8][i],
      language = result[9][i],
      md5 = book_md5,
      total_read_time = tonumber(result[11][i]),
      total_read_pages = tonumber(result[12][i]),
    }
    table.insert(books, book)
  end

  conn:close()
  return books
end

function get_md5_by_id(books, target_id)
  for _, book in ipairs(books) do
    if book.id == target_id then
      return book.md5
    end
  end
  return nil
end

function KoInsightDbReader.progressData()
  local conn = SQ3.open(db_location)
  local result, rows = conn:exec("SELECT * FROM page_stat_data")
  local results = {}

  local book_data = KoInsightDbReader.bookData()

  local device_id = G_reader_settings:readSetting("device_id")

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

  conn:close()
  return results
end

return KoInsightDbReader
