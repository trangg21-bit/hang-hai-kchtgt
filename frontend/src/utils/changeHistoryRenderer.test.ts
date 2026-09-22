import { describe, it, expect } from 'vitest';
import {
  areEquivalentCoordinatePositions,
  countHistoryUpdates,
  buildHistoryUpdateSessions,
  autoFormatHistoryValue,
  type RawHistoryRecord,
} from './changeHistoryRenderer';
import { isYearField, formatYearValue, formatHistoryNumber } from './numFmt';

describe('changeHistoryRenderer - countHistoryUpdates', () => {
  it('returns 0 for empty or null records', () => {
    expect(countHistoryUpdates(null)).toBe(0);
    expect(countHistoryUpdates(undefined)).toBe(0);
    expect(countHistoryUpdates([])).toBe(0);
  });

  it('counts 1 update for multiple field changes within the same update session (<= 10s, same actor)', () => {
    const records: RawHistoryRecord[] = [
      {
        id: '1',
        changedField: 'assetName',
        oldValue: 'Cầu cảng 1',
        newValue: 'Cầu cảng 1 Mới',
        changedBy: 'user1',
        changedAt: '2026-09-16T10:00:00Z',
      },
      {
        id: '2',
        changedField: 'quantity',
        oldValue: '1',
        newValue: '2',
        changedBy: 'user1',
        changedAt: '2026-09-16T10:00:02Z',
      },
      {
        id: '3',
        changedField: 'assetCondition',
        oldValue: 'Tốt',
        newValue: 'Trung bình',
        changedBy: 'user1',
        changedAt: '2026-09-16T10:00:05Z',
      },
    ];

    // Trước đây đếm số trường update sẽ là 3.
    // Giờ đếm số lần update (sessions) trả về 1!
    expect(countHistoryUpdates(records)).toBe(1);
    const sessions = buildHistoryUpdateSessions({ records });
    expect(sessions.length).toBe(1);
    expect(sessions[0].validRows.length).toBe(3);
  });

  it('counts multiple updates for different sessions (time gap > 10s or different actors)', () => {
    const records: RawHistoryRecord[] = [
      // Session 1: 10:00:00 (2 trường)
      {
        id: '1',
        changedField: 'assetName',
        oldValue: 'Cầu cảng 1',
        newValue: 'Cầu cảng 1 Mới',
        changedBy: 'user1',
        changedAt: '2026-09-16T10:00:00Z',
      },
      {
        id: '2',
        changedField: 'quantity',
        oldValue: '1',
        newValue: '2',
        changedBy: 'user1',
        changedAt: '2026-09-16T10:00:03Z',
      },
      // Session 2: 11:30:00 (1 trường)
      {
        id: '3',
        changedField: 'assetCondition',
        oldValue: 'Tốt',
        newValue: 'Kém',
        changedBy: 'user1',
        changedAt: '2026-09-16T11:30:00Z',
      },
      // Session 3: 15:00:00 (người khác sửa)
      {
        id: '4',
        changedField: 'model',
        oldValue: 'M1',
        newValue: 'M2',
        changedBy: 'user2',
        changedAt: '2026-09-16T15:00:00Z',
      },
    ];

    // Có 4 trường thay đổi, nhưng thuộc 3 lần update khác nhau -> Đếm là 3!
    expect(countHistoryUpdates(records)).toBe(3);
  });

  it('ignores records where oldValue and newValue are identical or in ignoredFields', () => {
    const records: RawHistoryRecord[] = [
      {
        id: '1',
        changedField: 'assetName',
        oldValue: 'Cầu cảng A',
        newValue: 'Cầu cảng A', // Không đổi
        changedBy: 'user1',
        changedAt: '2026-09-16T10:00:00Z',
      },
      {
        id: '2',
        changedField: 'approvalStatus', // Ignored field
        oldValue: 'DRAFT',
        newValue: 'APPROVED',
        changedBy: 'user1',
        changedAt: '2026-09-16T10:00:02Z',
      },
    ];

    expect(countHistoryUpdates(records)).toBe(0);
  });

  it('deduplicates duplicate records of the same field in the same update session into 1 single card/session', () => {
    const records: RawHistoryRecord[] = [
      {
        id: 'rec-1',
        changedField: 'orgUnitId',
        oldValue: 'Đơn vị cũ',
        newValue: 'Đơn vị mới',
        changedBy: 'Nguyễn Văn An',
        changedAt: '2026-09-16T11:28:00Z',
      },
      {
        id: 'rec-2',
        changedField: 'orgUnitId',
        oldValue: 'Đơn vị cũ',
        newValue: 'Đơn vị mới',
        changedBy: 'Nguyễn Văn An',
        changedAt: '2026-09-16T11:28:00Z',
      },
      {
        id: 'rec-3',
        changedField: 'usingOrgUnitId',
        oldValue: 'Đơn vị dùng cũ',
        newValue: 'Đơn vị dùng mới',
        changedBy: 'Nguyễn Văn An',
        changedAt: '2026-09-16T11:28:02Z',
      },
    ];

    expect(countHistoryUpdates(records)).toBe(1);
    const sessions = buildHistoryUpdateSessions({ records });
    expect(sessions.length).toBe(1);
    expect(sessions[0].validRows.length).toBe(2);
    expect(sessions[0].validRows.map((r) => r.field).sort()).toEqual(['orgUnitId', 'usingOrgUnitId'].sort());
  });

  it('does not render a GIS change when only its WKT wrapper differs', () => {
    const oldCoordinates = 'LINESTRING(106.1498888889 15.5913055556,108.0175833333 14.67925)';
    const newCoordinates = 'MULTIPOINT((106.1498888889 15.5913055556),(108.0175833333 14.67925))';

    expect(areEquivalentCoordinatePositions(oldCoordinates, newCoordinates)).toBe(true);
    expect(buildHistoryUpdateSessions({
      records: [{
        id: 'coordinates-only',
        changedField: 'Tọa độ GIS',
        oldValue: oldCoordinates,
        newValue: newCoordinates,
        changedBy: 'user1',
        changedAt: '2026-09-17T15:11:31Z',
      }],
    })).toHaveLength(0);
  });

  describe('Year formatting in change history', () => {
    it('correctly identifies year fields', () => {
      expect(isYearField('yearOfUse')).toBe(true);
      expect(isYearField('Năm đưa vào sử dụng')).toBe(true);
      expect(isYearField('constructionYear')).toBe(true);
      expect(isYearField('Năm xây dựng')).toBe(true);
      expect(isYearField('commissioningYear')).toBe(true);
      expect(isYearField('yearOfManufacture')).toBe(true);
      expect(isYearField('manufactureYear')).toBe(true);
      expect(isYearField('Năm sản xuất')).toBe(true);
      expect(isYearField('quantity')).toBe(false);
      expect(isYearField('assetName')).toBe(false);
    });

    it('formats year values cleanly without thousand separators', () => {
      expect(formatYearValue('2020')).toBe('2020');
      expect(formatYearValue(2020)).toBe('2020');
      expect(formatYearValue('1998')).toBe('1998');
      expect(formatYearValue('2026-01-01')).toBe('2026');
    });

    it('autoFormatHistoryValue preserves 4-digit years for year fields without dot/comma', () => {
      expect(autoFormatHistoryValue('yearOfUse', '2020')).toBe('2020');
      expect(autoFormatHistoryValue('Năm đưa vào sử dụng', '2020')).toBe('2020');
      expect(autoFormatHistoryValue('constructionYear', '2020')).toBe('2020');
      expect(autoFormatHistoryValue('commissioningYear', 2020)).toBe('2020');
      expect(autoFormatHistoryValue('manufactureYear', '2019')).toBe('2019');
      // Regular numeric fields should still format with separators
      expect(autoFormatHistoryValue('quantity', '2020')).toBe('2,020');
      expect(formatHistoryNumber('2020', 'yearOfUse')).toBe('2020');
      expect(formatHistoryNumber('2020', 'quantity')).toBe('2,020');
    });
  });
});
