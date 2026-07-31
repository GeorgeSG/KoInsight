import { PageStat } from '@koinsight/common/types';
import { Book } from '@koinsight/common/types/book';
import { Anchor, Flex, Loader, Title } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import { endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek } from 'date-fns';
import { sum, uniq } from 'ramda';
import { JSX, useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useBooks } from '../api/books';
import { usePageStats } from '../api/use-page-stats';
import { Calendar, CalendarEvent } from '../components/calendar/calendar';
import { getBookPath } from '../routes';
import { getDuration, shortDuration } from '../utils/dates';

type DayData = {
  events: PageStat[];
};

type DateRange = {
  start: number;
  end: number;
};

function getCalendarDateRange(date: Date): DateRange {
  return {
    start: startOfWeek(startOfMonth(date), { locale: { options: { weekStartsOn: 1 } } }).getTime(),
    end: endOfWeek(endOfMonth(date), { locale: { options: { weekStartsOn: 1 } } }).getTime(),
  };
}

export function CalendarPage(): JSX.Element {
  const { data: books, isLoading } = useBooks();
  const [dateRange, setDateRange] = useState<DateRange>(() => getCalendarDateRange(new Date()));
  const { data: events } = usePageStats(dateRange);

  const calendarEvents = useMemo<Record<string, CalendarEvent<DayData>>>(() => {
    const eventsList = events.reduce<Record<string, CalendarEvent<DayData>>>((acc, event) => {
      const date = startOfDay(event.start_time);
      const key = date.toISOString();

      acc[key] = {
        date,
        data: acc[key]?.data?.events
          ? { events: [...acc[key].data.events, event] }
          : { events: [event] },
      };

      return acc;
    }, {});

    return eventsList;
  }, [events]);

  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange((currentRange) =>
      currentRange.start === range.start && currentRange.end === range.end ? currentRange : range
    );
  }, []);

  const getBookByMd5 = useCallback(
    (md5: Book['md5']) => books?.find((book) => book.md5 === md5),
    [books]
  );

  const getBookNames = useCallback(
    (data: DayData) => {
      const uniqueBookMd5s = uniq(data.events.map(({ book_md5 }) => book_md5));
      const eventBooks = uniqueBookMd5s.map((id) => getBookByMd5(id)).filter(Boolean) as Book[];

      return eventBooks.map((book) => (
        <>
          <Anchor key={book.id} component={Link} to={getBookPath(book.id)}>
            {book.title}
          </Anchor>
          <br />
          <IconClock size={14} />{' '}
          {shortDuration(
            getDuration(
              sum(
                data.events
                  .filter((event) => event.book_md5 === book.md5)
                  .map((event) => event.duration)
              )
            )
          )}
          <br />
        </>
      ));
    },
    [getBookByMd5]
  );

  if (isLoading || !books) {
    return (
      <Flex justify="center" align="center" h="100%">
        <Loader />
      </Flex>
    );
  }

  return (
    <>
      <Title mb="xl">Calendar</Title>
      <Calendar<DayData>
        events={calendarEvents}
        dayRenderer={(data) => getBookNames(data).map((el) => <div>{el}</div>)}
        onDateRangeChange={handleDateRangeChange}
      />
    </>
  );
}