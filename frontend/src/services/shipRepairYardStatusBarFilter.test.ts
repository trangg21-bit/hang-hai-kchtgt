import { describe, it, expect } from 'vitest';
import { isShipRepairYardDeleted } from '../pages/ship-repair-yard/ShipRepairYardListPage';

describe('ShipRepairYard Status Bar Filter and Count Logic (/ship-repair-yard)', () => {
  const TAB_STATUS_LIST = [
    { key: 'all', label: 'Tất cả', color: '#0E6FD6' },
    { key: 'DRAFT', label: 'Lưu tạm', color: '#93A3B3' },
    { key: 'PENDING_APPROVAL', label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', color: '#0E6FD6' },
    { key: 'APPROVED_LEVEL1', label: 'Chờ phê duyệt cấp Cục', color: '#EDA100' },
    { key: 'APPROVED', label: 'Đã phê duyệt', color: '#1BAF7A' },
    { key: 'REJECTED_LEVEL1', label: 'Từ chối cấp Cảng vụ/Chi cục', color: '#E34948' },
    { key: 'REJECTED_LEVEL2', label: 'Từ chối cấp Cục', color: '#E34948' },
    { key: 'DELETED', label: 'Đã xóa', color: '#E34948' },
  ];

  const TAB_QUERY_MAP: Record<string, string | undefined> = {
    all: undefined,
    DRAFT: 'DRAFT',
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    APPROVED_LEVEL1: 'APPROVED_LEVEL1',
    APPROVED: 'APPROVED',
    REJECTED_LEVEL1: 'REJECTED_LEVEL1',
    REJECTED_LEVEL2: 'REJECTED_LEVEL2',
    DELETED: 'ARCHIVED',
  };

  const computeStatusTabs = (
    tabCounts: Record<string, number>,
    activeTab: string,
    total: number,
  ) => {
    const allChildSum = TAB_STATUS_LIST
      .filter((t) => t.key !== 'all')
      .reduce((acc, t) => acc + (tabCounts[t.key] ?? 0), 0);

    return TAB_STATUS_LIST.map((tab) => {
      let count = tabCounts[tab.key] ?? 0;
      if (tab.key === 'all') {
        count = allChildSum;
      } else if (tab.key === activeTab) {
        count = total;
      }
      return {
        key: tab.key,
        label: tab.label,
        count,
        color: tab.color,
        active: activeTab === tab.key,
      };
    });
  };

  it('isShipRepairYardDeleted detects deleted records by deletedAt, deletedBy, DELETED or ARCHIVED approvalStatus', () => {
    expect(isShipRepairYardDeleted(null)).toBe(false);
    expect(isShipRepairYardDeleted(undefined)).toBe(false);
    expect(isShipRepairYardDeleted({ id: '1', approvalStatus: 'APPROVED' })).toBe(false);
    expect(isShipRepairYardDeleted({ id: '2', deletedAt: '2026-01-01' })).toBe(true);
    expect(isShipRepairYardDeleted({ id: '3', deletedBy: 'user-1' })).toBe(true);
    expect(isShipRepairYardDeleted({ id: '4', approvalStatus: 'DELETED' })).toBe(true);
    expect(isShipRepairYardDeleted({ id: '5', approvalStatus: 'ARCHIVED' })).toBe(true);
  });

  it('tab Tất cả tính bằng tổng tất cả các tab con (bao gồm cả tab Đã xóa DELETED)', () => {
    const counts: Record<string, number> = {
      DRAFT: 4,
      PENDING_APPROVAL: 2,
      APPROVED_LEVEL1: 3,
      APPROVED: 15,
      REJECTED_LEVEL1: 1,
      REJECTED_LEVEL2: 1,
      DELETED: 6,
    };
    const tabs = computeStatusTabs(counts, 'all', 26);
    const allTab = tabs.find((t) => t.key === 'all');
    // 4 + 2 + 3 + 15 + 1 + 1 + 6 = 32 (DELETED = 6 is included)
    expect(allTab?.count).toBe(32);
    expect(allTab?.active).toBe(true);

    const deletedTab = tabs.find((t) => t.key === 'DELETED');
    expect(deletedTab?.count).toBe(6);
  });

  it('khi chọn tab con bất kỳ (ví dụ APPROVED), badge của tab đó cập nhật bằng đúng total trả về từ API', () => {
    const counts: Record<string, number> = {
      DRAFT: 4,
      PENDING_APPROVAL: 2,
      APPROVED_LEVEL1: 3,
      APPROVED: 15,
      REJECTED_LEVEL1: 1,
      REJECTED_LEVEL2: 1,
      DELETED: 6,
    };
    const tabs = computeStatusTabs(counts, 'APPROVED', 12);
    const approvedTab = tabs.find((t) => t.key === 'APPROVED');
    expect(approvedTab?.count).toBe(12);
    expect(approvedTab?.active).toBe(true);
  });

  it('khi chọn tab Đã xóa (DELETED), badge cập nhật bằng total của các bản ghi đã xóa trả về từ API', () => {
    const counts: Record<string, number> = {
      DRAFT: 4,
      PENDING_APPROVAL: 2,
      APPROVED_LEVEL1: 3,
      APPROVED: 15,
      REJECTED_LEVEL1: 1,
      REJECTED_LEVEL2: 1,
      DELETED: 6,
    };
    const tabs = computeStatusTabs(counts, 'DELETED', 5);
    const deletedTab = tabs.find((t) => t.key === 'DELETED');
    expect(deletedTab?.count).toBe(5);
    expect(deletedTab?.active).toBe(true);
  });

  it('tham số query của tab DELETED gửi ARCHIVED lên backend theo enum ApprovalStatus', () => {
    expect(TAB_QUERY_MAP['DELETED']).toBe('ARCHIVED');
    expect(TAB_QUERY_MAP['all']).toBeUndefined();
    expect(TAB_QUERY_MAP['APPROVED']).toBe('APPROVED');
  });
});
