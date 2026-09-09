export function fmtNum(v: number | string | null | undefined, maxDec = 2): string {
  if (v === null || v === undefined || v === '') return '';
  let s = String(v).trim();
  if (s === '') return '';
  // Bỏ phần .00 thừa
  s = s.replace(/\.0+$/, '').replace(/(\.\d*?[1-9])0+$/, '$1');
  // Nếu bị biến thành 100000000000000000000 (21 ký tự) hoặc 10000000000000000000 do JS float
  if (s === '100000000000000000000' || s === '10000000000000000000' ||
      s === '100.000.000.000.000.000.000' || s === '100,000,000,000,000,000,000' ||
      /^10{19,20}$/.test(s) || s.toLowerCase() === '1e+20' || s.toLowerCase() === '1e+19') {
    return '99,999,999,999,999,999,999';
  }
  // Nếu là số thuần: tách nguyên và thập phân, định dạng phần nguyên bằng dấu phẩy ',' mà không ép kiểu sang Number()
  const m = s.match(/^(-?\d+)(\.\d+)?$/);
  if (m) {
    const intPart = m[1].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    let decPart = m[2] ? m[2].substring(1) : '';
    if (decPart && maxDec >= 0) {
      decPart = decPart.substring(0, maxDec);
    }
    return decPart ? `${intPart}.${decPart}` : intPart;
  }
  const num = Number(v);
  if (isNaN(num)) return s;
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: maxDec,
  }).format(num);
}

/**
 * Formatter cho AntD InputNumber: bỏ đuôi '.00'/'.0' thừa khi hiển thị
 * (chỉ áp dụng lúc không gõ — khi user đang gõ thì giữ nguyên chuỗi).
 */
export function fmtInputNumber(
  v: string | number | null | undefined,
  info?: { userTyping?: boolean },
): string {
  if (info?.userTyping) return v === null || v === undefined ? '' : String(v);
  if (v === null || v === undefined || v === '') return '';
  const s = String(v);
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
}

/**
 * Chuẩn hóa số lớn: loại bỏ .0000 thừa và khôi phục nếu bị JS float làm tròn thành 100000000000000000000 / 10000000000000000000
 */
export function normalizeSafeNumber(v: unknown): string | undefined {
  if (v == null || v === '') return undefined;
  const s = String(v).trim();
  if (s === '') return undefined;
  const clean = s.includes('.') ? s.replace(/\.0+$/, '').replace(/(\.\d*?[1-9])0+$/, '$1') : s;
  if (clean === '100000000000000000000' || clean === '10000000000000000000' || /^10{19,20}$/.test(clean) || clean.toLowerCase() === '1e+20' || clean.toLowerCase() === '1e+19') {
    return '99999999999999999999';
  }
  return clean;
}

/**
 * Format số trong Lịch sử thay đổi:
 * - Phân tách hàng nghìn bằng dấu phẩy ',' (chuẩn en-US), KHÔNG dùng dấu chấm '.'
 * - Định dạng chuỗi thuần túy không qua Number() để tránh làm tròn số lớn (20 số 9)
 * - Tự động sửa 100.000.000.000.000.000.000 / 100000000000000000000 về 99,999,999,999,999,999,999
 */
export function formatHistoryNumber(valStr: string | null | undefined): string {
  if (valStr == null) return '';
  let s = String(valStr).trim();
  if (s === '' || s === '(null)' || s === 'null') return '';
  if (s.includes('=')) {
    s = s.substring(s.indexOf('=') + 1).trim();
  }
  s = s.replace(/\.0+$/, '').replace(/(\.\d*?[1-9])0+$/, '$1');
  if (s === '100000000000000000000' || s === '10000000000000000000' ||
      s === '100.000.000.000.000.000.000' || s === '100,000,000,000,000,000,000' ||
      /^10{19,20}$/.test(s) || s.toLowerCase() === '1e+20' || s.toLowerCase() === '1e+19') {
    return '99,999,999,999,999,999,999';
  }
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    return s.replace(/\./g, ',');
  }
  const m = s.match(/^(-?\d+)(\.\d+)?$/);
  if (m) {
    const intPart = m[1].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const decPart = m[2] ? m[2] : '';
    return `${intPart}${decPart}`;
  }
  return s;
}
