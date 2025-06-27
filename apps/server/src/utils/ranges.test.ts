import { normalizeRanges, Range, totalRangeLength } from './ranges';

describe(normalizeRanges, () => {
  it('normalizes overlapping ranges', () => {
    const ranges: Range[] = [
      [1, 5],
      [2, 6],
      [7, 10],
      [8, 12],
      [15, 20],
    ];

    expect(normalizeRanges(ranges)).toEqual([
      [1, 6],
      [7, 12],
      [15, 20],
    ]);
  });

  it('handles single range', () => {
    const ranges: Range[] = [[1, 5]];
    expect(normalizeRanges(ranges)).toEqual([[1, 5]]);
  });

  it('handles non-overlapping ranges', () => {
    const ranges: Range[] = [
      [1, 2],
      [3, 4],
      [5, 6],
    ];

    expect(normalizeRanges(ranges)).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
  });

  it('handles touching ranges', () => {
    const ranges: Range[] = [
      [1, 3],
      [3, 5],
      [6, 8],
      [8, 10],
    ];

    expect(normalizeRanges(ranges)).toEqual([
      [1, 5],
      [6, 10],
    ]);
  });

  it('handles point ranges', () => {
    const ranges: Range[] = [
      [1, 1],
      [2, 2],
      [3, 3],
    ];

    expect(normalizeRanges(ranges)).toEqual([
      [1, 1],
      [2, 2],
      [3, 3],
    ]);
  });

  it('handles empty input', () => {
    const ranges: Range[] = [];
    expect(normalizeRanges(ranges)).toEqual([]);
  });
});

describe(totalRangeLength, () => {
  it('totals the length of ranges', () => {
    const ranges: Range[] = [
      [1, 5],
      [6, 10],
      [16, 20],
    ];

    expect(totalRangeLength(ranges)).toBe(12);
  });

  it('works with no ranges', () => {
    const ranges: Range[] = [];
    expect(totalRangeLength(ranges)).toBe(0);
  });
});
