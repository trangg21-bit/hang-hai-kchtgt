import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { navigationChannelCRUD } from './navigationChannelService';

describe('NavigationChannel Vietnamese Alphabetical Sorting (/navigation-channel)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'get').mockResolvedValue({
      data: {
        data: {
          results: [],
          totalElements: 0,
          totalPages: 0,
          currentPage: 0,
          pageSize: 20,
        },
      },
    });
  });

  it('correctly compares navigation channel names in Vietnamese alphabetical order (A < B < C < D < Đ < ... < V)', () => {
    const list = [
      { channelName: 'Vũng Tàu - Thị Vải' },
      { channelName: 'Đà Nẵng' },
      { channelName: 'Duyên Hải' },
      { channelName: 'Cửa Lò' },
      { channelName: 'Đồng Nai' },
      { channelName: 'An Thới' },
      { channelName: 'Ba Ngòi' },
    ];

    const sortedAsc = [...list].sort((a, b) =>
      (a.channelName || '').localeCompare(b.channelName || '', 'vi')
    );

    expect(sortedAsc.map((x) => x.channelName)).toEqual([
      'An Thới',
      'Ba Ngòi',
      'Cửa Lò',
      'Duyên Hải',
      'Đà Nẵng',
      'Đồng Nai',
      'Vũng Tàu - Thị Vải',
    ]);

    // Đảm bảo chữ D đứng trước chữ Đ, và Đ đứng trước chữ V
    const idxD = sortedAsc.findIndex((x) => x.channelName === 'Duyên Hải');
    const idxDaNang = sortedAsc.findIndex((x) => x.channelName === 'Đà Nẵng');
    const idxDongNai = sortedAsc.findIndex((x) => x.channelName === 'Đồng Nai');
    const idxV = sortedAsc.findIndex((x) => x.channelName === 'Vũng Tàu - Thị Vải');

    expect(idxD).toBeLessThan(idxDaNang);
    expect(idxDaNang).toBeLessThan(idxDongNai);
    expect(idxDongNai).toBeLessThan(idxV);
  });

  it('correctly sorts in descending order (Z -> A Vietnamese)', () => {
    const list = [
      { channelName: 'An Thới' },
      { channelName: 'Duyên Hải' },
      { channelName: 'Đà Nẵng' },
      { channelName: 'Vũng Tàu - Thị Vải' },
    ];

    const sortedDesc = [...list].sort((a, b) =>
      (b.channelName || '').localeCompare(a.channelName || '', 'vi')
    );

    expect(sortedDesc.map((x) => x.channelName)).toEqual([
      'Vũng Tàu - Thị Vải',
      'Đà Nẵng',
      'Duyên Hải',
      'An Thới',
    ]);
  });

  it('correctly compares managing unit names in Vietnamese alphabetical order', () => {
    const list = [
      { orgUnitName: 'Công ty TNHH MTV Bảo đảm An toàn Hàng hải Miền Nam' },
      { orgUnitName: 'Cảng vụ Hàng hải Đà Nẵng' },
      { orgUnitName: 'Cảng vụ Hàng hải Hải Phòng' },
      { orgUnitName: 'Cảng vụ Hàng hải Đồng Nai' },
    ];

    const sortedAsc = [...list].sort((a, b) =>
      (a.orgUnitName || '').localeCompare(b.orgUnitName || '', 'vi')
    );

    expect(sortedAsc.map((x) => x.orgUnitName)).toEqual([
      'Cảng vụ Hàng hải Đà Nẵng',
      'Cảng vụ Hàng hải Đồng Nai',
      'Cảng vụ Hàng hải Hải Phòng',
      'Công ty TNHH MTV Bảo đảm An toàn Hàng hải Miền Nam',
    ]);
  });

  it('sends sortBy=channelName and sortDir=ASC to search API when sorting A-Z', async () => {
    await navigationChannelCRUD.search({
      page: 0,
      size: 20,
      sortBy: 'channelName',
      sortDir: 'ASC',
      sortField: 'channelName',
      sortOrder: 'asc',
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(api.get).mock.calls[0];
    const path = callArgs[0];
    const config = callArgs[1] as { params?: Record<string, unknown> } | undefined;

    expect(path).toBe('/v1/navigation-channel/search');
    expect(config?.params?.sortBy).toBe('channelName');
    expect(config?.params?.sortDir).toBe('ASC');
  });

  it('sends sortBy=channelName and sortDir=DESC to search API when sorting Z-A', async () => {
    await navigationChannelCRUD.search({
      page: 0,
      size: 20,
      sortBy: 'channelName',
      sortDir: 'DESC',
      sortField: 'channelName',
      sortOrder: 'desc',
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(api.get).mock.calls[0];
    const path = callArgs[0];
    const config = callArgs[1] as { params?: Record<string, unknown> } | undefined;

    expect(path).toBe('/v1/navigation-channel/search');
    expect(config?.params?.sortBy).toBe('channelName');
    expect(config?.params?.sortDir).toBe('DESC');
  });

  it('correctly compares seaport names and province names in Vietnamese alphabetical order', () => {
    const seaports = [
      { portName: 'Cảng biển Vũng Tàu' },
      { portName: 'Cảng biển Đà Nẵng' },
      { portName: 'Cảng biển Duyên Hải' },
      { portName: 'Cảng biển An Thới' },
    ];
    const sortedPorts = [...seaports].sort((a, b) =>
      a.portName.localeCompare(b.portName, 'vi')
    );
    expect(sortedPorts.map((x) => x.portName)).toEqual([
      'Cảng biển An Thới',
      'Cảng biển Duyên Hải',
      'Cảng biển Đà Nẵng',
      'Cảng biển Vũng Tàu',
    ]);

    const provinces = [
      { name: 'Đồng Nai' },
      { name: 'Đà Nẵng' },
      { name: 'Bà Rịa - Vũng Tàu' },
      { name: 'An Giang' },
    ];
    const sortedProvinces = [...provinces].sort((a, b) =>
      a.name.localeCompare(b.name, 'vi')
    );
    expect(sortedProvinces.map((x) => x.name)).toEqual([
      'An Giang',
      'Bà Rịa - Vũng Tàu',
      'Đà Nẵng',
      'Đồng Nai',
    ]);
  });

  it('sorts conditionStatus by operational lifecycle/ordinal, NOT by Vietnamese alphabetical order', () => {
    const conditionOrder: Record<string, number> = {
      OPERATIONAL: 0,
      STOPPED: 1,
      MAINTENANCE: 2,
      UNDER_CONSTRUCTION: 3,
      NOT_YET_OPERATIONAL: 4,
      SUSPENDED: 5,
    };
    const list = [
      { conditionStatus: 'NOT_YET_OPERATIONAL' }, // Chưa khai thác (C)
      { conditionStatus: 'OPERATIONAL' }, // Đang khai thác (Đ)
      { conditionStatus: 'STOPPED' }, // Dừng khai thác (D)
      { conditionStatus: 'MAINTENANCE' }, // Bảo trì (B)
    ];

    const sortedByOrdinal = [...list].sort((a, b) =>
      (conditionOrder[a.conditionStatus] ?? 99) - (conditionOrder[b.conditionStatus] ?? 99)
    );

    // OPERATIONAL (0) < STOPPED (1) < MAINTENANCE (2) < NOT_YET_OPERATIONAL (4)
    expect(sortedByOrdinal.map((x) => x.conditionStatus)).toEqual([
      'OPERATIONAL',
      'STOPPED',
      'MAINTENANCE',
      'NOT_YET_OPERATIONAL',
    ]);
  });

  it('sorts approvalStatus by approval lifecycle, NOT by Vietnamese alphabetical order', () => {
    const approvalOrder: Record<string, number> = {
      DRAFT: 1,
      PENDING_APPROVAL: 2,
      PENDING_LEVEL1: 2,
      SUBMITTED: 2,
      APPROVED_LEVEL1: 3,
      PENDING_LEVEL2: 3,
      APPROVED: 4,
      APPROVED_LEVEL2: 4,
      REJECTED_LEVEL1: 5,
      REJECTED: 6,
      REJECTED_LEVEL2: 6,
      ARCHIVED: 7,
      DELETED: 7,
    };
    const list = [
      { approvalStatus: 'ARCHIVED' }, // Đã xóa
      { approvalStatus: 'APPROVED' }, // Đã phê duyệt
      { approvalStatus: 'DRAFT' }, // Lưu tạm
      { approvalStatus: 'PENDING_APPROVAL' }, // Chờ phê duyệt cấp C1
    ];

    const sortedByLifecycle = [...list].sort((a, b) =>
      (approvalOrder[a.approvalStatus] ?? 99) - (approvalOrder[b.approvalStatus] ?? 99)
    );

    // DRAFT (1) < PENDING_APPROVAL (2) < APPROVED (4) < ARCHIVED (7)
    expect(sortedByLifecycle.map((x) => x.approvalStatus)).toEqual([
      'DRAFT',
      'PENDING_APPROVAL',
      'APPROVED',
      'ARCHIVED',
    ]);
  });

  it('sorts "Cán bộ ..." columns by attached date/timestamp, NOT by actor name', () => {
    const records = [
      {
        channelName: 'Channel A',
        updatedBy: 'Nguyễn Văn An', // Tên bắt đầu bằng A nhưng ngày trễ hơn
        updatedAt: '2026-09-20T10:00:00Z',
        submittedBy: 'Bùi Văn Ba',
        submittedAt: '2026-09-18T10:00:00Z',
        approverLevel1: 'Trần Văn Tùng',
        approvedDateLevel1: '2026-09-19T08:00:00Z',
      },
      {
        channelName: 'Channel B',
        updatedBy: 'Vũ Văn Vinh', // Tên bắt đầu bằng V nhưng ngày sớm hơn
        updatedAt: '2026-09-10T10:00:00Z',
        submittedBy: 'Đỗ Văn Đạt',
        submittedAt: '2026-09-08T10:00:00Z',
        approverLevel1: 'Lê Văn Long',
        approvedDateLevel1: '2026-09-09T08:00:00Z',
      },
    ];

    // Sắp xếp cột "Cán bộ cập nhật" theo Ngày cập nhật đi kèm
    const sortedByUpdatedDate = [...records].sort((a, b) =>
      new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    );
    expect(sortedByUpdatedDate[0].channelName).toBe('Channel B'); // Ngày 10/09 sớm hơn 20/09
    expect(sortedByUpdatedDate[1].channelName).toBe('Channel A');

    // Sắp xếp cột "Cán bộ gửi phê duyệt" theo Ngày gửi đi kèm
    const sortedBySubmittedDate = [...records].sort((a, b) =>
      new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    );
    expect(sortedBySubmittedDate[0].channelName).toBe('Channel B'); // Ngày 08/09 sớm hơn 18/09
    expect(sortedBySubmittedDate[1].channelName).toBe('Channel A');

    // Sắp xếp cột "Cán bộ phê duyệt C1" theo Ngày phê duyệt C1 đi kèm
    const sortedByApprovedDate1 = [...records].sort((a, b) =>
      new Date(a.approvedDateLevel1).getTime() - new Date(b.approvedDateLevel1).getTime()
    );
    expect(sortedByApprovedDate1[0].channelName).toBe('Channel B'); // Ngày 09/09 sớm hơn 19/09
    expect(sortedByApprovedDate1[1].channelName).toBe('Channel A');
  });

  it('sends sortBy=updatedAt and sortDir=DESC to search API when default sort is applied', async () => {
    await navigationChannelCRUD.search({
      page: 0,
      size: 20,
      sortBy: 'updatedAt',
      sortDir: 'DESC',
      sortField: 'updatedAt',
      sortOrder: 'desc',
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(api.get).mock.calls[0];
    const path = callArgs[0];
    const config = callArgs[1] as { params?: Record<string, unknown> } | undefined;

    expect(path).toBe('/v1/navigation-channel/search');
    expect(config?.params?.sortBy).toBe('updatedAt');
    expect(config?.params?.sortDir).toBe('DESC');
    expect(config?.params?.sortField).toBe('updatedAt');
    expect(config?.params?.sortOrder).toBe('desc');
  });

  it('correctly transitions sortOrder through full 3-state cycle including null (desc -> null -> asc -> desc -> null)', () => {
    let sortField: string | undefined = 'updatedAt';
    let sortOrder: 'asc' | 'desc' | null = 'desc';

    const handleSort = (key: string, order: 'asc' | 'desc' | null) => {
      if (!order) {
        sortField = undefined;
        sortOrder = null;
      } else {
        sortField = key;
        sortOrder = order;
      }
    };

    const getNextSortOrder = (current: 'asc' | 'desc' | null): 'asc' | 'desc' | null => {
      if (current === 'asc') return 'desc';
      if (current === 'desc') return null;
      return 'asc';
    };

    // 0. Ban đầu: sortField = 'updatedAt', sortOrder = 'desc'
    expect(sortField).toBe('updatedAt');
    expect(sortOrder).toBe('desc');

    // 1. Click lần 1 vào header "Cán bộ cập nhật": từ desc -> nextOrder là null (trạng thái null: bỏ sắp xếp)
    handleSort('updatedAt', getNextSortOrder(sortOrder));
    expect(sortField).toBeUndefined();
    expect(sortOrder).toBeNull();

    // 2. Click lần 2 vào header "Cán bộ cập nhật": từ null -> nextOrder là asc (sắp xếp tăng dần)
    handleSort('updatedAt', getNextSortOrder(sortOrder));
    expect(sortField).toBe('updatedAt');
    expect(sortOrder).toBe('asc');

    // 3. Click lần 3 vào header "Cán bộ cập nhật": từ asc -> nextOrder là desc (sắp xếp giảm dần)
    handleSort('updatedAt', getNextSortOrder(sortOrder));
    expect(sortField).toBe('updatedAt');
    expect(sortOrder).toBe('desc');

    // 4. Click lần 4 vào header "Cán bộ cập nhật": từ desc -> quay về null (bỏ sắp xếp)
    handleSort('updatedAt', getNextSortOrder(sortOrder));
    expect(sortField).toBeUndefined();
    expect(sortOrder).toBeNull();

    // 5. Click cột khác (ví dụ "Tên luồng"): chu kỳ 3 bước chuẩn
    // Click 1: asc
    handleSort('channelName', getNextSortOrder(null));
    expect(sortField).toBe('channelName');
    expect(sortOrder).toBe('asc');

    // Click 2: desc
    handleSort('channelName', getNextSortOrder(sortOrder));
    expect(sortField).toBe('channelName');
    expect(sortOrder).toBe('desc');

    // Click 3: null -> xóa sort về mặc định (undefined, null)
    handleSort('channelName', getNextSortOrder(sortOrder));
    expect(sortField).toBeUndefined();
    expect(sortOrder).toBeNull();
  });
});