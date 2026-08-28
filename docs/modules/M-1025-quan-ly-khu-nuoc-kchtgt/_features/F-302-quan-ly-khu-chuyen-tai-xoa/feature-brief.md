---
id: F-302
name: "Xóa Khu chuyển tải"
slug: quan-ly-khu-chuyen-tai-xoa
module-id: M-1025
status: proposed
classification: local
priority: medium
created: "2026-08-28T06:25:56Z"
last-updated: "2026-08-28T06:25:56Z"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Xóa Khu chuyển tải

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu 7 section).
**Chức năng:** F-302 — Xóa (soft delete) Khu chuyển tải (TransferArea).
**Module:** M-1025 — Quản lý khu nước KCHTGT.
**Loại:** chức năng thường (không có bước phê duyệt).
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` + `docs/conventions/approval-2-level-spec.md` mục 3.6 (xóa mềm).

## 1. Mô tả ngắn

Chức năng cho phép người nhập có `transferarea:delete` xóa mềm hồ sơ Khu chuyển tải đang ở trạng thái "Lưu tạm" (`DRAFT`). Xóa mềm chuyển hồ sơ sang "Đã xóa (lịch sử)" — không xóa khỏi cơ sở dữ liệu. Mọi trạng thái khác (kể cả Đã duyệt) đều bị từ chối. Hồ sơ hết giá trị sử dụng thì đổi tình trạng hoạt động, không xóa.

## 2. Trường dữ liệu

Không có trường nhập liệu. Thao tác chỉ tác động lên `deletedAt`/`deletedBy` (soft-delete của `BaseEntity`) và chuyển `approvalStatus` sang `ARCHIVED` (7).

## 3. Trạng thái và phê duyệt

- **Không có bước phê duyệt.** Xóa chỉ thực hiện được khi hồ sơ ở `DRAFT` (0), do người nhập thực hiện, cần quyền `transferarea:delete`.
- Xóa là xóa mềm: `deletedAt`/`deletedBy` được ghi (qua `ApprovalHistoryUtils.recordSoftDelete`), bản ghi không bị xóa vật lý.

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-302-01 | Chỉ xóa hồ sơ ở trạng thái `DRAFT`; mọi trạng thái khác từ chối. | Delete |
| BR-302-02 | Xóa là xóa mềm — không xóa vật lý khỏi DB. | Delete |
| BR-302-03 | Phải truyền đủ thông tin kiểm toán (`operatorId`/`deletedBy`) vào `softDelete`. | Delete |

### 4.2. Acceptance Criteria

| AC-ID | Given | When | Then | Oracle |
|---|---|---|---|---|
| AC-302-01 | Hồ sơ DRAFT, user có `transferarea:delete` | DELETE `/{id}` | Hồ sơ chuyển ARCHIVED, `deletedAt`/`deletedBy` ghi | DB còn bản ghi với deletedAt ≠ null |
| AC-302-02 | Hồ sơ APPROVED (Đã duyệt) | DELETE `/{id}` | API từ chối | Message tiếng Việt; không đổi DB |
| AC-302-03 | User thiếu `transferarea:delete` | DELETE `/{id}` | HTTP 403; UI ẩn nút Xóa | Permission khớp |

### 4.3. User Stories

- **US-302-01:** Là người nhập, tôi muốn xóa hồ sơ Khu chuyển tải đang ở trạng thái Lưu tạm mà tôi không còn cần.
- **US-302-02:** Là quản trị, tôi muốn hồ sơ đã xóa vẫn lưu trong lịch sử để truy vết.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xóa hồ sơ | `transferarea:delete` |

| Vai trò | Xóa | Ghi chú |
|---|---|---|
| Người nhập thuộc đơn vị | Có nếu được gán `transferarea:delete` | Chỉ xóa hồ sơ DRAFT trong scope |
| Lãnh đạo Cục / Admin Cục | Có nếu được gán quyền | Xem metadata nhạy cảm |
| Quản trị hệ thống | Có | ROLE_SYSTEM_ADMIN vượt mọi kiểm tra |
| Người không có quyền | Không | API 403 |

**Admin Cục:** xóa hồ sơ DRAFT trong phạm vi Cục khi có `transferarea:delete` hoặc `admin:all`/`*`.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — chỉ xóa ở DRAFT, chuyển ARCHIVED. |
| 2 | Có bước phê duyệt không | Không có bước phê duyệt. |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị `orgUnitId` (filter + `@DataScope`); người nhập chỉ xóa hồ sơ trong scope. |
| 4 | Trường chỉ hiện trong điều kiện nào | Nút Xóa chỉ hiện khi `normalizeApprovalStatus(status) === 'DRAFT'`. |
| 5 | Quyền riêng | `transferarea:delete`. |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không. |
| 7 | Tải lên tệp | Không áp dụng. |
| 8 | Giao diện khác mẫu chung | Không — xác nhận xóa qua Modal chung. |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| DELETE | `/api/v1/transfer-area/{id}` | Xóa mềm hồ sơ DRAFT | `transferarea:delete` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT)

Không thay đổi schema. Soft-delete dùng cột `deleted_at`/`deleted_by` của `BaseEntity` + `ApprovalHistoryUtils.recordSoftDelete`.
