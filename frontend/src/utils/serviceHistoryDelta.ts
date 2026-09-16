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

  if (text.startsWith('[') && text.endsWith(']')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return toServiceValues(parsed.join(','));
      }
    } catch {
      // The legacy value is not JSON; process it as a delimited string below.
    }
  }

  const seen = new Set<string>();
  return text
    .split(/[;,\r\n]+/)
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
 * Turns a snapshot list into the user-facing delta. For example, only DSC is
 * shown when `LRIT, COSPAS-SARSAT` becomes `LRIT, COSPAS-SARSAT, DSC`.
 */
export const getServicesProvidedHistoryDelta = (
  field: unknown,
  previousValue: unknown,
  newValue: unknown,
): ServiceHistoryDelta[] => {
  if (!isServicesProvidedHistoryField(field)) return [];

  const oldServices = toServiceValues(previousValue);
  const newServices = toServiceValues(newValue);
  const oldKeys = new Set(oldServices.map((item) => item.toLocaleLowerCase('vi-VN')));
  const newKeys = new Set(newServices.map((item) => item.toLocaleLowerCase('vi-VN')));
  const removed = oldServices.filter((item) => !newKeys.has(item.toLocaleLowerCase('vi-VN')));
  const added = newServices.filter((item) => !oldKeys.has(item.toLocaleLowerCase('vi-VN')));
  if (removed.length === 0 && added.length === 0) return [];

  return [{
    field: 'Dịch vụ cung cấp',
    oldValue: removed.join('\n'),
    newValue: added.join('\n'),
  }];
};
