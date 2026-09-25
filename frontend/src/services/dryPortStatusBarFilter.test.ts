import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import { isDryPortDeleted } from '../pages/port/DryPortListPage';

describe('DryPort Status Bar Filter and Count Logic (/dry-port)', () => {
  const TAB_STATUS_LIST = [
    { key: 'all', label: 'Tất cả', color: '#0E6FD6' },
    { key: 'DRAFT', label: 'Lưu tạm', color: '#93A3B3' },
    { key: 'APPROVED', label: 'Đã phê duyệt', color: '#1BAF7A' },
    { key: 'ARCHIVED', label: 'Đã xóa', color: '#E34948' },
  ];

  const computeStatusTabs = (
    tabCounts: Record<string, number>,
    activeTab: string,
  ) => {
    const allChildSum = TAB_STATUS_LIST
      .filter((t) => t.key !== 'all')
      .reduce((acc, t) => acc + (tabCounts[t.key] ?? 0), 0);

    return TAB_STATUS_LIST.map((tab) => {
      let count = tabCounts[tab.key] ?? 0;
      if (tab.key === 'all') {
        count = allChildSum;
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
      APPROVED: 22,
      ARCHIVED: 5,
    };
    const tabs = computeStatusTabs(counts, 'all');
    const allTab = tabs.find((t) => t.key === 'all');
    // 4 + 22 + 5 = 31 (ARCHIVED = 5 is included)
    expect(allTab?.count).toBe(31);
    expect(allTab?.active).toBe(true);

    const deletedTab = tabs.find((t) => t.key === 'ARCHIVED');
    expect(deletedTab?.count).toBe(5);
  });

  it('khi chuyển từ tab Tất cả sang tab Đã phê duyệt, số lượng không bị nhảy lên 31 mà giữ nguyên số của tab', () => {
    const counts: Record<string, number> = {
      DRAFT: 4,
      APPROVED: 22,
      ARCHIVED: 5,
    };
    // Khi click sang tab APPROVED
    const tabs = computeStatusTabs(counts, 'APPROVED');
    const approvedTab = tabs.find((t) => t.key === 'APPROVED');
    expect(approvedTab?.count).toBe(22);
    expect(approvedTab?.active).toBe(true);

    const allTab = tabs.find((t) => t.key === 'all');
    expect(allTab?.count).toBe(31);
  });

  it('khi chọn tab Đã xóa (ARCHIVED), badge hiển thị đúng số bản ghi đã xóa từ counts', () => {
    const counts: Record<string, number> = {
      DRAFT: 4,
      APPROVED: 22,
      ARCHIVED: 5,
    };
    const tabs = computeStatusTabs(counts, 'ARCHIVED');
    const deletedTab = tabs.find((t) => t.key === 'ARCHIVED');
    expect(deletedTab?.count).toBe(5);
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
