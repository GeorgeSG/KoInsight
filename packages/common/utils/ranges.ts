export type Range = [number, number];

export function normalizeRanges(ranges: Range[]): Range[] {
  const epsilon = 1e-9;
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);

  const result: Range[] = [];

  for (const [start, end] of sorted) {
    if (result.length === 0) {
      result.push([start, end]);
    } else {
      const last = result[result.length - 1];
      if (start <= last[1] + epsilon) {
        last[1] = Math.max(last[1], end);
      } else {
        result.push([start, end]);
      }
    }
  }

  return result;
}

export function totalRangeLength(ranges: Range[]): number {
  return ranges.reduce((acc, [start, end]) => acc + (end - start), 0);
}
