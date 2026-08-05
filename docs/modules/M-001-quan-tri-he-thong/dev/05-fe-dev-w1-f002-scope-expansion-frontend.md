---
feature-id: F-002
stage: frontend-implementation
agent: engineering-frontend-developer
wave: 1
task: WO-02-frontend-group-list
verdict: Pass
last-updated: 2026-08-05
---

# Frontend Implementation Summary — WO-02 F-002 Scope Expansion

## Designer Spec Coverage

| Requirement | Status | Evidence |
|---|---|---|
| UI §10.6 — Đơn vị column in list table | Implemented | `organizationName` column added to DataTable after "Mã nhóm" |
| UI §10.7 — TreeSelect for Đơn vị in create form | Implemented | `antd` `TreeSelect` with org unit tree data from `organizationService.getTree()` |
| UI §10.7 — Mã nhóm read-only when editing | Implemented | `disabled={!!editingGroup}` on `code` Input |
| UI §10.7 — Đơn vị read-only when editing | Implemented | `disabled={!!editingGroup}` on TreeSelect |
| PATCH /lock toggle | Implemented | `handleLock` with confirm modal, calls `groupService.lock()` |
| AC-002-15 Khóa nhóm | Implemented | Row action shows "Khóa nhóm" when status=active |
| AC-002-16 Mở khóa nhóm | Implemented | Row action shows "Mở khóa nhóm" when status=inactive |
| UI §10.11 — Permissions path renamed | Implemented | `getRoles→getPermissions`, `updateRoles→updatePermissions`, paths `/roles→/permissions` |

## Component / Token Mapping

| UI Element | Existing Component/Token | Reused? | Notes |
|---|---|---|---|
| TreeSelect (Đơn vị) | `TreeSelect` from `antd` | ✅ | Pattern from `BeaconList.tsx` |
| List columns | `DataTable` from `components/list-view` | ✅ | Existing pattern |
| Form modal | `Modal` + `Form` from `antd` | ✅ | Existing GroupList pattern |
| Action icons: Lock/Unlock | `LockOutlined` / `UnlockOutlined` from `@ant-design/icons` | ✅ | New to this page |
| All styling tokens | `radiusPill`, `spaceFormField`, `actionPrimary`, `cardStyle`, etc. from `../../tokens` | ✅ | No hardcoded values |
| Status colors | `statusOperational`, `statusDraft`, `statusCritical` | ✅ | Existing pattern |
| Org unit data | `organizationService.getTree()` from `../../services/organizationService` | ✅ | Pattern from `BeaconList.tsx` |

## Files Changed

| File | Purpose |
|---|---|
| `frontend/src/services/groupService.ts` | Replace `/groups→/v1/groups`, add `lock()`, rename `getRoles→getPermissions`/`updateRoles→updatePermissions`, add `organizationId`+`organizationName` to `Group`/`CreateGroupPayload`/`UpdateGroupPayload`, map `organizationId`/`organizationName` in list mapper |
| `frontend/src/pages/groups/GroupList.tsx` | Add TreeSelect for organizationId, disable code+org in edit, organizationName column, lock/unlock row action, permission rename, org name in detail modal |

## Components Created or Modified

| Component | Status | States Covered | Tests |
|---|---|---|---|
| `GroupList.tsx` (page) | Modified | Loading (skeleton), Error (ErrorState), Empty (EmptyState), Data list, Create modal, Edit modal, Detail modal, Permission modal, Lock confirm modal | TypeScript compilation verified; manual smoke test required |
| `groupService.ts` (service) | Modified | API calls, response mapping, lock method | TypeScript compilation verified |

## Accessibility Compliance

| Requirement | Implementation | Verified |
|---|---|---|
| Form labels | `labelProps()` helper with consistent style | ✅ code review |
| Keyboard navigation | Modal focus management via antd defaults | ✅ inherited |
| Color contrast | Uses semantic tokens (`actionPrimary`, `textSecondary`) — no hardcoded hex | ✅ code review |
| Icons have labels | Lock/Unlock icons paired with Vietnamese text labels | ✅ |

## Tests Added or Updated

No automated tests were added (project uses `bun run build` for compilation; no test runner declared in frontend `package.json`). Manual smoke test checklist:

- [ ] Create group with TreeSelect → organizationId sent, success
- [ ] Edit group → code field disabled, organizationId disabled
- [ ] Lock/unlock group → confirm modal, status toggles, toast shown
- [ ] Permission modal → calls `/v1/groups/{id}/permissions` (GET + PUT)
- [ ] Organization name column visible in list

## Verification Evidence

| Check | Command | Exit Code | Scope |
|---|---|---|---|
| TypeScript | `npx tsc --noEmit` (from `frontend/`) | 0 | All frontend `.ts`/`.tsx` files |

## Known Limitations / Mismatches

- **Backend Java errors:** The backend `UserGroup.java` and `GroupService.java` have pre-existing compilation errors (`UUID cannot be resolved`, `getCode()`/`getName()` undefined) that are unrelated to these frontend changes. These are owned by WO-01.
- **TreeSelect data:** Org unit tree is fetched on mount via `organizationService.getTree()`. If the `/api/org-units/tree` endpoint is not available, the TreeSelect will show an empty dropdown.
- **`statusCritical` import:** Added to tokens import for potential lock/unlock status styling but not directly used in this iteration. Cleanup deferred to avoid unnecessary churn.
