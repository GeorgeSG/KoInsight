import { BookWithData, PageStat } from '@koinsight/common/types';
import { normalizeRanges } from '@koinsight/common/utils/ranges';
import { startOfDay } from 'date-fns/startOfDay';

export type Range = [number, number];

export function getLatestReadPage(book: BookWithData): number {
  const sortedStats = [...book.stats].sort((a, b) => a.start_time - b.start_time);
  const latestStat = sortedStats[sortedStats.length - 1];

  if (!latestStat) {
    return 0;
  }

  const latestDay = startOfDay(latestStat.start_time).getTime();
  const latestDayStats = sortedStats.filter(
    (stat) => startOfDay(stat.start_time).getTime() === latestDay
  );

  const referencePages = book.reference_pages;
  if (referencePages !== null && referencePages !== undefined) {
    return Math.round(
      Math.max(...latestDayStats.map((stat) => (stat.page * referencePages) / stat.total_pages))
    );
  }

  return Math.max(...latestDayStats.map((stat) => stat.page));
}

export function getReferencePageRanges(book: BookWithData, stats: PageStat[]): Range[] {
  const ranges: Range[] = [];

  stats.forEach((stat) => {
    if (book.reference_pages) {
      const startRefPage = ((Math.max(stat.page - 1, 0) * book.reference_pages) / stat.total_pages) + 1;
      const endRefPage = (stat.page * book.reference_pages) / stat.total_pages;
      ranges.push([startRefPage, endRefPage]);
    } else {
      ranges.push([Math.max(stat.page - 1, 0), stat.page]);
    }
  });

  return normalizeRanges(ranges);
}

export function getReferencePageRange(book: BookWithData, stats: PageStat[]): Range {
  const ranges = getReferencePageRanges(book, stats);
  const start = Math.min(...ranges.map(([start]) => start));
  const end = Math.max(...ranges.map(([, end]) => end));

  return [start, end];
}
