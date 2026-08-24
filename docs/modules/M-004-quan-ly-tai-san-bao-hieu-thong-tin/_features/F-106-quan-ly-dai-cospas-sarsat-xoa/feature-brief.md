---
id: F-106
name: "Quản lý Đài COSPAS-SARSAT - Xóa"
slug: quan-ly-dai-cospas-sarsat-xoa
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:14Z"
last-updated: "2026-08-23"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Đài COSPAS-SARSAT - Xóa

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-106
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Loại:** chức năng có bước phê duyệt
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **\"Điểm khác biệt so với mẫu chung\"** (mục 5, dòng 3 — *\"Lọc cha-con / theo đơn vị\"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

---

## 1. Mô tả ngắn

Tính năng cho phép operator xóa một bản ghi Đài COSPAS-SARSAT. Chỉ bản ghi ở trạng thái **DRAFT** mới được xóa — thao tác xóa không phải soft-delete mà chuyển trạng thái thành **DELETED** (Lịch sử), giữ nguyên bản ghi trong cơ sở dữ liệu để phục vụ kiểm toán. Bản ghi đã được phê duyệt (APPROVED, PUBLISHED) không cho phép xóa trực tiếp — phải từ chối duyệt trước. Hệ thống ghi nhận lịch sử DELETE vào audit log.

## 2. Trường dữ liệu

Bảng mô tả các trường trên form tạo mới/chỉnh sửa:

| # | Tên trường (theo Excel) | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|------------------------|----------|-----------------|---------|
| 1 | Đơn vị quản lý | Có | SelectOrgCode + FK `org_unit_id` UUID | Chỉ xem, không sửa |
| 2 | Đơn vị khai thác | Có | SelectCateOther (TreeSelect) | Chỉ xem, không sửa |
| 3 | Mã đài | Có | Input (disabled, tự sinh `SARSAT-{seq}`) | Chỉ xem, không sửa |
| 4 | Tên đài | Có | InputTextArea, max 255 ký tự | Chỉ xem, không sửa |
| 5 | Địa điểm (Tỉnh/TP) | Có | SelectCateOther (TreeSelect theo cấp hành chính) | Chỉ xem, không sửa |
| 6 | Địa điểm chi tiết | Không | InputTextArea, max 500 ký tự | Chỉ xem, không sửa |
| 7 | Tình trạng | Có | SelectAppParams (trạng thái thiết bị) | Chỉ xem, không sửa |
| 8 | Vùng phủ sóng | Không | InputTextArea, max 1000 ký tự | Chỉ xem, không sửa |
| 9 | Dịch vụ cung cấp | Không | SelectAppParams (multi-select) | Chỉ xem, không sửa |
| 10 | Tần số liên lạc | Không | InputTextArea, max 255 ký tự | Chỉ xem, không sửa |
| 11 | Ghi chú | Không | InputTextArea, max 1000 ký tự | Chỉ xem, không sửa |
| 12 | Loại đối tượng (GIS) | Không | Select (Điểm / Đường / Vùng) | Chỉ xem, không sửa |
| 13 | Biểu tượng (GIS) | Không | Select (chọn biểu tượng bản đồ) | Chỉ xem, không sửa |
| 14 | Hệ quy chiếu (GIS) | Không | Text, mặc định WGS84 | Chỉ xem, không sửa |
| 15 | Quy tắc hiển thị (GIS) | Không | Text | Chỉ xem, không sửa |
| 16 | Tọa độ (GIS) | Không | LongLatTable (tọa độ điểm/đường/vùng) | Chỉ xem, không sửa |
| 17 | File đính kèm | Không | FileUpload (multiple) | Chỉ xem, không sửa |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.7 (trạng thái lưu dạng số, không lưu chữ).
- Chức năng có bước phê duyệt → Quy trình 2 cấp:
  - Chỉ bản ghi ở trạng thái **DRAFT** mới được xóa.
  - Thao tác xóa: chuyển `status` từ DRAFT → DELETED (Lịch sử), **không** dùng soft-delete (`deletedAt`).
  - Bản ghi ở trạng thái APPROVED, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, REJECTED: **không cho phép xóa** — phải từ chối duyệt trước (nếu đang duyệt) hoặc giữ nguyên.
  - Bản ghi ở trạng thái DELETED: không thể khôi phục, chỉ xem được trong lịch sử.
  - Trạng thái lưu dưới dạng số (Ordinal): DRAFT(0), PROPOSED(1), PENDING_APPROVAL(2), APPROVED_LEVEL1(3), APPROVED_LEVEL2(4), APPROVED(5), REJECTED(6), DELETED(7).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-106-01 | Chỉ cho phép xóa bản ghi ở trạng thái DRAFT | Delete |
| BR-106-02 | Xóa không phải soft-delete — chuyển status → DELETED (Lịch sử), giữ bản ghi trong DB | Delete |
| BR-106-03 | Bản ghi đã phê duyệt (APPROVED, PUBLISHED) không cho phép xóa | Delete |
| BR-106-04 | Ghi nhận audit log: action DELETE, changedBy, changedAt | Delete |
| BR-106-05 | Xác nhận xóa bằng popup xác nhận trước khi thực hiện | Delete |
| BR-106-06 | File đính kèm liên quan vẫn giữ trong bảng attachment (không xóa vật lý) | Delete |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-106-01** — Xóa bản ghi DRAFT: Khi xóa bản ghi DRAFT, hệ thống chuyển status → DELETED, bản ghi vẫn hiển thị trong danh sách với badge \"Lịch sử\".
- **AC-106-02** — Không xóa bản ghi đã duyệt: Khi bản ghi ở trạng thái APPROVED/PENDING_APPROVAL, hệ thống từ chối với thông báo tiếng Việt.
- **AC-106-03** — Popup xác nhận: Trước khi xóa, hệ thống hiển thị popup xác nhận \"Bạn có chắc chắn muốn xóa bản ghi này?\".
- **AC-106-04** — Audit log: Thao tác xóa được ghi nhận đầy đủ vào lịch sử.

### 4.3. User Stories kế thừa (nếu có)

- **US-106-01:** Là operator, tôi muốn xóa bản ghi DRAFT của đài COSPAS-SARSAT khi không còn cần thiết.
- **US-106-02:** Là operator, tôi muốn bản ghi sau khi xóa vẫn được giữ trong hệ thống ở trạng thái Lịch sử để phục vụ kiểm toán.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem danh sách | `coastalstation:cospas-sarsat:read` |
| Xóa | `coastalstation:cospas-sarsat:delete` |
| Xem chi tiết | `coastalstation:cospas-sarsat:detail` |
| Xem lịch sử | `coastalstation:cospas-sarsat:history` |

**Admin Cục:** full quyền + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 7 trạng thái: DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, APPROVED, REJECTED, DELETED |
| 2 | Có bước phê duyệt không | Có — 2 cấp (C1: Cảng vụ/Chi cục, C2: Cục Hàng hải); xóa chỉ được ở trạng thái DRAFT |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `org_unit_id` bắt buộc, filter theo subtree đơn vị cha, Cục xem full |
| 4 | Trường chỉ hiện trong điều kiện nào | Chỉ xem toàn bộ trường — không cho phép sửa/xóa trường riêng lẻ |
| 5 | Quyền riêng | `coastalstation:cospas-sarsat:delete` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không — chỉ xem file đính kèm, không thêm/xóa |
| 8 | Giao diện khác mẫu chung | Có — 5 trường GIS (loại đối tượng, biểu tượng, hệ quy chiếu, quy tắc hiển thị, tọa độ) trong khối read-only vận hành/bảo trì/sự cố |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/stations/cospas-sarsat` | Danh sách đài COSPAS-SARSAT (phân trang, lọc theo đơn vị) | `coastalstation:cospas-sarsat:read` |
| DELETE | `/api/v1/stations/cospas-sarsat/{id}` | Xóa bản ghi DRAFT → chuyển sang DELETED (Lịch sử) | `coastalstation:cospas-sarsat:delete` |
| GET | `/api/v1/stations/cospas-sarsat/{id}` | Xem chi tiết đài COSPAS-SARSAT | `coastalstation:cospas-sarsat:detail` |
| GET | `/api/v1/stations/cospas-sarsat/{id}/history` | Lịch sử thay đổi | `coastalstation:cospas-sarsat:history` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `coastal_station_cospas_sarsat` (Đài COSPAS-SARSAT):**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | UUID | Có | Primary key |
| `org_unit_id` | UUID | Có | FK → org_unit, data scope filter |
| `operating_org_unit_id` | UUID | Có | FK → org_unit, đơn vị khai thác |
| `station_code` | VARCHAR(50) | Có | Tự sinh `SARSAT-{seq}`, unique |
| `station_name` | VARCHAR(255) | Có | Tên đài |
| `location_province` | VARCHAR(255) | Có | Địa điểm tỉnh/thành |
| `location_detail` | TEXT | Không | Địa chỉ chi tiết |
| `status` | SMALLINT | Có | Enum ApprovalStatus (ordinal) — DELETED(7) |
| `coverage_area` | TEXT | Không | Vùng phủ sóng |
| `services_provided` | TEXT | Không | Dịch vụ cung cấp (JSON array) |
| `frequency` | VARCHAR(255) | Không | Tần số liên lạc |
| `notes` | TEXT | Không | Ghi chú |
| `gis_object_type` | VARCHAR(50) | Không | Điểm/Đường/Vùng |
| `gis_symbol` | VARCHAR(100) | Không | Biểu tượng bản đồ |
| `gis_crs` | VARCHAR(50) | Không | Hệ quy chiếu (default: WGS84) |
| `gis_display_rule` | TEXT | Không | Quy tắc hiển thị |
| `gis_coordinates` | JSONB | Không | Tọa độ GIS |
| `created_by` | UUID | Có | Người tạo |
| `created_at` | TIMESTAMP | Có | Thời gian tạo |
| `updated_by` | UUID | Không | Người sửa cuối |
| `updated_at` | TIMESTAMP | Không | Thời gian sửa cuối |
| `deleted_at` | TIMESTAMP | Không | Soft delete (không dùng cho CoastalStation) |

**Bảng `coastal_station_cospas_sarsat_attachment` (File đính kèm):**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | UUID | Có | Primary key |
| `station_id` | UUID | Có | FK → coastal_station_cospas_sarsat |
| `file_name` | VARCHAR(255) | Có | Tên file |
| `file_path` | VARCHAR(500) | Có | Đường dẫn lưu trữ |
| `file_size` | BIGINT | Không | Kích thước file (bytes) |
| `file_type` | VARCHAR(100) | Không | MIME type |
| `uploaded_by` | UUID | Có | Người upload |
| `uploaded_at` | TIMESTAMP | Có | Thời gian upload |
