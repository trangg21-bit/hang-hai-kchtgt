import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { fetchVtsAssistList } from './vtsassist/api';

describe('VTS Assist API Query Trim (/vts-assist)', () => {
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

  it('trims whitespace from deviceCode, deviceName and search before sending request', async () => {
    await fetchVtsAssistList({
      deviceCode: '   VTS-ASSIST-001   ',
      deviceName: '   Trạm Phụ Trợ VTS Hòn Gai   ',
      search: '   tu khoa   ',
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const requestedUrl: string = vi.mocked(api.get).mock.calls[0][0] as string;
    const urlObj = new URL(`http://localhost${requestedUrl}`);

    expect(urlObj.searchParams.get('deviceCode')).toBe('VTS-ASSIST-001');
    expect(urlObj.searchParams.get('deviceName')).toBe('Trạm Phụ Trợ VTS Hòn Gai');
    expect(urlObj.searchParams.get('search')).toBe('tu khoa');
  });

  it('handles empty strings or strings with only whitespace safely without sending empty params', async () => {
    await fetchVtsAssistList({
      deviceCode: '     ',
      deviceName: '     ',
      search: '     ',
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const requestedUrl: string = vi.mocked(api.get).mock.calls[0][0] as string;
    const urlObj = new URL(`http://localhost${requestedUrl}`);

    expect(urlObj.searchParams.get('deviceCode')).toBeNull();
    expect(urlObj.searchParams.get('deviceName')).toBeNull();
    expect(urlObj.searchParams.get('search')).toBeNull();
  });
});
