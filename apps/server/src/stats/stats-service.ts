import {
  Book,
  BookWithData,
  DailyReadingStreak,
  PageStat,
  PerDayOfTheWeek,
  PerMonthReadingTime,
  ReadingDayStat,
  ReadingPageStat,
} from '@koinsight/common/types';
import { differenceInCalendarDays, format, startOfDay, subDays } from 'date-fns';
import { groupBy, sum } from 'ramda';

export class StatsService {
  static isValidTimeZone(timeZone: string) {
    try {
      Intl.DateTimeFormat(undefined, { timeZone });
      return true;
    } catch {
      return false;
    }
  }
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

  static mostPagesInADay(books: Book[], stats: PageStat[], timeZone = 'UTC'): ReadingPageStat {
    const pagesPerDay = this.getPagesPerDayEntries(stats, books, timeZone);
    const maxPagesDay = pagesPerDay.reduce<[string, number] | undefined>((max, entry) => {
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
      date: maxPagesDay[0],
    };
  }

  static totalReadingTime(stats: PageStat[]) {
    return sum((stats ?? []).map((s) => s.duration));
  }

  static longestDay(stats: PageStat[], timeZone = 'UTC'): ReadingDayStat {
    const timePerDay = this.getTimePerDay(stats, timeZone);
    const longestDayEntry = Object.entries(timePerDay).reduce<[string, number] | undefined>(
      (max, [day, duration]) => {
        if (!max || duration > max[1]) {
          return [day, duration];
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
      date: longestDayEntry[0],
    };
  }

  static last7DaysReadTime(stats: PageStat[]) {
    const sevenDaysAgo = subDays(new Date(), 7);
    const lastSevenDays = stats.filter((stat) => stat.start_time > sevenDaysAgo.getTime());
    return sum(lastSevenDays.map((s) => s.duration));
  }

  static currentDailyReadingStreak(stats: PageStat[], timeZone = 'UTC') {
    if (!stats?.length) {
      return 0;
    }

    const today = this.getDateKey(Date.now(), timeZone);
    const uniqueDays = this.getUniqueReadingDays(stats, timeZone).filter((day) => day <= today);
    const latestReadingDay = uniqueDays[uniqueDays.length - 1];

    if (
      latestReadingDay === undefined ||
      differenceInCalendarDays(this.dateKeyToDate(today), this.dateKeyToDate(latestReadingDay)) > 1
    ) {
      return 0;
    }

    const readingDays = new Set(uniqueDays);
    let streak = 0;
    let currentDay = latestReadingDay;

    while (readingDays.has(currentDay)) {
      streak += 1;
      currentDay = this.previousDateKey(currentDay);
    }

    return streak;
  }

  static longestDailyReadingStreak(stats: PageStat[], timeZone = 'UTC'): DailyReadingStreak {
    const uniqueDays = this.getUniqueReadingDays(stats, timeZone);
    const longestStreak = this.getLongestDailyReadingStreak(uniqueDays);

    if (!longestStreak) {
      return { days: 0 };
    }

    return longestStreak;
  }

  static totalPagesRead(books: BookWithData[]) {
    return books.reduce((acc, book) => acc + book.total_read_pages, 0);
  }

  private static getUniqueReadingDays(stats: PageStat[], timeZone = 'UTC') {
    return Array.from(new Set(stats.map((stat) => this.getDateKey(stat.start_time, timeZone)))).sort();
  }

  private static getLongestDailyReadingStreak(uniqueDays: string[]) {
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
      if (
        differenceInCalendarDays(
          this.dateKeyToDate(uniqueDays[i]),
          this.dateKeyToDate(uniqueDays[i - 1])
        ) === 1
      ) {
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

  private static getTimePerDay(stats: PageStat[], timeZone = 'UTC') {
    return stats.reduce<Record<string, number>>((acc, stat) => {
      const day = this.getDateKey(stat.start_time, timeZone);
      acc[day] = (acc[day] || 0) + stat.duration;
      return acc;
    }, {});
  }

  private static getPagesPerDayEntries(stats: PageStat[], books: Book[], timeZone = 'UTC') {
    const booksByMd5 = books?.reduce(
      (acc, book) => {
        acc[book.md5] = book;
        return acc;
      },
      {} as Record<string, Book>
    );

    const statsPerDay = groupBy((stat: PageStat) => this.getDateKey(stat.start_time, timeZone))(
      stats
    );

    return Object.entries(statsPerDay).map(
      ([day, dayStats]) =>
        [
          day,
          dayStats?.reduce((acc, stat) => {
            if (stat.total_pages && booksByMd5[stat.book_md5]?.reference_pages) {
              return acc + (1 / stat.total_pages) * booksByMd5[stat.book_md5].reference_pages!;
            } else {
              return acc + 1;
            }
          }, 0) ?? 0,
        ] as [string, number]
    );
  }

  private static getDateKey(timestamp: number, timeZone: string) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date(timestamp));

    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;

    return `${year}-${month}-${day}`;
  }

  private static dateKeyToDate(dateKey: string) {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12));
  }

  private static previousDateKey(dateKey: string) {
    return subDays(this.dateKeyToDate(dateKey), 1).toISOString().slice(0, 10);
  }
}
