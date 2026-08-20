# Design Plan — Fix AntD v6 "Static function can not consume context" warning (M-1003)

- Module: `M-1003-fix-antd-static-message-context-warning`
- Triage: `TRI-1786936619261-4881` (C4, 2 write-scope clusters, blast_radius 47)
- Footprint: 47 triage edit-target files + 3 PMO-directed additions (UsersPage, GroupList, UnitList) = **50 unique files** (PMO decision 2026-08-17 — app-wide zero-warning goal; see §6)
- Stage: engineering-solution-designer
- Type: behavior-preserving, frontend-only refactor (no backend, no UI/theme changes)

## 1. Objective

Eliminate the AntD v6 dev-only console warning

```
[antd: message] Static function can not consume context like dynamic theme. Please use 'App' component instead.
```

app-wide by routing every static `message.*` call, every static `Modal.confirm(...)` call, and every `const { confirm } = Modal;` static destructure through the existing context bridge `frontend/src/components/ToastNotification.tsx`, which holds the contextual `App.useApp()` instances. The warning emitter is `frontend/node_modules/antd/es/config-provider/index.js:41` (`warnContext`, fired only when `process.env.NODE_ENV !== 'production'`), invoked from static `message/index.js:204` and `modal/confirm.js:47` (triage seam claim). The refactor is strictly import-level: **all call sites stay byte-identical**.

## 2. Current seam (verified this session)

| # | Anchor | Evidence |
|---|--------|----------|
| 1 | `frontend/src/components/ToastNotification.tsx:14` | `export const setStaticMessage = (msgInstance: any) => { activeMessage = msgInstance; };` — existing bridge swaps module-level `activeMessage` (initialized to static `antdMessage`, line 13) to the contextual instance after mount. |
| 2 | `frontend/src/App.tsx:280-286` | `function RegisterAntdStatic() { const { message } = AntApp.useApp(); useEffect(() => { setStaticMessage(message); }, [message]); return null; }` — capture point rendered inside `<AntApp>` (line 268-269). Imports `setStaticMessage` at `App.tsx:7`. |
| 3 | `frontend/src/services/api.ts:35` | `message.error(msg);` — global axios response interceptor; the most frequent warning trigger. |
| 4 | `frontend/src/pages/radarstation/RadarStationForm.tsx:227` | `message.error(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu');` — latent ReferenceError: `message` is NOT imported in this file; only `toast` (line 17) and an antd import block without `message` (lines 3-15). |
| 5 | `frontend/src/pages/LogsPage.tsx:387-399` | `message.loading({ content: 'Đang xuất CSV...', key: 'export' })` → `message.success({ content: ..., key: 'export' })` / `message.error({ content: ..., key: 'export' })` — keyed loading→success flow. This is the reason the `toast` wrapper is unusable for this refactor (it only accepts `(msg: string, duration?)`). |
| 6 | `frontend/node_modules/antd/es/index.d.ts:82-85` | antd v6 exports `message` (named, static) and `Modal` (named, static) — but **NO named `modal` export**. The contextual modal instance comes exclusively from `App.useApp().modal`. |
| 7 | `frontend/package.json:17` | `"antd": "^6.4.4"` — v6 confirmed. |
| 8 | `frontend/src/pages/UsersPage.tsx:22`, `pages/groups/GroupList.tsx:25`, `pages/organizations/UnitList.tsx:17`, `pages/station/SpecialStationList.tsx:31`, `pages/station/CoastalStationList.tsx:31`, `services/port/PortListPage.tsx:122` | `const { confirm } = Modal;` — six static-destructure sites (grep-verified); same dev-only warning when `confirm(...)` fires. PMO decision brings all six in scope. |

## 3. Design decisions

| Decision | Choice | Rationale / rejected alternatives |
|----------|--------|-----------------------------------|
| D1 — Bridge export mechanism | `message` / `modal` exported as **live-forwarding Proxy** consts whose `get` trap reads the current `activeMessage` / `activeModal` at call time | The contextual instance only exists after `RegisterAntdStatic`'s effect runs post-mount; a static snapshot export would silently keep the static antd instance (warning persists). Rejected: re-export `export { message } from 'antd'` (keeps the static instance AND triggers the AGENTS.md Vite dev-mode re-export `ReferenceError` rule); rejected: `export let message = ...` with reassignment (callers would need to re-import; Proxy keeps the module binding stable). |
| D2 — Import strategy per consumer | Remove the `message` (resp. `modal`) member from the `'antd'` import and take it from the bridge; **merge into the file's existing ToastNotification import when one exists** (`import toast, { message } from ...`), otherwise add a new import line directly after the modified antd import | Single import per module (no duplicate module specifiers); `noUnusedLocals: true` (`frontend/tsconfig.app.json`) makes leaving a now-unused antd member a **tsc failure**, so removal is mandatory, not cosmetic. |
| D3 — WO-3 Modal import handling | Files that also render `<Modal>` JSX **keep** `Modal` in the antd import; files whose only `Modal` use is `Modal.confirm(` or the `const { confirm } = Modal;` destructure **drop** `Modal` from the antd import | `noUnusedLocals` fails on a kept-but-unused `Modal`. Verified per file against a `<Modal` JSX census (see WO-3 table). |
| D4 — Sequencing | WO-1 (bridge) first; WO-2 and WO-3 are two disjoint clusters sharing only the bridge as dependency, plus one overlap file (MapLayerList) needing both edits | A consumer cannot import `message`/`modal` from the bridge before WO-1 ships them. WO-2 and WO-3 are independent of each other (different members, different call sites). |
| D5 — RadarStationForm latent bug | `RadarStationForm.tsx:227` `message.error(...)` → `toast.error(...)` (same argument expression) | `message` is not imported there; `toast` already is (line 17). This is the ONLY call-site text change in the entire refactor. |
| D6 — Disjoint write scopes (PMO decision) | The 4 files carrying BOTH a message-swap and a confirm-swap (MapLayerList, SpecialStationList, CoastalStationList, PortListPage) get their confirm swap **folded into WO-2** (§4.2.2); WO-3 handles the remaining 15 confirm-swap files | Keeps WO-2 ∩ WO-3 = ∅ so the two clusters can be dispatched in parallel without file contention. 2 + 33 + 15 = 50 unique targets. |

## 4. Work orders

### WO-1 — Bridge extension (SEQUENCED FIRST; shared by both clusters) — 2 files

**Files:** `frontend/src/components/ToastNotification.tsx`, `frontend/src/App.tsx`

**4.1.1 `frontend/src/components/ToastNotification.tsx`** — keep `toast`, `setStaticMessage`, `activeMessage = antdMessage`, the antd import (`message as antdMessage`) **byte-identical**. Add:

```ts
// NEW — modal capture (mirrors setStaticMessage)
let activeModal: any = undefined;

export const setStaticModal = (modalInstance: any) => {
  activeModal = modalInstance;
};

// NEW — live-forwarding proxies over the captured contextual instances.
// Every property access forwards to the CURRENT captured instance at call time,
// so the App.useApp() instances registered after mount take effect immediately.
export const message: any = new Proxy({} as any, {
  get: (_target, prop) => Reflect.get(activeMessage, prop),
});

export const modal: any = new Proxy({} as any, {
  get: (_target, prop) => (activeModal ? Reflect.get(activeModal, prop) : undefined),
});
```

Constraints:
- Use direct `export const` declarations — **never** `export { x } from '...'` (AGENTS.md Vite v8 dev-mode re-export bug).
- No name collisions: file-internal identifiers are `antdMessage`, `activeMessage`, `toast`, `setStaticMessage`, `typeMap`; none conflict with the new `message` / `modal` / `activeModal` / `setStaticModal`.
- `activeModal` starts `undefined`; every `modal.confirm` call site in the codebase is inside a user-event handler (post-mount), so the capture always precedes use. Do NOT add a pre-mount fallback to `activeModal` — antd v6 has no static `modal` export to fall back to, and none is needed.
- Do not add `type` annotations beyond `any` (consistent with the existing `setStaticMessage`).

**4.1.2 `frontend/src/App.tsx`**
- Line 7: `import { setStaticMessage } from './components/ToastNotification';` → `import { setStaticMessage, setStaticModal } from './components/ToastNotification';`
- `RegisterAntdStatic` (lines 280-286) becomes:

```tsx
function RegisterAntdStatic() {
  const { message, modal } = AntApp.useApp();
  useEffect(() => {
    setStaticMessage(message);
    setStaticModal(modal);
  }, [message, modal]);
  return null;
}
```

**WO-1 gate:** `npm run build` + `npx tsc --noEmit -p tsconfig.app.json` (cwd `frontend`). No consumer imports the new exports yet, so this gate isolates the bridge itself.

### WO-2 — message-swap cluster — 33 files (+ 4 folded confirm swaps, §4.2.2)

**Transformation rule (32 files):** swap every `message` import from `'antd'` to the bridge `frontend/src/components/ToastNotification.tsx`, per import shape:

| Shape | Example | Edit |
|-------|---------|------|
| SOLO (sole member) | `import { message } from 'antd';` (`useUsers.ts:2`, `api.ts:2`) | Replace the whole line with `import { message } from '<bridge>';` |
| S (single-line member) | `import { Form, Input, Button, message, Alert } from 'antd';` | Remove the `message` member (with its trailing/leading comma) from the line; add the bridge import |
| M (own-line member in multi-line block) | `  message,` inside `import { ... } from 'antd';` | Delete the member line; keep the rest of the block |
| I (inline-continuation member) | `  Button, Upload, Space, DatePicker, Table, message,` (`BerthForm.tsx:5`, `PortFormContent.tsx:3`) | Strip `, message` from the continuation line |

Bridge import placement (D2): if the file already imports from the bridge (`import toast from '<bridge>'`), merge — `import toast, { message } from '<bridge>';`; otherwise add a new line `import { message } from '<bridge>';` immediately after the modified `'antd'` import statement.

Bridge relative path: `components/shared/*` → `'../ToastNotification'`; `hooks/*` and `services/*` (api.ts) → `'../components/ToastNotification'`; everything else (`pages/**/*`, `services/port/*`, `app/**/*`) → `'../../components/ToastNotification'`.

**Call sites: keep byte-identical — including the LogsPage keyed flow (`LogsPage.tsx:387-399`: `message.loading({... key:'export'})` → `message.success/error({... key:'export'})`). Do NOT rewrite any call to the `toast` wrapper.**

**RadarStationForm latent fix (1 file, the only call-site text change in the refactor):** `frontend/src/pages/radarstation/RadarStationForm.tsx:227` — `message.error(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu');` → `toast.error(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu');` (`toast` already imported at line 17; no import change).

**File list (33):**

| # | File | Import shape | Bridge import |
|---|------|--------------|---------------|
| 1 | `frontend/src/hooks/useUsers.ts` | SOLO | replace line → `'../components/ToastNotification'` |
| 2 | `frontend/src/services/api.ts` | SOLO | replace line → `'../components/ToastNotification'` |
| 3 | `frontend/src/components/shared/AttachmentList.tsx` | S | new line → `'../ToastNotification'` |
| 4 | `frontend/src/pages/beacons/BeaconForm.tsx` | S | merge into toast import (line 14) |
| 5 | `frontend/src/pages/gis/LineObjectForm.tsx` | S | merge (line 9) |
| 6 | `frontend/src/pages/gis/PointObjectForm.tsx` | S | merge (line 9) |
| 7 | `frontend/src/pages/gis/PolygonObjectForm.tsx` | S | merge (line 9) |
| 8 | `frontend/src/pages/LogsPage.tsx` | S | new line |
| 9 | `frontend/src/pages/Login.tsx` | S | new line |
| 10 | `frontend/src/pages/PasswordResetPage.tsx` | S | new line |
| 11 | `frontend/src/pages/port/WaterZoneForm.tsx` | S | merge (line 10) |
| 12 | `frontend/src/pages/assetmovement/AssetDecreaseList.tsx` | M | new line |
| 13 | `frontend/src/pages/assetmovement/AssetExploitationList.tsx` | M | new line |
| 14 | `frontend/src/pages/assetmovement/AssetIncreaseList.tsx` | M | new line |
| 15 | `frontend/src/pages/assetmovement/InventoryList.tsx` | M | new line |
| 16 | `frontend/src/pages/beacons/BeaconList.tsx` | M | merge (line 46) |
| 17 | `frontend/src/pages/dikerevetment/DikeRevetmentList.tsx` | M | new line |
| 18 | `frontend/src/pages/gis/MapLayerList.tsx` | M | merge (line 40) — **+ folded `Modal.confirm(` swap (§4.2.2)** |
| 19 | `frontend/src/pages/navigationchannel/NavigationChannelList.tsx` | M | new line |
| 20 | `frontend/src/pages/radarstation/RadarStationList.tsx` | M | new line |
| 21 | `frontend/src/pages/reports/Bcc157Form.tsx` | M | new line |
| 22 | `frontend/src/pages/reports/ReportViewer.tsx` | M | new line |
| 23 | `frontend/src/pages/ReportsPage.tsx` | M | new line |
| 24 | `frontend/src/pages/SettingsPage.tsx` | M | new line |
| 25 | `frontend/src/pages/shiprepair/ShipRepairFacilityList.tsx` | M | new line |
| 26 | `frontend/src/pages/station/CoastalStationList.tsx` | M | merge (line 29) — **+ folded confirm destructure swap (§4.2.2)** |
| 27 | `frontend/src/pages/station/LighthouseStationList.tsx` | M | new line |
| 28 | `frontend/src/pages/station/SpecialStationList.tsx` | M | merge (line 29) — **+ folded confirm destructure swap (§4.2.2)** |
| 29 | `frontend/src/pages/vtssystem/VtsSystemForm.tsx` | M | merge (line 26) |
| 30 | `frontend/src/services/port/PortListPage.tsx` | M | merge (line 65) — **+ folded confirm destructure swap (§4.2.2)** |
| 31 | `frontend/src/pages/port/BerthForm.tsx` | I | merge (line 20) |
| 32 | `frontend/src/services/port/PortFormContent.tsx` | I | new line |
| 33 | `frontend/src/pages/radarstation/RadarStationForm.tsx` | (no message import) | line 227 → `toast.error(...)`; no import change |

Import-shape assignment is verified against the current sources; the developer must still open each file before editing.

**4.2.2 Folded confirm swaps (4 files, D6 — PMO decision):** files in BOTH the message cluster and the confirm-swap universe; their confirm swap executes HERE so WO-2/WO-3 write scopes stay disjoint:

| File | Confirm site | Rule |
|---|---|---|
| `frontend/src/pages/gis/MapLayerList.tsx` | `Modal.confirm(` (271) | → `modal.confirm(`; toast import (line 40) → `import toast, { message, modal } from '../../components/ToastNotification';`; KEEP `Modal` (renders `<Modal>` at 358) |
| `frontend/src/pages/station/SpecialStationList.tsx` | `const { confirm } = Modal;` (31) | → `const { confirm } = modal;`; toast import (line 29) → `import toast, { message, modal } from '../../components/ToastNotification';`; KEEP `Modal` (renders `<Modal>` at 277) |
| `frontend/src/pages/station/CoastalStationList.tsx` | `const { confirm } = Modal;` (31) | → `const { confirm } = modal;`; toast import (line 29) → `import toast, { message, modal } from '../../components/ToastNotification';`; KEEP `Modal` (renders `<Modal>` at 278) |
| `frontend/src/services/port/PortListPage.tsx` | `const { confirm } = Modal;` (122) | → `const { confirm } = modal;`; toast import (line 65) → `import toast, { message, modal } from '../../components/ToastNotification';`; KEEP `Modal` (renders `<Modal>` at 3399+) |

The `confirm(...)` call sites stay byte-identical — only the destructure/static-call source changes from `Modal` to the contextual `modal`.

### WO-3 — confirm-swap cluster — 15 files (disjoint from WO-2)

**Transformation rules:**
1. `Modal.confirm(` → `modal.confirm(` (all occurrences; currently 1 per file).
2. `const { confirm } = Modal;` → `const { confirm } = modal;` — the `confirm(...)` call sites stay byte-identical; only the destructure source changes.
3. Import `modal` from the bridge. All 15 WO-3 files already import `toast` from the bridge → **merge** into that existing line: `import toast, { modal } from '../../components/ToastNotification';` (UsersPage: `'../components/ToastNotification'`). Verified toast-import anchors (grep, this session): `PierListPage.tsx:44`, `ConnectionList.tsx:36`, `IncidentList.tsx:18`, `PortPlanningList.tsx:19`, `GISChartView.tsx:49`, `LineObjectList.tsx:31`, `PointObjectList.tsx:33`, `PolygonObjectList.tsx:31`, `GroupMembers.tsx:14`, `PermissionsPage.tsx:28`, `SymbolList.tsx:13`, `VtsSystemList.tsx:25`, `UsersPage.tsx:20`, `GroupList.tsx:20`, `UnitList.tsx:12`.
4. Modal import handling (D3, `noUnusedLocals`): KEEP `Modal` where the file renders `<Modal>` JSX; DROP it where `Modal.confirm(` / the destructure was the only use.

**Constraint:** antd v6 has NO named `modal` export (verified: `frontend/node_modules/antd/es/index.d.ts:82-85` — direct read shows the export run `Menu` → `message` → `Modal` → `notification`, no `modal`); the `modal` identifier MUST come from the bridge (contextual `App.useApp().modal`, captured in WO-1). Never `import { modal } from 'antd'` — it does not exist and tsc will fail.

**Full confirm-swap reference table (all 19 sites):**

| # | File | Confirm site | Handled in | Renders `<Modal>` JSX? | Modal import action |
|---|------|--------------|------------|------------------------|---------------------|
| 1 | `frontend/src/app/pier/PierListPage.tsx` | `Modal.confirm(` (488) | **WO-3** | YES (959, 1447, 1608, 1821, 1852) | keep |
| 2 | `frontend/src/pages/connections/ConnectionList.tsx` | `Modal.confirm(` (98) | **WO-3** | NO | drop (member line 14) |
| 3 | `frontend/src/pages/document/IncidentList.tsx` | `Modal.confirm(` (182) | **WO-3** | NO | drop (single-line) |
| 4 | `frontend/src/pages/document/PortPlanningList.tsx` | `Modal.confirm(` (177) | **WO-3** | NO | drop (single-line) |
| 5 | `frontend/src/pages/gis/GISChartView.tsx` | `Modal.confirm(` (2463) | **WO-3** | YES (4068) | keep |
| 6 | `frontend/src/pages/gis/LineObjectList.tsx` | `Modal.confirm(` (213) | **WO-3** | YES (296) | keep |
| 7 | `frontend/src/pages/gis/MapLayerList.tsx` | `Modal.confirm(` (271) | **WO-2** (§4.2.2) | YES (358) | keep |
| 8 | `frontend/src/pages/gis/PointObjectList.tsx` | `Modal.confirm(` (218) | **WO-3** | YES (301) | keep |
| 9 | `frontend/src/pages/gis/PolygonObjectList.tsx` | `Modal.confirm(` (213) | **WO-3** | YES (296) | keep |
| 10 | `frontend/src/pages/groups/GroupMembers.tsx` | `Modal.confirm(` (79) | **WO-3** | NO | drop (single-line) |
| 11 | `frontend/src/pages/PermissionsPage.tsx` | `Modal.confirm(` (197) | **WO-3** | NO | drop (single-line) |
| 12 | `frontend/src/pages/symbols/SymbolList.tsx` | `Modal.confirm(` (227) | **WO-3** | YES (362, 401) | keep |
| 13 | `frontend/src/pages/vtssystem/VtsSystemList.tsx` | `Modal.confirm(` (390) | **WO-3** | YES (791) | keep |
| 14 | `frontend/src/pages/UsersPage.tsx` | `const { confirm } = Modal;` (22) | **WO-3** | YES (502) | keep |
| 15 | `frontend/src/pages/groups/GroupList.tsx` | `const { confirm } = Modal;` (25) | **WO-3** | NO | drop (single-line, import line 2) |
| 16 | `frontend/src/pages/organizations/UnitList.tsx` | `const { confirm } = Modal;` (17) | **WO-3** | NO | drop (single-line, import line 2) |
| 17 | `frontend/src/pages/station/SpecialStationList.tsx` | `const { confirm } = Modal;` (31) | **WO-2** (§4.2.2) | YES (277) | keep |
| 18 | `frontend/src/pages/station/CoastalStationList.tsx` | `const { confirm } = Modal;` (31) | **WO-2** (§4.2.2) | YES (278) | keep |
| 19 | `frontend/src/services/port/PortListPage.tsx` | `const { confirm } = Modal;` (122) | **WO-2** (§4.2.2) | YES (3399+) | keep |

**Per-file destructure rules (all 6 `const { confirm } = Modal;` files):**

| File | Edit | Modal import action |
|------|------|---------------------|
| `frontend/src/pages/UsersPage.tsx` | line 22 → `const { confirm } = modal;`; toast import (line 20) → `import toast, { modal } from '../components/ToastNotification';` | keep (renders `<Modal>` at 502) |
| `frontend/src/pages/groups/GroupList.tsx` | line 25 → `const { confirm } = modal;`; toast import (line 20) → `import toast, { modal } from '../../components/ToastNotification';` | drop `Modal, ` from antd import line 2 |
| `frontend/src/pages/organizations/UnitList.tsx` | line 17 → `const { confirm } = modal;`; toast import (line 12) → `import toast, { modal } from '../../components/ToastNotification';` | drop `Modal, ` from antd import line 2 |
| `frontend/src/pages/station/SpecialStationList.tsx` | line 31 → `const { confirm } = modal;` (**executed in WO-2**, §4.2.2) | keep (renders `<Modal>` at 277) |
| `frontend/src/pages/station/CoastalStationList.tsx` | line 31 → `const { confirm } = modal;` (**executed in WO-2**, §4.2.2) | keep (renders `<Modal>` at 278) |
| `frontend/src/services/port/PortListPage.tsx` | line 122 → `const { confirm } = modal;` (**executed in WO-2**, §4.2.2) | keep (renders `<Modal>` at 3399+) |

**WO-3 execution list (15 files):** PierListPage, ConnectionList, IncidentList, PortPlanningList, GISChartView, LineObjectList, PointObjectList, PolygonObjectList, GroupMembers, PermissionsPage, SymbolList, VtsSystemList, UsersPage, GroupList, UnitList.

## 5. Verification gates & residual checks

Run from `frontend/` (both commands per triage record):

| # | Command | When | Purpose |
|---|---------|------|---------|
| G1 | `npm run build` (timeout 300000 ms) | after WO-1, after WO-2, after WO-3, final | Vite production build passes |
| G2 | `npx tsc --noEmit -p tsconfig.app.json` (timeout 180000 ms) | same points | Typecheck passes; catches unused-import violations (`noUnusedLocals`) and any bad import path |

**Residual greps (final, after WO-3):**

| Check | Expected result |
|-------|-----------------|
| `import { message } from 'antd'` — plus the two multi-line shapes (`^\s*message,?\s*$` member line and `,\s*message\s*,` inline member) restricted to antd import blocks | matches **only** `frontend/src/components/ToastNotification.tsx` (its own aliased `import { message as antdMessage, ... } from 'antd'`) — zero elsewhere in `frontend/src` |
| `Modal\.confirm\(` in `frontend/src` | **0 matches** |
| `const \{ confirm \} = Modal;` in `frontend/src` | **0 matches** |
| `const { confirm } = modal;` | exactly 6 files (UsersPage, GroupList, UnitList, SpecialStationList, CoastalStationList, PortListPage) |
| `import { message } from '<bridge>'` / merged forms | exactly 32 files (WO-2 set minus RadarStationForm) |
| `modal` from bridge (merged `import toast, { message, modal }` / `import toast, { modal }` or standalone) | exactly 19 files (15 in WO-3 + 4 folded in WO-2) |

**Acceptance mapping (triage done_oracle):**

| done_oracle item | Delivered by | Verified by |
|------------------|--------------|-------------|
| No `[antd: ...] Static function can not consume context` warning when triggering toasts (success/error), Modal.confirm dialogs, and destructured-confirm dialogs across the app | WO-1 + WO-2 + WO-3 | dev-browser console probe (below) |
| All existing toast/confirm behavior unchanged | WO-2/WO-3 call sites byte-identical (D5 is the only text change) | G1 + G2 + code-diff review |
| vite build and tsc --noEmit pass | all WOs | G1, G2 |
| RadarStationForm save-failure path shows toast instead of throwing ReferenceError | WO-2 item 33 | dev probe: trigger a save failure on the RadarStation form; a toast `Lỗi lưu dữ liệu` appears, no console `ReferenceError: message is not defined` |

**Dev-console oracle (required — G1/G2 cannot prove it):** the warning is emitted only when `process.env.NODE_ENV !== 'production'` (seam claim on `antd/es/config-provider/index.js:41-42`), so the definitive check is in the Vite dev browser: (1) trigger a failing API call (exercises `services/api.ts:35` axios interceptor), (2) run the LogsPage CSV export (keyed loading→success flow, `LogsPage.tsx:387-399`), (3) open any delete confirmation dialog from the 13 WO-3 screens — console shows no `Static function can not consume context` warning. Invert one probe (e.g., temporarily revert one bridge import) only if the probe must be proven non-vacuous.

## 6. Risks & out-of-footprint observations

1. **Footprint extension (PMO decision 2026-08-17)** — the `const { confirm } = Modal;` static-destructure pattern exists in SIX files (UsersPage.tsx:22, GroupList.tsx:25, UnitList.tsx:17, SpecialStationList.tsx:31, CoastalStationList.tsx:31, PortListPage.tsx:122 — verified by direct grep this session). Because the goal is app-wide zero warning, all six are IN scope: the three in-footprint files (SpecialStationList, CoastalStationList, PortListPage) get their confirm swap folded into WO-2 (§4.2.2); three files OUTSIDE the triage's 47 (UsersPage, GroupList, UnitList) are added to WO-3 (+3 targets → 50 unique). This is a deliberate, PMO-directed extension of the triage footprint, recorded here for the reviewer. No residual static-confirm site remains.
2. **Pre-mount `modal` use** — `activeModal` is `undefined` until `RegisterAntdStatic`'s effect runs. All 13 `Modal.confirm` call sites are user-event handlers (post-mount); there is no module-init confirm call. If a future caller invokes `modal` pre-mount, the proxy returns `undefined` per property — safe failure, not a crash.
3. **Proxy method forwarding** — the get trap returns the method unbound; antd static functions do not rely on `this`, so behavior is identical. If a future antd version changes that, the proxy is the single place to rebind.
4. **No test suite change** — the frontend package has no runnable test script (known workspace fact); this is an import-level refactor verified by G1/G2 plus the dev-console oracle, not by unit tests.
5. **Cluster counts** — WO-1 = 2 files; WO-2 = 33 files (32 antd message imports + RadarStationForm latent fix, incl. the 4 folded confirm swaps); WO-3 = 15 files (12 `Modal.confirm(` + 3 destructure). 2 + 33 + 15 = **50 unique targets** (triage 47 + 3 PMO-directed additions); WO-2 ∩ WO-3 = ∅ (D6), so the two clusters are parallel-dispatch safe. The triage summary's "32 message files" refers to the 32 antd-import files.

## 7. Prohibitions (inviolable)

- **Do NOT convert any message call site to the `toast` wrapper.** `toast` accepts only `(msg: string, duration?)` and cannot express the keyed `{ content, key }` object API / `message.open` / `message.destroy`; the LogsPage export flow (`LogsPage.tsx:387-399`) would break. The bridge must expose `message` itself.
- **Do NOT modify any call-site argument, key, content string, or message type** — call sites stay byte-identical except the single sanctioned `RadarStationForm.tsx:227` `message.error` → `toast.error` fix.
- **Do NOT touch backend** (`src/main/**`), `frontend/src/theme.ts`, `frontend/src/tokens.ts`, any UI/styling, any API/schema, or any file outside the 47 edit-target files listed above.
- **Do NOT alter `toast`, `setStaticMessage`, or the aliased antd import inside ToastNotification.tsx** — only additive changes (WO-1) are permitted there.
- **Do NOT use `export { x } from` in the bridge** (AGENTS.md Vite v8 dev-mode re-export bug).
- **Do NOT run git add/commit/push** — keep changes local and unstaged.
