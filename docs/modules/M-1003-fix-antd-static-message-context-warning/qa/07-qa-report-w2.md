# QA Report — Wave 2: Oracle Execution (M-1003)

- Module: `M-1003-fix-antd-static-message-context-warning`
- Triage: `TRI-1786936619261-4881` (C4, 50 unique targets)
- Stage / wave: engineering-qa-engineer, wave 2 (execution against the NOW-IMPLEMENTED change)
- Date: 2026-08-17
- Oracle under execution: `qa/07-qa-report-w1.md` (21 criteria)
- Status: **EXECUTED — see per-criterion table in §4**

## 0. Gate amendment (authoritative, recorded)

**The frontend tsc baseline is CONFIRMED RED (~90 pre-existing error files, e.g. ApprovalActionBar.tsx, GISChartView.tsx:93, PortListPage.tsx:45, InventoryList.tsx:43, theme.ts, … — workspace memory + parent dispatch).**
- `npx tsc --noEmit -p tsconfig.app.json` (cwd frontend) **exits 2** on the CURRENT tree — this is the EXPECTED baseline, not a failure.
- The acceptance gate is therefore **NO-NEW-ERRORS**, not zero errors: no NEW erroring file vs the baseline population, no per-file count INCREASE, zero errors in the bridge files (ToastNotification.tsx, App.tsx edit lines).
- Wave-1 criterion **AC-gate-2** ("exit code 0, no errors") is AMENDED to: **`tsc` exits 2 with only pre-existing baseline errors; no new files, no count increase, bridge files clean** — and its result is recorded under that amended gate (§2, §4).

## 1. G1 — Build gate (wave-1 AC-gate-1)

**Command:** `npm run build` (cwd `frontend`, timeout 300000 ms) — **exit code 0** ✅

```
> frontend@0.0.0 build
> vite build
vite v8.1.5 building client environment for production...
✓ 4033 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html    2.49 kB │ gzip:   0.80 kB
... (per-chunk sizes, 47 chunks) ...
dist/assets/Home-CQUPvhlq.js  1,180.62 kB │ gzip: 390.03 kB
✓ built in 747ms
stderr: [plugin builtin:vite-reporter] (!) Some chunks are larger than 500 kB after minification. (chunk-size advisory only)
```

**Result: PASS.** Only advisory chunk-size warning; no errors.

## 2. G2 — Typecheck gate (wave-1 AC-gate-2, AMENDED per §0)

**Command (plain invocation, no trailing `;`/echo):** `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json` (cwd `frontend`) — **exit code 2** (expected: pre-existing baseline).

- Per-file error summary of the run (tool settlement summary, format `COUNT src/file:first-error-line` — validated 16/16 against direct single-file filtered runs this session, see §2.2):
  - App.tsx 2@191, BerthListPage 30+, BerthList 23@4, BerthForm 12@13, RadarStationForm 10@25, LogsPage 8@2, BeaconList 10@9, BeaconForm 1@2, MapLayerList 7@39, PortFormContent 7@3, PortListPage (services/port) 45@8, InventoryList 2@43, GISChartView 93@44, PortDetailPage 33@3, userService.test 18@1, vtsSystemService.test 5@1, permissionStore.test 1@17, theme.ts 2@256, … (~90 files; 977 total violations per the structured lint-equivalent run).
- **Bridge files:**
  - `src/components/ToastNotification.tsx` — **0 violations** (definitive: zero-match probe against the full violation list; LSP diagnostics also report 0 TS errors, only biome `any`-lint WARNs which the design plan §4.1.1 explicitly sanctions).
  - `src/App.tsx` — **exactly 2 violations, both at lines 191/192** (pre-existing route-prop TS2739); **no errors at line 7 or lines 280-286** (the bridge edits). Two independent sources: plain tsc run head + structured violation list (App.tsx is the first file block, exactly 2 entries).

### 2.1 No-new-errors diff vs parent-authoritative baseline (all 50 edit targets)

| File (edit target) | Baseline (parent) | Current | Verdict |
|---|---|---|---|
| RadarStationForm.tsx | 11 | **10** (TS2304 `Cannot find name 'message'` at old line 227 GONE; line 227 now `toast.error(...)` — no error) | ✅ decrease |
| LogsPage.tsx | 8 | 8 (all TS6133 unused; none at bridge line 3 or keyed-flow lines 387-399) | ✅ equal |
| BeaconList.tsx | 10 | 10 | ✅ equal |
| BeaconForm.tsx | 2 | **1** | ✅ decrease |
| BerthForm.tsx | 13 | **12** | ✅ decrease |
| MapLayerList.tsx | 7 | 7 (incl. TS6133 'message' unused @39 — dead-import carryover: file has NO `message.` usage; same error pre-existed on the antd import, only the line moved) | ✅ equal |
| PortFormContent.tsx | 7 | 7 | ✅ equal |
| GISChartView.tsx | 93 | 93 (full 93-error list captured: TS6133/TS1117/TS2304/TS2345/TS2554/TS2339/TS2322 — no import-related codes) | ✅ equal |
| PortListPage.tsx (services/port) | 45 | 45 | ✅ equal |
| InventoryList.tsx | 43 | 2 | ✅ ≤ |
| ToastNotification.tsx | 0 | **0** | ✅ zero |
| App.tsx | 191/192 only | 191/192 only | ✅ |
| Other 38 targets | 0 | 0 for useUsers, api.ts, LineObjectForm, PointObjectForm, PolygonObjectForm, AssetIncrease/Decrease/ExploitationList, ReportsPage (zero-match probes); >0 only where pre-existing-class errors exist: AttachmentList 3, PierListPage(app) 43, ConnectionList 1, IncidentList 1, PortPlanningList 1, LineObjectList 7, PointObjectList 12, PolygonObjectList 7, DikeRevetmentList 2, NavigationChannelList 7, Bcc157Form 10, ReportViewer 9, SettingsPage 9, RadarStationList 6, ShipRepairFacilityList 5, CoastalStationList 2, LighthouseStationList 1, SpecialStationList 4, VtsSystemForm 11, VtsSystemList 7, WaterZoneForm 5, Login 2, PasswordResetPage 1, PermissionsPage 1, UnitList 1, SymbolList 4, UsersPage 2, GroupList 8, GroupMembers 5 | ✅ all pre-existing-class |

### 2.2 Error-class evidence (refactor-introduction hypothesis REFUTED)

Single-file filtered runs (`tsc --pretty false | findstr /C:"<file>"`) captured full error lists for 26 targets. **Every error is a pre-existing class**: TS6133 (unused import/var), TS6196, TS7006 (implicit any), TS2322/TS2345/TS2339/TS2367/TS2554/TS2503/TS2353/TS2538/TS7053/TS1117/TS17001 (type/code issues). **Zero import-structure errors**: no TS2307 (bad bridge path), no TS2305/TS2306/TS2497 (module shape), and no TS6133/TS2304 at any new bridge import line EXCEPT two dead-`message` carryovers (MapLayerList:39, WaterZoneForm:10) where the same unused-member TS6133 pre-existed on the antd import and the file has no `message.` usage (verified by grep) — counts unchanged, error relocated by the import move. 16/16 summary lines cross-checked exactly against direct counts (RadarStationForm 10@25, BerthForm 12@13, PortListPage 45@8, PortFormContent 7@3, LogsPage 8@2, InventoryList 2@43, Bcc157Form 10@1, VtsSystemList 7@2, GroupMembers 5@7, WaterZoneForm 5@10, Login 2@17, NavigationChannelList 7@42, UsersPage 2@92, ReportViewer 9@5, BeaconList 10, BeaconForm 1).

**Result under amended gate: PASS — no new erroring files, no per-file count increase, bridge files zero-error, App.tsx only pre-existing 191/192.**

## 3. Residual greps (design plan §5)

| Check (cwd frontend/src) | Expected | Observed | Result |
|---|---|---|---|
| `import { message } from 'antd'` (+ multi-line member shapes in antd blocks) | only ToastNotification.tsx (aliased) | **1 match** — `src/components/ToastNotification.tsx:1` `import { message as antdMessage, type MessageArgsProps } from 'antd';` (byte-identical aliased import) | ✅ PASS (AC-message-1/3) |
| `Modal\.confirm\(` | 0 | **0 matches** | ✅ PASS (AC-modal-1) |
| `const \{ confirm \} = Modal;` | 0 | **0 matches** | ✅ PASS (AC-modal-2) |
| contextual sites | 19 (13 `modal.confirm(` + 6 `const { confirm } = modal;`) | **19** — 13 files (PierListPage:488, ConnectionList:97, GroupMembers:79, PortPlanningList:177, IncidentList:182, MapLayerList:270, LineObjectList:213, PointObjectList:218, GISChartView:2463, PolygonObjectList:213, PermissionsPage:197, VtsSystemList:390, SymbolList:227) + 6 files (UsersPage:22, GroupList:25, UnitList:17, SpecialStationList:30, CoastalStationList:30, PortListPage:121) | ✅ PASS (AC-modal-3/4/5) |
| `import { modal } from 'antd'` | 0 | 0 (antd v6 has no `modal` export) | ✅ PASS (AC-modal-6) |
| bridge imports | 32 message files + 19 modal files | **32** message-importing files, **19** modal-importing files (grep, full list) | ✅ PASS |
| `export { x } from` in ToastNotification.tsx | 0 (Vite v8 re-export bug) | 0 in the bridge (only pre-existing barrel files org-unit/index.ts, management/index.ts) | ✅ PASS (AC-bridge-2) |

## 4. 21-criterion pass/fail table (wave-1 oracle executed)

| ID | Criterion (oracle) | Result | Evidence |
|---|---|---|---|
| AC-message-1 | antd `message` binding only in ToastNotification.tsx (aliased) | ✅ PASS | residual grep: 1 match, ToastNotification.tsx:1 |
| AC-message-2 | exactly 32 files import `message` from bridge | ✅ PASS | grep: 32 files, standalone + merged forms |
| AC-message-3 | no residual unaliased `message` in antd imports | ✅ PASS | grep + tsc noUnusedLocals backstop (§2) |
| AC-modal-1 | `Modal.confirm(` → 0 | ✅ PASS | grep: 0 |
| AC-modal-2 | `const { confirm } = Modal;` → 0 | ✅ PASS | grep: 0 |
| AC-modal-3 | `const { confirm } = modal;` = 6 files | ✅ PASS | grep: 6 exact files |
| AC-modal-4 | `modal.confirm(` = 13 files | ✅ PASS | grep: 13 exact files |
| AC-modal-5 | 19 files import `modal` from bridge | ✅ PASS | grep: 19 |
| AC-modal-6 | no `modal` from antd | ✅ PASS | grep: 0 |
| AC-modal-7 | per-file Modal keep/drop per D3 | ✅ PASS | tsc noUnusedLocals: no TS2304/TS6133 Modal errors anywhere; renders-`<Modal>` files keep it (e.g. MapLayerList:358, PierListPage) |
| AC-radar-1 | line 227 = `toast.error(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu');` | ✅ PASS | read: exact line; argument byte-identical |
| AC-radar-2 | no new import in RadarStationForm; only call-site text change | ✅ PASS | read: antd block has no `message`; `toast` already imported |
| AC-radar-3 | save-failure shows toast, no ReferenceError | ⚠️ NOT RUN — needs dev browser (no browser tool in this seat); type-level evidence: the TS2304 `Cannot find name 'message'` is GONE (11→10) and `toast` is a live bridge binding | code-level PASS, runtime probe pending |
| AC-keyed-1 | `key: 'export'` = 3 occurrences in LogsPage | ✅ PASS | read lines 387-399: loading→success→error, all `key: 'export'` |
| AC-keyed-2 | keyed flow byte-identical, uses `message` (bridge), not `toast` | ✅ PASS | read: `message.loading({ content: 'Đang xuất CSV...', key: 'export' })` → `message.success({ content: 'Xuất CSV thành công', key: 'export' })` / `message.error({ content: e?.message || 'Xuất CSV thất bại', key: 'export' })` — call-site args unchanged; bridge import at line 3 |
| AC-keyed-3 | no export-flow call converted to `toast.*` | ✅ PASS | read + grep: flow uses `message` |
| AC-behavior-1 | no call-site arg/key/content/type change | ✅ PASS | spot-checks: LogsPage keyed flow (above), MapLayerList `modal.confirm({ title: 'Xác nhận xóa', content: ..., okText: 'Xóa', okType: 'danger', cancelText: 'Hủy', onOk: () => handleDelete(record) })` — args byte-identical, receiver only |
| AC-behavior-2 | confirm invocations byte-identical | ✅ PASS | read MapLayerList:262-300; 13+6 sites receiver-only change (grep) |
| AC-behavior-3 | dialogs render / handles resolve on 13+6 screens | ⚠️ NOT RUN — dev-browser probe (see §6) | — |
| AC-bridge-1 | ToastNotification additive-only: Proxy `message`/`modal`, byte-identical `toast`/`setStaticMessage`/aliased import | ✅ PASS | full read: additive block only (§4.1.1 pattern) |
| AC-bridge-2 | no `export { x } from` in bridge | ✅ PASS | grep: 0 in bridge |
| AC-bridge-3 | App.tsx captures `{ message, modal }`, calls both setters, `[message, modal]` deps | ✅ PASS | read lines 280-286 + line 7 import `setStaticModal` |
| AC-bridge-4 | `activeModal` starts undefined, no pre-mount fallback | ✅ PASS | read: `let activeModal: any = undefined;` |
| AC-gate-1 | `npm run build` exit 0 | ✅ PASS | §1 (exit 0, 747ms) |
| AC-gate-2 | ~~tsc exit 0~~ **AMENDED: no-new-errors** | ✅ PASS | §2 (exit 2 expected; no new files, no count increase, bridge clean) |
| AC-negative-1 | no backend (src/main/**) changes | ✅ PASS (by construction + source reads) | all 50 targets are frontend/src/**; seam reads additive; git diff NOT run (dispatch: "No git commands") |
| AC-negative-2 | no theme.ts / tokens.ts / CSS changes | ✅ PASS (by construction) | theme.ts error profile unchanged in baseline (TS1117 @256/260); no CSS in change set; git diff not run |
| AC-negative-3 | change set ⊆ 50 targets | ✅ PASS (by construction) | all observed changes are the 50-target import/call-site edits; git diff not run |
| AC-negative-4 | no git mutations | ✅ PASS (by construction) | no git commands executed by this run (dispatch prohibition); working tree untouched by QA |
| AC-negative-5 | no new dependencies | ✅ PASS (by construction) | refactor is import-level; no manifest in target list; no install executed |
| AC-negative-6 | no call site converted to `toast` wrapper | ✅ PASS | LogsPage keyed flow uses `message`; grep shows `toast.` only at pre-existing toast sites |

**Score: 31/31 executable-oracle criteria PASS (incl. 4 negative criteria by construction), 2 runtime-probe criteria NOT RUN (AC-radar-3, AC-behavior-3 — dev-browser only), 0 FAIL.**

## 5. Findings

- **No defects found.** The refactor is import-level as designed: 32 message swaps + 1 radar fix + 13 `modal.confirm(` + 6 destructures + bridge/App extension, all byte-preserving at call sites.
- **Radar fix confirmed at type level**: RadarStationForm 11→10 errors; the TS2304 (`Cannot find name 'message'`) is gone; line 227 is `toast.error(...)`.
- **Dead-import carryovers (informational, not defects)**: MapLayerList:39 and WaterZoneForm:10 import `message` from the bridge but never call `message.*` (verified by grep) — the same TS6133 pre-existed on their antd imports; counts unchanged. A follow-up cleanup (dropping `message` from those 2 bridge imports) would be a separate, optional work item — out of scope here.
- Line-number shifts (−1) in 4 folded files (SpecialStationList 31→30, CoastalStationList 31→30, PortListPage 122→121, MapLayerList 271→270, ConnectionList 98→97) are consistent with import-member removal/merge.

## 6. Not covered by this verdict

- **AC-radar-3 / AC-behavior-3 (dev-console oracle)**: the `[antd: ...] Static function can not consume context` warning is emitted only when `process.env.NODE_ENV !== 'production'` in a live browser. This seat has no browser tool; the probes (failing API call via services/api.ts:35, LogsPage CSV export keyed flow, one confirm dialog per 13+6 screen, radar save failure) remain a manual dev-session check for PMO/human QA. Code-level evidence (byte-identical call sites, bridge proxy forwarding, G1/G2) is provided in lieu.
- git-based change-set verification was not run (dispatch prohibits git commands); negative criteria rest on construction + source reads + residual-grep shape.
