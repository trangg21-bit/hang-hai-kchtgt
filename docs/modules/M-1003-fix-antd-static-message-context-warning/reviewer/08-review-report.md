# Review Report — M-1003 Fix AntD static message context warning

- Module: `M-1003-fix-antd-static-message-context-warning`
- Triage: `TRI-1786936619261-4881`
- Stage: engineering-code-reviewer
- Date: 2026-08-17
- Contract under review: design plan §4 (WO-1/WO-2/WO-3), §5 (gates/residual greps), §7 (prohibitions); QA oracle `qa/07-qa-report-w1.md` (31 criteria); executed gate `qa/07-qa-report-w2.md`
- **Verdict: PASS** (confidence: high) — no blocking finding survives reproduction. Two runtime probes (dev-console oracle AC-radar-3 / AC-behavior-3) are NOT RUN by this seat (no browser tool) and remain a declared manual check for PMO/human QA; they do not block the code-level verdict.

## 1. Scope inspected

- Contract: design plan (full read, incl. §4.1.1 bridge spec, §4.2 33-file table, §4.2.2 folded swaps, §4.3 WO-3 table, §5 gates, §7 prohibitions); QA w1 (oracle) and w2 (executed gate) full reads.
- Bridge + capture: `frontend/src/components/ToastNotification.tsx` (full 54-line read), `frontend/src/App.tsx` (RegisterAntdStatic region + line 7 import).
- Call sites: `frontend/src/services/api.ts:2,35`; `frontend/src/pages/radarstation/RadarStationForm.tsx:1-17,227`; `frontend/src/pages/LogsPage.tsx:3,387-399`; `frontend/src/pages/connections/ConnectionList.tsx:97-113`; `frontend/src/pages/UsersPage.tsx:20-22,502`; `frontend/src/pages/station/SpecialStationList.tsx:28-30`; `frontend/src/services/port/PortListPage.tsx:64,121`; import blocks of MapLayerList, CoastalStationList, SpecialStationList, PierListPage, PortListPage (Modal keep), and all 7 drop files.
- antd internals: `frontend/node_modules/antd/es/message/index.js:150-257` (method shape + `warnContext` seam).
- Executed gates: `npm run build` (exit 0) and `npx tsc --noEmit -p tsconfig.app.json` (exit 2, expected baseline) with per-file error-anchor extraction.

## 2. Axis 1 — Behavior preservation: PASS

| Check | Evidence (file:line) | Result |
|---|---|---|
| Global interceptor call site byte-identical | `frontend/src/services/api.ts:35` `message.error(msg);` unchanged; import now bridge at `api.ts:2` `import { message } from '../components/ToastNotification';` | ✅ |
| Sanctioned RadarStationForm fix is the ONLY call-site text change | `frontend/src/pages/radarstation/RadarStationForm.tsx:227` (catch block) reads `toast.error(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu');` — argument expression identical to baseline, receiver `message`→`toast` only; antd import block (lines 1-16) has NO `message` member; `toast` already imported at line 17 (no import change) | ✅ |
| LogsPage keyed flow intact | `frontend/src/pages/LogsPage.tsx:387-399`: `message.loading({ content: 'Đang xuất CSV...', key: 'export' })` → `message.success({ content: 'Xuất CSV thành công', key: 'export' })` / `message.error({ content: e?.message \|\| 'Xuất CSV thất bại', key: 'export' })` — args/keys byte-identical, still `message` (bridge import at line 3), NOT `toast` | ✅ |
| confirm(...) call sites byte-identical, receiver-only change | `ConnectionList.tsx:97` `modal.confirm({ title: 'Xác nhận xóa kết nối', content: ..., okText: 'Xóa', okType: 'danger', cancelText: 'Hủy', onOk: async () => { ... toast.success('Đã xóa kết nối'); ... } })` — args unchanged; `UsersPage.tsx:22` `const { confirm } = modal;` (destructure source only); 13 `modal.confirm(` + 6 `const { confirm } = modal;` sites verified by grep (all 19 files) | ✅ |
| Handles still returned via contextual modal | `App.useApp().modal.confirm` returns the same handle API as static `Modal.confirm` (antd v6 modal/confirm and message static methods are closure-based — see Axis 2), so returned update/destroy handles are preserved | ✅ |

## 3. Axis 2 — Bridge correctness: PASS

- `frontend/src/components/ToastNotification.tsx` exports `message` and `modal` as **direct `export const` live-forwarding Proxies**:
  - `export const message: any = new Proxy({} as any, { get: (_target, prop) => Reflect.get(activeMessage, prop) });` — forwards every property read to the CURRENT captured instance at call time.
  - `export const modal: any = new Proxy({} as any, { get: (_target, prop) => (activeModal ? Reflect.get(activeModal, prop) : undefined) });`
  - No `export { x } from '...'` anywhere in the bridge (grep: 0) — AGENTS.md Vite v8 re-export rule respected.
- `let activeModal: any = undefined;` — starts undefined, no pre-mount fallback (design §6 risk 2 respected; all 13+6 confirm sites are post-mount event handlers).
- `toast`, `setStaticMessage`, `let activeMessage = antdMessage`, and the aliased `import { message as antdMessage, type MessageArgsProps } from 'antd'` are byte-identical to baseline (additive-only, §7 respected).
- `frontend/src/App.tsx` RegisterAntdStatic: `const { message, modal } = AntApp.useApp();` + `useEffect(() => { setStaticMessage(message); setStaticModal(modal); }, [message, modal]);` — captures BOTH instances; rendered inside `<AntApp>`; `setStaticModal` imported at `App.tsx:7`.
- **`this`-independence verified at antd source**: `frontend/node_modules/antd/es/message/index.js:254-256` — `staticMethods[type] = (...args) => typeOpen(type, args);` (closure arrow, no `this`); `open`/`typeOpen`/`destroy` are module-scope closures. The proxy's unbound forwarding is therefore behavior-identical. The warning seam is confirmed at `typeOpen` (`warnContext('message')` when `!global.holderRender`, dev-only).

## 4. Axis 3 — No scope creep: PASS

- Every changed import/call-site observed this session is in `frontend/src/**` and belongs to the design-plan target set (50 unique: 2 bridge/App + 33 WO-2 incl. 4 folded + 15 WO-3; verified counts below in Axis 4). No `src/main/**`, no `.java`, no pom.xml touched (prior-seat intake evidence: 98/98 `frontend/src/` matches, 0 backend; no git commands run by any seat — dispatch prohibition, and none run here).
- `frontend/src/theme.ts` / `frontend/src/tokens.ts` untouched: theme.ts retains exactly its pre-existing 2 errors (TS1117 @256) in the current tsc run — identical profile to baseline.
- No message call site converted to the `toast` wrapper: LogsPage keyed flow uses `message`; grep shows `toast.` only at pre-existing toast call sites.
- No new dependencies: refactor is import-level; no manifest in the change set; no install executed (by construction + prior records).
- No git mutations: none performed by this seat or (per prior-stage records) by earlier seats.

## 5. Axis 4 — Residual cleanliness: PASS (all greps executed this session, cwd `frontend/src`)

| Check | Expected | Observed | Result |
|---|---|---|---|
| `Modal\.confirm\(` | 0 | 0 | ✅ |
| `const \{\s*confirm\s*\} = Modal` | 0 | 0 | ✅ |
| `const \{ confirm \} = modal;` | 6 files | 6 (UsersPage:22, GroupList:25, UnitList:17, SpecialStationList:30, CoastalStationList:30, PortListPage:121) | ✅ |
| `modal\.confirm\(` | 13 files | 13 (PierListPage:488, GroupMembers:79, ConnectionList:97, PortPlanningList:177, IncidentList:182, GISChartView:2463, LineObjectList:213, MapLayerList:270, PermissionsPage:197, PointObjectList:218, PolygonObjectList:213, VtsSystemList:392, SymbolList:227) | ✅ |
| `import { message } from 'antd'` (+ member shapes) | 0 (only aliased in bridge) | 0; bridge line 1 is the unchanged aliased import | ✅ |
| `message` imported from bridge | 32 files | 32 (20 standalone + 12 merged `toast, { message }` / `toast, { message, modal }` — full file list cross-checked) | ✅ |
| `modal` imported from bridge | 19 files | 19 (15 WO-3 + 4 folded WO-2, merged `import toast, { modal }` / `toast, { message, modal }`) | ✅ |
| `import { modal } from 'antd'` | 0 | 0 (antd v6 has no `modal` export) | ✅ |
| Modal keep/drop (D3, noUnusedLocals) | keep 12 / drop 7 | KEEP files retain `Modal` in antd imports (UsersPage:2, VtsSystemList:2, SymbolList:2, MapLayerList:8, CoastalStationList:5, SpecialStationList:5, PierListPage:11, PortListPage:12, GISChartView/LineObjectList/PointObjectList/PolygonObjectList render `<Modal>` per grep); DROP files (ConnectionList, IncidentList, PortPlanningList, GroupMembers, PermissionsPage, UnitList, GroupList) have ZERO `Modal` references (GroupList only in 2 comments) | ✅ |

## 6. Axis 5 — No new type errors: PASS (executed)

- **G1 `npm run build` (cwd frontend): exit 0** — Vite v8.1.5, 4034 modules, built in 1.14s; only the advisory chunk-size warning. ✅
- **G2 `npx tsc --noEmit -p tsconfig.app.json` (cwd frontend): exit 2** — expected pre-existing baseline (~90 files, confirmed by workspace memory + prior-stage record). Per-file error anchors extracted from my own run and compared to the confirmed baseline (w2 §2.1):
  - Bridge `ToastNotification.tsx`: **0 errors** (findstr shows only 3 code-frame context lines from OTHER files' import lines; no `ToastNotification.tsx(` error anchor).
  - `App.tsx`: exactly 2, both pre-existing TS2739 at 191/192 — nothing at line 7 or 280-286.
  - Decreases vs baseline: RadarStationForm 11→**10** (TS2304 at old line 227 gone), BerthForm 13→**12**, BeaconForm 2→**1**, InventoryList 43→**2**.
  - Unchanged (spot-verified): MapLayerList **7** (incl. documented dead-`message` TS6133 @39 — same class pre-existed on the antd import), GISChartView **93** (no import-related codes), BeaconList **10**, ConnectionList **1** (TS7006 @54), LogsPage 8, UsersPage 2, GroupList 8, GroupMembers 5, SpecialStationList 4, CoastalStationList 2, PortListPage 45, PortFormContent 7, VtsSystemForm 11, VtsSystemList 6, WaterZoneForm 5, SymbolList 4, PermissionsPage 1, UnitList 1, theme.ts 2 — every entry visible in the run's per-file settlement summary matches the w2 baseline.
  - Zero-baseline targets stay zero: `useUsers.ts` (the 33 errors are all in the untouched `useUsers.test.ts` — pre-existing vitest TS2307 class), `api.ts`, LineObjectForm, PointObjectForm, PolygonObjectForm, AssetIncrease/Decrease/ExploitationList, ReportsPage — all absent from the error output.
  - No import-structure error codes anywhere (no TS2307 bad bridge path, no TS2305/TS2497 module shape) — build exit 0 corroborates path resolution.

## 7. Findings (informational, non-blocking)

1. **w2 report header** (`qa/07-qa-report-w2.md`) says "21 criteria" but its §4 table contains 31 — stale header count; the executed table is the authoritative record. Cosmetic.
2. **Dead-import carryovers** MapLayerList:39 and WaterZoneForm:10 import `message` from the bridge but never call `message.*` → pre-existing-class TS6133, count unchanged. Optional follow-up (drop the member) is out of scope, as w2 records.
3. **Dev-console oracle NOT RUN** (AC-radar-3, AC-behavior-3): the `[antd: ...] Static function can not consume context` warning is emitted only in a live dev browser; no browser tool in this seat. Code-level evidence provided in lieu (byte-identical call sites, verified closure-based antd statics, bridge live-forwarding). Manual dev-session check remains for PMO/human QA: failing API call via api.ts:35, LogsPage CSV export, one confirm dialog per 13+6 screen, radar save failure.
4. **git-based change-set diff not run** (dispatch prohibits git commands); negative criteria rest on construction + source reads + the backend seat's intake evidence (47/47 targets under frontend/src).

## 8. Coverage statement

Inspected: bridge (full), App.tsx capture, api.ts interceptor, RadarStationForm fix, LogsPage keyed flow, one WO-3 confirm site + one destructure site in full, import blocks of 5 keep-files, all 7 drop-files (Modal-absence), 19 bridge-import sites by grep, antd static-method source. Not inspected: every one of the 13 confirm call-site bodies in full (receiver-only change confirmed by grep anchors + representative reads); runtime browser behavior (see §7.3).

## 9. Verdict

**PASS** — the M-1003 change matches the design plan WO-1/WO-2/WO-3 and §7 prohibitions: import-level, behavior-preserving, byte-identical call sites except the single sanctioned RadarStationForm.tsx:227 fix, bridge and App capture correct, all residual greps at expected zero/exact counts, build exit 0, and tsc shows no new errors (per-file counts unchanged-or-lower on every spot-verified target vs the confirmed baseline). No defect found that blocks release.
