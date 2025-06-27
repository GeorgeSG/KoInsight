import { BookWithData, PageStat } from '@koinsight/common/types';
import { IconClock } from '@tabler/icons-react';
import { startOfDay } from 'date-fns/startOfDay';
import { sum } from 'ramda';
import { JSX } from 'react';
import { Calendar, CalendarEvent } from '../../components/calendar/calendar';
import { getDuration, shortDuration } from '../../utils/dates';

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
      dayRenderer={(data) => (
        <>
          <IconClock size={14} />{' '}
          {shortDuration(getDuration(sum(data.events.map((event) => event.duration))))}
        </>
      )}
    />
  );
}
