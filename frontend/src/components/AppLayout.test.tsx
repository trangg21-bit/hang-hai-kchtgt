import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import * as React from 'react';
import type { MenuProps } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout, { filterMenuByQuery, collectOpenableKeys } from './AppLayout';
import HomePage from '../pages/Home';
import { usePermissionStore } from '../store/permissionStore';
import { NAV_GROUPS, groupOfPath } from '../config/navigation';

// M-024 rework render suite: this repo's vitest runs in the NODE environment (no
// jsdom/happy-dom/@testing-library installed) and antd's useBreakpoint has no
// breakpoint subscription until a layout effect runs on the client. Without it,
// AppLayout.tsx:449 `isMobile = !screens.lg` is true on the server, so the desktop
// <Sider> (line 759) — the surface that holds back-row/chips/group menu — never
// renders. The viewport/media-query boundary is mocked to a desktop snapshot so the
// REAL Sider tree (real kcht config, real antd Menu) renders; everything else stays
// un-mocked. Documented in qa/07-qa-report-w2.md.
vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    Grid: {
      ...actual.Grid,
      useBreakpoint: () => ({ xs: false, sm: false, md: false, lg: true, xl: true, xxl: true }),
    },
  };
});

/**
 * Shared fixture — mirrors the real permission-gated tree shape
 * (rawMenuItems -> filterEmptyChildren -> menuItems) using real Vietnamese labels.
 * (QA oracle §3, docs/modules/M-024-tai-cau-truc-menu-navigation/qa/07-qa-report-w1.md)
 */
const gatedMenu: MenuProps['items'] = [
  { key: '/', label: 'Trang chủ' },
  { type: 'divider' as const },
  {
    key: 'system-admin',
    label: 'Quản trị hệ thống',
    children: [
      { key: '/users', label: 'Quản lý tài khoản người dùng' },
      { key: '/logs', label: 'Quản lý log truy cập' },
    ],
  },
  { type: 'divider' as const },
  {
    key: 'cangben',
    label: 'Quản lý KCHT Hàng Hải',
    children: [
      {
        key: 'port-parent',
        label: 'Quản lý cảng biển',
        children: [
          {
            key: 'berth-parent',
            label: 'Quản lý bến cảng',
            children: [{ key: '/pier', label: 'Quản lý cầu cảng' }],
          },
          { key: '/dry-port', label: 'Quản lý cảng cạn' },
        ],
      },
      { key: '/water-zone', label: 'Quản lý vùng nước' },
    ],
  },
];

/** Recursively collect every string key (leaf + parent) in the tree, in traversal order. */
function collectKeys(items: MenuProps['items']): string[] {
  const keys: string[] = [];
  const walk = (nodes: MenuProps['items']): void => {
    for (const node of (nodes ?? []) as any[]) {
      if (!node) continue;
      if (typeof node.key === 'string') keys.push(node.key);
      if (node.children) walk(node.children);
    }
  };
  walk(items);
  return keys;
}

/** Indexes of every `type === 'divider'` item in a (flat) item array. */
function dividerPositions(items: MenuProps['items']): number[] {
  return ((items ?? []) as any[])
    .map((node, i) => (node?.type === 'divider' ? i : -1))
    .filter((i) => i >= 0);
}

describe('filterMenuByQuery', () => {
  it('A1: keeps a leaf whose label contains the query; drops non-matching leaves', () => {
    const result = filterMenuByQuery(gatedMenu, 'cảng');
    const keys = collectKeys(result);
    expect(keys).toContain('/pier');
    expect(keys).not.toContain('/users');
    expect(keys).not.toContain('/logs');
  });

  it('A2: leading/trailing spaces are trimmed before matching (VAL-024-06)', () => {
    const trimmed = collectKeys(filterMenuByQuery(gatedMenu, 'cảng'));
    const padded = collectKeys(filterMenuByQuery(gatedMenu, '  cảng  '));
    expect(padded).toEqual(trimmed);
  });

  it('A3: whitespace-only and empty query return the SAME reference (full tree)', () => {
    expect(filterMenuByQuery(gatedMenu, '   ')).toBe(gatedMenu);
    expect(filterMenuByQuery(gatedMenu, '')).toBe(gatedMenu);
  });

  it('A4: case-insensitive; diacritics matched exactly (no folding)', () => {
    const lower = collectKeys(filterMenuByQuery(gatedMenu, 'cảng'));
    expect(collectKeys(filterMenuByQuery(gatedMenu, 'CẢNG'))).toEqual(lower);
    expect(collectKeys(filterMenuByQuery(gatedMenu, 'Cảng'))).toEqual(lower);
    // 'cang' (no diacritics) must NOT match 'Cảng biển' — documented limitation
    const noFold = collectKeys(filterMenuByQuery(gatedMenu, 'cang'));
    expect(noFold).not.toContain('port-parent');
    expect(noFold).not.toContain('/pier');
    expect(noFold).not.toContain('/dry-port');
    expect(noFold).toEqual([]);
  });

  it('A5: parent/child keep — matching leaf stays reachable through its ancestor chain', () => {
    const result = filterMenuByQuery(gatedMenu, 'cầu cảng');
    expect(collectKeys(result)).toEqual(['cangben', 'port-parent', 'berth-parent', '/pier']);
    expect(collectKeys(result)).not.toContain('/dry-port');
    expect(collectKeys(result)).not.toContain('/water-zone');
    expect(collectKeys(result)).not.toContain('system-admin');
  });

  it('A6: parent/child drop — a branch with 0 matching descendants is dropped entirely', () => {
    const result = filterMenuByQuery(gatedMenu, 'vùng nước');
    const keys = collectKeys(result);
    expect(keys).toEqual(['cangben', '/water-zone']);
    for (const absent of ['port-parent', 'berth-parent', '/pier', '/dry-port', '/users', '/logs']) {
      expect(keys).not.toContain(absent);
    }
  });

  it('A7: a submenu whose own label matches but has no matching descendant is hidden', () => {
    const result = filterMenuByQuery(gatedMenu, 'KCHT');
    expect(collectKeys(result)).not.toContain('cangben');
    expect(collectKeys(result)).toEqual([]);
  });

  it('A8: divider hygiene — no leading/trailing/adjacent dividers (same rule as filterEmptyChildren)', () => {
    // single mid-subtree match → no orphan dividers survive
    const single = filterMenuByQuery(gatedMenu, 'vùng nước');
    expect(dividerPositions(single)).toEqual([]);

    // two separated top-level groups kept → exactly one divider in a valid middle position
    const two = filterMenuByQuery(gatedMenu, 'quản lý');
    expect(dividerPositions(two)).toEqual([1]);
    expect(collectKeys(two)).toContain('/users');
    expect(collectKeys(two)).toContain('/water-zone');
  });

  it('A9: restore-on-clear — empty/whitespace query returns the full tree unchanged', () => {
    expect(filterMenuByQuery(gatedMenu, '')).toEqual(gatedMenu);
    expect(filterMenuByQuery(gatedMenu, '   ')).toEqual(gatedMenu);
    expect(collectKeys(filterMenuByQuery(gatedMenu, ''))).toEqual(collectKeys(gatedMenu));
  });

  it('A10: filter only removes, never invents (output ⊆ input); removed leaf cannot reappear', () => {
    const universe = new Set(collectKeys(gatedMenu));
    for (const q of ['cảng', 'cầu cảng', 'vùng nước', 'quản lý', 'zzzz']) {
      for (const key of collectKeys(filterMenuByQuery(gatedMenu, q))) {
        expect(universe.has(key)).toBe(true);
      }
    }
    // feed a tree without /pier: a query that would match /pier cannot resurrect it
    const noPier: MenuProps['items'] = [
      {
        key: 'port-parent',
        label: 'Quản lý cảng biển',
        children: [{ key: '/dry-port', label: 'Quản lý cảng cạn' }],
      },
    ];
    expect(collectKeys(filterMenuByQuery(noPier, 'cầu cảng'))).toEqual([]);
    expect(collectKeys(filterMenuByQuery(noPier, 'cầu cảng'))).not.toContain('/pier');
  });

  it('A11: non-string label is guarded (no throw); children still traversed; never the match reason', () => {
    const tree: MenuProps['items'] = [
      {
        key: 'react-node-parent',
        label: React.createElement('span', null, 'ZZZ-ONLY-HERE'),
        children: [{ key: '/pier', label: 'Quản lý cầu cảng' }],
      },
      {
        key: 'undefined-label',
        label: undefined,
        children: [{ key: '/logs', label: 'Quản lý log truy cập' }],
      },
    ];
    // children traversed even though parent labels are non-string (a matching descendant keeps the branch)
    const result = filterMenuByQuery(tree, 'cầu cảng');
    expect(collectKeys(result)).toEqual(['react-node-parent', '/pier']);
    // the non-string label's text is never the match reason
    expect(collectKeys(filterMenuByQuery(tree, 'ZZZ-ONLY-HERE'))).toEqual([]);
  });

  it('A12: input tree is not mutated', () => {
    const snapshot = JSON.parse(JSON.stringify(gatedMenu));
    filterMenuByQuery(gatedMenu, 'cảng');
    filterMenuByQuery(gatedMenu, 'cầu cảng');
    filterMenuByQuery(gatedMenu, 'vùng nước');
    filterMenuByQuery(gatedMenu, 'zzzz');
    collectOpenableKeys(filterMenuByQuery(gatedMenu, 'cảng'));
    expect(gatedMenu).toEqual(snapshot);
  });

  it('A13: a no-match query returns [] without throwing', () => {
    expect(filterMenuByQuery(gatedMenu, 'zzzz')).toEqual([]);
  });
});

describe('collectOpenableKeys', () => {
  it('B1: returns every kept submenu key, recursively, top-down', () => {
    const filtered = filterMenuByQuery(gatedMenu, 'cầu cảng');
    expect(collectOpenableKeys(filtered)).toEqual(['cangben', 'port-parent', 'berth-parent']);
  });

  it('B2: returns only keys present in the filtered tree (no stale/orphan keys)', () => {
    for (const q of ['cảng', 'cầu cảng', 'vùng nước', 'quản lý', 'zzzz']) {
      const filtered = filterMenuByQuery(gatedMenu, q);
      const presentKeys = new Set(collectKeys(filtered));
      for (const key of collectOpenableKeys(filtered)) {
        expect(presentKeys.has(key)).toBe(true);
      }
    }
  });

  it('B3: empty or flat leaf-only input yields []', () => {
    expect(collectOpenableKeys([])).toEqual([]);
    expect(collectOpenableKeys(undefined)).toEqual([]);
    expect(collectOpenableKeys([{ key: '/', label: 'Trang chủ' }])).toEqual([]);
  });

  it('B4: deterministic — same input twice → identical arrays', () => {
    const filtered = filterMenuByQuery(gatedMenu, 'cảng');
    const a = collectOpenableKeys(filtered);
    const b = collectOpenableKeys(filtered);
    expect(a).toEqual(b);
    expect(collectOpenableKeys(filterMenuByQuery(gatedMenu, 'cảng'))).toEqual(a);
  });

  it('B5: nested chain ≥3 levels — all ancestor keys present', () => {
    const filtered = filterMenuByQuery(gatedMenu, 'cầu cảng');
    const keys = collectOpenableKeys(filtered);
    expect(keys).toContain('cangben');
    expect(keys).toContain('port-parent');
    expect(keys).toContain('berth-parent');
    expect(keys).toHaveLength(3);
  });
});

/* ============================================================================
 * M-024 rework wave-2 (2026-09-06, chips C0-C3 đã bỏ 2026-09-07): REAL component
 * render — '/' landing + kcht sidebar (breadcrumb header / expand-collapse /
 * permission dim).
 *
 * Stack note: this repo has NO DOM test environment (no jsdom / happy-dom /
 * @testing-library in package.json) and vitest.config.ts only collects
 * src/config/**\/*.test.ts, src/store, src/services and THIS file. Therefore the
 * "real render" oracle is executed through react-dom/server
 * (renderToStaticMarkup): the ACTUAL AppLayout / HomePage components (plus the
 * real navigation config + zustand permission store) run their render phase.
 * LIMITS (documented in qa/07-qa-report-w2.md): no browser events/effects — a
 * click / redirect cannot fire under react-dom/server, so click-to-navigate, chip
 * toggle re-render and Navigate redirect are asserted at config seam + route-table
 * level, not by dispatching events. window is shimmed (self/top/matchMedia) because
 * AppLayout.tsx reads window.self/window.top during render, and antd Grid.
 * useBreakpoint is mocked to the desktop snapshot (see vi.mock above).
 * ==========================================================================*/
describe('M-024 rework: real render (react-dom/server) — landing + kcht sidebar', () => {
  beforeAll(() => {
    const g = globalThis as { window?: unknown };
    if (!g.window) {
      const shim: Record<string, unknown> = {
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => true,
        matchMedia: () => ({
          matches: false,
          media: '',
          onchange: null,
          addListener: () => undefined,
          removeListener: () => undefined,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          dispatchEvent: () => true,
        }),
      };
      shim.self = shim;
      shim.top = shim;
      Object.defineProperty(globalThis, 'window', { value: shim, configurable: true, writable: true });
    }
  });

  afterEach(() => {
    // Reset permission seed so no test leaks into another.
    usePermissionStore.setState({ permissions: [] });
  });

  const countOf = (haystack: string, needle: string): number => haystack.split(needle).length - 1;

  const renderAt = (
    entry: string,
    permissions: string[],
    headerOpts?: { initialSidebarHidden?: boolean },
  ): string => {
    usePermissionStore.setState({ permissions });
    // Mirrors App.tsx nesting (AppLayout layout route; '/' = HomePage; '/dashboard' = Navigate '/').
    return renderToStaticMarkup(
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route element={<AppLayout initialSidebarHidden={headerOpts?.initialSidebarHidden ?? false} />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="*" element={<span data-testid="child-slot">CHILD-SLOT</span>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
  };

  // AC-024-01: '/' renders the 6-block landing INSIDE AppLayout shell (real HomePage component).
  it('AC-01: "/" full-access — 6 block cards (label+desc) inside AppLayout; no group menu; sidebar note only', () => {
    const html = renderAt('/', ['admin:all']);
    // Landing content (pages/Home.tsx real render)
    expect(html).toContain('Danh mục chức năng');
    expect(html).toContain('Chọn một khối chức năng để tiếp tục.');
    // 6 blocks, exact label + desc from config/navigation.tsx NAV_GROUPS
    for (const [label, desc] of [
      ['Quản lý KCHT hàng hải', '28 loại KCHT theo phân cấp cha – con'],
      ['Quản lý tài sản KCHT hàng hải', 'Tăng, giảm, kiểm kê và khai thác tài sản'],
      ['Quản lý quy hoạch &amp; vận hành', 'Quy hoạch, văn bản pháp lý và sự cố'],
      // note: raw '&' is HTML-escaped to '&amp;' by react-dom/server
      ['Quản lý KCHT trên nền bản đồ (GIS)', 'Danh mục đối tượng, lớp bản đồ và biểu tượng'],
      ['Báo cáo thống kê', 'Dashboard KPI và báo cáo thống kê định kỳ'],
      ['Quản trị hệ thống', 'Người dùng, đơn vị, nhóm, tích hợp và cấu hình'],
    ] as const) {
      expect(html).toContain(label);
      expect(html).toContain(desc);
    }
    // AppLayout shell (sidebar) present with landing mode: logo+search+note, NO group menu
    expect(html).toContain('sidebar-search');
    expect(html).toContain('placeholder="Tìm kiếm...');
    expect(html).toContain('Chọn một khối chức năng ở bên phải để bắt đầu. Menu điều hướng chi tiết sẽ hiện ở đây sau khi bạn chọn.');
    expect(html).not.toContain('ant-menu'); // no group menu rendered at landing
    expect(html).not.toContain('Quay lại Danh mục chức năng'); // back-row is kcht-group only
    expect(html).not.toContain('Tìm loại KCHT'); // kcht-specific search only inside kcht group
    expect(html).toContain('Cục Hàng Hải và Đường Thủy'); // sidebar footer
    // full-access user: no card is dimmed/disabled
    expect(countOf(html, 'disabled=""')).toBe(0);
    expect(countOf(html, 'aria-disabled="true"')).toBe(0);
  });

  // AC-024-01f / AC-024-05 (render seam): no-permission blocks render dimmed (disabled), per-card.
  it('AC-01/AC-05: "/" restricted user — blocks without any granted route are disabled (4 of 6)', () => {
    const html = renderAt('/', ['port:read', 'report:read']);
    expect(html).toContain('Quản lý KCHT hàng hải'); // port:read granted -> kcht enabled
    expect(html).toContain('Báo cáo thống kê'); // report:read granted -> report enabled
    // asset/plan/gis/admin trees have zero granted routes -> dimmed (disabled + aria-disabled)
    expect(countOf(html, 'disabled=""')).toBe(4);
    expect(countOf(html, 'aria-disabled="true"')).toBe(4);
    // and the 4 un-granted labels still render (dimmed, not removed)
    expect(html).toContain('Quản lý tài sản KCHT hàng hải');
    expect(html).toContain('Quản trị hệ thống');
  });

  // AC-024-02 / AC-024-03 / AC-024-04 / AC-024-07: kcht sidebar — breadcrumb header
  // (icon back + group label/desc), expand/collapse-all, kcht tree without PHÊ DUYỆT;
  // chips C0..C3 đã bỏ (2026-09-07 — ngôn ngữ nội bộ không phải ngôn ngữ người dùng);
  // VHF disabled leaf inside "Đài viễn thông hàng hải".
  it('AC-02/03/04/07: "/port" — breadcrumb header + expand/collapse + kcht tree; no PHÊ DUYỆT; no C-chips', () => {
    const html = renderAt('/port', ['admin:all']);
    // back button — icon-only, enterprise label qua aria/title (không phải câu chữ)
    expect(html).toContain('aria-label="Về Danh mục chức năng"');
    expect(html).toContain('title="Về Danh mục chức năng"');
    // sidebar header = context header: group label + desc (không còn "Quay lại…")
    expect(html).toContain('Quản lý KCHT hàng hải');
    expect(html).toContain('28 loại KCHT theo phân cấp cha – con');
    expect(html).not.toContain('Quay lại Danh mục chức năng');
    // chips C0..C3 removed — internal hierarchy terms không hiển thị cho người dùng
    expect(html).not.toContain('aria-pressed');
    expect(html).toContain('Mở rộng tất cả');
    expect(html).toContain('Thu gọn tất cả');
    expect(html).toContain('placeholder="Tìm loại KCHT');
    // kcht tree (real config) rendered in sidebar
    expect(html).toContain('Quản lý cảng biển');
    expect(html).toContain('Hệ thống VTS');
    expect(html).toContain('Đài viễn thông hàng hải');
    // AC-024-07: PHÊ DUYỆT group/word gone from this menu
    expect(html).not.toContain('PHÊ DUYỆT');
    expect(html).not.toContain('Phê duyệt');
    // landing note absent inside a group
    expect(html).not.toContain('Chọn một khối chức năng ở bên phải để bắt đầu');
  });

  // AC-024-03 (render seam): depth-3 chain — deep-link '/pier' opens /port > /berth chain
  // (selectedKeys on the real leaf). AC-024-09: deep-link infers the kcht group.
  it('AC-03/AC-09: "/pier" — depth-3 chain visible and leaf selected (deep-link infers kcht group)', () => {
    const html = renderAt('/pier', ['admin:all']);
    // sidebar is the kcht group (breadcrumb header present) for a deep kcht route
    expect(html).toContain('aria-label="Về Danh mục chức năng"');
    expect(html).toContain('Quản lý cảng biển');
    expect(html).toContain('Quản lý bến cảng');
    expect(html).toContain('Quản lý cầu cảng'); // depth-3 leaf present in the opened chain
    expect(html).toContain('ant-menu-item-selected'); // active leaf highlighted
  });

  // AC-024-04 (render seam): '/dai-ttdh' — Đài viễn thông root branch contains VHF as a
  // DISABLED menu item (no route -> not clickable), rendered by the real antd Menu.
  it('AC-04: "/dai-ttdh" — VHF disabled menu item rendered inside Đài viễn thông branch', () => {
    const html = renderAt('/dai-ttdh', ['admin:all']);
    expect(html).toContain('aria-label="Về Danh mục chức năng"');
    expect(html).toContain('Đài viễn thông hàng hải');
    expect(html).toContain('Quản lý đài TTDH');
    expect(html).toContain('VHF');
    expect(html).toContain('ant-menu-item-disabled'); // disabled:true -> antd disabled class
  });

  // AC-024-05 (render seam): permission pruning feeds the same real Menu — at '/port' a
  // user holding ONLY port:read sees no berth/pier/dry-port/VTS children. The 'Đài viễn
  // thông hàng hải' branch SURVIVES because disabled nodes (VHF) are deliberately NOT
  // permission-gated (AC-05 oracle / VAL-024-04: node chưa triển khai → disabled hiển
  // thị mờ, không ẩn) — a restricted user must still see the disabled placeholder.
  it('AC-05: "/port" restricted (port:read only) — unauthorized branches absent; disabled VHF placeholder kept', () => {
    const html = renderAt('/port', ['port:read']);
    expect(html).toContain('Quản lý cảng biển');
    expect(html).not.toContain('Quản lý bến cảng'); // berth:read not granted
    expect(html).not.toContain('Quản lý cầu cảng');
    expect(html).not.toContain('Quản lý cảng cạn'); // dry-port:read not granted
    expect(html).not.toContain('Hệ thống VTS'); // whole subtree denied -> pruned
    // disabled (VHF) node is NOT permission-gated (VAL-024-04) -> branch title survives;
    // the disabled child itself renders only when the submenu is OPEN — proven by the
    // AC-04 '/dai-ttdh' render test (openKeys from deep-link renders VHF + disabled class).
    expect(html).toContain('Đài viễn thông hàng hải');
  });

  // AC-024-08 (config seam — redirect target cannot fire under react-dom/server; see report):
  // '/dashboard' matches NO group tree and is not a report-tree member (KPI node removed),
  // so the only '/dashboard' behavior left is App.tsx's <Navigate to="/" replace/>.
  it('AC-08: config seam — "/dashboard" has no group/tree membership (redirect target landing)', () => {
    expect(NAV_GROUPS).toHaveLength(6);
    expect(groupOfPath('/dashboard')).toBeUndefined();
    const reportGroup = NAV_GROUPS.find((g) => g.id === 'report');
    expect(reportGroup?.tree?.some((n) => n.key === '/dashboard' || n.route === '/dashboard')).toBe(false);
    expect(reportGroup?.tree?.some((n) => n.key === '/reports' || n.route === '/reports')).toBe(true);
  });

  // M-024 follow-up (2026-09-06, Item 2): header khi sidebarHidden — trái CHỈ còn nút
  // mở menu; giữa = MỘT khối (logo 40px + tên hệ thống 1 dòng ellipsis). Không bao giờ
  // 2 logo / 2 title cùng lúc.
  it('H1: sidebarHidden — single centered brand block (logo + one-line title), left title suppressed', () => {
    const html = renderAt('/port', ['admin:all'], { initialSidebarHidden: true });
    const brand = 'HỆ THỐNG THÔNG TIN QUẢN LÝ KẾT CẤU HẠ TẦNG GIAO THÔNG HÀNG HẢI';
    // exactly ONE title instance lives in the centered brand span — the left title is gone
    expect(countOf(html, brand)).toBe(1);
    // one center nav target (clickable brand → '/'); sidebar Sider (<aside>) is NOT
    // rendered in collapsed mode (the CSS text of the style tag is not the Sider)
    expect(countOf(html, 'aria-label="Về trang chủ"')).toBe(1);
    expect(countOf(html, '<aside')).toBe(0);
    // exactly ONE <img> logo instance (the extra string occurrence is React's
    // <link rel="preload"> for the image, not a rendered logo)
    expect(countOf(html, '<img src="/images/logo-vinamarine.png"')).toBe(1);
  });

  it('H2: sidebar visible — left title only, NO centered brand block (no duplication)', () => {
    const html = renderAt('/port', ['admin:all'], {});
    const brand = 'HỆ THỐNG THÔNG TIN QUẢN LÝ KẾT CẤU HẠ TẦNG GIAO THÔNG HÀNG HẢI';
    // visible mode keeps the left title (single occurrence)…
    expect(countOf(html, brand)).toBe(1);
    // …and must NOT render the centered brand button (the old overlap bug)
    expect(countOf(html, 'aria-label="Về trang chủ"')).toBe(0);
  });
});
