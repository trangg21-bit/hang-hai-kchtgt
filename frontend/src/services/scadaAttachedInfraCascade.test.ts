import { describe, it, expect } from 'vitest';
import { resolveOrgSubtreeIds } from '../components/org-unit';

describe('SCADA Attached Infrastructure Cascade & Validation (/scada)', () => {
  const mockOrgUnits = [
    { id: 'org-cuc-hh', name: 'Cục Hàng hải Việt Nam', code: 'CHH' },
    { id: 'org-cv-hp', name: 'Cảng vụ Hàng hải Hải Phòng', code: 'CVHP', parentId: 'org-cuc-hh' },
    { id: 'org-cv-hp-sub', name: 'Đại diện Bạch Đằng', code: 'BD', parentId: 'org-cv-hp' },
    { id: 'org-cv-sg', name: 'Cảng vụ Hàng hải TP.HCM', code: 'CVSG', parentId: 'org-cuc-hh' },
    { id: 'org-cv-dn', name: 'Cảng vụ Hàng hải Đà Nẵng', code: 'CVDN', parentId: 'org-cuc-hh' },
  ];

  const mockRadarStations = [
    { id: 'radar-hp-1', code: 'RD-01', label: 'Trạm Radar Hòn Dáu', orgUnitId: 'org-cv-hp' },
    { id: 'radar-hp-2', code: 'RD-02', label: 'Trạm Radar Bạch Đằng', orgUnitId: 'org-cv-hp-sub' },
    { id: 'radar-sg-1', code: 'RD-03', label: 'Trạm Radar Vũng Tàu', orgUnitId: 'org-cv-sg' },
  ];

  const mockVtsCenters = [
    { id: 'vts-hp-1', code: 'VTS-01', label: 'TTDH VTS Hải Phòng', orgUnitId: 'org-cv-hp' },
    { id: 'vts-sg-1', code: 'VTS-02', label: 'TTDH VTS TP.HCM', orgUnitId: 'org-cv-sg' },
  ];

  function filterAttachedInfra(
    selectedOrgUnitId: string | undefined | null,
    attachedType: number,
  ) {
    if (!selectedOrgUnitId) return [];
    const rawSet = resolveOrgSubtreeIds(mockOrgUnits, String(selectedOrgUnitId));
    const normalizedSet = new Set<string>();
    rawSet.forEach((oId) => normalizedSet.add(String(oId).toLowerCase()));

    const list = attachedType === 1 ? mockVtsCenters : attachedType === 2 ? mockRadarStations : [];
    return list.filter(
      (item) => item.orgUnitId && normalizedSet.has(String(item.orgUnitId).toLowerCase())
    );
  }

  it('TC-SCADA-01: Disables and returns empty attached infrastructure when no Đơn vị quản lý is selected', () => {
    expect(filterAttachedInfra(undefined, 1)).toHaveLength(0);
    expect(filterAttachedInfra(undefined, 2)).toHaveLength(0);
    expect(filterAttachedInfra(null, 1)).toHaveLength(0);
    expect(filterAttachedInfra('', 2)).toHaveLength(0);
  });

  it('TC-SCADA-02: Returns only attached infrastructure (VTS center / Radar station) belonging to selected Đơn vị quản lý and its descendants', () => {
    // VTS Centers for HP (parent org)
    const vtsHp = filterAttachedInfra('org-cv-hp', 1);
    expect(vtsHp).toHaveLength(1);
    expect(vtsHp[0].id).toBe('vts-hp-1');

    // Radar stations for HP: should include both cv-hp and descendant cv-hp-sub
    const radarsHp = filterAttachedInfra('org-cv-hp', 2);
    expect(radarsHp).toHaveLength(2);
    expect(radarsHp.map((r) => r.id)).toEqual(['radar-hp-1', 'radar-hp-2']);

    // Radar stations for sub-unit: only descendant
    const radarsHpSub = filterAttachedInfra('org-cv-hp-sub', 2);
    expect(radarsHpSub).toHaveLength(1);
    expect(radarsHpSub[0].id).toBe('radar-hp-2');

    // VTS Centers for SG
    const vtsSg = filterAttachedInfra('org-cv-sg', 1);
    expect(vtsSg).toHaveLength(1);
    expect(vtsSg[0].id).toBe('vts-sg-1');
  });

  it('TC-SCADA-03: Resets attached infrastructure if currently selected item does not belong to new Đơn vị quản lý', () => {
    let currentAttachedId: string | undefined = 'radar-hp-1';
    const currentAttachedType = 2;

    // User changes orgUnitId to TP.HCM
    const newOrgUnitId = 'org-cv-sg';
    const allowed = resolveOrgSubtreeIds(mockOrgUnits, newOrgUnitId);
    const activeList = currentAttachedType === 1 ? mockVtsCenters : currentAttachedType === 2 ? mockRadarStations : [];
    const isValid = activeList.some(
      (item) => item.id === currentAttachedId && !!item.orgUnitId && allowed.has(String(item.orgUnitId))
    );

    if (!isValid) {
      currentAttachedId = undefined;
    }

    expect(currentAttachedId).toBeUndefined();
  });

  it('TC-SCADA-04: Keeps attached infrastructure if currently selected item belongs to new Đơn vị quản lý', () => {
    let currentAttachedId: string | undefined = 'radar-hp-2';
    const currentAttachedType = 2;

    // User changes orgUnitId from sub-unit to parent (Hải Phòng)
    const newOrgUnitId = 'org-cv-hp';
    const allowed = resolveOrgSubtreeIds(mockOrgUnits, newOrgUnitId);
    const activeList = currentAttachedType === 1 ? mockVtsCenters : currentAttachedType === 2 ? mockRadarStations : [];
    const isValid = activeList.some(
      (item) => item.id === currentAttachedId && !!item.orgUnitId && allowed.has(String(item.orgUnitId))
    );

    if (!isValid) {
      currentAttachedId = undefined;
    }

    expect(currentAttachedId).toBe('radar-hp-2');
  });
});
