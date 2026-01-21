import { BookWithData } from '@koinsight/common/types';
import {
  Badge,
  Box,
  Flex,
  Group,
  Loader,
  Menu,
  Paper,
  RingProgress,
  Stack,
  Tabs,
  Text,
  UnstyledButton,
} from '@mantine/core';
import {
  IconCalendar,
  IconChevronDown,
  IconClock,
  IconClockHour4,
  IconFile,
  IconHighlight,
  IconRefresh,
  IconSettings,
  IconTable,
} from '@tabler/icons-react';
import { sum } from 'ramda';
import { JSX, useState } from 'react';
import { useParams } from 'react-router';
import { useBookWithData } from '../../api/use-book-with-data';
import { formatSecondsToHumanReadable } from '../../utils/dates';
import { BookCard } from './book-card';
import { BookPageAnnotations } from './book-page-annotations';
import { BookPageCalendar } from './book-page-calendar';
import { BookPageManage } from './book-page-manage/book-page-manage';
import { BookPageRaw } from './book-page-raw';

export function BookPage(): JSX.Element {
  const { id } = useParams() as { id: string };
  const { data: book, isLoading, mutate } = useBookWithData(Number(id));

  const [tabValue, setTabValue] = useState<string | null>('calendar');

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
        <StatsCard book={book} />
      </Group>

      <Group gap="xs">
        {book.genres?.map((genre) => (
          <Badge radius="sm" variant="outline" key={genre.id}>
            {genre.name}
          </Badge>
        ))}
      </Group>

      <Tabs value={tabValue} onChange={(value) => setTabValue(value)}>
        <Tabs.List style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Flex>
            <Tabs.Tab value="calendar" leftSection={<IconCalendar size={16} />}>
              Calendar
            </Tabs.Tab>
            <Tabs.Tab value="annotations" leftSection={<IconHighlight size={16} />}>
              <Flex align="center" gap="xs">
                Annotations{' '}
                {book.annotations.length > 0 && (
                  <Badge color="gray" size="xs">
                    {book.annotations.length}
                  </Badge>
                )}
              </Flex>
            </Tabs.Tab>
            <Tabs.Tab value="manage" leftSection={<IconSettings size={16} />}>
              Manage data
            </Tabs.Tab>
            {tabValue === 'raw-values' && (
              <Tabs.Tab value="raw-values" leftSection={<IconTable size={16} />}>
                Raw Values
              </Tabs.Tab>
            )}
          </Flex>
          <Menu position="bottom-end" withArrow>
            <Menu.Target>
              <UnstyledButton
                fz={13}
                px="md"
                py="xs"
                style={{ transition: 'background-color 100ms ease' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--tab-hover-color)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '';
                }}
              >
                <Flex align="center" gap="xs">
                  <span>Advanced</span>
                  <IconChevronDown size={16} />
                </Flex>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconTable size={16} />}
                onClick={() => setTabValue('raw-values')}
              >
                Raw Values
              </Menu.Item>
              <Menu.Item leftSection={<IconRefresh size={16} />} onClick={() => mutate()}>
                Reload book data
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
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

        <Tabs.Panel value="manage">
          <Box py={20}>
            <BookPageManage book={book} />
          </Box>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

function StatsCard({ book }: { book: BookWithData }): JSX.Element {
  const bookPages =
    book?.reference_pages ||
    book?.device_data.reduce((acc, device) => Math.max(acc, device.pages), 0) ||
    0;

  const avgPerDay = book ? book.total_read_time / Object.keys(book.read_per_day).length : 0;

  return (
    <Paper
      withBorder
      px="lg"
      py="md"
      radius="md"
      style={{
        background:
          'linear-gradient(135deg, var(--mantine-color-default) 0%, var(--mantine-color-body) 100%)',
      }}
    >
      <Stack gap={0} align="center">
        <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
          Reading progress
        </Text>
        <Group align="center" justify="space-between" wrap="nowrap">
          <Stack align="center" gap="xs">
            <RingProgress
              size={180}
              thickness={9}
              roundCaps
              label={
                <Stack gap={0} align="center">
                  <Text size="xl" fw={700} ta="center">
                    {Math.round((book.unique_read_pages / bookPages) * 100)}%
                  </Text>
                  <Text size="xs" c="dimmed" ta="center" fw="bold">
                    {book.unique_read_pages} / {bookPages} <br /> pages read
                  </Text>
                </Stack>
              }
              sections={[
                {
                  value: (book.unique_read_pages / bookPages) * 100,
                  color: 'koinsight',
                },
              ]}
            />
          </Stack>

          <Stack gap="md" flex={1}>
            <Group gap="sm" wrap="nowrap">
              <IconClock size={18} style={{ flexShrink: 0, opacity: 0.6 }} />
              <Stack gap={0}>
                <Text fz={11} c="dimmed" lh={1.2} tt="uppercase" fw="bold">
                  Total read time
                </Text>
                <Text size="md" fw={600}>
                  {formatSecondsToHumanReadable(book.total_read_time)}
                </Text>
              </Stack>
            </Group>

            <Group gap="sm" wrap="nowrap">
              <IconClockHour4 size={18} style={{ flexShrink: 0, opacity: 0.6 }} />
              <Stack gap={0}>
                <Text fz={11} c="dimmed" lh={1.2} tt="uppercase" fw="bold">
                  Average per day
                </Text>
                <Text size="md" fw={600}>
                  {formatSecondsToHumanReadable(avgPerDay)}
                </Text>
              </Stack>
            </Group>
          </Stack>

          <Stack gap="md" flex={1}>
            <Group gap="sm" wrap="nowrap">
              <IconCalendar size={18} style={{ flexShrink: 0, opacity: 0.6 }} />
              <Stack gap={0}>
                <Text fz={11} c="dimmed" lh={1.2} tt="uppercase" fw="bold">
                  Days reading
                </Text>
                <Text size="md" fw={600}>
                  {Object.keys(book.read_per_day).length}
                </Text>
              </Stack>
            </Group>

            <Group gap="sm" wrap="nowrap">
              <IconFile size={18} style={{ flexShrink: 0, opacity: 0.6 }} />
              <Stack gap={0}>
                <Text fz={11} c="dimmed" lh={1.2} tt="uppercase" fw="bold">
                  Avg time per page
                </Text>
                <Text size="md" fw={600}>
                  {book.stats.length > 0
                    ? Math.round(sum(book.stats.map((p) => p.duration)) / book.stats.length)
                    : 0}
                  s
                </Text>
              </Stack>
            </Group>
          </Stack>
        </Group>
      </Stack>
    </Paper>
  );
}
