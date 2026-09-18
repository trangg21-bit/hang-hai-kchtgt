import { describe, it, expect } from 'vitest';
import { DEFAULT_IGNORED_FIELDS } from '../utils/changeHistoryRenderer';
import { fmtNum } from '../utils/numFmt';

describe('Anchorage History Filter Logic (/anchorage)', () => {
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
      lower === 'activitystatus' ||
      lower === 'approvalcontentlevel1' ||
      lower === 'approvalcontentlevel2' ||
      lower === 'level1approvalcontent' ||
      lower === 'level2approvalcontent' ||
      lower === 'approvalcontent' ||
      lower === 'submitteddate' ||
      lower === 'submittedat' ||
      lower === 'submittedby' ||
      lower === 'submittedforapprovalat' ||
      lower === 'submittedforapprovalby' ||
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
      lower === 'thời điểm gửi phê duyệt' ||
      lower === 'thời điểm cảng vụ phê duyệt' ||
      lower === 'thời điểm cục phê duyệt' ||
      lower === 'nội dung cảng vụ phê duyệt' ||
      lower === 'nội dung cục phê duyệt' ||
      lower === 'cán bộ cảng vụ phê duyệt' ||
      lower === 'cán bộ cục phê duyệt' ||
      fn === 'infrastructureList' ||
      fn === 'infrastructureList_raw' ||
      fn === 'spatialId' ||
      fn === 'Vị trí không gian'
    ) {
      return true;
    }
    const normalize = (v: any) => {
      if (v == null) return '';
      const s = String(v).trim();
      if (s === '(null)' || s === 'null' || s === 'Chưa có' || s === '—') return '';
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

  it('filters out approvalStatus and Trạng thái completely', () => {
    expect(isIgnoredHistoryItem({ changedField: 'approvalStatus', previousValue: 'Đã duyệt', newValue: 'Đã duyệt' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'approvalStatus', previousValue: 'Lưu tạm', newValue: 'Đã duyệt' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'Trạng thái phê duyệt', previousValue: 'Chưa có', newValue: 'Đã duyệt' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'Trạng thái', previousValue: 'Lưu tạm', newValue: 'Đã phê duyệt' })).toBe(true);
  });

  it('filters out approval workflow metadata fields', () => {
    expect(isIgnoredHistoryItem({ changedField: 'submittedForApprovalAt', previousValue: null, newValue: '2026-03-01T10:00:00' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'submittedForApprovalBy', previousValue: null, newValue: 'user-uuid' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'Thời điểm gửi phê duyệt', previousValue: null, newValue: '2026-03-01' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'Người gửi phê duyệt', previousValue: null, newValue: 'Nguyễn Văn A' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'portAuthorityApprovedAt', previousValue: null, newValue: '2026-03-01T10:00:00' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'portAuthorityApprovedBy', previousValue: null, newValue: 'user-uuid' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'portAuthorityApprovalContent', previousValue: null, newValue: 'Đồng ý' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'Thời điểm Cảng vụ phê duyệt', previousValue: null, newValue: '2026-03-01' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'Nội dung Cảng vụ phê duyệt', previousValue: null, newValue: 'Đồng ý' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'departmentApprovedAt', previousValue: null, newValue: '2026-03-01T10:00:00' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'departmentApprovedBy', previousValue: null, newValue: 'user-uuid' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'departmentApprovalContent', previousValue: null, newValue: 'Đồng ý' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'Thời điểm Cục phê duyệt', previousValue: null, newValue: '2026-03-01' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'Nội dung Cục phê duyệt', previousValue: null, newValue: 'Đồng ý' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'rejectionReason', previousValue: null, newValue: 'Lý do từ chối' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'Lý do từ chối', previousValue: null, newValue: 'Lý do từ chối' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'cấp 1 phê duyệt', previousValue: null, newValue: 'Duyệt' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'nội dung phê duyệt', previousValue: null, newValue: 'Duyệt' })).toBe(true);
  });

  it('filters out DEFAULT_IGNORED_FIELDS and spatial fields', () => {
    expect(isIgnoredHistoryItem({ changedField: 'approverLevel1', previousValue: null, newValue: 'uuid-1' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'approverLevel2', previousValue: null, newValue: 'uuid-2' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'spatialId', previousValue: null, newValue: 'uuid-spatial' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'Vị trí không gian', previousValue: null, newValue: 'uuid-spatial' })).toBe(true);
  });

  it('filters out identical numbers with different representations (10.0 vs 10, 5,000 vs 5000.00)', () => {
    expect(isIgnoredHistoryItem({ changedField: 'area', previousValue: '10.00', newValue: '10' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'Diện tích (ha)', previousValue: '5,000', newValue: '5000.00' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'activeAnchorageCount', previousValue: '2.0', newValue: '2' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'Số lượng khu neo đậu đang khai thác', previousValue: '3', newValue: '3.0' })).toBe(true);
  });

  it('filters out records where previousValue equals newValue', () => {
    expect(isIgnoredHistoryItem({ changedField: 'anchorageName', previousValue: 'Khu neo Vũng Tàu', newValue: 'Khu neo Vũng Tàu' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'Tên khu neo đậu', previousValue: 'Khu neo Vũng Tàu', newValue: 'Khu neo Vũng Tàu' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'anchorageCode', previousValue: 'ND-001', newValue: 'ND-001' })).toBe(true);
  });

  it('retains genuine field changes', () => {
    expect(isIgnoredHistoryItem({ changedField: 'anchorageName', previousValue: 'Khu neo cũ', newValue: 'Khu neo mới' })).toBe(false);
    expect(isIgnoredHistoryItem({ changedField: 'area', previousValue: '10.5', newValue: '20.0' })).toBe(false);
    expect(isIgnoredHistoryItem({ changedField: 'operationalStatus', previousValue: 'DANG_HOAT_DONG', newValue: 'TAM_DUNG' })).toBe(false);
    expect(isIgnoredHistoryItem({ changedField: 'designWaterDepth', previousValue: '12.5', newValue: '14.0' })).toBe(false);
    expect(isIgnoredHistoryItem({ changedField: 'Tọa độ GPS', previousValue: 'POINT(106 10)', newValue: 'POINT(106 11)' })).toBe(false);
  });

  it('deduplicates fields mapped to the same display label in the same session', () => {
    const historyFieldLabels: Record<string, string> = {
      anchorageName: 'Tên khu neo đậu',
      'Tên khu neo đậu': 'Tên khu neo đậu',
      area: 'Diện tích (ha)',
      'Diện tích (ha)': 'Diện tích (ha)',
    };
    const historyFieldName = (fn: string) => historyFieldLabels[fn] || fn;

    const items = [
      { field: 'anchorageName', oldValue: 'Khu neo cũ', newValue: 'Khu neo mới' },
      { field: 'Tên khu neo đậu', oldValue: 'Khu neo cũ', newValue: 'Khu neo mới' },
      { field: 'area', oldValue: '10', newValue: '20' },
      { field: 'Diện tích (ha)', oldValue: '10', newValue: '20' },
    ];

    const seenLabels = new Set<string>();
    const deduplicated: typeof items = [];
    for (const it of items) {
      const lbl = historyFieldName(it.field);
      if (!seenLabels.has(lbl)) {
        seenLabels.add(lbl);
        deduplicated.push(it);
      }
    }

    expect(deduplicated).toHaveLength(2);
    expect(deduplicated[0].field).toBe('anchorageName');
    expect(deduplicated[1].field).toBe('area');
  });
});
