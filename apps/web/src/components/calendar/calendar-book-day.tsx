import { BookWithData, PageStat } from '@koinsight/common/types';
import { Tooltip } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import { sum } from 'ramda';
import { JSX } from 'react';
import { getReferencePageRange, Range } from '../../utils/book-progress';
import { getDuration, shortDuration } from '../../utils/dates';

type CalendarBookDayProps = {
  book: BookWithData;
  data: {
    events: PageStat[];
  };
};

function formatRange(range: Range): string {
  const start = Math.round(range[0]);
  const end = Math.round(range[1]);
  return `${start} - ${end} (${end - start} pages)`;
}

export function CalendarBookDay({ book, data }: CalendarBookDayProps): JSX.Element {
  const [start, end] = getReferencePageRange(book, data.events);
  const duration = getDuration(sum(data.events.map((event) => event.duration)));

  return (
    <Tooltip label={`Pages read: ${formatRange([start, end])}`}>
      <span>
        <IconClock size={14} /> {shortDuration(duration)}
      </span>
    </Tooltip>
  );
}
