# FE Dev WO-3 — confirm-swap cluster (modal-confirm-swap)

- Module: M-1003-fix-antd-static-message-context-warning
- Work order: WO-3 (design plan §4.3) — confirm-swap cluster, 15 files, disjoint from WO-2
- Stage: engineering-frontend-developer-wave-1 (wave 1)
- Type: behavior-preserving, frontend-only, import-level change
- Date: 2026-08-17

## Source delta (15 files, design plan §4.3 execution list)

### (a) 12 `Modal.confirm(` → `modal.confirm(` (call sites byte-identical)

PierListPage (488), ConnectionList (98), IncidentList (182), PortPlanningList (177), GISChartView (2463),
LineObjectList (213), PointObjectList (218), PolygonObjectList (213), GroupMembers (79), PermissionsPage (197),
SymbolList (227), VtsSystemList (390). All 12 now import `modal` from the bridge via the merged toast line:
`import toast, { modal } from '<bridge>';` (14 files use `'../../components/ToastNotification'`; UsersPage
and PermissionsPage — direct `src/pages/` children — use `'../components/ToastNotification'`).

### (b) 3 `const { confirm } = Modal;` → `const { confirm } = modal;`

UsersPage (22), GroupList (25), UnitList (17). `confirm(...)` call sites byte-identical; only the
destructure source changed. Same bridge-import merge as (a).

### (c) antd `Modal` keep/drop per §4.3 table (noUnusedLocals)

| File | Modal import action | Evidence |
|------|--------------------|----------|
| PierListPage | KEEP | renders `<Modal>` JSX (design plan: 959, 1447, 1608, 1821, 1852) |
| ConnectionList | DROP member line 14 | no `<Modal>` JSX |
| IncidentList | DROP `Modal, ` from line 2 | no `<Modal>` JSX |
| PortPlanningList | DROP `Modal, ` from line 2 | no `<Modal>` JSX |
| GISChartView | KEEP | `<Modal>` at 4068 |
| LineObjectList | KEEP | `<Modal>` at 296 |
| PointObjectList | KEEP | `<Modal>` at 301 |
| PolygonObjectList | KEEP | `<Modal>` at 296 |
| GroupMembers | DROP `Modal, ` from line 3 | no `<Modal>` JSX |
| PermissionsPage | DROP `Modal, ` from line 2 | no `<Modal>` JSX |
| SymbolList | KEEP | `<Modal>` at 362, 401 |
| VtsSystemList | KEEP | `<Modal>` at 791 |
| UsersPage | KEEP | `<Modal>` at 502 |
| GroupList | DROP `Modal, ` from line 2 | no `<Modal>` JSX |
| UnitList | DROP `Modal, ` from line 2 | no `<Modal>` JSX |

Never `import { modal } from 'antd'` (v6 has no named `modal` export — design plan §4.3 constraint);
`modal` always comes from the bridge (contextual `App.useApp().modal`, WO-1).

### Execution note

Design plan §4.3's merge rule says "UsersPage: `'../components/ToastNotification'`, others
`'../../components/ToastNotification'`". The first edit pass failed atomically on **PermissionsPage**
(NO_MATCH, retryable): its toast import is `'../components/ToastNotification'` (one level — PermissionsPage
is a direct `src/pages/` child, same path-depth rule as WO-2). Redone with the correct one-level path; the
other 14 files' two-level assumption was confirmed by successful matches. Memory topic
`m1003-bridge-relative-path-depth` updated to include PermissionsPage.

## Verification (executed, cwd `frontend/`)

| Gate | Command | Exit | Result |
|------|---------|------|--------|
| G1 build | `npm run build` | **0** | vite v8.1.5, 4033 modules, `✓ built in 653ms`; chunk-size advisory only |
| G2 typecheck | `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json` (plain invocation) | **2** | Pre-existing ~90-file baseline only; **zero NEW errors in the 15 changed files** (attribution below) |

### G2 attribution (zero new errors — evidence)

- Zero `Cannot find module '../components/ToastNotification'` / `'../../components/ToastNotification'`
  (exact-string searches, no matches) — no TS2307 on any bridge import.
- Zero `error TS2451` (duplicate identifier) in the full output.
- Per-file error counts (tsc summary tail), all 7 visible WO-3 files byte-identical to the WO-1 baseline:
  UsersPage 2@92, VtsSystemList 7@2, PermissionsPage 1@360, UnitList 1@39, GroupList 8@18, GroupMembers 5@7,
  SymbolList 4@15 — no count changed by the Modal drops or the confirm swaps.
- The 8 elided WO-3 files (PierListPage, ConnectionList, IncidentList, PortPlanningList, GISChartView,
  LineObjectList, PointObjectList, PolygonObjectList) all have errors, and ALL 8 are present in the WO-1
  baseline output (searched) — pre-existing.
- Residual-scan: zero `Modal.confirm(` / `const { confirm } = Modal` anywhere in `frontend/src` — all 19
  confirm sites app-wide (WO-2's 4 + WO-3's 15) now route through the bridge `modal`.

The exit-2 is the documented pre-existing workspace baseline (`frontend-tsc-baseline-red`); this seat's
write scope is the 15 files above, so the baseline cannot be repaired here.

## Acceptance criteria

| Criterion | Status | Evidence |
|-----------|--------|----------|
| 12 `Modal.confirm(` + 3 `const { confirm } = Modal` routed via bridge `modal`, call sites byte-identical | ✅ | edit diffs per file; residual grep zero app-wide; 15/15 `import toast, { modal }` verified |
| antd `Modal` kept/dropped correctly per noUnusedLocals | ✅ | keep/drop table above; tsc counts unchanged (no new TS6133/TS2304) |
| `npm run build` exit 0 | ✅ | executed, exit 0 |
| Zero NEW tsc errors in changed files | ✅ | attribution above; baseline exit-2 unchanged |

## Risks / notes

- No visual/browser observation — import-level refactor; no UI behavior change (contextual `App.useApp()`
  instances captured in WO-1, swapped after mount).
- Frontend package has no runnable test script (known workspace fact); G1/G2 are the gates.

## Durable evidence refs

- `docs/modules/M-1003-fix-antd-static-message-context-warning/design/00-design-plan.md` §4.3 (spec)
- 15 edited files under `frontend/src/` (§4.3 execution list)
- Executed gates: `npm run build` exit 0; tsc exit 2 with zero errors attributable to this delta

## Final verdict (per gate policy)

`npm run build` **exit 0**; tsc **exit 2** on the pre-existing ~90-file baseline with zero errors
attributable to this delta. The mandated tsc gate exits NON-ZERO, so the stage verdict is **Blocked**
(TSC_BASELINE_RED — same environmental blocker as WO-1/WO-2, outside this seat's write scope). Next
action: PMO waives the whole-project tsc gate on the isolation evidence (all three WO deltas type-clean,
build green), or dispatches a baseline-cleanup work order.
