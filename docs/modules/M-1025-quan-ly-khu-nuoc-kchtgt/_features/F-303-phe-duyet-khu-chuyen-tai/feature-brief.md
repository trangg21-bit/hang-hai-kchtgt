---
id: F-303
name: "Phê duyệt Khu chuyển tải"
slug: phe-duyet-khu-chuyen-tai
module-id: M-1025
status: proposed
classification: local
priority: medium
created: "2026-08-28T06:25:56Z"
last-updated: "2026-08-28T06:25:56Z"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Phê duyệt Khu chuyển tải

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu 7 section).
**Chức năng:** F-303 — Phê duyệt Khu chuyển tải (TransferArea).
**Module:** M-1025 — Quản lý khu nước KCHTGT.
**Loại:** chức năng có bước phê duyệt (2 cấp).
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` + `docs/conventions/approval-2-level-spec.md` mục 3.

## 1. Mô tả ngắn

Chức năng phê duyệt hồ sơ Khu chuyển tải theo quy trình 2 cấp: vòng 1 Cảng vụ/Chi cục (C1), vòng 2 Cục (C2). Người duyệt C1 có quyền `transferarea:approvec1` (hoặc `approve`), người duyệt C2 có `transferarea:approvec2`. Từ chối ở bất kỳ vòng nào bắt buộc nhập lý do ≥ 10 ký tự. Chống tự duyệt (4-eyes): người duyệt không được duyệt hồ sơ do chính mình gửi.

## 2. Trường dữ liệu

Không có trường nhập liệu trên form riêng — thao tác duyệt/từ chối chỉ nhận:

| # | Trường | Bắt buộc | Kiểu | Ghi chú |
|---|---|---|---|---|
| 1 | Cấp duyệt (`cap`) | Có | Enum C1/C2 | Chọn vòng duyệt (Cảng vụ/Chi cục hay Cục) |
| 2 | Nội dung phê duyệt (`content`) | Không | TextArea | Ghi vào `portAuthorityApprovalContent`/`departmentApprovalContent` |
| 3 | Lý do từ chối (`lyDo`) | Có khi từ chối | TextArea | ≥ 10 ký tự; ghi `rejectionReason` |

## 3. Trạng thái và phê duyệt

- Quy trình 2 cấp theo `docs/conventions/approval-2-level-spec.md` mục 3:

| Từ trạng thái | Hành động | Sang trạng thái | Người duyệt |
|---|---|---|---|
| PENDING_APPROVAL (Chờ Cảng vụ/Chi cục) | Đồng ý | APPROVED_LEVEL1 (Chờ Cục) | Cảng vụ/Chi cục |
| PENDING_APPROVAL | Từ chối | REJECTED_LEVEL1 | Cảng vụ/Chi cục |
| APPROVED_LEVEL1 (Chờ Cục) | Đồng ý | APPROVED (Đã duyệt) | Cục |
| APPROVED_LEVEL1 | Từ chối | REJECTED_LEVEL2 | Cục |

- Re-submit luôn vào lại vòng 1. Trạng thái lưu số enum `ApprovalStatus` (INT, `@Enumerated ORDINAL`).

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-303-01 | Duyệt C1 → `APPROVED_LEVEL1`; duyệt C2 → `APPROVED`. | Approve |
| BR-303-02 | Từ chối bất kỳ vòng nào bắt buộc lý do ≥ 10 ký tự (`rejectionReason`). | Reject |
| BR-303-03 | Chống tự duyệt (4-eyes): người duyệt không duyệt hồ sơ do chính mình gửi. | Approve |
| BR-303-04 | Không nhảy vòng (C1 → APPROVED), không duyệt ngược (C2 → C1). | Approve |
| BR-303-05 | Ghi nhật ký phê duyệt (người duyệt + thời điểm) cho mỗi lần duyệt/từ chối. | Approve |

### 4.2. Acceptance Criteria

| AC-ID | Given | When | Then | Oracle |
|---|---|---|---|---|
| AC-303-01 | Hồ sơ PENDING_APPROVAL, user có `transferarea:approvec1` | Approve C1 | Hồ sơ → APPROVED_LEVEL1, ghi `portAuthorityApprovedBy/At` | DB trạng thái = 3 |
| AC-303-02 | Hồ sơ APPROVED_LEVEL1, user có `transferarea:approvec2` | Approve C2 | Hồ sơ → APPROVED, ghi `departmentApprovedBy/At` | DB trạng thái = 5 |
| AC-303-03 | Từ chối với lý do < 10 ký tự | Reject | API từ chối | Message tiếng Việt |
| AC-303-04 | Người gửi tự duyệt hồ sơ của mình | Approve | API từ chối (4-eyes) | Message cảnh báo |
| AC-303-05 | User thiếu quyền duyệt | Approve | HTTP 403; UI ẩn nút duyệt | Permission khớp |

### 4.3. User Stories

- **US-303-01:** Là lãnh đạo Cảng vụ/Chi cục, tôi muốn duyệt/từ chối hồ sơ vòng 1 để kiểm soát chất lượng dữ liệu.
- **US-303-02:** Là lãnh đạo Cục, tôi muốn duyệt/từ chối hồ sơ vòng 2 để ban hành chính thức.
- **US-303-03:** Là người duyệt, tôi muốn bắt buộc nhập lý do khi từ chối để hồ sơ được sửa đúng chỗ.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Duyệt/từ chối C1 | `transferarea:approvec1` (hoặc `transferarea:approve`) |
| Duyệt/từ chối C2 | `transferarea:approvec2` |

| Vai trò | Duyệt C1 | Duyệt C2 | Ghi chú |
|---|---|---|---|
| Lãnh đạo Cảng vụ/Chi cục | Có nếu gán `approvec1` | Không | 4-eyes |
| Lãnh đạo Cục / Admin Cục | Không (vòng 1) | Có nếu gán `approvec2` | Xem metadata nhạy cảm |
| Quản trị hệ thống | Có | Có | ROLE_SYSTEM_ADMIN vượt mọi kiểm tra |
| Người không có quyền | Không | Không | API 403 |

**Admin Cục:** duyệt vòng 2 hồ sơ trong phạm vi Cục khi có `transferarea:approvec2` hoặc `admin:all`/`*`.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — dùng 7 trạng thái chuẩn. |
| 2 | Có bước phê duyệt không | Có — theo tài liệu nền mục 3 (2 cấp C1 → C2). |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị `orgUnitId`; người duyệt chỉ thấy hồ sơ trong scope. |
| 4 | Trường chỉ hiện trong điều kiện nào | Nút duyệt/từ chối hiện theo trạng thái + quyền (ẩn nút khi không đủ quyền). |
| 5 | Quyền riêng | `transferarea:approvec1`, `transferarea:approvec2`, `transferarea:approve`. |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không. |
| 7 | Tải lên tệp | Không áp dụng. |
| 8 | Giao diện khác mẫu chung | Không — popup duyệt/từ chối dùng chung theo convention. |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/v1/transfer-area/{id}/approve` | Duyệt hồ sơ theo `cap` (C1/C2) | `transferarea:approvec1` / `transferarea:approvec2` |
| POST | `/api/v1/transfer-area/{id}/reject` | Từ chối kèm lý do | `transferarea:approve` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT)

Không thay đổi schema. Duyệt ghi cột `port_authority_approved_*` (C1) / `department_approved_*` (C2); từ chối ghi `rejection_reason`.
