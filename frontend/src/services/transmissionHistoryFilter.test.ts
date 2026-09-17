import { describe, it, expect } from 'vitest';
import { fmtNum } from '../utils/numFmt';

describe('Transmission History Filter Logic (/transmission)', () => {
  const isMeaningfulChange = (
    field: string,
    rawOld: string | null | undefined,
    rawNew: string | null | undefined,
  ): boolean => {
    const normF = (field || '').trim().toLowerCase();
    if (
      normF === 'approvalstatus' ||
      normF === 'trạng thái phê duyệt' ||
      normF === 'trang thai phe duyet' ||
      normF === 'trạng thái' ||
      normF === 'status'
    ) {
      return false;
    }
    const isBlank = (v: string | null | undefined): boolean => {
      if (v == null) return true;
      const s = String(v).trim().toLowerCase();
      return (
        s === '' ||
        s === '—' ||
        s === '-' ||
        s === '–' ||
        s === 'null' ||
        s === '(null)' ||
        s === '(trống)' ||
        s === 'chưa có' ||
        s === 'undefined'
      );
    };
    if (isBlank(rawOld) && isBlank(rawNew)) return false;
    const ov = rawOld != null ? String(rawOld).trim() : '';
    const nv = rawNew != null ? String(rawNew).trim() : '';
    if (ov !== '' && nv !== '' && ov.toLowerCase() === nv.toLowerCase()) return false;
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

  it('filters out approvalStatus and metadata fields regardless of values', () => {
    expect(isMeaningfulChange('approvalStatus', 'Đã duyệt', 'Đã duyệt')).toBe(false);
    expect(isMeaningfulChange('approvalStatus', 'DRAFT', 'APPROVED')).toBe(false);
    expect(isMeaningfulChange('Trạng thái phê duyệt', 'Lưu tạm', 'Đã duyệt')).toBe(false);
    expect(isMeaningfulChange('trạng thái', 'Chờ duyệt', 'Đã duyệt')).toBe(false);
    expect(isMeaningfulChange('status', '0', '1')).toBe(false);
  });

  it('filters out identical values including case insensitivity', () => {
    expect(isMeaningfulChange('Tên thiết bị', 'Đã duyệt', 'Đã duyệt')).toBe(false);
    expect(isMeaningfulChange('Tên thiết bị', 'Đã duyệt', 'đã duyệt')).toBe(false);
    expect(isMeaningfulChange('Tên thiết bị', 'Hệ thống truyền dẫn VTS', 'Hệ thống truyền dẫn VTS')).toBe(false);
    expect(isMeaningfulChange('Tên thiết bị', '  Hệ thống truyền dẫn VTS  ', 'Hệ thống truyền dẫn VTS')).toBe(false);
  });

  it('filters out transitions between blank representations', () => {
    expect(isMeaningfulChange('Ghi chú', null, '')).toBe(false);
    expect(isMeaningfulChange('Ghi chú', '—', 'Chưa có')).toBe(false);
    expect(isMeaningfulChange('Ghi chú', '(null)', '(trống)')).toBe(false);
    expect(isMeaningfulChange('Ghi chú', null, '—')).toBe(false);
    expect(isMeaningfulChange('Ghi chú', 'Chưa có', null)).toBe(false);
  });

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

  it('keeps genuine string changes', () => {
    expect(isMeaningfulChange('Tên thiết bị', 'Hệ thống truyền dẫn Cũ', 'Hệ thống truyền dẫn Mới')).toBe(true);
    expect(isMeaningfulChange('Trạng thái hoạt động', 'Chưa khai thác/vận hành', 'Đang khai thác/vận hành')).toBe(true);
    expect(isMeaningfulChange('Tài liệu đính kèm', 'Chưa có', 'document.pdf')).toBe(true);
  });
});
