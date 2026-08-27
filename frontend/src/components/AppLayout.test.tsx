import { describe, it, expect } from 'vitest';
import * as React from 'react';
import type { MenuProps } from 'antd';
import { filterMenuByQuery, collectOpenableKeys } from './AppLayout';

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
