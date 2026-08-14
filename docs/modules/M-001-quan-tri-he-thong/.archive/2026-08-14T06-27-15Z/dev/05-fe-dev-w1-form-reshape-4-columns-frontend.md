---
feature-id: F-001
stage: frontend-implementation
agent: engineering-frontend-developer
wave: 1
task: form-reshape-4-columns-frontend
verdict: Pass
last-updated: 2026-08-14
---

# F-001 Form Reshape (4 profile fields + status-on-create) — Frontend Implementation Summary (WO-02)

## Objective

Implement the WO-02 frontend delta of scope expansion TRI-1786681457834-5887 per
`ba/00-lean-spec.md` (§10.1–§10.3) + `design/00-design-plan.md` (§6.1–§6.3):
reshape the create/edit drawer to the fixed 11-field order, add 4 profile fields
(address/department/position/note), add the Trạng thái Select to the create form
(default Hoạt động, options Hoạt động/Không hoạt động), stop hardcoding `status: 'ACTIVE'`,
show the 4 fields in the detail drawer, and carry them through types + service payloads.

## Acceptance Criteria Coverage

| # | Criterion (brief DoD) | Status | Evidence |
|---|---|---|---|
| 1 | Create form renders exact 11-field order (username..note) with 4 new fields + Trạng thái Select | Implemented | `frontend/src/pages/UsersPage.tsx:432–498` — observable order: username(1), password(2), orgUnitId(3), email(4), fullName(5), phone(6), address(7), department+position(8–9 adjacent pair per design §6.3), status(10), note(11). Select options `active`/`inactive` with required rule "Vui lòng chọn trạng thái"; `initialValues={{ status: 'active' }}` on the Form (D6 default) |
| 2 | `userService.ts` no longer hardcodes `status: 'ACTIVE'`; sends status + 4 fields | Implemented | `frontend/src/services/userService.ts:101` — `status: payload.status?.toUpperCase()`; `:102–105` sends address/department/position/note. Literal removed from `create()` (grep: no `status: 'ACTIVE'` in userService.ts) |
| 3 | `types/user.ts` UpdateUserPayload carries the 4 fields | Implemented | `frontend/src/types/user.ts:41–47` — `address?/department?/position?/note?` on `UpdateUserPayload`; also `status: Status` (required) + 4 optional fields on `CreateUserPayload` (`:36–45`) and 4 optional fields on `User` (`:9–12`) |
| 4 | Detail drawer shows the 4 fields | Implemented | `frontend/src/pages/UsersPage.tsx:631–634` — rows Địa chỉ/Phòng ban/Chức vụ/Ghi chú inserted after Số điện thoại, null → "—" (lean-spec §10.3 order) |
| 5 | `npm run build` succeeds | Verified | `npm run build` in `frontend/` → exit 0; `vite v8.1.5`, 4033 modules transformed, `✓ built in 1.09s`; `UsersPage-2j692Bbx.js` emitted (see Verification Evidence) |
| 6 | No backend files modified | Verified | Only 3 frontend files written: `UsersPage.tsx`, `userService.ts`, `types/user.ts` (+ this artifact) |

## Files Changed

| File | Change |
|---|---|
| `frontend/src/types/user.ts` | `User` + 4 optional fields; `CreateUserPayload` + required `status: Status` + 4 optional fields; `UpdateUserPayload` + 4 optional fields |
| `frontend/src/services/userService.ts` | `create()` sends `payload.status?.toUpperCase()` + 4 fields (hardcode `'ACTIVE'` removed, was :98); `update()` sends 4 fields; `mapUser()` maps 4 fields (`?? undefined`) |
| `frontend/src/pages/UsersPage.tsx` | Drawer form re-ordered to §10.1 oracle 1–11 (orgUnit moved above email; email+phone Row removed; only department+position remain paired); status Select rendered for both create and edit (moved out of `{editingUser && ...}` guard); `initialValues={{ status: 'active' }}`; address/department/position/note Form.Items (required-on-create only for department/position per D5); `openEditModal` pre-populates the 4 fields (AC-001-18); create/update payloads send status + 4 trimmed fields (blank → `undefined` per BR-001-20); detail rows + 4 fields after Số điện thoại (null → "—") |

## Business-Rule Compliance

- **BR-001-19 (status from form):** create payload sends `status: values.status` (form value `active`/`inactive`); service uppercases → `ACTIVE`/`INACTIVE` before POST. No `status: 'ACTIVE'` literal remains in the create path.
- **BR-001-20 (4 nullable profile fields):** payloads send `values.address?.trim() || undefined` etc. — blank/whitespace trimmed and omitted so backend stores NULL; `mapUser` reads them with `?? undefined` so detail renders "—" when absent.
- **BR-001-22 (naming/labels):** API identifiers English (`address`, `department`, `position`, `note`, `status`); all UI labels/messages Vietnamese with diacritics (Địa chỉ, Phòng ban, Chức vụ, Ghi chú, Trạng thái, "Vui lòng chọn trạng thái"…).
- **AGENTS.md input rule:** `.trim()` applied to username/fullName/email/phone/address/department/position/note in both payloads.

## UI Craft / Token Compliance

- Read `frontend/src/theme.ts` + `frontend/src/tokens.ts` before coding (mandatory). No hardcoded hex/spacing/font-size introduced.
- Inputs/Select: `borderRadius: radiusPill` (999) + `height: 40`; Form.Item `marginBottom: spaceFormField` (12px); TextArea `borderRadius: radiusPill` with natural height (design §6.3 allowance).
- Reused existing drawer/Form structure: `drawerProps`, `drawerTitleStyle`, `drawerCloseBtnStyle`, `drawerFooterStyle`, `primaryButtonStyle`, `outlineButtonStyle`, `labelProps()` (colors.sidebarBg/fontWeightBold/fontSizeMd), `detailRowStyle`/`detailLabelColStyle`/`detailValueStyle`, `OrgUnitTreeSelect` for the orgUnit field.
- No new tokens, no new classes, no new Layout/Sider/Menu.

## Verification Evidence

| Check | Command (workdir) | Exit Code | Result |
|---|---|---|---|
| Production build (gate) | `npm run build` (frontend/) | 0 | `vite v8.1.5`; `✓ 4033 modules transformed`; `✓ built in 1.09s`; emitted `dist/assets/UsersPage-2j692Bbx.js` (25.77 kB, gzip 8.03 kB). Only pre-existing chunk-size warning (>500 kB Home chunk), non-blocking |
| TypeScript typecheck (design-plan acceptance §9) | `npx tsc --noEmit` (frontend/) | 0 | No violations (pnpm unavailable on this machine; local `typescript@~6.0.2` used via npx) |

## State Coverage (form flows)

- **Create:** loading (submit button `loading={submitting}` + `Spin`), validation errors inline (required status / department / position, email type, phone pattern, max-lengths), success → mutation toast + list invalidate, reset via `form.resetFields()` (restores `status: 'active'` default).
- **Edit:** pre-populate all 9 visible fields incl. status + 4 profile fields; department/position not required on edit (D5); username/password hidden.
- **Detail:** read-only; 4 new rows with "—" fallback (colored `textSecondary` via existing row renderer).

## Known Limitations / Observations

- **Pre-existing lint findings (not introduced, not in gate):** biome `useExhaustiveDependencies` in the filter `useCallback`s (`UsersPage.tsx` filter area) and `noArrayIndexKey` on the detail-rows `.map(key={index})` — untouched code; line numbers shifted by this edit. `vite build`/`tsc` do not run biome.
- **Stale test file (pre-existing):** `frontend/src/services/userService.test.ts` targets a different API surface (`getAllUsers`/`createUser`/`lockAccount`…) that the current `userService` does not export — already failing before this change; out of scope (write surface limited to the 3 source files; acceptance suite not editable by this seat).
- **Approve flow preserved:** `UsersPage.tsx:248` (`changeStatusUser.mutateAsync({ status: 'ACTIVE' })`) is the out-of-scope phê duyệt flow, not the create path; design AC-001-12 only requires removing the literal from the create path (`userService.ts`/`UserService.java`).
- **Backend WO-01 in progress:** Java LSP reports `getAddress()/getDepartment()/…` undefined in `UserDetailResponse`/`UserResponse` — the parallel backend seat's entity/DTO work is mid-flight; read-only for this seat, out of scope.
- **R5 (pre-existing, out of scope):** frontend password rule min 8 vs backend DTO `@Size(min = 6)` — noted in design plan §11, untouched.
