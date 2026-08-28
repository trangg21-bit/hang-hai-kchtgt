---
id: F-307
name: "Cập nhật Khu tránh trú bão"
slug: quan-ly-khu-tranh-tru-bao-cap-nhat
module-id: M-1025
status: proposed
classification: local
priority: medium
created: "2026-08-28T06:25:59Z"
last-updated: "2026-08-28T06:25:59Z"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Cập nhật Khu tránh trú bão

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu 7 section).
**Chức năng:** F-307 — Cập nhật Khu tránh trú bão (StormShelterArea).
**Module:** M-1025 — Quản lý khu nước KCHTGT.
**Loại:** chức năng có bước phê duyệt liên quan.
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md`; write surface chốt tại F-306; entity `StormShelterArea` + bảng con.

## 1. Mô tả ngắn

Chức năng cho phép người dùng có `stormshelter:update` chỉnh sửa hồ sơ Khu tránh trú bão theo kiểu partial update. Mã `stormShelterCode` và trường kiểm toán không nhận từ client. Hồ sơ `DRAFT`/`REJECTED_LEVEL1`/`REJECTED_LEVEL2` sửa được và gửi lại duyệt; `PENDING_APPROVAL`/`APPROVED_LEVEL1` đóng băng; `APPROVED` sửa qua "Lưu và phê duyệt".

## 2. Trường dữ liệu

Cùng write surface với F-306 (danh sách đầy đủ tại F-306 mục 2). Điểm khác biệt:

| # | Nhóm trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Mã `stormShelterCode` | — | Không có trong DTO | Client không gửi |
| 2 | Thông tin chung #2–#10 | Không | Theo F-306 | Partial update, trim |
| 3 | Thông tin kỹ thuật #11–#20 | Không | Theo F-306 | #16 DWT, #20 Ghi chú DB-parity-only |
| 4 | Công bố #21–#23 | Không | Theo F-306 | Partial update |
| 5 | Khu nước neo buộc + điểm neo #24–#29 | Không | Bảng con | Thay thế toàn bộ khi gửi |
| 6 | GIS #28–#32 | Không | Theo F-306 | |
| 7 | File đính kèm #35 | Không | UploadFileTable | Endpoint riêng |
| 8 | Trạng thái/kiểm toán #48–#58 | — | Không có trong DTO | Bỏ qua |

## 3. Trạng thái và phê duyệt

- Cập nhật không tự đổi `approvalStatus`; quyền sửa theo trạng thái (`approval-2-level-spec.md` mục 3.9): `DRAFT`/`REJECTED_*` sửa + gửi lại; `PENDING_APPROVAL`/`APPROVED_LEVEL1` đóng băng; `APPROVED` sửa qua "Lưu và phê duyệt" (`stormshelter:approvec2`).
- Trạng thái số enum `ApprovalStatus` (DRAFT=0 … REJECTED_LEVEL2=9).

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-307-01 | Partial update: chỉ field gửi mới áp dụng. | Update |
| BR-307-02 | `stormShelterCode` không nhận từ client. | Update |
| BR-307-03 | Đổi `orgUnitId` phải trong scope user. | Update |
| BR-307-04 | Đóng băng `PENDING_APPROVAL`/`APPROVED_LEVEL1` (403). | Update |
| BR-307-05 | `APPROVED` sửa qua "Lưu và phê duyệt" (`approvec2`), giữ APPROVED. | Update |
| BR-307-06 | Bảng con thay thế toàn bộ cùng transaction. | Update |
| BR-307-07 | Trim text; `updatedBy`/`updatedAt` từ session. | Update |

### 4.2. Acceptance Criteria

| AC-ID | Given | When | Then | Oracle |
|---|---|---|---|---|
| AC-307-01 | Hồ sơ DRAFT, user `stormshelter:update` | PUT | Chỉ trường gửi áp dụng, `updatedAt` mới | Response so sánh |
| AC-307-02 | Hồ sơ PENDING_APPROVAL | PUT | 403 đóng băng | Không đổi DB |
| AC-307-03 | Request gửi `stormShelterCode` | PUT | Bỏ qua, mã giữ nguyên | Response giữ mã cũ |
| AC-307-04 | Đổi đơn vị ngoài scope | PUT | Từ chối | Message tiếng Việt |
| AC-307-05 | Thiếu `stormshelter:update` | PUT | 403; UI ẩn nút | Permission khớp |

### 4.3. User Stories

- **US-307-01:** Là Chuyên viên, tôi muốn sửa các trường của Khu tránh trú bão để cập nhật thông tin.
- **US-307-02:** Là Chuyên viên, tôi muốn chỉ gửi trường cần sửa mà không nhập lại toàn bộ.
- **US-307-03:** Là người có quyền phê duyệt, tôi muốn sửa hồ sơ Đã duyệt qua "Lưu và phê duyệt".

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Cập nhật hồ sơ | `stormshelter:update` |
| Sửa hồ sơ Đã duyệt | `stormshelter:approvec2` |

| Vai trò | Sửa | Ghi chú |
|---|---|---|
| Chuyên viên thuộc đơn vị | Có nếu gán `stormshelter:update` | Trong scope `orgUnitId` |
| Lãnh đạo Cảng vụ/Chi cục | Có nếu gán quyền | — |
| Lãnh đạo Cục / Admin Cục | Có nếu gán quyền | Xem metadata nhạy cảm |
| Quản trị hệ thống | Có | ROLE_SYSTEM_ADMIN |
| Người không có quyền | Không | API 403 |

**Admin Cục:** sửa trong phạm vi Cục khi có `stormshelter:update` hoặc `admin:all`/`*`; sửa Đã duyệt cần `stormshelter:approvec2`.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — ma trận sửa theo trạng thái chuẩn. |
| 2 | Có bước phê duyệt không | Gián tiếp: sửa xong gửi lại quy trình 2 cấp (F-309). |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị `orgUnitId`; ghi validate scope. |
| 4 | Trường chỉ hiện trong điều kiện nào | Mã disabled; #16/#20 DB-parity-only; #48–#58 không có trong DTO. |
| 5 | Quyền riêng | `stormshelter:update`; sửa Đã duyệt cần `stormshelter:approvec2`. |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không. |
| 7 | Tải lên tệp | Có — attachments endpoint riêng. |
| 8 | Giao diện khác mẫu chung | Không — `StormShelterForm.tsx` (create/edit). |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| PUT | `/api/v1/storm-shelter` | Cập nhật partial | `stormshelter:update` |
| GET | `/api/v1/storm-shelter/{id}` | Prefill form | `stormshelter:read` |
| POST | `/api/v1/storm-shelter/{id}/attachments` | Upload file | `stormshelter:update` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT)

Không thay đổi schema. Update dùng cascade + orphanRemoval trên bảng con.
