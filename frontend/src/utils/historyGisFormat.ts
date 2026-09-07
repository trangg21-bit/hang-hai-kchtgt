/**
 * Hiển thị giá trị GIS trong Drawer Lịch sử — mirror /vts-operation-center
 * (VtsOperationCenterList: parseCoordinatesPoints / renderCoordinatesDisplay / toDmsString).
 * Trả về chuỗi nhiều dòng (nối \n) để các timeline history render với whiteSpace: pre-line.
 */

const toDmsString = (val: number, isLat: boolean): string => {
  const abs = Math.abs(val);
  const d = Math.floor(abs);
  const minFloat = (abs - d) * 60;
  const m = Math.floor(minFloat);
  const s = Math.round((minFloat - m) * 60 * 10) / 10;
  const dir = isLat ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');
  return `${d}° ${m}' ${s.toFixed(1)}" ${dir}`;
};

/** Điểm → 'Điểm', LINE → 'Đường', POLYGON → 'Vùng', MULTIPOINT → 'Tập hợp điểm'. */
export const gisGeometryTypeLabel = (value: string | null | undefined): string => {
  const raw = String(value ?? '').trim().toUpperCase();
  if (raw === 'POINT' || raw === 'ĐIỂM' || raw === 'ĐỐI TƯỢNG ĐIỂM') return 'Điểm';
  if (raw === 'LINE' || raw === 'LINESTRING' || raw === 'ĐƯỜNG' || raw === 'ĐỐI TƯỢNG ĐƯỜNG') return 'Đường';
  if (raw === 'POLYGON' || raw === 'VÙNG' || raw === 'ĐỐI TƯỢNG VÙNG') return 'Vùng';
  if (raw === 'MULTIPOINT') return 'Tập hợp điểm';
  return String(value ?? '').trim();
};

export const isGisHistoryField = (field: string): boolean => {
  const k = String(field || '').toLowerCase();
  return k.includes('toa do') || k.includes('coordinates') || k.includes('tọa độ')
    || k.includes('loai doi tuong') || k.includes('loại đối tượng')
    || k.includes('geometrytype') || k.includes('geometry type');
};

const parseWktPoints = (raw: string): { typeName?: string; points: Array<{ x: string; y: string; index: number }> } | null => {
  const str = String(raw ?? '').trim();
  if (!str || str === '—' || str === 'Chưa có' || str === '(null)' || str === '(trống)') return null;
  if (/^(Đường|Vùng|Điểm)\s+bản\s+đồ\s*\(\d+\s+điểm/i.test(str)) {
    return { typeName: str, points: [] };
  }
  let typeName = '';
  let inner = str;
  if (/^POINT\s*\(/i.test(str)) {
    typeName = 'Điểm';
    inner = str.replace(/^POINT\s*\(/i, '').replace(/\)\s*$/, '');
  } else if (/^LINESTRING\s*\(/i.test(str)) {
    typeName = 'Đường';
    inner = str.replace(/^LINESTRING\s*\(/i, '').replace(/\)\s*$/, '');
  } else if (/^LINE\s*\(/i.test(str)) {
    typeName = 'Đường';
    inner = str.replace(/^LINE\s*\(/i, '').replace(/\)\s*$/, '');
  } else if (/^POLYGON\s*\(\s*\(/i.test(str)) {
    typeName = 'Vùng';
    inner = str.replace(/^POLYGON\s*\(\s*\(/i, '').replace(/\)\s*\)\s*$/, '');
  } else if (/^MULTIPOINT\s*\(/i.test(str)) {
    typeName = 'Tập hợp điểm';
    inner = str.replace(/^MULTIPOINT\s*\(/i, '').replace(/\)\s*$/, '');
  } else if (str.startsWith('(') && str.endsWith(')')) {
    inner = str.slice(1, -1);
  }
  const pointStrings = inner.split(',').map((s) => s.trim()).filter(Boolean);
  if (pointStrings.length === 0) return null;
  const points = pointStrings.map((ps, idx) => {
    const clean = ps.replace(/[()]/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return { x: parts[0], y: parts[1], index: idx + 1 };
    return { x: clean, y: '', index: idx + 1 };
  });
  return { typeName, points };
};

const formatPointDms = (x: string, y: string): string => {
  const xStr = x;
  const xn = Number(x);
  const yn = Number(y);
  if (!Number.isNaN(xn) && !Number.isNaN(yn)) {
    let lat = yn;
    let lng = xn;
    if (xn < 35 && yn > 50) {
      lat = xn;
      lng = yn;
    }
    return `${toDmsString(lat, true)}, ${toDmsString(lng, false)}`;
  }
  if (!Number.isNaN(xn)) {
    const isLat = xn <= 35 && xn >= -35;
    return toDmsString(xn, isLat);
  }
  return xStr;
};

/** WKT → chuỗi nhiều dòng: header 'Vùng (6 điểm)' + mỗi điểm '#i: … N, … E' (giống vts). */
export const gisCoordinatesToLines = (raw: string | null | undefined): string | null => {
  const val = String(raw ?? '').trim();
  if (!val || val === '—' || val === 'Chưa có' || val === '(null)' || val === '(trống)') return null;
  const parsed = parseWktPoints(val);
  if (!parsed || parsed.points.length === 0) {
    return parsed?.typeName || val || null;
  }
  const { typeName, points } = parsed;
  const lines: string[] = [];
  if (typeName) {
    lines.push(`${typeName} (${points.length} điểm)`);
  }
  points.forEach((pt) => {
    const dms = formatPointDms(pt.x, pt.y);
    // Giống vts: chỉ tiền tố #i khi nhiều điểm (điểm đơn hiển thị DMS trực tiếp).
    lines.push(points.length > 1 ? `#${pt.index}:${dms}` : dms);
  });
  return lines.join('\n');
};
