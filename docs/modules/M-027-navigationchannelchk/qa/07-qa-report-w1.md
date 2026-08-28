# QA Acceptance Oracle — M-027 Luồng hàng hải CHK (navigationchannelchk)

- Module: M-027-navigationchannelchk
- Stage: engineering-qa-engineer (wave-1 oracle authoring)
- Date: 2026-08-28
- Deliverables: `qa/acceptance-map.json` (5 entries, AC-1..AC-5) + this report
- Execution: wave-2 executes the bounded checks defined below; this wave-1 report defines the oracle, it does not run the battery.

## 1. Context

M-027 is a **frontend-only** faithful clone of the Luồng hàng hải module (`navigationchannel`) running on the CHK theme (`themetokenchk`). It shipped with **no QA wave** (release gate requires `qa/acceptance-map.json`: one entry per acceptance criterion with a bounded, runnable `file` + `test_name`). The module reuses the base service (`navigationChannelCRUD`/`navigationChannelApproval`) and permissions (`navigationchannel:*`); the entire change set is: 2 new page files, 6 new routes, 5 mirror entries in `AppLayout.tsx`, and label "Luồng hàng hải" → "Luồng hàng hải CHK".

Because the module is a clone whose business logic is inherited unchanged from the base pages and shared backend, the acceptance oracle is a **structural + build oracle**: bounded greps over the 4 in-scope files, `npm run build`, and a git-diff scope check. Runtime behavior is out of wave-2 scope (no live backend in this pipeline); behavioral parity is implied by AC-1's "faithful copy" grep and AC-4's successful build of the real pages.

## 2. Source of truth

| Source | Reference |
|---|---|
| `ba/00-lean-spec.md` | AC-1..AC-5 oracle table (section 6), boundaries (section 7) |
| `design/00-design-plan.md` | WO-1 (2 pages + RENAME MAP), WO-2 (App.tsx), WO-3 (AppLayout), WO-4 (verification) |
| `frontend/src/pages/navigationchannelchk/*` | implementation (wave-1 dev, Pass) |
| `frontend/src/App.tsx`, `frontend/src/components/AppLayout.tsx` | edited in scope (wave-1 dev, Pass) |

## 3. Acceptance oracle (AC-1..AC-5)

Each check is bounded to a named file set (or a single command) and runnable by wave-2.

| AC | Criterion | Check (bounded) | Expected result | Evidence anchor (verified this session) |
|---|---|---|---|---|
| AC-1 | 2 new pages exist as faithful CHK clones; no leftover base identifiers | grep both `frontend/src/pages/navigationchannelchk/NavigationChannelChkList.tsx` + `NavigationChannelChkForm.tsx` for `NavigationChannelChk(List|Form)` and `themetokenchk\|ThemeTokenProvider\|THEME_SCOPE_CLASS`; negative: `grep -E 'NavigationChannel(List|Form)' … \| grep -vE 'NavigationChannelChk'` | ≥6 Chk-identifier matches; ≥6 CHK-theme matches; **ZERO** lines without `Chk` | `NavigationChannelChkList.tsx:79` (export), `NavigationChannelChkForm.tsx:93,101`; `themetokenchk` imports at List:39-40, Form:71-73; `ThemeTokenProvider` List:518 / Form:95; `THEME_SCOPE_CLASS` Form:1105 |
| AC-2 | App.tsx: exactly 2 lazy imports + 6 routes with `navigationchannel:read/create` guards, rendering Chk components | `grep -n "lazy(() => import('./pages/navigationchannelchk/" frontend/src/App.tsx`; `grep -nE 'path="/(navigation-channel-chk\|luong-hang-hai-chk)' frontend/src/App.tsx` (+ guard/component count via piped grep -c) | 2 lazy imports (L74-75); 6 route matches (L245-251); 6/6 with `PermissionGuard permission="navigationchannel:(read|create)"`; 6/6 rendering `NavigationChannelChk(List|Form)` | App.tsx:74-75 lazy imports; App.tsx:245-251 all 6 chk routes wrapped in PermissionGuard with `navigationchannel:read`/`create` and Chk components |
| AC-3 | AppLayout.tsx: exactly 5 mirror entries, label "Luồng hàng hải CHK" | `grep -n 'navigation-channel-chk' frontend/src/components/AppLayout.tsx`; `grep -c 'Luồng hàng hải CHK' frontend/src/components/AppLayout.tsx` | 5 matches (L78 permission map, L146 title map, L273 highlight array, L300 selectedKey array, L423 menu item); label appears exactly 2× (L146, L423) | AppLayout.tsx:78,146,273,300,423 — all 5 grep-confirmed this session |
| AC-4 | Production build exits 0 | `npm run build` (cwd `frontend/`) | exit code 0, vite `✓ built in` | wave-1 dev executed it: exit 0, vite v8.1.5, 4120 modules transformed, built in 1.17s |
| AC-5 | Git scope = M-027 footprint exactly the 4 allowed paths; zero in M-027 forbidden zones | repo root: `git status --porcelain` + `git diff --name-only HEAD`; negative match on forbidden M-027 zones; theme.ts attribution via `git diff frontend/src/theme.ts` | untracked `pages/navigationchannelchk/` with exactly 2 files + `App.tsx`/`AppLayout.tsx` modified; **ZERO** entries under `pages/navigationchannel/`, `tokens.ts`, `themetokenchk.ts`, `src/main/**`, `src/main/resources/db/**`, `PermissionSeeder.java`; `theme.ts` M is concurrent M-024 CHK navy standardization — not M-027 | executed this session: git status/diff confirm the footprint; `git diff theme.ts` shows M-024's `sidebarBg #12468C→#1a3f83` changes matching M-024 acceptance-map AC-1..AC-3; PMO wave-1 confirmed the 4-path scope |

## 4. Boundaries (QA)

- **QA does not modify any source file.** This oracle only reads/greps/builds.
- **READ-ONLY (must not appear in the diff):** `frontend/src/pages/navigationchannel/**`, `frontend/src/tokens.ts`, `frontend/src/themetokenchk.ts`, `frontend/src/theme.ts`, all Java under `src/main/**`, all migrations under `src/main/resources/db/**`, `PermissionSeeder.java`.
- No runtime/live-backend checks in wave-2: backend `/v1/navigation-channel/*` and permissions pre-exist and are shared; behavioral parity is inherited, not re-tested.
- Wave-2 must run the full battery (all 5 ACs) and record observed output in `07-qa-report-w2.md` before the release gate can accept the map.

## 5. Oracle anchors spot-checked this session

- `frontend/src/App.tsx`: 14 grep matches confirm 2 lazy imports (L74-75) and 6 chk routes (L245-251), each with `PermissionGuard permission="navigationchannel:read"` or `"create"`.
- `frontend/src/components/AppLayout.tsx`: exactly 5 `navigation-channel-chk` occurrences (L78, L146, L273, L300, L423); `Luồng hàng hải CHK` at L146 and L423.
- `frontend/src/pages/navigationchannelchk/`: 7 `NavigationChannelChk(List|Form)` matches; 12 CHK-theme (`themetokenchk`/`ThemeTokenProvider`/`THEME_SCOPE_CLASS`) matches across both files; dir contains exactly 2 files (list-verified); both pages bundled by the build as `dist/assets/NavigationChannelChkList-_ugn96fu.js` + `NavigationChannelChkForm-ax_UXdSu.js`.
- **Executed this session:** `npm run build` (cwd `frontend/`) → **exit 0**, vite v8.1.5, 4120 modules transformed, `✓ built in 1.16s` (only the pre-existing non-blocking chunk-size advisory on stderr).
- **Executed this session:** `git status --porcelain` + `git diff --name-only HEAD` → M-027 footprint confirmed: untracked `frontend/src/pages/navigationchannelchk/` (2 files) + modified `App.tsx`/`AppLayout.tsx`; ZERO entries under base `pages/navigationchannel/`, `tokens.ts`, `themetokenchk.ts`, `src/main/**`, `db/migration`, `PermissionSeeder.java`.
- **Executed this session:** `git diff frontend/src/theme.ts` → the modification is the M-024 CHK navy standardization (`sidebarBg #12468C→#1a3f83`, `chk-detail-label → #273e7c`), matching M-024's `qa/acceptance-map.json` AC-1..AC-3 evidence verbatim — concurrent pipeline work, not M-027 (M-027 marks `theme.ts` READ-ONLY).

## 6. Verdict

The acceptance oracle for M-027 is defined, anchored to verified source lines, AND validated by executed checks this session (AC-4 build exit 0; AC-5 git footprint + theme.ts attribution; AC-1..AC-3 grep anchors confirmed). Wave-2 executes the battery; this stage does not certify the implementation beyond the oracle's own validity.
