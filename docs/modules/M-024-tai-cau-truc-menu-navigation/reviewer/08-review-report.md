# M-024 Sidebar Menu Search — Code Review Report

**Verdict: PASS** · **Confidence: high**
**Scope reviewed:** `frontend/src/components/AppLayout.tsx` (edit), `frontend/src/components/AppLayout.test.tsx` (new, 18 tests), `frontend/vitest.config.ts` (edit).

---

## 1. Verification executed this session (reproduced, not carried)

| Command | Result |
|---|---|
| `npx tsc --noEmit` (workdir `frontend`) | exit 0, no violations |
| `npx vitest run` (workdir `frontend`) | exit 0 — **11 test files / 91 tests passed**, incl. `src/components/AppLayout.test.tsx (18 tests)`; pre-existing 10 suites (73 tests) unregressed |

Files opened and read this session: `AppLayout.tsx` (full), `AppLayout.test.tsx` (full, 230 lines), `vitest.config.ts`, `ba/00-lean-spec.md`, `design/00-design-plan.md`, `qa/07-qa-report-w1.md`, `qa/07-qa-report-w2.md`. Exact `git diff` of the three in-scope files reviewed.

---

## 2. Findings per review point

### (1) `filterMenuByQuery` correctness — PASS

- **trim → lowercase (VAL-024-06 / BR-024-14):** `AppLayout.tsx:170` — `const q = query.trim().toLowerCase();` before any matching. ✅
- **substring on string label only:** `AppLayout.tsx:178` — `const labelMatches = typeof node.label === 'string' && node.label.toLowerCase().includes(q);`. Non-string (`ReactNode`/`undefined`) labels are guarded and never the match reason (test A11). ✅
- **same reference on empty/whitespace (AC-024-12):** `AppLayout.tsx:171` — `if (!q) return items;` returns the input array identity, not a copy (test A3 uses `toBe`). ✅
- **submenu kept iff ≥1 descendant matches (D-5a):** `AppLayout.tsx:176` — a node with `children` is returned as `{ ...node, children: keepMatching(node.children) }` **without** testing its own label; `filterEmptyChildren` (`AppLayout.tsx:146–165`) then drops any submenu whose children become empty. Own-label match of a submenu alone does not keep it (test A7: `'KCHT'` → `[]`). ✅
- **reuses `filterEmptyChildren` for divider/prune hygiene:** `AppLayout.tsx:181` — `return filterEmptyChildren(keepMatching(items));`. Dividers pass through `keepMatching` untouched and are pruned (leading/trailing/adjacent) by the same rule as the non-search menu (test A8). ✅
- **no input mutation (A12):** both functions rebuild via spread (`{ ...node }` / `{ ...item, children }`), never mutate nodes; `collectOpenableKeys` is read-only. Test A12 deep-snapshots and asserts equality after multiple filters. ✅

### (2) `collectOpenableKeys` / `effectiveOpenKeys` — PASS

- `AppLayout.tsx:184` returns the `key` of every kept submenu (non-empty `children`), recursively, top-down (tests B1–B5).
- `AppLayout.tsx:528` — `effectiveOpenKeys = isSearching ? collectOpenableKeys(displayedItems) : openKeys;` swaps back to the pre-search `openKeys` state when the query is cleared. `AppLayout.tsx:609` binds `openKeys={effectiveOpenKeys}`. ✅

### (3) Filter runs AFTER permission gating (BR-024-15) — PASS

- Gating chain confirmed: `canAccessMenu` (`AppLayout.tsx:88`) reads `usePermissionStore.getState().hasPermission(...)`; `rawMenuItems` (`AppLayout.tsx:279`) is built entirely from `canAccessMenu(...) ? {...} : null` with `.filter(Boolean)`; `menuItems = filterEmptyChildren(rawMenuItems)` (`AppLayout.tsx:523`); `filterMenuByQuery` is applied to `menuItems` at `AppLayout.tsx:527`, i.e. the search only narrows the already-permission-gated tree. Output ⊆ input (test A10 verifies no key can be invented). ✅

### (4) No navigation / Enter handler / form / API in the search path (AC-024-13) — PASS

- The search box (`AppLayout.tsx:595–600`) is a bare controlled `<input>` with `value` + `onChange` only: no `onKeyDown`/Enter handler, no `<form>`, no `fetch`/API call, no `navigate`. Leaf navigation remains solely in the unchanged `handleMenuClick` (`AppLayout.tsx:537`). ✅

### (5) `AppLayout.test.tsx` covers A1–A13 + B1–B5 with real assertions — PASS

- 18 tests read in full: 13 `filterMenuByQuery` cases (A1–A13) + 5 `collectOpenableKeys` cases (B1–B5). Assertions are structural and discriminating: exact key-set equality (`collectKeys(...).toEqual([...])`), identity (`toBe(gatedMenu)`), divider positions, no-mutation deep-equal, output⊆input, non-string-label guard, no-match `[]`. No tautological/self-referential assertions; the fixture mirrors the real gated tree shape with real Vietnamese labels. Pure-function tests with no `@testing-library`/jsdom dependency (imports only `vitest`, `react`, `antd` types). ✅

### (6) `vitest.config.ts` change is minimal — PASS

- `git diff` confirms exactly two lines changed: `include` gains the specific `'src/components/AppLayout.test.tsx'` (not a `src/components/**` glob); `exclude` drops only `'src/**/*.test.tsx'` while `src/hooks/**` remains excluded. No broadening: the 4 pre-existing `src/components/*.test.tsx` suites (e.g. `PermissionGuard.test.tsx`) are still outside `include`, so they stay uncollected — corroborated by the run collecting exactly 11 files (10 pre-existing + AppLayout). ✅

### (7) No scope creep — PASS

- `git diff` of the in-scope files contains only the three declared paths; no `theme.ts`/`tokens.ts`, no backend/entity/migration/PermissionSeeder, no other-module edits. The added code introduces **no hardcoded hex color or spacing** — the search box reuses the existing `className="sidebar-search"`; the filter helpers are pure logic. Identifiers are English (`filterMenuByQuery`, `collectOpenableKeys`, `searchQuery`, `displayedItems`, `effectiveOpenKeys`, `isSearching`); the only UI string is `placeholder="Tìm kiếm"` — Vietnamese with diacritics (`AppLayout.tsx:596`). ✅
- *Note (context, not a finding):* `git status --porcelain` shows a broadly dirty working tree (`M frontend/src/theme.ts`, many `M`/`??` files) from concurrent work across the mono-repo. None of those paths appear in this change's `git diff`; the reviewed change itself is cleanly scoped to the three files. The working-tree dirt is user-owned uncommitted state, outside this dispatch's diff.

---

## 3. Non-blocking observations (not defects)

1. **`onOpenChange={setOpenKeys}` during search** (`AppLayout.tsx:610`). While `isSearching`, `effectiveOpenKeys` (derived) is displayed but `onOpenChange` still writes to the base `openKeys`. A submenu click during search has no visual effect (the derived prop wins) yet mutates `openKeys`, so a subsequent clear restores the toggled value rather than the exact pre-search keys. This is **not** an implementation deviation: `WO-5` explicitly instructs *"Keep `onOpenChange={setOpenKeys}` … untouched"*, and the design-plan risk table documents *"user toggles ignored … base state restored on clear"* as intended. Flagged for awareness only; a trivial hardening (`onOpenChange={isSearching ? undefined : setOpenKeys}`) is available if desired. Not required by any AC/oracle.
2. **No diacritic folding** (`'cang'` does not match `'Cảng'`): per `BR-024-14` this is the specified substring-on-label behavior, documented as a limitation (design-plan §5). Not a defect.

## 4. Covered vs. not covered

- **Covered (executed):** unit battery A1–A13/B1–B5 (18 tests) green; `tsc` green; vitest config collection scope confirmed by the 11-file run.
- **Not covered in this environment:** live-browser smoke (visual narrow of the search box, real `onOpenChange` toggle behavior, network-tab confirmation of zero search API) — no app/browser exists here and no dev server may be started. This is the QA-w2-declared UAT residual (C1–C7) and does not contradict any executed evidence.

## 5. Verdict

No blocking, correctness, security, data-integrity, or contract defect survives reproduction. All 7 review points are satisfied with file:line-anchored evidence and a green `tsc` + `vitest` gate. **PASS.**
