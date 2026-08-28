# M-027 "Luồng hàng hải CHK" (navigationchannelchk) — Code Review Report

- **Reviewer:** engineering-code-reviewer
- **Date:** 2026-08-28
- **Scope:** frontend-only clone of `navigationchannel` → `navigationchannelchk` (CHK theme), per `ba/00-lean-spec.md` (RENAME MAP + AC-1..AC-5) and `design/00-design-plan.md` (WO-1..WO-4).
- **Verdict: Pass** (confidence: high)

## Inspected scope

| # | Check | Result |
|---|---|---|
| WO-1 | Rename completeness in the 2 new pages | ✅ Pass (evidence below) |
| WO-2 | App.tsx: exactly 2 lazy imports + 6 routes, base untouched | ✅ Pass |
| WO-3 | AppLayout.tsx: exactly 5 mirrors, no alias, CHK label | ✅ Pass |
| AC-5 | Git scope: zero forbidden-path changes attributable to M-027 | ✅ Pass |
| AC-4 | `npm run build` (frontend/) re-run → exit 0 | ✅ Pass |

All evidence was re-executed this session (greps, `git diff` reads, build). No source file was modified.

## WO-1 — Rename completeness (PASS)

**Zero leftover base identifiers** in `frontend/src/pages/navigationchannelchk/`:
- `grep NavigationChannelList` → 0 matches; `grep NavigationChannelForm` → 0 matches (both pages).
- Component renames exact per RENAME MAP:
  - `NavigationChannelChkList.tsx:43` `import NavigationChannelChkForm from './NavigationChannelChkForm';`
  - `NavigationChannelChkList.tsx:79` `export default function NavigationChannelChkList()`
  - `NavigationChannelChkForm.tsx:76` `export interface NavigationChannelChkFormProps`
  - `NavigationChannelChkForm.tsx:93` `export default function NavigationChannelChkForm(...)`
  - `NavigationChannelChkForm.tsx:96,101` `NavigationChannelChkFormInner`

**Unchanged identifiers (per RENAME MAP "KHÔNG đổi"):**
- Service: `NavigationChannelChkForm.tsx:26` imports `navigationChannelCRUD, navigationChannelApproval` from `../../services/navigationChannelService`; 15 usages across both files (create/update/delete/approveC1/approveC2/rejectLevel1/rejectLevel2/getHistory/search).
- Types/fields: `NavigationChannelResponse`, `CreateNavigationChannelRequest`, `channelName`, `approvalStatus` all present (e.g. `List.tsx:16`, `Form.tsx:33-34,475`).

**Zero leftover base routes/labels:**
- All route strings are chk-suffixed: exactly 6 occurrences of `/navigation-channel-chk` (`Form.tsx:528,542,590,604,623,1089`); 0 occurrences of `/navigation-channel` or `/luong-hang-hai` without `-chk` (grep over both pages, pattern `navigation-channel|luong-hang-hai`).
- All "Luồng hàng hải" labels carry "CHK": `Form.tsx:604` (breadcrumb), `Form.tsx:1108` (modal title create/edit/detail), `List.tsx:521` (breadcrumb). No bare "Luồng hàng hải" label.

**CHK theme retained:** imports from `../../themetokenchk` + `ThemeTokenProvider` (`List.tsx` header, read this session); `Form.tsx:1108` Modal uses `rootClassName={THEME_SCOPE_CLASS}`.

## WO-2 — App.tsx (PASS)

Full `git diff frontend/src/App.tsx` read this session — pure additions, zero deletions, base routes untouched:
- Exactly 2 lazy imports added after the base pair (`App.tsx:74-75`, block `// M-003`).
- Exactly 6 routes added after the base route block (`App.tsx:245-251`):
  - `/navigation-channel-chk`, `/navigation-channel-chk/create`, `/navigation-channel-chk/:id`
  - `/luong-hang-hai-chk`, `/luong-hang-hai-chk/create`, `/luong-hang-hai-chk/:id`
- Guards match design D4: list/`:id` → `navigationchannel:read`, `create` → `navigationchannel:create` (all 6, verified from diff + grep).

## WO-3 — AppLayout.tsx (PASS)

`git diff frontend/src/components/AppLayout.tsx` read this session. Exactly 5 M-027 mirror entries, each an addition adjacent to its base entry (design WO-3 table):

| # | Position | Addition |
|---|---|---|
| 1 | `AppLayout.tsx:78` | `'/navigation-channel-chk': 'navigationchannel:read',` (permission map, after `:77` base) |
| 2 | `AppLayout.tsx:146` | `'/navigation-channel-chk': 'Luồng hàng hải CHK',` (pageTitles, after base `:144`) |
| 3 | `AppLayout.tsx:273` | `'navigation-channel-chk'` added to pathSegments array (next to `'navigation-channel'`) |
| 4 | `AppLayout.tsx:300` | `'/navigation-channel-chk'` added to openKeys array (next to `'/navigation-channel'`) |
| 5 | `AppLayout.tsx:423` | `canAccessMenu('/navigation-channel-chk') ? { key: '/navigation-channel-chk', label: 'Luồng hàng hải CHK' } : null,` (menu, after base item) |

- No alias `/luong-hang-hai-chk` in the menu: grep → 0 matches (design D5 respected; base alias behavior preserved).
- The remaining 4 hunks in the same diff (`AppLayout.tsx:629,782,796,862` — `#12468C`→`#273e7c`, `#1E2129`→`#1a3f83`) are pre-existing M-024 color work, NOT this module (per brief note; isolated by hunk content).

## AC-5 — Git scope (PASS)

`git status --porcelain` read this session. Relevant entries for this module:
- Modified: `frontend/src/App.tsx`, `frontend/src/components/AppLayout.tsx` (the 2 allowed edits).
- Untracked: `frontend/src/pages/navigationchannelchk/` (the 2 new pages).
- **Zero** entries under `frontend/src/pages/navigationchannel/**` (base READ-ONLY respected).
- **Zero** entries for `frontend/src/tokens.ts`, `frontend/src/themetokenchk.ts` (not in git status at all).
- `frontend/src/theme.ts` is modified (14 lines) but contains **zero** `navigation-channel`/`navigationchannel`/`Luồng hàng hải` content (typed grep) — pre-existing M-024 color work, not attributable to M-027.
- **Zero** entries under `src/main/**` (Java), `src/main/resources/db/**` (migration), or `PermissionSeeder.java`.

## AC-4 — Build (PASS, re-executed this session)

`npm run build` from `frontend/` → **exit code 0** (vite v8.1.5, 4120 modules transformed, built in 1.18s). Only pre-existing warning: chunk > 500 kB (not introduced by this change). Both new pages bundled: `dist/assets/NavigationChannelChkList-_ugn96fu.js` + `dist/assets/NavigationChannelChkForm-ax_UXdSu.js` (glob-verified).

## Remaining untested edges (not blockers)

- Runtime/visual behavior of the 2 new routes (AC-1 oracle) is QA territory — not observed by this reviewer.
- `pnpm exec tsc --noEmit` full-project typecheck was not re-run this session (developer's prior stage reports 0 violations in the 4 changed files; 1117 pre-existing elsewhere). The build gate (AC-4) passed.

## Findings

No blocking or non-blocking defects found. No defect classes to report; no knowledge contributions to flag as junk.
