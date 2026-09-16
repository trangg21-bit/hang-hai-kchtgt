import { describe, it, expect } from 'vitest';
import { fmtNum } from '../utils/numFmt';

describe('DikeRevetment History Filter Logic', () => {
  const isMeaningfulChange = (
    _field: string,
    rawOld: string | null | undefined,
    rawNew: string | null | undefined,
  ): boolean => {
    const ov = rawOld != null ? String(rawOld).trim() : '';
    const nv = rawNew != null ? String(rawNew).trim() : '';
    if (ov === '' && nv === '') return false;
    if (ov !== '' && nv !== '' && ov === nv) return false;
    // Bỏ qua nếu cả hai đều là số và bằng nhau về mặt giá trị số học (VD: 5555.0000 vs 5555)
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

  it('filters out identical BigDecimal numbers with different scales (5555.0000 vs 5555)', () => {
    expect(isMeaningfulChange('Chiều dài (m)', '5555.0000', '5555')).toBe(false);
    expect(isMeaningfulChange('Cao trình đỉnh (m)', '10.0000', '10')).toBe(false);
    expect(isMeaningfulChange('Chiều cao (m)', '5.0', '5.0000')).toBe(false);
  });

  it('keeps genuine numerical changes', () => {
    expect(isMeaningfulChange('Chiều dài (m)', '5555.0000', '6000')).toBe(true);
    expect(isMeaningfulChange('Chiều dài (m)', '5555', '5556')).toBe(true);
  });

  it('filters out identical strings and whitespace', () => {
    expect(isMeaningfulChange('Ghi chú', 'Đê biển', 'Đê biển')).toBe(false);
    expect(isMeaningfulChange('Ghi chú', '  Đê biển  ', 'Đê biển')).toBe(false);
    expect(isMeaningfulChange('Ghi chú', null, '')).toBe(false);
  });

  it('keeps genuine string changes', () => {
    expect(isMeaningfulChange('Ghi chú', 'Đê biển', 'Đê chắn sóng Hải Phòng')).toBe(true);
    expect(isMeaningfulChange('Vật liệu bề mặt', 'Betong', 'Thep')).toBe(true);
  });
});
