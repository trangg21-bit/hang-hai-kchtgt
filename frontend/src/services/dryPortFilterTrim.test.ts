import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { dryPortCRUD } from './portService';

describe('Dry Port API Query Trim (/dry-port)', () => {
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

  it('trims whitespace from search and code before sending request', async () => {
    await dryPortCRUD.findAll({
      search: '   Cảng cạn Đình Vũ   ',
      code: '   CC-000001   ',
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const requestedUrl: string = (api.get as any).mock.calls[0][0];
    const urlObj = new URL(`http://localhost${requestedUrl}`);

    expect(urlObj.searchParams.get('search')).toBe('Cảng cạn Đình Vũ');
    expect(urlObj.searchParams.get('code')).toBe('CC-000001');
  });

  it('handles empty strings or strings with only whitespace safely without sending empty params', async () => {
    await dryPortCRUD.findAll({
      search: '     ',
      code: '     ',
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const requestedUrl: string = (api.get as any).mock.calls[0][0];
    const urlObj = new URL(`http://localhost${requestedUrl}`);

    expect(urlObj.searchParams.get('search')).toBeNull();
    expect(urlObj.searchParams.get('code')).toBeNull();
  });
});
