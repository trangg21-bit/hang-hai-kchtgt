import { describe, it, expect } from 'vitest';
import { fmtNum } from '../utils/numFmt';

describe('RadarStation History Filter Logic (/radar-station)', () => {
  const isMeaningfulChange = (
    _field: string,
    rawOld: string | null | undefined,
    rawNew: string | null | undefined,
  ): boolean => {
    const ov = rawOld != null ? String(rawOld).trim() : '';
    const nv = rawNew != null ? String(rawNew).trim() : '';
    if (ov === '' && nv === '') return false;
    if (ov !== '' && nv !== '' && ov === nv) return false;
    // Bỏ qua nếu cả hai đều là số và bằng nhau về mặt giá trị số học (VD: 25.0000 vs 25 hoặc 5,555 vs 5555)
    const cleanOv = ov.replace(/,/g, '');
    const cleanNv = nv.replace(/,/g, '');
    if (cleanOv !== '' && cleanNv !== '' && !isNaN(Number(cleanOv)) && !isNaN(Number(cleanNv)) && Math.abs(Number(cleanOv) - Number(cleanNv)) < 1e-9) {
      return false;
    }
    // Bỏ qua nếu sau khi format hiển thị giống nhau
    const ovFmt = cleanOv !== '' && !isNaN(Number(cleanOv)) ? fmtNum(cleanOv) : ov;
    const nvFmt = cleanNv !== '' && !isNaN(Number(cleanNv)) ? fmtNum(cleanNv) : nv;
    if (ovFmt.trim() !== '' && ovFmt.trim() === nvFmt.trim()) {
      return false;
    }
    return true;
  };

  it('filters out identical BigDecimal numbers with different scales or comma formatting (25.0000 vs 25, 5,555 vs 5555.0000, 5,555 vs 5,555)', () => {
    expect(isMeaningfulChange('Chiều cao tháp radar (m)', '25.0000', '25')).toBe(false);
    expect(isMeaningfulChange('Chiều cao tháp radar (m)', '5,555', '5555.0000')).toBe(false);
    expect(isMeaningfulChange('Chiều cao tháp radar (m)', '5,555', '5,555')).toBe(false);
    expect(isMeaningfulChange('Tầm hiệu lực radar', '10.00', '10')).toBe(false);
    expect(isMeaningfulChange('Tầm hiệu lực radar', '5,555', '5555')).toBe(false);
    expect(isMeaningfulChange('Diện tích phát xạ', '50.0', '50')).toBe(false);
    expect(isMeaningfulChange('Số lượng', '1.00', '1')).toBe(false);
  });

  it('keeps genuine numerical changes', () => {
    expect(isMeaningfulChange('Chiều cao tháp radar (m)', '25.0000', '30')).toBe(true);
    expect(isMeaningfulChange('Tầm hiệu lực radar', '10', '15.5')).toBe(true);
    expect(isMeaningfulChange('Diện tích phát xạ', '50.0', '75.2')).toBe(true);
  });

  it('filters out identical strings and whitespace', () => {
    expect(isMeaningfulChange('Tên trạm radar', 'Trạm Radar Hải Phòng', 'Trạm Radar Hải Phòng')).toBe(false);
    expect(isMeaningfulChange('Tên trạm radar', '  Trạm Radar Hải Phòng  ', 'Trạm Radar Hải Phòng')).toBe(false);
    expect(isMeaningfulChange('Ghi chú', null, '')).toBe(false);
    expect(isMeaningfulChange('Vùng phủ sóng', 'Toàn bộ luồng', 'Toàn bộ luồng')).toBe(false);
  });

  it('keeps genuine string changes', () => {
    expect(isMeaningfulChange('Tên trạm radar', 'Trạm Cũ', 'Trạm Mới')).toBe(true);
    expect(isMeaningfulChange('Tình trạng', 'Đang bảo trì', 'Đang khai thác/vận hành')).toBe(true);
  });
});
