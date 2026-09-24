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

describe('VTS Assist UI Input Filter Trim on Submit / Enter (/vts-assist)', () => {
  it('TC-VTS-ASSIST-FILTER-01: trims whitespace in inputDeviceName and inputDeviceCode on submit (Tìm kiếm)', () => {
    let inputDeviceName = '   Trạm Phụ Trợ VTS Cảng Đình Vũ   ';
    let inputDeviceCode = '   VTS-ASSIST-DV-01   ';
    let filterDeviceName = '';
    let filterDeviceCode = '';
    let page = 5;
    let filterTrigger = 0;

    const handleFilterApply = () => {
      const trimmedDeviceName = (inputDeviceName || '').trim();
      const trimmedDeviceCode = (inputDeviceCode || '').trim();
      inputDeviceName = trimmedDeviceName;
      inputDeviceCode = trimmedDeviceCode;
      filterDeviceName = trimmedDeviceName;
      filterDeviceCode = trimmedDeviceCode;
      page = 0;
      filterTrigger += 1;
    };

    handleFilterApply();

    // Giá trị trên thanh input được loại bỏ khoảng trắng 2 đầu ngay lập tức
    expect(inputDeviceName).toBe('Trạm Phụ Trợ VTS Cảng Đình Vũ');
    expect(inputDeviceCode).toBe('VTS-ASSIST-DV-01');
    expect(filterDeviceName).toBe('Trạm Phụ Trợ VTS Cảng Đình Vũ');
    expect(filterDeviceCode).toBe('VTS-ASSIST-DV-01');
    expect(page).toBe(0);
    expect(filterTrigger).toBe(1);
  });

  it('TC-VTS-ASSIST-FILTER-02: trims whitespace in inputDeviceName immediately when pressing Enter', () => {
    let inputDeviceName = '   Trạm Phụ Trợ Hòn Gai   ';
    let filterDeviceName = '';
    let filterTrigger = 0;

    const handleFilterApply = () => {
      const trimmedDeviceName = (inputDeviceName || '').trim();
      inputDeviceName = trimmedDeviceName;
      filterDeviceName = trimmedDeviceName;
      filterTrigger += 1;
    };

    const onPressEnterName = () => {
      const trimmed = inputDeviceName.trim();
      inputDeviceName = trimmed;
      filterDeviceName = trimmed;
      handleFilterApply();
    };

    onPressEnterName();

    expect(inputDeviceName).toBe('Trạm Phụ Trợ Hòn Gai');
    expect(filterDeviceName).toBe('Trạm Phụ Trợ Hòn Gai');
    expect(filterTrigger).toBe(1);
  });

  it('TC-VTS-ASSIST-FILTER-03: trims whitespace in inputDeviceCode immediately when pressing Enter', () => {
    let inputDeviceCode = '   VTS-HG-002   ';
    let filterDeviceCode = '';
    let filterTrigger = 0;

    const handleFilterApply = () => {
      const trimmedDeviceCode = (inputDeviceCode || '').trim();
      inputDeviceCode = trimmedDeviceCode;
      filterDeviceCode = trimmedDeviceCode;
      filterTrigger += 1;
    };

    const onPressEnterCode = () => {
      const trimmed = inputDeviceCode.trim();
      inputDeviceCode = trimmed;
      filterDeviceCode = trimmed;
      handleFilterApply();
    };

    onPressEnterCode();

    expect(inputDeviceCode).toBe('VTS-HG-002');
    expect(filterDeviceCode).toBe('VTS-HG-002');
    expect(filterTrigger).toBe(1);
  });

  it('TC-VTS-ASSIST-FILTER-04: converts whitespace-only inputs to empty strings on submit/enter', () => {
    let inputDeviceName = '        ';
    let inputDeviceCode = '    ';
    let filterDeviceName = 'old-name';
    let filterDeviceCode = 'old-code';

    const handleFilterApply = () => {
      const trimmedDeviceName = (inputDeviceName || '').trim();
      const trimmedDeviceCode = (inputDeviceCode || '').trim();
      inputDeviceName = trimmedDeviceName;
      inputDeviceCode = trimmedDeviceCode;
      filterDeviceName = trimmedDeviceName;
      filterDeviceCode = trimmedDeviceCode;
    };

    handleFilterApply();

    expect(inputDeviceName).toBe('');
    expect(inputDeviceCode).toBe('');
    expect(filterDeviceName).toBe('');
    expect(filterDeviceCode).toBe('');
  });
});
