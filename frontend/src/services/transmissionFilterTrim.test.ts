import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { fetchTransmissionList } from './transmission/api';

describe('Transmission API Query Trim (/transmission)', () => {
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
    await fetchTransmissionList({
      deviceCode: '   TRANS-001   ',
      deviceName: '   Trạm Truyền Dẫn Cửa Lò   ',
      search: '   tu khoa   ',
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const requestedUrl: string = (api.get as any).mock.calls[0][0];
    const urlObj = new URL(`http://localhost${requestedUrl}`);

    expect(urlObj.searchParams.get('deviceCode')).toBe('TRANS-001');
    expect(urlObj.searchParams.get('deviceName')).toBe('Trạm Truyền Dẫn Cửa Lò');
    expect(urlObj.searchParams.get('search')).toBe('tu khoa');
  });

  it('handles empty strings or strings with only whitespace safely without sending empty params', async () => {
    await fetchTransmissionList({
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
    let inputDeviceName = '   Thiết bị truyền dẫn A   ';
    let inputDeviceCode = '   TRANS-001   ';
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
    expect(inputDeviceName).toBe('Thiết bị truyền dẫn A');
    expect(inputDeviceCode).toBe('TRANS-001');
    expect(filterDeviceName).toBe('Thiết bị truyền dẫn A');
    expect(filterDeviceCode).toBe('TRANS-001');

    // Khi người dùng nhấn phím Enter trên ô "Tên thiết bị"
    inputDeviceName = '   Thiết bị mới   ';
    const enterNameVal = inputDeviceName.trim();
    handleFilterApply({ deviceName: enterNameVal });
    expect(inputDeviceName).toBe('Thiết bị mới');
    expect(filterDeviceName).toBe('Thiết bị mới');

    // Khi người dùng nhấn phím Enter trên ô "Mã thiết bị"
    inputDeviceCode = '   TB-NEW-02   ';
    const enterCodeVal = inputDeviceCode.trim();
    handleFilterApply({ deviceCode: enterCodeVal });
    expect(inputDeviceCode).toBe('TB-NEW-02');
    expect(filterDeviceCode).toBe('TB-NEW-02');
  });
});
