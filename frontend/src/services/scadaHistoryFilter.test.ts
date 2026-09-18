import { describe, it, expect } from 'vitest';
import { DEFAULT_IGNORED_FIELDS } from '../utils/changeHistoryRenderer';
import { fmtNum } from '../utils/numFmt';

describe('SCADA History Filter Logic (/scada)', () => {
  const isIgnoredHistoryItem = (r: any): boolean => {
    const fn = (r.changedField || r.fieldName || r.field || '').trim();
    if (!fn) return true;
    const lower = fn.toLowerCase();
    if (
      DEFAULT_IGNORED_FIELDS.has(fn) ||
      DEFAULT_IGNORED_FIELDS.has(lower) ||
      lower === 'approvalstatus' ||
      lower === 'trạng thái phê duyệt' ||
      lower === 'trang thai phe duyet' ||
      lower === 'trạng thái' ||
      lower === 'approvalcontentlevel1' ||
      lower === 'approvalcontentlevel2' ||
      lower === 'level1approvalcontent' ||
      lower === 'level2approvalcontent' ||
      lower === 'submitteddate' ||
      lower === 'submittedat' ||
      lower === 'submittedby' ||
      lower === 'approverlevel1' ||
      lower === 'approverlevel2' ||
      lower === 'approveddatelevel1' ||
      lower === 'approveddatelevel2' ||
      lower === 'rejectionreason' ||
      lower === 'lý do từ chối' ||
      lower === 'ly do tu choi' ||
      lower === 'portauthorityapprovedby' ||
      lower === 'portauthorityapprovedat' ||
      lower === 'portauthorityapprovalcontent' ||
      lower === 'departmentapprovedby' ||
      lower === 'departmentapprovedat' ||
      lower === 'departmentapprovalcontent' ||
      lower === 'approvedby' ||
      lower === 'approvedat' ||
      lower === 'approvedremarks' ||
      lower === 'cấp 1 phê duyệt' ||
      lower === 'cấp 2 phê duyệt' ||
      lower === 'nội dung phê duyệt' ||
      lower === 'ngày gửi phê duyệt' ||
      lower === 'người gửi phê duyệt' ||
      fn === 'infrastructureList' ||
      fn === 'infrastructureList_raw' ||
      fn === 'attachments' ||
      fn === 'spatialId'
    ) {
      return true;
    }
    const normalize = (v: any) => {
      if (v == null) return '';
      const s = String(v).trim();
      if (s === '(null)' || s === 'null' || s === 'Chưa có') return '';
      return s;
    };
    const ov = normalize(r.previousValue ?? r.oldValue ?? null);
    const nv = normalize(r.newValue ?? null);
    if (ov === '' && nv === '') return true;
    if (ov !== '' && nv !== '' && ov === nv) return true;

    const cleanOv = ov.replace(/,/g, '');
    const cleanNv = nv.replace(/,/g, '');

    if (cleanOv !== '' && cleanNv !== '' && !isNaN(Number(cleanOv)) && !isNaN(Number(cleanNv)) && Math.abs(Number(cleanOv) - Number(cleanNv)) < 1e-9) {
      return true;
    }

    const ovFmt = cleanOv !== '' && !isNaN(Number(cleanOv)) ? fmtNum(cleanOv) : ov;
    const nvFmt = cleanNv !== '' && !isNaN(Number(cleanNv)) ? fmtNum(cleanNv) : nv;
    if (ovFmt.trim() !== '' && ovFmt.trim() === nvFmt.trim()) {
      return true;
    }

    return false;
  };

  it('filters out approvalStatus and Trạng thái phê duyệt completely', () => {
    expect(isIgnoredHistoryItem({ changedField: 'approvalStatus', previousValue: 'Đã duyệt', newValue: 'Đã duyệt' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'approvalStatus', previousValue: 'Lưu tạm', newValue: 'Đã duyệt' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'Trạng thái phê duyệt', previousValue: 'Chưa có', newValue: 'Đã duyệt' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'trang thai phe duyet', previousValue: 'Chờ duyệt', newValue: 'Đã duyệt' })).toBe(true);
  });

  it('filters out approval workflow metadata fields', () => {
    expect(isIgnoredHistoryItem({ changedField: 'approvalContentLevel1', previousValue: null, newValue: 'Đồng ý duyệt' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'approvalContentLevel2', previousValue: null, newValue: 'Cục duyệt' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'level1ApprovalContent', previousValue: null, newValue: 'Duyệt cấp 1' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'level2ApprovalContent', previousValue: null, newValue: 'Duyệt cấp 2' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'submittedDate', previousValue: null, newValue: '2026-03-01T10:00:00' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'submittedAt', previousValue: null, newValue: '2026-03-01T10:00:00' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'submittedBy', previousValue: null, newValue: 'user-uuid' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'portAuthorityApprovedBy', previousValue: null, newValue: 'user-uuid' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'portAuthorityApprovalContent', previousValue: null, newValue: 'Đồng ý' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'departmentApprovedBy', previousValue: null, newValue: 'user-uuid' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'departmentApprovalContent', previousValue: null, newValue: 'Đồng ý' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'cấp 1 phê duyệt', previousValue: null, newValue: 'Duyệt' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'nội dung phê duyệt', previousValue: null, newValue: 'Duyệt' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'ngày gửi phê duyệt', previousValue: null, newValue: '2026-03-01' })).toBe(true);
  });

  it('filters out DEFAULT_IGNORED_FIELDS (rejectionReason, approverLevel1, etc.)', () => {
    expect(isIgnoredHistoryItem({ changedField: 'rejectionReason', previousValue: null, newValue: 'Lý do' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'approverLevel1', previousValue: null, newValue: 'uuid-approver' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'approverLevel2', previousValue: null, newValue: 'uuid-approver' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'Lý do từ chối', previousValue: null, newValue: 'Lý do' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'spatialId', previousValue: null, newValue: 'uuid-spatial' })).toBe(true);
  });

  it('filters out identical numbers with different representations (1.0 vs 1, 2024.0 vs 2024, 5,555 vs 5555.0000)', () => {
    expect(isIgnoredHistoryItem({ changedField: 'quantity', previousValue: '1.00', newValue: '1' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'yearOfUse', previousValue: '2024.0', newValue: '2024' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'attachedInfrastructureType', previousValue: '1.0', newValue: '1' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'Số lượng', previousValue: '5,555', newValue: '5555.0000' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'Số lượng', previousValue: '5555', newValue: '5555.00' })).toBe(true);
  });

  it('filters out records where previousValue equals newValue (no change)', () => {
    expect(isIgnoredHistoryItem({ changedField: 'deviceName', previousValue: 'SCADA 01', newValue: 'SCADA 01' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'Tên thiết bị', previousValue: 'SCADA 01', newValue: 'SCADA 01' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'deviceCode', previousValue: 'S-01', newValue: 'S-01' })).toBe(true);
  });

  it('retains genuine field changes', () => {
    expect(isIgnoredHistoryItem({ changedField: 'deviceName', previousValue: 'SCADA Cũ', newValue: 'SCADA Mới' })).toBe(false);
    expect(isIgnoredHistoryItem({ changedField: 'quantity', previousValue: '1', newValue: '2' })).toBe(false);
    expect(isIgnoredHistoryItem({ changedField: 'Tài liệu đính kèm', previousValue: '—', newValue: 'spec.pdf' })).toBe(false);
    expect(isIgnoredHistoryItem({ changedField: 'operationalStatus', previousValue: 'OPERATIONAL', newValue: 'SUSPENDED' })).toBe(false);
  });

  it('deduplicates fields mapped to the same display label in the same session', () => {
    const historyFieldLabels: Record<string, string> = {
      deviceName: 'Tên thiết bị',
      'Tên thiết bị': 'Tên thiết bị',
      model: 'Model',
      'Model': 'Model',
    };
    const historyFieldName = (fn: string) => historyFieldLabels[fn] || fn;

    const items = [
      { field: 'deviceName', oldValue: 'SCADA cũ', newValue: 'SCADA mới' },
      { field: 'Tên thiết bị', oldValue: 'SCADA cũ', newValue: 'SCADA mới' },
      { field: 'model', oldValue: 'Model A', newValue: 'Model B' },
      { field: 'Model', oldValue: 'Model A', newValue: 'Model B' },
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
    expect(deduplicated[0].field).toBe('deviceName');
    expect(deduplicated[1].field).toBe('model');
  });

  it('suppresses change rows when both old and new values are empty or equal', () => {
    const shouldSuppressRow = (isCreate: boolean, ov: any, nv: any): boolean => {
      const isOvEmpty = ov == null || ov === '' || ov === '—' || ov === 'Chưa có';
      const isNvEmpty = nv == null || nv === '' || nv === '—' || nv === 'Chưa có';
      if (!isCreate && isOvEmpty && isNvEmpty) return true;
      if (!isCreate && typeof ov === 'string' && typeof nv === 'string' && ov.trim() === nv.trim()) return true;
      return false;
    };

    expect(shouldSuppressRow(false, '—', '—')).toBe(true);
    expect(shouldSuppressRow(false, '', '')).toBe(true);
    expect(shouldSuppressRow(false, 'Chưa có', 'Chưa có')).toBe(true);
    expect(shouldSuppressRow(false, null, '—')).toBe(true);
    expect(shouldSuppressRow(false, 'Bộ', 'Bộ')).toBe(true);
    expect(shouldSuppressRow(false, 'Bộ', 'Chiếc')).toBe(false);
    expect(shouldSuppressRow(true, '—', '—')).toBe(false); // Create mode
  });
});
