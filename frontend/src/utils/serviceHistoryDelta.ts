import {
  resolveMaritimeServiceLabel,
  parseMaritimeServiceTokens,
} from '../constants/maritimeServices';

export type ServiceHistoryDelta = {
  field: string;
  oldValue: string;
  newValue: string;
};

const EMPTY_VALUES = new Set(['', '—', '-', '–', '(null)', 'null', 'undefined']);

const normalizeFieldName = (field: unknown): string => String(field ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/gi, 'd')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '');

export const isServicesProvidedHistoryField = (field: unknown): boolean => {
  const normalized = normalizeFieldName(field);
  return normalized === 'services'
    || normalized === 'servicesprovided'
    || normalized === 'dichvucungcap'
    || normalized === 'providedservices';
};

const toServiceValues = (raw: unknown): string[] => {
  if (raw === null || raw === undefined) return [];
  const text = String(raw).trim();
  if (EMPTY_VALUES.has(text.toLowerCase())) return [];

  const tokens = parseMaritimeServiceTokens(raw);
  const seen = new Set<string>();
  return tokens
    .map((item) => item.trim())
    .filter((item) => item && !EMPTY_VALUES.has(item.toLowerCase()))
    .filter((item) => {
      const key = item.toLocaleLowerCase('vi-VN');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

/**
 * Hiển thị đầy đủ danh sách dịch vụ trước và sau khi thay đổi (không chỉ hiển thị phần delta).
 * Ví dụ: cũ có 2 dịch vụ, thêm 1 dịch vụ -> cũ hiển thị cả 2 dịch vụ, mới hiển thị cả 3 dịch vụ.
 * Chuyển toàn bộ mã sang tên tiếng Việt đầy đủ và mỗi dịch vụ xuống 1 dòng.
 */
export const getServicesProvidedHistoryDelta = (
  field: unknown,
  previousValue: unknown,
  newValue: unknown,
): ServiceHistoryDelta[] => {
  if (!isServicesProvidedHistoryField(field)) return [];

  const oldServices = toServiceValues(previousValue);
  const newServices = toServiceValues(newValue);

  // So sánh xem 2 tập hợp có giống nhau không
  const oldKeys = new Set(oldServices.map((item) => item.toLocaleLowerCase('vi-VN')));
  const newKeys = new Set(newServices.map((item) => item.toLocaleLowerCase('vi-VN')));
  const isSame = oldServices.length === newServices.length &&
    oldServices.every((item) => newKeys.has(item.toLocaleLowerCase('vi-VN')));

  if (isSame) return [];

  // Dịch toàn bộ mã sang tên tiếng Việt đầy đủ
  const oldLabels = oldServices.map((item) => resolveMaritimeServiceLabel(item));
  const newLabels = newServices.map((item) => resolveMaritimeServiceLabel(item));

  return [{
    field: 'Dịch vụ cung cấp',
    oldValue: oldLabels.length > 0 ? oldLabels.join('\n') : '',
    newValue: newLabels.length > 0 ? newLabels.join('\n') : '',
  }];
};
