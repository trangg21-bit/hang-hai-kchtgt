import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { fetchCctvList } from './cctv/api';

describe('CCTV Sorting API and Field Mapping (/cctv)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'get').mockResolvedValue({
      data: {
        data: {
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 10,
        },
      },
    });
  });

  it('sends sortBy=attachedInfrastructureName and sortOrder=asc when sorting by Thuộc TTDH VTS/Trạm radar', async () => {
    await fetchCctvList({
      sortBy: 'attachedInfrastructureName',
      sortOrder: 'asc',
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const requestedUrl = String(vi.mocked(api.get).mock.calls[0][0]);
    const urlObj = new URL(`http://localhost${requestedUrl}`);

    expect(urlObj.searchParams.get('sortBy')).toBe('attachedInfrastructureName');
    expect(urlObj.searchParams.get('sortOrder')).toBe('asc');
  });

  it('sends sortBy=operatingUnitName and sortOrder=desc when sorting by Đơn vị khai thác', async () => {
    await fetchCctvList({
      sortBy: 'operatingUnitName',
      sortOrder: 'desc',
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const requestedUrl = String(vi.mocked(api.get).mock.calls[0][0]);
    const urlObj = new URL(`http://localhost${requestedUrl}`);

    expect(urlObj.searchParams.get('sortBy')).toBe('operatingUnitName');
    expect(urlObj.searchParams.get('sortOrder')).toBe('desc');
  });
});
