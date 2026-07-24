---
id: F-001
name: Quản lý tài khoản người dùng
slug: quan-ly-tai-khoan-nguoi-dung
module-id: M-001
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý tài khoản người dùng

## Description

Quản lý toàn bộ vòng đời tài khoản người dùng trong hệ thống, bao gồm tạo mới, chỉnh sửa thông tin, xóa mềm, khóa/mở khóa tài khoản, phân quyền theo vai trò (RBAC — Role-Based Access Control), đặt lại mật khẩu, và phê duyệt tài khoản đăng ký mới. Tính năng cung cấp giao diện quản lý tập trung cho tất cả người dùng hệ thống.

## Business Intent

Hệ thống cần cơ chế quản lý tài khoản người dùng an toàn và linh hoạt, cho phép các vai trò Quản trị hệ thống, Lãnh đạo và Chuyên viên thực hiện đầy đủ các thao tác tạo, sửa, xóa, khóa/mở khóa tài khoản theo quy trình nghiệp vụ được thiết định.

## Flow Summary

Người dùng tự đăng ký tài khoản qua form công khai → hệ thống tạo bản ghi chờ phê duyệt (PendingApproval) → Admin hoặc Admin-Operation xem danh sách đăng ký chờ → phê duyệt (tạo User + gán vai trò + gửi thông báo) hoặc từ chối (kèm lý do). Sau khi được phê duyệt, tài khoản được kích hoạt và người dùng có thể đăng nhập.

Admin hoặc Cán bộ tạo yêu cầu tài khoản mới cho người dùng → Lãnh đạo xem danh sách yêu cầu chờ duyệt → duyệt (kích hoạt tài khoản) hoặc từ chối. Trường hợp Lãnh đạo tự tạo tài khoản thì được phép tự duyệt luôn.

Quản trị hệ thống hoặc Lãnh đạo truy cập vào module Quản lý tài khoản từ sidebar chính → chọn thao tác tạo mới hoặc chỉnh sửa tài khoản hiện có → hệ thống xác thực quyền và kiểm tra tính hợp lệ của dữ liệu đầu vào (email unique, mật khẩu mạnh) → thực hiện thao tác CRUD → ghi nhận log audit → hiển thị thông báo thành công hoặc lỗi qua toast notification. Quy trình bao gồm: (1) tạo tài khoản với thông tin cơ bản và gán vai trò; (2) chỉnh sửa thông tin cá nhân hoặc phân quyền; (3) xóa mềm (không xóa cứng khi có dữ liệu liên quan); (4) khóa/mở khóa để ngăn/tiếp tục truy cập; (5) reset mật khẩu bằng admin hoặc tự động gửi link; (6) phê duyệt tài khoản đăng ký mới từ người dùng.

## Acceptance Criteria

- Tạo tài khoản người dùng mới thành công với đầy đủ thông tin (tên, email, mật khẩu, vai trò, đơn vị) và mật khẩu đáp ứng yêu cầu bảo mật (tối thiểu 8 ký tự, có chữ hoa, chữ thường, số)
- Phân quyền theo vai trò RBAC chính xác: mỗi vai trò (Admin, Lãnh đạo, Cán bộ, Cá nhân) chỉ có quyền truy cập phù hợp với phân cấp được quy định
- Khóa/Mở khóa tài khoản thành công: tài khoản bị khóa không thể đăng nhập, mọi session đang hoạt động bị vô hiệu ngay lập tức; tài khoản mở khóa có thể đăng nhập lại bình thường
- Tự động khóa sau 5 lần đăng nhập sai, tự động mở khóa sau 30 phút hoặc Admin mở thủ công
- Tìm kiếm và lọc danh sách người dùng theo tên, email, vai trò, trạng thái với kết quả phân trang chính xác
- Xóa mềm tài khoản không thành công khi tài khoản còn dữ liệu nghiệp vụ liên quan (phanhien, bao cao)
- Phê duyệt tài khoản đăng ký: admin xem danh sách chờ, phê duyệt (tạo user + kích hoạt + gán vai trò) hoặc từ chối (kèm lý do) — thao tác phê duyệt là atomic transaction
- Chống tự phê duyệt: admin không thể phê duyệt tài khoản đăng ký của chính mình

## In Scope

- Tạo tài khoản người dùng mới (tên, email, mật khẩu, vai trò, đơn vị)
- Chỉnh sửa thông tin tài khoản (tên, email, vai trò, đơn vị)
- Xóa tài khoản (cần xác nhận, không xóa nếu có dữ liệu liên quan)
- Khóa/Mở khóa tài khoản (ngăn/tiếp tục truy cập)
- Reset mật khẩu (tự động hoặc bằng admin)
- Quên mật khẩu: người dùng gửi email → nhận link reset → đặt mật khẩu mới
- Phân quyền theo vai trò (RBAC — Role-Based Access Control)
- Xem danh sách người dùng với bộ lọc (tên, email, vai trò, trạng thái)
- Tìm kiếm người dùng (theo tên hoặc email)
- Phân trang danh sách người dùng
- Tạo yêu cầu tài khoản mới: Admin/Cán bộ tạo yêu cầu → Lãnh đạo duyệt (Lãnh đạo tự tạo thì tự duyệt)
- Tạo yêu cầu tài khoản mới: Admin/Cán bộ tạo yêu cầu → Lãnh đạo duyệt (Lãnh đạo tự tạo thì tự duyệt)
- Duyệt/từ chối tài khoản đăng ký: admin xem danh sách chờ → phê duyệt (tạo User + gán vai trò + gửi thông báo) hoặc từ chối (kèm lý do)
- Chống tự phê duyệt: admin không thể duyệt tài khoản đăng ký của chính mình
- UI: Sidebar cố định, header avatar, table sticky header, toast notification, modal xác nhận

## Out of Scope

- Quản lý SSO/OAuth (tích hợp bên thứ ba)
- Quản lý Multi-Factor Authentication (MFA)
- Audit log cho hoạt động quản lý tài khoản (F-005 sẽ đảm nhận)
- Tự động provision từ danh bạ công ty

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Admin | Full access | Tạo, sửa, xóa, khóa/mở khóa, reset mật khẩu, phân quyền, duyệt tài khoản đăng ký |
| Lanh dao | View + Approve | Xem danh sách, duyệt yêu cầu tạo/xóa tài khoản từ Admin/Cán bộ; tự tạo tài khoản thì được tự duyệt |
| Can bo | View + Edit + Lock/Unlock (nếu được phân quyền) | Xem danh sách, chỉnh sửa thông tin, khóa/mở khóa (khi được gán quyền tương ứng) |
| Ca nhan | Self only | Chỉ xem và sửa thông tin cá nhân |
| Admin-Operation | Full (CRUD + Approve + Lock/Unlock) | Quản lý tài khoản admin và phê duyệt đăng ký trong phạm vi vận hành |

## Entities

- **UserAccount**: id(BIGINT PK), username(VARCHAR 50 UNIQUE NOT NULL), email(VARCHAR 100 UNIQUE NOT NULL), passwordHash(VARCHAR 255 NOT NULL), roleId(BIGINT FK→Role), organizationId(BIGINT FK→Organization), status(VARCHAR 20), createdAt(TIMESTAMP), updatedAt(TIMESTAMP), deletedAt(TIMESTAMP NULL), lastLoginAt(TIMESTAMP NULL)
- **Role**: id(BIGINT PK), name(VARCHAR 50 NOT NULL), code(VARCHAR 30 UNIQUE NOT NULL), description(TEXT), permissions(JSON), isSystem(BOOLEAN DEFAULT false)
- **Organization**: id(BIGINT PK), name(VARCHAR 100 NOT NULL), code(VARCHAR 30 UNIQUE NOT NULL), parentId(BIGINT FK→Organization), type(VARCHAR 30), status(VARCHAR 20), coefficient(DECIMAL 5,2), createdAt(TIMESTAMP), updatedAt(TIMESTAMP)
- **UserRole**: id(BIGINT PK), userId(BIGINT FK→UserAccount), roleId(BIGINT FK→Role), assignedBy(BIGINT FK→UserAccount), assignedAt(TIMESTAMP), expiresAt(TIMESTAMP NULL)
- **PasswordResetToken**: id(BIGINT PK), userId(BIGINT FK→UserAccount), token(VARCHAR 255 NOT NULL), expiresAt(TIMESTAMP NOT NULL), usedAt(TIMESTAMP NULL), createdAt(TIMESTAMP)
- **UserStatusLog**: id(BIGINT PK), userId(BIGINT FK→UserAccount), previousStatus(VARCHAR 20), newStatus(VARCHAR 20), changedBy(BIGINT FK→UserAccount), changedAt(TIMESTAMP), reason(TEXT)
- **PendingApproval**: id(BIGINT PK), username(VARCHAR 50), email(VARCHAR 100), passwordHash(VARCHAR 255), requestedRoleCode(VARCHAR 30), status(VARCHAR 20 — pending/approved/rejected), approvedBy(BIGINT FK→UserAccount), rejectionReason(TEXT), createdAt(TIMESTAMP), updatedAt(TIMESTAMP)
- **ApprovalNotification**: id(BIGINT PK), pendingApprovalId(BIGINT FK→PendingApproval), recipientType(VARCHAR 20), notificationType(VARCHAR 20), sent(BOOLEAN DEFAULT false), createdAt(TIMESTAMP)
- **UserGroup**: id(BIGINT PK), name(VARCHAR 100 NOT NULL), code(VARCHAR 30 UNIQUE NOT NULL), groupType(VARCHAR 30), status(VARCHAR 20), createdAt(TIMESTAMP), updatedAt(TIMESTAMP)
- **GroupMember**: id(BIGINT PK), groupId(BIGINT FK→UserGroup), userId(BIGINT FK→UserAccount), joinedBy(BIGINT FK→UserAccount), joinedAt(TIMESTAMP)
- **AdminAccount**: id(BIGINT PK), username(VARCHAR 50 UNIQUE NOT NULL), passwordHash(VARCHAR 255 NOT NULL), adminType(VARCHAR 30), moduleAccess(JSON), status(VARCHAR 20), mfaEnabled(BOOLEAN DEFAULT false), lastLoginAt(TIMESTAMP)
- **AccessLog**: id(BIGINT PK), userId(BIGINT FK→UserAccount), username(VARCHAR 50), action(VARCHAR 30), targetResource(VARCHAR 100), ipAddress(VARCHAR 45), userAgent(TEXT), responseCode(INT), duration_ms(INT), status(VARCHAR 20), createdAt(TIMESTAMP)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/users | Danh sách người dùng (phân trang) | JWT |
| GET | /api/v1/users/{id} | Chi tiết người dùng | JWT |
| POST | /api/v1/users | Tạo người dùng mới | Admin |
| PUT | /api/v1/users/{id} | Chỉnh sửa người dùng | Admin, Can bo |
| DELETE | /api/v1/users/{id} | Xóa người dùng | Admin |
| PUT | /api/v1/users/{id}/lock | Khóa/mở khóa tài khoản | Admin, Can bo |
| POST | /api/v1/users/{id}/reset-password | Reset mật khẩu | Admin |
| GET | /api/v1/roles | Danh sách vai trò | JWT |
| POST | /api/v1/roles | Tạo vai trò mới | Admin |
| PUT | /api/v1/roles/{id} | Chỉnh sửa vai trò | Admin |
| DELETE | /api/v1/roles/{id} | Xóa vai trò | Admin |
| GET | /api/v1/organizations | Danh sách đơn vị | JWT |
| POST | /api/v1/organizations | Tạo đơn vị mới | Admin |
| GET | /api/v1/groups | Danh sách nhóm | JWT |
| POST | /api/v1/groups | Tạo nhóm mới | Admin |
| POST | /api/v1/groups/{id}/members | Thêm thành viên vào nhóm | Admin |
| DELETE | /api/v1/groups/{id}/members/{userId} | Xóa thành viên khỏi nhóm | Admin |
| GET | /api/v1/admins | Danh sách tài khoản admin | Super Admin |
| POST | /api/v1/admins | Tạo tài khoản admin | Super Admin |
| GET | /api/v1/logs | Danh sách log truy cập | Admin, Security |
| GET | /api/v1/logs/export | Xuất log CSV | Admin |
| GET | /api/v1/approvals/pending | Danh sách đăng ký chờ phê duyệt (phân trang) | Admin, Admin-Operation |
| POST | /api/v1/approvals/{id}/approve | Phê duyệt tài khoản đăng ký | Admin, Admin-Operation |
| POST | /api/v1/approvals/{id}/reject | Từ chối tài khoản đăng ký | Admin, Admin-Operation |
| POST | /api/v1/users/pending | Nộp đơn đăng ký tài khoản (tạo bản ghi chờ phê duyệt) | Public (rate-limited) |
| POST | /api/v1/auth/forgot-password | Yêu cầu link đặt lại mật khẩu | Public (rate-limited) |
| POST | /api/v1/auth/reset-password/{token} | Đặt lại mật khẩu bằng token | Public (rate-limited) |

## Architecture Notes

- **Pattern**: Repository Pattern (Spring Data JPA) cho data access
- **Auth**: Spring Security + JWT (Access token 30 phút, Refresh token 7 ngày)
- **RBAC**: Role-based với permission matrix (JSON column trong Role table)
- **Soft Delete**: deleted_at TIMESTAMP NULL trên tất cả bảng (không xóa cứng)
- **Pagination**: Spring Pageable → Page<T> với default 20 items/page, max 100
- **Validation**: Jakarta Validation (@NotNull, @Email, @Size) trên DTO
- **Audit**: @CreatedDate, @LastModifiedBy từ Spring Data JPA

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001 | Email phải unique trong hệ thống | Create/Update User | UC-001 |
| BR-002 | Mật khẩu tối thiểu 8 ký tự, có chữ hoa, chữ thường, số | Create/Update User | UC-001 |
| BR-003 | Không được xóa tài khoản có dữ liệu liên quan (phanhien, bao cao) | Delete User | UC-003 |
| BR-004 | Tài khoản bị khóa không được đăng nhập | Login | UC-005 |
| BR-005 | Chỉ Admin mới có quyền phân quyền cho vai trò khác | Role Assignment | UC-006 |
| BR-006 | Token reset mật khẩu hết hạn sau 1 giờ | Password Reset | UC-007 |
| BR-007 | Tài khoản tự động khóa sau 5 lần đăng nhập sai | Login Security | UC-005 |
| BR-008 | Admin được phân quyền truy cập module cụ thể (Admin: tất cả, Lanh dao: phân hệ của mình, Ca nhan: không) | Phân quyền | URD III.3.2 |
| BR-010 | Khi admin phê duyệt tài khoản đăng ký, user account được kích hoạt và phân quyền theo vai trò đã chỉ định — toàn bộ thao tác là atomic transaction | Phê duyệt | URD III.3.2 |
| BR-011 | Admin có thể xem danh sách tài khoản đăng ký chờ xử lý, từ chối với lý do cụ thể; không thể tự phê duyệt tài khoản của chính mình | Phê duyệt | URD III.3.2 |
| BR-012 | Tài khoản tự động khóa sau 5 lần đăng nhập sai; tự động mở khóa sau 30 phút hoặc Admin mở khóa thủ công | Login Security | BR-001-02 |
| BR-013 | Khi khóa tài khoản, mọi session đang hoạt động của user đó bị vô hiệu hóa ngay lập tức | Khóa tài khoản | BR-001-05 |
| BR-014 | Khi tạo hoặc reset mật khẩu, mật khẩu mới phải khác 3 mật khẩu gần nhất của user | Password Reset | BR-001-06 |
| BR-015 | Mọi thay đổi trạng thái tài khoản (active/blocked) phải được ghi vào UserStatusLog kèm lý do | Lock/Unlock | BR-001-07 |
| BR-016 | User không thể tự thay đổi vai trò (role) của chính mình; chỉ Admin được phép gán/hủy vai trò | Role Assignment | BR-001-08 |

## Testing Strategy

- Unit tests: Password validation, RBAC permission matrix, token expiry, approval atomicity, password history (BR-014), lockout timer (BR-012)
- Integration tests: CRUD UserAccount with role and organization associations, approval workflow (submit → approve → verify user created), session invalidation on lock (BR-013), UserStatusLog audit (BR-015)
- E2E tests: Create user → assign role → login → verify permissions; Self-registration → admin approve → login → role verification; auto-lockout after 5 failed attempts → auto-unlock after 30 min (BR-012)
- UI tests: Sidebar responsive, toast notifications, modal confirmations, pagination, search, filter, approval queue

## UI Fields Specification

### 1. Màn hình danh sách người dùng (User List)

| # | Cột | Data Index | Width | Sortable | Align | Ghi chú |
|---|---|---|---|---|---|---|
| 1 | STT | — | 60px | No | Center | Số thứ tự tính theo trang: `(page-1)*pageSize + index + 1` |
| 2 | Họ và tên | fullName | 200px | Yes | Left | In đậm; click để mở chi tiết |
| 3 | Tên đăng nhập | username | 150px | Yes | Left | — |
| 4 | Email | email | 200px | Yes | Left | — |
| 5 | Vai trò | roleName | 180px | Yes | Center | Hiển thị badge màu theo role |
| 6 | Đơn vị | orgUnitName | 200px | Yes | Left | Trống → hiển thị "—" |
| 7 | Đăng nhập cuối | lastLoginAt | 170px | Yes | Center | Format `DD/MM/YYYY HH:mm`; chưa đăng nhập → "Chưa đăng nhập" |
| 8 | Trạng thái | status | 140px | Yes | Center | Badge: `active`=xanh lá, `locked`=đỏ, `inactive`=xám |
| 9 | Hành động | — | 100px | No | Center | Dropdown: Sửa, Khóa/Mở khóa, Xóa (theo permission). Với tài khoản pending: hiển thị Phê duyệt, Từ chối. |

**FilterBar:**

| Field | Type | Ghi chú |
|---|---|---|
| Tìm kiếm | Input text | Tìm theo tên hoặc email |
| Vai trò | Select dropdown | Lọc theo role |
| Trạng thái | Select dropdown | active / locked / inactive |

**StatusTabs:** Tất cả (tổng), Hoạt động (count), Đã khóa (count), Không hoạt động (count), Chờ phê duyệt (count)

### 2. Modal tạo/sửa tài khoản (Create/Edit User)

| # | Field | Field Name | Type | Required | Validation | Placeholder | Ghi chú |
|---|---|---|---|---|---|---|---|
| 1 | Tên đăng nhập | username | Input text | ✅ (tạo) / ❌ (sửa) | 3-50 ký tự, chỉ chữ thường + số + gạch dưới | `nguyen_van_a` | Chỉ hiện khi tạo mới |
| 2 | Họ và tên | fullName | Input text | ✅ | 2-100 ký tự | `Nguyễn Văn A` | — |
| 3 | Email | email | Input email | ✅ | Định dạng email; unique trong hệ thống (BR-001) | `example@domain.com` | — |
| 4 | Số điện thoại | phone | Input text | ❌ | 10-11 chữ số nếu nhập | `0912345678` | — |
| 5 | Mật khẩu | password | Input.Password | ✅ (tạo) / ❌ (sửa) | ≥8 ký tự, chữ hoa + chữ thường + số (BR-002); strength meter | `••••••••` | Chỉ hiện khi tạo mới |
| 6 | Vai trò | roleId | Select dropdown | ✅ | Phải chọn 1 role | — | Danh sách từ API `/roles` |
| 7 | Đơn vị | orgUnitId | Select dropdown (searchable) | ❌ | — | — | Danh sách từ API `/organizations` |
| 8 | Trạng thái | status | Select | ❌ (tạo) / ✅ (sửa) | active / inactive (tạo mới mặc định active) | — | Chỉ hiện khi sửa |

**Modal footer:** [Hủy] [Lưu] — nút Lưu disabled khi form có lỗi; hiển thị loading khi đang submit.

### 3. Modal khóa/mở khóa tài khoản (Lock/Unlock)

| # | Field | Field Name | Type | Required | Validation | Placeholder | Ghi chú |
|---|---|---|---|---|---|---|---|
| 1 | Lý do | reason | TextArea | ✅ | Tối thiểu 10 ký tự | `Nhập lý do khóa/mở khóa...` | Ghi vào UserStatusLog (BR-015) |

**Modal footer:** [Hủy] [Khóa] (danger) hoặc [Mở khóa] (primary). Hiển thị tên người dùng trong nội dung modal.

### 4. Modal xác nhận xóa (Delete Confirmation)

Nội dung: `Bạn có chắc chắn muốn xóa người dùng "{fullName}"? Hành động này không thể hoàn tác.`

**Modal footer:** [Hủy] [Xóa] (danger).

### 5. Màn hình quên mật khẩu (Forgot Password)

| # | Field | Field Name | Type | Required | Validation | Placeholder | Ghi chú |
|---|---|---|---|---|---|---|---|
| 1 | Email đăng ký | email | Input email | ✅ | Định dạng email | `example@domain.com` | Rate-limited: 3 lần/15 phút |

Sau khi gửi: hiển thị màn hình success + message "Đã gửi link reset về email". Nếu email không tồn tại: vẫn hiện success (chống enumeration).

### 6. Màn hình đặt lại mật khẩu (Reset Password)

| # | Field | Field Name | Type | Required | Validation | Placeholder | Ghi chú |
|---|---|---|---|---|---|---|---|
| 1 | Mật khẩu mới | newPassword | Input.Password | ✅ | ≥8 ký tự, chữ hoa + chữ thường + số (BR-002); khác 3 mật khẩu gần nhất (BR-014) | `Mật khẩu mới` | Có strength meter realtime: Yếu (<40%) / Trung bình (40-80%) / Mạnh (>80%) |
| 2 | Xác nhận mật khẩu | confirmPassword | Input.Password | ✅ | Phải khớp với `newPassword` | `Xác nhận mật khẩu mới` | — |

Token từ URL (`/reset-password/:token`); token hết hạn sau 1 giờ (BR-006); token đã dùng không dùng lại được.

### 7. Modal phê duyệt/từ chối (Approve/Reject)

**Phê duyệt:**

| # | Field | Field Name | Type | Required | Validation | Ghi chú |
|---|---|---|---|---|---|---|
| 1 | Ghi chú | note | TextArea | ❌ | — | Ghi chú nội bộ |
| 2 | Nút Phê duyệt | — | Button | — | — | Tạo User với vai trò và đơn vị theo thông tin đăng ký; atomic transaction |

Chống tự phê duyệt: nếu approver có email trùng với email đăng ký → từ chối + message "Không thể tự phê duyệt".

**Từ chối:**

| # | Field | Field Name | Type | Required | Validation | Placeholder |
|---|---|---|---|---|---|---|
| 1 | Lý do từ chối | reason | TextArea | ✅ | Tối thiểu 10 ký tự | `Nhập lý do từ chối...` |

### 9. Màn hình xem chi tiết tài khoản (User Detail)

Hiển thị khi click vào tên người dùng từ danh sách. Layout dạng card với các nhóm thông tin:

**Thông tin tài khoản:** Tên đăng nhập, Họ và tên, Email, Số điện thoại, Vai trò (badge), Đơn vị, Trạng thái (badge), Ngày tạo, Đăng nhập cuối.

**Thanh thao tác (theo phân quyền và trạng thái):**

| Nút | Điều kiện hiển thị |
|---|---|
| Sửa | Có quyền `user.edit` |
| Khóa/Mở khóa | Có quyền `user.lock` |
| Xóa | Có quyền `user.delete` |
| Phê duyệt | Trạng thái = pending VÀ có quyền phê duyệt |
| Từ chối | Trạng thái = pending VÀ có quyền phê duyệt |
| Quay lại | Luôn hiển thị |

### Quy ước chung

- **Form layout**: vertical, label đậm (`fontWeightBold`), `marginBottom: spaceFormField` (12px) cho Form.Item
- **Input/Select**: `borderRadius: radiusPill` (999px), `height: 40px`
- **Validation**: realtime (khi blur), error message hiển thị dưới field
- **Submit button**: disabled khi form có lỗi, loading khi đang submit, toast notification khi thành công/thất bại
- **Modal footer**: [Hủy] outlined + [Submit] primary, cả hai pill radius
- **Quyền (permission-based)**: Sửa=`user.edit`, Khóa/Mở khóa=`user.lock`, Reset mật khẩu=`user.reset_password`, Xóa=`user.delete`, Duyệt=`approval.approve`
