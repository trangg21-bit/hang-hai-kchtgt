import { describe, it, expect } from 'vitest';
import {
  isAttachmentField,
  normalizeAttachmentName,
  parseAttachmentValues,
  deduplicateAttachmentHistoryChanges,
} from '../utils/historyAttachmentDedup';
import {
  isZoneField,
  parseHistoryEntryChanges,
  mergeChangesByField,
} from '../components/shared/CommonHistoryDrawer';
import { getServicesProvidedHistoryDelta } from '../utils/serviceHistoryDelta';

describe('historyAttachmentDedup helpers', () => {
  it('shows only the added service instead of both unchanged services', () => {
    expect(getServicesProvidedHistoryDelta(
      'servicesProvided',
      'LRIT, COSPAS-SARSAT',
      'LRIT, COSPAS-SARSAT, DSC',
    )).toEqual([
      { field: 'Dịch vụ cung cấp', oldValue: '', newValue: 'DSC' },
    ]);
  });

  it('shows only removed and added services when the service set is replaced', () => {
    expect(getServicesProvidedHistoryDelta(
      'Dịch vụ cung cấp',
      'LRIT, COSPAS-SARSAT',
      'LRIT, DSC',
    )).toEqual([
      { field: 'Dịch vụ cung cấp', oldValue: 'COSPAS-SARSAT', newValue: 'DSC' },
    ]);
  });

  it('keeps each service on its own display line', () => {
    expect(getServicesProvidedHistoryDelta(
      'servicesProvided',
      'LRIT, COSPAS-SARSAT, DSC',
      '',
    )).toEqual([
      { field: 'Dịch vụ cung cấp', oldValue: 'LRIT\nCOSPAS-SARSAT\nDSC', newValue: '' },
    ]);
  });

  it('applies the service delta when CommonHistoryDrawer receives legacy JSON snapshots', () => {
    expect(parseHistoryEntryChanges({
      changedField: 'services',
      previousValue: '["INMARSAT_DISTRESS","COSPAS_SARSAT_DISTRESS","DSC_DISTRESS"]',
      newValue: '["INMARSAT_DISTRESS","COSPAS_SARSAT_DISTRESS","DSC_DISTRESS","MSI_NAVTEX","LRIT"]',
    })).toEqual([
      { field: 'Dịch vụ cung cấp', oldValue: '', newValue: 'MSI_NAVTEX\nLRIT' },
    ]);
  });

  it('correctly identifies attachment fields', () => {
    expect(isAttachmentField('Tài liệu đính kèm')).toBe(true);
    expect(isAttachmentField('attachments')).toBe(true);
    expect(isAttachmentField('attachmentList')).toBe(true);
    expect(isAttachmentField('systemName')).toBe(false);
    expect(isAttachmentField('zones')).toBe(false);
  });

  it('normalizes attachment names and strips action prefixes', () => {
    expect(normalizeAttachmentName('Tài liệu đính kèm=Thêm file1.pdf')).toBe('file1.pdf');
    expect(normalizeAttachmentName('Xóa doc2.png')).toBe('doc2.png');
    expect(normalizeAttachmentName('—')).toBe('');
  });

  it('parses attachment values from string or array', () => {
    expect(parseAttachmentValues('a.pdf, b.png')).toEqual(['a.pdf', 'b.png']);
    expect(parseAttachmentValues('—')).toEqual([]);
    expect(parseAttachmentValues(['file.docx'])).toEqual(['file.docx']);
  });

  it('deduplicates legacy composite attachment changes when individual changes exist', () => {
    const changes = [
      { field: 'Tài liệu đính kèm', oldValue: '—', newValue: 'file1.pdf' },
      { field: 'Tài liệu đính kèm', oldValue: '—', newValue: 'Tài liệu đính kèm=Thêm file1.pdf' },
    ];
    const deduplicated = deduplicateAttachmentHistoryChanges(changes);
    expect(deduplicated).toHaveLength(1);
    expect(deduplicated[0].newValue).toBe('file1.pdf');
  });
});

describe('CommonHistoryDrawer VTS zone parsing', () => {
  it('identifies zone fields', () => {
    expect(isZoneField('Vùng VTS')).toBe(true);
    expect(isZoneField('zones')).toBe(true);
    expect(isZoneField('zoneList')).toBe(true);
    expect(isZoneField('Tên hệ thống')).toBe(false);
  });

  it('parses deleted zone as oldValue: zoneName, newValue: empty', () => {
    const item = {
      changedField: 'Vùng VTS',
      previousValue: 'Xóa bb (aa)',
      newValue: '—',
    };
    const changes = parseHistoryEntryChanges(item);
    expect(changes).toEqual([
      { field: 'Vùng VTS', oldValue: 'bb (aa)', newValue: '' },
    ]);
  });

  it('parses added zone as oldValue: empty, newValue: zoneName', () => {
    const item = {
      changedField: 'Vùng VTS',
      previousValue: '—',
      newValue: 'Thêm ff (ee)',
    };
    const changes = parseHistoryEntryChanges(item);
    expect(changes).toEqual([
      { field: 'Vùng VTS', oldValue: '', newValue: 'ff (ee)' },
    ]);
  });

  it('parses both delete and add in the same entry as separate delta rows', () => {
    const item = {
      changedField: 'Vùng VTS',
      previousValue: 'Vùng VTS=Xóa bb (aa)',
      newValue: 'Vùng VTS=Thêm ff (ee)',
    };
    const changes = parseHistoryEntryChanges(item);
    expect(changes).toEqual([
      { field: 'Vùng VTS', oldValue: 'bb (aa)', newValue: '' },
      { field: 'Vùng VTS', oldValue: '', newValue: 'ff (ee)' },
    ]);
  });

  it('parses edited zones as oldValue: oldName, newValue: newName', () => {
    const item = {
      changedField: 'Vùng VTS',
      previousValue: 'Cũ: b (a)',
      newValue: 'Mới: bb (aa)',
    };
    const changes = parseHistoryEntryChanges(item);
    expect(changes).toEqual([
      { field: 'Vùng VTS', oldValue: 'b (a)', newValue: 'bb (aa)' },
    ]);
  });

  it('parses composite entry with multiple fields separated by semicolon', () => {
    const item = {
      changedField: 'Vùng VTS, Tài liệu đính kèm',
      previousValue: 'Vùng VTS=Cũ: b (a); Tài liệu đính kèm=—',
      newValue: 'Vùng VTS=Mới: bb (aa); Tài liệu đính kèm=Thêm Logo.png',
    };
    const changes = parseHistoryEntryChanges(item);
    expect(changes).toEqual([
      { field: 'Vùng VTS', oldValue: 'b (a)', newValue: 'bb (aa)' },
      { field: 'Tài liệu đính kèm', oldValue: '', newValue: 'Logo.png' },
    ]);
  });
});

describe('mergeChangesByField', () => {
  it('merges multiple attachment delta rows into 1 single row with one title', () => {
    const rawChanges = [
      { field: 'Tài liệu đính kèm', oldValue: '—', newValue: 'capture001.png' },
      { field: 'Tài liệu đính kèm', oldValue: 'logo_cuc_hang_hai_viet_nam.jpg', newValue: '—' },
      { field: 'Tài liệu đính kèm', oldValue: 'capture001.png', newValue: '—' },
      { field: 'Tài liệu đính kèm', oldValue: 'uc_hh_backlog_trangthai.xlsx', newValue: '—' },
    ];
    const merged = mergeChangesByField(rawChanges);
    expect(merged).toHaveLength(1);
    expect(merged[0].field).toBe('Tài liệu đính kèm');
    expect(merged[0].oldValue).toBe('logo_cuc_hang_hai_viet_nam.jpg, capture001.png, uc_hh_backlog_trangthai.xlsx');
    expect(merged[0].newValue).toBe('capture001.png');
  });

  it('merges multiple zone delta rows into 1 single row with one title', () => {
    const rawChanges = [
      { field: 'Vùng VTS', oldValue: 'bb (aa)', newValue: '—' },
      { field: 'Vùng VTS', oldValue: '—', newValue: 'ff (ee)' },
    ];
    const merged = mergeChangesByField(rawChanges);
    expect(merged).toHaveLength(1);
    expect(merged[0].field).toBe('Vùng VTS');
    expect(merged[0].oldValue).toBe('bb (aa)');
    expect(merged[0].newValue).toBe('ff (ee)');
  });

  it('keeps distinct fields separate while grouping same-type fields together', () => {
    const rawChanges = [
      { field: 'Tài liệu đính kèm', oldValue: '—', newValue: 'capture001.png' },
      { field: 'Tài liệu đính kèm', oldValue: 'old.jpg', newValue: '—' },
      { field: 'Tên hệ thống', oldValue: 'VTS A', newValue: 'VTS B' },
      { field: 'Vùng VTS', oldValue: 'bb (aa)', newValue: '—' },
      { field: 'Vùng VTS', oldValue: '—', newValue: 'ff (ee)' },
    ];
    const merged = mergeChangesByField(rawChanges);
    expect(merged).toHaveLength(3);
    expect(merged.map((m) => m.field)).toEqual(['Tài liệu đính kèm', 'Tên hệ thống', 'Vùng VTS']);
  });

  it('decomposes detailed VTS zone into subfields grouped under Thông tin vùng VTS', () => {
    const item = {
      changedField: 'zones',
      previousValue: '',
      newValue: 'Mã vùng: 1, Tên vùng: 2, Tình trạng: Đang khai thác/vận hành - Tọa độ: POINT (106.45752 16.27796) - Loại hình: POINT - Biểu tượng: Biểu tượng KCHT',
    };
    const changes = parseHistoryEntryChanges(item);
    expect(changes).toHaveLength(6);
    expect(changes.every((c) => c.parentGroup === 'Thông tin vùng VTS' && c.isChild === true)).toBe(true);

    const fieldNames = changes.map((c) => c.field);
    expect(fieldNames).toEqual([
      'Mã vùng',
      'Tên vùng',
      'Tình trạng',
      'Loại đối tượng GIS',
      'Tọa độ GIS',
      'Biểu tượng bản đồ',
    ]);

    expect(changes[0]).toMatchObject({ field: 'Mã vùng', oldValue: '', newValue: '1' });
    expect(changes[1]).toMatchObject({ field: 'Tên vùng', oldValue: '', newValue: '2' });
    expect(changes[2]).toMatchObject({ field: 'Tình trạng', oldValue: '', newValue: 'Đang khai thác/vận hành' });
    expect(changes[3]).toMatchObject({ field: 'Loại đối tượng GIS', oldValue: '', newValue: 'Đối tượng điểm' });
    expect(changes[4]).toMatchObject({ field: 'Tọa độ GIS', oldValue: '', newValue: 'POINT (106.45752 16.27796)' });
    expect(changes[5]).toMatchObject({ field: 'Biểu tượng bản đồ', oldValue: '', newValue: 'Biểu tượng KCHT' });
  });

  it('keeps detailed deleted and added zones as separate operations', () => {
    const item = {
      changedField: 'zones',
      previousValue: 'Xóa Vùng cũ (VZ-OLD) - Tọa độ: POINT (108 16) - Loại hình: POINT',
      newValue: 'Thêm Vùng mới (VZ-NEW) - Tọa độ: POINT (110 13) - Loại hình: POINT',
    };
    const changes = parseHistoryEntryChanges(item);

    expect(changes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        field: 'Mã vùng',
        oldValue: 'VZ-OLD',
        newValue: '',
        parentGroup: 'Thông tin vùng VTS',
        mergeGroupKey: 'vts-zone-Xóa',
      }),
      expect.objectContaining({
        field: 'Mã vùng',
        oldValue: '',
        newValue: 'VZ-NEW',
        parentGroup: 'Thông tin vùng VTS',
        mergeGroupKey: 'vts-zone-Thêm',
      }),
      expect.objectContaining({
        field: 'Tọa độ GIS',
        oldValue: 'POINT (108 16)',
        newValue: '',
        parentGroup: 'Thông tin vùng VTS',
        mergeGroupKey: 'vts-zone-Xóa',
      }),
      expect.objectContaining({
        field: 'Tọa độ GIS',
        oldValue: '',
        newValue: 'POINT (110 13)',
        parentGroup: 'Thông tin vùng VTS',
        mergeGroupKey: 'vts-zone-Thêm',
      }),
    ]));
  });

  it('preserves child fields intact in mergeChangesByField without collapsing them into a single row', () => {
    const rawChanges = [
      { field: 'Mã vùng', oldValue: '', newValue: '1', parentGroup: 'Thông tin vùng VTS', isChild: true },
      { field: 'Tên vùng', oldValue: '', newValue: '2', parentGroup: 'Thông tin vùng VTS', isChild: true },
      { field: 'Tình trạng', oldValue: '', newValue: 'Đang khai thác/vận hành', parentGroup: 'Thông tin vùng VTS', isChild: true },
      { field: 'Loại đối tượng GIS', oldValue: '', newValue: 'Đối tượng điểm', parentGroup: 'Thông tin vùng VTS', isChild: true },
      { field: 'Tọa độ GIS', oldValue: '', newValue: 'POINT (106 16)', parentGroup: 'Thông tin vùng VTS', isChild: true },
    ];
    const merged = mergeChangesByField(rawChanges);
    expect(merged).toHaveLength(5);
    expect(merged.every((m) => m.parentGroup === 'Thông tin vùng VTS' && m.isChild === true)).toBe(true);
  });
});
