# QA Acceptance Report W2 — M-027 Luồng hàng hải CHK (navigationchannelchk)

- Module: M-027-navigationchannelchk
- Stage: engineering-qa-engineer (wave-2 battery execution)
- Date: 2026-08-28
- Oracle: `qa/acceptance-map.json` (AC-1..AC-5, wave-1) + `qa/07-qa-report-w1.md`
- Scope: bounded checks only (greps + `npm run build` + git-diff scope). Full vitest suite NOT run. No source file modified.

## 1. Result table (per AC)

| AC | Oracle check | Executed command | Observed result | Verdict |
|---|---|---|---|---|
| AC-1 | Chk identifiers + themetokenchk imports in the 2 new pages; ZERO leftover base identifiers/routes/labels | grep `NavigationChannelChk(List\|Form)`; grep `themetokenchk`; grep `NavigationChannel(List\|Form)`; grep `navigation-channel`; grep `Luồng hàng hải` — all in `frontend/src/pages/navigationchannelchk/` | 7 Chk-identifier matches (List.tsx:43,79,560; Form.tsx:76,93,96,101); 5 `themetokenchk` import lines (List.tsx:39-40, Form.tsx:71-73); **0** matches for base identifiers `NavigationChannel(List\|Form)`; all 6 `navigation-channel` occurrences are `-chk` suffixed (Form.tsx:528,542,590,604,623,1089); all 3 `Luồng hàng hải` labels include CHK (List.tsx:521 breadcrumb; Form.tsx:604,1108 titles) | **PASS** |
| AC-2 | App.tsx: exactly 2 lazy imports + 6 routes with `navigationchannel:read/create` | grep `lazy\(\(\) => import\('\./pages/navigationchannelchk/`; grep `path="/(navigation-channel-chk\|luong-hang-hai-chk)` in App.tsx | exactly 2 lazy imports (App.tsx:74-75); exactly 6 route matches (App.tsx:245-251 — /navigation-channel-chk list/create/:id + /luong-hang-hai-chk list/create/:id), each wrapped in `<PermissionGuard permission="navigationchannel:read"\|"create">` rendering `NavigationChannelChkList`/`NavigationChannelChkForm` | **PASS** |
| AC-3 | AppLayout.tsx: exactly 5 mirror entries labeled "Luồng hàng hải CHK" | grep `navigation-channel-chk`; grep `Luồng hàng hải CHK` in AppLayout.tsx | exactly 5 mirror entries (AppLayout.tsx:78 permission map `navigationchannel:read`; :146 title map value; :273 menu-highlight array; :300 selectedKey array; :423 menu item `{ key: '/navigation-channel-chk', label: 'Luồng hàng hải CHK' }`); label `Luồng hàng hải CHK` exactly 2× (:146, :423) | **PASS** |
| AC-4 | `npm run build` in `frontend/` exits 0 | `npm run build` (cwd `frontend/`) | **exit code 0** — vite v8.1.5, `✓ 4120 modules transformed`, `✓ built in 1.16s` (1811ms wall); only pre-existing non-blocking chunk-size advisory on stderr; chk pages bundled as `dist/assets/NavigationChannelChkList-_ugn96fu.js` + `NavigationChannelChkForm-ax_UXdSu.js` | **PASS** |
| AC-5 | Git scope: 2 new pages + App.tsx + AppLayout.tsx; ZERO under base pages/tokens/themetokenchk/theme.ts (M-027)/Java/db/PermissionSeeder | `git status --porcelain -- frontend/src`; `git diff --name-only HEAD -- frontend/src`; full-tree `git status --porcelain` (prior run, same tree) | `M frontend/src/App.tsx`, `M frontend/src/components/AppLayout.tsx`, `?? frontend/src/pages/navigationchannelchk/` (exactly 2 files, list-verified); **ZERO** entries under `frontend/src/pages/navigationchannel/`, `tokens.ts`, `themetokenchk.ts`, `src/main/**`, `src/main/resources/db/**`, `PermissionSeeder.java`; `frontend/src/theme.ts` M = concurrent M-024 CHK navy standardization (attribution below) | **PASS** |

## 2. AC-5 theme.ts attribution (per wave-1 oracle)

`frontend/src/theme.ts` is modified in the shared dirty tree, but **not by M-027**. Two independent evidence sources:

1. `git diff frontend/src/theme.ts` shows `sidebarBg: '#12468C' → '#1a3f83'` (comment "nền sidebar navy CHK — đồng nhất themetokenchk.sidebarBg"), `--bg-sidebar` fallbacks `#12468C → #1a3f83`, `chk-detail-label → #273e7c` — the M-024 theme-CHK docs-sync standardization.
2. M-024's own `docs/modules/M-024-tai-cau-truc-menu-navigation/qa/acceptance-map.json` AC-1..AC-3 evidence references these exact values at these exact lines (`theme.ts:50 sidebarBg '#1a3f83'`, `themetokenchk.ts:36 actionPrimary '#273e7c'`, `AppLayout.tsx:632/865 color '#273e7c'`), and its AC-4 documents the shared dirty tree with concurrent pipeline touches.

M-027's content-level footprint is independently proven by the AC-2/AC-3 greps (the M-027-specific lazy imports, routes, and mirror entries are present in the modified `App.tsx`/`AppLayout.tsx`).

## 3. Execution notes

- Checks executed exactly as bounded in `acceptance-map.json`; full vitest suite intentionally not run.
- No source file was modified by QA; only `docs/modules/M-027-navigationchannelchk/qa/*` written.
- Runtime/behavioral parity with base (approval C1/C2, attachments, GIS) is inherited from the shared backend and base pages; out of scope for this structural + build oracle (documented in wave-1 report section 4).

## 4. Verdict

All 5 acceptance criteria GREEN with executed evidence: AC-1 greps (7/5/0/6-chk/3-CHK), AC-2 (2 lazy + 6 guarded routes), AC-3 (5 mirror entries + 2 labels), AC-4 (`npm run build` exit 0), AC-5 (git footprint clean, theme.ts attributed to M-024). **PASS**.
