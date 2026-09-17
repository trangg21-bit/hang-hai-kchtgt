import { describe, it, expect } from 'vitest';
import { fmtNum } from '../utils/numFmt';

describe('BeaconStation History Filter Logic (/beacon-stations)', () => {
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
    // Bỏ qua nếu cả hai đều là số và bằng nhau về mặt giá trị số học (VD: 25.0000 vs 25)
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

  it('filters out identical BigDecimal numbers with different scales (25.0000 vs 25, 100.0000 vs 100)', () => {
    expect(isMeaningfulChange('Chiều cao tháp (m)', '25.0000', '25')).toBe(false);
    expect(isMeaningfulChange('Chiều cao tâm sáng (m)', '30.0000', '30')).toBe(false);
    expect(isMeaningfulChange('Diện tích (m²)', '100.0000', '100')).toBe(false);
    expect(isMeaningfulChange('Diện tích khu đất trạm (m²)', '500.00', '500.0000')).toBe(false);
    expect(isMeaningfulChange('Bán kính chiếu sáng (hải lý)', '15.0', '15.00')).toBe(false);
  });

  it('filters out identical strings and whitespace (including case insensitivity)', () => {
    expect(isMeaningfulChange('Tên đèn biển', 'Hòn Dáu', 'Hòn Dáu')).toBe(false);
    expect(isMeaningfulChange('Tên đèn biển', '  Hòn Dáu  ', 'Hòn Dáu')).toBe(false);
    expect(isMeaningfulChange('Tên đèn biển', 'Hòn Dáu', 'hòn dáu')).toBe(false);
  });

  it('filters out transitions between blank representations', () => {
    expect(isMeaningfulChange('Ghi chú', null, '')).toBe(false);
    expect(isMeaningfulChange('Ghi chú', '—', 'Chưa có')).toBe(false);
    expect(isMeaningfulChange('Ghi chú', '(null)', '(trống)')).toBe(false);
    expect(isMeaningfulChange('Ghi chú', null, '—')).toBe(false);
    expect(isMeaningfulChange('Ghi chú', 'Chưa có', null)).toBe(false);
  });

  it('keeps genuine numerical changes', () => {
    expect(isMeaningfulChange('Chiều cao tháp (m)', '25.0000', '28')).toBe(true);
    expect(isMeaningfulChange('Diện tích (m²)', '100', '120.5')).toBe(true);
    expect(isMeaningfulChange('Bán kính chiếu sáng (hải lý)', '15.0', '18.0')).toBe(true);
  });

  it('keeps genuine string changes', () => {
    expect(isMeaningfulChange('Tên đèn biển', 'Hòn Dáu', 'Hòn Dáu mới')).toBe(true);
    expect(isMeaningfulChange('Màu sắc tháp đèn', 'Trắng', 'Trắng sọc đỏ')).toBe(true);
    expect(isMeaningfulChange('Tài liệu đính kèm', 'Chưa có', 'document.pdf')).toBe(true);
  });
});
