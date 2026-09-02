---
id: F-305
name: "Lịch sử Khu chuyển tải"
slug: quan-ly-khu-chuyen-tai-lich-su
module-id: M-1025
status: proposed
classification: local
priority: medium
created: "2026-08-28T06:25:57Z"
last-updated: "2026-08-28T06:25:57Z"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Lịch sử Khu chuyển tải

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu 7 section).
**Chức năng:** F-305 — Lịch sử Khu chuyển tải (TransferArea).
**Module:** M-1025 — Quản lý khu nước KCHTGT.
**Loại:** chức năng thường (không có bước phê duyệt).
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` mục 4 (Lịch sử approved-only); bảng `infrastructure_history`.

## 1. Mô tả ngắn

Chức năng cho phép người dùng có `transferarea:history` xem lịch sử thay đổi và phê duyệt của một hồ sơ Khu chuyển tải. Lịch sử **chỉ hiển thị các thay đổi ĐÃ duyệt (approved-only)** — bản ghi mới tạo ở Nháp/Lưu tạm không xuất hiện; chỉ khi hồ sơ đã duyệt và được chỉnh sửa thành công ("Lưu và phê duyệt") mới ghi nhận bản cũ vào nhật ký thay đổi.

## 2. Trường dữ liệu

| # | Trường | Kiểu | Ghi chú |
|---|---|---|---|
| 1 | Thời gian thay đổi/phê duyệt | Text read-only | |
| 2 | Người thực hiện | Text read-only | Ưu tiên `fullName`, không hiển thị email/UUID |
| 3 | Hành động | Text read-only | Duyệt C1 / Duyệt C2 / Từ chối / Cập nhật hồ sơ đã duyệt |
| 4 | Nội dung phê duyệt / lý do từ chối | Text read-only | `portAuthorityApprovalContent` / `departmentApprovalContent` / `rejectionReason` |
| 5 | Bản cũ (snapshot thay đổi) | Text read-only | Lưu trong nhật ký thay đổi |

## 3. Trạng thái và phê duyệt

- **Không có bước phê duyệt** cho chính chức năng lịch sử.
- **Approved-only:** màn Lịch sử chỉ hiển thị thay đổi đã phê duyệt; không hiển thị phiên bản nháp/lưu tạm (nguồn sheet "1 số logic" + tài liệu phê duyệt Mục 5 — Ca sử dụng 8).

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-305-01 | Lịch sử chỉ hiển thị thay đổi ĐÃ duyệt (approved-only). | History |
| BR-305-02 | Bản ghi Nháp/Lưu tạm không tạo/không hiển thị bản ghi lịch sử. | History |
| BR-305-03 | Chỉ xem lịch sử hồ sơ trong phạm vi đơn vị user. | History |

### 4.2. Acceptance Criteria

| AC-ID | Given | When | Then | Oracle |
|---|---|---|---|---|
| AC-305-01 | Hồ sơ đã duyệt và được sửa "Lưu và phê duyệt" | Mở Lịch sử | Hiển thị bản cũ + người thực hiện + thời điểm | `infrastructure_history` có bản ghi |
| AC-305-02 | Hồ sơ mới tạo ở Nháp/Lưu tạm | Mở Lịch sử | Không hiển thị bản ghi nào | Không có history cho hồ sơ chưa duyệt |
| AC-305-03 | User thiếu `transferarea:history` | GET history | HTTP 403; UI ẩn nút Lịch sử | Permission khớp |

### 4.3. User Stories

- **US-305-01:** Là Chuyên viên, tôi muốn xem lịch sử thay đổi đã duyệt của hồ sơ để truy vết quyết định.
- **US-305-02:** Là Admin Cục, tôi muốn xem lịch sử đầy đủ (người tạo, người sửa, thời gian).

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem lịch sử | `transferarea:history` |

| Vai trò | Xem lịch sử | Ghi chú |
|---|---|---|
| Chuyên viên thuộc đơn vị | Có nếu gán `transferarea:history`, theo scope | — |
| Lãnh đạo Cảng vụ/Chi cục | Có theo scope | — |
| Lãnh đạo Cục / Admin Cục | Có toàn phạm vi Cục | Xem thêm metadata nhạy cảm |
| Quản trị hệ thống | Có | ROLE_SYSTEM_ADMIN vượt mọi kiểm tra |
| Người không có quyền | Không | API 403 |

**Admin Cục:** xem lịch sử hồ sơ toàn phạm vi Cục khi có `transferarea:history` hoặc `admin:all`/`*`.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — hiển thị trạng thái chuẩn. |
| 2 | Có bước phê duyệt không | Không có bước phê duyệt (chỉ xem lịch sử). |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị `orgUnitId`; chỉ xem lịch sử hồ sơ trong scope. |
| 4 | Trường chỉ hiện trong điều kiện nào | Bản ghi lịch sử chỉ hiện khi có thay đổi ĐÃ duyệt (approved-only). |
| 5 | Quyền riêng | `transferarea:history`. |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không. |
| 7 | Tải lên tệp | Không áp dụng. |
| 8 | Giao diện khác mẫu chung | Không — mở từ menu dòng "Lịch sử", dùng chung theo convention. |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/transfer-area/{id}/history` | Lịch sử phê duyệt/thay đổi của hồ sơ | `transferarea:history` |
| GET | `/api/v1/transfer-area/history/all` | Danh sách lịch sử toàn module (nếu cần) | `transferarea:history` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT)

Không thay đổi schema. Truy vấn từ bảng tập trung `infrastructure_history` (bỏ `change_logs`/`approval_logs` legacy).
