# QA Report — Wave 1: Acceptance Oracle (M-1003)

- Module: `M-1003-fix-antd-static-message-context-warning`
- Triage: `TRI-1786936619261-4881` (C4, 2 write-scope clusters, blast_radius 47, +3 PMO-directed additions = 50 unique targets)
- Stage / wave: engineering-qa-engineer, wave 1 (oracle authoring)
- Date: 2026-08-17
- Status: **ORACLE AUTHORED — implementation absent, nothing executed in this wave** (per dispatch: wave-1 authors the acceptance criteria; build/tsc and greps against the post-change tree run at the implementation wave)

## 1. Sources

| Source | Role |
|--------|------|
| `docs/intel/_intake/TRI-1786936619261-4881.json` | `done_oracle` (line 118) + `verification_commands` (lines 119-128): `npm run build` and `npx tsc --noEmit -p tsconfig.app.json`, both cwd `frontend` |
| `docs/modules/M-1003-fix-antd-static-message-context-warning/design/00-design-plan.md` | WO-1 (bridge), WO-2 (33 files), WO-3 (15 files), §5 residual greps + G1/G2 gates + dev-console oracle, §6 risks (50-target footprint), §7 prohibitions |
| Current `frontend/src` (read-only greps, this session) | Baseline counts that every criterion's expected value is measured against |

### 1.1 Baseline snapshot (verified read-only, 2026-08-17, pre-implementation)

| Pattern (in `frontend/src`) | Baseline count | Evidence |
|---|---|---|
| Files binding `message` from `'antd'` (all import shapes: SOLO / single-line member / own-line member / inline-continuation) | 32 (12 single-line shapes confirmed by grep incl. the aliased bridge import; the multi-line S/M/I shapes per design plan §4.2 table) | grep `import \{[^}]*\bmessage\b[^}]*\} from 'antd'` → 12 matches; design plan §4.2 file list (rows 1-32) |
| `Modal\.confirm\(` | 13 | grep → PierListPage:488, ConnectionList:98, GroupMembers:79, PortPlanningList:177, IncidentList:182, MapLayerList:271, LineObjectList:213, PointObjectList:218, GISChartView:2463, PolygonObjectList:213, PermissionsPage:197, VtsSystemList:390, SymbolList:227 |
| `const \{ confirm \} = Modal;` | 6 | grep → GroupList:25, PortListPage:122, UnitList:17, UsersPage:22, CoastalStationList:31, SpecialStationList:31 |
| `RadarStationForm.tsx:227` | `message.error(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu');` — `message` NOT imported (antd block lines 3-15 has no `message` member); `toast` imported from the bridge | read (offset 220 + offset 1, this session) |
| `LogsPage.tsx:387-399` | keyed export flow `message.loading({ content: 'Đang xuất CSV...', key: 'export' })` → `message.success/error({ ..., key: 'export' })` | design plan §2 row 5, §4.2 |

## 2. Acceptance criteria (the oracle)

Every criterion below is checkable; each maps to a triage `done_oracle` clause or a design-plan §5 residual check / §7 prohibition. **Wave-1 does not execute them** (no implementation yet); they are the contract for the implementation wave. Two independent evidence sources are required for the load-bearing import/confirm claims: the residual grep AND the `tsc --noEmit` run (`noUnusedLocals: true` in `frontend/tsconfig.app.json` turns any leftover unused antd member into a compile error, so a kept-but-unused `message`/`Modal` cannot pass G2).

### AC-message — antd `message` import fully routed through the bridge

| ID | Oracle (checkable) | Pass condition | Source |
|----|--------------------|----------------|--------|
| AC-message-1 | grep `import \{[^}]*\bmessage\b[^}]*\} from 'antd'` (all shapes, incl. multi-line member lines `^\s*message,?\s*$` and inline `,\s*message,` inside antd import blocks) in `frontend/src` | **Exactly 1 match**: `frontend/src/components/ToastNotification.tsx`, and that line is the unchanged aliased `import { message as antdMessage, ... } from 'antd'` (byte-identical per §7); 0 matches in the other 31 baseline files | design §5 residual grep; §7 |
| AC-message-2 | grep bridge message imports: `import (toast, )?\{[^}]*\bmessage\b[^}]*\} from '[^']*ToastNotification'` | **Exactly 32 files** (WO-2 set minus RadarStationForm) import `message` from the bridge — standalone `import { message } from '<bridge>'` or merged `import toast, { message } from '<bridge>'` | design §5 residual grep ("exactly 32 files") |
| AC-message-3 | Grep the 32 files' antd import lines for a residual unaliased `message` binding | 0 residual `message` members in any `'antd'` import outside ToastNotification.tsx (backstop: G2 `noUnusedLocals` fails otherwise) | design §4.2 D2 |

### AC-modal — static `Modal.confirm` / destructure fully routed through the bridge

| ID | Oracle (checkable) | Pass condition | Source |
|----|--------------------|----------------|--------|
| AC-modal-1 | grep `Modal\.confirm\(` in `frontend/src` | **0 matches** | design §5 residual grep |
| AC-modal-2 | grep `const \{ confirm \} = Modal;` in `frontend/src` | **0 matches** | design §5 residual grep |
| AC-modal-3 | grep `const \{ confirm \} = modal;` | **Exactly 6 files**: UsersPage, GroupList, UnitList, SpecialStationList, CoastalStationList, PortListPage | design §5 residual grep |
| AC-modal-4 | grep `modal\.confirm\(` | **Exactly 13 files** (12 WO-3 + MapLayerList folded in WO-2) | design §4.3 table + §4.2.2 |
| AC-modal-5 | grep `import (toast, )?\{[^}]*\bmodal\b[^}]*\} from '[^']*ToastNotification'` | **Exactly 19 files** (15 WO-3 + 4 folded WO-2) import `modal` from the bridge; combined AC-modal-3 (6) + AC-modal-4 (13) = 19 | design §5 residual grep |
| AC-modal-6 | grep `import \{[^}]*\bmodal\b[^}]*\} from 'antd'` | **0 matches** — antd v6 has no `modal` export (design §4.3 constraint); `modal` must come from the bridge or tsc fails | design §4.3 |
| AC-modal-7 | Per-file Modal import action (design §4.3 / §4.2.2 tables) | KEEP `Modal` in files rendering `<Modal>` JSX (PierListPage, GISChartView, LineObjectList, MapLayerList, PointObjectList, PolygonObjectList, SymbolList, VtsSystemList, UsersPage, SpecialStationList, CoastalStationList, PortListPage); DROP it where `Modal.confirm(`/destructure was the only use (ConnectionList, IncidentList, PortPlanningList, GroupMembers, PermissionsPage, GroupList, UnitList) | design §4.3 D3 + tables |

### AC-radar — latent ReferenceError fixed

| ID | Oracle (checkable) | Pass condition | Source |
|----|--------------------|----------------|--------|
| AC-radar-1 | read `frontend/src/pages/radarstation/RadarStationForm.tsx` line 227 | Line reads `toast.error(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu');` — argument expression byte-identical to the baseline; ONLY the receiver changes (`message` → `toast`) | design §4.2 D5 |
| AC-radar-2 | grep RadarStationForm.tsx import block | No `message` added to the antd import; `toast` bridge import unchanged (already present) — this is the only call-site text change in the refactor | design §4.2 D5, §7 |
| AC-radar-3 | Dev probe (implementation wave): force a save failure on the RadarStation form | A toast with text `Lỗi lưu dữ liệu` appears; dev console shows NO `ReferenceError: message is not defined` | triage done_oracle; design §5 |

### AC-keyed — LogsPage keyed export flow survives byte-identical

| ID | Oracle (checkable) | Pass condition | Source |
|----|--------------------|----------------|--------|
| AC-keyed-1 | grep `key: 'export'` in `frontend/src/pages/LogsPage.tsx` | **Exactly 3 occurrences** in the export flow (loading at ~387, success, error — lines 387-399) with identical `key` values | design §4.2 ("keep byte-identical") |
| AC-keyed-2 | read LogsPage.tsx lines 387-399 | `message.loading({ content: 'Đang xuất CSV...', key: 'export' })` → `message.success({...key:'export'})` / `message.error({...key:'export'})` — call-site args/content/keys unchanged; flow still uses `message`, NOT the `toast` wrapper (toast cannot express keyed object API — §7 prohibition) | design §2 row 5, §7 |
| AC-keyed-3 | grep `toast\.` in LogsPage.tsx | No export-flow call converted to `toast.*` | design §7 |

### AC-behavior — dialogs/toasts still render and return handles; call sites unchanged

| ID | Oracle (checkable) | Pass condition | Source |
|----|--------------------|----------------|--------|
| AC-behavior-1 | Read-only diff review of the 50-target set | No call-site argument, `key`, content string, or message type changed in any file except the single sanctioned RadarStationForm.tsx:227 change | design §7; triage done_oracle ("all existing toast/confirm behavior unchanged") |
| AC-behavior-2 | Grep the 19 confirm files | `confirm(` invocations (the `Modal.confirm({...})` object args and the destructured `confirm({...})` args) byte-identical; only the receiver/destructure source changes | design §4.2.2, §4.3 |
| AC-behavior-3 | Dev probe (implementation wave): open each of the 13 `modal.confirm(` screens + 6 destructure screens, accept and cancel | Dialog renders, OK/Cancel resolve/reject the returned handle, no console `Static function can not consume context` warning | triage done_oracle; design §5 dev-console oracle |

### AC-bridge — WO-1 additive-only bridge (derived from WO-1 + §7)

| ID | Oracle (checkable) | Pass condition | Source |
|----|--------------------|----------------|--------|
| AC-bridge-1 | read `frontend/src/components/ToastNotification.tsx` | Exports `message` and `modal` as live-forwarding Proxy consts (`get` trap reads current `activeMessage`/`activeModal` at call time); `toast`, `setStaticMessage`, `activeMessage = antdMessage`, and the aliased antd import are byte-identical (additive-only) | design §4.1.1, §7 |
| AC-bridge-2 | grep `export \{` in ToastNotification.tsx | No `export { x } from '...'` re-export syntax anywhere in the bridge (Vite v8 dev-mode ReferenceError rule) | design §4.1.1, AGENTS.md |
| AC-bridge-3 | read `frontend/src/App.tsx` RegisterAntdStatic (lines ~280-286) | `const { message, modal } = AntApp.useApp();` and effect calls `setStaticMessage(message); setStaticModal(modal);` with `[message, modal]` deps; `setStaticModal` imported at line 7 | design §4.1.2 |
| AC-bridge-4 | grep `activeModal` initialization | `activeModal` starts `undefined` — NO pre-mount fallback added (antd v6 has no static `modal`; all 13+6 confirm sites are post-mount event handlers) | design §6 risk 2 |

### AC-gate — build + typecheck (triage verification_commands)

| ID | Command (cwd `frontend`) | Pass condition | Source |
|----|--------------------------|----------------|--------|
| AC-gate-1 | `npm run build` (timeout 300000 ms) | Exit code 0, Vite production build completes | triage verification_commands[0]; design G1 |
| AC-gate-2 | `npx tsc --noEmit -p tsconfig.app.json` (timeout 180000 ms) | Exit code 0, no errors (catches unused-import violations via `noUnusedLocals` and any bad bridge import path) | triage verification_commands[1]; design G2 |

Run both after WO-1, after WO-2, after WO-3, and once more on the final tree (design §5 G1/G2 "when" column). A final-tree run is mandatory evidence for the verdict.

### AC-negative — prohibitions hold (design §7)

| ID | Oracle (checkable) | Pass condition | Source |
|----|--------------------|----------------|--------|
| AC-negative-1 | Read-only `git status --porcelain` / diff of the changed set | No paths under `src/main/**` (backend) in the change set | design §7 |
| AC-negative-2 | diff of the changed set | `frontend/src/theme.ts`, `frontend/src/tokens.ts`, and no `*.css` / `*.less` files changed; no API/schema changes | design §7 |
| AC-negative-3 | diff of the changed set | Changed-file set ⊆ 50 edit targets (47 triage + UsersPage, GroupList, UnitList) | design §6.1, §7 |
| AC-negative-4 | Read-only `git status --porcelain` + `git log -1` | Work left unstaged in the working tree; no `git add`/`commit`/`push` performed by the work (no new commit authored, no staged hunks) | design §7 last bullet; AGENTS.md |
| AC-negative-5 | diff of `frontend/package.json` + `frontend/package-lock.json` (or their absence from the change set) | No new dependencies (manifests untouched; refactor is import-level, no install step) | design §7; triage edit_target_files |
| AC-negative-6 | grep the 32 message files + 19 modal files | No call site converted to the `toast` wrapper (toast cannot express keyed `{content,key}` / `message.open` / `message.destroy` — §7) | design §7 |

## 3. Verification plan (implementation wave execution order)

| Step | Action | Expected | AC covered |
|------|--------|----------|------------|
| 1 | `git status --porcelain` (read-only) | change set ⊆ 50 targets, unstaged | AC-negative-1/3/4 |
| 2 | Diff review of the 50-target set | only import-level edits + RadarStationForm.tsx:227 | AC-behavior-1/2, AC-keyed-2, AC-negative-2/5/6 |
| 3 | Residual greps (AC-message-1/2/3, AC-modal-1..6, AC-keyed-1/3, AC-bridge-2/4) | counts per §2 tables | AC-message, AC-modal, AC-keyed, AC-bridge |
| 4 | `npm run build` (cwd frontend) | exit 0 | AC-gate-1 |
| 5 | `npx tsc --noEmit -p tsconfig.app.json` (cwd frontend) | exit 0, no errors | AC-gate-2 (independent backstop for import/member-removal claims) |
| 6 | Dev-console probe (Vite dev browser, `NODE_ENV !== 'production'`): (a) trigger a failing API call → axios interceptor toast (services/api.ts:35), (b) run the LogsPage CSV export → keyed loading→success, (c) open one delete-confirm dialog per 13+6 screen set, (d) force RadarStationForm save failure | No `[antd: ...] Static function can not consume context` warning in console; toast/dialog behavior identical; radar shows `Lỗi lưu dữ liệu` toast with no ReferenceError | AC-behavior-3, AC-radar-3, triage done_oracle (dev-browser clause) |
| 7 | Non-vacuous inversion (only if step 6 must be proven): temporarily revert ONE bridge import (e.g., api.ts back to `'antd'`), confirm the warning reappears, restore, rerun step 6 | warning absent after restore | design §5 "invert one probe" |

**Coverage of the triage done_oracle (line 118):** "no Static function warning on toasts/confirm dialogs" → AC-message-1/2, AC-modal-1..5, AC-bridge, dev probe (step 6); "all existing toast/confirm behavior unchanged" → AC-behavior-1/2/3, AC-keyed; "vite build and tsc pass" → AC-gate-1/2; "RadarStationForm save-failure shows toast, no ReferenceError" → AC-radar-1/2/3. **No done_oracle clause is left without an executable oracle.**

## 4. What wave 1 did NOT verify (declared, not silently skipped)

- G1/G2 were NOT run: the implementation does not exist yet (dispatch instruction).
- The dev-console warning-absence clause is unprovable by build/tsc (emitted only when `process.env.NODE_ENV !== 'production'`); it is covered by the step-6 dev probe at the implementation wave.
- Grep counts in §2 are post-change expectations; current-source baselines are recorded in §1.1 so the implementer-QA can diff before/after counts.

## 5. Highest-value discriminating cases (per QA runtime: prefer discriminating over tautological)

1. **AC-radar** (failure path): the only negative-path fix — proves the ReferenceError is really gone at runtime, not just in the diff.
2. **AC-keyed** (boundary of the toast-wrapper prohibition): the keyed `{content, key}` flow is exactly what the `toast` wrapper cannot express; a byte-identical pass here proves the bridge exposes `message` itself.
3. **AC-modal-4/5** (count discrimination): 13 `modal.confirm(` + 6 destructures = 19 files must hold exactly — a missing or double-converted file breaks the count and is caught by both the grep and G2 (`noUnusedLocals` on the dropped/kept `Modal`).
4. **AC-bridge-4** (pre-mount boundary): no `activeModal` fallback — the proxy's safe-undefined behavior is the designed contract (design §6 risk 2); a defensive fallback would violate WO-1.

## 6. Risk notes for the implementation wave

- Multi-line import greps (M-shape own-line `message,`, I-shape inline `, message,`) need the regex restricted to `'antd'` import blocks; a bare `\bmessage\b` search will also hit the bridge's aliased `message as antdMessage` (the one permitted survivor) — count against the §1.1 baseline, not zero.
- `noUnusedLocals: true` (frontend/tsconfig.app.json) makes leftover antd members a tsc failure: G2 is the independent backstop for every member-removal claim (D2/D3).
- The dev-probe warning appears only in dev mode; a production build passing G1 does not prove the warning is gone — the browser probe is mandatory evidence.
