---
id: F-006
name: Quản lý biểu tượng bản đồ
slug: quan-ly-bieu-tuong-ban-do
module-id: M-001
status: proposed
classification: local
priority: medium
created: 2026-07-27T00:00:00Z
last-updated: 2026-08-17T00:00:00Z
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý biểu tượng bản đồ

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu mục 4 của tài liệu nền)
**Feature:** F-006
**Module:** M-001 — Quản trị hệ thống
**Loại:** chức năng thường (không có bước phê duyệt)
**Tham chiếu:** tài liệu nền `01-base-pattern.md` (bắt buộc đọc trước)

## 1. Tổng quan

Thư viện biểu tượng tập trung dùng chung toàn hệ thống. Admin (system-admin) quản lý biểu tượng bản đồ (tạo/sửa/xóa/xem, đổi trạng thái); các module nghiệp vụ (GIS) gọi API công khai để lấy danh sách biểu tượng đang sử dụng gán cho đối tượng trên bản đồ. Hiện thực: CRUD + upload ảnh base64 + tìm kiếm theo tên + lọc 2 trạng thái.

## 2. Trường dữ liệu

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Tên biểu tượng | Có | Text, max 255 | |
| 2 | Hình ảnh | Có | Upload PNG/JPEG/JPG, ≤500KB, ≤128×128px, tỉ lệ 1:1; lưu base64 trong DB | Validate client + server |
| 3 | Trạng thái | Có | Select 2 lựa chọn; default "Sử dụng" | ACTIVE/INACTIVE |
| 4 | Ghi chú | Không | Textarea, max 500 | |

## 3. Trạng thái & phê duyệt

Theo tài liệu nền (mục 3): không có bước phê duyệt. Trạng thái riêng: **ACTIVE** (Sử dụng — hiển thị) / **INACTIVE** (Không sử dụng — ẩn). Đã rút gọn từ 3 trạng thái (bỏ DEPRECATED).

## 4. Quy tắc và phân quyền riêng (chưa có trong tài liệu nền)

| ID | Quy tắc |
|---|---|
| BR-006-01 | Không dùng mã code — ID do hệ thống tự sinh (UUID); **cần xóa cột `code` khỏi entity hiện tại** |
| BR-006-02 | 2 trạng thái ACTIVE/INACTIVE; INACTIVE ẩn khỏi danh sách dùng chung |
| BR-006-04 | Ảnh lưu base64 trong DB (không lưu file/ổ đĩa) |
| BR-006-05 | Validate ảnh: PNG/JPEG/JPG, ≤500KB, ≤128×128px, tỉ lệ 1:1 — thông báo lỗi tiếng Việt cụ thể theo từng điều kiện |
| AC-006-01 | Danh sách: STT, Tên, Thumbnail 30px, Trạng thái (tag xanh/xám), Thao tác (Xem/Sửa/Xóa) — rỗng → "Chưa có biểu tượng nào" |
| AC-006-02 | Tạo mới popup "Thêm mới thông tin biểu tượng trên bản đồ": Tên + Ảnh bắt buộc; lỗi validate ảnh báo đỏ dưới field |
| AC-006-03 | Sửa popup điền sẵn; thành công → toast "Đã cập nhật biểu tượng" |
| AC-006-04 | Xóa có popup xác nhận "Bạn có chắc chắn muốn xóa biểu tượng [Tên]?"; thành công → toast "Đã xóa biểu tượng" |
| AC-006-06 | Tìm kiếm theo tên (trim); không có → "Không tìm thấy biểu tượng" |
| AC-006-08 | Nút Thêm/Sửa/Xóa ẩn theo permission; menu chỉ hiện khi có `data:read` |
| AC-006-10 | GET /api/symbols?status=ACTIVE — không yêu cầu quyền admin |

## 5. Điểm khác biệt so với mẫu chung (bảng 8 dòng của tài liệu nền)

| # | Điểm mở rộng | Khai báo |
|---|---|---|
| 1 | Trạng thái riêng | ACTIVE / INACTIVE (2 trạng thái) |
| 2 | Luồng phê duyệt | Không có |
| 3 | Filter cha-con / đơn vị | Không có |
| 4 | Conditional field | Không có |
| 5 | Permission riêng | `symbol:create`, `symbol:edit`, `symbol:delete`; menu cần `data:read` |
| 6 | API công khai | GET /api/symbols?status=ACTIVE (không cần quyền) |
| 7 | Upload file | Ảnh base64 trong DB (validate BR-006-05) |
| 8 | Khác biệt UI | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| GET | /api/symbols | Danh sách (search, filter status, phân trang) | Công khai |
| GET | /api/symbols/{id} | Chi tiết | Công khai |
| POST | /api/symbols | Tạo mới | `symbol:create` |
| PUT | /api/symbols/{id} | Cập nhật | `symbol:edit` |
| DELETE | /api/symbols/{id} | Xóa | `symbol:delete` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Entity | Trường | Ghi chú |
|---|---|---|
| MapSymbol | id (UUID PK), name (VARCHAR 255 NOT NULL), description (TEXT), image (TEXT NOT NULL — base64), status (INT: 0=INACTIVE, 1=ACTIVE), createdBy, createdAt, updatedAt | ⚠️ Xóa cột `code`; status lưu INT |
