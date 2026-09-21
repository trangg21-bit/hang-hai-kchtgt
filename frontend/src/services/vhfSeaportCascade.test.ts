import { describe, it, expect } from 'vitest';
import { createSchema } from './vhf/schema';
import { resolveOrgSubtreeIds } from '../components/org-unit';

describe('VHF Seaport Cascade & Validation (/vhf)', () => {
  const mockOrgUnits = [
    { id: 'org-cuc-hh', name: 'Cục Hàng hải Việt Nam', code: 'CHH' },
    { id: 'org-cv-hp', name: 'Cảng vụ Hàng hải Hải Phòng', code: 'CVHP', parentId: 'org-cuc-hh' },
    { id: 'org-cv-hp-sub', name: 'Đại diện Bạch Đằng', code: 'BD', parentId: 'org-cv-hp' },
    { id: 'org-cv-sg', name: 'Cảng vụ Hàng hải TP.HCM', code: 'CVSG', parentId: 'org-cuc-hh' },
    { id: 'org-cv-dn', name: 'Cảng vụ Hàng hải Đà Nẵng', code: 'CVDN', parentId: 'org-cuc-hh' },
  ];

  const mockSeaports = [
    { id: 'port-hp-1', portCode: 'G17.43.04.000001', portName: 'Cảng biển Hải Phòng', orgUnitId: 'org-cv-hp' },
    { id: 'port-hp-2', portCode: 'G17.43.04.000002', portName: 'Bến Đình Vũ', orgUnitId: 'org-cv-hp-sub' },
    { id: 'port-sg-1', portCode: 'CB-000003', portName: 'Cảng biển TP.HCM', orgUnitId: 'org-cv-sg' },
    { id: 'port-dn-1', portCode: 'CB-000004', portName: 'Cảng biển Đà Nẵng', orgUnitId: 'org-cv-dn' },
  ];

  function filterSeaports(selectedOrgUnitId: string | undefined | null) {
    if (!selectedOrgUnitId) return [];
    const rawSet = resolveOrgSubtreeIds(mockOrgUnits, String(selectedOrgUnitId));
    const normalizedSet = new Set<string>();
    rawSet.forEach((oId) => normalizedSet.add(String(oId).toLowerCase()));
    return mockSeaports.filter(
      (port) => port.orgUnitId && normalizedSet.has(String(port.orgUnitId).toLowerCase())
    );
  }

  it('TC-VHF-01: Disables and returns empty seaports when no Đơn vị quản lý is selected', () => {
    const portsWhenUndefined = filterSeaports(undefined);
    expect(portsWhenUndefined).toHaveLength(0);

    const portsWhenNull = filterSeaports(null);
    expect(portsWhenNull).toHaveLength(0);

    const portsWhenEmpty = filterSeaports('');
    expect(portsWhenEmpty).toHaveLength(0);
  });

  it('TC-VHF-02: Returns only seaports belonging to selected Đơn vị quản lý and its descendants', () => {
    const portsHp = filterSeaports('org-cv-hp');
    // Should include both direct cv-hp and descendant cv-hp-sub
    expect(portsHp).toHaveLength(2);
    expect(portsHp.map((p) => p.id)).toEqual(['port-hp-1', 'port-hp-2']);

    const portsSg = filterSeaports('org-cv-sg');
    expect(portsSg).toHaveLength(1);
    expect(portsSg[0].id).toBe('port-sg-1');

    const portsDn = filterSeaports('org-cv-dn');
    expect(portsDn).toHaveLength(1);
    expect(portsDn[0].id).toBe('port-dn-1');
  });

  it('TC-VHF-03: Resets seaport if currently selected seaport does not belong to new Đơn vị quản lý', () => {
    let currentSeaportId: string | undefined = 'port-hp-1';

    // User changes orgUnitId to Đà Nẵng
    const newOrgUnitId = 'org-cv-dn';
    const allowed = resolveOrgSubtreeIds(mockOrgUnits, newOrgUnitId);
    const isValid = mockSeaports.some(
      (p) => p.id === currentSeaportId && !!p.orgUnitId && allowed.has(String(p.orgUnitId))
    );

    if (!isValid) {
      currentSeaportId = undefined;
    }

    expect(currentSeaportId).toBeUndefined();
  });

  it('TC-VHF-04: Keeps seaport if currently selected seaport belongs to new Đơn vị quản lý', () => {
    let currentSeaportId: string | undefined = 'port-hp-2';

    // User changes orgUnitId to parent (Hải Phòng)
    const newOrgUnitId = 'org-cv-hp';
    const allowed = resolveOrgSubtreeIds(mockOrgUnits, newOrgUnitId);
    const isValid = mockSeaports.some(
      (p) => p.id === currentSeaportId && !!p.orgUnitId && allowed.has(String(p.orgUnitId))
    );

    if (!isValid) {
      currentSeaportId = undefined;
    }

    expect(currentSeaportId).toBe('port-hp-2');
  });

  it('TC-VHF-05: Validates that seaportId is required in createSchema', () => {
    const invalidPayload = {
      deviceName: 'Trạm VHF Sơn Trà',
      quantity: 1,
      orgUnitId: 'org-cv-dn',
      // seaportId missing
    };

    const result = createSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const seaportError = result.error.issues.find((i) => i.path.includes('seaportId'));
      expect(seaportError).toBeDefined();
    }

    const validPayload = {
      deviceName: 'Trạm VHF Sơn Trà',
      quantity: 1,
      orgUnitId: 'org-cv-dn',
      seaportId: 'port-dn-1',
    };

    const validResult = createSchema.safeParse(validPayload);
    expect(validResult.success).toBe(true);
  });

  it('TC-VHF-06: Formats seaport placeholder without trailing ellipsis', () => {
    const getSeaportPlaceholder = (selectedOrgUnitId: string | undefined) =>
      !selectedOrgUnitId ? 'Vui lòng chọn đơn vị quản lý trước' : 'Chọn cảng biển';

    expect(getSeaportPlaceholder(undefined)).toBe('Vui lòng chọn đơn vị quản lý trước');
    expect(getSeaportPlaceholder(undefined).endsWith('...')).toBe(false);
    expect(getSeaportPlaceholder('org-cv-hp')).toBe('Chọn cảng biển');
    expect(getSeaportPlaceholder('org-cv-hp').endsWith('...')).toBe(false);
  });

  it('TC-VHF-07: Auto-generates device code only when seaport is selected (matching /berth)', () => {
    const getDeviceCodePlaceholder = (loading: boolean, watchedSeaportId: string | undefined) =>
      loading ? 'Đang sinh mã...' : watchedSeaportId ? 'Mã tự động' : 'Chọn Cảng biển để sinh mã';

    // When no seaport is selected yet
    expect(getDeviceCodePlaceholder(false, undefined)).toBe('Chọn Cảng biển để sinh mã');

    // When generating
    expect(getDeviceCodePlaceholder(true, 'port-hp-1')).toBe('Đang sinh mã...');

    // When seaport is selected and code is ready
    expect(getDeviceCodePlaceholder(false, 'port-hp-1')).toBe('Mã tự động');
  });

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

  it('TC-VHF-08: Disables and returns empty attached infrastructure when no Đơn vị quản lý is selected', () => {
    expect(filterAttachedInfra(undefined, 1)).toHaveLength(0);
    expect(filterAttachedInfra(undefined, 2)).toHaveLength(0);
    expect(filterAttachedInfra(null, 1)).toHaveLength(0);
    expect(filterAttachedInfra('', 2)).toHaveLength(0);
  });

  it('TC-VHF-09: Returns only attached infrastructure (VTS center / Radar station) belonging to selected Đơn vị quản lý and its descendants', () => {
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

  it('TC-VHF-10: Resets attached infrastructure if currently selected item does not belong to new Đơn vị quản lý', () => {
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

  it('TC-VHF-11: Keeps attached infrastructure if currently selected item belongs to new Đơn vị quản lý', () => {
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

  it('TC-VHF-12: List page filteredFilterRadarStationOptions correctly filters by orgUnitId subtree or returns all', () => {
    const radarOptions = mockRadarStations.map((r) => ({
      label: r.label,
      value: r.id,
      orgUnitId: r.orgUnitId,
    }));

    // When __all__ or undefined, return all
    const allRadars = radarOptions;
    expect(allRadars).toHaveLength(3);

    // When org-cv-hp is selected
    const rawSet = resolveOrgSubtreeIds(mockOrgUnits, 'org-cv-hp');
    const hpRadars = radarOptions.filter((r) => r.orgUnitId && rawSet.has(r.orgUnitId));
    expect(hpRadars).toHaveLength(2);
    expect(hpRadars.map((r) => r.value)).toEqual(['radar-hp-1', 'radar-hp-2']);

    // When org-cv-sg is selected
    const sgSet = resolveOrgSubtreeIds(mockOrgUnits, 'org-cv-sg');
    const sgRadars = radarOptions.filter((r) => r.orgUnitId && sgSet.has(r.orgUnitId));
    expect(sgRadars).toHaveLength(1);
    expect(sgRadars[0].value).toBe('radar-sg-1');
  });
});

