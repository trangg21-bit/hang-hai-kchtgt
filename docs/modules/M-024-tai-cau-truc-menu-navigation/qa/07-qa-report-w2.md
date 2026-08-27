# M-024 / F-292 — QA Wave-2 Validation Report (battery executed)

| Field | Value |
|---|---|
| Module / Feature | M-024 Tái cấu trúc Menu & Navigation — F-292 (TRI-1787823566528-bb3e) |
| Stage | engineering-qa-engineer — **wave-2 validation** (wave-1 oracle: `qa/07-qa-report-w1.md`) |
| Implementation under test | `frontend/src/components/AppLayout.tsx` (searchQuery state, exported `filterMenuByQuery` + `collectOpenableKeys`, `displayedItems`/`effectiveOpenKeys`, controlled input) + `frontend/src/components/AppLayout.test.tsx` (18 tests) + `frontend/vitest.config.ts` (includes AppLayout.test.tsx) |
| Battery date | 2026-08-27 |
| **Final verdict** | **PASS** — both gates green; all 18 unit scenarios (A1–A13, B1–B5) covered by real assertions and green. Manual smoke C1–C7 verified by code inspection (live browser run not possible in this environment — residual for UAT, see §4). |

---

## 1. Executed commands (verbatim output)

### 1.1 `cd frontend && npx tsc --noEmit` — **exit 0 (PASS)** (AC-024-09)

```
$ npx tsc --noEmit
No violations found.
Lint passed (exit code 0).
(no output)
```

### 1.2 `cd frontend && npx vitest run` — **exit 0 (PASS)**

```
RUN  v4.1.11  C:/Users/trangtt1/hang-hai-kchtgt/frontend

 ✓ src/services/planningGis.test.ts (6 tests) 13ms
 ✓ src/services/gisGeometry.test.ts (5 tests) 11ms
 ✓ src/services/userService.test.ts (9 tests) 19ms
 ✓ src/services/registrationService.test.ts (2 tests) 9ms
 ✓ src/services/gisSearchTypeOptions.test.ts (3 tests) 8ms
 ✓ src/services/aisSystemService.test.ts (6 tests) 14ms
 ✓ src/services/vtsOperationCenterService.test.ts (7 tests) 16ms
 ✓ src/services/vtsSystemService.test.ts (19 tests) 50ms
 ✓ src/store/permissionStore.test.ts (9 tests) 8ms
 ✓ src/store/authStore.test.ts (7 tests) 9ms
 ✓ src/components/AppLayout.test.tsx (18 tests) 12ms

 Test Files  11 passed (11)
      Tests  91 passed (91)
   Start at 17:48:09
   Duration 4.68s (transform 1.44s, setup 0ms, import 11.14s, tests 169ms, environment 2ms)
```

- **Collection confirmed:** 11 test files = 10 pre-existing + `src/components/AppLayout.test.tsx` (18 tests) — matches the developer seat's claim exactly.
- Pre-existing suites (73 tests) still green — no regression from the AppLayout change.

---

## 2. Scenario-by-scenario grading vs oracle (unit battery)

Oracle: `qa/07-qa-report-w1.md` §4 (A1–A13), §5 (B1–B5). All assertions are real (key-set based, include negatives) — no render-only smoke. Test file read in full this session (230 lines).

| ID | Spec | Test in AppLayout.test.tsx | Assertion observed | Result |
|---|---|---|---|---|
| A1 | AC-024-11, BR-024-14 | `A1: keeps a leaf whose label contains the query; drops non-matching leaves` | `'cảng'` → `/pier` contained; `/users`, `/logs` absent | PASS |
| A2 | VAL-024-06, BR-024-13/14 | `A2: leading/trailing spaces are trimmed before matching` | `'  cảng  '` key-set ≡ `'cảng'` key-set | PASS |
| A3 | AC-024-12, VAL-024-06 | `A3: whitespace-only and empty query return the SAME reference (full tree)` | `toBe(gatedMenu)` for both `'   '` and `''` | PASS |
| A4 | BR-024-14 (case-insens; no diacritic folding) | `A4: case-insensitive; diacritics matched exactly (no folding)` | `'CẢNG'`/`'Cảng'` ≡ `'cảng'`; `'cang'` → `[]` (no port-parent/pier/dry-port) | PASS |
| A5 | D-5 (a), BR-024-14, AC-024-11 | `A5: parent/child keep` | `'cầu cảng'` → keys `['cangben','port-parent','berth-parent','/pier']`; `/dry-port`, `/water-zone`, `system-admin` absent | PASS |
| A6 | D-5 (a), BR-024-04/14, AC-024-11 | `A6: parent/child drop` | `'vùng nước'` → keys `['cangben','/water-zone']`; port subtree absent | PASS |
| A7 | D-5 (SA settle) | `A7: a submenu whose own label matches but has no matching descendant is hidden` | `'KCHT'` → `[]` (cangben absent) | PASS |
| A8 | BR-024-14 hygiene | `A8: divider hygiene` | `'vùng nước'` → no dividers; `'quản lý'` → exactly 1 divider at index 1 | PASS |
| A9 | AC-024-12, VAL-024-06 | `A9: restore-on-clear` | `''`/`'   '` → `toEqual(gatedMenu)`; full key set | PASS |
| A10 | BR-024-15, AC-024-11 | `A10: filter only removes, never invents (output ⊆ input)` | 5-query universe-subset check; `/pier`-removed tree cannot resurrect it | PASS |
| A11 | D-2 ReactNode guard | `A11: non-string label is guarded` | `React.createElement('span',…,'ZZZ-ONLY-HERE')` + `undefined` labels: no throw; children traversed (keeps `/pier`); non-string text never the match reason | PASS |
| A12 | D-2 no-mutation | `A12: input tree is not mutated` | JSON deep-equal snapshot after 4 queries + collectOpenableKeys | PASS |
| A13 | Design §5 empty result | `A13: a no-match query returns [] without throwing` | `'zzzz'` → `[]` | PASS |
| B1 | AC-024-11, D-3 | `B1: returns every kept submenu key, recursively, top-down` | `['cangben','port-parent','berth-parent']` | PASS |
| B2 | D-3 (no stale keys) | `B2: returns only keys present in the filtered tree` | 5-query present-keys subset check | PASS |
| B3 | D-3, AC-024-12 | `B3: empty or flat leaf-only input yields []` | `[]`, `undefined`, leaf-only → `[]` | PASS |
| B4 | D-3 determinism | `B4: deterministic` | same input twice → identical arrays | PASS |
| B5 | D-3 recursion depth | `B5: nested chain ≥3 levels` | contains cangben/port-parent/berth-parent, length 3 | PASS |

**18/18 unit scenarios PASS.**

---

## 3. Implementation vs design plan (independent verification, `AppLayout.tsx` read this session)

| Design element | Anchor verified | Match |
|---|---|---|
| D-1 state + controlled input | `searchQuery` state :201; input `value={searchQuery}` + `onChange` (~:595–600), placeholder `Tìm kiếm` kept, no `onKeyDown`/`onPressEnter`, no `<form>`, render condition `!collapsed && !isMenuFullScreen` unchanged | ✅ |
| D-2 `filterMenuByQuery` | :170 — `query.trim().toLowerCase()` (VAL-024-06); `if (!q) return items` (identity, AC-024-12); divider passthrough; submenu `{ ...node, children }` (no mutation); leaf `typeof node.label === 'string' && label.toLowerCase().includes(q)` (ReactNode guard); tail `filterEmptyChildren(...)` reuse (helper hoisted to module scope ~:144 — WO-2) | ✅ |
| D-3 `collectOpenableKeys` | :184 — recursive push of submenu keys; `effectiveOpenKeys = isSearching ? collectOpenableKeys(displayedItems) : openKeys` :528; `<Menu openKeys={effectiveOpenKeys}>` :609; `onOpenChange={setOpenKeys}` unchanged | ✅ |
| D-4 restore on clear | `displayedItems = isSearching ? filterMenuByQuery(menuItems, trimmedSearchQuery) : menuItems` :527; `trimmedSearchQuery` :525 | ✅ |
| D-5 no nav/API; BR-024-15 | filter applied **after** gating: `menuItems = filterEmptyChildren(rawMenuItems)` :522 → derived values :525–528; input has no Enter handler/form; no `navigate`/`fetch` in the search path; output can only remove | ✅ |
| WO-5 Menu wiring | `items={displayedItems}` :611, `openKeys={effectiveOpenKeys}` :609, `selectedKeys`/`onClick` untouched | ✅ |

## 4. Manual smoke scenarios C1–C7

| ID | Oracle outcome | Grading basis | Result |
|---|---|---|---|
| C1 | type query → tree narrows + ancestors auto-open | Behavior = composition of unit-verified A1/A5/B1 + `effectiveOpenKeys` wiring :528/:609 | PASS (by construction; live smoke pending UAT) |
| C2 | clear → full 7-group menu restores | Unit A3/A9 (identity restore) + `displayedItems = menuItems` :527 | PASS (by construction) |
| C3 | whitespace-only → restore | Unit A3/A9 + trim :525 | PASS (by construction) |
| C4 | Enter → no navigation, no API | Code inspection: no Enter handler, no form, no search-path API call; leaf clicks still via existing `handleMenuClick` | PASS (by code inspection; network-tab observation pending UAT) |
| C5 | no out-of-permission item via search | BR-024-15 structural: filter receives gated `menuItems` only (A10) | PASS (by construction) |
| C6 | nonsense query → empty area, no crash | Unit A13 + header/search-box render outside the filtered list | PASS (by construction) |
| C7 | input only in non-collapsed, non-fullscreen state; live filter | Render condition unchanged :593; controlled input :595–600 | PASS (by code inspection) |

**C1–C7 not live-executed:** this environment has no running app/browser and no dev server may be started from the QA seat. Structural verification (unit battery + code inspection) is green; the live browser smoke (visual narrow, network tab, Enter behavior) is a residual for UAT/manual smoke and is **not a battery blocker** — no scenario failure was observed or inferred.

## 5. Scope guard

- **Files read and verified in-scope:** `frontend/src/components/AppLayout.tsx` (search implementation exactly at the designed seams), `frontend/src/components/AppLayout.test.tsx` (new, 18 tests), `frontend/vitest.config.ts` (8 lines, `include` adds `src/components/AppLayout.test.tsx`).
- **Regression check:** vitest collected exactly the 10 pre-existing suites + AppLayout.test.tsx (73 + 18 = 91); no new test file appeared.
- **git-based diff check NOT runnable:** `git status` / `git diff` invocations were refused by this dispatch's permission narrowing (3 attempts; per runtime rules the identical class is not retried). Scope is therefore verified by direct file reads (implementation only at the designed seams, no theme/token/entity/migration/API code introduced — the implementation adds no imports of `theme.ts`/`tokens.ts` and no backend/API calls; no hardcoded colors/spacing added; the search path is pure frontend state + derived props). Residual: exact working-tree diff confirmation belongs to the release gate, which owns `git`.
- No theme/token/backend/migration change was observed in any file read; `vitest.config.ts` change is within the dispatch-declared scope.

## 6. Evidence provenance

- Commands executed this session: `npx tsc --noEmit` (workdir `frontend`) exit 0; `npx vitest run` (workdir `frontend`) exit 0, 11 files / 91 tests (verbatim output in §1).
- Files read in full this session: `AppLayout.test.tsx` (230 lines), `vitest.config.ts` (8 lines), `AppLayout.tsx` (877 lines — search seams at :144/:170/:184/:201/:522–528/:593–611).
- Oracle: `qa/07-qa-report-w1.md` (wave-1, authored this module run).
- **Coverage statement:** unit battery A1–A13/B1–B5 fully executed and green. Manual smoke C1–C7 structurally verified only (no live app in this environment) — stated, not silently claimed. Git diff scope check blocked by permission narrowing — stated with the release-gate owner.
