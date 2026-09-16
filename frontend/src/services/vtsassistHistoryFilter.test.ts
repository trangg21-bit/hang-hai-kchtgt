import { describe, it, expect } from 'vitest';
import { isMeaningfulChange } from './vtsassist/VtsAssistListPage';

describe('VTS Assist History Filter Logic (/vts-assist)', () => {
  it('filters out identical numbers with different scales or comma formatting (1.00 vs 1, 5,555 vs 5555.0000, 5,555 vs 5,555)', () => {
    expect(isMeaningfulChange('Số lượng', '1.00', '1')).toBe(false);
    expect(isMeaningfulChange('Số lượng', '5,555', '5555.0000')).toBe(false);
    expect(isMeaningfulChange('Số lượng', '5,555', '5,555')).toBe(false);
    expect(isMeaningfulChange('Số lượng', '10.00', '10')).toBe(false);
    expect(isMeaningfulChange('Số lượng', '1,000', '1000')).toBe(false);
    expect(isMeaningfulChange('Năm đưa vào sử dụng', '2024.0', '2024')).toBe(false);
    expect(isMeaningfulChange('Năm đưa vào sử dụng', '2024', '2024')).toBe(false);
    expect(isMeaningfulChange('Loại hạ tầng', '1.0', '1')).toBe(false);
    expect(isMeaningfulChange('Hệ quy chiếu', '1.0', '1')).toBe(false);
  });

  it('keeps genuine numerical changes', () => {
    expect(isMeaningfulChange('Số lượng', '1', '2')).toBe(true);
    expect(isMeaningfulChange('Số lượng', '5,555', '6000')).toBe(true);
    expect(isMeaningfulChange('Số lượng', '1,000', '2,000')).toBe(true);
    expect(isMeaningfulChange('Năm đưa vào sử dụng', '2020', '2024')).toBe(true);
    expect(isMeaningfulChange('Loại hạ tầng', '1', '2')).toBe(true);
  });

  it('filters out identical strings and whitespace', () => {
    expect(isMeaningfulChange('Tên thiết bị', 'Hệ thống radar phụ trợ', 'Hệ thống radar phụ trợ')).toBe(false);
    expect(isMeaningfulChange('Tên thiết bị', '  Hệ thống radar phụ trợ  ', 'Hệ thống radar phụ trợ')).toBe(false);
    expect(isMeaningfulChange('Ghi chú', null, '')).toBe(false);
    expect(isMeaningfulChange('Ghi chú', undefined, '')).toBe(false);
    expect(isMeaningfulChange('Địa điểm chi tiết', 'Hải Phòng', 'Hải Phòng')).toBe(false);
  });

  it('keeps genuine string changes', () => {
    expect(isMeaningfulChange('Tên thiết bị', 'Thiết bị cũ', 'Thiết bị mới')).toBe(true);
    expect(isMeaningfulChange('Trạng thái hoạt động', 'Chưa khai thác/vận hành', 'Đang khai thác/vận hành')).toBe(true);
    expect(isMeaningfulChange('Đơn vị quản lý', 'Cảng vụ Hải Phòng', 'Cảng vụ Quảng Ninh')).toBe(true);
  });
});
