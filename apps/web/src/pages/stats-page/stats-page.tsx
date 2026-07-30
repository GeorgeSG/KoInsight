import { Book } from '@koinsight/common/types/book';
import { BarChart } from '@mantine/charts';
import {
  Box,
  Flex,
  Loader,
  Text,
  Title,
  useComputedColorScheme,
  useMantineTheme,
} from '@mantine/core';
import {
  IconFiles,
  IconFileStar,
  IconClock,
  IconClockStar,
  IconFlame,
  IconTrophy,
} from '@tabler/icons-react';
import { format, startOfDay } from 'date-fns';
import { JSX, useMemo } from 'react';
import { BarProps } from 'recharts';
import { useBooks } from '../../api/books';
import { usePageStats } from '../../api/use-page-stats';
import { CustomBar } from '../../components/charts/custom-bar';
import { ReadingCalendar } from '../../components/statistics/reading-calendar';
import { Statistics } from '../../components/statistics/statistics';
import { formatSecondsToHumanReadable } from '../../utils/dates';
import { WeekStats } from './week-stats';

export function StatsPage(): JSX.Element {
  const colorScheme = useComputedColorScheme();
  const { colors } = useMantineTheme();
  const { data: books, isLoading: booksLoading } = useBooks();

  const {
    data: {
      stats,
      perMonth,
      perDayOfTheWeek,
      mostPagesInADay,
      totalReadingTime,
      longestDay,
      last7DaysReadTime,
      currentDailyReadingStreak,
      longestDailyReadingStreak,
      totalPagesRead,
    },
    isLoading: statsLoading,
  } = usePageStats();

  const booksByMd5 = useMemo(() => {
    return books?.reduce(
      (acc, book) => {
        acc[book.md5] = book;
        return acc;
      },
      {} as Record<string, Book>
    );
  }, [books]);

  const formatStreakDays = (value: number) => `${value} day${value === 1 ? '' : 's'}`;
  const formatLocalizedNumber = (value: number) => new Intl.NumberFormat().format(value);

  const formatStatDate = (dayTimestamp?: number) =>
    dayTimestamp ? format(dayTimestamp, 'MMM d, yyyy') : 'No reading data yet';

  const { longestDayTimestamp, mostPagesDayTimestamp, longestStreakRange } = useMemo(() => {
    if (!stats?.length) {
      return {
        longestDayTimestamp: undefined,
        mostPagesDayTimestamp: undefined,
        longestStreakRange: undefined,
      };
    }

    const durationPerDay = new Map<number, number>();
    const pagesPerDay = new Map<number, number>();

    for (const stat of stats) {
      const dayStart = startOfDay(stat.start_time).getTime();
      durationPerDay.set(dayStart, (durationPerDay.get(dayStart) ?? 0) + stat.duration);

      const referencePages = booksByMd5?.[stat.book_md5]?.reference_pages;
      const pagesForStat = stat.total_pages && referencePages ? (1 / stat.total_pages) * referencePages : 1;
      pagesPerDay.set(dayStart, (pagesPerDay.get(dayStart) ?? 0) + pagesForStat);
    }

    let longestDayEntry: [number, number] | undefined;
    for (const entry of durationPerDay.entries()) {
      if (!longestDayEntry || entry[1] > longestDayEntry[1]) {
        longestDayEntry = entry;
      }
    }

    let mostPagesEntry: [number, number] | undefined;
    for (const entry of pagesPerDay.entries()) {
      if (!mostPagesEntry || entry[1] > mostPagesEntry[1]) {
        mostPagesEntry = entry;
      }
    }

    const uniqueDays = Array.from(durationPerDay.keys()).sort((a, b) => a - b);

    let bestStart = uniqueDays[0];
    let bestEnd = uniqueDays[0];
    let bestLength = 1;

    let currentStart = uniqueDays[0];
    let currentEnd = uniqueDays[0];
    let currentLength = 1;

    for (let i = 1; i < uniqueDays.length; i += 1) {
      const currentDay = uniqueDays[i];
      const previousDay = uniqueDays[i - 1];
      const isConsecutive = currentDay - previousDay === 24 * 60 * 60 * 1000;

      if (isConsecutive) {
        currentEnd = currentDay;
        currentLength += 1;
      } else {
        if (currentLength > bestLength) {
          bestStart = currentStart;
          bestEnd = currentEnd;
          bestLength = currentLength;
        }

        currentStart = currentDay;
        currentEnd = currentDay;
        currentLength = 1;
      }
    }

    if (currentLength > bestLength) {
      bestStart = currentStart;
      bestEnd = currentEnd;
    }

    return {
      longestDayTimestamp: longestDayEntry?.[0],
      mostPagesDayTimestamp: mostPagesEntry?.[0],
      longestStreakRange: `${format(bestStart, 'MMM d, yyyy')} - ${format(bestEnd, 'MMM d, yyyy')}`,
    };
  }, [stats, booksByMd5]);

  if (booksLoading || statsLoading) {
    return (
      <Flex justify="center" align="center" h="100%">
        <Loader />
      </Flex>
    );
  }

  return (
    <>
      <Title mb="sm">Reading statistics</Title>
      <Text
        mt={4}
        mb="md"
        style={{ display: 'inline' }}
        variant="gradient"
        gradient={{
          from: colorScheme === 'dark' ? 'violet.4' : 'violet.8',
          to: colorScheme === 'dark' ? 'koinsight.5' : 'koinsight.8',
          deg: 120,
        }}
        fw={900}
      >
        {last7DaysReadTime > 0 ? (
          <>You read for {formatSecondsToHumanReadable(last7DaysReadTime)} this week. Keep it up!</>
        ) : (
          <>You haven't read this week yet. No better time to start!</>
        )}
      </Text>
      <Box my="xl">
        <Statistics
          data={[
            {
              label: 'Total read time',
              value: formatSecondsToHumanReadable(totalReadingTime),
              icon: IconClock,
            },
            {
              label: 'Total pages read',
              value: formatLocalizedNumber(totalPagesRead),
              icon: IconFiles,
            },
            {
              label: 'Longest time reading in a day',
              value: formatSecondsToHumanReadable(longestDay),
              detail: formatStatDate(longestDayTimestamp),
              icon: IconClockStar,
            },
            {
              label: 'Most pages in a day',
              value:
                mostPagesInADay !== null && mostPagesInADay !== undefined
                  ? formatLocalizedNumber(mostPagesInADay)
                  : 'N/A',
              detail: formatStatDate(mostPagesDayTimestamp),
              icon: IconFileStar,
            },
            {
              label: 'Current Daily Reading Streak',
              value: formatStreakDays(currentDailyReadingStreak),
              icon: IconFlame,
            },
            {
              label: 'Longest Daily Reading Streak',
              value: formatStreakDays(longestDailyReadingStreak),
              detail: longestStreakRange ?? 'N/A',
              icon: IconTrophy,
            },
          ]}
        />
      </Box>
      <Title mb="xl" order={3}>
        Reading history
      </Title>
      <Box mb="xl">
        <ReadingCalendar />
      </Box>
      <Title mt="xl" mb={4} order={3}>
        Weekly stats
      </Title>
      <WeekStats stats={stats} booksByMd5={booksByMd5} />
      <Title mt="xl" order={3}>
        Per day of the week
      </Title>
      <BarChart
        h={300}
        data={perDayOfTheWeek}
        dataKey="name"
        series={[
          {
            name: 'value',
            label: 'Reading time',
            color: colorScheme === 'dark' ? 'koinsight.7' : 'koinsight.1',
          },
        ]}
        gridAxis="none"
        withYAxis={false}
        barProps={{
          maxBarSize: 100,
          shape: (props: BarProps) => (
            <CustomBar
              {...props}
              accent={colorScheme === 'dark' ? colors.koinsight[2] : colors.koinsight[8]}
            />
          ),
        }}
        valueFormatter={(value) => formatSecondsToHumanReadable(value)}
      />
      <Title mt="xl" order={3}>
        Monthly reading time
      </Title>
      <BarChart
        h={300}
        mt="sm"
        data={perMonth}
        dataKey="month"
        gridAxis="none"
        withYAxis={false}
        barProps={{
          maxBarSize: 100,
          shape: (props: BarProps) => (
            <CustomBar
              {...props}
              accent={colorScheme === 'dark' ? colors.violet[2] : colors.violet[8]}
            />
          ),
        }}
        valueFormatter={(value) => formatSecondsToHumanReadable(value)}
        series={[
          {
            name: 'duration',
            label: 'Reading time',
            color: colorScheme === 'dark' ? 'violet.7' : 'violet.1',
          },
        ]}
      />
    </>
  );
}
