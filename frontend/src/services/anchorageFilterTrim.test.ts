import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { anchorageCRUD } from './portService';

describe('Anchorage API Query Trim (/anchorage)', () => {
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

  it('trims whitespace from anchorageCode and anchorageName before sending request', async () => {
    await anchorageCRUD.search({
      anchorageCode: '   BC-01-ND-01   ',
      anchorageName: '   Khu neo đậu Vũng Tàu   ',
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const requestedUrl: string = (api.get as any).mock.calls[0][0];
    const urlObj = new URL(`http://localhost${requestedUrl}`);

    expect(urlObj.searchParams.get('anchorageCode')).toBe('BC-01-ND-01');
    expect(urlObj.searchParams.get('anchorageName')).toBe('Khu neo đậu Vũng Tàu');
  });

  it('handles empty strings or strings with only whitespace safely without sending empty params', async () => {
    await anchorageCRUD.search({
      anchorageCode: '     ',
      anchorageName: '     ',
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const requestedUrl: string = (api.get as any).mock.calls[0][0];
    const urlObj = new URL(`http://localhost${requestedUrl}`);

    expect(urlObj.searchParams.get('anchorageCode')).toBeNull();
    expect(urlObj.searchParams.get('anchorageName')).toBeNull();
  });
});
