---
id: F-313
name: "Cập nhật Khu neo đậu"
slug: quan-ly-khu-neo-dau-cap-nhat
module-id: M-1025
status: proposed
classification: local
priority: medium
created: "2026-08-28T06:26:02Z"
last-updated: "2026-08-28T06:26:02Z"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Cập nhật Khu neo đậu

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu 7 section).
**Chức năng:** F-313 — Cập nhật Khu neo đậu (Anchorage).
**Module:** M-1025 — Quản lý khu nước KCHTGT.
**Loại:** chức năng có bước phê duyệt liên quan.
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md`; write surface chốt tại F-312; entity `Anchorage` + bảng con.

## 1. Mô tả ngắn

Chức năng cho phép người dùng có `anchorage:update` chỉnh sửa hồ sơ Khu neo đậu theo kiểu partial update. Mã `anchorageCode` và trường kiểm toán không nhận từ client. Hồ sơ `DRAFT`/`REJECTED_LEVEL1`/`REJECTED_LEVEL2` sửa được và gửi lại duyệt; `PENDING_APPROVAL`/`APPROVED_LEVEL1` đóng băng; `APPROVED` sửa qua "Lưu và phê duyệt".

## 2. Trường dữ liệu

Cùng write surface với F-312 (đầy đủ tại F-312 mục 2). Điểm khác biệt:

| # | Nhóm trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Mã `anchorageCode` | — | Không có trong DTO | Client không gửi |
| 2 | Thông tin chung #2–#9 | Không | Theo F-312 | Partial update, trim |
| 3 | Thông tin kỹ thuật #10–#19 | Không | Theo F-312 | Partial update |
| 4 | Công bố #20–#22 | Không | Theo F-312 | Partial update |
| 5 | Khu nước neo buộc + điểm neo #23–#28 | Không | Bảng con | Thay thế toàn bộ khi gửi |
| 6 | GIS #27–#31 | Không | Theo F-312 | |
| 7 | File đính kèm #34 | Không | UploadFileTable | Endpoint riêng |
| 8 | Trạng thái/kiểm toán #47–#57 | — | Không có trong DTO | Bỏ qua |

## 3. Trạng thái và phê duyệt

- Cập nhật không tự đổi `approvalStatus`; quyền sửa theo trạng thái (`approval-2-level-spec.md` mục 3.9): `DRAFT`/`REJECTED_*` sửa + gửi lại; `PENDING_APPROVAL`/`APPROVED_LEVEL1` đóng băng; `APPROVED` sửa qua "Lưu và phê duyệt" (`anchorage:approvec2`).
- Trạng thái số enum `ApprovalStatus`.

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-313-01 | Partial update: chỉ field gửi mới áp dụng. | Update |
| BR-313-02 | `anchorageCode` không nhận từ client. | Update |
| BR-313-03 | Đổi `orgUnitId` phải trong scope user. | Update |
| BR-313-04 | Đóng băng `PENDING_APPROVAL`/`APPROVED_LEVEL1` (403). | Update |
| BR-313-05 | `APPROVED` sửa qua "Lưu và phê duyệt" (`approvec2`), giữ APPROVED. | Update |
| BR-313-06 | Bảng con thay thế toàn bộ cùng transaction. | Update |
| BR-313-07 | Trim text; `updatedBy`/`updatedAt` từ session. | Update |

### 4.2. Acceptance Criteria

| AC-ID | Given | When | Then | Oracle |
|---|---|---|---|---|
| AC-313-01 | Hồ sơ DRAFT, user `anchorage:update` | PUT | Chỉ trường gửi áp dụng, `updatedAt` mới | Response so sánh |
| AC-313-02 | Hồ sơ PENDING_APPROVAL | PUT | 403 đóng băng | Không đổi DB |
| AC-313-03 | Request gửi `anchorageCode` | PUT | Bỏ qua, mã giữ nguyên | Response giữ mã cũ |
| AC-313-04 | Đổi đơn vị ngoài scope | PUT | Từ chối | Message tiếng Việt |
| AC-313-05 | Thiếu `anchorage:update` | PUT | 403; UI ẩn nút | Permission khớp |

### 4.3. User Stories

- **US-313-01:** Là Chuyên viên, tôi muốn sửa các trường của Khu neo đậu để cập nhật thông tin.
- **US-313-02:** Là Chuyên viên, tôi muốn chỉ gửi trường cần sửa.
- **US-313-03:** Là người có quyền phê duyệt, tôi muốn sửa hồ sơ Đã duyệt qua "Lưu và phê duyệt".

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Cập nhật hồ sơ | `anchorage:update` |
| Sửa hồ sơ Đã duyệt | `anchorage:approvec2` |

| Vai trò | Sửa | Ghi chú |
|---|---|---|
| Chuyên viên thuộc đơn vị | Có nếu gán `anchorage:update` | Trong scope `orgUnitId` |
| Lãnh đạo Cảng vụ/Chi cục | Có nếu gán quyền | — |
| Lãnh đạo Cục / Admin Cục | Có nếu gán quyền | Xem metadata nhạy cảm |
| Quản trị hệ thống | Có | ROLE_SYSTEM_ADMIN |
| Người không có quyền | Không | API 403 |

**Admin Cục:** sửa trong phạm vi Cục khi có `anchorage:update` hoặc `admin:all`/`*`; sửa Đã duyệt cần `anchorage:approvec2`.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — ma trận sửa theo trạng thái chuẩn. |
| 2 | Có bước phê duyệt không | Gián tiếp: sửa xong gửi lại quy trình 2 cấp (F-315). |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị `orgUnitId`; ghi validate scope. |
| 4 | Trường chỉ hiện trong điều kiện nào | Mã disabled; #47–#57 không có trong DTO. |
| 5 | Quyền riêng | `anchorage:update`; sửa Đã duyệt cần `anchorage:approvec2`. |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không. |
| 7 | Tải lên tệp | Có — attachments endpoint riêng. |
| 8 | Giao diện khác mẫu chung | Không — `AnchorageForm.tsx` (create/edit). |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| PUT | `/api/v1/anchorage` | Cập nhật partial | `anchorage:update` |
| GET | `/api/v1/anchorage/{id}` | Prefill form | `anchorage:read` |
| POST | `/api/v1/anchorage/{id}/attachments` | Upload file | `anchorage:update` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT)

Không thay đổi schema. Update dùng cascade + orphanRemoval trên bảng con.
