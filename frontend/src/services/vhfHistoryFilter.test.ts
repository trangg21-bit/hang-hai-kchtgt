import { describe, it, expect } from 'vitest';
import { fmtNum } from '../utils/numFmt';

describe('VHF History Filter Logic (/vhf)', () => {
  const isMeaningfulChange = (
    _field: string,
    rawOld: string | null | undefined,
    rawNew: string | null | undefined,
  ): boolean => {
    const ov = rawOld != null ? String(rawOld).trim() : '';
    const nv = rawNew != null ? String(rawNew).trim() : '';
    if (ov === '' && nv === '') return false;
    if (ov !== '' && nv !== '' && ov === nv) return false;
    // Bỏ qua nếu cả hai đều là số và bằng nhau về mặt giá trị số học (VD: 1.00 vs 1, 5,555 vs 5555.0000, 5,555 vs 5,555)
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

  it('filters out identical numbers with different representations or comma formatting (1.0 vs 1, 2024.0 vs 2024, 5,555 vs 5555)', () => {
    expect(isMeaningfulChange('Số lượng', '1.00', '1')).toBe(false);
    expect(isMeaningfulChange('Số lượng', '1,000', '1000.0000')).toBe(false);
    expect(isMeaningfulChange('Số lượng', '1,000', '1,000')).toBe(false);
    expect(isMeaningfulChange('Năm đưa vào sử dụng', '2024.0', '2024')).toBe(false);
    expect(isMeaningfulChange('Loại hạ tầng', '1.0', '1')).toBe(false);
    expect(isMeaningfulChange('Chiều dài (m)', '5,555', '5555.0000')).toBe(false);
    expect(isMeaningfulChange('Chiều dài (m)', '5,555', '5,555')).toBe(false);
    expect(isMeaningfulChange('Chiều dài (m)', '5555.0000', '5555')).toBe(false);
  });

  it('keeps genuine numerical changes', () => {
    expect(isMeaningfulChange('Số lượng', '1', '2')).toBe(true);
    expect(isMeaningfulChange('Số lượng', '1,000', '2,000')).toBe(true);
    expect(isMeaningfulChange('Năm đưa vào sử dụng', '2020', '2024')).toBe(true);
    expect(isMeaningfulChange('Loại hạ tầng', '1', '2')).toBe(true);
    expect(isMeaningfulChange('Chiều dài (m)', '5,555', '6000')).toBe(true);
  });

  it('filters out identical strings and whitespace', () => {
    expect(isMeaningfulChange('Tên thiết bị', 'Hệ thống VHF Hòn Dấu', 'Hệ thống VHF Hòn Dấu')).toBe(false);
    expect(isMeaningfulChange('Tên thiết bị', '  Hệ thống VHF Hòn Dấu  ', 'Hệ thống VHF Hòn Dấu')).toBe(false);
    expect(isMeaningfulChange('Ghi chú', null, '')).toBe(false);
    expect(isMeaningfulChange('Địa điểm chi tiết', 'Trạm Hải Phòng', 'Trạm Hải Phòng')).toBe(false);
  });

  it('keeps genuine string changes', () => {
    expect(isMeaningfulChange('Tên thiết bị', 'Hệ thống VHF Cũ', 'Hệ thống VHF Mới')).toBe(true);
    expect(isMeaningfulChange('Trạng thái hoạt động', 'Chưa khai thác/vận hành', 'Đang khai thác/vận hành')).toBe(true);
  });
});
