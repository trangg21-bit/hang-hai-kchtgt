import { describe, it, expect } from 'vitest';
import { fmtNum } from '../utils/numFmt';

describe('Transmission History Filter Logic (/transmission)', () => {
  const isMeaningfulChange = (
    _field: string,
    rawOld: string | null | undefined,
    rawNew: string | null | undefined,
  ): boolean => {
    const ov = rawOld != null ? String(rawOld).trim() : '';
    const nv = rawNew != null ? String(rawNew).trim() : '';
    if (ov === '' && nv === '') return false;
    if (ov !== '' && nv !== '' && ov === nv) return false;
    // Bỏ qua nếu cả hai đều là số và bằng nhau về mặt giá trị số học (VD: 1.00 vs 1, 5555.0000 vs 5555)
    if (ov !== '' && nv !== '' && !isNaN(Number(ov)) && !isNaN(Number(nv)) && Math.abs(Number(ov) - Number(nv)) < 1e-9) {
      return false;
    }
    // Bỏ qua nếu sau khi format hiển thị giống nhau
    const ovFmt = !isNaN(Number(ov)) ? fmtNum(ov) : ov;
    const nvFmt = !isNaN(Number(nv)) ? fmtNum(nv) : nv;
    if (ovFmt.trim() !== '' && ovFmt.trim() === nvFmt.trim()) {
      return false;
    }
    return true;
  };

  it('filters out identical numbers with different representations (1.0 vs 1, 2024.0 vs 2024, 5555.0000 vs 5555)', () => {
    expect(isMeaningfulChange('Số lượng', '1.00', '1')).toBe(false);
    expect(isMeaningfulChange('Năm đưa vào sử dụng', '2024.0', '2024')).toBe(false);
    expect(isMeaningfulChange('Băng thông (Mbps)', '100.0000', '100')).toBe(false);
    expect(isMeaningfulChange('Tần số phát (MHz)', '156.800', '156.8')).toBe(false);
  });

  it('keeps genuine numerical changes', () => {
    expect(isMeaningfulChange('Số lượng', '1', '2')).toBe(true);
    expect(isMeaningfulChange('Năm đưa vào sử dụng', '2020', '2024')).toBe(true);
    expect(isMeaningfulChange('Băng thông (Mbps)', '100', '200')).toBe(true);
    expect(isMeaningfulChange('Tần số phát (MHz)', '156.8', '156.9')).toBe(true);
  });

  it('filters out identical strings and whitespace differences', () => {
    expect(isMeaningfulChange('Tên thiết bị', 'Hệ thống truyền dẫn VTS', 'Hệ thống truyền dẫn VTS')).toBe(false);
    expect(isMeaningfulChange('Tên thiết bị', '  Hệ thống truyền dẫn VTS  ', 'Hệ thống truyền dẫn VTS')).toBe(false);
    expect(isMeaningfulChange('Ghi chú', null, '')).toBe(false);
    expect(isMeaningfulChange('Địa điểm đặt thiết bị', 'Trạm Hải Phòng', 'Trạm Hải Phòng')).toBe(false);
  });

  it('keeps genuine string changes', () => {
    expect(isMeaningfulChange('Tên thiết bị', 'Hệ thống truyền dẫn Cũ', 'Hệ thống truyền dẫn Mới')).toBe(true);
    expect(isMeaningfulChange('Trạng thái hoạt động', 'Chưa khai thác/vận hành', 'Đang khai thác/vận hành')).toBe(true);
  });
});
