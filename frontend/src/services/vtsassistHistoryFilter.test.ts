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

  it('filters out approval workflow metadata completely', () => {
    expect(isMeaningfulChange('approvalStatus', 'DRAFT', 'PENDING_APPROVAL')).toBe(false);
    expect(isMeaningfulChange('Trạng thái phê duyệt', 'Chờ Cảng vụ duyệt', 'Đã duyệt')).toBe(false);
    expect(isMeaningfulChange('approvalContentLevel1', '—', 'Đồng ý cấp cảng vụ')).toBe(false);
    expect(isMeaningfulChange('approvalContentLevel2', '—', 'Đồng ý cấp cục')).toBe(false);
    expect(isMeaningfulChange('submittedDate', '—', '2026-06-15')).toBe(false);
    expect(isMeaningfulChange('submittedBy', '—', 'user-01')).toBe(false);
    expect(isMeaningfulChange('approverLevel1', '—', 'user-02')).toBe(false);
    expect(isMeaningfulChange('approverLevel2', '—', 'user-03')).toBe(false);
    expect(isMeaningfulChange('rejectionReason', '—', 'Sai thông tin')).toBe(false);
    expect(isMeaningfulChange('Lý do từ chối', '—', 'Sai thông tin')).toBe(false);
    expect(isMeaningfulChange('departmentApprovalContent', '—', 'Đã duyệt')).toBe(false);
    expect(isMeaningfulChange('portAuthorityApprovalContent', '—', 'Đã duyệt')).toBe(false);
    expect(isMeaningfulChange('cấp 1 phê duyệt', '—', 'Đã duyệt')).toBe(false);
    expect(isMeaningfulChange('cấp 2 phê duyệt', '—', 'Đã duyệt')).toBe(false);
    expect(isMeaningfulChange('nội dung phê duyệt', '—', 'Đã duyệt')).toBe(false);
    expect(isMeaningfulChange('infrastructureList', '[]', '[1]')).toBe(false);
    expect(isMeaningfulChange('attachments', '[]', '[1]')).toBe(false);
    expect(isMeaningfulChange('spatialId', 'id1', 'id2')).toBe(false);
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
      { field: 'deviceName', oldValue: 'Thiết bị cũ', newValue: 'Thiết bị mới' },
      { field: 'Tên thiết bị', oldValue: 'Thiết bị cũ', newValue: 'Thiết bị mới' },
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
      const isOvEmpty = ov == null || ov === '' || ov === '—' || ov === 'Chưa có' || ov === '(trống)' || ov === 'null';
      const isNvEmpty = nv == null || nv === '' || nv === '—' || nv === 'Chưa có' || nv === '(trống)' || nv === 'null';
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

  it('suppresses history fetching/display for records in DRAFT state', () => {
    const shouldSkipHistoryFetch = (record: { approvalStatus?: string } | null | undefined): boolean => {
      return !record || record.approvalStatus === 'DRAFT';
    };

    expect(shouldSkipHistoryFetch({ approvalStatus: 'DRAFT' })).toBe(true);
    expect(shouldSkipHistoryFetch({ approvalStatus: 'APPROVED' })).toBe(false);
    expect(shouldSkipHistoryFetch({ approvalStatus: 'PENDING_APPROVAL' })).toBe(false);
    expect(shouldSkipHistoryFetch(null)).toBe(true);
  });
});
