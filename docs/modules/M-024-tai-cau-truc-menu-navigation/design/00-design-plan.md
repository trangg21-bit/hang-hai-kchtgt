# M-024 / F-292 — Design Plan: Sidebar Menu Search (real feature for the dead input)

- **Module:** M-024 Tái cấu trúc Menu & Navigation — Feature F-292
- **Stage:** engineering-solution-designer (SA) — settles BA proposals in feature-brief §6 and lean-spec D-5
- **Scope of this design:** `frontend/src/components/AppLayout.tsx` (edit) + `frontend/src/components/AppLayout.test.tsx` (new) ONLY.
  No theme.ts / tokens.ts, no backend, no entity, no migration, no other module screens, no new dependency.
- **Sources:** lean-spec `ba/00-lean-spec.md` (UC-024-09/10, BR-024-13/14/15, VAL-024-06, AC-024-11/12/13, D-5); F-292 feature-brief §6 (local `searchQuery` state, no API); `frontend/src/components/AppLayout.tsx` anchors opened this session (lines below refer to current file).

---

## 1. Current seam → intended delta

| Aspect | Current (verified anchors) | Intended |
|---|---|---|
| State | `openKeys` = `useState<string[]>([])` (line ~154); Menu is controlled: `openKeys={openKeys}` + `onOpenChange={setOpenKeys}` (line ~577) | Add `searchQuery` state; derive `displayedItems` + `effectiveOpenKeys` |
| Menu tree | `rawMenuItems` at `frontend/src/components/AppLayout.tsx:230` → `filterEmptyChildren(rawMenuItems)` → `menuItems` at `frontend/src/components/AppLayout.tsx:498`. `filterEmptyChildren` is a pure recursive pruner, currently defined **inside** the component at `frontend/src/components/AppLayout.tsx:474`: drops nulls, drops groups with 0 valid children, removes leading/trailing/duplicate dividers | Same gating pipeline stays the source of truth. Search filters **after** it, on `menuItems` (BR-024-13) |
| Input | Dead `<div className="sidebar-search"><SearchOutlined /><input placeholder="Tìm kiếm" /></div>` (lines ~561–567), rendered when `!collapsed && !isMenuFullScreen` (line ~562) | Controlled input: `value={searchQuery}` + `onChange` — no Enter handler, no form wrapper, no API (BR-024-13, AC-024-13) |
| Menu render | `<Menu ... items={menuItems} openKeys={openKeys} onOpenChange={setOpenKeys} ... />` (line ~577) | `items={displayedItems}` + `openKeys={effectiveOpenKeys}`; `onOpenChange` unchanged |

**Data flow (search):** `searchQuery` (raw string state) → `.trim()` at match time (VAL-024-06) → if empty/whitespace: show `menuItems` unchanged (AC-024-12) → else `filterMenuByQuery(menuItems, query)` → `displayedItems`; `effectiveOpenKeys` = all kept submenu keys while searching, `openKeys` otherwise.

---

## 2. Design decisions (settled — the SA answers to BA proposals)

### D-1. State shape and input wiring
- `const [searchQuery, setSearchQuery] = useState('');` — plain string, stores the **raw** value (spaces preserved so the user can type/edit freely). Place next to the other `useState` calls (after line ~151 `isMenuFullScreen`).
- Input becomes controlled: `value={searchQuery}`, `onChange={(e) => setSearchQuery(e.target.value)}`.
- **No** `onKeyDown` / `onPressEnter`, **no** `<form>` wrapper, **no** debounce, **no** `useMemo` beyond plain derived consts (menu is small, client-side; spec requires none — smallest complete change).
- `.trim()` happens only where the value is *used* (match + is-searching check), never stored trimmed (VAL-024-06). Whitespace-only input is a valid intermediate state that restores the full menu.

### D-2. Filter algorithm (settles BR-024-14 + D-5)
Applied to the **already permission-gated** `menuItems` (BR-024-13, BR-024-15). New module-level pure function:

```ts
// module scope (after filterEmptyChildren is hoisted)
export function filterMenuByQuery(items: MenuProps['items'], query: string): MenuProps['items'] {
  const q = query.trim().toLowerCase();            // VAL-024-06 + case-insensitive
  if (!q) return items;                            // AC-024-12: empty/whitespace → exact full menu (same reference, no re-render churn beyond one pass)
  const keepMatching = (nodes: MenuProps['items']): MenuProps['items'] =>
    (nodes ?? []).map((node: any) => {
      if (!node) return null;
      if (node.type === 'divider') return node;    // kept; filterEmptyChildren applies existing divider hygiene
      if (node.children) return keepMatching(node.children); // parent kept iff ≥1 descendant kept (D-5a); own-label match of a submenu does NOT keep it when all descendants are filtered out
      const labelMatches = typeof node.label === 'string' && node.label.toLowerCase().includes(q);
      return labelMatches ? node : null;
    });
  return filterEmptyChildren(keepMatching(items)); // prunes empty branches + cleans dividers — reuse, do NOT duplicate
}
```

Rules (each traceable):
- **Leaf (no `children`)**: kept iff its string `label` contains the trimmed query as a case-insensitive substring. Vietnamese diacritics are matched **exactly** (no folding): `"cảng"` matches `"Cảng biển"`, `"cang"` does not — spec-faithful, documented limitation.
- **Submenu (has `children`)**: kept iff **≥1 descendant** is kept (D-5 settle — option (a) of lean-spec D-5: matching leaves stay reachable through their ancestor chain). A submenu whose own label matches but has no matching descendant is hidden (per design decision in the dispatch brief: "nested submenu stays visible when ANY descendant matches… otherwise hidden"). This is exactly `filterEmptyChildren`'s existing empty-branch rule (BR-024-04), so the two behaviors are one.
- **Divider**: passed through, then `filterEmptyChildren` removes leading/trailing/duplicate dividers — same hygiene as the non-search menu.
- **No mutation**: `rawMenuItems` is never touched; parents are rebuilt via `filterEmptyChildren`'s existing `{ ...item, children }` spread; kept leaves are returned by reference.
- **No match anywhere** → `[]` → Menu renders empty scroll area (header + search box remain). Spec-silent; acceptable.
- Non-string labels (ReactNode) never crash: guarded by `typeof node.label === 'string'`; children still traversed (defensive; all current labels in `rawMenuItems` are plain strings).

### D-3. Auto-open ancestors of matches (while filtering)
New module-level pure function:

```ts
export function collectOpenableKeys(items: MenuProps['items']): string[] {
  return (items ?? []).reduce<string[]>((acc, node: any) => {
    if (node?.children?.length) {
      acc.push(node.key as string);
      acc.push(...collectOpenableKeys(node.children));
    }
    return acc;
  }, []);
}
```

In the component: `const effectiveOpenKeys = isSearching ? collectOpenableKeys(displayedItems) : openKeys;` and pass `openKeys={effectiveOpenKeys}` to `<Menu>`.
- Every kept submenu in the filtered tree is exactly an ancestor of ≥1 match, so this set = "ancestor keys of matches" — all paths to results are expanded.
- While searching, the derived set **wins** over user toggling (`onOpenChange` still writes to base `openKeys`); on clear, the base state (pre-search, plus any toggles made meanwhile) is shown again — deterministic, restores "exact full menu" (AC-024-12).
- Keys absent from the filtered tree are never pushed (no stale-key warnings).

### D-4. Restore on clear (AC-024-12)
- `const trimmedSearchQuery = searchQuery.trim();`
- `const isSearching = trimmedSearchQuery.length > 0;`
- `const displayedItems = isSearching ? filterMenuByQuery(menuItems, trimmedSearchQuery) : menuItems;` — empty/whitespace query returns the **same** `menuItems` reference (filterMenuByQuery early-returns `items`), so the full gated menu (7 groups + utility items) reappears with zero filtering.
- `filterMenuByQuery` re-trims internally as a defensive contract (VAL-024-06 lives in the function, not only at the call site).

### D-5. No navigation, no API (AC-024-13 / BR-024-13)
- The input has no Enter handler and is not wrapped in a form → pressing Enter cannot submit/navigate.
- Search never calls `navigate`, `useSearchParams`, or any service/API; it only derives props fed to the existing controlled `<Menu>`. Leaf clicks keep navigating through the existing `handleMenuClick` (unchanged, AC-024-06).
- BR-024-15 holds structurally: the filter receives the already-gated tree and can only **remove** items (output ⊆ input), never add.

### D-6. Scope (triage TRI-1787823566528-bb3e)
- Edit: `frontend/src/components/AppLayout.tsx` only. New: `frontend/src/components/AppLayout.test.tsx` (co-located — the vitest runner collects `frontend/**/*.test.*`, and co-location matches `PermissionGuard.test.tsx` etc.).
- **No** `theme.ts`/`tokens.ts` change: `.sidebar-search` CSS already exists (theme.ts lines ~412–435); no new class, no style props, no hardcoded color/spacing/font-size (BR-024-10).
- **No** new Layout/Sider/Menu of our own; no API endpoint; no entity; no migration; no other module screen.
- Naming: identifiers/keys English (`searchQuery`, `filterMenuByQuery`, `collectOpenableKeys`, `displayedItems`, `effectiveOpenKeys`); labels/placeholder/UI text Vietnamese with diacritics (`placeholder="Tìm kiếm"` stays).

### D-7. Unit-test seams (what the developer must cover)
Pure-function tests on the two **exported** helpers — no rendering, no router/store mocks (AppLayout module import is side-effect-free beyond imports). Test file follows the `PermissionGuard.test.tsx` convention (vitest + `@testing-library/react` + `import '@testing-library/jest-dom'`).

| Seam | Case | Assertion |
|---|---|---|
| label match | `filterMenuByQuery(tree, 'cảng')` | leaf `'Cảng biển'` kept; leaf `'Quản lý log truy cập'` dropped |
| trim (VAL-024-06) | `filterMenuByQuery(tree, '  cảng  ')` | same result as `'cảng'`; whitespace-only `'   '` returns `items` (same reference / full tree) |
| case-insensitive | `'CẢNG'` vs `'cảng'` | identical kept-key sets |
| parent/child (D-5a) | parent with 1 matching child | parent kept, `children` = only the matching leaf; parent with 0 matching descendants → dropped entirely |
| divider hygiene | tree where only a mid subtree matches | result has no leading/trailing/duplicate dividers |
| restore on clear (AC-024-12) | empty + whitespace query | `filterMenuByQuery(items, '')` and `('   ')` return the full tree unchanged |
| permission-gating unaffected (BR-024-15) | feed a tree, then feed the same tree minus one leaf | output keys ⊆ input keys (filter only removes); `collectOpenableKeys` on the filtered result returns only keys present in it |
| ReactNode label guard | node with non-string `label` + children | no throw; children still traversed |

One render-level test is **optional** (input exists with `placeholder="Tìm kiếm"`; typing filters) — it requires mocking `useAuthStore`/`usePermissionStore`/router like `PermissionGuard.test.tsx` does; do not block on it.

---

## 3. Acceptance-criteria mapping

| AC / BR / VAL | Design element |
|---|---|
| AC-024-11 (` cảng ` with extra spaces → only labels containing "cảng" after trim, case-insensitive; empty branches hidden; nothing out-of-permission) | D-2 filter + D-4 trim; runs on gated `menuItems` (D-5/BR-024-15) |
| AC-024-12 (clear or whitespace-only → full menu restored, 7 groups) | D-4: `isSearching` false → `displayedItems = menuItems` (same reference) |
| AC-024-13 (typing + Enter, or clicking a match → no unintended navigation, no search API) | D-5: no Enter handler, no form, no navigate/API in search path |
| BR-024-13 (display-only filter on gated tree; trim before match) | D-2/D-4: applied after `menuItems` (line 498); `filterMenuByQuery` trims |
| BR-024-14 (substring case-insensitive on Vietnamese label; submenu kept iff ≥1 child kept; empty/whitespace restores) | D-2 algorithm |
| BR-024-15 (search never bypasses permissions) | D-5: filter applied post-gating; output ⊆ input |
| VAL-024-06 (input `.trim()` before use) | D-1/D-4: trim at use site and inside `filterMenuByQuery` |
| D-5 (SA settle) | Option (a) confirmed: parent kept iff ≥1 descendant kept → leaves reachable; own-label match of a submenu alone does not keep it |
| AC-024-08 / BR-024-10 (English identifiers, Vietnamese labels, no hardcoded styling) | D-6 naming + no style additions |
| AC-024-09 (verification) | `cd frontend && npx tsc --noEmit` + `npm test` (see WO-7) |

---

## 4. Work orders (frontend developer — each independently executable and verifiable)

### WO-1 — Add `searchQuery` state + make the input controlled
- **File:** `frontend/src/components/AppLayout.tsx`
- **Where:** add `const [searchQuery, setSearchQuery] = useState('');` after `isMenuFullScreen` state (line ~151). Replace the dead input inside `.sidebar-search` (lines ~563–566) with:
  ```tsx
  <input
    placeholder="Tìm kiếm"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
  />
  ```
- **Constraints:** no `onKeyDown`/`onPressEnter`, no `<form>` wrapper, no style props, keep `SearchOutlined` and `.sidebar-search` as-is (render condition `!collapsed && !isMenuFullScreen` unchanged).
- **Verify by:** WO-6 test "input wiring" (optional render test) + `npx tsc --noEmit`.

### WO-2 — Hoist `filterEmptyChildren` to module scope
- **File:** `frontend/src/components/AppLayout.tsx`
- **Where:** move the existing `filterEmptyChildren` at `frontend/src/components/AppLayout.tsx:474` verbatim out of the component to module scope (above `export default function AppLayout`). Logic unchanged; it is already pure (depends only on its argument).
- **Verify by:** `npm test` on WO-6 + no behavior change in non-search menu (existing AC-024-04 path).

### WO-3 — Add exported `filterMenuByQuery(items, query)` (module scope)
- **File:** `frontend/src/components/AppLayout.tsx`
- **Signature:** `export function filterMenuByQuery(items: MenuProps['items'], query: string): MenuProps['items']`
- **Contract:** exactly the algorithm in D-2 — trim + lowercase (VAL-024-06, BR-024-14); empty/whitespace → return `items` unchanged (AC-024-12); leaf kept iff string-label substring match; divider kept (hygiene via `filterEmptyChildren`); submenu kept iff ≥1 kept descendant (D-5a); **must not mutate** `rawMenuItems` or input nodes; non-string labels guarded.
- **Verify by:** WO-6 pure-function tests.

### WO-4 — Add exported `collectOpenableKeys(items)` (module scope)
- **File:** `frontend/src/components/AppLayout.tsx`
- **Signature:** `export function collectOpenableKeys(items: MenuProps['items']): string[]`
- **Contract:** D-3 — return the `key` of every kept submenu (item with non-empty `children`), recursively.
- **Verify by:** WO-6 test (returned keys ⊆ keys present in the filtered tree).

### WO-5 — Wire derived values + Menu props
- **File:** `frontend/src/components/AppLayout.tsx`
- **Where:** immediately after `const menuItems = filterEmptyChildren(rawMenuItems);` (line ~498) add:
  ```tsx
  const trimmedSearchQuery = searchQuery.trim();
  const isSearching = trimmedSearchQuery.length > 0;
  const displayedItems = isSearching ? filterMenuByQuery(menuItems, trimmedSearchQuery) : menuItems;
  const effectiveOpenKeys = isSearching ? collectOpenableKeys(displayedItems) : openKeys;
  ```
- **Where (Menu, line ~577):** change `items={menuItems}` → `items={displayedItems}` and `openKeys={openKeys}` → `openKeys={effectiveOpenKeys}`. Keep `onOpenChange={setOpenKeys}`, `selectedKeys`, `onClick` untouched.
- **Verify by:** WO-6 tests + manual smoke (type a query → tree narrows and ancestors auto-open; clear → full menu returns with pre-search open state).

### WO-6 — Add `frontend/src/components/AppLayout.test.tsx` (new file)
- **Where:** `frontend/src/components/AppLayout.test.tsx` (co-located; runner collects it). Import `{ filterMenuByQuery, collectOpenableKeys } from './AppLayout'`.
- **Cover:** the 8 seams in D-7 (label match; trim incl. whitespace-only restore; case-insensitive; parent/child D-5a keep + drop; divider hygiene; restore-on-clear same-reference/full-tree; permission-gating unaffected — output ⊆ input; ReactNode-label guard). Optional: one render test of the input using the `PermissionGuard.test.tsx` mock pattern.
- **Verify by:** `npm test` (vitest run) — focused file green; `npx tsc --noEmit` green.

### WO-7 — Verification + scope guard
- **Run:** `cd frontend && npx tsc --noEmit` (AC-024-09) and `cd frontend && npm test` (focused: `npx vitest run src/components/AppLayout.test.tsx`).
- **Scope guard:** diff must touch exactly `AppLayout.tsx` + `AppLayout.test.tsx`. No `theme.ts`/`tokens.ts`, no backend, no migration, no other module files, no new package.json dependencies (testing-library + jest-dom already present), no git operations.

---

## 5. Risks & edge cases

| Risk | Mitigation |
|---|---|
| Diacritic folding expected by a user (`cang` → "Cảng") | Out of spec (BR-024-14 = substring on label as-is). Documented limitation; do not add folding (would be speculative scope). |
| Submenu whose own label matches but no descendant does → hidden | Per dispatch design decision + D-5 settle; consistent with BR-024-04/14 wording. Tested in WO-6. |
| Controlled `openKeys` overridden while searching (user toggles ignored) | Intended: deterministic auto-open during search; base state restored on clear. Documented in D-3. |
| Search state survives fullscreen/collapse toggles | Render condition hides the box but state persists — acceptable, no requirement to reset. |
| Empty result set | Menu renders empty scroll area; header + search box remain. Spec-silent; acceptable. |
| Importing AppLayout in a test executes store/router module imports | Pure-function tests never render; module imports have no side effects. |

---

## 6. Out of scope (unchanged)

- No backend endpoint, entity, migration, permission seeder change (D-4 of lean-spec: no new permission).
- No theme/token/class/CSS changes — `.sidebar-search` exists.
- No other module screens; no dashboard 6-block work (separate F-xxx features of M-024).
- No QA test scenarios here (belongs to the QA stage).
