import { BookWithData, PageStat } from '@koinsight/common/types';
import { Flex, Switch } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import { startOfDay } from 'date-fns/startOfDay';
import { sum } from 'ramda';
import { JSX, useMemo, useState } from 'react';
import { Calendar, CalendarEvent } from '../../components/calendar/calendar';
import { getDuration, shortDuration } from '../../utils/dates';

type BookPageCalendarProps = {
  book: BookWithData;
};

type DayData = {
  events: PageStat[];
};

export function BookPageCalendar({ book }: BookPageCalendarProps): JSX.Element {
  const [hideEmpty, setHideEmpty] = useState(false);

  const calendarEvents = useMemo(() => {
    const grouped = book.stats.reduce<Record<string, CalendarEvent<DayData>>>((acc, event) => {
      const date = startOfDay(event.start_time);
      const key = date.toISOString();
      acc[key] = acc[key] || { date, data: { events: [] } };
      acc[key].data = acc[key]?.data?.events
        ? { events: [...acc[key].data.events, event] }
        : { events: [event] };

      return acc;
    }, {});

    if (!hideEmpty) {
      return grouped;
    }

    return Object.entries(grouped).reduce<Record<string, CalendarEvent<DayData>>>(
      (acc, [key, entry]) => {
        const total = sum(entry.data!.events.map((event) => event.duration));
        if (total >= 60) {
          acc[key] = entry;
        }
        return acc;
      },
      {}
    );
  }, [book.stats, hideEmpty]);

  return (
    <>
      <Flex justify="flex-end" mb="sm">
        <Switch
          label="Hide entries under a minute"
          checked={hideEmpty}
          onChange={(e) => setHideEmpty(e.currentTarget.checked)}
        />
      </Flex>
      <Calendar<DayData>
        events={calendarEvents}
        dayRenderer={(data) => (
          <>
            <IconClock size={14} />{' '}
            {shortDuration(getDuration(sum(data.events.map((event) => event.duration))))}
          </>
        )}
      />
    </>
  );
}
