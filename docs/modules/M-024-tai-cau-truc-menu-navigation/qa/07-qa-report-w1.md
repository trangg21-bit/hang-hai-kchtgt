# M-024 / F-292 — QA Acceptance Oracle (Wave-1 Authoring)

| Field | Value |
|---|---|
| Module / Feature | M-024 Tái cấu trúc Menu & Navigation — F-292 |
| Stage | engineering-qa-engineer (verify seat) |
| Wave | **1 — authoring only. The battery is NOT run in this wave; wave-2 executes it.** |
| Change scope | TRI-1787823566528-bb3e (scope_expansion C1): real behavior for the dead sidebar search input |
| Edit targets under test | `frontend/src/components/AppLayout.tsx` (edit) + `frontend/src/components/AppLayout.test.tsx` (new, co-located) |
| Write boundary (this stage) | `docs/modules/M-024-tai-cau-truc-menu-navigation/qa/07-qa-report-w1.md` only |
| Oracle sources (read this session) | `ba/00-lean-spec.md` (UC-024-09/10, BR-024-13/14/15, VAL-024-06, AC-024-11/12/13, D-5); `design/00-design-plan.md` (D-1..D-7, WO-1..WO-7, D-7 seam table); `_features/F-292-tai-cau-truc-menu-navigation/feature-brief.md` (§6 no-API, §7 no-table); `docs/intel/_intake/TRI-1787823566528-bb3e.json` (done-oracle + verification commands); `frontend/src/components/AppLayout.tsx` (seams verified at lines 230 / 474 / 498 / 561–567 / ~577) |
| Source input images | `docs/inputs/photo_2026-07-09_15-47-20.jpg` (dashboard mockup, feeds lean-spec D-2 — out of search scope), `docs/inputs/logo-vinamarine_1_1.png` (sidebar header logo asset — unchanged). **Neither constrains the search oracle**; both read to confirm no dependency. |

## 0. Status

- This file is the **executable oracle** (acceptance scenarios + verification commands) for the menu-search implementation, authored **before** implementation. It contains **no test code** — the developer writes `AppLayout.test.tsx`; QA grades it against these scenarios in wave-2.
- Every scenario is mapped to a spec ID (`AC-024-11/12/13`, `VAL-024-06`, `BR-024-13/14/15`) and is observable/assertable by the wave-2 run.
- Naming per convention: identifiers/keys/function names in standard English (`searchQuery`, `filterMenuByQuery`, `collectOpenableKeys`, `displayedItems`, `effectiveOpenKeys`); labels/placeholder/UI text Vietnamese with diacritics (`placeholder="Tìm kiếm"`). No hardcoded colors/spacing/font-size anywhere in scope (BR-024-10; `.sidebar-search` CSS already exists).

---

## 1. Scope & write boundary

**In scope:** behavior of the sidebar menu search inside `AppLayout.tsx` only, exercised through the two exported pure helpers per design-plan D-7/WO-6 — `filterMenuByQuery(items, query)` and `collectOpenableKeys(items)` — plus manual smoke of the rendered sidebar. Optional render-level test of the controlled input (WO-1) may exist but is not a blocking criterion (design-plan D-7).

**Out of scope (must NOT be modified by the implementation or graded here):** `theme.ts`/`tokens.ts`, backend files, entities, migrations, `PermissionSeeder.java`, `authStore.ts`/`permissionStore.ts`, other module screens, dashboard 6-block work (lean-spec §11). No API endpoint may be added or called by the search path (AC-024-13, BR-024-13). No new package.json dependency (testing-library + jest-dom already present — design-plan WO-7).

---

## 2. Coverage map (spec → oracle → evidence)

| Spec ID | Requirement (source text anchor) | Oracle | Evidence in wave-2 |
|---|---|---|---|
| AC-024-11 | ` cảng ` (extra spaces) → only labels containing "cảng" after `.trim()` show, case-insensitive (BR-024-14); non-matches hidden; empty branches hidden; nothing out-of-permission (BR-024-15) | Scenarios A1, A2, A4, A5, A6, A7, A10, C1 | vitest focused file + smoke |
| AC-024-12 | Clear (or whitespace-only) → full menu restored: exactly 7 level-1 groups + utility items per permission (count = 7) | Scenarios A3, A9, C2, C3 | vitest + smoke |
| AC-024-13 | Typing + Enter, or clicking a match → no unintended navigation; no search API request | Scenario C4 (+ A-unit N/A: pure function has no side effects) | smoke + network observation |
| BR-024-13 | Search = display-only filter on the gated tree (`menuItems` at `AppLayout.tsx:498`); no navigate/API/data change; `.trim()` before matching | A2, A3, A10, C4; structural check (filter applied after gating) | vitest + source diff |
| BR-024-14 | Item kept iff Vietnamese `label` contains trimmed query (substring, case-insensitive); submenu kept iff ≥1 child kept, else branch hidden; empty/whitespace → full menu | A1, A2, A4, A5, A6, A7, A9 | vitest |
| BR-024-15 | Search never bypasses permissions: filters only the already-gated set; user never sees out-of-permission item via search | A10 (+ C5 smoke) | vitest + smoke |
| VAL-024-06 | Input string `.trim()` before use | A2, A3, A9 | vitest |
| D-5 (SA settle) | Option (a): parent kept iff ≥1 descendant kept; own-label match of a submenu alone does NOT keep it | A5, A6, A7 | vitest |
| AC-024-09 | `cd frontend && npx tsc --noEmit` pass; `mvn compile -DskipTests` pass (triage; backend unaffected — no backend change) | Section 7 | wave-2 commands |

---

## 3. Shared fixture (test tree used by unit scenarios)

The wave-2 test file should build a tree mirroring the **real gated shape** of `rawMenuItems`→`filterEmptyChildren`→`menuItems` (AppLayout.tsx:230 → 474 → 498), using the actual Vietnamese labels:

```ts
const gatedMenu: MenuProps['items'] = [
  { key: '/', label: 'Trang chủ' },
  { type: 'divider' as const },
  {
    key: 'system-admin', label: 'Quản trị hệ thống', children: [
      { key: '/users', label: 'Quản lý tài khoản người dùng' },
      { key: '/logs', label: 'Quản lý log truy cập' },
    ],
  },
  { type: 'divider' as const },
  {
    key: 'cangben', label: 'Quản lý KCHT Hàng Hải', children: [
      {
        key: 'port-parent', label: 'Quản lý cảng biển', children: [
          {
            key: 'berth-parent', label: 'Quản lý bến cảng', children: [
              { key: '/pier', label: 'Quản lý cầu cảng' },
            ],
          },
          { key: '/dry-port', label: 'Quản lý cảng cạn' },
        ],
      },
      { key: '/water-zone', label: 'Quản lý vùng nước' },
    ],
  },
];
```

Assertions must be **key-set based** (e.g. `collectKeys(result) === ['/users', '/pier', ...]`) plus structural checks (parent kept with only matching children; divider positions), so the oracle stays implementation-agnostic and survives label wording changes only if the fixture changes too.

---

## 4. Unit scenarios — `filterMenuByQuery(items, query)`

Contract under test (design-plan WO-3 / D-2): trim + lowercase before match (VAL-024-06, BR-024-14); empty/whitespace → return `items` unchanged (AC-024-12); leaf kept iff its **string** `label` contains the trimmed query as a case-insensitive substring; divider kept and passed to `filterEmptyChildren` hygiene; submenu kept iff ≥1 kept descendant (D-5a); must not mutate input nodes; non-string labels must not crash.

| ID | Spec | Oracle (assertable outcome) |
|---|---|---|
| A1 | AC-024-11, BR-024-14 | `filterMenuByQuery(gatedMenu, 'cảng')` keeps leaf `{ key: '/pier', label: 'Quản lý cầu cảng' }` (label contains "cảng") and drops leaf `{ key: '/users', label: 'Quản lý tài khoản người dùng' }` (does not). Assert: kept keys include `'/pier'`, exclude `'/users'`, `'/logs'`. |
| A2 | AC-024-11, BR-024-13, VAL-024-06 | `filterMenuByQuery(gatedMenu, '  cảng  ')` returns a result **key-identical** to `filterMenuByQuery(gatedMenu, 'cảng')` (leading/trailing spaces trimmed before match — no result change). |
| A3 | AC-024-12, VAL-024-06 | `filterMenuByQuery(gatedMenu, '   ')` (whitespace-only, and `''`) returns the full tree: kept keys = all leaf+parent keys of `gatedMenu`; result structure deep-equals `gatedMenu`. Design-plan D-4 also requires the same-reference early return — assert `result === gatedMenu` if the contract's "unchanged" wording is implemented as identity (design-plan D-2/D-4 specify early-return of `items`); if identity is not implemented, the deep-equality assertion is the mandatory bar. |
| A4 | AC-024-11, BR-024-14 | Case-insensitivity: `filterMenuByQuery(gatedMenu, 'CẢNG')` and `filterMenuByQuery(gatedMenu, 'cảng')` (and `'Cảng'`) produce identical kept-key sets. Diacritics are matched exactly — no folding: `'cang'` (no diacritics) must NOT match `'Cảng biển'`; assert `'cang'` yields no port-parent descendant (documented limitation, design-plan §5). |
| A5 | D-5 (option a), BR-024-14, AC-024-11 | Parent/child keep: query `'cầu cảng'` → leaf `/pier` kept; `port-parent` kept with `children` containing only `berth-parent`; `berth-parent` kept with children `['/pier']`. Non-matching sibling `'/dry-port'` dropped; `'/water-zone'` dropped. Every kept leaf remains reachable through its ancestor chain. |
| A6 | D-5 (option a), BR-024-04/14, AC-024-11 | Parent/child drop: query `'vùng nước'` → only leaf `/water-zone` kept under `cangben`; `port-parent` subtree dropped entirely (0 matching descendants); `system-admin` subtree dropped. Assert absent: `'port-parent'`, `'berth-parent'`, `'/pier'`, `'/dry-port'`, `'/users'`, `'/logs'`. |
| A7 | D-5 (SA settle — own-label match alone does NOT keep a submenu) | Submenu whose **own label** matches but has **no matching descendant** is hidden: e.g. query `'KCHT'` matches label `'Quản lý KCHT Hàng Hải'` only (no child contains "KCHT") → whole `cangben` branch dropped. Assert `cangben` absent. (Design-plan D-2: "own-label match of a submenu does NOT keep it when all descendants are filtered out".) |
| A8 | BR-024-14 (hygiene consistent with non-search menu), filterEmptyChildren reuse | Divider hygiene: query matching only a mid-subtree (e.g. `'vùng nước'`) → result has **no leading divider, no trailing divider, no two adjacent dividers** (same rule set as `filterEmptyChildren` at AppLayout.tsx:474). Assert on the `type === 'divider'` positions in the result array. |
| A9 | AC-024-12, VAL-024-06 | Restore-on-clear: `filterMenuByQuery(gatedMenu, '')` and `('   ')` return the full tree unchanged (kept keys = full key set; structural deep-equality with `gatedMenu`). |
| A10 | BR-024-15, AC-024-11 | Permission-gating unaffected: for any input tree `T` and any query, `collectKeys(filterMenuByQuery(T, q)) ⊆ collectKeys(T)` — the filter only removes, never invents items (no key outside the input appears). Also: feed `T` and `T'` = `T` minus one leaf; assert filtered keys of `T'` never include the removed leaf for any query that would match it. Structural guarantee: the filter runs **post-gating** (on `menuItems`, line 498) — verify by source inspection in wave-2 that `filterMenuByQuery` is called with `menuItems`, not `rawMenuItems`. |
| A11 | D-2 ReactNode guard | Node with **non-string** `label` (e.g. `label: <span>Quản lý <b>cảng</b></span>` or `label: undefined`) with children → function does NOT throw; children are still traversed (a matching descendant keeps the branch per D-5a); the non-string-label node itself is never the match reason (guarded by `typeof label === 'string'`). |
| A12 | D-2 no-mutation | Input tree is not mutated: run any scenario, then assert `gatedMenu` still has its original children arrays and labels (deep-equal to the fixture). Parent rebuilds use spread `{ ...item, children }`; kept leaves returned by reference — no in-place edits. |
| A13 | Design-plan §5 (empty result) | Query with no match anywhere (e.g. `'zzzz'`) → returns `[]` (or an array with no leaf items after `filterEmptyChildren`) without throwing; no stale keys, no crash. |

---

## 5. Unit scenarios — `collectOpenableKeys(items)`

Contract under test (design-plan D-3 / WO-4): return the `key` of **every** kept submenu (item with non-empty `children`), recursively; used as `effectiveOpenKeys` while searching so all paths to matches are expanded.

| ID | Spec | Oracle (assertable outcome) |
|---|---|---|
| B1 | AC-024-11 (ancestors reachable), D-3 | For the filtered tree of A5 (query `'cầu cảng'`): `collectOpenableKeys(result)` returns exactly `['cangben', 'port-parent', 'berth-parent']` (every kept submenu key, recursively, top-down order). |
| B2 | D-3 (keys present in filtered tree) | `collectOpenableKeys(filterMenuByQuery(T, q))` returns **only keys that exist in the filtered tree** — no stale/orphan keys (no `key` of a dropped branch). Assert set-subset of filtered tree's submenu keys. |
| B3 | D-3, AC-024-12 | Empty/no-submenu input: `collectOpenableKeys([])` → `[]`; a flat leaf-only tree (e.g. `[{ key: '/', label: 'Trang chủ' }]`) → `[]` (no submenus to open). |
| B4 | D-3 determinism | Same input twice → identical arrays (order stable; no random or state-dependent output). |
| B5 | D-3 recursion depth | Nested chain (≥3 levels, e.g. `cangben` → `port-parent` → `berth-parent`) → all ancestor keys present in the returned array (ancestor chain of a deep match is fully expanded). |

---

## 6. Manual smoke scenarios (rendered sidebar)

Wave-2 executes these against the running app (sidebar with the live menu), one user flow each.

| ID | Spec | Steps | Oracle (observable) |
|---|---|---|---|
| C1 | AC-024-11, D-3 | Type `cảng` into the pill input under the sidebar header | Tree narrows to items whose Vietnamese label contains "cảng" (e.g. Quản lý cảng biển → Quản lý bến cảng → Quản lý cầu cảng); non-matching groups disappear; all ancestor submenus of matches are **already open** (no click needed to see the matching leaf). |
| C2 | AC-024-12 | While filtered, clear the input (delete all characters) | Full menu restores as before search: exactly **7 level-1 groups** + utility items (Trang chủ, Cấu hình hệ thống...) per the user's permissions; pre-search open/close state restored (D-4: `openKeys` base state returns). |
| C3 | AC-024-12, VAL-024-06 | While filtered, replace content with spaces only (e.g. `   `) | Menu behaves as clear: full tree shown (whitespace-only query treated as empty after `.trim()`); no flicker of an empty result. |
| C4 | AC-024-13, BR-024-13 | Type a keyword then press **Enter**; also click a matching leaf | No navigation/route change from typing or Enter (URL stays; no page transition); clicking a leaf still navigates exactly per AC-024-06 (existing `handleMenuClick`); DevTools Network shows **zero** search/API requests while typing (no backend call); no form submission. |
| C5 | BR-024-15 | As a user **without** a permission (e.g. no `user:read`), search for `quản lý tài khoản` | The out-of-permission item never appears in filtered results (search cannot surface items the user cannot see in the full menu). |
| C6 | Design-plan §5 | Search a nonsense string (e.g. `zzzzz`) | Empty result state: header + search box remain visible, menu area renders empty without crashing; clearing restores the full menu. |
| C7 | WO-1 (input wiring) | Type, then toggle sidebar collapse/fullscreen (`!collapsed && !isMenuFullScreen` render condition, AppLayout.tsx:562) | Input renders only in the non-collapsed, non-fullscreen state (existing condition unchanged); typing updates the visible filter live (controlled input `value={searchQuery}` + `onChange`); the search box keeps `.sidebar-search` styling — no hardcoded color/spacing/font-size added. |

---

## 7. Wave-2 verification commands (mandatory gates)

Run from the `frontend` project directory. Both must exit 0 for the battery to pass:

```bash
cd frontend && npx tsc --noEmit
cd frontend && npx vitest run
```

Focused battery (design-plan WO-7; the unit scenarios in §4–§5 live here):

```bash
cd frontend && npx vitest run src/components/AppLayout.test.tsx
```

Pass definition for wave-2:
- `npx tsc --noEmit` exits 0 (no type errors project-wide; AC-024-09).
- `npx vitest run` exits 0; the `AppLayout.test.tsx` suite covers every unit scenario A1–A13, B1–B5 (the D-7 seam set) with **real assertions** — a test that can stay green after the behavior is removed is not evidence (e.g. a "test" that only renders without asserting the filter result fails the oracle).
- Each smoke scenario C1–C7 executed with a documented observable outcome (screenshot/route-state/network evidence; a bare "looks fine" is not sufficient).
- Scope guard: implementation diff touches exactly `AppLayout.tsx` + `AppLayout.test.tsx`; no `theme.ts`/`tokens.ts`, no backend, no migration, no new dependency (design-plan WO-7).
- Battery results are recorded in this file's wave-2 section (QA appends results; this wave does not pre-fill them).

---

## 8. Assumptions & documented limitations

- **No diacritic folding** (design-plan §5, BR-024-14 as-is substring): `cang` does not match `Cảng` — oracle A4 asserts this negative. Not a defect.
- **Submenu own-label match without matching descendant → hidden** (D-5 settle): oracle A7 asserts this. Not a defect.
- Empty result set is spec-silent and acceptable (C6 documents current behavior).
- Search state persists across collapse/fullscreen toggles (render condition hides the box, state persists) — acceptable per design-plan §5.
- Optional render test of the input is not a blocking criterion (D-7); C7 smoke covers the wiring observably.
- Oracle depends on the fixture in §3 mirroring real labels; if the menu tree is later re-structured, the fixture (not the oracle semantics) must be updated.

## 9. Evidence & provenance (this wave)

- All oracle sources read this session (hash-pinned by prior seats): lean-spec `af67062eaffd`/current, design-plan (read, 205 lines), F-292 brief (145 lines), intake TRI-1787823566528-bb3e, `AppLayout.tsx` (843 lines).
- Seam anchors verified by direct read this session: `rawMenuItems` at line 230; `filterEmptyChildren` at line 474; `menuItems = filterEmptyChildren(rawMenuItems)` at line 498; dead input block `{!collapsed && !isMenuFullScreen && (...)}` at lines 561–567 with `<input placeholder="Tìm kiếm" />` at 565; `<Menu items={menuItems} openKeys={openKeys} onOpenChange={setOpenKeys}>` at ~577.
- Source images `docs/inputs/photo_2026-07-09_15-47-20.jpg` and `docs/inputs/logo-vinamarine_1_1.png` read; confirmed no bearing on the search oracle (photo → dashboard D-2; logo → unchanged sidebar asset).
- No file outside `qa/07-qa-report-w1.md` was written this wave; no test code authored.
