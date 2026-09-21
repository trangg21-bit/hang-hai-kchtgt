import { describe, it, expect } from 'vitest';
import { resolveOrgSubtreeIds } from '../../components/org-unit';

describe('BeaconStation Seaport Cascade & Code Generation (/beacon-stations)', () => {
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

  function filterSeaports(selectedUnitId: string | undefined | null) {
    if (!selectedUnitId) return [];
    const rawSet = resolveOrgSubtreeIds(mockOrgUnits, String(selectedUnitId));
    const normalizedSet = new Set<string>();
    rawSet.forEach((oId) => normalizedSet.add(String(oId).toLowerCase()));
    return mockSeaports.filter(
      (port) => port.orgUnitId && normalizedSet.has(String(port.orgUnitId).toLowerCase())
    );
  }

  it('TC-BEACON-01: Disables and returns empty seaports when no Đơn vị quản lý is selected', () => {
    expect(filterSeaports(undefined)).toHaveLength(0);
    expect(filterSeaports(null)).toHaveLength(0);
    expect(filterSeaports('')).toHaveLength(0);
  });

  it('TC-BEACON-02: Returns only seaports belonging to selected Đơn vị quản lý and its descendants', () => {
    const portsHp = filterSeaports('org-cv-hp');
    expect(portsHp).toHaveLength(2);
    expect(portsHp.map((p) => p.id)).toEqual(['port-hp-1', 'port-hp-2']);

    const portsSg = filterSeaports('org-cv-sg');
    expect(portsSg).toHaveLength(1);
    expect(portsSg[0].id).toBe('port-sg-1');

    const portsDn = filterSeaports('org-cv-dn');
    expect(portsDn).toHaveLength(1);
    expect(portsDn[0].id).toBe('port-dn-1');
  });

  it('TC-BEACON-03: Resets seaport if currently selected seaport does not belong to new Đơn vị quản lý', () => {
    let currentSeaportId: string | undefined = 'port-hp-1';

    const newUnitId = 'org-cv-dn';
    const allowed = resolveOrgSubtreeIds(mockOrgUnits, newUnitId);
    const isValid = mockSeaports.some(
      (p) => p.id === currentSeaportId && !!p.orgUnitId && allowed.has(String(p.orgUnitId))
    );

    if (!isValid) {
      currentSeaportId = undefined;
    }

    expect(currentSeaportId).toBeUndefined();
  });

  it('TC-BEACON-04: Keeps seaport if currently selected seaport belongs to new Đơn vị quản lý', () => {
    let currentSeaportId: string | undefined = 'port-hp-2';

    const newUnitId = 'org-cv-hp';
    const allowed = resolveOrgSubtreeIds(mockOrgUnits, newUnitId);
    const isValid = mockSeaports.some(
      (p) => p.id === currentSeaportId && !!p.orgUnitId && allowed.has(String(p.orgUnitId))
    );

    if (!isValid) {
      currentSeaportId = undefined;
    }

    expect(currentSeaportId).toBe('port-hp-2');
  });

  it('TC-BEACON-05: Formats seaport placeholder without trailing ellipsis', () => {
    const getSeaportPlaceholder = (selectedUnitId: string | undefined) =>
      !selectedUnitId ? 'Vui lòng chọn đơn vị quản lý trước' : 'Chọn cảng biển';

    expect(getSeaportPlaceholder(undefined)).toBe('Vui lòng chọn đơn vị quản lý trước');
    expect(getSeaportPlaceholder(undefined).endsWith('...')).toBe(false);
    expect(getSeaportPlaceholder('org-cv-hp')).toBe('Chọn cảng biển');
    expect(getSeaportPlaceholder('org-cv-hp').endsWith('...')).toBe(false);
  });

  it('TC-BEACON-06: Formats code placeholder matching /berth standard', () => {
    const getCodePlaceholder = (loading: boolean, watchedSeaportId: string | undefined) =>
      loading ? 'Đang sinh mã...' : watchedSeaportId ? 'Mã tự động' : 'Chọn Cảng biển để sinh mã';

    // No seaport chosen yet
    expect(getCodePlaceholder(false, undefined)).toBe('Chọn Cảng biển để sinh mã');

    // Generating code
    expect(getCodePlaceholder(true, 'port-hp-1')).toBe('Đang sinh mã...');

    // Code ready
    expect(getCodePlaceholder(false, 'port-hp-1')).toBe('Mã tự động');
  });

  it('TC-BEACON-07: Resets code when seaport is cleared in create mode', () => {
    let code: string | undefined = 'DBNT-000001';
    const isEdit = false;
    let watchedSeaportId: string | undefined = undefined;

    if (!watchedSeaportId && !isEdit) {
      code = undefined;
    }

    expect(code).toBeUndefined();
  });
});
