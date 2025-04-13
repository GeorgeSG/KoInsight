local SQ3 = require("lua-ljsqlite3/init")
local DataStorage = require("datastorage")
local logger = require("logger")

local db_location = DataStorage:getSettingsDir() .. "/statistics.sqlite3"

local KoInsightDbReader = {}

function KoInsightDbReader.bookData()
    local conn = SQ3.open(db_location)
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
            total_read_pages = tonumber(result[12][i])
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
            device_id = device_id
        })

        ::continue::
    end

    conn:close()
    return results
end

return KoInsightDbReader
