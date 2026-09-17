import { describe, it, expect } from 'vitest';
import { fmtNum } from '../utils/numFmt';
import { DEFAULT_IGNORED_FIELDS } from '../utils/changeHistoryRenderer';

describe('VHF History Filter Logic (/vhf)', () => {
  const isMeaningfulChange = (field: string, rawOld: any, rawNew: any): boolean => {
    const f = (field || '').trim();
    const fLower = f.toLowerCase();
    if (
      DEFAULT_IGNORED_FIELDS.has(f) ||
      DEFAULT_IGNORED_FIELDS.has(fLower) ||
      fLower === 'approvalstatus' ||
      fLower === 'trạng thái phê duyệt' ||
      fLower === 'trang thai phe duyet' ||
      fLower === 'trạng thái'
    ) {
      return false;
    }
    const normalize = (v: any) => {
      if (v == null) return '';
      const s = String(v).trim();
      if (s === '(null)' || s === 'null' || s === 'Chưa có') return '';
      return s;
    };
    const ov = normalize(rawOld);
    const nv = normalize(rawNew);
    if (ov === '' && nv === '') return false;
    if (ov !== '' && nv !== '' && ov === nv) return false;

    const cleanOv = ov.replace(/,/g, '');
    const cleanNv = nv.replace(/,/g, '');

    if (cleanOv !== '' && cleanNv !== '' && !isNaN(Number(cleanOv)) && !isNaN(Number(cleanNv)) && Math.abs(Number(cleanOv) - Number(cleanNv)) < 1e-9) {
      return false;
    }

    const ovFmt = cleanOv !== '' && !isNaN(Number(cleanOv)) ? fmtNum(cleanOv) : ov;
    const nvFmt = cleanNv !== '' && !isNaN(Number(cleanNv)) ? fmtNum(cleanNv) : nv;
    if (ovFmt.trim() !== '' && ovFmt.trim() === nvFmt.trim()) {
      return false;
    }

    return true;
  };

  it('filters out identical numbers with different representations (1.0 vs 1, 2024.0 vs 2024, 5,555 vs 5555.0000)', () => {
    expect(isMeaningfulChange('Số lượng', '1.00', '1')).toBe(false);
    expect(isMeaningfulChange('Năm đưa vào sử dụng', '2024.0', '2024')).toBe(false);
    expect(isMeaningfulChange('Loại hạ tầng', '1.0', '1')).toBe(false);
    expect(isMeaningfulChange('Tần số', '5,555', '5555.0000')).toBe(false);
    expect(isMeaningfulChange('Tần số', '5555', '5555.00')).toBe(false);
  });

  it('keeps genuine numerical changes', () => {
    expect(isMeaningfulChange('Số lượng', '1', '2')).toBe(true);
    expect(isMeaningfulChange('Năm đưa vào sử dụng', '2020', '2024')).toBe(true);
    expect(isMeaningfulChange('Loại hạ tầng', '1', '2')).toBe(true);
    expect(isMeaningfulChange('Tần số', '5555', '5556')).toBe(true);
  });

  it('filters out identical strings and whitespace', () => {
    expect(isMeaningfulChange('Tên thiết bị', 'Hệ thống VHF Hòn Dấu', 'Hệ thống VHF Hòn Dấu')).toBe(false);
    expect(isMeaningfulChange('Tên thiết bị', '  Hệ thống VHF Hòn Dấu  ', 'Hệ thống VHF Hòn Dấu')).toBe(false);
    expect(isMeaningfulChange('Ghi chú', null, '')).toBe(false);
    expect(isMeaningfulChange('Ghi chú', 'Chưa có', null)).toBe(false);
    expect(isMeaningfulChange('Địa điểm chi tiết', 'Trạm luồng Hòn Dấu', 'Trạm luồng Hòn Dấu')).toBe(false);
  });

  it('keeps genuine string changes', () => {
    expect(isMeaningfulChange('Tên thiết bị', 'VHF Cũ', 'VHF Mới')).toBe(true);
    expect(isMeaningfulChange('Trạng thái hoạt động', 'Chưa khai thác/vận hành', 'Đang khai thác/vận hành')).toBe(true);
  });

  it('filters out approvalStatus and DEFAULT_IGNORED_FIELDS completely', () => {
    expect(isMeaningfulChange('approvalStatus', 'Đã duyệt', 'Đã duyệt')).toBe(false);
    expect(isMeaningfulChange('approvalStatus', 'Lưu tạm', 'Đã duyệt')).toBe(false);
    expect(isMeaningfulChange('Trạng thái phê duyệt', 'Chưa có', 'Đã duyệt')).toBe(false);
    expect(isMeaningfulChange('Trạng thái', 'Lưu tạm', 'Đã duyệt')).toBe(false);
    expect(isMeaningfulChange('approverLevel1', null, 'uuid-user')).toBe(false);
    expect(isMeaningfulChange('rejectionReason', null, 'Lý do từ chối')).toBe(false);
    expect(isMeaningfulChange('Lý do từ chối', null, 'Lý do')).toBe(false);
  });
});
