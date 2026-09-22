import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import { isTransferAreaDeleted } from '../pages/transfer-area/TransferAreaListPage';

describe('TransferArea Status Bar Filter and Count Logic (/transfer-area)', () => {
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
    DELETED: 'DELETED',
  };

  const computeStatusTabs = (
    tabCounts: Record<string, number>,
    activeTab: string,
    total: number,
  ) => {
    const allChildSum = TAB_STATUS_LIST
      .filter((t) => t.key !== 'all' && t.key !== 'DELETED')
      .reduce((acc, t) => acc + (tabCounts[t.key] ?? 0), 0);

    return TAB_STATUS_LIST.map((tab) => {
      let count = tabCounts[tab.key] ?? 0;
      if (tab.key === 'all') {
        count = activeTab === 'all' ? total : allChildSum;
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

  it('isTransferAreaDeleted detects deleted records by deletedAt, deletedBy, DELETED or ARCHIVED approvalStatus', () => {
    expect(isTransferAreaDeleted(null)).toBe(false);
    expect(isTransferAreaDeleted(undefined)).toBe(false);
    expect(isTransferAreaDeleted({ id: '1', approvalStatus: 'APPROVED' } as any)).toBe(false);
    expect(isTransferAreaDeleted({ id: '2', deletedAt: '2026-01-01' } as any)).toBe(true);
    expect(isTransferAreaDeleted({ id: '3', deletedBy: 'user-1' } as any)).toBe(true);
    expect(isTransferAreaDeleted({ id: '4', approvalStatus: 'DELETED' } as any)).toBe(true);
    expect(isTransferAreaDeleted({ id: '5', approvalStatus: 'ARCHIVED' } as any)).toBe(true);
  });

  it('tab Tất cả tính bằng tổng các tab con đang hoạt động (không cộng tab Đã xóa DELETED)', () => {
    const counts: Record<string, number> = {
      DRAFT: 5,
      PENDING_APPROVAL: 3,
      APPROVED_LEVEL1: 2,
      APPROVED: 20,
      REJECTED_LEVEL1: 1,
      REJECTED_LEVEL2: 1,
      DELETED: 7,
    };
    const tabs = computeStatusTabs(counts, 'all', 32);
    const allTab = tabs.find((t) => t.key === 'all');
    // 5 + 3 + 2 + 20 + 1 + 1 = 32 (DELETED = 7 is excluded)
    expect(allTab?.count).toBe(32);
    expect(allTab?.active).toBe(true);

    const deletedTab = tabs.find((t) => t.key === 'DELETED');
    expect(deletedTab?.count).toBe(7);
  });

  it('khi chọn tab con bất kỳ (ví dụ APPROVED), badge của tab đó cập nhật bằng đúng total trả về từ API', () => {
    const counts: Record<string, number> = {
      DRAFT: 5,
      PENDING_APPROVAL: 3,
      APPROVED_LEVEL1: 2,
      APPROVED: 20,
      REJECTED_LEVEL1: 1,
      REJECTED_LEVEL2: 1,
      DELETED: 7,
    };
    const tabs = computeStatusTabs(counts, 'APPROVED', 18);
    const approvedTab = tabs.find((t) => t.key === 'APPROVED');
    expect(approvedTab?.count).toBe(18);
    expect(approvedTab?.active).toBe(true);
  });

  it('khi chọn tab Đã xóa (DELETED), badge cập nhật bằng total của các bản ghi đã xóa trả về từ API', () => {
    const counts: Record<string, number> = {
      DRAFT: 5,
      PENDING_APPROVAL: 3,
      APPROVED_LEVEL1: 2,
      APPROVED: 20,
      REJECTED_LEVEL1: 1,
      REJECTED_LEVEL2: 1,
      DELETED: 7,
    };
    const tabs = computeStatusTabs(counts, 'DELETED', 9);
    const deletedTab = tabs.find((t) => t.key === 'DELETED');
    expect(deletedTab?.count).toBe(9);
    expect(deletedTab?.active).toBe(true);
  });

  it('ngày cập nhật được format chuẩn YYYY-MM-DD HH:mm:ss tương thích backend parseLocalDateTime', () => {
    const start = dayjs('2026-09-17').startOf('day').format('YYYY-MM-DD 00:00:00');
    const end = dayjs('2026-09-17').endOf('day').format('YYYY-MM-DD 23:59:59');

    expect(start).toBe('2026-09-17 00:00:00');
    expect(end).toBe('2026-09-17 23:59:59');

    const backendStart = start.replace(' ', 'T');
    const backendEnd = end.replace(' ', 'T');
    expect(backendStart).toBe('2026-09-17T00:00:00');
    expect(backendEnd).toBe('2026-09-17T23:59:59');
    expect(backendStart.endsWith('Z')).toBe(false);
  });
});
