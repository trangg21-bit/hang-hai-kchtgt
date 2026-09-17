import { describe, it, expect } from 'vitest';
import { isDikeRevetmentDeleted } from '../pages/dikerevetment/DikeRevetmentList';

describe('Dike Revetment Status Filter and Tab Counts (/dike-revetment)', () => {
  describe('isDikeRevetmentDeleted helper', () => {
    it('returns false for undefined or null record', () => {
      expect(isDikeRevetmentDeleted(undefined)).toBe(false);
      expect(isDikeRevetmentDeleted(null)).toBe(false);
    });

    it('returns false for active records', () => {
      expect(isDikeRevetmentDeleted({ approvalStatus: 'DRAFT' })).toBe(false);
      expect(isDikeRevetmentDeleted({ approvalStatus: 'PENDING_APPROVAL' })).toBe(false);
      expect(isDikeRevetmentDeleted({ approvalStatus: 'APPROVED_LEVEL1' })).toBe(false);
      expect(isDikeRevetmentDeleted({ approvalStatus: 'APPROVED' })).toBe(false);
      expect(isDikeRevetmentDeleted({ approvalStatus: 'REJECTED_LEVEL1' })).toBe(false);
      expect(isDikeRevetmentDeleted({ approvalStatus: 'REJECTED_LEVEL2' })).toBe(false);
    });

    it('returns true when deletedAt is present', () => {
      expect(isDikeRevetmentDeleted({ deletedAt: '2026-09-16T00:00:00Z' })).toBe(true);
    });

    it('returns true when deletedBy is present', () => {
      expect(isDikeRevetmentDeleted({ deletedBy: 'user-123' })).toBe(true);
    });

    it('returns true when approvalStatus is DELETED or ARCHIVED', () => {
      expect(isDikeRevetmentDeleted({ approvalStatus: 'DELETED' })).toBe(true);
      expect(isDikeRevetmentDeleted({ approvalStatus: 'ARCHIVED' })).toBe(true);
    });
  });

  describe('isDeleted parameter mapping for tabs', () => {
    const getIsDeletedForTab = (activeTab: string) =>
      activeTab === 'ARCHIVED' ? true : (activeTab === '' ? false : undefined);

    it('maps empty tab (Tất cả) to isDeleted: false', () => {
      expect(getIsDeletedForTab('')).toBe(false);
    });

    it('maps ARCHIVED tab (Đã xóa) to isDeleted: true', () => {
      expect(getIsDeletedForTab('ARCHIVED')).toBe(true);
    });

    it('maps specific active tabs to undefined so approvalStatus handles it', () => {
      expect(getIsDeletedForTab('DRAFT')).toBeUndefined();
      expect(getIsDeletedForTab('PENDING_APPROVAL')).toBeUndefined();
      expect(getIsDeletedForTab('APPROVED_LEVEL1')).toBeUndefined();
      expect(getIsDeletedForTab('APPROVED')).toBeUndefined();
      expect(getIsDeletedForTab('REJECTED_LEVEL1')).toBeUndefined();
      expect(getIsDeletedForTab('REJECTED_LEVEL2')).toBeUndefined();
    });
  });

  describe('totalAll count formula', () => {
    it('sums only active child tab counts and excludes ARCHIVED count', () => {
      const STATUS_TAB_LIST = [
        { key: '', label: 'Tất cả' },
        { key: 'DRAFT', label: 'Lưu tạm' },
        { key: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
        { key: 'APPROVED_LEVEL1', label: 'Cảng vụ duyệt' },
        { key: 'APPROVED', label: 'Đã duyệt' },
        { key: 'REJECTED_LEVEL1', label: 'Từ chối cấp 1' },
        { key: 'REJECTED_LEVEL2', label: 'Từ chối cấp 2' },
        { key: 'ARCHIVED', label: 'Đã xóa' },
      ];

      const counts: Record<string, number> = {
        '': 0,
        DRAFT: 4,
        PENDING_APPROVAL: 2,
        APPROVED_LEVEL1: 3,
        APPROVED: 15,
        REJECTED_LEVEL1: 1,
        REJECTED_LEVEL2: 1,
        ARCHIVED: 7,
      };

      const sumChildCounts = STATUS_TAB_LIST
        .filter((t) => t.key !== '' && t.key !== 'ARCHIVED')
        .reduce((acc, t) => acc + (counts[t.key] || 0), 0);

      // 4 + 2 + 3 + 15 + 1 + 1 = 26
      expect(sumChildCounts).toBe(26);
      expect(sumChildCounts).not.toBe(26 + 7);
    });
  });

  describe('DataTable active filter for Tất cả tab', () => {
    it('filters out records where isDikeRevetmentDeleted is true when activeTab is empty', () => {
      const records: Array<{ id: string; dikeRevetmentName: string; approvalStatus?: string; deletedAt?: string; deletedBy?: string }> = [
        { id: '1', dikeRevetmentName: 'Đê 1', approvalStatus: 'APPROVED' },
        { id: '2', dikeRevetmentName: 'Đê 2', approvalStatus: 'ARCHIVED' },
        { id: '3', dikeRevetmentName: 'Đê 3', approvalStatus: 'DRAFT', deletedAt: '2026-09-16' },
        { id: '4', dikeRevetmentName: 'Đê 4', approvalStatus: 'PENDING_APPROVAL' },
      ];

      const activeTab = '';
      const filtered = activeTab === ''
        ? records.filter((r) => !isDikeRevetmentDeleted(r))
        : records;

      expect(filtered.map((r) => r.id)).toEqual(['1', '4']);
    });

    it('preserves all records when on ARCHIVED tab', () => {
      const records: Array<{ id: string; dikeRevetmentName: string; approvalStatus?: string; deletedAt?: string; deletedBy?: string }> = [
        { id: '2', dikeRevetmentName: 'Đê 2', approvalStatus: 'ARCHIVED' },
        { id: '3', dikeRevetmentName: 'Đê 3', approvalStatus: 'DRAFT', deletedAt: '2026-09-16' },
      ];

      const activeTab = 'ARCHIVED';
      const filtered = activeTab === ''
        ? records.filter((r) => !isDikeRevetmentDeleted(r))
        : records;

      expect(filtered.length).toBe(2);
    });
  });
});
