---
module-id: M-001
module-name: Quản trị hệ thống
document: lean-spec
output-mode: lean
last-updated: 2026-08-05
---

# M-001: Quản trị hệ thống — Module Lean Spec

## 1. Business Goal

Quản trị toàn bộ hệ thống: tài khoản người dùng, phân quyền (vai trò, nhóm), cấu trúc tổ chức (đơn vị), log truy cập, tích hợp liên thông và biểu tượng bản đồ — bảo mật, kiểm toán và tuân thủ phân quyền.

## 2. Feature Summary

| ID | Name | Brief | BA Spec | Status |
|---|---|---|---|---|
| F-001 | Quản lý tài khoản người dùng | ✅ | ✅ | proposed |
| F-002 | Quản lý nhóm người dùng | ✅ | ✅ | proposed |
| F-003 | Quản lý đơn vị | ✅ | ✅ | proposed |
| F-004 | Quản lý kết nối liên thông | ✅ | ✅ | proposed |
| F-005 | Quản lý log truy cập | ✅ | ✅ | proposed |
| F-006 | Quản lý biểu tượng bản đồ | ✅ | ✅ | proposed |

## 3. F-002 Scope Expansion (gaps identified on reopen)

| # | Gap | Description |
|---|---|---|
| 1 | `/v1` prefix missing | Feature brief defines `/api/v1/groups…` but backend controller was implemented without the `/v1` base path — all group endpoints are off-route. |
| 2 | `PATCH /lock` not implemented | Brief specifies `PATCH /api/v1/groups/{id}/lock` (AC-002-15, AC-002-16) but only `PUT` exists; the dedicated lock/unlock endpoint is missing. |
| 3 | `organizationId` not enforced | `UserGroup` entity includes `organizationId` FK (Section 6.1) and data scope is per-org, but backend does not filter groups by caller's org unit. |
| 4 | Admin Cục data scope | F-002 brief Section 2.2 requires Admin Cục to see **full** data across all org units; current code only returns caller's org scope. |
| 5 | Missing permissions | `group:lock` and `group:read` referenced in AC-002-15/002-14 but not registered in `RolePermissionSeeder` — results in 403 on lock/unlock actions. |

## 4. Module Triage

| Question | Answer |
|---|---|
| Q1: Creates new domain elements? | Yes — UserAccount, Role, UserGroup, GroupMember, GroupHistory, AccessLog, MapSymbol (across F-001, F-002, F-005, F-006) |
| Q2: Affects system architecture? | Yes — RBAC, JWT, org-unit data scope, caching (OrgUnitCacheService) |
| Q3: Approach clear? | Partially — F-001/F-006 are CRUD refinements; F-002 expansion and F-004/F-005 are new integrations |
