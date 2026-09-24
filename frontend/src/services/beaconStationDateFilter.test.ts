import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';

describe('BeaconStation Date Range Filters (/beacon-stations)', () => {
  const formatRange = (range: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    return {
      from: range && range[0] ? `${range[0].format('YYYY-MM-DD')} 00:00:00.000` : '',
      to: range && range[1] ? `${range[1].format('YYYY-MM-DD')} 23:59:59.999` : '',
    };
  };

  const rangeValue = (from: string, to: string): [dayjs.Dayjs | null, dayjs.Dayjs | null] | null =>
    from || to ? [from ? dayjs(from) : null, to ? dayjs(to) : null] : null;

  describe('Thời điểm đưa vào sử dụng & Ngày cập nhật formatting', () => {
    it('formats same-day range with 00:00:00.000 and 23:59:59.999', () => {
      const range: [dayjs.Dayjs, dayjs.Dayjs] = [dayjs('2026-09-22'), dayjs('2026-09-22')];
      const { from, to } = formatRange(range);
      expect(from).toBe('2026-09-22 00:00:00.000');
      expect(to).toBe('2026-09-22 23:59:59.999');
    });

    it('formats multi-day range with 00:00:00.000 and 23:59:59.999', () => {
      const range: [dayjs.Dayjs, dayjs.Dayjs] = [dayjs('2026-01-01'), dayjs('2026-09-22')];
      const { from, to } = formatRange(range);
      expect(from).toBe('2026-01-01 00:00:00.000');
      expect(to).toBe('2026-09-22 23:59:59.999');
    });

    it('returns empty string when range is null or empty', () => {
      expect(formatRange(null)).toEqual({ from: '', to: '' });
    });
  });

  describe('rangeValue helper round-trip parsing', () => {
    it('parses formatted string back to Dayjs range correctly for DatePicker display', () => {
      const from = '2026-09-22 00:00:00.000';
      const to = '2026-09-22 23:59:59.999';
      const rv = rangeValue(from, to);
      expect(rv).not.toBeNull();
      expect(rv![0]?.format('YYYY-MM-DD')).toBe('2026-09-22');
      expect(rv![1]?.format('YYYY-MM-DD')).toBe('2026-09-22');
    });

    it('returns null when both from and to are empty', () => {
      expect(rangeValue('', '')).toBeNull();
    });
  });
});
