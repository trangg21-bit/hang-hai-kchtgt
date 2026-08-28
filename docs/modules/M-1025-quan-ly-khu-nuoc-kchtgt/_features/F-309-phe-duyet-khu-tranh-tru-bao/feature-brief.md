---
id: F-309
name: "Phê duyệt Khu tránh trú bão"
slug: phe-duyet-khu-tranh-tru-bao
module-id: M-1025
status: proposed
classification: local
priority: medium
created: "2026-08-28T06:26:00Z"
last-updated: "2026-08-28T06:26:00Z"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Phê duyệt Khu tránh trú bão

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu 7 section).
**Chức năng:** F-309 — Phê duyệt Khu tránh trú bão (StormShelterArea).
**Module:** M-1025 — Quản lý khu nước KCHTGT.
**Loại:** chức năng có bước phê duyệt (2 cấp).
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` + `approval-2-level-spec.md` mục 3.

## 1. Mô tả ngắn

Chức năng phê duyệt hồ sơ Khu tránh trú bão theo quy trình 2 cấp C1 (Cảng vụ/Chi cục) → C2 (Cục). Người duyệt C1 có `stormshelter:approvec1`, C2 có `stormshelter:approvec2`. Từ chối bắt buộc lý do ≥ 10 ký tự. Chống tự duyệt (4-eyes).

## 2. Trường dữ liệu

| # | Trường | Bắt buộc | Kiểu | Ghi chú |
|---|---|---|---|---|
| 1 | Cấp duyệt (`cap`) | Có | Enum C1/C2 | |
| 2 | Nội dung phê duyệt (`content`) | Không | TextArea | `portAuthorityApprovalContent`/`departmentApprovalContent` |
| 3 | Lý do từ chối (`lyDo`) | Có khi từ chối | TextArea | ≥ 10 ký tự; `rejectionReason` |

## 3. Trạng thái và phê duyệt

| Từ trạng thái | Hành động | Sang trạng thái | Người duyệt |
|---|---|---|---|
| PENDING_APPROVAL | Đồng ý | APPROVED_LEVEL1 | Cảng vụ/Chi cục |
| PENDING_APPROVAL | Từ chối | REJECTED_LEVEL1 | Cảng vụ/Chi cục |
| APPROVED_LEVEL1 | Đồng ý | APPROVED | Cục |
| APPROVED_LEVEL1 | Từ chối | REJECTED_LEVEL2 | Cục |

- Re-submit luôn vào vòng 1. Trạng thái số enum `ApprovalStatus` (INT `@Enumerated ORDINAL`).

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-309-01 | C1 → `APPROVED_LEVEL1`; C2 → `APPROVED`. | Approve |
| BR-309-02 | Từ chối bắt buộc lý do ≥ 10 ký tự. | Reject |
| BR-309-03 | 4-eyes — không tự duyệt hồ sơ mình gửi. | Approve |
| BR-309-04 | Không nhảy vòng/duyệt ngược. | Approve |
| BR-309-05 | Ghi nhật ký người duyệt + thời điểm. | Approve |

### 4.2. Acceptance Criteria

| AC-ID | Given | When | Then | Oracle |
|---|---|---|---|---|
| AC-309-01 | PENDING_APPROVAL, `stormshelter:approvec1` | Approve C1 | → APPROVED_LEVEL1 | DB = 3 |
| AC-309-02 | APPROVED_LEVEL1, `stormshelter:approvec2` | Approve C2 | → APPROVED | DB = 5 |
| AC-309-03 | Lý do < 10 ký tự | Reject | Từ chối | Message tiếng Việt |
| AC-309-04 | Tự duyệt | Approve | Từ chối (4-eyes) | Message cảnh báo |
| AC-309-05 | Thiếu quyền | Approve | 403; UI ẩn nút | Permission khớp |

### 4.3. User Stories

- **US-309-01:** Là lãnh đạo Cảng vụ/Chi cục, tôi muốn duyệt/từ chối vòng 1.
- **US-309-02:** Là lãnh đạo Cục, tôi muốn duyệt/từ chối vòng 2.
- **US-309-03:** Là người duyệt, tôi muốn bắt buộc lý do khi từ chối.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Duyệt/từ chối C1 | `stormshelter:approvec1` (hoặc `approve`) |
| Duyệt/từ chối C2 | `stormshelter:approvec2` |

| Vai trò | Duyệt C1 | Duyệt C2 | Ghi chú |
|---|---|---|---|
| Lãnh đạo Cảng vụ/Chi cục | Có nếu gán `approvec1` | Không | 4-eyes |
| Lãnh đạo Cục / Admin Cục | Không (vòng 1) | Có nếu gán `approvec2` | Xem metadata |
| Quản trị hệ thống | Có | Có | ROLE_SYSTEM_ADMIN |
| Người không có quyền | Không | Không | API 403 |

**Admin Cục:** duyệt vòng 2 trong phạm vi Cục khi có `stormshelter:approvec2` hoặc `admin:all`/`*`.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — 7 trạng thái chuẩn. |
| 2 | Có bước phê duyệt không | Có — 2 cấp C1 → C2. |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị `orgUnitId`. |
| 4 | Trường chỉ hiện trong điều kiện nào | Nút duyệt/từ chối theo trạng thái + quyền. |
| 5 | Quyền riêng | `stormshelter:approvec1`, `stormshelter:approvec2`, `stormshelter:approve`. |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không. |
| 7 | Tải lên tệp | Không áp dụng. |
| 8 | Giao diện khác mẫu chung | Không — popup duyệt/từ chối chung. |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/v1/storm-shelter/{id}/approve` | Duyệt theo `cap` | `stormshelter:approvec1`/`approvec2` |
| POST | `/api/v1/storm-shelter/{id}/reject` | Từ chối kèm lý do | `stormshelter:approve` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT)

Không thay đổi schema. Cột `port_authority_approved_*` (C1) / `department_approved_*` (C2) / `rejection_reason`.
