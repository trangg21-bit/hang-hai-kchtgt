---
id: F-311
name: "Lịch sử Khu tránh trú bão"
slug: quan-ly-khu-tranh-tru-bao-lich-su
module-id: M-1025
status: proposed
classification: local
priority: medium
created: "2026-08-28T06:26:01Z"
last-updated: "2026-08-28T06:26:01Z"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Lịch sử Khu tránh trú bão

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu 7 section).
**Chức năng:** F-311 — Lịch sử Khu tránh trú bão (StormShelterArea).
**Module:** M-1025 — Quản lý khu nước KCHTGT.
**Loại:** chức năng thường (không có bước phê duyệt).
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` mục 4 (approved-only); bảng `infrastructure_history`.

## 1. Mô tả ngắn

Chức năng cho phép người dùng có `stormshelter:history` xem lịch sử thay đổi và phê duyệt của hồ sơ Khu tránh trú bão. Lịch sử chỉ hiển thị thay đổi ĐÃ duyệt (approved-only): bản ghi Nháp/Lưu tạm không xuất hiện; chỉ khi hồ sơ đã duyệt và sửa thành công ("Lưu và phê duyệt") mới ghi bản cũ vào nhật ký.

## 2. Trường dữ liệu

| # | Trường | Kiểu | Ghi chú |
|---|---|---|---|
| 1 | Thời gian thay đổi/phê duyệt | Text read-only | |
| 2 | Người thực hiện | Text read-only | Ưu tiên `fullName` |
| 3 | Hành động | Text read-only | Duyệt C1/C2, Từ chối, Cập nhật đã duyệt |
| 4 | Nội dung phê duyệt / lý do từ chối | Text read-only | |
| 5 | Bản cũ (snapshot) | Text read-only | Nhật ký thay đổi |

## 3. Trạng thái và phê duyệt

- **Không có bước phê duyệt** cho chức năng lịch sử. Approved-only theo sheet "1 số logic" + tài liệu phê duyệt Mục 5 (Ca sử dụng 8).

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-311-01 | Lịch sử chỉ hiển thị thay đổi ĐÃ duyệt. | History |
| BR-311-02 | Nháp/Lưu tạm không tạo/không hiển thị bản ghi. | History |
| BR-311-03 | Data scope theo đơn vị. | History |

### 4.2. Acceptance Criteria

| AC-ID | Given | When | Then | Oracle |
|---|---|---|---|---|
| AC-311-01 | Hồ sơ đã duyệt + sửa "Lưu và phê duyệt" | Mở Lịch sử | Hiển thị bản cũ + người + thời điểm | `infrastructure_history` có bản ghi |
| AC-311-02 | Hồ sơ Nháp/Lưu tạm | Mở Lịch sử | Không hiển thị bản ghi | Không có history |
| AC-311-03 | Thiếu `stormshelter:history` | GET | 403; UI ẩn nút | Permission khớp |

### 4.3. User Stories

- **US-311-01:** Là Chuyên viên, tôi muốn xem lịch sử thay đổi đã duyệt của hồ sơ để truy vết.
- **US-311-02:** Là Admin Cục, tôi muốn xem lịch sử đầy đủ.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem lịch sử | `stormshelter:history` |

| Vai trò | Xem lịch sử | Ghi chú |
|---|---|---|
| Chuyên viên thuộc đơn vị | Có nếu gán `stormshelter:history`, theo scope | — |
| Lãnh đạo Cảng vụ/Chi cục | Có theo scope | — |
| Lãnh đạo Cục / Admin Cục | Có toàn phạm vi Cục | Xem metadata nhạy cảm |
| Quản trị hệ thống | Có | ROLE_SYSTEM_ADMIN |
| Người không có quyền | Không | API 403 |

**Admin Cục:** xem lịch sử toàn phạm vi Cục khi có `stormshelter:history` hoặc `admin:all`/`*`.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không. |
| 2 | Có bước phê duyệt không | Không có bước phê duyệt (chỉ xem). |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị `orgUnitId`. |
| 4 | Trường chỉ hiện trong điều kiện nào | Bản ghi lịch sử chỉ hiện khi có thay đổi ĐÃ duyệt. |
| 5 | Quyền riêng | `stormshelter:history`. |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không. |
| 7 | Tải lên tệp | Không áp dụng. |
| 8 | Giao diện khác mẫu chung | Không — mở từ menu dòng "Lịch sử". |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/storm-shelter/{id}/history` | Lịch sử hồ sơ | `stormshelter:history` |
| GET | `/api/v1/storm-shelter/history/all` | Lịch sử toàn module | `stormshelter:history` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT)

Không thay đổi schema. Truy vấn `infrastructure_history`.
