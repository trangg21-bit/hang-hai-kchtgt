import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { pierCRUD, berthCRUD, stormShelterCRUD, buoyBerthCRUD, daiTtdhCRUD } from './portService';
import { navigationChannelCRUD } from './navigationChannelService';

describe('Server-Side Sorting Standard (Issue #163)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'get').mockResolvedValue({
      data: {
        data: {
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 20,
        },
      },
    });
  });

  it('pierCRUD.search passes sortBy and sortDir in query parameters', async () => {
    await pierCRUD.search({
      sortBy: 'pierName',
      sortDir: 'asc',
      page: 1,
      pageSize: 20,
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const requestedUrl: string = (api.get as any).mock.calls[0][0];
    const urlObj = new URL(`http://localhost${requestedUrl}`);
    expect(urlObj.pathname).toBe('/v1/piers');
    expect(urlObj.searchParams.get('sortBy')).toBe('pierName');
    expect(urlObj.searchParams.get('sortDir')).toBe('asc');
  });

  it('berthCRUD.search passes sortBy and sortDir in query parameters', async () => {
    await berthCRUD.search({
      sortBy: 'berthName',
      sortDir: 'desc',
      page: 1,
      pageSize: 20,
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const requestedUrl: string = (api.get as any).mock.calls[0][0];
    const urlObj = new URL(`http://localhost${requestedUrl}`);
    expect(urlObj.pathname).toBe('/v1/berths');
    expect(urlObj.searchParams.get('sortBy')).toBe('berthName');
    expect(urlObj.searchParams.get('sortDir')).toBe('desc');
  });

  it('stormShelterCRUD.search passes sortBy and sortDir in query parameters', async () => {
    await stormShelterCRUD.search({
      sortBy: 'stormShelterName',
      sortDir: 'asc',
      page: 1,
      pageSize: 20,
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const requestedUrl: string = (api.get as any).mock.calls[0][0];
    const urlObj = new URL(`http://localhost${requestedUrl}`);
    expect(urlObj.pathname).toBe('/v1/storm-shelter');
    expect(urlObj.searchParams.get('sortBy')).toBe('stormShelterName');
    expect(urlObj.searchParams.get('sortDir')).toBe('asc');
  });

  it('buoyBerthCRUD.search passes sortBy and sortDir in query parameters', async () => {
    await buoyBerthCRUD.search({
      sortBy: 'buoyBerthName',
      sortDir: 'desc',
      page: 1,
      pageSize: 20,
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const requestedUrl: string = (api.get as any).mock.calls[0][0];
    const urlObj = new URL(`http://localhost${requestedUrl}`);
    expect(urlObj.pathname).toBe('/v1/buoy-berth');
    expect(urlObj.searchParams.get('sortBy')).toBe('buoyBerthName');
    expect(urlObj.searchParams.get('sortDir')).toBe('desc');
  });

  it('daiTtdhCRUD.search passes sortBy and sortDir in query parameters', async () => {
    await daiTtdhCRUD.search({
      sortBy: 'daiTtdhName',
      sortDir: 'asc',
      page: 1,
      pageSize: 20,
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const requestedUrl: string = (api.get as any).mock.calls[0][0];
    const urlObj = new URL(`http://localhost${requestedUrl}`);
    expect(urlObj.pathname).toBe('/v1/dai-ttdh');
    expect(urlObj.searchParams.get('sortBy')).toBe('daiTtdhName');
    expect(urlObj.searchParams.get('sortDir')).toBe('asc');
  });

  it('navigationChannelCRUD.search passes sortBy and sortDir alongside sortField/sortOrder', async () => {
    await navigationChannelCRUD.search({
      sortField: 'channelName',
      sortOrder: 'asc',
      sortBy: 'channelName',
      sortDir: 'asc',
      page: 0,
      size: 20,
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const [path, config] = (api.get as any).mock.calls[0];
    expect(path).toBe('/v1/navigation-channel/search');
    expect(config.params.sortBy).toBe('channelName');
    expect(config.params.sortDir).toBe('asc');
    expect(config.params.sortField).toBe('channelName');
    expect(config.params.sortOrder).toBe('asc');
  });
});

import { isStatusOrConditionColumn } from '../components/list-view/DataTable';

describe('Status and Condition Column Sort Suppression', () => {
  it('identifies status and condition columns correctly', () => {
    expect(isStatusOrConditionColumn({ key: 'status', label: 'Trạng thái' })).toBe(true);
    expect(isStatusOrConditionColumn({ key: 'operationalStatus', label: 'Tình trạng' })).toBe(true);
    expect(isStatusOrConditionColumn({ dataIndex: 'approvalStatus', label: 'TRẠNG THÁI' })).toBe(true);
    expect(isStatusOrConditionColumn({ dataIndex: 'conditionStatus', label: 'TÌNH TRẠNG' })).toBe(true);
    expect(isStatusOrConditionColumn({ type: 'status' })).toBe(true);
    expect(isStatusOrConditionColumn({ label: 'Trạng thái phê duyệt' })).toBe(true);
    expect(isStatusOrConditionColumn({ label: 'Tình trạng hoạt động' })).toBe(true);
    expect(isStatusOrConditionColumn({ key: 'portStatus' })).toBe(true);
    expect(isStatusOrConditionColumn({ key: 'assetCondition' })).toBe(true);
  });

  it('does not flag normal business columns as status/condition', () => {
    expect(isStatusOrConditionColumn({ key: 'name', label: 'Tên bến cảng' })).toBe(false);
    expect(isStatusOrConditionColumn({ key: 'code', label: 'Mã số' })).toBe(false);
    expect(isStatusOrConditionColumn({ key: 'updatedByName', label: 'Cán bộ cập nhật' })).toBe(false);
    expect(isStatusOrConditionColumn({ key: 'submittedForApprovalAt', label: 'Thời gian gửi duyệt' })).toBe(false);
  });
});

