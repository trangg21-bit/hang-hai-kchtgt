# QA Report — Wave 2 (Validation) — F-001 Quản lý người dùng — TRI-1786688745847-4d03

- **Triage:** TRI-1786688745847-4d03 (implementation, C2 brownfield-extend; escalated from TRI-1786681817152-44eb)
- **Module / Feature:** M-001 Quản trị hệ thống / F-001 Quản lý tài khoản người dùng
- **Stage:** Engineering QA — wave-2 validation of the two UI edits against the triage done_oracle
- **Date executed:** 2026-08-14
- **Scope:** (a) hide 3 row actions (Reset mật khẩu / Quên mật khẩu / Xóa) from the row-actions dropdown; (b) render the "Danh sách chức năng" label as the first child of the bordered permission-tree container. Single edit-target file: `frontend/src/pages/UsersPage.tsx`. This report supersedes the prior wave-2 content at this path (written for TRI-1786681457834-5887) — see `docs/intel/_intake/TRI-1786688745847-4d03.json` and module state for both triages.
- **Method:** direct code read-back with file:line evidence + DoD build. No source modified by QA; no server started.

## 1. DoD verification — REAL command output

| Command | Dir | Exit | Output (real) |
|---|---|---|---|
| `npm run build` | `frontend/` | 0 | `vite v8.1.5 building client environment for production...` → `✓ 4033 modules transformed` → `dist/` emitted incl. `dist/assets/UsersPage-fzvqayKj.js 25.45 kB` (current source with both edits) → `✓ built in 818ms`. Only advisory: `(!) Some chunks are larger than 500 kB after minification` (pre-existing, non-blocking). Re-run after this report was written: same result, `✓ built in ~800ms`, exit 0 |

## 2. Check (a) — 3 row actions no longer rendered — **PASS**

**Oracle:** "3 action Reset mật khẩu / Quên mật khẩu / Xóa không còn render trong dropdown thao tác" (triage done_oracle); handlers/hooks stay intact.

**Evidence:**
- `UsersPage.tsx:295-321` — `rowActions` callback builds the dropdown; the only `actions.push(...)` calls are: `view` (user:read, :298-299), `permissions` (user:manage, :301-302), `approve`/`reject` (PENDING_APPROVAL only, :305-307), `edit` (user.edit, :309), `lock`/unlock (user.lock, :310). **No push exists for reset-password, forgot-password, or delete.**
- `UsersPage.tsx:316-317` — the intentional-hide marker: `// Intentionally hidden per TRI-1786688745847-4d03: reset-password, forgot-password, delete row actions.` / `// Handlers/modals/hooks (handleResetPassword, handleForgotPassword, handleDelete) remain intact.`
- Grep for `reset-password|forgot-password|'delete'` across the file: the strings appear ONLY in the hide comment (:316), handler definitions, the reset-password modal wiring (:483, :500), and the rowActions dependency array (:320) — never in an `actions.push`. The old seam line (formerly `UsersPage.tsx:316` per triage seam_claims — `if (hasPerm('user.reset_password')) actions.push({ key: 'reset-password', ... })`) is **gone**; that line number is now the comment.
- Handlers/hooks intact (per dispatch expectation):
  - Hooks: `UsersPage.tsx:103` `const deleteUser = useDeleteUser();`, `:104` `const resetPassword = useResetPassword();`, `:105` `const forgotPassword = useForgotPassword();`
  - Handlers: `:160` `handleDelete`, `:169` `handleResetPassword`, `:174` `handleResetPasswordSubmit`, `:195` `handleForgotPassword`
  - `:320` dependency array still references `handleResetPassword, handleForgotPassword, handleDelete` (defined and in scope; compiled green).

**Pass/fail criteria (oracle):** PASS iff no reset-password/forgot-password/delete entry is pushed into the row-actions array and the handlers/hooks remain defined. Observed: PASS.

## 3. Check (b) — "Danh sách chức năng" label above the permission Tree — **PASS**

**Oracle:** "label 'Danh sách chức năng' hiển thị ngay trên cây quyền" with tokens `colors.sidebarBg` / `fontWeightBold` / `fontSizeMd` / `spaceMd`, as the first child of the bordered div (triage seam_claims: insert right after the container line, formerly `:596`).

**Evidence:**
- `UsersPage.tsx:595` — the bordered container: `<div style={{ border: `1px solid ${borderDefault}`, borderRadius: radiusMd, padding: spaceMd, maxHeight: 'calc(100vh - 230px)', overflowY: 'auto' }}>` (matches the seam_claims container verbatim; it has moved from :596 to :595 because the label was inserted).
- `UsersPage.tsx:596` — **first child** of that div: `<div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceMd }}>Danh sách chức năng</div>` — exactly the four required tokens.
- `UsersPage.tsx:599` — `<Tree checkable defaultExpandAll ... />` renders immediately after the label → label sits directly above the permission tree.
- Tokens in scope: `UsersPage.tsx:18` imports `fontWeightBold, fontSizeMd, radiusMd, borderDefault, spaceFormField, spaceMd, ...` from `'../tokens'`; `colors.sidebarBg` is used at :596 (and consistently elsewhere: :43, :359, :367, :375, :481).

**Pass/fail criteria (oracle):** PASS iff the label is the first child of the bordered div, positioned immediately above the Tree, and styled with the four named tokens. Observed: PASS.

## 4. Coverage limits

- Static read-back only: the dropdown rendering and label position were verified at source level; no browser probe executed (backend not started; frontend not served).
- `npm test` / `pnpm exec tsc --noEmit` were not part of this triage's DoD (DoD = `npm run build`, executed, exit 0). The build does compile the edited file, so no syntax/type-level breakage in the edited paths.

## 5. Conclusion

Both oracle checks PASS with file:line evidence; `npm run build` (frontend/) executed with real output and exit 0 (built in 818ms; post-write re-run also exit 0). No source file was modified during this validation — the only write is this report.
