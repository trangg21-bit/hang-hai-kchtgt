import { describe, expect, it } from 'vitest';
import {
  buildStormShelterBuoyBerthQuery,
  toStormShelterBuoyBerthOptions,
} from '../pages/storm-shelter/stormShelterBuoyBerthOptions';

describe('Storm Shelter buoy berth options', () => {
  it('luôn truy vấn bến phao đã duyệt theo đơn vị quản lý được chọn', () => {
    expect(buildStormShelterBuoyBerthQuery('org-selected')).toEqual({
      page: 1,
      pageSize: 1000,
      approvalStatus: 'APPROVED',
      orgUnitId: 'org-selected',
    });
  });

  it('hiển thị cả mã và tên để phân biệt các bến phao', () => {
    expect(toStormShelterBuoyBerthOptions([
      { id: 'berth-1', buoyBerthCode: 'BP001', buoyBerthName: 'Bến phao Cửa Gianh' },
    ])).toEqual([
      { value: 'berth-1', label: 'BP001 - Bến phao Cửa Gianh' },
    ]);
  });
});
