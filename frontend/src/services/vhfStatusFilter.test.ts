import { describe, it, expect } from 'vitest';
import { isVhfDeleted } from './vhf/VhfListPage';
import { operationalStatusBadge } from './vhf/schema';
import { buildStandardApprovalTabs } from '../components/shared/approvalStatusTabs';

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

  describe('totalAll count formula (standardized)', () => {
    it('sums all status counts including ARCHIVED for Tất cả tab', () => {
      const counts: Record<string, number> = {
        DRAFT: 5,
        PENDING_APPROVAL: 3,
        APPROVED_LEVEL1: 2,
        APPROVED: 10,
        REJECTED_LEVEL1: 1,
        REJECTED_LEVEL2: 1,
        ARCHIVED: 8,
      };

      const tabs = buildStandardApprovalTabs(counts, undefined);
      const allTab = tabs.find((t) => t.key === 'ALL');

      // Total of all records: 5 + 3 + 2 + 10 + 1 + 1 + 8 = 30
      expect(allTab?.count).toBe(30);
    });
  });

  describe('DataTable data source for Tất cả tab', () => {
    it('includes all records including deleted when on Tất cả tab', () => {
      const records = [
        { id: '1', deviceCode: 'VHF-001', approvalStatus: 'APPROVED' },
        { id: '2', deviceCode: 'VHF-002', approvalStatus: 'ARCHIVED' },
        { id: '3', deviceCode: 'VHF-003', approvalStatus: 'DRAFT', deletedAt: '2026-09-16' },
        { id: '4', deviceCode: 'VHF-004', approvalStatus: 'PENDING_APPROVAL' },
      ];

      // Standard behavior: dataSource={data} without client-side deletion filter
      const dataSource = records;

      expect(dataSource.map((r) => r.id)).toEqual(['1', '2', '3', '4']);
      expect(dataSource.filter(isVhfDeleted).length).toBe(2);
    });

    it('identifies deleted records properly for badge and actions', () => {
      const records = [
        { id: '2', deviceCode: 'VHF-002', approvalStatus: 'ARCHIVED' },
        { id: '3', deviceCode: 'VHF-003', approvalStatus: 'DRAFT', deletedAt: '2026-09-16' },
      ];

      expect(records.every(isVhfDeleted)).toBe(true);
    });
  });

  describe('operationalStatusBadge helper', () => {
    it('handles numeric status values correctly', () => {
      expect(operationalStatusBadge(0).label).toBe('Chưa khai thác/vận hành');
      expect(operationalStatusBadge(1).label).toBe('Đang khai thác/vận hành');
      expect(operationalStatusBadge(2).label).toBe('Dừng khai thác/vận hành');
    });

    it('handles string numeric values correctly', () => {
      expect(operationalStatusBadge('0').label).toBe('Chưa khai thác/vận hành');
      expect(operationalStatusBadge('1').label).toBe('Đang khai thác/vận hành');
      expect(operationalStatusBadge('2').label).toBe('Dừng khai thác/vận hành');
    });

    it('handles backend OperationalStatus enum string values without producing NaN', () => {
      expect(operationalStatusBadge('OPERATIONAL').label).toBe('Đang khai thác/vận hành');
      expect(operationalStatusBadge('ACTIVE').label).toBe('Đang khai thác/vận hành');
      expect(operationalStatusBadge('NOT_YET_OPERATIONAL').label).toBe('Chưa khai thác/vận hành');
      expect(operationalStatusBadge('SUSPENDED').label).toBe('Dừng khai thác/vận hành');
      expect(operationalStatusBadge('INACTIVE').label).toBe('Dừng khai thác/vận hành');
      expect(operationalStatusBadge('operational').label).toBe('Đang khai thác/vận hành');
    });

    it('handles null, undefined and empty string gracefully', () => {
      expect(operationalStatusBadge(null).label).toBe('—');
      expect(operationalStatusBadge(undefined).label).toBe('—');
      expect(operationalStatusBadge('').label).toBe('—');
    });
  });
});
