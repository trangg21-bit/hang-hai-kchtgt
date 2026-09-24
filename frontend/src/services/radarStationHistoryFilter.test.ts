import { describe, it, expect } from 'vitest';
import { fmtNum } from '../utils/numFmt';
import { DEFAULT_IGNORED_FIELDS } from '../utils/changeHistoryRenderer';

describe('RadarStation History Filter Logic (/radar-station)', () => {
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
    // Bỏ qua nếu cả hai đều là số và bằng nhau về mặt giá trị số học (VD: 25.0000 vs 25 hoặc 5,555 vs 5555)
    const cleanOv = ov.replace(/,/g, '');
    const cleanNv = nv.replace(/,/g, '');
    if (cleanOv !== '' && cleanNv !== '' && !isNaN(Number(cleanOv)) && !isNaN(Number(cleanNv)) && Math.abs(Number(cleanOv) - Number(cleanNv)) < 1e-9) {
      return false;
    }
    // Bỏ qua nếu sau khi format hiển thị giống nhau
    const ovFmt = cleanOv !== '' && !isNaN(Number(cleanOv)) ? fmtNum(cleanOv) : ov;
    const nvFmt = cleanNv !== '' && !isNaN(Number(cleanNv)) ? fmtNum(cleanNv) : nv;
    if (ovFmt.trim() !== '' && ovFmt.trim() === nvFmt.trim()) {
      return false;
    }
    return true;
  };

  it('filters out identical BigDecimal numbers with different scales or comma formatting (25.0000 vs 25, 5,555 vs 5555.0000, 5,555 vs 5,555)', () => {
    expect(isMeaningfulChange('Chiều cao tháp radar (m)', '25.0000', '25')).toBe(false);
    expect(isMeaningfulChange('Chiều cao tháp radar (m)', '5,555', '5555.0000')).toBe(false);
    expect(isMeaningfulChange('Chiều cao tháp radar (m)', '5,555', '5,555')).toBe(false);
    expect(isMeaningfulChange('Tầm hiệu lực radar', '10.00', '10')).toBe(false);
    expect(isMeaningfulChange('Tầm hiệu lực radar', '5,555', '5555')).toBe(false);
    expect(isMeaningfulChange('Diện tích phát xạ', '50.0', '50')).toBe(false);
    expect(isMeaningfulChange('Số lượng', '1.00', '1')).toBe(false);
  });

  it('keeps genuine numerical changes', () => {
    expect(isMeaningfulChange('Chiều cao tháp radar (m)', '25.0000', '30')).toBe(true);
    expect(isMeaningfulChange('Tầm hiệu lực radar', '10', '15.5')).toBe(true);
    expect(isMeaningfulChange('Diện tích phát xạ', '50.0', '75.2')).toBe(true);
  });

  it('filters out identical strings and whitespace', () => {
    expect(isMeaningfulChange('Tên trạm radar', 'Trạm radar Hải Phòng', 'Trạm radar Hải Phòng')).toBe(false);
    expect(isMeaningfulChange('Tên trạm radar', '  Trạm radar Hải Phòng  ', 'Trạm radar Hải Phòng')).toBe(false);
    expect(isMeaningfulChange('Ghi chú', null, '')).toBe(false);
    expect(isMeaningfulChange('Vùng phủ sóng', 'Toàn bộ luồng', 'Toàn bộ luồng')).toBe(false);
  });

  it('keeps genuine string changes', () => {
    expect(isMeaningfulChange('Tên trạm radar', 'Trạm Cũ', 'Trạm Mới')).toBe(true);
    expect(isMeaningfulChange('Tình trạng', 'Đang bảo trì', 'Đang khai thác/vận hành')).toBe(true);
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
      stationName: 'Tên trạm radar',
      'Tên trạm radar': 'Tên trạm radar',
      towerHeight: 'Chiều cao tháp radar (m)',
      'Chiều cao tháp radar (m)': 'Chiều cao tháp radar (m)',
    };
    const historyFieldName = (fn: string) => historyFieldLabels[fn] || fn;

    const items = [
      { field: 'stationName', oldValue: 'Trạm cũ', newValue: 'Trạm mới' },
      { field: 'Tên trạm radar', oldValue: 'Trạm cũ', newValue: 'Trạm mới' },
      { field: 'towerHeight', oldValue: '25', newValue: '30' },
      { field: 'Chiều cao tháp radar (m)', oldValue: '25', newValue: '30' },
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
    expect(deduplicated[0].field).toBe('stationName');
    expect(deduplicated[1].field).toBe('towerHeight');
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
    expect(shouldSuppressRow(false, '25', '25')).toBe(true);
    expect(shouldSuppressRow(false, '25', '30')).toBe(false);
    expect(shouldSuppressRow(true, '—', '—')).toBe(false); // Create mode
  });

  it('suppresses history display when record is in DRAFT status', () => {
    const record = { id: 'uuid-radar', approvalStatus: 'DRAFT' };
    const shouldLoadHistory = record.approvalStatus !== 'DRAFT';
    expect(shouldLoadHistory).toBe(false);
  });

  describe('Attachment history list delta logic (Issue: File 2 deleted displays remaining files File 1, File 3)', () => {
    const normalizeHistoryKey = (value: string): string =>
      value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');

    const isListDeltaField = (fn: string): boolean => {
      const norm = normalizeHistoryKey(fn);
      return norm.includes('dinh kem') || norm.includes('attachment');
    };

    const parseListDelta = (oldVal: string | null, newVal: string | null) => {
      const removed: string[] = [];
      const added: string[] = [];
      const modifiedOld: string[] = [];
      const modifiedNew: string[] = [];

      const splitParts = (val: string | null) => {
        if (!val || val === '—' || val === '(null)' || val === '(trống)' || val === 'Chưa có' || val === 'null' || val === 'undefined') return [];
        return val.split(',').map((s) => s.trim()).filter((s) => s && s !== '—' && s !== '(null)' && s !== '(trống)' && s !== 'Chưa có' && s !== 'null' && s !== 'undefined');
      };

      const oldParts = splitParts(oldVal);
      const newParts = splitParts(newVal);

      const normalizeListItem = (value: string) => normalizeHistoryKey(value).replace(/\s+/g, ' ');
      const oldPlain = oldParts.filter((part) => !part.startsWith('Xóa ') && !part.startsWith('Cũ: '));
      const newPlain = newParts.filter((part) => !part.startsWith('Thêm ') && !part.startsWith('Mới: '));
      const oldPlainKeys = new Set(oldPlain.map(normalizeListItem));
      const newPlainKeys = new Set(newPlain.map(normalizeListItem));

      oldParts.forEach((part) => {
        if (part.startsWith('Xóa ')) {
          removed.push(part.replace('Xóa ', '').trim());
        } else if (part.startsWith('Cũ: ')) {
          modifiedOld.push(part.replace('Cũ: ', '').trim());
        } else if (part !== '—' && !newPlainKeys.has(normalizeListItem(part))) {
          removed.push(part);
        }
      });

      newParts.forEach((part) => {
        if (part.startsWith('Thêm ')) {
          added.push(part.replace('Thêm ', '').trim());
        } else if (part.startsWith('Mới: ')) {
          modifiedNew.push(part.replace('Mới: ', '').trim());
        } else if (part !== '—' && !oldPlainKeys.has(normalizeListItem(part))) {
          added.push(part);
        }
      });

      return { removed, added };
    };

    const buildAttachmentHistoryRows = (fn: string, ov: string | null, nv: string | null) => {
      const delta = parseListDelta(ov, nv);
      const rows: Array<{ oldVal: string; newVal: string }> = [];

      const remainingVal = (nv && nv !== '—' && nv !== 'Không có' && nv !== '(null)' && nv !== '(trống)' && nv !== 'Chưa có' && nv !== 'null')
        ? nv
        : '—';

      delta.removed.forEach((r) => {
        rows.push({
          oldVal: r,
          newVal: remainingVal,
        });
      });

      delta.added.forEach((a) => {
        rows.push({
          oldVal: '—',
          newVal: a,
        });
      });

      return rows;
    };

    it('identifies Tài liệu đính kèm as list delta field', () => {
      expect(isListDeltaField('Tài liệu đính kèm')).toBe(true);
      expect(isListDeltaField('attachments')).toBe(true);
      expect(isListDeltaField('File đính kèm')).toBe(true);
      expect(isListDeltaField('Tên trạm radar')).toBe(false);
    });

    it('TC-RADAR-ATTACH-01: Deleting File 2 from [File 1, File 2, File 3] displays File 2 -> File 1, File 3', () => {
      const ov = 'File 1, File 2, File 3';
      const nv = 'File 1, File 3';

      const rows = buildAttachmentHistoryRows('Tài liệu đính kèm', ov, nv);
      expect(rows).toHaveLength(1);
      expect(rows[0].oldVal).toBe('File 2');
      expect(rows[0].newVal).toBe('File 1, File 3');
    });

    it('TC-RADAR-ATTACH-02: Deleting Giao_Dich...xlsx displays remaining files on the right', () => {
      const ov = 'Giao_Dich_Chua_Dieu_Chinh_03092026_140036 (1) (1).xlsx, image1.png, doc2.pdf';
      const nv = 'image1.png, doc2.pdf';

      const rows = buildAttachmentHistoryRows('Tài liệu đính kèm', ov, nv);
      expect(rows).toHaveLength(1);
      expect(rows[0].oldVal).toBe('Giao_Dich_Chua_Dieu_Chinh_03092026_140036 (1) (1).xlsx');
      expect(rows[0].newVal).toBe('image1.png, doc2.pdf');
    });

    it('TC-RADAR-ATTACH-03: Deleting the last file leaves newVal as dash —', () => {
      const ov = 'Tóm tắt họp 20.7 (1) (1).docx';
      const nv = '—';

      const rows = buildAttachmentHistoryRows('Tài liệu đính kèm', ov, nv);
      expect(rows).toHaveLength(1);
      expect(rows[0].oldVal).toBe('Tóm tắt họp 20.7 (1) (1).docx');
      expect(rows[0].newVal).toBe('—');
    });

    it('TC-RADAR-ATTACH-04: Uploading a file shows — -> new file', () => {
      const ov = 'File 1, File 2';
      const nv = 'File 1, File 2, images new1 (1).jpg';

      const rows = buildAttachmentHistoryRows('Tài liệu đính kèm', ov, nv);
      expect(rows).toHaveLength(1);
      expect(rows[0].oldVal).toBe('—');
      expect(rows[0].newVal).toBe('images new1 (1).jpg');
    });
  });
});

