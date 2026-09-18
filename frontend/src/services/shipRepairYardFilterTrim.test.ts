import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { shipRepairYardCRUD } from './portService';

describe('Ship Repair Yard API Query Trim (/ship-repair-yard)', () => {
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

  it('trims whitespace from shipRepairYardCode and shipRepairYardName before sending request', async () => {
    await shipRepairYardCRUD.search({
      shipRepairYardCode: '   SC-01-HP   ',
      shipRepairYardName: '   Nhà máy đóng tàu Bạch Đằng   ',
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const requestedUrl: string = (api.get as any).mock.calls[0][0];
    const urlObj = new URL(`http://localhost${requestedUrl}`);

    expect(urlObj.searchParams.get('shipRepairYardCode')).toBe('SC-01-HP');
    expect(urlObj.searchParams.get('shipRepairYardName')).toBe('Nhà máy đóng tàu Bạch Đằng');
  });

  it('handles empty strings or strings with only whitespace safely without sending empty params', async () => {
    await shipRepairYardCRUD.search({
      shipRepairYardCode: '     ',
      shipRepairYardName: '     ',
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const requestedUrl: string = (api.get as any).mock.calls[0][0];
    const urlObj = new URL(`http://localhost${requestedUrl}`);

    expect(urlObj.searchParams.get('shipRepairYardCode')).toBeNull();
    expect(urlObj.searchParams.get('shipRepairYardName')).toBeNull();
  });
});
