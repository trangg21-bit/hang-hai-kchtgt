---
status: proposed
last-updated: 2026-06-17T03:23:16Z
---
---
id: F-004
name: Quan ly tai khoan admin
slug: quan-ly-tai-khoan-admin
module-id: M-001
status: done
classification: local
priority: high
created: 2026-06-16T04:40:32Z
last-updated: 2026-06-17T01:35:44Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quan ly tai khoan admin

## Description

Quan ly tai khoan admin 3 muc: thuong, su dung, van hanh

## Business Intent

Quan tri he thong - Tao, phe duyet, khoa, phan quyen admin

## Flow Summary

Quan tri he thong - Tao, phe duyet, khoa, phan quyen admin

## Acceptance Criteria

- Quan ly toan bo tai khoan admin
- Phan quyen theo muc

## In Scope

- Tạo tài khoản admin đặc biệt (super-admin, system-admin)
- Chỉnh sửa quyền admin (mật khẩu cấp cao, bypass permissions)
- Xóa tài khoản admin (cần xác nhận 2 bước — 2FA + admin approval)
- Lịch sử thay đổi admin (audit trail)
- Khóa/Mở khóa tài khoản admin (ngăn truy cập tức thì)
- Phân quyền admin theo module (fine-grained admin access)
- Xem danh sách tài khoản admin với bộ lọc (tên, module, trạng thái)
- Tìm kiếm tài khoản admin (theo tên hoặc module)
- Phân trang danh sách
- UI: Sidebar cố định, header avatar, table sticky header, toast notification, modal xác nhận 2 bước

## Out of Scope

- SSO cho tài khoản admin
- Tự động phân quyền admin theo cơ cấu tổ chức
- Passwordless login cho admin

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Super Admin | Full system access | Toàn quyền hệ thống, không bị giới hạn |
| System Admin | Module-level access | Quản lý module cụ thể, không can thiệp hệ thống |
| Security Admin | Audit + Security only | Xem audit log, quản lý bảo mật, không sửa dữ liệu nghiệp vụ |
| Regular Admin | View + Self | Chỉ xem và quản lý tài khoản của mình |

## Entities

- **AdminAccount**: id(BIGINT PK), username(VARCHAR 50 UNIQUE NOT NULL), email(VARCHAR 100 UNIQUE NOT NULL), passwordHash(VARCHAR 255 NOT NULL), adminType(VARCHAR 30 NOT NULL), moduleAccess(JSON), status(VARCHAR 20), mfaEnabled(BOOLEAN DEFAULT false), mfaSecret(VARCHAR 255 NULL), lastLoginAt(TIMESTAMP NULL), createdAt(TIMESTAMP), updatedAt(TIMESTAMP), deletedAt(TIMESTAMP NULL)
- **AdminPermission**: id(BIGINT PK), adminId(BIGINT FK→AdminAccount), moduleId(VARCHAR 50 NOT NULL), permissions(JSON NOT NULL), grantedBy(BIGINT FK→AdminAccount), grantedAt(TIMESTAMP), expiresAt(TIMESTAMP NULL)
- **AdminAuditLog**: id(BIGINT PK), adminId(BIGINT FK→AdminAccount), action(VARCHAR 50 NOT NULL), target(VARCHAR 100), details(JSON), ipAddr(VARCHAR 45), userAgent(TEXT), performedAt(TIMESTAMP)
- **AdminRecoveryToken**: id(BIGINT PK), adminId(BIGINT FK→AdminAccount), token(VARCHAR 255 NOT NULL), expiresAt(TIMESTAMP NOT NULL), usedAt(TIMESTAMP NULL), createdAt(TIMESTAMP)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/admins | Danh sách tài khoản admin | Super Admin |
| GET | /api/v1/admins/{id} | Chi tiết tài khoản admin | Super Admin |
| POST | /api/v1/admins | Tạo tài khoản admin | Super Admin |
| PUT | /api/v1/admins/{id} | Chỉnh sửa tài khoản admin | Super Admin |
| DELETE | /api/v1/admins/{id} | Xóa tài khoản admin | Super Admin (2FA required) |
| PUT | /api/v1/admins/{id}/lock | Khóa/mở khóa admin | Super Admin |
| POST | /api/v1/admins/{id}/mfa/setup | Kích hoạt MFA | System Admin |
| POST | /api/v1/admins/{id}/mfa/disable | Tắt MFA | Super Admin |
| GET | /api/v1/admins/audit | Audit log của admin | Security Admin |
| GET | /api/v1/users | Danh sách người dùng | JWT |
| GET | /api/v1/groups | Danh sách nhóm | JWT |
| GET | /api/v1/roles | Danh sách vai trò | JWT |
| GET | /api/v1/connections | Danh sách kết nối liên thông | Admin |

## Architecture Notes

- **Pattern**: Repository Pattern (Spring Data JPA) + Strategy Pattern cho MFA
- **Auth**: Spring Security + JWT với Admin-specific authentication filter
- **MFA**: TOTP (RFC 6238) — Google Authenticator/FreeOTP compatible
- **RBAC**: Role hierarchy (Super Admin > System Admin > Security Admin)
- **Audit Trail**: @PrePersist + @PreUpdate + @PostPersist để tự động ghi log
- **2FA**: Token 2FA khi xóa admin, yêu cầu Super Admin + 2FA approval
- **Soft Delete**: deleted_at TIMESTAMP NULL, không xóa cứng
- **Pagination**: Spring Pageable → Page<T> với default 20, max 100

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-018 | Không được xóa Super Admin nếu còn tài khoản khác | Delete Admin | UC-015 |
| BR-019 | Tài khoản admin phải kích hoạt MFA | Login Security | UC-016 |
| BR-020 | Mọi thay đổi admin đều phải ghi vào audit log | Audit | UC-017 |
| BR-021 | Chỉ Super Admin mới có quyền tạo Super Admin mới | Role Hierarchy | UC-016 |
| BR-022 | Token recovery hết hạn sau 30 phút | Password Recovery | UC-018 |
| BR-023 | Admin bị khóa phải được 2 admin khác xác nhận mở khóa | Account Unlock | UC-019 |

## Testing Strategy

- Unit tests: MFA enforcement, super-admin protection, audit log writing
- Integration tests: CRUD AdminAccount with permission matrix
- E2E tests: Create admin → assign module → verify access → disable admin
- UI tests: 2FA modal, responsive sidebar, sticky header, toast notifications, pagination
