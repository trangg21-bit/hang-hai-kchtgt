/**
 * ============================================================
 * UNIT ORACLE — MENU-MODEL v2 navigation helpers (F-292, M-024)
 * Materializes the wave-1 acceptance-map unit semantics:
 *   - AC-024-03 (kchtTree 28-type coverage vs the cha–con matrix)
 *   - AC-024-05 (accessibleTree pruning, disabled retention, non-mutation)
 *   - AC-024-06 / AC-024-09 (locateRoute longest-match + openKeys; groupOfPath)
 *
 * Expected values are derived from EXTERNAL sources only, never from the
 * tree under test (non-tautology guard, acceptance-map.json):
 *   - 28-type matrix: `SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md` §2 (repo root),
 *     rows 1..28 — canonical route key per row as cross-checked by QA w2
 *     (07-qa-report-w2.md, AC-024-03 evidence).
 *   - Màn hình ngoài ma trận (quyết định 2026-09-07): /navigation-channel-chk,
 *     /water-zone, /station/coastal và node '/vts-system — Thông tin hệ thống VTS'
 *     KHÔNG còn nằm trong cây menu KCHT — route/page giữ nguyên, chỉ không còn
 *     trong menu 28 loại (user: "menu phải hiển thị đúng file SO-DO…").
 *   - User decision 2026-09-04: legacy 2nd screen /ship-repair-facility (row 9)
 *     removed from the kcht menu — matrix row 9 keeps its single canonical screen
 *     /ship-repair-yard. The legacy route/page itself is untouched (still reachable
 *     via /kcht-directory and GIS deep links).
 * ============================================================
 */
import { describe, expect, it } from 'vitest';
import {
  NAV_GROUPS,
  accessibleTree,
  collectNavLabels,
  collectParentKeys,
  collectRoutes,
  firstAccessibleRoute,
  groupOfPath,
  locateRoute,
  normalizeSearchText,
  pruneTreeByLevel,
  searchNavGroups,
  treeNodeLevels,
  type NavGroup,
  type NavNode,
} from './navigation';

// ---------------------------------------------------------------------------
// Helpers (test-local)
// ---------------------------------------------------------------------------

interface FlatEntry {
  key: string;
  route?: string;
  label: string;
  disabled?: boolean;
  ancestors: string[];
}

/** Flatten a nav tree into entries carrying their ancestor key chain. */
function flatten(nodes: NavNode[], ancestors: string[] = []): FlatEntry[] {
  return nodes.flatMap((n) => [
    { key: n.key, route: n.route, label: n.label, disabled: n.disabled, ancestors },
    ...(n.children ? flatten(n.children, [...ancestors, n.key]) : []),
  ]);
}

const flatKeys = (entries: FlatEntry[]): string[] => entries.map((e) => e.key);
const flatKeysOf = (nodes: NavNode[]): string[] => flatKeys(flatten(nodes));

function cloneTree(nodes: NavNode[]): NavNode[] {
  return nodes.map((n) => ({ ...n, children: n.children ? cloneTree(n.children) : undefined }));
}

function deepFreezeStructure(nodes: NavNode[]): void {
  for (const n of nodes) {
    if (n.children) deepFreezeStructure(n.children);
    Object.freeze(n);
  }
  Object.freeze(nodes);
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** kcht group tree = single source of the 28-type KCHT menu (navigation.tsx:76). */
const kcht = NAV_GROUPS.find((g) => g.id === 'kcht');
if (!kcht) throw new Error('NAV_GROUPS missing kcht group');
const kchtTree = kcht.tree;

/** 28 canonical route keys, one per matrix row (§2 of the external matrix doc). */
const MATRIX_28_KEYS = [
  '/port', // Cảng biển
  '/berth', // Bến cảng
  '/pier', // Cầu cảng
  '/buoy-berth', // Bến phao
  '/navigation-channel', // Luồng hàng hải
  '/anchorage', // Khu neo đậu
  '/transfer-area', // Khu chuyển tải
  '/storm-shelter', // Khu tránh, trú bão
  '/ship-repair-yard', // Cơ sở sửa chữa, đóng tàu
  '/dry-port', // Cảng cạn
  '/vts-system', // Hệ thống VTS
  '/vts-operation-center', // Trung tâm điều hành VTS
  '/radar-station', // Trạm Radar
  '/ais-system', // Hệ thống AIS
  '/cctv', // Hệ thống CCTV
  '/scada', // Hệ thống SCADA
  '/transmission', // Hệ thống truyền dẫn
  '/vts-assist', // Hệ thống phụ trợ VTS
  '/beacon-stations', // Đèn biển & nhà trạm
  '/buoys', // Phao, tiêu
  '/buoy-station', // Nhà trạm quản lý vận hành Phao, tiêu
  '/dike-revetment', // Đê chắn sóng, đê chắn cát, kè
  '/dai-ttdh', // Đài TTDH
  'vhf-disabled', // Hệ thống VHF — disabled node, no route
  '/station/inmarsat', // Đài vệ tinh Inmarsat
  '/station/lrit', // Đài LRIT
  '/station/cospas-sarsat', // Đài Cospas-Sarsat
  '/station/hanoi', // Đài TTXLTT Hà Nội
] as const;

/** Route-less grouping parents (structural, not matrix rows). */
const GROUPING_ROOT_KEYS = ['kcht-vienthong'] as const;

// ---------------------------------------------------------------------------
// AC-024-03 — kchtTree covers exactly 28 types of the cha–con matrix
// ---------------------------------------------------------------------------

describe('navigation.kchtTree — AC-024-03 (28 KCHT types, external matrix)', () => {
  const entries = flatten(kchtTree);
  const keys = flatKeys(entries);

  it('group kcht exists and declares 28 types', () => {
    expect(kcht.id).toBe('kcht');
    expect(kcht.desc).toContain('28');
  });

  it('covers exactly the 28 canonical type keys of the matrix (count === 28)', () => {
    expect(MATRIX_28_KEYS).toHaveLength(28);
    // every matrix row is represented in the tree
    expect(keys).toEqual(expect.arrayContaining([...MATRIX_28_KEYS]));
    // type-level inventory is stable: 28 canonical types + the single route-less
    // grouping root (Đài viễn thông hàng hải) and nothing else.
    expect(keys.length).toBe(MATRIX_28_KEYS.length + GROUPING_ROOT_KEYS.length);
    const unknown = keys.filter(
      (k) =>
        !(MATRIX_28_KEYS as readonly string[]).includes(k) &&
        !(GROUPING_ROOT_KEYS as readonly string[]).includes(k),
    );
    expect(unknown).toEqual([]);
  });

  it('has no duplicate keys and a non-empty Vietnamese label per node', () => {
    expect(new Set(keys).size).toBe(keys.length);
    for (const e of entries) expect(e.label.trim().length).toBeGreaterThan(0);
  });

  it('contains exactly one disabled node — VHF under the Đài viễn thông root', () => {
    const disabledEntries = entries.filter((e) => e.disabled);
    expect(disabledEntries).toHaveLength(1);
    const vhf = disabledEntries[0];
    expect(vhf.key).toBe('vhf-disabled');
    expect(vhf.label).toBe('VHF');
    expect(vhf.route).toBeUndefined();
    expect(vhf.ancestors).toEqual(['kcht-vienthong']);
  });

  it('keeps the multi-layer parent–child chains of the matrix (depth >= 3)', () => {
    const byKey = new Map(entries.map((e) => [e.key, e]));
    // Cảng biển → Bến cảng → Cầu cảng
    expect(byKey.get('/pier')?.ancestors).toEqual(['/port', '/berth']);
    // Cảng biển → Luồng hàng hải → Bến phao (sửa 2026-09-07: khớp ma trận #4)
    expect(byKey.get('/buoy-berth')?.ancestors).toEqual(['/port', '/navigation-channel']);
    // Luồng hàng hải → Nhà trạm phao tiêu → Phao tiêu
    expect(byKey.get('/buoys')?.ancestors).toEqual(['/port', '/navigation-channel', '/buoy-station']);
    // Hệ thống VTS (node route '/vts-system') → Trung tâm điều hành VTS → Trạm Radar
    expect(byKey.get('/radar-station')?.ancestors).toEqual(['/vts-system', '/vts-operation-center']);
    expect(byKey.get('/dai-ttdh')?.ancestors).toEqual(['kcht-vienthong']);
  });
});

// ---------------------------------------------------------------------------
// AC-024-05 — accessibleTree: prune denied routes, drop empty parents,
//             keep disabled nodes, never mutate input
// ---------------------------------------------------------------------------

describe('navigation.accessibleTree — AC-024-05', () => {
  it('keeps only the allowed leaf chain and drops every denied sibling branch', () => {
    // Production-shaped prune: only /pier allowed → only its ancestor chain survives
    const out = accessibleTree(kchtTree, (r) => r === '/pier');
    const outKeys = flatKeysOf(out);
    expect(outKeys.sort()).toEqual(['/berth', '/pier', '/port', 'kcht-vienthong', 'vhf-disabled']);
    // denied route screens must NOT survive alongside the retained disabled VHF
    expect(outKeys).not.toContain('/dai-ttdh');
    expect(outKeys).not.toContain('/dry-port');
    expect(outKeys).not.toContain('/navigation-channel');
  });

  it('drops a route-less parent whose children were all denied (zero surviving children)', () => {
    const tree: NavNode[] = [
      { key: 'grp', label: 'Nhóm rỗng', children: [{ key: '/x', route: '/x', label: 'X' }] },
      { key: '/open', route: '/open', label: 'Open' },
    ];
    const out = accessibleTree(tree, (r) => r === '/open');
    expect(flatKeysOf(out)).toEqual(['/open']);
  });

  it('retains a parent with a denied route when a child survives (kept as group)', () => {
    const tree: NavNode[] = [
      {
        key: '/a', route: '/a', label: 'A',
        children: [
          { key: '/a/b', route: '/a/b', label: 'B' },
          { key: '/a/c', route: '/a/c', label: 'C' },
        ],
      },
    ];
    const out = accessibleTree(tree, (r) => r === '/a/c');
    expect(flatKeysOf(out)).toEqual(['/a', '/a/c']);
  });

  it('does not permission-gate disabled nodes: VHF survives even when everything is denied', () => {
    // real kcht tree, deny-all except /pier is covered above; here synthetic deny-all:
    const tree: NavNode[] = [
      { key: 'root', label: 'Nhóm', children: [{ key: 'v', route: '/vhf', label: 'VHF', disabled: true }] },
      { key: '/ok', route: '/ok', label: 'Ok' },
    ];
    const out = accessibleTree(tree, () => false);
    expect(flatKeysOf(out)).toEqual(['root', 'v']);
  });

  it('output key-set is a subset of the input key-set (filtering never invents nodes)', () => {
    const out = accessibleTree(kchtTree, (r) => r === '/pier');
    const inKeys = flatKeysOf(kchtTree);
    for (const k of flatKeysOf(out)) expect(inKeys).toContain(k);
  });

  it('allow-all keeps the whole tree identical (no accidental pruning)', () => {
    const out = accessibleTree(kchtTree, () => true);
    expect(flatKeysOf(out).sort()).toEqual(flatKeysOf(kchtTree).sort());
  });

  it('does NOT mutate its input — deep-frozen tree survives every call', () => {
    const frozen = cloneTree(kchtTree);
    deepFreezeStructure(frozen);
    const snapshot = () =>
      flatten(frozen)
        .map((e) => `${e.key}|${e.route ?? ''}|${e.disabled ?? ''}`)
        .join(';');
    const before = snapshot();
    expect(() => accessibleTree(frozen, () => true)).not.toThrow();
    accessibleTree(frozen, () => false);
    accessibleTree(frozen, (r) => r === '/pier');
    expect(snapshot()).toBe(before);
  });
});

// ---------------------------------------------------------------------------
// AC-024-02/09 — groupOfPath: sidebar block inferred from the current route
// ---------------------------------------------------------------------------

describe('navigation.groupOfPath — AC-024-02/09', () => {
  it("returns undefined for '/' (landing has no block menu)", () => {
    expect(groupOfPath('/')).toBeUndefined();
  });

  it("maps '/port' to the kcht block", () => {
    expect(groupOfPath('/port')?.id).toBe('kcht');
  });

  it("maps '/dai-ttdh' (Đài viễn thông branch) to the kcht block", () => {
    expect(groupOfPath('/dai-ttdh')?.id).toBe('kcht');
    expect(groupOfPath('/dai-ttdh/1')?.id).toBe('kcht');
  });

  it('maps deeper routes to their owning block (/users → admin, /asset/increase → asset)', () => {
    expect(groupOfPath('/users')?.id).toBe('admin');
    expect(groupOfPath('/asset/increase')?.id).toBe('asset');
  });

  it('returns undefined for unknown pathnames', () => {
    expect(groupOfPath('/no-such-route')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// AC-024-06 — locateRoute: longest-match key + ancestor openKeys
// ---------------------------------------------------------------------------

describe('navigation.locateRoute — AC-024-06', () => {
  const sample: NavNode[] = [
    {
      key: '/a', route: '/a', label: 'A',
      children: [
        {
          key: '/a/b', route: '/a/b', label: 'B',
          children: [{ key: '/a/b/c', route: '/a/b/c', label: 'C' }],
        },
      ],
    },
    { key: '/solo', route: '/solo', label: 'Solo' },
  ];

  it('returns the deepest matching node (longest match wins) with ancestor openKeys', () => {
    // '/a/b/c' also prefix-matches '/a' and '/a/b'; deepest must win
    expect(locateRoute(sample, '/a/b/c')).toEqual({ key: '/a/b/c', openKeys: ['/a', '/a/b'] });
  });

  it('for a parent node openKeys include the node itself (it opens a submenu)', () => {
    expect(locateRoute(sample, '/a/b')).toEqual({ key: '/a/b', openKeys: ['/a', '/a/b'] });
    expect(locateRoute(sample, '/a')).toEqual({ key: '/a', openKeys: ['/a'] });
  });

  it('matches detail/create suffixes of a route (route + /:id | /create)', () => {
    expect(locateRoute(sample, '/a/b/c/9/edit')).toEqual({ key: '/a/b/c', openKeys: ['/a', '/a/b'] });
    expect(locateRoute(sample, '/solo/create')).toEqual({ key: '/solo', openKeys: [] });
  });

  it('returns undefined when nothing matches and never locates a disabled node', () => {
    expect(locateRoute(sample, '/nope')).toBeUndefined();
    const withDisabled: NavNode[] = [{ key: '/d', route: '/d', label: 'D', disabled: true }];
    expect(locateRoute(withDisabled, '/d')).toBeUndefined();
  });

  it('locates real kcht routes with their sidebar openKeys chain', () => {
    expect(locateRoute(kchtTree, '/pier')).toEqual({ key: '/pier', openKeys: ['/port', '/berth'] });
    expect(locateRoute(kchtTree, '/buoys')).toEqual({
      key: '/buoys',
      openKeys: ['/port', '/navigation-channel', '/buoy-station'],
    });
    expect(locateRoute(kchtTree, '/station/hanoi')).toEqual({ key: '/station/hanoi', openKeys: ['kcht-vienthong'] });
  });

  it('does not cross-match routes sharing a textual prefix (segment boundary)', () => {
    // '/navigation-channel/1' resolves to the Luồng node (id detail suffix), while
    // '/buoy-berth/7' resolves to the Bến phao leaf under Luồng — nhưng path chỉ
    // "bắt đầu bằng" cùng text ('/buoy-berth-extra/7') không được khớp '/buoy-berth'.
    expect(locateRoute(kchtTree, '/navigation-channel/1')).toEqual({
      key: '/navigation-channel',
      openKeys: ['/port', '/navigation-channel'],
    });
    expect(locateRoute(kchtTree, '/buoy-berth/7')).toEqual({
      key: '/buoy-berth',
      openKeys: ['/port', '/navigation-channel'],
    });
    expect(locateRoute(kchtTree, '/buoy-berth-extra/7')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// AC-024-04 — firstAccessibleRoute: first reachable route in a block
// ---------------------------------------------------------------------------

describe('navigation.firstAccessibleRoute — AC-024-04', () => {
  it('returns undefined when no route is accessible', () => {
    expect(firstAccessibleRoute(kcht, () => false)).toBeUndefined();
  });

  it('returns the first reachable route in tree order', () => {
    expect(firstAccessibleRoute(kcht, () => true)).toBe('/port');
  });

  it('descends into the first branch with an allowed descendant', () => {
    expect(firstAccessibleRoute(kcht, (r) => r === '/pier')).toBe('/pier');
  });

  it('never returns a disabled node even when its route is allowed', () => {
    const tree: NavNode[] = [
      { key: '/v', route: '/v', label: 'VHF', disabled: true },
      { key: '/ok', route: '/ok', label: 'Ok' },
    ];
    const group: NavGroup = { id: 'kcht', label: 'T', desc: 'D', icon: null, tree };
    expect(firstAccessibleRoute(group, () => true)).toBe('/ok');
  });
});

// ---------------------------------------------------------------------------
// M-024 rework 2026-09-06 — treeNodeLevels / pruneTreeByLevel / collectParentKeys
// (chips C0..C3, back-row, Mở rộng/Thu gọn tất cả — preview-menu-final.html)
// ---------------------------------------------------------------------------

describe('navigation.treeNodeLevels — chips C0..C3 depth oracle', () => {
  it('levels real kcht routes by depth (root = C0)', () => {
    const levels = treeNodeLevels(kchtTree);
    // Chain evidence khớp locateRoute (external): /port(root) → /berth → /pier
    expect(levels.get('/pier')).toBe(2);
    // /port → /navigation-channel → /buoy-station → /buoys
    expect(levels.get('/buoys')).toBe(3);
    // kcht-vienthong (root) → /station/hanoi
    expect(levels.get('/station/hanoi')).toBe(1);
  });

  it('stays within the C0..C3 chip range for the whole kcht tree', () => {
    const levels = treeNodeLevels(kchtTree);
    const maxLevel = Math.max(0, ...levels.values());
    expect(maxLevel).toBeLessThanOrEqual(3);
  });

  it('does not mutate the source tree', () => {
    const before = collectRoutes(kchtTree).length;
    treeNodeLevels(kchtTree);
    expect(collectRoutes(kchtTree).length).toBe(before);
  });
});

describe('navigation.pruneTreeByLevel — chips filter semantics', () => {
  const sample: NavNode[] = [
    {
      key: '/a',
      route: '/a',
      label: 'A',
      children: [
        {
          key: '/b',
          route: '/b',
          label: 'B',
          children: [{ key: '/c', route: '/c', label: 'C' }],
        },
        { key: '/d', route: '/d', label: 'D' },
      ],
    },
  ];
  const sampleKeys = (nodes: NavNode[]): string[] =>
    nodes.flatMap((n) => [n.key, ...(n.children ? sampleKeys(n.children) : [])]);

  it('keeps every node when all four levels are allowed', () => {
    const pruned = pruneTreeByLevel(sample, new Set([0, 1, 2, 3]));
    expect(sampleKeys(pruned)).toEqual(['/a', '/b', '/c', '/d']);
  });

  it('drops an excluded level together with its whole descendant subtree', () => {
    // Bỏ C1 → node /b (lv1) mất cùng con /c (lv2) — con chỉ hiện trong cha (mockup)
    const pruned = pruneTreeByLevel(sample, new Set([0, 2]));
    expect(sampleKeys(pruned)).toEqual(['/a']);
  });

  it('hides only the leaves of an excluded deep level', () => {
    const pruned = pruneTreeByLevel(sample, new Set([0, 1]));
    expect(sampleKeys(pruned)).toEqual(['/a', '/b', '/d']);
  });

  it('never mutates source nodes (returns copies)', () => {
    const sourceChildren = sample[0].children;
    pruneTreeByLevel(sample, new Set([0, 1, 2, 3]));
    expect(sample[0].children).toBe(sourceChildren);
    expect(sample[0].children?.length).toBe(2);
  });
});

describe('navigation.collectParentKeys — Mở rộng / Thu gọn tất cả', () => {
  it('returns only keys of nodes that have children', () => {
    const keys = collectParentKeys(kchtTree);
    expect(keys).toContain('/port');
    expect(keys).toContain('/berth');
    expect(keys).toContain('/navigation-channel');
    expect(keys).not.toContain('/pier'); // lá không có children
  });
});

/* ============================================================================
 * M-024 follow-up (2026-09-06): landing search — normalizeSearchText + collectNavLabels +
 * searchNavGroups (R-1..R-7 của triage TRI-1788710986171). Chuẩn hóa không dấu /
 * đ→d; lọc NAV_GROUPS theo group.label + group.desc + nhãn node con trong tree.
 * ==========================================================================*/
describe('navigation.normalizeSearchText — landing search chuẩn hóa (R-1)', () => {
  it('trims whitespace and lowercases ASCII text', () => {
    expect(normalizeSearchText('  Quan Ly Cang  ')).toBe('quan ly cang');
  });

  it('strips Vietnamese diacritics via NFD (no combining marks survive)', () => {
    expect(normalizeSearchText('Quản lý KCHT hàng hải')).toBe('quan ly kcht hang hai');
    expect(normalizeSearchText('Đà Nẵng')).toBe('da nang');
    expect(normalizeSearchText('Bến phao, khu neo đậu')).toBe('ben phao, khu neo dau');
  });

  it('maps đ/Đ to d after lowercasing', () => {
    expect(normalizeSearchText('Đài viễn thông')).toBe('dai vien thong');
    expect(normalizeSearchText('đèn biển')).toBe('den bien');
  });

  it('is idempotent on an already-normalized input', () => {
    const once = normalizeSearchText('  Bến Phao  ');
    expect(once).toBe('ben phao');
    expect(normalizeSearchText(once)).toBe(once);
  });
});

describe('navigation.collectNavLabels — label-collector của searchNavGroups', () => {
  it('collects parent and child labels across the whole tree', () => {
    const labels = collectNavLabels(kchtTree);
    expect(labels).toContain('Quản lý cảng biển'); // cha
    expect(labels).toContain('Quản lý cầu cảng'); // lá sâu
    expect(labels).toContain('Đài viễn thông hàng hải'); // nhánh root riêng
  });
});

describe('navigation.searchNavGroups — lọc 6 khối landing (R-2..R-7)', () => {
  it('R-2: empty/whitespace query returns the full NAV_GROUPS (reset, no filtering)', () => {
    expect(searchNavGroups('')).toHaveLength(6);
    expect(searchNavGroups('   ')).toHaveLength(6);
    expect(searchNavGroups('')).toEqual(NAV_GROUPS);
  });

  it('matches a group by its own label with diacritic-insensitive input', () => {
    const hits = searchNavGroups('tai san kcht hang hai', NAV_GROUPS);
    expect(hits.map((g) => g.id)).toEqual(['asset']);
    // accented query and unaccented haystack must agree
    expect(searchNavGroups('tài sản KCHT hàng hải', NAV_GROUPS).map((g) => g.id)).toEqual(['asset']);
  });

  it('matches a group via a deep child label inside group.tree', () => {
    // '/pier' — Quản lý cầu cảng — là lá sâu (level 3) của cây kcht
    const hits = searchNavGroups('cau cang', NAV_GROUPS);
    expect(hits.map((g) => g.id)).toEqual(['kcht']);
    expect(searchNavGroups('cầu cảng', NAV_GROUPS).map((g) => g.id)).toEqual(['kcht']);
  });

  it('matches a group by its desc text', () => {
    // desc kcht: "28 loại KCHT theo phân cấp cha – con"
    const hits = searchNavGroups('28 loai', NAV_GROUPS);
    expect(hits.map((g) => g.id)).toEqual(['kcht']);
  });

  it('R-7: no match → empty array, never throws', () => {
    expect(searchNavGroups('zzzz-khong-ton-tai', NAV_GROUPS)).toEqual([]);
  });

  it('does not mutate NAV_GROUPS — returns original group references', () => {
    const snapshot = NAV_GROUPS.map((g) => g.id).join(',');
    searchNavGroups('cang', NAV_GROUPS);
    searchNavGroups('zzzz', NAV_GROUPS);
    expect(NAV_GROUPS.map((g) => g.id).join(',')).toBe(snapshot);
    expect(searchNavGroups('cang', NAV_GROUPS)[0]).toBe(NAV_GROUPS[0]);
  });
});
