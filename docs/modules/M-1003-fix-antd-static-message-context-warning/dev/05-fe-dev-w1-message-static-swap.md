# FE Dev WO-2 — message-swap cluster (message-static-swap)

- Module: M-1003-fix-antd-static-message-context-warning
- Work order: WO-2 (design plan §4.2) — message-swap cluster, 33 files
- Stage: engineering-frontend-developer-wave-1 (wave 1)
- Type: behavior-preserving, frontend-only, import-level change
- Date: 2026-08-17

## Source delta (33 files, design plan §4.2 list)

### (a) 32 antd `message` imports swapped to the bridge — call sites byte-identical

All 32 files now import `message` from `frontend/src/components/ToastNotification.tsx` (verified:
15 merged `import toast, { message }` / `import toast, { message, modal }` + 17 new-line
`import { message } from '<bridge>'` + 2 SOLO line replacements = 32; zero residual `message`
inside any `from 'antd'` import — grep-clean, only the intentional `message as antdMessage` alias
remains in the bridge itself).

Per §4.2 transformation rules:
- SOLO (2): `useUsers.ts`, `api.ts` — line replaced → `import { message } from '../components/ToastNotification';`
- S (9): member stripped from single-line antd import; bridge import added/merged
- M (18): `  message,` member line deleted from multi-line block; bridge import added after `} from 'antd';` or merged into existing toast import
- I (2): `, message` stripped from continuation line (`BerthForm`, `PortFormContent`)

Call sites untouched (byte-identical), including the LogsPage keyed flow
(`message.loading/success/error({... key:'export'})` — import source only). No call site converted to `toast`.

### (b) RadarStationForm latent fix (the ONLY call-site text change in the refactor)

`frontend/src/pages/radarstation/RadarStationForm.tsx:227`:
`message.error(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu');` →
`toast.error(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu');`
(`toast` already imported at line 17; no import change). tsc net effect: RadarStationForm error
count 11 → 10 (the baseline TS2304 undeclared-`message` error removed).

### (c) 4 folded confirm swaps (§4.2.2) — D6 disjointness with WO-3

| File | Swap | Bridge import | Modal kept |
|------|------|---------------|------------|
| `pages/gis/MapLayerList.tsx` | `Modal.confirm(` (271) → `modal.confirm(` | `import toast, { message, modal } from '../../components/ToastNotification';` (line 39) | yes — renders `<Modal>` at 358 |
| `pages/station/SpecialStationList.tsx` | `const { confirm } = Modal;` (31) → `const { confirm } = modal;` | same merged form (line 28) | yes — renders `<Modal>` at 277 |
| `pages/station/CoastalStationList.tsx` | same (31) → `modal` | same merged form (line 28) | yes — renders `<Modal>` at 278 |
| `services/port/PortListPage.tsx` | same (122) → `modal` | same merged form (line 64) | yes — renders `<Modal>` at 3399+ |

`confirm(...)` call sites byte-identical; only the destructure/static-call source changed.
Verified residual: zero `Modal.confirm(` / `const { confirm } = Modal` in these 4 files.

### Design-plan gap found & fixed during execution (path depth for direct pages files)

Design plan §4.2's bridge-path rule `pages/**/* → '../../components/ToastNotification'` is correct
for pages SUBDIRECTORIES but wrong for files DIRECTLY under `src/pages/` (one `..` short → resolves
to `frontend/components/` which does not exist). First build failed exit 1 with 4 UNRESOLVED_IMPORT
errors (SettingsPage, PasswordResetPage, LogsPage, Login). Fixed by using `'../components/ToastNotification'`
in the 5 direct-pages files (incl. ReportsPage, which is not in the module graph so was not flagged):
Login, LogsPage, PasswordResetPage, SettingsPage, ReportsPage. All 27 subdirectory files correctly use
`'../../components/ToastNotification'`. Rebuild exit 0. Recorded as durable gotcha
(topic `m1003-bridge-relative-path-depth`) — WO-3 must apply the same one-level rule to `UsersPage.tsx`
(design plan already lists it as `'../components/ToastNotification'`).

## Verification (executed, cwd `frontend/`)

| Gate | Command | Exit | Result |
|------|---------|------|--------|
| G1 build | `npm run build` | **0** | First run failed exit 1 (4 UNRESOLVED_IMPORT, path-depth bug above); after fix: vite v8.1.5, 4033 modules, `✓ built in 745ms`, chunk-size advisory only |
| G2 typecheck | `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json` (plain invocation) | **2** | Pre-existing ~90-file baseline only; **zero NEW errors in the 33 changed files** (attribution below) |

### G2 attribution (zero new errors — evidence)

Searched the full 1.3 MB tsc output for every error class this change could introduce:
- `Cannot find module '../../components/ToastNotification'` / `'../components/ToastNotification'` /
  `'../ToastNotification'` → **zero matches** (no TS2307 on any bridge import).
- `error TS2451` (duplicate identifier) → **zero matches** post-fix.
- `error TS2305` / `error TS2307` / `Cannot find module` DO appear in the output but are present in the
  WO-1 baseline output too (pre-existing baseline, unrelated modules).
- Per-file error counts (tsc summary tail), changed files: **identical or lower** vs the WO-1 baseline —
  RadarStationForm 11→10 (TS2304 removed), CoastalStationList/SpecialStationList −1 line shift (member
  deletion), PasswordResetPage/Login +1 line shift (added import line); zero increases anywhere.
- 6 changed files are tsc-clean post-fix (AssetDecreaseList, AssetExploitationList, AssetIncreaseList,
  LineObjectForm, PointObjectForm, PolygonObjectForm); the 7 with errors (AttachmentList, useUsers,
  InventoryList, BeaconList, BeaconForm, DikeRevetmentList, MapLayerList) all had the same errors in the
  WO-1 baseline (pre-existing). Where a file imports `message` but never uses it (e.g. WaterZoneForm),
  the baseline TS6133 simply moved from the antd import line to the bridge import line — same error,
  same count, zero new.

The exit-2 is the documented pre-existing workspace baseline (`frontend-tsc-baseline-red`); this seat's
write scope is the 33 files above, so the baseline itself cannot be repaired here.

## Acceptance criteria

| Criterion | Status | Evidence |
|-----------|--------|----------|
| 32 antd message imports swapped to bridge, call sites byte-identical | ✅ | 32 bridge imports grep-verified; 0 residual antd-`message`; LogsPage keyed flow untouched (import-only edit) |
| RadarStationForm.tsx:227 uses `toast.error(...)` | ✅ | edit diff; tsc count 11→10 confirms the latent TS2304 removed |
| 4 folded confirm swaps done (imports + `modal`, antd `Modal` kept for JSX) | ✅ | edit diffs + anchors (MapLayerList:271/358, Special:31/277, Coastal:31/278, PortListPage:122/3399) |
| `npm run build` exit 0 | ✅ | executed, exit 0 (after path-depth fix) |
| Zero NEW tsc errors in changed files | ✅ | attribution above; baseline exit-2 unchanged and fully attributed |

## Risks / notes

- WO-3 must use one-level `'../components/ToastNotification'` for `UsersPage.tsx` (direct pages child) —
  design plan already lists this; recorded in memory for the WO-3 seat.
- No visual/browser observation — import-level refactor; no UI behavior change.
- Frontend package has no runnable test script (known workspace fact); G1/G2 are the gates.

## Durable evidence refs

- `docs/modules/M-1003-fix-antd-static-message-context-warning/design/00-design-plan.md` §4.2 (spec)
- 33 edited files under `frontend/src/` (list in §4.2 table)
- Executed gates: `npm run build` exit 0; tsc exit 2 with zero errors attributable to this delta

## Final verdict (corrected 2026-08-17)

Gate evidence re-run after the initial report: `npm run build` **exit 0**; `node node_modules/typescript/bin/tsc
--noEmit -p tsconfig.app.json` **exit 2** (same pre-existing ~90-file baseline, zero errors attributable to this
delta). Because the mandated tsc gate exits NON-ZERO, the stage verdict is **Blocked** (TSC_BASELINE_RED —
pre-existing baseline outside this seat's 2-file/33-file write scope; same blocker as WO-1). The deliverable
itself is complete and verified against its criteria (build green, zero new tsc errors); next action: PMO
waives the whole-project tsc gate for WO-1/WO-2 on the isolation evidence, or dispatches a baseline-cleanup
work order before WO-3.
