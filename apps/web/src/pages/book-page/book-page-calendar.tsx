import { BookWithData, PageStat } from '@koinsight/common/types';
import { startOfDay } from 'date-fns/startOfDay';
import { JSX } from 'react';
import { Calendar, CalendarEvent } from '../../components/calendar/calendar';
import { CalendarBookDay } from '../../components/calendar/calendar-book-day';

type BookPageCalendarProps = {
  book: BookWithData;
};

type DayData = {
  events: PageStat[];
};

export function BookPageCalendar({ book }: BookPageCalendarProps): JSX.Element {
  const calendarEvents = book.stats.reduce<Record<string, CalendarEvent<DayData>>>((acc, event) => {
    const date = startOfDay(event.start_time);
    const key = date.toISOString();
    acc[key] = acc[key] || { date, data: { events: [] } };
    acc[key].data = acc[key]?.data?.events
      ? { events: [...acc[key].data.events, event] }
      : { events: [event] };

    return acc;
  }, {});

  return (
    <Calendar<DayData>
      events={calendarEvents}
      dayRenderer={(data) => <CalendarBookDay book={book} data={data} />}
    />
  );
}
