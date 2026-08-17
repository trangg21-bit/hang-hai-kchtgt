---
id: F-006
name: Quản lý biểu tượng bản đồ
slug: quan-ly-bieu-tuong-ban-do
module-id: M-001
status: proposed
classification: local
priority: medium
created: 2026-07-27T00:00:00Z
last-updated: 2026-08-17
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý biểu tượng bản đồ

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-006
**Module:** M-001 — Quản trị hệ thống
**Loại:** chức năng thường (không có bước phê duyệt)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (TKCT)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

---

## 1. Mô tả ngắn

Thư viện biểu tượng tập trung dùng chung toàn hệ thống. Tài khoản có quyền quản lý biểu tượng bản đồ (tạo/sửa/xóa/xem, đổi trạng thái); các module nghiệp vụ (GIS) gọi API công khai để lấy danh sách biểu tượng đang sử dụng gán cho đối tượng trên bản đồ. Hiện thực: CRUD + upload ảnh base64 + tìm kiếm theo tên + lọc 2 trạng thái (tài liệu nền mục 3.6). Không có mã ký hiệu (code) — ID do hệ thống tự sinh (UUID); 2 trạng thái ACTIVE/INACTIVE (đã rút gọn từ 3, bỏ DEPRECATED).

## 2. Trường dữ liệu

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Tên biểu tượng | Có | Text, max 255 | — |
| 2 | Hình ảnh | Có | Upload PNG/JPEG/JPG, ≤500KB, ≤128×128px, tỉ lệ 1:1; lưu base64 trong DB | Validate client + server (BR-006-05) |
| 3 | Trạng thái | Có | Select 2 lựa chọn; default "Sử dụng" | ACTIVE/INACTIVE (BR-006-02) |
| 4 | Ghi chú | Không | Textarea, max 500 | — |

## 3. Trạng thái và phê duyệt

Theo tài liệu nền (mục 3.7) — trạng thái lưu dạng **số** (INT): 0=INACTIVE, 1=ACTIVE. **Không có bước phê duyệt.** Trạng thái riêng: **ACTIVE** (Sử dụng — hiển thị) / **INACTIVE** (Không sử dụng — ẩn khỏi danh sách dùng chung). Đã rút gọn từ 3 trạng thái (bỏ DEPRECATED).

## 4. Quy tắc và phân quyền riêng

| ID | Quy tắc |
|---|---|
| BR-006-01 | Không dùng mã code — ID do hệ thống tự sinh (UUID); **cần xóa cột `code` khỏi entity hiện tại** |
| BR-006-02 | 2 trạng thái ACTIVE/INACTIVE; INACTIVE ẩn khỏi danh sách dùng chung |
| BR-006-03 | Nên kiểm tra tham chiếu trước khi xóa (biểu tượng đang được module khác dùng) — hiện chưa implement (Could, US-006-08) |
| BR-006-04 | Ảnh lưu base64 trong DB (không lưu file/ổ đĩa) |
| BR-006-05 | Validate ảnh: PNG/JPEG/JPG, ≤500KB, ≤128×128px, tỉ lệ 1:1 — thông báo lỗi tiếng Việt cụ thể theo từng điều kiện (validate client + server) |
| AC-006-01 | Danh sách: STT, Tên, Thumbnail 30px, Trạng thái (tag xanh/xám), Thao tác (Xem/Sửa/Xóa) — rỗng → "Chưa có biểu tượng nào" |
| AC-006-02 | Tạo mới popup "Thêm mới thông tin biểu tượng trên bản đồ": Tên + Ảnh bắt buộc; lỗi validate ảnh báo đỏ dưới field |
| AC-006-03 | Sửa popup điền sẵn; thành công → toast "Đã cập nhật biểu tượng" |
| AC-006-04 | Xóa có popup xác nhận "Bạn có chắc chắn muốn xóa biểu tượng [Tên]?"; thành công → toast "Đã xóa biểu tượng" |
| AC-006-05 | Xem chi tiết: popup giống Thêm mới, tất cả field read-only — chỉ có nút Đóng |
| AC-006-06 | Tìm kiếm theo tên (trim); không có → "Không tìm thấy biểu tượng" |
| AC-006-07 | Lọc 2 trạng thái: Sử dụng / Không sử dụng; bỏ lọc → xem tất cả |
| AC-006-08 | Nút Thêm/Sửa/Xóa ẩn theo permission; menu chỉ hiện khi có `data:read` |
| AC-006-09 | Validate ảnh: PNG/JPEG/JPG, ≤500KB, ≤128×128px, 1:1 — từ chối upload + thông báo lỗi cụ thể |
| AC-006-10 | GET /api/symbols?status=ACTIVE — không yêu cầu quyền admin (công khai cho module khác) |

**Phân quyền riêng:** quyền theo mẫu `<resource>:<action>`, gán động qua nhóm/tài khoản (tài liệu nền mục 3.2); quyền mới phải đăng ký trong `PermissionSeeder.java`.

| Thao tác | Quyền cần có | Ghi chú |
|---|---|---|
| Xem danh sách / chi tiết biểu tượng | `data:read` (menu) | Tài khoản có `data:read` thấy menu |
| Tạo biểu tượng | `map:manage` | Nút "Thêm mới" ẩn nếu không có quyền |
| Sửa biểu tượng | `map:manage` | Nút "Sửa" ẩn nếu không có quyền |
| Xóa biểu tượng | `map:manage` | Nút "Xóa" ẩn nếu không có quyền |
| Lấy danh sách biểu tượng đang dùng cho bản đồ (module khác) | Công khai | GET /api/symbols?status=ACTIVE — không cần đăng nhập/quyền (AC-006-10) |

Bảng vai trò × thao tác (mô hình cũ — **đã thay thế** bằng bảng trên): system-admin full CRUD; admin view only; các vai trò khác no access. Trong mô hình động, quyền thể hiện qua `map:manage` + `data:read` gán động; runtime check ánh xạ API `/api/symbols` sang resource `map` (PermissionMiddleware `URL_TO_PERMISSION` "symbols"→"map" — khớp tài liệu nền mục 4, ví dụ `map:manage`); ROLE_SYSTEM_ADMIN / ROLE_SUPER_ADMIN vượt qua mọi kiểm tra quyền.

**Admin Cục:** mặc định theo tài liệu nền mục 3.8 — full quyền + xem thêm metadata (người tạo, người sửa cuối, thời gian tạo/cập nhật); không có gì đặc biệt ngoài mặc định.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — ACTIVE / INACTIVE (2 trạng thái, INT: 0=INACTIVE, 1=ACTIVE) |
| 2 | Có bước phê duyệt không | Không |
| 3 | Lọc cha-con / theo đơn vị | Không |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `map:manage`; menu cần `data:read` (runtime ánh xạ `/api/symbols` → resource `map`) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Có — GET /api/symbols?status=ACTIVE (không cần quyền) |
| 7 | Tải lên tệp | Có — Ảnh biểu tượng (base64 trong DB, validate BR-006-05) |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| GET | /api/symbols | Danh sách (search, filter status, phân trang) | Công khai |
| GET | /api/symbols/{id} | Chi tiết | Công khai |
| POST | /api/symbols | Tạo mới | `map:manage` |
| PUT | /api/symbols/{id} | Cập nhật | `map:manage` |
| DELETE | /api/symbols/{id} | Xóa | `map:manage` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Entity | Trường | Ghi chú |
|---|---|---|
| MapSymbol | id (UUID PK), name (VARCHAR 255 NOT NULL), description (TEXT), image (TEXT NOT NULL — base64), status (INT: 0=INACTIVE, 1=ACTIVE), createdBy, createdAt, updatedAt | ⚠️ Xóa cột `code`; status lưu INT (mục 3.7 nền) |
