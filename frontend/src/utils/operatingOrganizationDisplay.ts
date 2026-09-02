import { DEFAULT_OPERATING_ORGANIZATIONS } from '../services/operatingOrganizationsData';

export const getOperatingOrganizationDisplayName = (id?: string, name?: string): string => {
  if (name) return name;
  if (!id) return '—';
  return DEFAULT_OPERATING_ORGANIZATIONS.find((organization) => organization.id === id)?.name || id;
};
