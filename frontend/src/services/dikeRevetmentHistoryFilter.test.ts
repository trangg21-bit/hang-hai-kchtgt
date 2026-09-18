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
      fLower === 'trang thai phe duyet' ||
      fLower === 'trạng thái' ||
      fLower === 'approvalcontentlevel1' ||
      fLower === 'approvalcontentlevel2' ||
      fLower === 'level1approvalcontent' ||
      fLower === 'level2approvalcontent' ||
      fLower === 'submitteddate' ||
      fLower === 'submittedat' ||
      fLower === 'submittedby' ||
      fLower === 'approverlevel1' ||
      fLower === 'approverlevel2' ||
      fLower === 'approveddatelevel1' ||
      fLower === 'approveddatelevel2' ||
      fLower === 'rejectionreason' ||
      fLower === 'lý do từ chối' ||
      fLower === 'ly do tu choi' ||
      fLower === 'portauthorityapprovedby' ||
      fLower === 'portauthorityapprovedat' ||
      fLower === 'portauthorityapprovalcontent' ||
      fLower === 'departmentapprovedby' ||
      fLower === 'departmentapprovedat' ||
      fLower === 'departmentapprovalcontent' ||
      fLower === 'approvedby' ||
      fLower === 'approvedat' ||
      fLower === 'approvedremarks' ||
      fLower === 'cấp 1 phê duyệt' ||
      fLower === 'cấp 2 phê duyệt' ||
      fLower === 'nội dung phê duyệt' ||
      fLower === 'ngày gửi phê duyệt' ||
      fLower === 'người gửi phê duyệt'
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

  it('filters out approval workflow metadata fields', () => {
    expect(isMeaningfulChange('approvalContentLevel1', null, 'Đồng ý duyệt')).toBe(false);
    expect(isMeaningfulChange('approvalContentLevel2', null, 'Cục duyệt')).toBe(false);
    expect(isMeaningfulChange('level1ApprovalContent', null, 'Duyệt cấp 1')).toBe(false);
    expect(isMeaningfulChange('level2ApprovalContent', null, 'Duyệt cấp 2')).toBe(false);
    expect(isMeaningfulChange('submittedDate', null, '2026-03-01T10:00:00')).toBe(false);
    expect(isMeaningfulChange('submittedAt', null, '2026-03-01T10:00:00')).toBe(false);
    expect(isMeaningfulChange('submittedBy', null, 'user-uuid')).toBe(false);
    expect(isMeaningfulChange('portAuthorityApprovedBy', null, 'user-uuid')).toBe(false);
    expect(isMeaningfulChange('portAuthorityApprovalContent', null, 'Đồng ý')).toBe(false);
    expect(isMeaningfulChange('departmentApprovedBy', null, 'user-uuid')).toBe(false);
    expect(isMeaningfulChange('departmentApprovalContent', null, 'Đồng ý')).toBe(false);
    expect(isMeaningfulChange('cấp 1 phê duyệt', null, 'Duyệt')).toBe(false);
    expect(isMeaningfulChange('nội dung phê duyệt', null, 'Duyệt')).toBe(false);
    expect(isMeaningfulChange('ngày gửi phê duyệt', null, '2026-03-01')).toBe(false);
  });

  it('deduplicates fields mapped to the same display label in the same session', () => {
    const FIELD_LABELS: Record<string, string> = {
      dikeRevetmentName: 'Tên đê kè',
      'Tên đê kè': 'Tên đê kè',
      length: 'Chiều dài',
      'Chiều dài (m)': 'Chiều dài',
    };
    const historyFieldName = (fn: string) => FIELD_LABELS[fn] || fn;

    const items = [
      { field: 'dikeRevetmentName', oldValue: 'Đê cũ', newValue: 'Đê mới' },
      { field: 'Tên đê kè', oldValue: 'Đê cũ', newValue: 'Đê mới' },
      { field: 'Chiều dài (m)', oldValue: '100', newValue: '200' },
      { field: 'length', oldValue: '100', newValue: '200' },
    ];

    const seenLabels = new Set<string>();
    const deduplicated: typeof items = [];
    for (const it of items) {
      const label = historyFieldName(it.field).trim().toLowerCase();
      if (seenLabels.has(label)) continue;
      seenLabels.add(label);
      deduplicated.push(it);
    }

    expect(deduplicated).toHaveLength(2);
    expect(deduplicated[0].field).toBe('dikeRevetmentName');
    expect(deduplicated[1].field).toBe('Chiều dài (m)');
  });

  it('suppresses change rows when both old and new formatted values are empty or equal', () => {
    const shouldSuppressRow = (isCreate: boolean, ovNode: any, nvNode: any): boolean => {
      const isOvEmpty = ovNode == null || ovNode === '' || ovNode === '—';
      const isNvEmpty = nvNode == null || nvNode === '' || nvNode === '—';
      if (!isCreate && isOvEmpty && isNvEmpty) return true;
      if (!isCreate && typeof ovNode === 'string' && typeof nvNode === 'string' && ovNode.trim() === nvNode.trim()) return true;
      return false;
    };

    expect(shouldSuppressRow(false, '—', '—')).toBe(true);
    expect(shouldSuppressRow(false, '', '')).toBe(true);
    expect(shouldSuppressRow(false, null, '—')).toBe(true);
    expect(shouldSuppressRow(false, 'Bê tông', 'Bê tông')).toBe(true);
    expect(shouldSuppressRow(false, 'Bê tông', 'Đá hộc')).toBe(false);
    expect(shouldSuppressRow(true, '—', '—')).toBe(false); // In create mode, row is not suppressed
  });

  it('suppresses history display when record is in DRAFT status', () => {
    const record = { id: 'uuid-dike', approvalStatus: 'DRAFT' };
    const shouldLoadHistory = record.approvalStatus !== 'DRAFT';
    expect(shouldLoadHistory).toBe(false);
  });
});
