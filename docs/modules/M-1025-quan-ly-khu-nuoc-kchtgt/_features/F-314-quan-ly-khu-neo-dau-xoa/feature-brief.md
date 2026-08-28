---
id: F-314
name: "Xóa Khu neo đậu"
slug: quan-ly-khu-neo-dau-xoa
module-id: M-1025
status: proposed
classification: local
priority: medium
created: "2026-08-28T06:26:03Z"
last-updated: "2026-08-28T06:26:03Z"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Xóa Khu neo đậu

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu 7 section).
**Chức năng:** F-314 — Xóa (soft delete) Khu neo đậu (Anchorage).
**Module:** M-1025 — Quản lý khu nước KCHTGT.
**Loại:** chức năng thường (không có bước phê duyệt).
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` + `approval-2-level-spec.md` mục 3.6.

## 1. Mô tả ngắn

Chức năng cho phép người nhập có `anchorage:delete` xóa mềm hồ sơ Khu neo đậu đang ở trạng thái "Lưu tạm" (`DRAFT`). Xóa mềm chuyển hồ sơ sang "Đã xóa (lịch sử)" — không xóa khỏi CSDL. Mọi trạng thái khác đều bị từ chối.

## 2. Trường dữ liệu

Không có trường nhập liệu. Chỉ tác động `deletedAt`/`deletedBy` (soft-delete `BaseEntity`) và chuyển `approvalStatus` → `ARCHIVED` (7).

## 3. Trạng thái và phê duyệt

- **Không có bước phê duyệt.** Chỉ xóa khi `DRAFT` (0), do người nhập, cần `anchorage:delete`. Xóa mềm qua `ApprovalHistoryUtils.recordSoftDelete`.

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-314-01 | Chỉ xóa hồ sơ `DRAFT`; trạng thái khác từ chối. | Delete |
| BR-314-02 | Xóa mềm — không xóa vật lý. | Delete |
| BR-314-03 | Truyền đủ kiểm toán `deletedBy`/`operatorId`. | Delete |

### 4.2. Acceptance Criteria

| AC-ID | Given | When | Then | Oracle |
|---|---|---|---|---|
| AC-314-01 | Hồ sơ DRAFT, user `anchorage:delete` | DELETE | ARCHIVED, `deletedAt` ghi | DB còn bản ghi |
| AC-314-02 | Hồ sơ APPROVED | DELETE | Từ chối | Message tiếng Việt |
| AC-314-03 | Thiếu `anchorage:delete` | DELETE | 403; UI ẩn nút | Permission khớp |

### 4.3. User Stories

- **US-314-01:** Là người nhập, tôi muốn xóa hồ sơ Khu neo đậu đang Lưu tạm không còn cần.
- **US-314-02:** Là quản trị, tôi muốn hồ sơ đã xóa vẫn lưu trong lịch sử để truy vết.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xóa hồ sơ | `anchorage:delete` |

| Vai trò | Xóa | Ghi chú |
|---|---|---|
| Người nhập thuộc đơn vị | Có nếu gán `anchorage:delete` | Chỉ DRAFT trong scope |
| Lãnh đạo Cục / Admin Cục | Có nếu gán quyền | Xem metadata nhạy cảm |
| Quản trị hệ thống | Có | ROLE_SYSTEM_ADMIN |
| Người không có quyền | Không | API 403 |

**Admin Cục:** xóa hồ sơ DRAFT trong phạm vi Cục khi có `anchorage:delete` hoặc `admin:all`/`*`.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — chỉ xóa DRAFT → ARCHIVED. |
| 2 | Có bước phê duyệt không | Không có bước phê duyệt. |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị `orgUnitId`. |
| 4 | Trường chỉ hiện trong điều kiện nào | Nút Xóa chỉ hiện khi status = DRAFT. |
| 5 | Quyền riêng | `anchorage:delete`. |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không. |
| 7 | Tải lên tệp | Không áp dụng. |
| 8 | Giao diện khác mẫu chung | Không — Modal xác nhận chung. |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| DELETE | `/api/v1/anchorage/{id}` | Xóa mềm hồ sơ DRAFT | `anchorage:delete` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT)

Không thay đổi schema. Soft-delete qua `BaseEntity` + `ApprovalHistoryUtils.recordSoftDelete`.
