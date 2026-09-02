---
id: F-301
name: "Cập nhật Khu chuyển tải"
slug: quan-ly-khu-chuyen-tai-cap-nhat
module-id: M-1025
status: proposed
classification: local
priority: medium
created: "2026-08-28T06:25:55Z"
last-updated: "2026-08-28T06:25:55Z"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Cập nhật Khu chuyển tải

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu 7 section).
**Chức năng:** F-301 — Cập nhật Khu chuyển tải (TransferArea).
**Module:** M-1025 — Quản lý khu nước KCHTGT.
**Loại:** chức năng có bước phê duyệt liên quan (sửa hồ sơ rồi gửi lại quy trình 2 cấp).
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md`; write surface #2–#35 đã chốt tại F-300; entity `TransferArea` + bảng con.

## 1. Mô tả ngắn

Chức năng cho phép người dùng có `transferarea:update` chỉnh sửa hồ sơ Khu chuyển tải đã tồn tại theo kiểu partial update. Mã `transferAreaCode` và các trường kiểm toán/phê duyệt không nhận từ client. Theo quy ước phê duyệt 2 cấp, hồ sơ ở `DRAFT`/`REJECTED_LEVEL1`/`REJECTED_LEVEL2` sửa được và có thể gửi lại duyệt; `PENDING_APPROVAL`/`APPROVED_LEVEL1` đóng băng; `APPROVED` chỉ sửa qua "Lưu và phê duyệt" (giữ nguyên APPROVED, bản cũ vào nhật ký).

## 2. Trường dữ liệu

Cùng write surface #2–#35 với F-300 (danh sách đầy đủ và control chuẩn tại F-300 mục 2). Điểm khác biệt của F-301:

| # | Nhóm trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Mã `transferAreaCode` | — | Không có trong DTO update | Client không gửi; không sửa được |
| 2 | Thông tin chung #2–#8 | Không | Theo F-300 | Partial update: field không gửi giữ nguyên; text trim |
| 3 | Thông tin kỹ thuật #9–#18 | Không | Theo F-300 | Partial update |
| 4 | Công bố + thời gian HĐ #19–#23 | Không | Theo F-300 | Partial update |
| 5 | Khu nước neo buộc + điểm neo #24–#29 | Không | Bảng con | Nếu gửi: thay thế toàn bộ danh sách (cascade + orphanRemoval) |
| 6 | GIS #30–#34 | Không | Theo F-300 | `coordinates` rỗng → xóa spatial; khác → cập nhật |
| 7 | File đính kèm #35 | Không | UploadFileTable | Quản lý riêng qua endpoint attachments |
| 8 | Trạng thái/kiểm toán #48–#58 | — | Không có trong DTO | Client gửi bị bỏ qua |

## 3. Trạng thái và phê duyệt

- Cập nhật không tự thay đổi `approvalStatus`; quyền sửa theo trạng thái theo `docs/conventions/approval-2-level-spec.md` mục 3.9: `DRAFT`/`REJECTED_LEVEL1`/`REJECTED_LEVEL2` → sửa + gửi lại; `PENDING_APPROVAL`/`APPROVED_LEVEL1` → đóng băng (ẩn nút, backend 403); `APPROVED` → sửa qua "Lưu và phê duyệt" (chỉ người có `transferarea:approvec2`).
- Sau khi sửa ở trạng thái bị trả về, hồ sơ gửi lại vòng 1 (`PENDING_APPROVAL`).
- Trạng thái lưu số enum `ApprovalStatus` (DRAFT=0, PENDING_APPROVAL=2, APPROVED_LEVEL1=3, APPROVED=5, ARCHIVED=7, REJECTED_LEVEL1=8, REJECTED_LEVEL2=9).

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-301-01 | Cập nhật là partial update: chỉ field có trong request được áp dụng. | Update |
| BR-301-02 | `transferAreaCode` không nằm trong DTO update; client gửi bị bỏ qua. | Update |
| BR-301-03 | Nếu đổi `orgUnitId`, đơn vị mới phải trong scope user (`OrgUnitScopeService.Scope.allows`). | Update |
| BR-301-04 | Hồ sơ `PENDING_APPROVAL`/`APPROVED_LEVEL1` đóng băng — ẩn nút Sửa, backend từ chối 403. | Update |
| BR-301-05 | Hồ sơ `APPROVED` chỉ sửa qua "Lưu và phê duyệt" (quyền `transferarea:approvec2`), giữ nguyên APPROVED, bản cũ vào nhật ký. | Update |
| BR-301-06 | Bảng con khu nước neo buộc/điểm neo khi gửi thay thế toàn bộ trong cùng transaction. | Update |
| BR-301-07 | Mọi text trim trước khi lưu; `updatedBy`/`updatedAt` từ session. | Update |

### 4.2. Acceptance Criteria

| AC-ID | Given | When | Then | Oracle |
|---|---|---|---|---|
| AC-301-01 | Hồ sơ DRAFT, user có `transferarea:update` | PUT một số trường | Chỉ trường gửi được áp dụng; `updatedAt` mới | Response so sánh field không gửi không đổi |
| AC-301-02 | Hồ sơ PENDING_APPROVAL | PUT | API từ chối 403 "Không thể sửa hồ sơ đang trong quy trình phê duyệt" | Không đổi DB |
| AC-301-03 | Request gửi `transferAreaCode` | PUT | Server bỏ qua, mã giữ nguyên | Response giữ mã cũ |
| AC-301-04 | Đổi `orgUnitId` ngoài scope | PUT | Từ chối, không đổi dữ liệu | Message tiếng Việt |
| AC-301-05 | User thiếu `transferarea:update` | PUT | HTTP 403; UI ẩn nút Sửa | Permission khớp |

### 4.3. User Stories

- **US-301-01:** Là Chuyên viên, tôi muốn sửa các trường #2–#35 của Khu chuyển tải để cập nhật thông tin khi có thay đổi.
- **US-301-02:** Là Chuyên viên, tôi muốn chỉ gửi các trường cần sửa mà không nhập lại toàn bộ form.
- **US-301-03:** Là người có quyền phê duyệt, tôi muốn sửa hồ sơ Đã duyệt qua "Lưu và phê duyệt" để cập nhật mà không làm mất hiệu lực hồ sơ.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Cập nhật hồ sơ | `transferarea:update` |
| Sửa hồ sơ Đã duyệt | `transferarea:approvec2` |

| Vai trò | Sửa | Ghi chú |
|---|---|---|
| Chuyên viên thuộc đơn vị | Có nếu được gán `transferarea:update` | Chỉ sửa hồ sơ trong scope `orgUnitId` |
| Lãnh đạo Cảng vụ/Chi cục | Có nếu được gán quyền | — |
| Lãnh đạo Cục / Admin Cục | Có nếu được gán quyền | Xem metadata nhạy cảm (người tạo/người sửa/thời gian) |
| Quản trị hệ thống | Có | ROLE_SYSTEM_ADMIN vượt mọi kiểm tra |
| Người không có quyền | Không | API 403 |

**Admin Cục:** sửa hồ sơ trong phạm vi Cục khi có `transferarea:update` hoặc `admin:all`/`*`; sửa hồ sơ Đã duyệt cần `transferarea:approvec2`.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — dùng ma trận sửa theo trạng thái chuẩn (mục 3.9 convention). |
| 2 | Có bước phê duyệt không | Gián tiếp: sửa xong gửi lại quy trình 2 cấp qua submit-approval (F-303). |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị `orgUnitId`; ghi validate `OrgUnitScopeService.Scope.allows`. |
| 4 | Trường chỉ hiện trong điều kiện nào | `transferAreaCode` disabled; #48–#58 không có trong DTO update. |
| 5 | Quyền riêng | `transferarea:update`; sửa Đã duyệt cần `transferarea:approvec2`. |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không. |
| 7 | Tải lên tệp | Có — attachments qua endpoint riêng. |
| 8 | Giao diện khác mẫu chung | Không — dùng chung `TransferAreaForm.tsx` (create/edit), tuân thủ token system. |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| PUT | `/api/v1/transfer-area` | Cập nhật partial #2–#35; không nhận mã/kiểm toán | `transferarea:update` |
| GET | `/api/v1/transfer-area/{id}` | Lấy hồ sơ prefill form | `transferarea:read` |
| POST | `/api/v1/transfer-area/{id}/attachments` | Upload file | `transferarea:update` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT)

Không thay đổi schema. Update dùng cascade `ALL` + orphanRemoval trên bảng con khu nước neo buộc/điểm neo.
