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
 *   - Extra-screen inventory (screens beyond the 28 types, verified QA w2):
 *     /ship-repair-facility (2nd screen of matrix row 9), /navigation-channel-chk
 *     (CHK screen of row 5), /water-zone, /station/coastal (permission-gated
 *     screens with no matrix row of their own).
 * ============================================================
 */
import { describe, expect, it } from 'vitest';
import {
  NAV_GROUPS,
  accessibleTree,
  firstAccessibleRoute,
  groupOfPath,
  locateRoute,
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
  '/ship-repair-yard', // Cơ sở sửa chữa, đóng tàu (2nd screen /ship-repair-facility)
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

/** Screens that exist for permission reasons but are NOT separate matrix types. */
const EXTRA_SCREEN_KEYS = [
  '/ship-repair-facility', // 2nd screen of matrix row 9 (different permission scope)
  '/navigation-channel-chk', // CHK-scope screen of Luồng hàng hải (row 5)
  '/water-zone', // permission-gated screen, no matrix row
  '/station/coastal', // Đài duyên hải VTS — operational screen, no matrix row
] as const;

/** Route-less grouping parents (structural, not matrix rows). */
const GROUPING_ROOT_KEYS = ['kcht-vts', 'kcht-vienthong'] as const;

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
    // type-level inventory is stable: 28 canonical + 4 documented extra screens
    // + 2 route-less grouping roots and nothing else
    expect(keys.length).toBe(
      MATRIX_28_KEYS.length + EXTRA_SCREEN_KEYS.length + GROUPING_ROOT_KEYS.length,
    );
    const unknown = keys.filter(
      (k) =>
        !(MATRIX_28_KEYS as readonly string[]).includes(k) &&
        !(EXTRA_SCREEN_KEYS as readonly string[]).includes(k) &&
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
    // Luồng hàng hải → Nhà trạm phao tiêu → Phao tiêu
    expect(byKey.get('/buoys')?.ancestors).toEqual(['/port', '/navigation-channel', '/buoy-station']);
    // Hệ thống VTS → Trung tâm điều hành VTS → Trạm Radar
    expect(byKey.get('/radar-station')?.ancestors).toEqual(['kcht-vts', '/vts-operation-center']);
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
    // '/navigation-channel/1' must resolve to the parent (its child screens sit deeper),
    // while '/navigation-channel-chk/7' resolves to the CHK leaf, not to /navigation-channel
    expect(locateRoute(kchtTree, '/navigation-channel/1')).toEqual({
      key: '/navigation-channel',
      openKeys: ['/port', '/navigation-channel'],
    });
    expect(locateRoute(kchtTree, '/navigation-channel-chk/7')).toEqual({
      key: '/navigation-channel-chk',
      openKeys: ['/port', '/navigation-channel'],
    });
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
