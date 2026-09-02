---
id: F-006
name: Quản lý biểu tượng bản đồ
slug: quan-ly-bieu-tuong-ban-do
module-id: M-001
status: proposed
classification: local
priority: medium
created: 2026-07-27T00:00:00Z
last-updated: 2026-09-02
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý biểu tượng bản đồ

**Chức năng:** F-006
**Module:** M-001 — Quản trị hệ thống
**Loại:** chức năng thường (không có bước phê duyệt)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` + TKCT gốc

---

## 1. Mô tả ngắn

Thư viện biểu tượng tập trung dùng chung toàn hệ thống. Tài khoản có quyền quản lý biểu tượng bản đồ (tạo/sửa/xóa/xem); các module nghiệp vụ (GIS) gọi API công khai để lấy danh sách biểu tượng đang sử dụng gán cho đối tượng trên bản đồ.

Hiện thực: CRUD + upload ảnh base64 + tìm kiếm theo **mã hoặc tên** + lọc 2 trạng thái. Mỗi biểu tượng có **mã hiển thị tự sinh** (`BT-XXXX`, disabled, bất biến khi sửa) — khớp cột `code` trong entity `MapSymbol` hiện có. 2 trạng thái ACTIVE/INACTIVE.

## 2. Trường dữ liệu

### 2.1. Form Tạo mới biểu tượng (7 trường theo ma trận Excel #43)

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Mã biểu tượng | Có (tự sinh) | Input Text, disabled; server sinh `BT-%04d`, bất biến | Không nhập tay; không sửa |
| 2 | Tên biểu tượng | Có | Text, max 255 | — |
| 3 | Hình ảnh | Có | Upload PNG/JPEG/JPG, ≤500KB, ≤128×128px, tỉ lệ 1:1; base64 trong DB | Validate client + server (BR-006-05) |
| 4 | Trạng thái | Có | Select 2 lựa chọn; default "Sử dụng" | ACTIVE/INACTIVE (BR-006-02) |
| 5 | Ghi chú | Không | Textarea, max 500 | — |
| 6 | Người cập nhật | Không (read-only) | Text, từ `updatedBy` (BaseEntity) | chỉ hiển thị ở Xem chi tiết |
| 7 | Ngày cập nhật | Không (read-only) | Text, từ `updatedAt` (BaseEntity) | chỉ hiển thị ở Xem chi tiết |

### 2.2. Form Chỉnh sửa / Xem chi tiết

Cùng 7 trường mục 2.1. **Chỉnh sửa:** form điền sẵn, `Mã biểu tượng` read-only (không đổi). **Xem chi tiết:** toàn bộ field read-only, chỉ có nút Đóng (AC-006-05).

## 3. Trạng thái và phê duyệt

Theo tài liệu nền (mục 3.7) — trạng thái lưu dạng **số** (INT): 0=INACTIVE, 1=ACTIVE. **Không có bước phê duyệt.** Trạng thái riêng: ACTIVE (Sử dụng — hiển thị) / INACTIVE (Không sử dụng — ẩn khỏi danh sách dùng chung). Mã biểu tượng (`code`) sinh một lần lúc tạo, không đổi khi sửa.

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc |
|---|---|
| BR-006-01 | Mã biểu tượng `code` VARCHAR(10) NOT NULL UNIQUE, server tự sinh `BT-%04d` lúc tạo; bất biến khi sửa — **giữ cột `code`** (khớp entity `MapSymbol` + Excel #43 trường 1) |
| BR-006-02 | 2 trạng thái ACTIVE/INACTIVE; INACTIVE ẩn khỏi danh sách dùng chung |
| BR-006-03 | Kiểm tra tham chiếu trước khi xóa (biểu tượng đang được module khác dùng) — hiện chưa implement (Could, US-006-08) |
| BR-006-04 | Ảnh lưu base64 trong DB (không lưu file/ổ đĩa) |
| BR-006-05 | Validate ảnh: PNG/JPEG/JPG, ≤500KB, ≤128×128px, tỉ lệ 1:1 — thông báo lỗi tiếng Việt cụ thể (client + server) |

### 4.2. Acceptance Criteria kế thừa

| ID | Quy tắc |
|---|---|
| AC-006-01 | Danh sách: STT, Mã, Tên, Thumbnail 30px, Trạng thái (tag xanh/xám), Thao tác (Xem/Sửa/Xóa) — rỗng → "Chưa có biểu tượng nào" |
| AC-006-02 | Tạo mới popup "Thêm mới thông tin biểu tượng trên bản đồ": Tên + Ảnh bắt buộc; Mã tự sinh; lỗi validate ảnh báo đỏ dưới field |
| AC-006-03 | Sửa popup điền sẵn (Mã read-only); thành công → toast "Đã cập nhật biểu tượng" |
| AC-006-04 | Xóa có popup xác nhận "Bạn có chắc chắn muốn xóa biểu tượng [Tên]?"; thành công → toast "Đã xóa biểu tượng" |
| AC-006-05 | Xem chi tiết: popup giống Thêm mới, tất cả field read-only (gồm Người/Ngày cập nhật) — chỉ có nút Đóng |
| AC-006-06 | Tìm kiếm theo **mã hoặc tên** (trim); không có → "Không tìm thấy biểu tượng" |
| AC-006-07 | Lọc 2 trạng thái: Sử dụng / Không sử dụng; bỏ lọc → xem tất cả |
| AC-006-08 | Nút Thêm/Sửa/Xóa ẩn theo permission; menu chỉ hiện khi có `data:read` |
| AC-006-09 | Validate ảnh: PNG/JPEG/JPG, ≤500KB, ≤128×128px, 1:1 — từ chối upload + thông báo lỗi cụ thể |
| AC-006-10 | GET /api/symbols?status=ACTIVE — không yêu cầu quyền admin (công khai cho module khác) |

### 4.3. User Stories kế thừa

Chỉ US-006-08 được tham chiếu trong BR-006-03 (priority Could).

### 4.4. Phân quyền riêng

| Thao tác | Quyền cần có | Ghi chú |
|---|---|---|
| Xem danh sách / chi tiết biểu tượng | `data:read` (menu) | — |
| Tạo biểu tượng | `map:manage` | Nút "Thêm mới" ẩn nếu không có quyền |
| Sửa biểu tượng | `map:manage` | — |
| Xóa biểu tượng | `map:manage` | — |
| Lấy danh sách biểu tượng đang dùng (module khác) | Công khai | GET /api/symbols?status=ACTIVE + /api/symbols/options |

Quyền seed `map:manage` trong `PermissionSeeder.java`; runtime ánh xạ `/api/symbols` → resource `map` (`PermissionMiddleware` URL_TO_PERMISSION). ROLE_SYSTEM_ADMIN / ROLE_SUPER_ADMIN vượt qua mọi kiểm tra.

**Admin Cục:** mặc định theo tài liệu nền mục 3.8 — full quyền + xem thêm metadata (người tạo/sửa cuối, thời gian tạo/cập nhật).

## 5. Điểm khác biệt so với mẫu chung (đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — ACTIVE / INACTIVE (INT: 0=INACTIVE, 1=ACTIVE) |
| 2 | Có bước phê duyệt không | Không |
| 3 | Lọc cha-con / theo đơn vị | Không |
| 4 | Trường chỉ hiện trong điều kiện nào | Mã biểu tượng tự sinh (disabled); Người/Ngày cập nhật chỉ hiện ở Xem chi tiết |
| 5 | Quyền riêng | `map:manage`; menu cần `data:read` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Có — GET /api/symbols?status=ACTIVE, GET /api/symbols/options |
| 7 | Tải lên tệp | Có — Ảnh biểu tượng (base64 trong DB, validate BR-006-05) |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, SA chốt)

| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| GET | /api/symbols | Danh sách (search theo mã/tên, filter status, phân trang) | Công khai |
| GET | /api/symbols/options | Danh sách rút gọn cho dropdown/module khác | Công khai |
| GET | /api/symbols/{id} | Chi tiết | Công khai |
| POST | /api/symbols | Tạo mới (không nhận `code` — server sinh) | `map:manage` |
| PUT | /api/symbols/{id} | Cập nhật (không sửa `code`) | `map:manage` |
| DELETE | /api/symbols/{id} | Xóa | `map:manage` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, SA chốt)

| Entity | Trường | Ghi chú |
|---|---|---|
| MapSymbol | id (UUID PK), code (VARCHAR(10) NOT NULL UNIQUE — tự sinh `BT-%04d`, bất biến), name (VARCHAR 255 NOT NULL), description (TEXT), image (TEXT NOT NULL — base64), status (INT: 0=INACTIVE, 1=ACTIVE), createdBy, updatedBy, createdAt, updatedAt | **Giữ cột `code`** — khớp Excel #43 trường 1 và entity hiện có |
