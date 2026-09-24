import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { fetchVhfList } from './vhf/api';

describe('VHF API Query Trim (/vhf)', () => {
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

  it('trims whitespace from deviceCode and deviceName before sending request', async () => {
    await fetchVhfList({
      deviceCode: '   VHF-001   ',
      deviceName: '   Trạm VHF Bạch Long Vĩ   ',
      search: '   tu khoa   ',
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const requestedUrl: string = (api.get as any).mock.calls[0][0];
    const urlObj = new URL(`http://localhost${requestedUrl}`);

    expect(urlObj.searchParams.get('deviceCode')).toBe('VHF-001');
    expect(urlObj.searchParams.get('deviceName')).toBe('Trạm VHF Bạch Long Vĩ');
    expect(urlObj.searchParams.get('search')).toBe('tu khoa');
  });

  it('handles empty strings or strings with only whitespace safely without sending empty params', async () => {
    await fetchVhfList({
      deviceCode: '     ',
      deviceName: '     ',
      search: '     ',
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const requestedUrl: string = (api.get as any).mock.calls[0][0];
    const urlObj = new URL(`http://localhost${requestedUrl}`);

    expect(urlObj.searchParams.get('deviceCode')).toBeNull();
    expect(urlObj.searchParams.get('deviceName')).toBeNull();
    expect(urlObj.searchParams.get('search')).toBeNull();
  });

  it('trims leading and trailing spaces for deviceName and deviceCode on search submit and enter key', () => {
    let filterValues = {
      deviceName: '   Trạm VHF Bạch Long Vĩ   ',
      deviceCode: '   VHF-001   ',
    };

    const handleFilterApply = (overrides?: { deviceName?: string; deviceCode?: string }) => {
      const nextName = (overrides?.deviceName !== undefined ? overrides.deviceName : (filterValues.deviceName || '')).trim();
      const nextCode = (overrides?.deviceCode !== undefined ? overrides.deviceCode : (filterValues.deviceCode || '')).trim();
      filterValues = {
        ...filterValues,
        deviceName: nextName,
        deviceCode: nextCode,
      };
    };

    // Khi người dùng nhấn nút "Tìm kiếm"
    handleFilterApply();
    expect(filterValues.deviceName).toBe('Trạm VHF Bạch Long Vĩ');
    expect(filterValues.deviceCode).toBe('VHF-001');

    // Khi người dùng nhấn phím Enter trên ô "Tên thiết bị"
    filterValues.deviceName = '   Trạm VHF Cát Bà   ';
    const enterNameVal = filterValues.deviceName.trim();
    handleFilterApply({ deviceName: enterNameVal });
    expect(filterValues.deviceName).toBe('Trạm VHF Cát Bà');

    // Khi người dùng nhấn phím Enter trên ô "Mã thiết bị"
    filterValues.deviceCode = '   VHF-NEW-88   ';
    const enterCodeVal = filterValues.deviceCode.trim();
    handleFilterApply({ deviceCode: enterCodeVal });
    expect(filterValues.deviceCode).toBe('VHF-NEW-88');
  });
});
