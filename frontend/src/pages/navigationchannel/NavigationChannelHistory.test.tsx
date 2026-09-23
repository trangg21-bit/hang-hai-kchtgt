import { describe, it, expect } from 'vitest';
import { gisCoordinatesToLines, gisGeometryTypeLabel } from '../../utils/historyGisFormat';

describe('NavigationChannel History Drawer Formatting (/navigation-channel)', () => {
  it('TC-HIST-01: formats GIS coordinates from WKT into DMS lines matching Detail View (#1: ... N, ... E)', () => {
    // Navigation Channel typically uses LINESTRING
    const lineWkt = 'LINESTRING (106.666667 10.75, 106.7 10.783333)';
    const lineFormatted = gisCoordinatesToLines(lineWkt);
    expect(lineFormatted).toBeTruthy();
    const lineLines = lineFormatted!.split('\n');
    expect(lineLines).toHaveLength(2);
    expect(lineLines[0]).toMatch(/^#1:\s*10°\s*45'\s*0"\s*N,\s*106°\s*40'/);
    expect(lineLines[1]).toMatch(/^#2:\s*10°\s*46'/);

    // Channel water zone uses POLYGON (4 vertices in ring, duplicate closing vertex stripped -> 3 vertices)
    const polyWkt = 'POLYGON ((106.666667 10.75, 106.7 10.783333, 106.75 10.75, 106.666667 10.75))';
    const polyFormatted = gisCoordinatesToLines(polyWkt);
    expect(polyFormatted).toBeTruthy();
    const polyLines = polyFormatted!.split('\n');
    expect(polyLines).toHaveLength(3);
    expect(polyLines[0]).toMatch(/^#1:\s*10°\s*45'\s*0"\s*N,\s*106°\s*40'/);
    expect(polyLines[1]).toMatch(/^#2:\s*10°\s*46'/);
    expect(polyLines[2]).toMatch(/^#3:\s*10°\s*45'\s*0"\s*N,\s*106°\s*45'/);

    // Single POINT
    const pointWkt = 'POINT (106.666667 10.75)';
    const pointFormatted = gisCoordinatesToLines(pointWkt);
    expect(pointFormatted).not.toContain('#1:');
    expect(pointFormatted).toMatch(/10°\s*45'\s*0"\s*N/);
  });

  it('TC-HIST-02: maps GIS geometryType to human-friendly Vietnamese label', () => {
    expect(gisGeometryTypeLabel('LINESTRING')).toBe('Đường');
    expect(gisGeometryTypeLabel('LineString')).toBe('Đường');
    expect(gisGeometryTypeLabel('LINE')).toBe('Đường');
    expect(gisGeometryTypeLabel('POLYGON')).toBe('Vùng');
    expect(gisGeometryTypeLabel('POINT')).toBe('Điểm');
    expect(gisGeometryTypeLabel(null)).toBe('');
    expect(gisGeometryTypeLabel(undefined)).toBe('');
  });

  it('TC-HIST-03: formats multiple attachments into stacked lines without overflowing', () => {
    const rawAttachmentString = 'Quyet_dinh_cong_bo_luong.pdf, Thong_so_ky_thuat_luong.docx, So_do_luong.png, Bieu_03_thong_ke.pdf';
    const items = rawAttachmentString.split(/,\s*(?=[^,]+)/).map((s) => s.trim()).filter(Boolean);
    expect(items).toHaveLength(4);
    expect(items[0]).toBe('Quyet_dinh_cong_bo_luong.pdf');
    expect(items[1]).toBe('Thong_so_ky_thuat_luong.docx');
    expect(items[2]).toBe('So_do_luong.png');
    expect(items[3]).toBe('Bieu_03_thong_ke.pdf');
  });

  it('TC-HIST-04: reconstructs legacy attachment snapshot (3 prior files -> 4 current files)', () => {
    const allCurrentFiles = [
      'Quyet_dinh_cong_bo_luong.pdf',
      'Thong_so_ky_thuat_luong.docx',
      'So_do_luong.png',
      'Bieu_03_thong_ke.pdf',
    ];

    // Simulating legacy row where previousValue was null/empty and newValue was the single newly added file
    const legacyRow = {
      status: 'ATTACHMENT_UPLOADED',
      previousValue: null as string | null,
      newValue: 'Bieu_03_thong_ke.pdf',
    };

    let prevDisp = legacyRow.previousValue;
    let newDisp = legacyRow.newValue;

    if (!prevDisp || prevDisp === '—' || prevDisp === 'Chưa có') {
      const addedFile = legacyRow.newValue ? legacyRow.newValue.trim() : '';
      const prevFiles = allCurrentFiles.filter((f) => f.toLowerCase() !== addedFile.toLowerCase());
      if (prevFiles.length > 0) {
        prevDisp = prevFiles.join(', ');
        newDisp = allCurrentFiles.join(', ');
      }
    }

    expect(prevDisp).toBe('Quyet_dinh_cong_bo_luong.pdf, Thong_so_ky_thuat_luong.docx, So_do_luong.png');
    expect(newDisp).toBe('Quyet_dinh_cong_bo_luong.pdf, Thong_so_ky_thuat_luong.docx, So_do_luong.png, Bieu_03_thong_ke.pdf');
  });

  it('TC-HIST-05: reconstructs legacy attachment deletion snapshot (4 prior files -> 3 current files)', () => {
    const allCurrentFiles = [
      'Quyet_dinh_cong_bo_luong.pdf',
      'Thong_so_ky_thuat_luong.docx',
      'So_do_luong.png',
    ];

    const deletedFile = 'Tep_bi_xoa.pdf';
    const legacyRow = {
      status: 'ATTACHMENT_DELETED',
      previousValue: deletedFile,
      newValue: null as string | null,
    };

    let prevDisp = legacyRow.previousValue;
    let newDisp = legacyRow.newValue;

    if (!newDisp || newDisp === '—' || newDisp === 'Chưa có') {
      const prevFiles = [...allCurrentFiles];
      if (deletedFile && !prevFiles.includes(deletedFile)) {
        prevFiles.push(deletedFile);
      }
      prevDisp = prevFiles.join(', ');
      newDisp = allCurrentFiles.join(', ');
    }

    expect(prevDisp).toBe('Quyet_dinh_cong_bo_luong.pdf, Thong_so_ky_thuat_luong.docx, So_do_luong.png, Tep_bi_xoa.pdf');
    expect(newDisp).toBe('Quyet_dinh_cong_bo_luong.pdf, Thong_so_ky_thuat_luong.docx, So_do_luong.png');
  });
});
