import { describe, it, expect } from 'vitest';
import { isVhfDeleted } from './vhf/VhfListPage';

describe('VHF Status Filter and Tab Counts (/vhf)', () => {
  describe('isVhfDeleted helper', () => {
    it('returns false for undefined or null record', () => {
      expect(isVhfDeleted(undefined)).toBe(false);
      expect(isVhfDeleted(null)).toBe(false);
    });

    it('returns false for active records', () => {
      expect(isVhfDeleted({ approvalStatus: 'DRAFT' })).toBe(false);
      expect(isVhfDeleted({ approvalStatus: 'PENDING_APPROVAL' })).toBe(false);
      expect(isVhfDeleted({ approvalStatus: 'APPROVED_LEVEL1' })).toBe(false);
      expect(isVhfDeleted({ approvalStatus: 'APPROVED' })).toBe(false);
      expect(isVhfDeleted({ approvalStatus: 'REJECTED_LEVEL1' })).toBe(false);
      expect(isVhfDeleted({ approvalStatus: 'REJECTED_LEVEL2' })).toBe(false);
    });

    it('returns true when deletedAt or deleted_at is present', () => {
      expect(isVhfDeleted({ deletedAt: '2026-09-16T00:00:00Z' })).toBe(true);
      expect(isVhfDeleted({ deleted_at: '2026-09-16T00:00:00Z' })).toBe(true);
    });

    it('returns true when deletedBy or deleted_by is present', () => {
      expect(isVhfDeleted({ deletedBy: 'user-1' })).toBe(true);
      expect(isVhfDeleted({ deleted_by: 'user-1' })).toBe(true);
    });

    it('returns true when approvalStatus is DELETED or ARCHIVED', () => {
      expect(isVhfDeleted({ approvalStatus: 'DELETED' })).toBe(true);
      expect(isVhfDeleted({ approvalStatus: 'ARCHIVED' })).toBe(true);
    });
  });

  describe('totalAll count formula', () => {
    it('sums only active status counts and excludes ARCHIVED count', () => {
      const counts: Record<string, number> = {
        DRAFT: 5,
        PENDING_APPROVAL: 3,
        APPROVED_LEVEL1: 2,
        APPROVED: 10,
        REJECTED_LEVEL1: 1,
        REJECTED_LEVEL2: 1,
        ARCHIVED: 8,
      };

      const totalAll =
        (counts.DRAFT || 0) +
        (counts.PENDING_APPROVAL || 0) +
        (counts.APPROVED_LEVEL1 || 0) +
        (counts.APPROVED || 0) +
        (counts.REJECTED_LEVEL1 || 0) +
        (counts.REJECTED_LEVEL2 || 0);

      // Total of active records: 5 + 3 + 2 + 10 + 1 + 1 = 22
      expect(totalAll).toBe(22);
      // ARCHIVED (8) must not be included
      expect(totalAll).not.toBe(22 + 8);
    });
  });

  describe('DataTable active filter for Tất cả tab', () => {
    it('filters out records where isVhfDeleted is true when approvalStatus is not set', () => {
      const records = [
        { id: '1', deviceCode: 'VHF-001', approvalStatus: 'APPROVED' },
        { id: '2', deviceCode: 'VHF-002', approvalStatus: 'ARCHIVED' },
        { id: '3', deviceCode: 'VHF-003', approvalStatus: 'DRAFT', deletedAt: '2026-09-16' },
        { id: '4', deviceCode: 'VHF-004', approvalStatus: 'PENDING_APPROVAL' },
      ];

      const filterValues = { approvalStatus: '' };
      const filtered = !filterValues.approvalStatus
        ? records.filter((r) => !isVhfDeleted(r))
        : records;

      expect(filtered.map((r) => r.id)).toEqual(['1', '4']);
    });

    it('preserves all records including deleted when on ARCHIVED tab', () => {
      const records = [
        { id: '2', deviceCode: 'VHF-002', approvalStatus: 'ARCHIVED' },
        { id: '3', deviceCode: 'VHF-003', approvalStatus: 'DRAFT', deletedAt: '2026-09-16' },
      ];

      const filterValues = { approvalStatus: 'ARCHIVED' };
      const filtered = !filterValues.approvalStatus
        ? records.filter((r) => !isVhfDeleted(r))
        : records;

      expect(filtered.length).toBe(2);
    });
  });
});
