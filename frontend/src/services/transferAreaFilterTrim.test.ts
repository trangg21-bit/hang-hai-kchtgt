import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { transferAreaCRUD } from './portService';

describe('Transfer Area API Query Trim (/transfer-area)', () => {
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

  it('trims whitespace from transferAreaName and transferAreaCode before sending request', async () => {
    await transferAreaCRUD.search({
      transferAreaName: '   Khu chuyển tải Hòn Gai   ',
      transferAreaCode: '   BC-01-CT-01   ',
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const requestedUrl: string = (api.get as any).mock.calls[0][0];
    const urlObj = new URL(`http://localhost${requestedUrl}`);

    expect(urlObj.searchParams.get('transferAreaName')).toBe('Khu chuyển tải Hòn Gai');
    expect(urlObj.searchParams.get('transferAreaCode')).toBe('BC-01-CT-01');
  });

  it('handles empty strings or strings with only whitespace safely without sending empty params', async () => {
    await transferAreaCRUD.search({
      transferAreaName: '     ',
      transferAreaCode: '     ',
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const requestedUrl: string = (api.get as any).mock.calls[0][0];
    const urlObj = new URL(`http://localhost${requestedUrl}`);

    expect(urlObj.searchParams.get('transferAreaName')).toBeNull();
    expect(urlObj.searchParams.get('transferAreaCode')).toBeNull();
  });
});
