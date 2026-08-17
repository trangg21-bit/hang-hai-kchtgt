export function fmtNum(v: number | null | undefined, maxDec = 2): string {
  if (v === null || v === undefined) return '—';
  return v.toFixed(maxDec).replace(/\.?0+$/, '');
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
