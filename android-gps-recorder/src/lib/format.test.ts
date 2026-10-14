import { formatDateTime, formatDuration, formatSize } from './format';

describe('format', () => {
  it('日時は端末のタイムゾーンで表示する', () => {
    expect(formatDateTime(new Date(2026, 9, 14, 9, 5).getTime())).toBe('2026/10/14 09:05');
  });

  it('経過時間', () => {
    expect(formatDuration(45_900)).toBe('45秒');
    expect(formatDuration(754_000)).toBe('12分34秒');
    expect(formatDuration(3_725_000)).toBe('1時間02分');
    expect(formatDuration(-1)).toBe('0秒');
  });

  it('ファイルサイズ', () => {
    expect(formatSize(820)).toBe('820 B');
    expect(formatSize(12_595)).toBe('12.3 KB');
    expect(formatSize(1_572_864)).toBe('1.5 MB');
  });
});
