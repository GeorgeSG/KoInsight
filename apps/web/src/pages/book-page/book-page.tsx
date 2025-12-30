import {
  Badge,
  Box,
  Flex,
  Group,
  Loader,
  Paper,
  RingProgress,
  Stack,
  Tabs,
  Text,
} from '@mantine/core';
import { IconCalendar, IconHighlight, IconPhoto, IconSettings, IconTable } from '@tabler/icons-react';
import { sum } from 'ramda';
import { JSX } from 'react';
import { useParams } from 'react-router';
import { useBookWithData } from '../../api/use-book-with-data';
import { formatSecondsToHumanReadable } from '../../utils/dates';
import { BookCard } from './book-card';
import { BookPageAnnotations } from './book-page-annotations';
import { BookPageCalendar } from './book-page-calendar';
import { BookPageCoverSelector } from './book-page-cover-selector';
import { BookPageManage } from './book-page-manage/book-page-manage';
import { BookPageRaw } from './book-page-raw';

export function BookPage(): JSX.Element {
  const { id } = useParams() as { id: string };
  const { data: book, isLoading } = useBookWithData(Number(id));

  const avgPerDay = book ? book.total_read_time / Object.keys(book.read_per_day).length : 0;

  const bookPages =
    book?.reference_pages ||
    book?.device_data.reduce((acc, device) => Math.max(acc, device.pages), 0) ||
    0;

  if (isLoading || !book) {
    return (
      <Flex justify="center" align="center" h="100%">
        <Loader />
      </Flex>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" gap="md">
        <BookCard book={book} />
        <Paper withBorder p="md" radius="md">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            Reading progress
          </Text>
          <Group align="center" justify="center" h="100%">
            <div>
              <RingProgress
                label={
                  <Text size="xs" ta="center">
                    {book.unique_read_pages} / {bookPages}
                  </Text>
                }
                sections={[
                  {
                    value: (book.unique_read_pages / bookPages) * 100,
                    color: 'koinsight',
                  },
                ]}
                w="100%"
              />
            </div>
            <Stack align="flex-start" gap={5}>
              <Text>Total read time: {formatSecondsToHumanReadable(book.total_read_time)}</Text>
              <Text>Average time per day: {formatSecondsToHumanReadable(avgPerDay)}</Text>
              <Text>Days reading: {Object.keys(book.read_per_day).length}</Text>
              <Text>
                Average time per page flip:{' '}
                {Math.round(sum(book.stats.map((p) => p.duration)) / book.stats.length)}s
              </Text>
            </Stack>
          </Group>
        </Paper>
      </Group>

      <Flex gap="xs">
        {book.genres?.map((genre) => (
          <Badge radius="sm" variant="outline" key={genre.id}>
            {genre.name}
          </Badge>
        ))}
      </Flex>

      <Tabs defaultValue="calendar">
        <Tabs.List>
          <Tabs.Tab value="calendar" leftSection={<IconCalendar size={16} />}>
            Calendar
          </Tabs.Tab>
          <Tabs.Tab value="annotations" leftSection={<IconHighlight size={16} />}>
            Annotations
          </Tabs.Tab>
          <Tabs.Tab value="raw-values" leftSection={<IconTable size={16} />}>
            Raw Values
          </Tabs.Tab>
          <Tabs.Tab value="cover-selector" leftSection={<IconPhoto size={16} />}>
            Cover Selector
          </Tabs.Tab>
          <Tabs.Tab value="manage" leftSection={<IconSettings size={16} />}>
            Manage data
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="calendar">
          <Box py={20}>
            <BookPageCalendar book={book} />
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="annotations">
          <Box py={20}>
            <BookPageAnnotations book={book} />
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="raw-values">
          <Box py={20}>
            <BookPageRaw book={book} />
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="cover-selector">
          <Box py={20}>
            <BookPageCoverSelector book={book} />
          </Box>
        </Tabs.Panel>
        <Tabs.Panel value="manage">
          <Box py={20}>
            <BookPageManage book={book} />
          </Box>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
