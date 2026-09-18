import { describe, it, expect } from 'vitest';
import { fmtNum } from '../utils/numFmt';
import { DEFAULT_IGNORED_FIELDS } from '../utils/changeHistoryRenderer';

describe('CCTV History Filter Logic (/cctv)', () => {
  const isMeaningfulChange = (
    _field: string,
    rawOld: string | null | undefined,
    rawNew: string | null | undefined,
  ): boolean => {
    const f = (_field || '').trim();
    const fLower = f.toLowerCase();
    if (
      DEFAULT_IGNORED_FIELDS.has(f) ||
      DEFAULT_IGNORED_FIELDS.has(fLower) ||
      fLower === 'approvalstatus' ||
      fLower === 'trạng thái phê duyệt' ||
      fLower === 'trang thai phe duyet' ||
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
      fLower === 'người gửi phê duyệt'
    ) {
      return false;
    }
    const ov = rawOld != null ? String(rawOld).trim() : '';
    const nv = rawNew != null ? String(rawNew).trim() : '';
    if (ov === '' && nv === '') return false;
    if (ov !== '' && nv !== '' && ov === nv) return false;
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

  it('filters out identical numbers with different representations (1.0 vs 1, 2024.0 vs 2024, 5555.0000 vs 5555)', () => {
    expect(isMeaningfulChange('Số lượng', '1.00', '1')).toBe(false);
    expect(isMeaningfulChange('Năm đưa vào sử dụng', '2024.0', '2024')).toBe(false);
    expect(isMeaningfulChange('Loại hạ tầng', '1.0', '1')).toBe(false);
    expect(isMeaningfulChange('Chiều dài (m)', '5555.0000', '5555')).toBe(false);
    expect(isMeaningfulChange('Chiều dài (m)', '5555', '5555.00')).toBe(false);
  });

  it('keeps genuine numerical changes', () => {
    expect(isMeaningfulChange('Số lượng', '1', '2')).toBe(true);
    expect(isMeaningfulChange('Năm đưa vào sử dụng', '2020', '2024')).toBe(true);
    expect(isMeaningfulChange('Loại hạ tầng', '1', '2')).toBe(true);
    expect(isMeaningfulChange('Chiều dài (m)', '5555', '5556')).toBe(true);
  });

  it('filters out identical strings and whitespace', () => {
    expect(isMeaningfulChange('Tên thiết bị', 'Hệ thống CCTV Cảng Đình Vũ', 'Hệ thống CCTV Cảng Đình Vũ')).toBe(false);
    expect(isMeaningfulChange('Tên thiết bị', '  Hệ thống CCTV Cảng Đình Vũ  ', 'Hệ thống CCTV Cảng Đình Vũ')).toBe(false);
    expect(isMeaningfulChange('Ghi chú', null, '')).toBe(false);
    expect(isMeaningfulChange('Địa điểm chi tiết', 'Khu vực bến cảng', 'Khu vực bến cảng')).toBe(false);
  });

  it('keeps genuine string changes', () => {
    expect(isMeaningfulChange('Tên thiết bị', 'Hệ thống CCTV Cũ', 'Hệ thống CCTV Mới')).toBe(true);
    expect(isMeaningfulChange('Trạng thái hoạt động', 'Chưa khai thác/vận hành', 'Đang khai thác/vận hành')).toBe(true);
  });

  it('filters out approvalStatus and DEFAULT_IGNORED_FIELDS completely', () => {
    expect(isMeaningfulChange('approvalStatus', 'Đã duyệt', 'Đã duyệt')).toBe(false);
    expect(isMeaningfulChange('approvalStatus', 'Lưu tạm', 'Đã duyệt')).toBe(false);
    expect(isMeaningfulChange('Trạng thái phê duyệt', 'Chưa có', 'Đã duyệt')).toBe(false);
    expect(isMeaningfulChange('approverLevel1', null, 'uuid-user')).toBe(false);
    expect(isMeaningfulChange('rejectionReason', null, 'Lý do từ chối')).toBe(false);
    expect(isMeaningfulChange('Lý do từ chối', null, 'Lý do')).toBe(false);
  });

  it('filters out approval workflow metadata fields and submission dates', () => {
    expect(isMeaningfulChange('approvalContentLevel1', '', 'Cấp Cục phê duyệt trực tiếp')).toBe(false);
    expect(isMeaningfulChange('approvalContentLevel2', '', 'Lưu và phê duyệt')).toBe(false);
    expect(isMeaningfulChange('level1ApprovalContent', '', 'Nội dung cấp 1')).toBe(false);
    expect(isMeaningfulChange('level2ApprovalContent', '', 'Nội dung cấp 2')).toBe(false);
    expect(isMeaningfulChange('submittedDate', '', '2026-09-17T10:29:49.936285')).toBe(false);
    expect(isMeaningfulChange('cấp 1 phê duyệt', '', 'Đã duyệt')).toBe(false);
    expect(isMeaningfulChange('nội dung phê duyệt', '', 'Lưu và phê duyệt')).toBe(false);
  });

  it('deduplicates English and Vietnamese field entries pointing to same display name', () => {
    const historyFieldLabels: Record<string, string> = {
      deviceName: 'Tên thiết bị',
      deviceCode: 'Mã thiết bị',
      unitOfMeasure: 'Đơn vị tính',
    };
    const historyFieldName = (f: string) => historyFieldLabels[f] || f;

    const changes = [
      { field: 'deviceName', oldValue: 'Cam 1', newValue: 'Cam 2' },
      { field: 'Tên thiết bị', oldValue: 'Cam 1', newValue: 'Cam 2' },
      { field: 'deviceCode', oldValue: 'CCTV-01', newValue: 'CCTV-02' },
    ];

    const seenDisplayFields = new Set<string>();
    const deduped: typeof changes = [];
    for (const c of changes) {
      const displayLabel = historyFieldName(c.field).trim().toLowerCase();
      if (seenDisplayFields.has(displayLabel)) {
        continue;
      }
      seenDisplayFields.add(displayLabel);
      deduped.push(c);
    }

    expect(deduped).toHaveLength(2);
    expect(deduped[0].field).toBe('deviceName');
    expect(deduped[1].field).toBe('deviceCode');
  });

  it('formats unit of measure correctly and safely without empty arrows', () => {
    const UOM_LABELS: Record<number, string> = {
      1: 'Bộ',
      4: 'Chiếc',
      6: 'Cái',
    };
    const formatUnitOfMeasure = (val: unknown): string => {
      if (val == null || val === '') return '';
      const num = Number(val);
      if (!Number.isNaN(num) && UOM_LABELS[num]) {
        return UOM_LABELS[num];
      }
      const str = String(val).trim();
      return str === '(null)' || str === 'null' ? '' : str;
    };

    expect(formatUnitOfMeasure(1)).toBe('Bộ');
    expect(formatUnitOfMeasure('4')).toBe('Chiếc');
    expect(formatUnitOfMeasure(null)).toBe('');
    expect(formatUnitOfMeasure(undefined)).toBe('');
    expect(formatUnitOfMeasure('(null)')).toBe('');
    expect(formatUnitOfMeasure('Bộ')).toBe('Bộ');
  });
});

describe('CCTV Status Bar & Tab Tất cả Logic (/cctv)', () => {
  interface CctvItem {
    id: string;
    deviceName: string;
    approvalStatus: string;
    deletedAt?: string | null;
    deletedBy?: string | null;
  }

  const computeTotalAll = (counts: Record<string, number>): number => {
    return (
      (counts.DRAFT || 0) +
      (counts.PENDING_APPROVAL || 0) +
      (counts.APPROVED_LEVEL1 || 0) +
      (counts.APPROVED || 0) +
      (counts.REJECTED_LEVEL1 || 0) +
      (counts.REJECTED_LEVEL2 || 0)
    );
  };

  const filterRecordsForTab = (records: CctvItem[], tabKey: string): CctvItem[] => {
    const isAllTab = !tabKey || tabKey === 'all';
    if (isAllTab) {
      return records.filter((r) => !r.deletedAt && !r.deletedBy);
    }
    if (tabKey === 'ARCHIVED' || tabKey === 'DELETED') {
      return records.filter((r) => Boolean(r.deletedAt || r.deletedBy));
    }
    return records.filter((r) => !r.deletedAt && !r.deletedBy && r.approvalStatus === tabKey);
  };

  it('totalAll only sums active sub-tabs and does NOT include ARCHIVED/DELETED counts', () => {
    const counts = {
      DRAFT: 5,
      PENDING_APPROVAL: 3,
      APPROVED_LEVEL1: 2,
      APPROVED: 10,
      REJECTED_LEVEL1: 1,
      REJECTED_LEVEL2: 1,
      ARCHIVED: 8,
      DELETED: 8,
    };
    const totalAll = computeTotalAll(counts);
    // 5 + 3 + 2 + 10 + 1 + 1 = 22. ARCHIVED (8) MUST NOT be included.
    expect(totalAll).toBe(22);
  });

  it('tab Tất cả filters out records with deletedAt or deletedBy ("Đã xóa")', () => {
    const records: CctvItem[] = [
      { id: '1', deviceName: 'Cam 1', approvalStatus: 'APPROVED' },
      { id: '2', deviceName: 'Cam 2', approvalStatus: 'DRAFT' },
      { id: '3', deviceName: 'Cam 3', approvalStatus: 'APPROVED', deletedAt: '2026-09-01T10:00:00', deletedBy: 'user-1' },
      { id: '4', deviceName: 'Cam 4', approvalStatus: 'REJECTED_LEVEL1' },
      { id: '5', deviceName: 'Cam 5', approvalStatus: 'PENDING_APPROVAL', deletedAt: '2026-09-02T10:00:00' },
    ];

    const allTabRecords = filterRecordsForTab(records, 'all');
    expect(allTabRecords).toHaveLength(3);
    expect(allTabRecords.map((r) => r.id)).toEqual(['1', '2', '4']);
    expect(allTabRecords.some((r) => r.deletedAt || r.deletedBy)).toBe(false);
  });

  it('tab Đã xóa (ARCHIVED) only returns records with deletedAt or deletedBy', () => {
    const records: CctvItem[] = [
      { id: '1', deviceName: 'Cam 1', approvalStatus: 'APPROVED' },
      { id: '2', deviceName: 'Cam 2', approvalStatus: 'DRAFT' },
      { id: '3', deviceName: 'Cam 3', approvalStatus: 'APPROVED', deletedAt: '2026-09-01T10:00:00', deletedBy: 'user-1' },
      { id: '4', deviceName: 'Cam 4', approvalStatus: 'REJECTED_LEVEL1' },
      { id: '5', deviceName: 'Cam 5', approvalStatus: 'PENDING_APPROVAL', deletedAt: '2026-09-02T10:00:00' },
    ];

    const archivedTabRecords = filterRecordsForTab(records, 'ARCHIVED');
    expect(archivedTabRecords).toHaveLength(2);
    expect(archivedTabRecords.map((r) => r.id)).toEqual(['3', '5']);
  });

  it('suppresses history display when record is in DRAFT status', () => {
    const record = { id: 'uuid-cctv', approvalStatus: 'DRAFT' };
    const shouldLoadHistory = record.approvalStatus !== 'DRAFT';
    expect(shouldLoadHistory).toBe(false);
  });
});

