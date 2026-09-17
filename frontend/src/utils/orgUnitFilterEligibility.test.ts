import { describe, expect, it } from 'vitest';
import { resolveDefaultOrgUnitId } from '../components/org-unit/useUserDefaultOrgUnit';
import { resolveOrgSubtreeIds, type OrgUnitTreeOption } from '../components/org-unit/orgUnitHelpers';
import type { User } from '../store/authStore';

const organizations: OrgUnitTreeOption[] = [
  { id: 'g17', code: 'G17', name: 'Bộ Giao thông Vận tải' },
  { id: 'maritime', code: 'G17.43', name: 'Cục Hàng hải và Đường thủy Việt Nam', parentId: 'g17' },
];

const cascadeOrganizations: OrgUnitTreeOption[] = [
  { id: 'parent', code: 'P', name: 'Parent' },
  { id: 'child', code: 'P.1', name: 'Child', parentId: 'parent' },
  { id: 'sibling', code: 'S', name: 'Sibling' },
];

const rootUser: User = {
  username: 'root-user',
  fullName: 'Root user',
  role: 'USER',
  status: 'authenticated',
  orgUnitId: 'g17',
  orgUnitCode: 'G17',
};

const childAdmin: User = {
  username: 'child-admin',
  fullName: 'Child admin',
  role: 'ADMIN',
  status: 'authenticated',
  orgUnitId: 'maritime',
  orgUnitCode: 'G17.43',
};

describe('org-unit list-filter defaults', () => {
  it('keeps the hidden G17 root unfiltered without adding a synthetic option', () => {
    expect(resolveDefaultOrgUnitId(rootUser, organizations)).toBeUndefined();
  });

  it('keeps an administrator at a level-one unit scoped to that unit', () => {
    expect(resolveDefaultOrgUnitId(childAdmin, organizations)).toBe('maritime');
  });

  it('includes the selected unit and descendants, but excludes siblings and unassigned records', () => {
    const allowedIds = resolveOrgSubtreeIds(cascadeOrganizations, 'parent');
    const ports = [
      { id: 'direct', orgUnitId: 'parent' },
      { id: 'descendant', orgUnitId: 'child' },
      { id: 'sibling', orgUnitId: 'sibling' },
      { id: 'unassigned' },
    ];

    const visibleIds = ports
      .filter((port) => port.orgUnitId && allowedIds.has(port.orgUnitId))
      .map((port) => port.id);

    expect(visibleIds).toEqual(['direct', 'descendant']);
  });
});
