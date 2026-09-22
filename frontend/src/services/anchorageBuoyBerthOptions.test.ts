import { describe, expect, it } from 'vitest';
import {
  buildAnchorageBuoyBerthQuery,
  toAnchorageBuoyBerthOptions,
} from '../pages/anchorage/anchorageBuoyBerthOptions';

describe('Anchorage buoy berth options', () => {
  it('luôn truy vấn bến phao đã duyệt theo đơn vị quản lý được chọn', () => {
    expect(buildAnchorageBuoyBerthQuery('org-selected')).toEqual({
      page: 1,
      pageSize: 1000,
      approvalStatus: 'APPROVED',
      orgUnitId: 'org-selected',
    });
  });

  it('hiển thị cả mã và tên để phân biệt các bến phao', () => {
    expect(toAnchorageBuoyBerthOptions([
      { id: 'berth-1', buoyBerthCode: 'BP001', buoyBerthName: 'Bến phao Cửa Gianh' },
    ])).toEqual([
      { value: 'berth-1', label: 'BP001 - Bến phao Cửa Gianh' },
    ]);
  });
});
