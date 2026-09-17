import { describe, it, expect } from 'vitest';
import { DEFAULT_IGNORED_FIELDS } from '../utils/changeHistoryRenderer';

describe('SCADA History Filter Logic (/scada)', () => {
  const isIgnoredHistoryItem = (r: any): boolean => {
    const fn = (r.changedField || r.fieldName || r.field || '').trim();
    if (!fn) return true;
    if (DEFAULT_IGNORED_FIELDS.has(fn) || DEFAULT_IGNORED_FIELDS.has(fn.toLowerCase())) return true;
    const lower = fn.toLowerCase();
    if (lower === 'trạng thái phê duyệt' || lower === 'trang thai phe duyet' || lower === 'approvalstatus') return true;
    if (fn === 'infrastructureList' || fn === 'infrastructureList_raw' || fn === 'attachments' || fn === 'spatialId') return true;
    const ov = r.previousValue ?? r.oldValue ?? null;
    const nv = r.newValue ?? null;
    if (ov !== null && ov !== undefined && ov === nv) return true;
    return false;
  };

  it('filters out approvalStatus and Trạng thái phê duyệt completely', () => {
    expect(isIgnoredHistoryItem({ changedField: 'approvalStatus', previousValue: 'Đã duyệt', newValue: 'Đã duyệt' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'approvalStatus', previousValue: 'Lưu tạm', newValue: 'Đã duyệt' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'Trạng thái phê duyệt', previousValue: 'Chưa có', newValue: 'Đã duyệt' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'trang thai phe duyet', previousValue: 'Chờ duyệt', newValue: 'Đã duyệt' })).toBe(true);
  });

  it('filters out DEFAULT_IGNORED_FIELDS (rejectionReason, approverLevel1, etc.)', () => {
    expect(isIgnoredHistoryItem({ changedField: 'rejectionReason', previousValue: null, newValue: 'Lý do' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'approverLevel1', previousValue: null, newValue: 'uuid-approver' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'approverLevel2', previousValue: null, newValue: 'uuid-approver' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'Lý do từ chối', previousValue: null, newValue: 'Lý do' })).toBe(true);
    expect(isIgnoredHistoryItem({ changedField: 'spatialId', previousValue: null, newValue: 'uuid-spatial' })).toBe(true);
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
});
