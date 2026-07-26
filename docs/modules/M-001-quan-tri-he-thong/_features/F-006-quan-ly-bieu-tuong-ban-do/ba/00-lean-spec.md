---
feature-id: F-006
document: lean-spec
output-mode: lean
last-updated: 2026-07-27T00:00:00Z
---

# Feature F-006: Quản lý biểu tượng trên bản đồ — Lean Business Analysis Spec

## 1. Summary

| Field | Value |
|---|---|
| Feature ID | F-006 |
| Feature Name | Quản lý biểu tượng trên bản đồ |
| Slug | quan-ly-bieu-tuong-ban-do |
| Module | M-001 (Quản trị hệ thống) |
| Classification | local |
| Priority | medium |
| Complexity | Low-Medium (4 business rules, 2 actors) |
| Tech Stack | Spring Boot + Spring Security + JWT + ReactJS + MSSQL 2022 |

**Business Intent:** Tạo thư viện biểu tượng tập trung dùng chung cho toàn hệ thống. Admin quản lý biểu tượng (tạo, sửa, xóa, cập nhật trạng thái), các module nghiệp vụ gọi API lấy danh sách về gán cho đối tượng hiển thị trên bản đồ.

**Scope:** CRUD biểu tượng với 2 trạng thái (Sử dụng / Không sử dụng), upload ảnh có validate (PNG/JPEG, ≤500KB, ≤128×128px, 1:1), tìm kiếm theo tên, lọc trạng thái, phân trang, phân quyền nút.

---

## 2. Scope

### In Scope

| # | Capability | Description |
|---|---|---|
| 1 | Xem danh sách | Bảng phân trang: STT, Tên biểu tượng, Hình ảnh (thumbnail), Trạng thái (tag), Thao tác (Xem chi tiết/Sửa/Xóa) |
| 2 | Tạo biểu tượng | Popup "Thêm mới thông tin biểu tượng trên bản đồ": Tên, Upload ảnh (có validate), Trạng thái (default Sử dụng), Ghi chú |
| 3 | Sửa biểu tượng | Popup giống Thêm mới, dữ liệu điền sẵn |
| 4 | Xóa biểu tượng | Popup xác nhận trước khi xóa |
| 5 | Xem chi tiết | Popup giống Thêm mới, chế độ chỉ đọc |
| 6 | Tìm kiếm | Tìm theo tên biểu tượng |
| 7 | Lọc trạng thái | 2 lựa chọn: Sử dụng / Không sử dụng |
| 8 | Validate ảnh | PNG/JPEG/JPG, ≤500KB, ≤128×128px, tỉ lệ 1:1 |
| 9 | API công khai | GET /api/symbols?status=ACTIVE không yêu cầu quyền admin |
| 10 | Phân trang | Có tổng số biểu tượng |

### Out of Scope

| # | Capability | Reason |
|---|---|---|
| 1 | Mã ký hiệu (code) | Đã loại bỏ — dùng UUID tự sinh |
| 2 | Trạng thái "Ngừng sử dụng" (DEPRECATED) | Rút gọn còn 2 trạng thái |
| 3 | Kiểm tra tham chiếu trước khi xóa | US-006-08 Could |
| 4 | Upload file ra ổ đĩa / S3 | Dùng base64 trong DB |
| 5 | Gán biểu tượng vào đối tượng GIS | Thuộc M-007 |

---

## 3. Actors & Permissions

| Role | Level | Access |
|---|---|---|
| system-admin | Full CRUD | Tạo, sửa, xóa, xem tất cả biểu tượng |
| admin | View only | Xem danh sách (nút Thêm mới/Sửa/Xóa bị ẩn) |
| Các vai trò khác | No access | Không thấy menu |

**Permission codes:** `symbol.create`, `symbol.edit`, `symbol.delete`. Menu yêu cầu `data:read`.

---

## 4. User Stories (MoSCoW)

| ID | Story | Priority | Actor |
|---|---|---|---|
| US-006-01 | **As** system-admin, **I want to** view all map symbols | Must | system-admin |
| US-006-02 | **As** system-admin, **I want to** create a new symbol (name, image) | Must | system-admin |
| US-006-03 | **As** system-admin, **I want to** edit symbol info (name, image, status) | Must | system-admin |
| US-006-04 | **As** system-admin, **I want to** delete unused symbols | Must | system-admin |
| US-006-05 | **As** system-admin, **I want to** search symbols by name | Should | system-admin |
| US-006-06 | **As** system-admin, **I want to** filter symbols by status (active/inactive) | Should | system-admin |
| US-006-07 | **As** system-admin, **I want to** preview symbol details in read-only mode | Should | system-admin |
| US-006-08 | **As** system-admin, **I want to** know which modules use a symbol before deleting | Could | system-admin |
| US-006-09 | **As** GIS module, **I want to** GET /api/symbols?status=ACTIVE | Could | Developer |

---

## 5. Acceptance Criteria

| ID | Acceptance Criterion | Negative Path |
|---|---|---|
| AC-006-01 | Danh sách: STT, Tên biểu tượng, Hình ảnh (thumbnail), Trạng thái (tag), Thao tác (Xem/Sửa/Xóa) | Rỗng → "Chưa có biểu tượng nào" |
| AC-006-02 | Tạo mới: popup "Thêm mới thông tin biểu tượng trên bản đồ", Tên (required, max 255), Ảnh (required, validate BR-006-05), Trạng thái (default Sử dụng), Ghi chú (optional, max 500) | Lỗi validate ảnh → từ chối + báo đỏ dưới field |
| AC-006-03 | Sửa: popup giống Thêm mới, dữ liệu điền sẵn, sửa được Tên/Ảnh/Trạng thái/Ghi chú | Toast "Đã cập nhật biểu tượng" |
| AC-006-04 | Xóa: popup xác nhận "Bạn có chắc chắn muốn xóa biểu tượng [Tên]?" | Toast "Đã xóa biểu tượng" |
| AC-006-05 | Xem chi tiết: popup giống Thêm mới, tất cả field read-only | Chỉ có nút Đóng |
| AC-006-06 | Tìm kiếm theo tên biểu tượng | Không có → "Không tìm thấy biểu tượng" |
| AC-006-07 | Lọc 2 trạng thái: Sử dụng / Không sử dụng | Bỏ lọc → xem tất cả |
| AC-006-08 | Nút ẩn/hiện theo permission `symbol.create/edit/delete` | Menu chỉ hiện nếu `data:read` |
| AC-006-09 | Validate ảnh: PNG/JPEG/JPG, ≤500KB, ≤128×128px, 1:1 | Từ chối upload + thông báo lỗi cụ thể |
| AC-006-10 | GET /api/symbols?status=ACTIVE cho module khác | Không cần quyền admin |

---

## 6. Business Rules

| ID | Rule | Exception |
|---|---|---|
| BR-006-01 | Không dùng mã code — ID do hệ thống tự sinh (UUID) | Không có |
| BR-006-02 | 2 trạng thái: ACTIVE (hiển thị), INACTIVE (ẩn) | Không có |
| BR-006-03 | Nên kiểm tra tham chiếu trước khi xóa | Hiện chưa implement (Could) |
| BR-006-04 | Ảnh lưu base64 trong DB, không lưu file | Không có |
| BR-006-05 | Validate ảnh: PNG/JPEG/JPG, ≤500KB, ≤128×128px, tỉ lệ 1:1 | Từ chối upload nếu vi phạm |

---

## 7. Entities

| Entity | Fields | Constraints | Notes |
|---|---|---|---|
| **MapSymbol** | id (UUID PK), name (VARCHAR 255 NOT NULL), description (TEXT), image (TEXT NOT NULL — base64), status (INT: 0=INACTIVE, 1=ACTIVE), createdBy (UUID), createdAt, updatedAt | image validate BR-006-05 | ⚠️ Cần xóa cột `code` khỏi entity hiện tại. |

---

## 8. API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/symbols | Danh sách (search, status filter, phân trang) | Không yêu cầu |
| GET | /api/symbols/{id} | Chi tiết | Không yêu cầu |
| POST | /api/symbols | Tạo mới (name, description, image, status) | `symbol.create` |
| PUT | /api/symbols/{id} | Cập nhật | `symbol.edit` |
| DELETE | /api/symbols/{id} | Xóa | `symbol.delete` |

---

## 9. Image Validation Rules (BR-006-05)

| Rule | Value | Error Message |
|---|---|---|
| Format | PNG, JPEG, JPG | "Ảnh biểu tượng phải có định dạng PNG hoặc JPG" |
| File size | ≤ 500KB | "Ảnh biểu tượng không được vượt quá 500KB" |
| Dimensions | ≤ 128×128px | "Ảnh biểu tượng không được vượt quá 128×128 pixels" |
| Aspect ratio | 1:1 (square) | "Ảnh biểu tượng phải có tỉ lệ 1:1 (hình vuông)" |

Validate cả client-side (trước khi upload) và server-side (trong service layer).

---

## 10. UI/UX Requirements — Theme Token Compliance

> **TUYỆT ĐỐI KHÔNG hardcode màu hex, spacing, font-size trong component.**

### 10.1 Shared Layout

Dùng `AppLayout.tsx`: sidebar `272px`, header `64px`, nền `#eaf0f6`.

### 10.2 List Screen — dùng shared components

| Component | Vai trò |
|---|---|
| `ScreenHeader` | "Quản trị hệ thống > Quản lý biểu tượng trên bản đồ" |
| `FilterBar` | Input.Search (tìm theo tên) + Select trạng thái (2 lựa chọn) + Tìm kiếm/Reload |
| `DataTable` | STT, Tên biểu tượng (bold), Hình ảnh (thumbnail 30px), Trạng thái (tag xanh/xám), Thao tác (Xem/Sửa/Xóa) |
| `Pagination` | Tổng số biểu tượng |

### 10.3 Popup — 3 chế độ dùng chung 1 form

| Popup | Title | Mode |
|---|---|---|
| Thêm mới | "Thêm mới thông tin biểu tượng trên bản đồ" | Form trống |
| Sửa | "Cập nhật thông tin biểu tượng trên bản đồ" | Form điền sẵn |
| Xem chi tiết | "Chi tiết biểu tượng trên bản đồ" | Form read-only |

Form fields: Tên (required, max 255), Upload ảnh + preview 60×60px (required, validate BR-006-05), Trạng thái (Select 2 options, default Sử dụng), Ghi chú (textarea, max 500).

Footer buttons: `borderRadius = radiusPill`, `height = 40`. Form.Item `marginBottom = spaceFormField` (12px).

### 10.4 Trạng thái giao diện

| State | Display |
|---|---|
| Loading | Spin |
| Empty | "Chưa có biểu tượng nào" |
| Not found | "Không tìm thấy biểu tượng" |
| Error | Alert + nút Thử lại (`actionPrimary`) |
| Success | Toast message |
| Image invalid | Thông báo đỏ dưới trường upload |

### 10.5 Accent Budget

`actionPrimary` = 1 lần: nút "Thêm mới".

### 10.6 Status Tags

| Status | Color |
|---|---|
| Sử dụng (ACTIVE) | Xanh lá |
| Không sử dụng (INACTIVE) | Xám |

---

## 11. Gap Analysis (vs code hiện tại)

| # | Gap | Severity | Action |
|---|---|---|---|
| 1 | Entity có cột `code` | Cao | **Xóa** khỏi entity, DTO, DB |
| 2 | FE có field "Mã ký hiệu" | Cao | **Xóa** khỏi form và bảng |
| 3 | FE không dùng shared list-view components | Cao | Refactor |
| 4 | FE hardcode màu (`#fafafa`, `#d9d9d9`, `#bfbfbf`) | Cao | Thay bằng token |
| 5 | 3 trạng thái → cần 2 | Trung bình | Bỏ DEPRECATED |
| 6 | Menu "Biểu tượng bản đồ" → "Quản lý biểu tượng trên bản đồ" | Trung bình | Sửa AppLayout.tsx |
| 7 | Chưa có validate ảnh | Trung bình | Thêm client + server |
| 8 | Chưa kiểm tra tham chiếu trước xóa | Thấp | US-006-08 Could |

---

## 12. Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| **Q1: Creates new domain elements?** | **No** | MapSymbol entity đã tồn tại. Chỉ cần xóa cột `code`, sửa enum status. |
| **Q2: Affects system architecture?** | **No** | API đã hoạt động. Thay đổi nhỏ: bỏ field code, thêm validate ảnh. |
| **Q3: Approach clear from existing architecture?** | **Yes** | Pattern CRUD chuẩn + refactor FE dùng shared components. |

**Triage Verdict:** Route thẳng đến **engineering-tech-lead**. Không cần SA.
