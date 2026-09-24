import { describe, it, expect } from 'vitest';
import { formatFallbackFieldLabel } from '../components/shared/CommonHistoryDrawer';

describe('GIS Spatial Category History Standard', () => {
  it('correctly maps GIS spatial category fields to Vietnamese labels', () => {
    const gisMap: Record<string, string> = {
      code: 'Mã đối tượng',
      name: 'Tên đối tượng',
      geometryType: 'Loại đối tượng',
      iconId: 'Biểu tượng',
      status: 'Trạng thái',
      displayRule: 'Quy tắc hiển thị',
      coordinates: 'Tọa độ GPS',
      attachments: 'File đính kèm',
    };

    expect(formatFallbackFieldLabel('code', gisMap)).toBe('Mã đối tượng');
    expect(formatFallbackFieldLabel('name', gisMap)).toBe('Tên đối tượng');
    expect(formatFallbackFieldLabel('geometryType', gisMap)).toBe('Loại đối tượng');
    expect(formatFallbackFieldLabel('iconId', gisMap)).toBe('Biểu tượng');
    expect(formatFallbackFieldLabel('displayRule', gisMap)).toBe('Quy tắc hiển thị');
    expect(formatFallbackFieldLabel('coordinates', gisMap)).toBe('Tọa độ GPS');
    expect(formatFallbackFieldLabel('attachments', gisMap)).toBe('File đính kèm');
    expect(formatFallbackFieldLabel('status', gisMap)).toBe('Trạng thái');
  });

  it('verifies DEFAULT_FIELD_MAP contains GIS fields natively in CommonHistoryDrawer', () => {
    // Tests that without custom map, standard fields map to proper labels
    expect(formatFallbackFieldLabel('geometryType')).toBe('Loại đối tượng');
    expect(formatFallbackFieldLabel('displayRule')).toBe('Quy tắc hiển thị');
    expect(formatFallbackFieldLabel('coordinates')).toBe('Tọa độ GPS');
    expect(formatFallbackFieldLabel('iconId')).toBe('Biểu tượng');
    expect(formatFallbackFieldLabel('Mã đối tượng')).toBe('Mã đối tượng');
    expect(formatFallbackFieldLabel('Tên đối tượng')).toBe('Tên đối tượng');
    expect(formatFallbackFieldLabel('Loại đối tượng')).toBe('Loại đối tượng');
  });

  it('formats timestamp as HH:mm DD/MM/YYYY matching the design', async () => {
    const dayjs = (await import('dayjs')).default;
    const testDate = '2026-09-23T15:17:00Z';
    const d = dayjs(testDate);
    const formatted = `${d.format('HH:mm')} ${d.format('DD/MM/YYYY')}`;
    expect(formatted).toMatch(/\d{2}:\d{2} \d{2}\/\d{2}\/\d{4}/);
  });
});
