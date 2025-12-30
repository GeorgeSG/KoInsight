local DocSettings = require("docsettings")
local logger = require("logger")

local KoInsightAnnotationReader = {}

-- Get the currently opened document
function KoInsightAnnotationReader.getCurrentDocument()
  local ReaderUI = require("apps/reader/readerui")
  local ui = ReaderUI.instance

  if ui and ui.document and ui.document.file then
    return ui.document.file
  end

  return nil
end

-- Get the MD5 hash for the currently open document
function KoInsightAnnotationReader.getCurrentBookMd5()
  local current_doc = KoInsightAnnotationReader.getCurrentDocument()
  if not current_doc then
    return nil
  end

  -- Get document info from ReaderUI
  local ReaderUI = require("apps/reader/readerui")
  local ui = ReaderUI.instance

  if ui and ui.document and ui.document.info then
    local doc_props = ui.document:getProps()
    if doc_props and doc_props.title then
      -- Try to find book by title in statistics database
      local SQ3 = require("lua-ljsqlite3/init")
      local DataStorage = require("datastorage")
      local db_location = DataStorage:getSettingsDir() .. "/statistics.sqlite3"

      local conn = SQ3.open(db_location)

      -- Escape single quotes in title for SQL
      local safe_title = doc_props.title:gsub("'", "''")
      local query = string.format("SELECT md5 FROM book WHERE title = '%s'", safe_title)

      logger.dbg("[KoInsight] Looking for book with title:", doc_props.title)

      local result, rows = conn:exec(query)
      conn:close()

      if rows > 0 and result[1] and result[1][1] then
        local md5 = result[1][1]
        logger.info("[KoInsight] Found MD5 for current book:", md5)
        return md5
      else
        logger.warn("[KoInsight] Book not found in statistics database:", doc_props.title)
      end
    end
  end

  return nil
end

-- Get annotations for the currently opened book
function KoInsightAnnotationReader.getCurrentBookAnnotations()
  local current_doc = KoInsightAnnotationReader.getCurrentDocument()

  if not current_doc then
    logger.dbg("[KoInsight] No document currently open")
    return nil
  end

  logger.dbg("[KoInsight] Reading annotations for:", current_doc)

  -- Force flush any in-memory changes to disk before reading
  -- Otherwise changes are not reflected
  local ReaderUI = require("apps/reader/readerui")
  local ui = ReaderUI.instance
  if ui and ui.doc_settings then
    logger.dbg("[KoInsight] Flushing doc settings to disk")
    ui.doc_settings:flush()
  end

  local doc_settings = DocSettings:open(current_doc)
  if not doc_settings then
    logger.dbg("[KoInsight] No doc settings found for:", current_doc)
    return nil
  end

  local annotations = doc_settings:readSetting("annotations")
  if not annotations then
    logger.dbg("[KoInsight] No annotations found in doc settings")
    return nil
  end

  -- Get total pages from the current document
  -- We need this because we store the page number at time of creation of each annotation
  -- But this page number changes after a reflow. By also storing the total page number
  -- at time of creation, we can always calculate the page for any given total page number.
  -- This is similar to how stats are handled.
  local total_pages = nil
  if ui and ui.document then
    total_pages = ui.document:getPageCount()
    logger.dbg("[KoInsight] Document has", total_pages, "total pages")
  end

  logger.info("[KoInsight] Found", #annotations, "annotations for current book")
  return annotations, total_pages
end

-- Get annotations organized by book md5
function KoInsightAnnotationReader.getAnnotationsByBook()
  local annotations_by_book = {}

  -- For now, only get annotations from currently opened book
  -- TODO: check bulk-syncing possibilities
  local current_annotations, total_pages = KoInsightAnnotationReader.getCurrentBookAnnotations()

  if not current_annotations or #current_annotations == 0 then
    logger.dbg("[KoInsight] No annotations to sync")
    return annotations_by_book
  end

  -- Get the MD5 for the currently open book
  local book_md5 = KoInsightAnnotationReader.getCurrentBookMd5()

  if not book_md5 then
    logger.warn("[KoInsight] Could not determine MD5 for current book, skipping annotations")
    return annotations_by_book
  end

  -- Clean up annotations for JSON serialization
  local cleaned_annotations = {}
  for _, annotation in ipairs(current_annotations) do
    -- Only include fields that are needed
    local cleaned = {
      datetime = annotation.datetime,
      drawer = annotation.drawer,
      color = annotation.color,
      text = annotation.text,
      note = annotation.note,
      chapter = annotation.chapter,
      pageno = annotation.pageno,
      page = annotation.page,
      total_pages = total_pages, -- Add total pages at time of annotation
    }

    -- Include datetime_updated if it exists
    if annotation.datetime_updated then
      cleaned.datetime_updated = annotation.datetime_updated
    end

    -- Include position data for highlights (not bookmarks)
    if annotation.pos0 then
      cleaned.pos0 = annotation.pos0
    end
    if annotation.pos1 then
      cleaned.pos1 = annotation.pos1
    end

    table.insert(cleaned_annotations, cleaned)
  end

  annotations_by_book[book_md5] = cleaned_annotations
  logger.info("[KoInsight] Prepared", #cleaned_annotations, "annotations for book", book_md5)

  return annotations_by_book
end

return KoInsightAnnotationReader
