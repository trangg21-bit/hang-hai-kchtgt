---
feature-id: F-001
stage: frontend-implementation
agent: engineering-frontend-developer
wave: 1
task: hide-actions-permission-label
verdict: Pass
last-updated: 2026-08-14
---

# F-001 Hide 3 Row Actions + "Danh sách chức năng" Label — Frontend Implementation Summary (TRI-1786688745847-4d03)

## Objective

Two UI-only changes in `frontend/src/pages/UsersPage.tsx` (line numbers at time of edit):
(1) HIDE the `reset-password`, `forgot-password`, and `delete` row actions — remove their
`actions.push(...)` lines, keep handlers/modals/hooks intact; add a comment noting they are
intentionally hidden. (2) Add section label "Danh sách chức năng" as the first child of the
bordered container above the permission `<Tree>` in the Phân quyền drawer, using imported tokens
only (no hardcoded hex).

## Acceptance Criteria Coverage

| # | Criterion (brief DoD) | Status | Evidence |
|---|---|---|---|
| 1 | 3 actions (reset-password/forgot-password/delete) no longer render; handlers intact | Implemented | `frontend/src/pages/UsersPage.tsx:314–316` — the three `actions.push(...)` lines removed, replaced by comment `// Intentionally hidden per TRI-1786688745847-4d03: reset-password, forgot-password, delete row actions. // Handlers/modals/hooks (handleResetPassword, handleForgotPassword, handleDelete) remain intact.` Handlers still referenced in the `rowActions` deps array (`:319`) and their modals remain mounted |
| 2 | "Danh sách chức năng" label renders as first child of bordered div above the Tree with specified tokens | Implemented | `frontend/src/pages/UsersPage.tsx:597` — `<div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceMd }}>Danh sách chức năng</div>` immediately inside the bordered container, before `<Tree>`; all four tokens already imported (no new imports, no hardcoded values) |
| 3 | `npm run build` in frontend/ succeeds | Verified | Exit 0, `vite v8.1.5`, `✓ 4033 modules transformed`, `✓ built in 1.50s`; `dist/assets/UsersPage-fzvqayKj.js` (25.45 kB / gzip 7.94 kB) — new chunk hash vs prior `UsersPage-2j692Bbx.js` confirms the change was bundled (see Verification Evidence) |
| 4 | No backend or other files modified | Verified | Only `frontend/src/pages/UsersPage.tsx` edited (+ this artifact) |

## Files Changed

| File | Change |
|---|---|
| `frontend/src/pages/UsersPage.tsx` | (1) Removed 3 row-action pushes: `reset-password` (`handleResetPassword`), `forgot-password` (`handleForgotPassword`), `delete` (`handleDelete`) from `rowActions` (was :316–318); added intentional-hide comment. (2) Added "Danh sách chức năng" label as first child of the bordered permission container above `<Tree>` (was :596). (3) Removed now-unused icon imports `DeleteOutlined`, `MailOutlined` from the `@ant-design/icons` import line (grep confirmed their only usages were the removed pushes); `KeyOutlined` retained (still used by the Phân quyền action at `:307`) |

## What Was NOT Deleted (explicitly preserved per brief)

- `handleResetPassword` + reset-password modal, `handleForgotPassword` + confirm dialog, `handleDelete` + delete confirm — all remain defined and referenced in the `rowActions` deps array; only the menu entries are hidden.
- `useResetPassword`, `useForgotPassword`, `useDeleteUser` hooks — intact.
- `view`, `permissions`, `approve`, `reject`, `edit`, `lock` row actions — unchanged.

## UI Craft / Token Compliance

- All styling uses existing imported tokens: `colors.sidebarBg` (theme.ts), `fontWeightBold`, `fontSizeMd`, `spaceMd` (tokens.ts). No hardcoded hex/spacing/font-size introduced.
- Label text is Vietnamese with diacritics ("Danh sách chức năng").
- No new imports, no new components, no Layout/Sider/Menu changes.

## Verification Evidence

| Check | Command (workdir) | Exit Code | Result |
|---|---|---|---|
| Production build (gate) | `npm run build` (frontend/) | 0 | `vite v8.1.5`; `✓ 4033 modules transformed`; `✓ built in 1.50s`; emitted `dist/assets/UsersPage-fzvqayKj.js` (25.45 kB, gzip 7.94 kB). Only pre-existing >500 kB chunk-size warning (Home chunk), non-blocking |
| TypeScript typecheck | `npx tsc --noEmit` (frontend/) | 0 | No violations (local `typescript@~6.0.2` via npx; pnpm unavailable on this machine) |

## Known Limitations / Observations

- Row actions hidden for ALL users regardless of permission (`user.reset_password` / `user.delete`); if the feature returns, restore the three push lines — the handlers, hooks, and deps are still in place.
- Pre-existing lint findings in untouched code remain (filter `useCallback` deps, detail-rows index keys); not part of this change or the build gate.
- `handleDelete` / `handleForgotPassword` now have no JSX callers (deps-array reference only) — intentional per "HIDE, not delete".
