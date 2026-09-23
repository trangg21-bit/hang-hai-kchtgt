import { describe, expect, it } from 'vitest';
import { getProvinceLabel } from '../types/common';

function normalizeHistoryKey(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
}

function isProvinceHistoryField(field: string): boolean {
  if (!field) return false;
  const raw = normalizeHistoryKey(field);
  const compact = raw.replace(/[\s\-_/().,]/g, '');
  return (
    compact === 'provinceid'
    || compact === 'province'
    || compact === 'tinh'
    || compact === 'tinhtp'
    || compact === 'tinhthanhpho'
    || compact === 'diadiemtinh'
    || compact === 'diadiemtinhtp'
    || compact === 'diadiemtinhthanhpho'
    || compact.includes('province')
    || compact.includes('tinhtp')
    || compact.includes('tinhthanhpho')
    || (compact.includes('diadiem') && compact.includes('tinh'))
  );
}

function formatHistoryValue(fn: string, raw: string | null): string | null {
  if (raw === null || raw === '(null)' || raw === '') return null;
  const t = raw.trim();
  if (t.startsWith('[') && t.endsWith(']')) {
    if (t === '[]') return 'Không có';
    const parts = t.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
    return `${parts.length} mục`;
  }
  if (isProvinceHistoryField(fn)) {
    return getProvinceLabel(raw);
  }
  if (/^-?\d+(\.\d+)?$/.test(t)) {
    return t;
  }
  return raw;
}

describe('getProvinceLabel & province history resolution', () => {
  it('resolves numeric province IDs to Vietnamese names', () => {
    // Hà Nội id=1
    expect(getProvinceLabel(1)).toBe('Hà Nội');
    expect(getProvinceLabel('1')).toBe('Hà Nội');

    // Hải Phòng id=31
    expect(getProvinceLabel(31)).toBe('Hải Phòng');
    expect(getProvinceLabel('31')).toBe('Hải Phòng');

    // TP. Hồ Chí Minh id=79
    expect(getProvinceLabel(79)).toBe('TP. Hồ Chí Minh');
    expect(getProvinceLabel('79')).toBe('TP. Hồ Chí Minh');
  });

  it('normalizes province names with prefixes from backend/database', () => {
    // From backend formatDisplayValue or DB provinces.name
    expect(getProvinceLabel('Thành phố Hà Nội')).toBe('Hà Nội');
    expect(getProvinceLabel('Tỉnh Hải Dương')).toBe('Hải Dương');
    expect(getProvinceLabel('Thành phố Hải Phòng')).toBe('Hải Phòng');
    expect(getProvinceLabel('Thành phố Hồ Chí Minh')).toBe('TP. Hồ Chí Minh');
    expect(getProvinceLabel('Tỉnh Bà Rịa - Vũng Tàu')).toBe('Bà Rịa - Vũng Tàu');
    expect(getProvinceLabel('Tỉnh Thừa Thiên Huế')).toBe('Thừa Thiên Huế');
  });

  it('accepts standard short names without altering them', () => {
    expect(getProvinceLabel('Hà Nội')).toBe('Hà Nội');
    expect(getProvinceLabel('Hải Dương')).toBe('Hải Dương');
    expect(getProvinceLabel('Hải Phòng')).toBe('Hải Phòng');
    expect(getProvinceLabel('Bà Rịa - Vũng Tàu')).toBe('Bà Rịa - Vũng Tàu');
  });

  it('handles empty and special values safely without crashing', () => {
    expect(getProvinceLabel(undefined)).toBe('');
    expect(getProvinceLabel(null as any)).toBe('');
    expect(getProvinceLabel('')).toBe('');
    expect(getProvinceLabel('   ')).toBe('');
    expect(getProvinceLabel('—')).toBe('');
    expect(getProvinceLabel('null')).toBe('');
    expect(getProvinceLabel('(null)')).toBe('');
    expect(getProvinceLabel('Chưa có')).toBe('Chưa có');
    expect(getProvinceLabel('(trống)')).toBe('Chưa có');
  });

  it('falls back to raw string when non-empty custom name is provided, never returns empty string', () => {
    expect(getProvinceLabel('Tỉnh Thử Nghiệm')).toBe('Tỉnh Thử Nghiệm');
    expect(getProvinceLabel('Vùng biển quốc tế')).toBe('Vùng biển quốc tế');
  });

  it('correctly recognizes all variations of province history field names', () => {
    expect(isProvinceHistoryField('provinceId')).toBe(true);
    expect(isProvinceHistoryField('province')).toBe(true);
    expect(isProvinceHistoryField('Địa điểm (Tỉnh/TP)')).toBe(true);
    expect(isProvinceHistoryField('Địa điểm (Tỉnh / TP)')).toBe(true);
    expect(isProvinceHistoryField('Địa điểm (Tỉnh/Thành phố)')).toBe(true);
    expect(isProvinceHistoryField('Tỉnh / Thành phố')).toBe(true);
    expect(isProvinceHistoryField('Tỉnh/TP')).toBe(true);

    // Negative tests
    expect(isProvinceHistoryField('Địa điểm chi tiết')).toBe(false);
    expect(isProvinceHistoryField('Tên trạm radar')).toBe(false);
    expect(isProvinceHistoryField('Vùng phủ sóng')).toBe(false);
  });

  it('formats province history values correctly without being intercepted as a raw number', () => {
    // Numeric ID '31' should resolve to 'Hải Phòng', NOT raw string '31'
    expect(formatHistoryValue('Địa điểm (Tỉnh/TP)', '31')).toBe('Hải Phòng');
    expect(formatHistoryValue('Địa điểm (Tỉnh/TP)', '1')).toBe('Hà Nội');
    expect(formatHistoryValue('Địa điểm (Tỉnh/TP)', 'Thành phố Hà Nội')).toBe('Hà Nội');
    expect(formatHistoryValue('Địa điểm (Tỉnh/TP)', 'Tỉnh Hải Dương')).toBe('Hải Dương');
    expect(formatHistoryValue('Địa điểm (Tỉnh/TP)', 'Chưa có')).toBe('Chưa có');
  });

  it('prevents blank history row when province is updated', () => {
    const fn = 'Địa điểm (Tỉnh/TP)';
    const oldVal = 'Thành phố Hà Nội';
    const newVal = 'Tỉnh Hải Dương';

    const ov = formatHistoryValue(fn, oldVal);
    const nv = formatHistoryValue(fn, newVal);

    expect(ov).toBe('Hà Nội');
    expect(nv).toBe('Hải Dương');

    const isOvEmpty = ov == null || ov === '' || ov === '—' || ov === 'Chưa có';
    const isNvEmpty = nv == null || nv === '' || nv === '—' || nv === 'Chưa có';
    const shouldDrop = isOvEmpty && isNvEmpty;

    // Must NOT be dropped!
    expect(shouldDrop).toBe(false);
    expect(ov).not.toBe(nv);
  });
});
