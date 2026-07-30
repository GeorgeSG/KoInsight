import {
  Book,
  BookWithData,
  DailyReadingStreak,
  ReadingDayStat,
  ReadingPageStat,
  PageStat,
  PerDayOfTheWeek,
  PerMonthReadingTime,
} from '@koinsight/common/types';
import { differenceInCalendarDays, format, startOfDay, subDays } from 'date-fns';
import { groupBy, sum } from 'ramda';

export class StatsService {
  static getPerMonthReadingTime(stats: PageStat[]): PerMonthReadingTime[] {
    const perMonth = (stats ?? [])
      .reduce<PerMonthReadingTime[]>((acc, stat) => {
        const month = format(stat.start_time, 'MMMM yyyy');
        const monthData = acc.find((item) => item.month === month);
        if (monthData) {
          monthData.duration += stat.duration;
        } else {
          acc.push({ month, duration: stat.duration, date: stat.start_time });
        }

        return acc;
      }, [])
      .sort((a, b) => a.date - b.date);

    return perMonth;
  }

  static perDayOfTheWeek(stats: PageStat[]): PerDayOfTheWeek[] {
    return stats
      .reduce((acc, stat) => {
        const day = format(stat.start_time, 'EEEE');
        const existingDay = acc.find((d) => d.name === day);
        if (existingDay) {
          existingDay.value += stat.duration;
        } else {
          acc.push({
            name: day,
            value: stat.duration,
            day: new Date(stat.start_time).getUTCDay(),
          });
        }
        return acc;
      }, [] as PerDayOfTheWeek[])
      .sort((a, b) => a.day - b.day);
  }

  static mostPagesInADay(books: Book[], stats: PageStat[]): ReadingPageStat {
    const pagesPerDay = this.getPagesPerDayEntries(stats, books);
    const maxPagesDay = pagesPerDay.reduce<[number, number] | undefined>((max, entry) => {
      if (!max || entry[1] > max[1]) {
        return entry;
      }

      return max;
    }, undefined);

    if (!maxPagesDay) {
      return { pages: 0 };
    }

    return {
      pages: Math.max(0, Math.round(maxPagesDay[1])),
      timestamp: maxPagesDay[0],
    };
  }

  static totalReadingTime(stats: PageStat[]) {
    return sum((stats ?? []).map((s) => s.duration));
  }

  static longestDay(stats: PageStat[]): ReadingDayStat {
    const timePerDay = this.getTimePerDay(stats);
    const longestDayEntry = Object.entries(timePerDay).reduce<[number, number] | undefined>(
      (max, [day, duration]) => {
        if (!max || duration > max[1]) {
          return [Number(day), duration];
        }

        return max;
      },
      undefined
    );

    if (!longestDayEntry) {
      return { duration: 0 };
    }

    return {
      duration: Math.max(0, longestDayEntry[1]),
      timestamp: longestDayEntry[0],
    };
  }

  static last7DaysReadTime(stats: PageStat[]) {
    const sevenDaysAgo = subDays(new Date(), 7);
    const lastSevenDays = stats.filter((stat) => stat.start_time > sevenDaysAgo.getTime());
    return sum(lastSevenDays.map((s) => s.duration));
  }

  static currentDailyReadingStreak(stats: PageStat[]) {
    if (!stats?.length) {
      return 0;
    }

    const today = startOfDay(new Date()).getTime();
    const uniqueDays = this.getUniqueReadingDays(stats).filter((day) => day <= today);
    const latestReadingDay = uniqueDays[uniqueDays.length - 1];

    if (latestReadingDay === undefined || differenceInCalendarDays(today, latestReadingDay) > 1) {
      return 0;
    }

    const readingDays = new Set(uniqueDays);
    let streak = 0;
    let currentDay = latestReadingDay;

    while (readingDays.has(currentDay)) {
      streak += 1;
      currentDay = startOfDay(subDays(currentDay, 1)).getTime();
    }

    return streak;
  }

  static longestDailyReadingStreak(stats: PageStat[]): DailyReadingStreak {
    const uniqueDays = this.getUniqueReadingDays(stats);
    const longestStreak = this.getLongestDailyReadingStreak(uniqueDays);

    if (!longestStreak) {
      return { days: 0 };
    }

    return longestStreak;
  }

  static totalPagesRead(books: BookWithData[]) {
    return books.reduce((acc, book) => acc + book.total_read_pages, 0);
  }

  private static getUniqueReadingDays(stats: PageStat[]) {
    return Array.from(new Set(stats.map((stat) => startOfDay(stat.start_time).getTime()))).sort(
      (a, b) => a - b
    );
  }

  private static getLongestDailyReadingStreak(uniqueDays: number[]) {
    if (!uniqueDays.length) {
      return undefined;
    }

    let longestStreak = {
      start: uniqueDays[0],
      end: uniqueDays[0],
      days: 1,
    };

    let currentStreak = { ...longestStreak };

    for (let i = 1; i < uniqueDays.length; i += 1) {
      if (differenceInCalendarDays(uniqueDays[i], uniqueDays[i - 1]) === 1) {
        currentStreak.end = uniqueDays[i];
        currentStreak.days += 1;
      } else {
        if (currentStreak.days > longestStreak.days) {
          longestStreak = { ...currentStreak };
        }

        currentStreak = {
          start: uniqueDays[i],
          end: uniqueDays[i],
          days: 1,
        };
      }
    }

    if (currentStreak.days > longestStreak.days) {
      longestStreak = { ...currentStreak };
    }

    return longestStreak;
  }

  private static getTimePerDay(stats: PageStat[]) {
    return stats.reduce<Record<number, number>>((acc, stat) => {
      const day = startOfDay(stat.start_time).getTime();
      acc[day] = (acc[day] || 0) + stat.duration;
      return acc;
    }, {});
  }

  private static getPagesPerDayEntries(stats: PageStat[], books: Book[]) {
    const booksByMd5 = books?.reduce(
      (acc, book) => {
        acc[book.md5] = book;
        return acc;
      },
      {} as Record<string, Book>
    );

    const statsPerDay = groupBy((stat: PageStat) =>
      startOfDay(stat.start_time).getTime().toString()
    )(stats);

    return Object.entries(statsPerDay).map(
      ([day, dayStats]) =>
        [
          Number(day),
          dayStats?.reduce((acc, stat) => {
            if (stat.total_pages && booksByMd5[stat.book_md5]?.reference_pages) {
              return acc + (1 / stat.total_pages) * booksByMd5[stat.book_md5].reference_pages!;
            } else {
              return acc + 1;
            }
          }, 0) ?? 0,
        ] as [number, number]
    );
  }
}

