import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';

describe('DikeRevetment Date Range Filter (/dike-revetment)', () => {
  const formatUpdatedRange = (range: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    return {
      updatedFrom: range?.[0] ? `${range[0].format('YYYY-MM-DD')} 00:00:00.000` : undefined,
      updatedTo: range?.[1] ? `${range[1].format('YYYY-MM-DD')} 23:59:59.999` : undefined,
    };
  };

  it('formats same-day date range with 00:00:00.000 and 23:59:59.999', () => {
    const range: [dayjs.Dayjs, dayjs.Dayjs] = [dayjs('2026-09-22'), dayjs('2026-09-22')];
    const { updatedFrom, updatedTo } = formatUpdatedRange(range);
    expect(updatedFrom).toBe('2026-09-22 00:00:00.000');
    expect(updatedTo).toBe('2026-09-22 23:59:59.999');
  });

  it('formats multi-day date range with 00:00:00.000 and 23:59:59.999', () => {
    const range: [dayjs.Dayjs, dayjs.Dayjs] = [dayjs('2026-09-01'), dayjs('2026-09-22')];
    const { updatedFrom, updatedTo } = formatUpdatedRange(range);
    expect(updatedFrom).toBe('2026-09-01 00:00:00.000');
    expect(updatedTo).toBe('2026-09-22 23:59:59.999');
  });

  it('handles null or empty range gracefully', () => {
    expect(formatUpdatedRange(null)).toEqual({
      updatedFrom: undefined,
      updatedTo: undefined,
    });
  });

  it('handles partial range with only fromDate', () => {
    const range: [dayjs.Dayjs, null] = [dayjs('2026-09-22'), null];
    const { updatedFrom, updatedTo } = formatUpdatedRange(range);
    expect(updatedFrom).toBe('2026-09-22 00:00:00.000');
    expect(updatedTo).toBeUndefined();
  });
});
