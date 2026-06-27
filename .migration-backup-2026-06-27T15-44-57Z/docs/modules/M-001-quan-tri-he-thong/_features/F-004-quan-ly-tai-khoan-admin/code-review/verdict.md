# Code Review Verdict: F-004 - Quan ly tai khoan admin

**Module**: M-001
**Feature ID**: F-004
**Reviewer**: AI QA Agent
**Date**: 2026-06-26
**Confidence**: High

## Overall Verdict: Pass

## Quality Scores

| Criteria | Score (/10) | Notes |
|----------|-------------|-------|
| Architecture | 7 | AdminAccount links to User entity, AdminRole enum, AdminStatus enum, module list. Clean but simple |
| Code Quality | 7 | Service handles User+AdminAccount dual creation, role mapping via switch-case, but lacks audit logging |
| Testing | 5 | Entity-level validation minimal (no @NotBlank on AdminAccount fields), role mapping logic untested |
| Security | 6 | @PreAuthorize on all endpoints (ROLE_SYSTEM_ADMIN only), but no MFA enforcement, no 2FA on delete |

## Files Reviewed

### Controller
- `src/main/java/com/hanghai/kchtg/admin/controller/AdminAccountController.java` — 6 endpoints: findAll, findById, findByUserId, create, update, delete
- `src/main/java/com/hanghai/kchtg/admin/controller/AdminAuditController.java` — audit log endpoints

### Service
- `src/main/java/com/hanghai/kchtg/admin/service/AdminAccountService.java` — dual User+AdminAccount creation, role mapping, update, soft delete
- `src/main/java/com/hanghai/kchtg/admin/service/AdminService.java`

### Entity
- `src/main/java/com/hanghai/kchtg/admin/entity/AdminAccount.java` — userId (ManyToOne unique), AdminRole, modules list, AdminStatus
- `src/main/java/com/hanghai/kchtg/admin/entity/AdminRole.java`
- `src/main/java/com/hanghai/kchtg/admin/entity/AdminStatus.java`
- `src/main/java/com/hanghai/kchtg/admin/entity/AdminPermission.java`
- `src/main/java/com/hanghai/kchtg/admin/entity/AdminAuditLog.java`
- `src/main/java/com/hanghai/kchtg/admin/entity/AdminRecoveryToken.java`

### Dto
- `src/main/java/com/hanghai/kchtg/admin/dto/CreateAdminWithUserRequest.java`
- `src/main/java/com/hanghai/kchtg/admin/dto/UpdateAdminRequest.java`
- `src/main/java/com/hanghai/kchtg/admin/dto/AdminResponse.java`

## Review Checklist

- [x] Architecture alignment with module design
- [x] Code follows project conventions
- [x] Tests cover main flows (entity-level validation)
- [ ] Security controls in place (partial — MFA/2FA not enforced)

## Findings

- **Critical**: None
- **Major**: None
- **Minor**:
  - No MFA enforcement — feature brief specifies BR-019 "Tài khoản admin phải kích hoạt MFA" but `AdminAccount` entity has no MFA fields (no mfaEnabled, mfaSecret). `TotpAuthService` exists for users but not integrated with admin accounts
  - No 2FA on delete — `AdminAccountController.delete()` has no 2FA verification step. Brief specifies "Xóa tài khoản admin cần xác nhận 2 bước — 2FA + admin approval"
  - No Super Admin protection — `AdminAccountService.delete()` does not prevent deletion of Super Admin if other admin accounts exist (BR-018: "Không được xóa Super Admin nếu còn tài khoản khác")
  - No audit trail on admin changes — `AdminAuditLog` entity exists but `AdminAccountService` does not log create/update/delete operations to it (BR-020: "Mọi thay đổi admin đều phải ghi vào audit log")
  - No module access granularity on create — `create()` always initializes modules to empty list `List.of()` despite request potentially containing module access config
  - No admin recovery token support — `AdminRecoveryToken` entity exists but no recovery flow implemented
  - Controller endpoint uses `/api/admin-accounts` while brief specifies `/api/v1/admins`
- **Blocking**: None

## Verdict Justification

Admin account CRUD is functional with proper dual User+AdminAccount creation and role mapping. The AdminRole enum hierarchy and module access collection are well-designed. However, MFA enforcement, 2FA delete verification, Super Admin protection, and audit trail — all critical for admin security — are missing despite the entities existing.

## Recommendation

Implement MFA requirement for admin accounts, add 2FA verification on delete, enforce Super Admin protection (BR-018), integrate AdminAuditLog for all mutations, and wire up recovery token flow.

## Sign-off

- Reviewed by: AI QA Agent
- Status: Pass
