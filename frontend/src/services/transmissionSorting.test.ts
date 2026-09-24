import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { fetchTransmissionList } from './transmission/api';

describe('Transmission Sorting API and Field Mapping (/transmission)', () => {
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

  it('sends sortBy=attachedInfrastructureName and sortOrder=asc when sorting by Thuộc TTDH VTS/Trạm radar', async () => {
    await fetchTransmissionList({
      sortBy: 'attachedInfrastructureName',
      sortOrder: 'asc',
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const requestedUrl = String(vi.mocked(api.get).mock.calls[0][0]);
    const urlObj = new URL(`http://localhost${requestedUrl}`);

    expect(urlObj.searchParams.get('sortBy')).toBe('attachedInfrastructureName');
    expect(urlObj.searchParams.get('sortOrder')).toBe('asc');
  });

  it('sends sortBy=operatingUnitName and sortOrder=desc when sorting by Đơn vị khai thác', async () => {
    await fetchTransmissionList({
      sortBy: 'operatingUnitName',
      sortOrder: 'desc',
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const requestedUrl = String(vi.mocked(api.get).mock.calls[0][0]);
    const urlObj = new URL(`http://localhost${requestedUrl}`);

    expect(urlObj.searchParams.get('sortBy')).toBe('operatingUnitName');
    expect(urlObj.searchParams.get('sortOrder')).toBe('desc');
  });

  it('correctly compares strings in Vietnamese alphabetical order for attachedInfrastructureName', () => {
    const list = [
      { attachedInfrastructureName: 'Trạm Radar Hòn Dáu' },
      { attachedInfrastructureName: 'TTDH VTS Hải Phòng' },
      { attachedInfrastructureName: 'Trạm Radar Cát Bà' },
    ];

    const sortedAsc = [...list].sort((a, b) =>
      (a.attachedInfrastructureName || '').localeCompare(b.attachedInfrastructureName || '', 'vi')
    );

    expect(sortedAsc.map((x) => x.attachedInfrastructureName)).toEqual([
      'Trạm Radar Cát Bà',
      'Trạm Radar Hòn Dáu',
      'TTDH VTS Hải Phòng',
    ]);
  });

  it('correctly compares strings in Vietnamese alphabetical order for operatingUnitName', () => {
    const list = [
      { operatingUnitName: 'Công ty Bảo đảm An toàn Hàng hải Miền Nam' },
      { operatingUnitName: 'Cảng vụ Hàng hải Hải Phòng' },
      { operatingUnitName: 'Cảng vụ Hàng hải Quảng Ninh' },
    ];

    const sortedAsc = [...list].sort((a, b) =>
      (a.operatingUnitName || '').localeCompare(b.operatingUnitName || '', 'vi')
    );

    expect(sortedAsc.map((x) => x.operatingUnitName)).toEqual([
      'Cảng vụ Hàng hải Hải Phòng',
      'Cảng vụ Hàng hải Quảng Ninh',
      'Công ty Bảo đảm An toàn Hàng hải Miền Nam',
    ]);
  });
});
