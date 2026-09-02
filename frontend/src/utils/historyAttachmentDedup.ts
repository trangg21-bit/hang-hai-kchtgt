export interface HistoryAttachmentChange {
  field: string;
  oldValue?: unknown;
  newValue?: unknown;
}

function normalizeHistoryText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd');
}

function isAttachmentField(field: string): boolean {
  const normalized = normalizeHistoryText(field);
  return normalized.includes('dinh kem') || normalized.includes('attachment');
}

function parseAttachmentValues(value: unknown): string[] {
  if (value === null || value === undefined) return [];

  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }

  const text = String(value).trim();
  if (!text || ['—', '-', '(null)', 'null', '(trống)', 'undefined'].includes(text.toLowerCase())) {
    return [];
  }

  if (text.startsWith('[') && text.endsWith(']')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map(String).map((item) => item.trim()).filter(Boolean);
      }
    } catch {
      // Fall through to the delimiter-based format used by older history rows.
    }
  }

  return text
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter((item) => item && !['—', '-', '(null)', 'null', '(trống)', 'undefined'].includes(item.toLowerCase()));
}

function normalizeAttachmentName(value: string): string {
  return normalizeHistoryText(value).replace(/^(them|xoa|cu|moi)\s*:?\s+/, '').trim();
}

function attachmentDeltaKeys(change: HistoryAttachmentChange): string[] {
  const oldValues = parseAttachmentValues(change.oldValue).map(normalizeAttachmentName).filter(Boolean);
  const newValues = parseAttachmentValues(change.newValue).map(normalizeAttachmentName).filter(Boolean);
  const oldSet = new Set(oldValues);
  const newSet = new Set(newValues);

  return [
    ...oldValues.filter((value) => !newSet.has(value)).map((value) => `removed:${value}`),
    ...newValues.filter((value) => !oldSet.has(value)).map((value) => `added:${value}`),
  ];
}

/**
 * Hides a legacy combined attachment delta when the same files are also logged
 * individually by the upload/delete endpoint.
 */
export function deduplicateAttachmentHistoryChanges<T extends HistoryAttachmentChange>(changes: T[]): T[] {
  const seen = new Set<string>();

  // Older write paths could store one combined row for a multi-file upload
  // and one row per file. Find the individual rows first so the combined row
  // is removed regardless of the order returned by the history API.
  const individualDeltaKeys = new Set(
    changes
      .filter((change) => isAttachmentField(change.field))
      .flatMap((change) => {
        const keys = attachmentDeltaKeys(change);
        return keys.length === 1 ? keys : [];
      }),
  );

  return changes.filter((change) => {
    if (!isAttachmentField(change.field)) return true;

    const keys = attachmentDeltaKeys(change);
    if (keys.length === 0) return true;

    if (keys.length > 1 && keys.every((key) => individualDeltaKeys.has(key))) {
      return false;
    }

    const duplicate = keys.every((key) => seen.has(key));
    keys.forEach((key) => seen.add(key));
    return !duplicate;
  });
}
