export interface GisOrgUnitOption {
  id: string;
  code?: string;
  name?: string;
  rank?: string;
}

const normalizeVietnamese = (value?: string): string =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase()
    .trim();

/**
 * Đơn vị mặc định của màn tra cứu GIS là Cục Hàng hải và Đường thủy Việt Nam.
 * Ưu tiên mã danh mục ổn định; tên chỉ là fallback cho dữ liệu môi trường cũ.
 */
export function resolveGisDefaultOrgUnitId(
  organizations: readonly GisOrgUnitOption[] = [],
): string | undefined {
  const maritimeByCode = organizations.find(
    (org) => String(org.code || '').trim().toUpperCase() === 'G17.43',
  );
  if (maritimeByCode?.id) return String(maritimeByCode.id);

  const maritimeByName = organizations.find((org) => {
    const name = normalizeVietnamese(org.name);
    return name.includes('cuc hang hai') && !name.includes('chi cuc hang hai');
  });
  return maritimeByName?.id ? String(maritimeByName.id) : undefined;
}
