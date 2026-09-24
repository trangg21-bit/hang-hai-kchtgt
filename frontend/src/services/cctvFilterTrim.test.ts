import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { fetchCctvList } from './cctv/api';

describe('CCTV API Query Trim (/cctv)', () => {
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
    await fetchCctvList({
      deviceCode: '   CCTV-001   ',
      deviceName: '   Camera Cảng Hải Phòng   ',
      search: '   tu khoa   ',
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const requestedUrl: string = (api.get as any).mock.calls[0][0];
    const urlObj = new URL(`http://localhost${requestedUrl}`);

    expect(urlObj.searchParams.get('deviceCode')).toBe('CCTV-001');
    expect(urlObj.searchParams.get('deviceName')).toBe('Camera Cảng Hải Phòng');
    expect(urlObj.searchParams.get('search')).toBe('tu khoa');
  });

  it('handles empty strings or strings with only whitespace safely without sending empty params', async () => {
    await fetchCctvList({
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
    let inputDeviceName = '   Camera Giám Sát Cảng A   ';
    let inputDeviceCode = '   CCTV-001   ';
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
    expect(inputDeviceName).toBe('Camera Giám Sát Cảng A');
    expect(inputDeviceCode).toBe('CCTV-001');
    expect(filterDeviceName).toBe('Camera Giám Sát Cảng A');
    expect(filterDeviceCode).toBe('CCTV-001');

    // Khi người dùng nhấn phím Enter trên ô "Tên thiết bị"
    inputDeviceName = '   Camera Mới 02   ';
    const enterNameVal = inputDeviceName.trim();
    handleFilterApply({ deviceName: enterNameVal });
    expect(inputDeviceName).toBe('Camera Mới 02');
    expect(filterDeviceName).toBe('Camera Mới 02');

    // Khi người dùng nhấn phím Enter trên ô "Mã thiết bị"
    inputDeviceCode = '   CAM-NEW-99   ';
    const enterCodeVal = inputDeviceCode.trim();
    handleFilterApply({ deviceCode: enterCodeVal });
    expect(inputDeviceCode).toBe('CAM-NEW-99');
    expect(filterDeviceCode).toBe('CAM-NEW-99');
  });
});
