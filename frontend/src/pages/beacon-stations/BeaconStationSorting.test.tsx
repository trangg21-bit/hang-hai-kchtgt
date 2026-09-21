import { describe, it, expect, beforeEach, vi } from 'vitest';
import api from '../../services/api';
import { beaconStationCRUD } from '../../services/beaconService';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

describe('BeaconStation Sorting Logic (/beacon-stations)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gửi sortBy và sortDir lên endpoint /beacon-stations/search-paged khi gọi search', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: {
        data: {
          content: [],
          totalElements: 0,
          number: 0,
          size: 20,
        },
      },
    });

    await beaconStationCRUD.search({
      page: 1,
      pageSize: 20,
      sortBy: 'updatedByName',
      sortDir: 'DESC',
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const requestedUrl = (api.get as any).mock.calls[0][0];
    expect(requestedUrl).toContain('/beacon-stations/search-paged?');
    expect(requestedUrl).toContain('sortBy=updatedByName');
    expect(requestedUrl).toContain('sortDir=DESC');
  });

  it('gửi đúng tham số khi sort theo tên A->Z', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: {
        data: {
          content: [],
          totalElements: 0,
          number: 0,
          size: 20,
        },
      },
    });

    await beaconStationCRUD.search({
      page: 1,
      pageSize: 20,
      sortBy: 'name',
      sortDir: 'ASC',
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const requestedUrl = (api.get as any).mock.calls[0][0];
    expect(requestedUrl).toContain('sortBy=name');
    expect(requestedUrl).toContain('sortDir=ASC');
  });
});
