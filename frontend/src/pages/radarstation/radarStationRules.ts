import {
  normalizeDecimal20_4,
  parseNumber20,
  getValueFromEvent20,
  decimalNumberRule,
  safeNumber,
  safeDecimal,
} from '../../utils/numberRuleHelper';

export {
  normalizeDecimal20_4,
  parseNumber20,
  getValueFromEvent20,
  decimalNumberRule,
  safeNumber,
  safeDecimal,
};

/** Bản ghi đã hoàn tất phê duyệt chỉ được lưu lại bằng hành động phê duyệt. */
export function isApprovedRadarStatus(status?: string | null): boolean {
  const normalized = String(status || '').trim().toUpperCase();
  return normalized === 'APPROVED' || normalized === 'APPROVED_LEVEL2';
}
