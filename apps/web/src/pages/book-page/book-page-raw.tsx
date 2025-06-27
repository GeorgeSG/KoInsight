import { BookWithData, Device } from '@koinsight/common/types';
import { Flex, NumberInput, Table } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { endOfDay, formatDate, startOfDay } from 'date-fns';
import { apply } from 'ramda';
import { JSX, useMemo, useState } from 'react';
import { useDevices } from '../../api/devices';
import { formatSecondsToHumanReadable } from '../../utils/dates';

type BookPageRawProps = {
  book: BookWithData;
};

export function BookPageRaw({ book }: BookPageRawProps): JSX.Element {
  const { data: devices } = useDevices();

  const devicesById = useMemo(
    () =>
      devices.reduce(
        (acc, device) => {
          acc[device.id] = device;
          return acc;
        },
        {} as Record<string, Device>
      ),
    [devices]
  );

  const dates = book.stats.map((stat) => stat.start_time);
  const pages = book.stats.map((stat) => stat.page);
  const min = dates.length > 0 ? new Date(apply(Math.min, dates)) : new Date();
  const max = dates.length > 0 ? new Date(apply(Math.max, dates)) : new Date();
  const maxPage = apply(Math.max, pages);

  const [page, setPage] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(min);
  const [endDate, setEndDate] = useState(max);

  const visibleEvents = book.stats.filter(
    (stat) =>
      (!page || stat.page === page) &&
      stat.start_time >= startDate.getTime() &&
      stat.start_time <= endDate.getTime()
  );

  return (
    <Flex direction="column" gap={20}>
      <Flex gap={8}>
        <NumberInput
          label="Page Number"
          value={page ?? 0}
          onChange={(e) => setPage(Number(e))}
          max={maxPage}
          step={1}
        />
        <DateInput
          label="Start date"
          value={startDate}
          onChange={(e) => setStartDate(startOfDay(e!))}
          minDate={min}
          maxDate={endDate}
        />
        <DateInput
          label="End date"
          value={endDate}
          onChange={(e) => setEndDate(endOfDay(e!))}
          minDate={startDate}
          maxDate={max}
        />
      </Flex>
      <Table stickyHeader>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Page</Table.Th>
            <Table.Th>Start time</Table.Th>
            <Table.Th>Duration</Table.Th>
            <Table.Th>Total pages</Table.Th>
            <Table.Th>Device</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {visibleEvents.map((stat) => (
            <Table.Tr key={stat.start_time}>
              <Table.Td>{stat.page}</Table.Td>
              <Table.Td>{formatDate(stat.start_time, 'dd LLL yyyy, HH:mm:ss')}</Table.Td>
              <Table.Td>{formatSecondsToHumanReadable(stat.duration, false)}</Table.Td>
              <Table.Td>{stat.total_pages}</Table.Td>
              <Table.Td>{devicesById[stat.device_id]?.model ?? stat.device_id}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Flex>
  );
}
