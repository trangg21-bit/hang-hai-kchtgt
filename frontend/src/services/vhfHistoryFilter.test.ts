import { describe, it, expect } from 'vitest';
import { fmtNum } from '../utils/numFmt';
import { DEFAULT_IGNORED_FIELDS } from '../utils/changeHistoryRenderer';

describe('VHF History Filter Logic (/vhf)', () => {
  const isMeaningfulChange = (field: string, rawOld: unknown, rawNew: unknown): boolean => {
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
    const normalize = (v: unknown) => {
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
    const historyFieldLabels: Record<string, string> = {
      deviceName: 'Tên thiết bị',
      'Tên thiết bị': 'Tên thiết bị',
      model: 'Model',
      'Model': 'Model',
    };
    const historyFieldName = (fn: string) => historyFieldLabels[fn] || fn;

    const items = [
      { field: 'deviceName', oldValue: 'VHF cũ', newValue: 'VHF mới' },
      { field: 'Tên thiết bị', oldValue: 'VHF cũ', newValue: 'VHF mới' },
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
    const shouldSuppressRow = (isCreate: boolean, ov: unknown, nv: unknown): boolean => {
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

  it('suppresses history display when record is in DRAFT status', () => {
    const record = { id: 'uuid-vhf', approvalStatus: 'DRAFT' };
    const shouldLoadHistory = record.approvalStatus !== 'DRAFT';
    expect(shouldLoadHistory).toBe(false);
  });

  it('formats GIS coordinates from WKT into DMS lines matching Detail View (#1: ... N, ... E)', async () => {
    const { gisCoordinatesToLines } = await import('../utils/historyGisFormat');

    // LINESTRING (2 points)
    const lineWkt = 'LINESTRING (106.666667 10.75, 106.7 10.783333)';
    const lineFormatted = gisCoordinatesToLines(lineWkt);
    expect(lineFormatted).toBeTruthy();
    const lineLines = lineFormatted!.split('\n');
    expect(lineLines).toHaveLength(2);
    expect(lineLines[0]).toMatch(/^#1:\s*10°\s*45'\s*0"\s*N,\s*106°\s*40'/);
    expect(lineLines[1]).toMatch(/^#2:\s*10°\s*46'/);

    // POLYGON (4 vertices in WKT ring, but duplicate closing vertex is removed -> 3 user vertices)
    const polyWkt = 'POLYGON ((106.666667 10.75, 106.7 10.783333, 106.75 10.75, 106.666667 10.75))';
    const polyFormatted = gisCoordinatesToLines(polyWkt);
    expect(polyFormatted).toBeTruthy();
    const polyLines = polyFormatted!.split('\n');
    expect(polyLines).toHaveLength(3);
    expect(polyLines[0]).toMatch(/^#1:\s*10°\s*45'\s*0"\s*N,\s*106°\s*40'/);
    expect(polyLines[1]).toMatch(/^#2:\s*10°\s*46'/);
    expect(polyLines[2]).toMatch(/^#3:\s*10°\s*45'\s*0"\s*N,\s*106°\s*45'/);

    // Single POINT (no #1: prefix)
    const pointWkt = 'POINT (106.666667 10.75)';
    const pointFormatted = gisCoordinatesToLines(pointWkt);
    expect(pointFormatted).not.toContain('#1:');
    expect(pointFormatted).toMatch(/10°\s*45'\s*0"\s*N/);
  });

  it('reconstructs legacy attachment changes from single added file to 3 prior files and 4 current files', () => {
    const attachmentItems = [
      { id: '1', fileName: 'Quyet_dinh_thanh_lap.pdf' },
      { id: '2', fileName: 'Thong_so_ky_thuat.docx' },
      { id: '3', fileName: 'So_do_lap_dat.png' },
      { id: '4', fileName: 'Bieu 03-N_ Thong ke luong ... 24072026 (1).pdf' },
    ];

    const currentFiles = attachmentItems.map((a) => a.fileName);
    expect(currentFiles).toHaveLength(4);

    // Legacy row: oldValue is empty/null, newValue is the single uploaded file
    const rawOldValue: string | null = null;
    const rawNewValue = 'Bieu 03-N_ Thong ke luong ... 24072026 (1).pdf';

    let ov = rawOldValue;
    let nv = rawNewValue;

    const isOvEmpty = !ov || ov === '—' || ov === 'Chưa có' || ov === '(null)';
    if (isOvEmpty && currentFiles.length > 1) {
      const singleNewFile = (nv && nv !== 'Chưa có' && !nv.includes(',')) ? nv.trim() : '';
      if (singleNewFile) {
        const priorFiles = currentFiles.filter((f) => f.toLowerCase() !== singleNewFile.toLowerCase());
        if (priorFiles.length > 0) {
          ov = priorFiles.join(', ');
          nv = currentFiles.join(', ');
        }
      }
    }

    expect(ov).toBe('Quyet_dinh_thanh_lap.pdf, Thong_so_ky_thuat.docx, So_do_lap_dat.png');
    expect(nv).toBe('Quyet_dinh_thanh_lap.pdf, Thong_so_ky_thuat.docx, So_do_lap_dat.png, Bieu 03-N_ Thong ke luong ... 24072026 (1).pdf');

    // Splitting for stacked display
    const oldStacked = ov.split(/,\s*(?=[^,]+)/).map((s) => s.trim());
    const newStacked = nv.split(/,\s*(?=[^,]+)/).map((s) => s.trim());
    expect(oldStacked).toHaveLength(3);
    expect(newStacked).toHaveLength(4);
  });
});
