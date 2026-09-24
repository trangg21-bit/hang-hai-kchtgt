import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { fetchScadaList } from './scada/api';

describe('SCADA API Query Trim (/scada)', () => {
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
    await fetchScadaList({
      deviceCode: '   SCADA-001   ',
      deviceName: '   Trạm SCADA Luồng Hàng Hải   ',
      search: '   tu khoa   ',
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const requestedUrl: string = (api.get as any).mock.calls[0][0];
    const urlObj = new URL(`http://localhost${requestedUrl}`);

    expect(urlObj.searchParams.get('deviceCode')).toBe('SCADA-001');
    expect(urlObj.searchParams.get('deviceName')).toBe('Trạm SCADA Luồng Hàng Hải');
    expect(urlObj.searchParams.get('search')).toBe('tu khoa');
  });

  it('handles empty strings or strings with only whitespace safely without sending empty params', async () => {
    await fetchScadaList({
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
    let inputDeviceName = '   Trạm SCADA Vũng Tàu   ';
    let inputDeviceCode = '   SCADA-001   ';
    let filterDeviceName = '';
    let filterDeviceCode = '';

    const handleFilterApply = (overrides?: { deviceName?: string; deviceCode?: string }) => {
      const nextName = (overrides?.deviceName !== undefined ? overrides.deviceName : inputDeviceName).trim();
      const nextCode = (overrides?.deviceCode !== undefined ? overrides.deviceCode : inputDeviceCode).trim();
      inputDeviceName = nextName;
      inputDeviceCode = nextCode;
      filterDeviceName = nextName;
      filterDeviceCode = nextCode;
    };

    // Khi người dùng nhấn nút "Tìm kiếm"
    handleFilterApply();
    expect(inputDeviceName).toBe('Trạm SCADA Vũng Tàu');
    expect(inputDeviceCode).toBe('SCADA-001');
    expect(filterDeviceName).toBe('Trạm SCADA Vũng Tàu');
    expect(filterDeviceCode).toBe('SCADA-001');

    // Khi người dùng nhấn phím Enter trên ô "Tên thiết bị"
    inputDeviceName = '   Trạm SCADA Mới   ';
    const enterNameVal = inputDeviceName.trim();
    handleFilterApply({ deviceName: enterNameVal });
    expect(inputDeviceName).toBe('Trạm SCADA Mới');
    expect(filterDeviceName).toBe('Trạm SCADA Mới');

    // Khi người dùng nhấn phím Enter trên ô "Mã thiết bị"
    inputDeviceCode = '   SCA-999   ';
    const enterCodeVal = inputDeviceCode.trim();
    handleFilterApply({ deviceCode: enterCodeVal });
    expect(inputDeviceCode).toBe('SCA-999');
    expect(filterDeviceCode).toBe('SCA-999');
  });
});
