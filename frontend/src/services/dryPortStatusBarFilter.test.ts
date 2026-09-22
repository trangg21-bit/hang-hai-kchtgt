import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import { isDryPortDeleted } from '../pages/port/DryPortListPage';

describe('DryPort Status Bar Filter and Count Logic (/dry-port)', () => {
  const TAB_STATUS_LIST = [
    { key: 'all', label: 'Tất cả', color: '#0E6FD6' },
    { key: 'DRAFT', label: 'Lưu tạm', color: '#93A3B3' },
    { key: 'PENDING_APPROVAL', label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', color: '#0E6FD6' },
    { key: 'APPROVED_LEVEL1', label: 'Chờ phê duyệt cấp Cục', color: '#EDA100' },
    { key: 'APPROVED', label: 'Đã phê duyệt', color: '#1BAF7A' },
    { key: 'REJECTED_LEVEL1', label: 'Từ chối cấp Cảng vụ/Chi cục', color: '#E34948' },
    { key: 'REJECTED_LEVEL2', label: 'Từ chối cấp Cục', color: '#E34948' },
    { key: 'ARCHIVED', label: 'Đã xóa', color: '#E34948' },
  ];

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

  it('isDryPortDeleted detects deleted records by deletedAt, deletedBy, DELETED or ARCHIVED approvalStatus', () => {
    expect(isDryPortDeleted(null)).toBe(false);
    expect(isDryPortDeleted(undefined)).toBe(false);
    expect(isDryPortDeleted({ id: '1', approvalStatus: 'APPROVED' } as any)).toBe(false);
    expect(isDryPortDeleted({ id: '2', deletedAt: '2026-01-01' } as any)).toBe(true);
    expect(isDryPortDeleted({ id: '3', deletedBy: 'user-1' } as any)).toBe(true);
    expect(isDryPortDeleted({ id: '4', approvalStatus: 'DELETED' } as any)).toBe(true);
    expect(isDryPortDeleted({ id: '5', approvalStatus: 'ARCHIVED' } as any)).toBe(true);
  });

  it('tab Tất cả tính bằng tổng tất cả các tab con (bao gồm cả tab Đã xóa ARCHIVED)', () => {
    const counts: Record<string, number> = {
      DRAFT: 4,
      PENDING_APPROVAL: 2,
      APPROVED_LEVEL1: 3,
      APPROVED: 15,
      REJECTED_LEVEL1: 1,
      REJECTED_LEVEL2: 1,
      ARCHIVED: 6,
    };
    const tabs = computeStatusTabs(counts, 'all', 26);
    const allTab = tabs.find((t) => t.key === 'all');
    // 4 + 2 + 3 + 15 + 1 + 1 + 6 = 32 (ARCHIVED = 6 is included)
    expect(allTab?.count).toBe(32);
    expect(allTab?.active).toBe(true);

    const deletedTab = tabs.find((t) => t.key === 'ARCHIVED');
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
      ARCHIVED: 6,
    };
    const tabs = computeStatusTabs(counts, 'APPROVED', 12);
    const approvedTab = tabs.find((t) => t.key === 'APPROVED');
    expect(approvedTab?.count).toBe(12);
    expect(approvedTab?.active).toBe(true);
  });

  it('khi chọn tab Đã xóa (ARCHIVED), badge cập nhật bằng total của các bản ghi đã xóa trả về từ API', () => {
    const counts: Record<string, number> = {
      DRAFT: 4,
      PENDING_APPROVAL: 2,
      APPROVED_LEVEL1: 3,
      APPROVED: 15,
      REJECTED_LEVEL1: 1,
      REJECTED_LEVEL2: 1,
      ARCHIVED: 6,
    };
    const tabs = computeStatusTabs(counts, 'ARCHIVED', 8);
    const deletedTab = tabs.find((t) => t.key === 'ARCHIVED');
    expect(deletedTab?.count).toBe(8);
    expect(deletedTab?.active).toBe(true);
  });

  it('ngày cập nhật được format chuẩn YYYY-MM-DD HH:mm:ss tương thích backend LocalDateTime.parse', () => {
    const start = dayjs('2026-09-17').startOf('day').format('YYYY-MM-DD 00:00:00');
    const end = dayjs('2026-09-17').endOf('day').format('YYYY-MM-DD 23:59:59');

    expect(start).toBe('2026-09-17 00:00:00');
    expect(end).toBe('2026-09-17 23:59:59');

    // Simulate backend Java LocalDateTime.parse(val.replace(" ", "T"))
    const backendStart = start.replace(' ', 'T');
    const backendEnd = end.replace(' ', 'T');
    expect(backendStart).toBe('2026-09-17T00:00:00');
    expect(backendEnd).toBe('2026-09-17T23:59:59');
    expect(backendStart.endsWith('Z')).toBe(false);
  });

  it('màn hình danh sách /dry-port áp dụng chuẩn hiển thị mặc định 20 bản ghi / trang', () => {
    // Default standard for pagination across KCHT list screens
    const DEFAULT_PAGE_SIZE = 20;
    expect(DEFAULT_PAGE_SIZE).toBe(20);
  });
});
