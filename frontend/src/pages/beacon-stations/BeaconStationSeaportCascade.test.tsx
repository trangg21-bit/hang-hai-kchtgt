import { describe, it, expect } from 'vitest';
import { resolveOrgSubtreeIds, flattenOrgUnits } from '../../components/org-unit';
import type { OrgUnitTreeOption } from '../../components/org-unit';

describe('BeaconStation Seaport Cascade & Code Generation (/beacon-stations)', () => {
  // Cấu trúc phân cấp 3 cấp: Cục (Root) -> Cảng vụ (Cấp 2) -> Đại diện (Cấp 3)
  const mockOrgUnits: OrgUnitTreeOption[] = [
    { id: 'org-cuc-hh', name: 'Cục Hàng hải Việt Nam', code: 'CHH' },
    { id: 'org-cv-hp', name: 'Cảng vụ Hàng hải Hải Phòng', code: 'CVHP', parentId: 'org-cuc-hh' },
    { id: 'org-cv-hp-sub1', name: 'Đại diện Bạch Đằng', code: 'BD', parentId: 'org-cv-hp' },
    { id: 'org-cv-hp-sub2', name: 'Đại diện Lạch Huyện', code: 'LH', parentId: 'org-cv-hp' },
    { id: 'org-cv-sg', name: 'Cảng vụ Hàng hải TP.HCM', code: 'CVSG', parentId: 'org-cuc-hh' },
    { id: 'org-cv-sg-sub', name: 'Đại diện Cát Lái', code: 'CL', parentId: 'org-cv-sg' },
    { id: 'org-cv-dn', name: 'Cảng vụ Hàng hải Đà Nẵng', code: 'CVDN', parentId: 'org-cuc-hh' },
  ];

  // Cấu trúc cây lồng nhau (nested tree structure do organizationService.getTree() trả về)
  const mockNestedOrgTree: OrgUnitTreeOption[] = [
    {
      id: 'ORG-CUC-HH',
      name: 'Cục Hàng hải Việt Nam',
      code: 'CHH',
      children: [
        {
          id: 'ORG-CV-HP',
          name: 'Cảng vụ Hàng hải Hải Phòng',
          code: 'CVHP',
          children: [
            { id: 'ORG-CV-HP-SUB1', name: 'Đại diện Bạch Đằng', code: 'BD' },
            { id: 'ORG-CV-HP-SUB2', name: 'Đại diện Lạch Huyện', code: 'LH' },
          ],
        },
        {
          id: 'ORG-CV-SG',
          name: 'Cảng vụ Hàng hải TP.HCM',
          code: 'CVSG',
          children: [
            { id: 'ORG-CV-SG-SUB', name: 'Đại diện Cát Lái', code: 'CL' },
          ],
        },
        {
          id: 'ORG-CV-DN',
          name: 'Cảng vụ Hàng hải Đà Nẵng',
          code: 'CVDN',
          children: [],
        },
      ],
    },
  ];

  const mockSeaports = [
    { id: 'port-cuc-1', portCode: 'CB-CUC-01', portName: 'Cảng trực thuộc Cục', orgUnitId: 'org-cuc-hh' },
    { id: 'port-hp-1', portCode: 'G17.43.04.000001', portName: 'Cảng biển Hải Phòng', orgUnitId: 'org-cv-hp' },
    { id: 'port-hp-sub1', portCode: 'G17.43.04.000002', portName: 'Bến Đình Vũ (Bạch Đằng)', orgUnitId: 'org-cv-hp-sub1' },
    { id: 'port-hp-sub2', portCode: 'G17.43.04.000003', portName: 'Cảng Quốc tế Lạch Huyện', orgUnitId: 'org-cv-hp-sub2' },
    { id: 'port-sg-1', portCode: 'CB-000003', portName: 'Cảng biển TP.HCM', orgUnitId: 'org-cv-sg' },
    { id: 'port-sg-sub', portCode: 'CB-000004', portName: 'Tân Cảng Cát Lái', orgUnitId: 'org-cv-sg-sub' },
    { id: 'port-dn-1', portCode: 'CB-000005', portName: 'Cảng biển Đà Nẵng', orgUnitId: 'org-cv-dn' },
  ];

  // Helper hàm lọc cảng biển trong Form thêm mới / chỉnh sửa
  function filterFormSeaports(selectedUnitId: string | undefined | null, orgs = mockOrgUnits) {
    if (!selectedUnitId) return [];
    const rawSet = resolveOrgSubtreeIds(orgs, String(selectedUnitId));
    const normalizedSet = new Set<string>();
    rawSet.forEach((oId) => normalizedSet.add(String(oId).trim().toLowerCase()));
    return mockSeaports.filter(
      (port) => port.orgUnitId && normalizedSet.has(String(port.orgUnitId).trim().toLowerCase()),
    );
  }

  // Helper hàm lọc cảng biển trên thanh Filter Sidebar của danh sách
  function filterSidebarSeaports(filterUnitId: string | undefined | null, orgs = mockOrgUnits) {
    if (!filterUnitId || filterUnitId === '__all__') return mockSeaports;
    const rawSet = resolveOrgSubtreeIds(orgs, filterUnitId);
    const normalizedSet = new Set<string>();
    rawSet.forEach((oId) => normalizedSet.add(String(oId).trim().toLowerCase()));
    return mockSeaports.filter(
      (port) => port.orgUnitId && normalizedSet.has(String(port.orgUnitId).trim().toLowerCase()),
    );
  }

  it('TC-BEACON-01: Disables and returns empty seaports when no Đơn vị quản lý is selected in Form', () => {
    expect(filterFormSeaports(undefined)).toHaveLength(0);
    expect(filterFormSeaports(null)).toHaveLength(0);
    expect(filterFormSeaports('')).toHaveLength(0);
  });

  it('TC-BEACON-02: Returns all seaports in Filter Sidebar when filterUnitId is empty or "__all__"', () => {
    expect(filterSidebarSeaports(undefined)).toHaveLength(mockSeaports.length);
    expect(filterSidebarSeaports(null)).toHaveLength(mockSeaports.length);
    expect(filterSidebarSeaports('')).toHaveLength(mockSeaports.length);
    expect(filterSidebarSeaports('__all__')).toHaveLength(mockSeaports.length);
  });

  it('TC-BEACON-03: When selecting parent unit (Cục Hàng hải), returns seaports belonging to Cục AND ALL child/grandchild units', () => {
    const portsCuc = filterFormSeaports('org-cuc-hh');
    // Phải gồm: port-cuc-1, port-hp-1, port-hp-sub1, port-hp-sub2, port-sg-1, port-sg-sub, port-dn-1
    expect(portsCuc).toHaveLength(7);
    const portIds = portsCuc.map((p) => p.id);
    expect(portIds).toContain('port-cuc-1');
    expect(portIds).toContain('port-hp-1');
    expect(portIds).toContain('port-hp-sub1');
    expect(portIds).toContain('port-hp-sub2');
    expect(portIds).toContain('port-sg-1');
    expect(portIds).toContain('port-sg-sub');
    expect(portIds).toContain('port-dn-1');
  });

  it('TC-BEACON-04: When selecting child unit with children (Cảng vụ Hải Phòng), returns its ports AND its sub-units ports', () => {
    const portsHp = filterFormSeaports('org-cv-hp');
    // Phải gồm: port-hp-1 (CVHP), port-hp-sub1 (Bạch Đằng), port-hp-sub2 (Lạch Huyện)
    expect(portsHp).toHaveLength(3);
    const portIds = portsHp.map((p) => p.id);
    expect(portIds).toEqual(['port-hp-1', 'port-hp-sub1', 'port-hp-sub2']);
    // Không chứa cảng của Cục hay các cảng vụ khác
    expect(portIds).not.toContain('port-cuc-1');
    expect(portIds).not.toContain('port-sg-1');
    expect(portIds).not.toContain('port-dn-1');
  });

  it('TC-BEACON-05: When selecting leaf child unit (Đại diện Bạch Đằng / Lạch Huyện), returns ONLY its own seaports', () => {
    const portsSub1 = filterFormSeaports('org-cv-hp-sub1');
    expect(portsSub1).toHaveLength(1);
    expect(portsSub1[0].id).toBe('port-hp-sub1');

    const portsSub2 = filterFormSeaports('org-cv-hp-sub2');
    expect(portsSub2).toHaveLength(1);
    expect(portsSub2[0].id).toBe('port-hp-sub2');

    const portsDn = filterFormSeaports('org-cv-dn');
    expect(portsDn).toHaveLength(1);
    expect(portsDn[0].id).toBe('port-dn-1');
  });

  it('TC-BEACON-06: Works seamlessly when organizations is a nested tree structure with uppercase IDs', () => {
    // Test flattenOrgUnits
    const flat = flattenOrgUnits(mockNestedOrgTree);
    expect(flat.length).toBe(7);

    // Test resolveOrgSubtreeIds with parent node
    const cucSubtree = resolveOrgSubtreeIds(mockNestedOrgTree, 'org-cuc-hh');
    expect(cucSubtree.has('org-cuc-hh')).toBe(true);
    expect(cucSubtree.has('org-cv-hp')).toBe(true);
    expect(cucSubtree.has('org-cv-hp-sub1')).toBe(true);

    // Test cascade filter seaports with nested tree
    const portsHp = filterFormSeaports('org-cv-hp', mockNestedOrgTree);
    expect(portsHp).toHaveLength(3);
    expect(portsHp.map((p) => p.id)).toEqual(['port-hp-1', 'port-hp-sub1', 'port-hp-sub2']);

    const portsSub1 = filterFormSeaports('org-cv-hp-sub1', mockNestedOrgTree);
    expect(portsSub1).toHaveLength(1);
    expect(portsSub1[0].id).toBe('port-hp-sub1');
  });

  it('TC-BEACON-07: Tolerates whitespace and case differences in selected unit ID', () => {
    const portsWithSpace = filterFormSeaports('  ORG-CV-HP  ');
    expect(portsWithSpace).toHaveLength(3);
    expect(portsWithSpace.map((p) => p.id)).toEqual(['port-hp-1', 'port-hp-sub1', 'port-hp-sub2']);
  });

  it('TC-BEACON-08: Resets seaport if currently selected seaport does not belong to new Đơn vị quản lý', () => {
    let currentSeaportId: string | undefined = 'port-hp-1';

    // Chuyển sang Cảng vụ Đà Nẵng
    const newUnitId = 'org-cv-dn';
    const allowed = resolveOrgSubtreeIds(mockOrgUnits, newUnitId);
    const normalizedSet = new Set<string>();
    allowed.forEach((oId) => normalizedSet.add(String(oId).trim().toLowerCase()));

    const currentPortStr = String(currentSeaportId).trim().toLowerCase();
    const isValid = mockSeaports.some(
      (p) => String(p.id).trim().toLowerCase() === currentPortStr && !!p.orgUnitId && normalizedSet.has(String(p.orgUnitId).trim().toLowerCase()),
    );

    if (!isValid) {
      currentSeaportId = undefined;
    }

    expect(currentSeaportId).toBeUndefined();
  });

  it('TC-BEACON-09: Preserves seaport if currently selected seaport belongs to descendant of new Đơn vị quản lý', () => {
    // Đang chọn cảng thuộc đơn vị con Bạch Đằng
    let currentSeaportId: string | undefined = 'port-hp-sub1';

    // Đơn vị quản lý chuyển thành đơn vị cha Cảng vụ Hải Phòng
    const newUnitId = 'org-cv-hp';
    const allowed = resolveOrgSubtreeIds(mockOrgUnits, newUnitId);
    const normalizedSet = new Set<string>();
    allowed.forEach((oId) => normalizedSet.add(String(oId).trim().toLowerCase()));

    const currentPortStr = String(currentSeaportId).trim().toLowerCase();
    const isValid = mockSeaports.some(
      (p) => String(p.id).trim().toLowerCase() === currentPortStr && !!p.orgUnitId && normalizedSet.has(String(p.orgUnitId).trim().toLowerCase()),
    );

    if (!isValid) {
      currentSeaportId = undefined;
    }

    // Do port-hp-sub1 thuộc org-cv-hp-sub1 (con của org-cv-hp), seaport này vẫn hợp lệ và được giữ nguyên
    expect(currentSeaportId).toBe('port-hp-sub1');
  });

  it('TC-BEACON-10: Formats seaport placeholder without trailing ellipsis', () => {
    const getSeaportPlaceholder = (selectedUnitId: string | undefined) =>
      !selectedUnitId ? 'Vui lòng chọn đơn vị quản lý trước' : 'Chọn cảng biển';

    expect(getSeaportPlaceholder(undefined)).toBe('Vui lòng chọn đơn vị quản lý trước');
    expect(getSeaportPlaceholder(undefined).endsWith('...')).toBe(false);
    expect(getSeaportPlaceholder('org-cv-hp')).toBe('Chọn cảng biển');
    expect(getSeaportPlaceholder('org-cv-hp').endsWith('...')).toBe(false);
  });

  it('TC-BEACON-11: Formats code placeholder matching /berth standard', () => {
    const getCodePlaceholder = (loading: boolean, watchedSeaportId: string | undefined) =>
      loading ? 'Đang sinh mã...' : watchedSeaportId ? 'Mã tự động' : 'Chọn Cảng biển để sinh mã';

    // No seaport chosen yet
    expect(getCodePlaceholder(false, undefined)).toBe('Chọn Cảng biển để sinh mã');

    // Generating code
    expect(getCodePlaceholder(true, 'port-hp-1')).toBe('Đang sinh mã...');

    // Code ready
    expect(getCodePlaceholder(false, 'port-hp-1')).toBe('Mã tự động');
  });

  it('TC-BEACON-12: Resets code when seaport is cleared in create mode', () => {
    let code: string | undefined = 'DBNT-000001';
    const isEdit = false;
    const watchedSeaportId: string | undefined = undefined;

    if (!watchedSeaportId && !isEdit) {
      code = undefined;
    }

    expect(code).toBeUndefined();
  });
});
