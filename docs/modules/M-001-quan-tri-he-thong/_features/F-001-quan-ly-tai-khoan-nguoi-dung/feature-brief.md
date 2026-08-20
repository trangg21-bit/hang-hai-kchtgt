---
id: F-001
name: Quản lý tài khoản người dùng
slug: quan-ly-tai-khoan-nguoi-dung
module-id: M-001
status: done
classification: local
priority: high
created: 2024-06-01
last-updated: 2026-08-19
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: F-001 Quản lý tài khoản người dùng

**Tài liệu:** BA Feature Brief  
**Feature:** F-001  
**Module:** M-001 — Quản trị hệ thống  
**Người viết:** Business Analyst  
**Ngày cập nhật:** 2026-08-19  

---

## 1. Mô tả ngắn

**F-001 Quản lý tài khoản người dùng** là module quản lý toàn bộ vòng đời của một tài khoản trong hệ thống. Bao gồm: Tạo mới, Chỉnh sửa thông tin, Xem chi tiết, Khóa/Hủy kích hoạt (không xóa) và Quản lý quyền truy cập động.

Module này là nền tảng bắt buộc cho mọi hoạt động hệ thống — không có tài khoản người dùng thì tất cả các module nghiệp vụ khác (F-002 đến F-006) không thể vận hành.

---

## 2. Trường dữ liệu

### 2.1. Form Tạo mới tài khoản (9 trường)

Form tạo tài khoản gồm **09 trường** nhập liệu, tuân thủ thứ tự bắt buộc sau:

| STT | Tên Trường (Hiển thị) | Field Name (API/DB) | Loại ĐK | Bắt buộc | Giá trị mặc định | Ghi chú |
|---|---|---|---|---|---|---|
| 1 | **Đơn vị trực thuộc** | `orgUnitId` | TreeSelect | ✅ Có | — | Chọn từ cây đơn vị phân cấp (OrgUnitTreeSelect). |
| 2 | **Email** | `email` | Input email | ✅ Có | — | **Đóng vai trò là tên đăng nhập** (username). Phải unique. |
| 3 | **Họ và tên** | `fullName` | Input text | ✅ Có | — | Tối đa 200 ký tự. |
| 4 | **Số điện thoại** | `phone` | Input text | ❌ Không | — | 10-11 chữ số nếu nhập. |
| 5 | **Địa chỉ** | `address` | Input text | ❌ Không | — | Tối đa 255 ký tự. |
| 6 | **Phòng ban** | `department` | Input text | ✅ Có | — | Tối đa 100 ký tự. |
| 7 | **Chức vụ** | `position` | Input text | ❌ Không | — | Tối đa 100 ký tự. |
| 8 | **Trạng thái** | `status` | Select | ✅ Có | Kích hoạt | Chọn: **Kích hoạt** (Active) hoặc **Hủy kích hoạt** (Inactive). |
| 9 | **Ghi chú** | `note` | TextArea | ❌ Không | — | Tối đa 500 ký tự. |

> **Quy tắc Mật khẩu:** Không có trường nhập mật khẩu trên form tạo. Hệ thống tự động gán mật khẩu mặc định là `"Asdqwe@123"` cho tài khoản mới.

### 2.2. Trường dữ liệu khi Chỉnh sửa (Edit)

Sau khi tạo, người dùng có quyền `user:manage` hoặc chính tài khoản đó có thể chỉnh sửa:
*   **Trường được sửa:** Họ và tên, Điện thoại, Địa chỉ, Phòng ban, Chức vụ, Ghi chú, Trạng thái (Active/Inactive).
*   **Trường KHÔNG được sửa:** Đơn vị trực thuộc, Email (Username), Mật khẩu. (Nếu cần thay đổi đơn vị hoặc email, bắt buộc tạo tài khoản mới).

---

## 3. Trạng thái và phê duyệt

### 3.1. Các trạng thái tài khoản
Hệ thống quản lý tài khoản theo các trạng thái sau (Enum `UserStatus`):
*   **ACTIVE (Kích hoạt):** Tài khoản hoạt động bình thường.
*   **INACTIVE (Hủy kích hoạt):** Tài khoản bị khóa tạm thời, không đăng nhập được.
*   **LOCKED:** Tài khoản bị khóa do vi phạm bảo mật (ví dụ: đăng nhập sai quá 5 lần).
*   **PENDING_APPROVAL:** Chờ phê duyệt (áp dụng cho trường hợp Tự đăng ký - F-271).

### 3.2. Quy trình phê duyệt
*   **Admin tạo mới:** Tài khoản được **kích hoạt trực tiếp ngay lập tức** (Trạng thái `ACTIVE`). Không cần bất kỳ bước phê duyệt nào từ Lãnh đạo.
*   **Người dùng tự đăng ký (F-271):** Tài khoản sinh ra ở trạng thái `PENDING_APPROVAL`. Cần người có quyền `user:approve` xem xét và Phê duyệt/Từ chối.

---

## 4. Quy tắc và phân quyền riêng

### 4.1. Phân quyền động (Dynamic Permissions)
Hệ thống **không sử dụng Vai trò cố định (Role-based)** nữa. Quyền được gán động dựa trên cơ chế `<resource>:<action>`.
*   **Gán trực tiếp cho Tài khoản:** Gán từng quyền cụ thể (ví dụ: `user:manage`, `user:read`) cho tài khoản cá nhân.
*   **Gán cho Nhóm tài khoản:** Tạo nhóm → gán quyền cho nhóm → thêm người vào nhóm. Quyền của tài khoản = Quyền gán riêng + Quyền của nhóm.
*   **Admin Cục:** Tài khoản có quyền `user:manage` được gán thêm designation Admin Cục, cho phép xem các metadata nhạy cảm (người tạo, người sửa, thời gian tạo/sửa).

### 4.2. Quy tắc nghiệp vụ (Business Rules)

| ID | Tên Quy Tắc | Mô Tả Chi Tiết |
|---|---|---|
| **BR-001** | **Tính duy nhất** | Email và Tên đăng nhập phải duy nhất toàn hệ thống. |
| **BR-002** | **Chính sách mật khẩu** | Khi tự đặt lại mật khẩu (Quên mật khẩu), mật khẩu bắt buộc ≥ 8 ký tự, có chữ HOA, chữ thường, số và ký tự đặc biệt. |
| **BR-003** | **Không xóa tài khoản** | **Tài khoản không bao giờ bị xóa (delete) khỏi hệ thống.** Chỉ được thay đổi trạng thái sang Hủy kích hoạt (Inactive) hoặc Locked để phục vụ việc kiểm toán (Audit). |
| **BR-004** | **Bảo mật đăng nhập** | Tự động khóa (Locked) tài khoản nếu đăng nhập sai mật khẩu 5 lần liên tiếp. Tự mở khóa sau 30 phút hoặc Admin mở thủ công. |
| **BR-005** | **Quên mật khẩu** | Admin **KHÔNG** có thao tác "Đặt lại mật khẩu" cho user khác. Quy trình là: Người dùng tự ấn "Quên mật khẩu" → Hệ thống gửi email link đặt lại mật khẩu → Người dùng tự thực hiện. |
| **BR-006** | **Token đặt lại mật khẩu** | Link đặt lại mật khẩu trong email chỉ có hiệu lực tối đa 1 giờ. |
| **BR-007** | **Mật khẩu mặc định** | Tài khoản do Admin tạo mới sẽ sử dụng mật khẩu hệ thống gán sẵn là `"Asdqwe@123"`. |
| **BR-008** | **Nhật ký thay đổi trạng thái** | Mọi lần thay đổi trạng thái tài khoản (Active, Inactive, Locked) phải được ghi lại nhật ký vào bảng `UserStatusLog` (ai thay đổi, lúc nào, lý do). |

---

## 5. Điểm khác biệt so với mẫu chung

Các màn hình chuẩn của hệ thống được quy định tại 2 file:
*   📂 **Màn hình danh sách:** `docs/conventions/list-screen-ui-standard.md`
*   📂 **Form & Popup:** `docs/conventions/form-and-list-patterns.md`

F-001 tuân thủ các chuẩn trên, nhưng có các **điểm khác biệt** sau Dev cần lưu ý:

| STT | Chuẩn hệ thống (Reference) | Điểm khác biệt tại F-001 |
|---|---|---|
| 1 | **Màn hình danh sách** (`list-screen-ui-standard.md`) | **Tìm kiếm tách đôi:** Khác với 1 ô tìm kiếm chuẩn, F-001 có 2 ô tìm kiếm riêng biệt (1 ô cho Email/Username, 1 ô cho Họ tên). |
| 2 | **Form tạo** (`form-and-list-patterns.md`) | **Thay đổi thứ tự trường:** Chuyển "Đơn vị trực thuộc" lên đầu (STT 1) và "Email" lên STT 2. |
| 3 | **Form tạo** (`form-and-list-patterns.md`) | **Không có trường mật khẩu:** Không có ô nhập password tay, hệ thống tự gán mật khẩu mặc định. |
| 4 | **Hành động xóa** | **Không có nút Xóa:** Thay vì xóa vĩnh viễn, F-001 dùng nút "Hủy kích hoạt" hoặc "Khóa" để chỉ thay đổi trạng thái. |
| 5 | **Giao diện Modal** | **Bắt buộc nhập lý do:** Modal Khóa/Hủy kích hoạt bắt buộc phải có trường "Lý do" (tối thiểu 10 ký tự) để lưu vào `UserStatusLog`. |
| 6 | **Nút tạo mới Header** | **Đặt tên theo thực thể:** Sử dụng nhãn **"Thêm tài khoản"** thay cho nhãn mặc định chung "Thêm mới". |

---

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT)

| Method | Đường dẫn | Mô tả | Quyền (Permission) |
|---|---|---|---|
| GET | `/api/users` | Danh sách người dùng (phân trang, lọc trạng thái/đơn vị, tìm kiếm 2 ô) | `user:read` |
| GET | `/api/users/{id}` | Xem chi tiết thông tin tài khoản người dùng | `user:read` |
| POST | `/api/users` | Tạo mới tài khoản (gửi kèm 9 trường dữ liệu) | `user:create` hoặc `user:manage` |
| PUT | `/api/users/{id}` | Chỉnh sửa thông tin tài khoản | `user:update` hoặc `user:manage` |
| POST | `/api/users/{id}/lock` | Khóa tài khoản (có lý do) | `user:lock` hoặc `user:manage` |
| POST | `/api/users/{id}/unlock` | Mở khóa tài khoản | `user:lock` hoặc `user:manage` |
| PATCH | `/api/users/{id}/status` | Đổi trạng thái tài khoản | `user:lock`, `user:update` hoặc `user:manage` |
| GET | `/api/users/me` | Xem/sửa thông tin cá nhân | JWT (tự quản lý) |
| POST | `/api/users/pending` | Nộp đơn đăng ký tài khoản (F-271) | Công khai (rate-limited 5 lần/giờ/IP) |
| POST | `/api/auth/forgot-password` | Yêu cầu link đặt lại mật khẩu | Công khai (rate-limited 3 lần/15 phút) |
| POST | `/api/auth/reset-password/{token}` | Đặt lại mật khẩu bằng token | Công khai (hết hạn 1 giờ) |

---

## 7. Phần kỹ thuật — cấu trúc bảng

**Bảng `app_users` (Entity: `User.java`):**
*   **Các trường chính:** `id`, `email` (unique), `username` (tự sinh từ email), `passwordHash` (BCrypt), `fullName`, `phone`, `address`, `department`, `position`, `note`, `orgUnitId` (FK), `status` (INT Enum), `deletedAt` (NULL — không xóa cứng).
*   **🔴 Trường hồ sơ mới (migration `V20260814120000__add_user_profile_columns.sql`):** `address`, `department`, `position`, `note`. Các trường này nullable để an toàn với dữ liệu cũ.

**Bảng `UserStatusLog` (Mới - phục vụ BR-008):**
*   Lưu lại lịch sử thay đổi trạng thái: `userId`, `previousStatus`, `newStatus`, `changedBy` (ai thay đổi), `reason` (lý do), `changedAt`.

**Bảng `PasswordResetToken` (Mới - phục vụ BR-005):**
*   Lưu token cho luồng Quên mật khẩu: `userId`, `token`, `expiresAt` (1 giờ), `usedAt`, `createdAt`.
