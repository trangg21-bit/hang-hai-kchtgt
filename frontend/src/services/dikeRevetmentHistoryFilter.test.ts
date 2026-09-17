import { describe, it, expect } from 'vitest';
import { fmtNum } from '../utils/numFmt';
import { DEFAULT_IGNORED_FIELDS } from '../utils/changeHistoryRenderer';

describe('DikeRevetment History Filter Logic (/dike-revetment)', () => {
  const isBlank = (v: any): boolean => {
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

  const isMeaningfulChange = (
    field: string,
    rawOld: string | null | undefined,
    rawNew: string | null | undefined,
  ): boolean => {
    const f = (field || '').trim();
    const fLower = f.toLowerCase();
    if (
      DEFAULT_IGNORED_FIELDS.has(f) ||
      DEFAULT_IGNORED_FIELDS.has(fLower) ||
      fLower === 'approvalstatus' ||
      fLower === 'trạng thái phê duyệt' ||
      fLower === 'trang thai phe duyet'
    ) {
      return false;
    }
    if (isBlank(rawOld) && isBlank(rawNew)) return false;
    const ov = rawOld != null ? String(rawOld).trim() : '';
    const nv = rawNew != null ? String(rawNew).trim() : '';
    if (ov !== '' && nv !== '' && ov.toLowerCase() === nv.toLowerCase()) return false;
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

  it('filters out approvalStatus and Trạng thái phê duyệt completely', () => {
    expect(isMeaningfulChange('approvalStatus', 'Đã duyệt', 'Đã duyệt')).toBe(false);
    expect(isMeaningfulChange('approvalStatus', 'Lưu tạm', 'Đã duyệt')).toBe(false);
    expect(isMeaningfulChange('Trạng thái phê duyệt', 'Chưa có', 'Đã duyệt')).toBe(false);
    expect(isMeaningfulChange('trang thai phe duyet', 'Chờ duyệt', 'Đã duyệt')).toBe(false);
  });

  it('filters out DEFAULT_IGNORED_FIELDS (rejectionReason, approverLevel1, etc.)', () => {
    expect(isMeaningfulChange('rejectionReason', null, 'Lý do từ chối')).toBe(false);
    expect(isMeaningfulChange('approverLevel1', null, 'uuid-approver')).toBe(false);
    expect(isMeaningfulChange('approverLevel2', null, 'uuid-approver')).toBe(false);
    expect(isMeaningfulChange('Lý do từ chối', null, 'Không đạt yêu cầu')).toBe(false);
    expect(isMeaningfulChange('spatialId', null, 'uuid-spatial')).toBe(false);
  });

  it('filters out identical BigDecimal numbers with different scales (5555.0000 vs 5555)', () => {
    expect(isMeaningfulChange('Chiều dài (m)', '5555.0000', '5555')).toBe(false);
    expect(isMeaningfulChange('Cao trình đỉnh (m)', '10.0000', '10')).toBe(false);
    expect(isMeaningfulChange('Chiều cao (m)', '5.0', '5.0000')).toBe(false);
  });

  it('keeps genuine numerical changes', () => {
    expect(isMeaningfulChange('Chiều dài (m)', '5555.0000', '6000')).toBe(true);
    expect(isMeaningfulChange('Chiều dài (m)', '5555', '5556')).toBe(true);
  });

  it('filters out identical strings and blank values', () => {
    expect(isMeaningfulChange('Ghi chú', 'Đê biển', 'Đê biển')).toBe(false);
    expect(isMeaningfulChange('Ghi chú', '  Đê biển  ', 'Đê biển')).toBe(false);
    expect(isMeaningfulChange('Ghi chú', null, '')).toBe(false);
    expect(isMeaningfulChange('Ghi chú', '—', 'Chưa có')).toBe(false);
    expect(isMeaningfulChange('Ghi chú', '(null)', '(trống)')).toBe(false);
    expect(isMeaningfulChange('Ghi chú', null, '—')).toBe(false);
  });

  it('keeps genuine string changes', () => {
    expect(isMeaningfulChange('Ghi chú', 'Đê biển', 'Đê chắn sóng Hải Phòng')).toBe(true);
    expect(isMeaningfulChange('Vật liệu bề mặt', 'Betong', 'Thep')).toBe(true);
    expect(isMeaningfulChange('Tài liệu đính kèm', 'Chưa có', 'quyet_dinh.pdf')).toBe(true);
  });
});
