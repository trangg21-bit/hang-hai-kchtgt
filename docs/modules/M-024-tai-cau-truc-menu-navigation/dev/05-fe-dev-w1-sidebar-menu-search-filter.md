# M-024 / F-292 — Frontend Dev Wave-1: Sidebar Menu Search Filter (implementation record)

**Stage verdict:** Pass — implementation, tests, and both mandated verification gates are green.

## 1. Source delta

### `frontend/src/components/AppLayout.tsx` (edited)
- Hoisted `filterEmptyChildren` to module scope (pure behavior unchanged; now reused by the filter — design D-2 "reuse, do NOT duplicate").
- Added exported `filterMenuByQuery(items, query)`: `query.trim().toLowerCase()`; empty/whitespace returns the **same** `items` reference (AC-024-12); leaf kept iff `typeof label === 'string' && label.toLowerCase().includes(q)` (BR-024-14, case-insensitive, no diacritic folding); divider passed through then cleaned by `filterEmptyChildren`; submenu kept iff ≥1 descendant kept (D-5a), parent rebuilt via `{ ...node, children }`.
  - Note: design-plan §D-2 pseudocode `if (node.children) return keepMatching(node.children)` would flatten/lose parent keys (contradicts oracle B1/B5); implemented as `{ ...node, children: keepMatching(node.children) }` to preserve the ancestor chain.
- Added exported `collectOpenableKeys(items)` — recursive keys of every submenu with non-empty `children`.
- Added `searchQuery` state + derived `trimmedSearchQuery`/`isSearching`/`displayedItems`/`effectiveOpenKeys`; filter runs **after** permission gating, on `menuItems` (BR-024-13/15).
- Wired the dead input → controlled (`value={searchQuery}` + `onChange`, `placeholder="Tìm kiếm"` kept; no Enter handler, no form, no API — AC-024-13) and the Menu (`items={displayedItems}`, `openKeys={effectiveOpenKeys}`; `onOpenChange={setOpenKeys}` unchanged).

### `frontend/src/components/AppLayout.test.tsx` (new)
Covers QA oracle **A1–A13** (`filterMenuByQuery`) and **B1–B5** (`collectOpenableKeys`) against the §3 fixture (real Vietnamese labels) with real key-set + structural assertions. Pure-function tests — no `@testing-library`/jsdom dependency.

### `frontend/vitest.config.ts` (edited — scope expanded by orchestrator)
- Added `'src/components/AppLayout.test.tsx'` to `test.include`.
- Removed `'src/**/*.test.tsx'` from `test.exclude`.
- Minimal blast radius: did **not** broaden to `src/components/**`; the 4 pre-existing component tests (`PermissionGuard`/`FormField`/`DataTable`/`ConfirmModal.test.tsx`) stay uncollected; `src/hooks/**` stays excluded.

## 2. Verification executed (final, on the final state)

| Command | Result |
|---|---|
| `npx tsc --noEmit` | **exit 0** ✔ |
| `npx vitest run` | **exit 0 — 11 test files / 91 tests passed** ✔ (AppLayout.test.tsx: 18 tests + 10 pre-existing suites: 73 tests) |
| `npx vitest run src/components/AppLayout.test.tsx` | **exit 0 — 1 file / 18 tests passed** ✔ |

Full-suite output (key lines):
```
 ✓ src/components/AppLayout.test.tsx (18 tests) 17ms
 Test Files  11 passed (11)
      Tests  91 passed (91)
```

The 4 other component tests are confirmed uncollected (absent from the 11-file list); `src/hooks/useUsers.test.ts` remains excluded.

## 3. Out-of-scope observation (not blocking)
`npx tsc --noEmit -p tsconfig.app.json` reports **280 pre-existing errors in 20 files** (unused `@ant-design/icons` imports in `AppLayout.tsx:22`; dead `*.test.tsx` importing the absent `@testing-library`; `cctv/schema.ts:135-137` missing `statusAttention`/`statusOperational`/`statusCritical` imports; service tests missing DTO fields). **ZERO** are introduced by this change — `AppLayout.test.tsx` is absent from the error list. The project `build` script is `vite build` (no `tsc -b`), so these are latent and outside this task's scope.

## 4. Untested edges
- Browser/visual smoke (C1–C7) not executed (no jsdom/browser environment installed). The controlled-input wiring is source-verified and the pure helpers are unit-tested; render-level smoke is deferred to QA wave-2.
