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
    return '99.999.999.999.999.999.999';
  }
  // Nếu là số thuần: tách nguyên và thập phân, định dạng phần nguyên bằng dấu chấm '.' chuẩn vi-VN
  const m = s.match(/^(-?\d+)(\.\d+)?$/);
  if (m) {
    const intPart = m[1].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    let decPart = m[2] ? m[2].substring(1) : '';
    if (decPart && maxDec >= 0) {
      decPart = decPart.substring(0, maxDec);
    }
    return decPart ? `${intPart},${decPart}` : intPart;
  }
  const num = Number(v);
  if (isNaN(num)) return s;
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: maxDec,
  }).format(num);
}

type InputNumberFormatInfo = { userTyping?: boolean; input?: string };

/**
 * Formatter chuẩn vi-VN cho AntD InputNumber.
 * - Dấu chấm phân tách hàng nghìn.
 * - Dấu phẩy phân tách phần thập phân.
 * - Vẫn định dạng ngay trong lúc người dùng đang nhập.
 */
export function formatDotNumber(
  v: string | number | null | undefined,
  info?: InputNumberFormatInfo,
): string {
  if (v === null || v === undefined || v === '') return '';

  let s = String(v).trim().replace(/\s+/g, '');
  if (s === '') return '';

  const negative = s.startsWith('-');
  s = s.replace(/[^0-9.,]/g, '');

  // AntD giữ giá trị nội bộ theo chuẩn JS (dấu chấm thập phân). Nếu formatter
  // nhận chuỗi đã hiển thị, dấu phẩy vẫn được ưu tiên làm dấu thập phân.
  const commaIndex = s.lastIndexOf(',');
  const decimalIndex = commaIndex >= 0 ? commaIndex : s.indexOf('.');
  let integerPart = decimalIndex >= 0 ? s.slice(0, decimalIndex) : s;
  let decimalPart = decimalIndex >= 0 ? s.slice(decimalIndex + 1) : '';
  integerPart = integerPart.replace(/[.,]/g, '') || '0';
  decimalPart = decimalPart.replace(/[.,]/g, '');

  if (!info?.userTyping && decimalPart) {
    decimalPart = decimalPart.replace(/0+$/, '');
  }

  const groupedInteger = integerPart.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sign = negative ? '-' : '';
  const hasDecimalSeparator = decimalIndex >= 0 && (info?.userTyping || decimalPart.length > 0);
  return `${sign}${groupedInteger}${hasDecimalSeparator ? `,${decimalPart}` : ''}`;
}

/**
 * Parser chuẩn vi-VN cho AntD InputNumber: bỏ dấu chấm hàng nghìn và đổi dấu
 * phẩy thập phân về dấu chấm chuẩn của JavaScript/API.
 */
export function parseDotNumber(v: string | undefined | null): string {
  if (!v) return '';
  let s = v
    .replace(/\s+/g, '')
    .replace(/VNĐ|VND|vnd|vnđ/g, '')
    .trim();
  const negative = s.startsWith('-');
  s = s.replace(/[^0-9.,]/g, '');
  const commaIndex = s.lastIndexOf(',');
  const integerPart = (commaIndex >= 0 ? s.slice(0, commaIndex) : s).replace(/[.,]/g, '');
  const decimalPart = commaIndex >= 0 ? s.slice(commaIndex + 1).replace(/[.,]/g, '') : '';
  if (!integerPart && !decimalPart) return '';
  return `${negative ? '-' : ''}${integerPart || '0'}${commaIndex >= 0 ? `.${decimalPart}` : ''}`;
}

/**
 * Format số tiền có dấu chấm '.' và hậu tố ' VNĐ'
 */
export function formatVndCurrency(v: number | string | null | undefined): string {
  if (v === null || v === undefined || v === '') return '';
  const formatted = formatDotNumber(v);
  return formatted ? `${formatted} VNĐ` : '';
}

/**
 * Formatter cho AntD InputNumber: bỏ đuôi '.00'/'.0' thừa khi hiển thị
 * (chỉ áp dụng lúc không gõ — khi user đang gõ thì giữ nguyên chuỗi).
 */
export function fmtInputNumber(
  v: string | number | null | undefined,
  info?: InputNumberFormatInfo,
): string {
  return formatDotNumber(v, info);
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
 * Kiểm tra một trường có phải là trường năm (năm đưa vào sử dụng, năm xây dựng, năm sản xuất...) hay không
 */
export function isYearField(fn: string | null | undefined): boolean {
  if (!fn) return false;
  const raw = fn.trim().toLowerCase();
  // Nếu chuỗi gốc có chữ "năm" (tiếng Việt có dấu)
  if (raw.includes('năm')) return true;

  // Chuỗi không dấu giữ nguyên khoảng trắng
  const normWithSpaces = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  // Khớp từ "nam" độc lập trong cụm từ tiếng Việt không dấu (vd: "nam dua vao su dung")
  if (/\bnam\b/.test(normWithSpaces)) return true;

  const k = normWithSpaces.replace(/[^a-z0-9]/g, '');
  // Các trường tiếng Anh chứa 'year' (yearOfUse, constructionYear, manufactureYear, commissioningYear...)
  if (k.includes('year')) return true;

  // Các trường tiếng Việt dạng camelCase hoặc không dấu viết liền
  const specificNamKeys = [
    'namduavaosudung',
    'namxaydung',
    'namsanxuat',
    'namhoatdong',
    'namvanhanh',
    'namhoanthanh',
    'namnghiemthu',
    'namdutu',
    'namnaovet',
    'nambaotri',
    'namsudung',
  ];
  return specificNamKeys.some((sk) => k.includes(sk));
}

/**
 * Format giá trị năm: giữ nguyên 4 chữ số năm (ví dụ: 2020), không thêm dấu phân cách hàng nghìn (2.020)
 */
export function formatYearValue(val: unknown): string {
  if (val == null) return '';
  const s = String(val).trim();
  if (s === '' || s === '(null)' || s === 'null') return '';
  const match = s.match(/\b(19\d{2}|20\d{2})\b/);
  if (match) return match[0];
  if (/^\d{4}$/.test(s)) return s;
  return s;
}

/**
 * Format số trong Lịch sử thay đổi theo chuẩn vi-VN:
 * - Phân tách hàng nghìn bằng dấu chấm '.'.
 * - Phân tách thập phân bằng dấu phẩy ','.
 * - Định dạng chuỗi thuần túy không qua Number() để tránh làm tròn số lớn (20 số 9)
 * - Tự động sửa 100.000.000.000.000.000.000 / 100000000000000000000 về 99.999.999.999.999.999.999
 */
export function formatHistoryNumber(valStr: string | null | undefined, fieldName?: string): string {
  if (valStr == null) return '';
  let s = String(valStr).trim();
  if (s === '' || s === '(null)' || s === 'null') return '';
  if (fieldName && isYearField(fieldName)) {
    return formatYearValue(s);
  }
  if (s.includes('=')) {
    s = s.substring(s.indexOf('=') + 1).trim();
  }
  s = s.replace(/\.0+$/, '').replace(/(\.\d*?[1-9])0+$/, '$1');
  if (s === '100000000000000000000' || s === '10000000000000000000' ||
      s === '100.000.000.000.000.000.000' || s === '100,000,000,000,000,000,000' ||
      /^10{19,20}$/.test(s) || s.toLowerCase() === '1e+20' || s.toLowerCase() === '1e+19') {
    return '99.999.999.999.999.999.999';
  }
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    return s;
  }
  const m = s.match(/^(-?\d+)(\.\d+)?$/);
  if (m) {
    const intPart = m[1].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const decPart = m[2] ? `,${m[2].slice(1)}` : '';
    return `${intPart}${decPart}`;
  }
  return s;
}
