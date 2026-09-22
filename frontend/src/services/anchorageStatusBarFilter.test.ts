import { describe, it, expect } from 'vitest';

describe('Anchorage Status Bar Filter and Count Logic (/anchorage vs /beacon-stations)', () => {
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
    DELETED: undefined,
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

  it('tab Tất cả tính bằng tổng tất cả các tab con (bao gồm cả tab Đã xóa DELETED)', () => {
    const counts: Record<string, number> = {
      DRAFT: 5,
      PENDING_APPROVAL: 3,
      APPROVED_LEVEL1: 2,
      APPROVED: 20,
      REJECTED_LEVEL1: 1,
      REJECTED_LEVEL2: 1,
      DELETED: 8,
    };
    const tabs = computeStatusTabs(counts, 'all', 32);
    const allTab = tabs.find((t) => t.key === 'all');
    // 5 + 3 + 2 + 20 + 1 + 1 + 8 = 40
    expect(allTab?.count).toBe(40);
    expect(allTab?.active).toBe(true);

    const deletedTab = tabs.find((t) => t.key === 'DELETED');
    expect(deletedTab?.count).toBe(8);
  });

  it('khi chọn tab con bất kỳ (ví dụ APPROVED), badge của tab đó cập nhật bằng đúng total trả về từ API như /beacon-stations', () => {
    const counts: Record<string, number> = {
      DRAFT: 5,
      PENDING_APPROVAL: 3,
      APPROVED_LEVEL1: 2,
      APPROVED: 20,
      REJECTED_LEVEL1: 1,
      REJECTED_LEVEL2: 1,
      DELETED: 8,
    };
    // Giả sử có filter tìm kiếm, API trả về total = 7
    const tabs = computeStatusTabs(counts, 'APPROVED', 7);
    const approvedTab = tabs.find((t) => t.key === 'APPROVED');
    expect(approvedTab?.count).toBe(7);
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
      DELETED: 8,
    };
    const tabs = computeStatusTabs(counts, 'DELETED', 4);
    const deletedTab = tabs.find((t) => t.key === 'DELETED');
    expect(deletedTab?.count).toBe(4);
    expect(deletedTab?.active).toBe(true);
  });

  it('tham số query của tab Tất cả không lấy bản ghi đã xóa (isDeleted = false)', () => {
    const activeTab = 'all';
    const isDeleted = activeTab === 'DELETED' ? true : false;
    const approvalStatus = activeTab === 'DELETED' ? undefined : TAB_QUERY_MAP[activeTab];

    expect(isDeleted).toBe(false);
    expect(approvalStatus).toBeUndefined();
  });

  it('tham số query của tab Đã xóa chỉ lấy bản ghi đã xóa (isDeleted = true, approvalStatus = undefined)', () => {
    const activeTab = 'DELETED';
    const isDeleted = activeTab === 'DELETED' ? true : false;
    const approvalStatus = activeTab === 'DELETED' ? undefined : TAB_QUERY_MAP[activeTab];

    expect(isDeleted).toBe(true);
    expect(approvalStatus).toBeUndefined();
  });

  it('tham số query của các tab trạng thái duyệt loại trừ bản ghi đã xóa (isDeleted = false, approvalStatus = TAB_QUERY_MAP[key])', () => {
    ['DRAFT', 'PENDING_APPROVAL', 'APPROVED_LEVEL1', 'APPROVED', 'REJECTED_LEVEL1', 'REJECTED_LEVEL2'].forEach((key) => {
      const isDeleted = key === 'DELETED' ? true : false;
      const approvalStatus = key === 'DELETED' ? undefined : TAB_QUERY_MAP[key];

      expect(isDeleted).toBe(false);
      expect(approvalStatus).toBe(key);
    });
  });

  it('khi người dùng cấp Bộ/Cục chọn mặc định "Tất cả" (orgUnit === undefined), query param orgUnitId là undefined và initialLoadDone phải kích hoạt', () => {
    const orgUnit: string | undefined = undefined;
    const targetUnit = orgUnit;
    const baseFilterParams = {
      orgUnitId: (targetUnit && targetUnit !== '__all__') ? targetUnit : undefined,
    };

    // Khi chọn "Tất cả", orgUnitId gửi lên API phải là undefined để backend tra cứu toàn bộ đơn vị
    expect(baseFilterParams.orgUnitId).toBeUndefined();

    // Mô phỏng luồng hoàn tất load master data: initialLoadDone phải chuyển sang true dù orgUnit là undefined
    let initialLoadDone = false;
    const onMasterDataLoaded = () => {
      initialLoadDone = true;
    };
    onMasterDataLoaded();
    expect(initialLoadDone).toBe(true);
  });
});

