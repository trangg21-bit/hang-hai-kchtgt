import { describe, it, expect } from 'vitest';
import { fmtNum } from '../utils/numFmt';
import { DEFAULT_IGNORED_FIELDS } from '../utils/changeHistoryRenderer';

describe('BeaconStation History Filter Logic (/beacon-stations)', () => {
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
      fLower === 'trang thai phe duyet' ||
      fLower === 'trạng thái' ||
      fLower === 'status' ||
      fLower === 'approvalcontentlevel1' ||
      fLower === 'approvalcontentlevel2' ||
      fLower === 'level1approvalcontent' ||
      fLower === 'level2approvalcontent' ||
      fLower === 'approverlevel1' ||
      fLower === 'approverlevel2' ||
      fLower === 'approveddatelevel1' ||
      fLower === 'approveddatelevel2' ||
      fLower === 'submitteddate' ||
      fLower === 'submittedat' ||
      fLower === 'submittedby' ||
      fLower === 'cấp 1 phê duyệt' ||
      fLower === 'cấp 2 phê duyệt' ||
      fLower === 'nội dung phê duyệt' ||
      fLower === 'ngày gửi phê duyệt' ||
      fLower === 'người gửi phê duyệt' ||
      fLower === 'rejectionreason' ||
      fLower === 'lý do từ chối' ||
      fLower === 'ly do tu choi'
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

  it('filters out approval workflow metadata and submission dates completely', () => {
    expect(isMeaningfulChange('approvalContentLevel1', '', 'Cấp Cục phê duyệt trực tiếp')).toBe(false);
    expect(isMeaningfulChange('approvalContentLevel2', '', 'Lưu và phê duyệt')).toBe(false);
    expect(isMeaningfulChange('level1ApprovalContent', '', 'Nội dung duyệt cấp 1')).toBe(false);
    expect(isMeaningfulChange('level2ApprovalContent', '', 'Nội dung duyệt cấp 2')).toBe(false);
    expect(isMeaningfulChange('submittedDate', '', '2026-09-17T10:29:49.936285')).toBe(false);
    expect(isMeaningfulChange('submittedAt', '', '2026-09-17T10:29:49')).toBe(false);
    expect(isMeaningfulChange('cấp 1 phê duyệt', '', 'Đã duyệt')).toBe(false);
    expect(isMeaningfulChange('nội dung phê duyệt', '', 'Lưu và phê duyệt')).toBe(false);
    expect(isMeaningfulChange('rejectionReason', '', 'Hồ sơ thiếu')).toBe(false);
    expect(isMeaningfulChange('lý do từ chối', '', 'Từ chối')).toBe(false);
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

  it('deduplicates English and Vietnamese field entries pointing to same display name', () => {
    const historyFieldLabels: Record<string, string> = {
      unitId: 'Đơn vị quản lý',
      name: 'Tên đèn biển',
      coordinates: 'Tọa độ GIS',
      towerHeight: 'Chiều cao tháp đèn',
    };
    const renderHistoryFieldLabel = (f: string) => historyFieldLabels[f] || f;

    const changes = [
      { field: 'unitId', oldValue: 'Đơn vị 1', newValue: 'Đơn vị 2' },
      { field: 'Đơn vị quản lý', oldValue: 'Đơn vị 1', newValue: 'Đơn vị 2' },
      { field: 'name', oldValue: 'Đèn A', newValue: 'Đèn B' },
      { field: 'coordinates', oldValue: 'POINT(106 20)', newValue: 'POINT(106.5 20.5)' },
      { field: 'Tọa độ GIS', oldValue: 'POINT(106 20)', newValue: 'POINT(106.5 20.5)' },
    ];

    const seenDisplayFields = new Set<string>();
    const deduped: typeof changes = [];
    for (const c of changes) {
      const displayLabel = renderHistoryFieldLabel(c.field).trim().toLowerCase();
      if (seenDisplayFields.has(displayLabel)) {
        continue;
      }
      seenDisplayFields.add(displayLabel);
      deduped.push(c);
    }

    expect(deduped).toHaveLength(3);
    expect(deduped[0].field).toBe('unitId');
    expect(deduped[1].field).toBe('name');
    expect(deduped[2].field).toBe('coordinates');
  });

  it('suppresses rendering row when both old and new values are blank or identical', () => {
    const isValBlank = (v: any) =>
      v == null ||
      String(v).trim() === '' ||
      String(v).trim() === '—' ||
      String(v).trim() === '-' ||
      String(v).trim() === '–' ||
      String(v).trim() === '(null)' ||
      String(v).trim() === 'null' ||
      String(v).trim() === '(trống)' ||
      String(v).trim().toLowerCase() === 'chưa có';

    const shouldRender = (oldVal: any, newVal: any) => {
      if (isValBlank(oldVal) && isValBlank(newVal)) return false;
      if (!isValBlank(oldVal) && !isValBlank(newVal) && String(oldVal).trim().toLowerCase() === String(newVal).trim().toLowerCase()) {
        return false;
      }
      return true;
    };

    expect(shouldRender(null, null)).toBe(false);
    expect(shouldRender('—', '—')).toBe(false);
    expect(shouldRender('', '(null)')).toBe(false);
    expect(shouldRender('Chưa có', '—')).toBe(false);
    expect(shouldRender('Đèn biển 1', 'Đèn biển 1')).toBe(false);
    expect(shouldRender('Đèn biển 1', 'Đèn biển 2')).toBe(true);
    expect(shouldRender(null, 'Đèn biển mới')).toBe(true);
  });

  it('suppresses history fetching and rendering for DRAFT records', () => {
    const shouldFetchHistory = (station: { status?: string; approvalStatus?: string }) => {
      if (station.status === 'DRAFT' || station.approvalStatus === 'DRAFT') {
        return false;
      }
      return true;
    };

    expect(shouldFetchHistory({ status: 'DRAFT', approvalStatus: 'DRAFT' })).toBe(false);
    expect(shouldFetchHistory({ status: 'DRAFT', approvalStatus: 'PROPOSED' })).toBe(false);
    expect(shouldFetchHistory({ status: 'PENDING_APPROVAL', approvalStatus: 'DRAFT' })).toBe(false);
    expect(shouldFetchHistory({ status: 'APPROVED', approvalStatus: 'APPROVED' })).toBe(true);
    expect(shouldFetchHistory({ status: 'PENDING_APPROVAL', approvalStatus: 'PROPOSED' })).toBe(true);
  });
});
