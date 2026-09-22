import { describe, expect, it } from 'vitest';
import { resolveGisDefaultOrgUnitId } from '../pages/gis/gisDefaultOrgUnit';

describe('GIS default management organization', () => {
  it('ưu tiên Cục Hàng hải theo mã G17.43', () => {
    expect(resolveGisDefaultOrgUnitId([
      { id: 'ministry', code: 'G17', name: 'Bộ Giao thông Vận tải' },
      { id: 'maritime', code: 'G17.43', name: 'Tên danh mục đã thay đổi' },
      { id: 'vishipel', code: 'G17.74', name: 'VISHIPEL' },
    ])).toBe('maritime');
  });

  it('fallback theo tên và không chọn nhầm Chi cục', () => {
    expect(resolveGisDefaultOrgUnitId([
      { id: 'branch', code: 'G17.43.01', name: 'Chi cục Hàng hải phía Bắc' },
      { id: 'maritime', code: 'CHH', name: 'Cục Hàng hải và Đường thủy Việt Nam' },
    ])).toBe('maritime');
  });

  it('không tự chọn đơn vị khác khi Cục Hàng hải không nằm trong phạm vi được cấp', () => {
    expect(resolveGisDefaultOrgUnitId([
      { id: 'port-authority', code: 'G17.43.04', name: 'Cảng vụ Hàng hải Hải Phòng' },
    ])).toBeUndefined();
  });
});
