---
id: F-105
name: "Quản lý Đài COSPAS-SARSAT - Cập nhật"
slug: quan-ly-dai-cospas-sarsat-cap-nhat
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:14Z"
last-updated: "2026-08-23"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Đài COSPAS-SARSAT - Cập nhật

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-105
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

Tính năng cho phép operator cập nhật thông tin của một Đài COSPAS-SARSAT đã tồn tại. Người dùng chọn đài từ danh sách → mở popup chỉnh sửa → thay đổi các trường thông tin hành chính, thông số kỹ thuật, vị trí GIS, hoặc file đính kèm. Chỉ bản ghi ở trạng thái DRAFT hoặc APPROVED mới cho phép sửa. Sau khi lưu, nếu bản ghi đã được phê duyệt, hệ thống tự động tạo lại phiên bản DRAFT để chờ phê duyệt lại.

## 2. Trường dữ liệu

Bảng mô tả các trường trên form tạo mới/chỉnh sửa:

| # | Tên trường (theo Excel) | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|------------------------|----------|-----------------|---------|
| 1 | Đơn vị quản lý | Có | SelectOrgCode + FK `org_unit_id` UUID | Không đổi đơn vị quản lý sau khi đã phê duyệt |
| 2 | Đơn vị khai thác | Có | SelectCateOther (TreeSelect) | Đơn vị vận hành thực tế |
| 3 | Mã đài | Có | Input (disabled, tự sinh `SARSAT-{seq}`) | Không cho phép sửa mã đài |
| 4 | Tên đài | Có | InputTextArea, max 255 ký tự | Không trùng trong cùng đơn vị |
| 5 | Địa điểm (Tỉnh/TP) | Có | SelectCateOther (TreeSelect theo cấp hành chính) | Tỉnh/thành phố nơi đài đặt |
| 6 | Địa điểm chi tiết | Không | InputTextArea, max 500 ký tự | Địa chỉ cụ thể, số nhà/đường |
| 7 | Tình trạng | Có | SelectAppParams (trạng thái thiết bị) | Vận hành / Ngừng hoạt động / Bảo trì / Hư hỏng |
| 8 | Vùng phủ sóng | Không | InputTextArea, max 1000 ký tự | Bán kính/phạm vi phủ sóng (km) |
| 9 | Dịch vụ cung cấp | Không | SelectAppParams (multi-select) | EPIRB, PLB, ELT, AIS-SART, v.v. |
| 10 | Tần số liên lạc | Không | InputTextArea, max 255 ký tự | Tần số hoạt động (MHz/GHz) |
| 11 | Ghi chú | Không | InputTextArea, max 1000 ký tự | Thông tin bổ sung |
| 12 | Loại đối tượng (GIS) | Không | Select (Điểm / Đường / Vùng) | Hình học GIS — read-only trong khối vận hành |
| 13 | Biểu tượng (GIS) | Không | Select (chọn biểu tượng bản đồ) | Icon hiển thị trên bản đồ |
| 14 | Hệ quy chiếu (GIS) | Không | Text, mặc định WGS84 | Hệ tọa độ |
| 15 | Quy tắc hiển thị (GIS) | Không | Text | Quy tắc style layer |
| 16 | Tọa độ (GIS) | Không | LongLatTable (tọa độ điểm/đường/vùng) | Bảng tọa độ GIS |
| 17 | File đính kèm | Không | FileUpload (multiple) | Thêm/xóa file đính kèm |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.7 (trạng thái lưu dạng số, không lưu chữ).
- Chức năng có bước phê duyệt → Quy trình 2 cấp:
  - Chỉ bản ghi ở trạng thái **DRAFT** hoặc **APPROVED** mới cho phép sửa.
  - Nếu sửa bản ghi **DRAFT**: lưu trực tiếp, không cần phê duyệt lại.
  - Nếu sửa bản ghi **APPROVED** (đã được phê duyệt): hệ thống tự động tạo lại phiên bản DRAFT → gửi duyệt lại theo quy trình 2 cấp (C1 → C2).
  - Nếu sửa bản ghi **PENDING_APPROVAL**, **APPROVED_L1**, **APPROVED_L2**: không cho phép sửa, phải từ chối bản duyệt hiện tại trước.
  - Nếu sửa bản ghi **REJECTED**: cho phép sửa, sau sửa nhấn \"Gửi duyệt\" lại từ đầu.
  - Trạng thái lưu dưới dạng số (Ordinal): DRAFT(0), PROPOSED(1), PENDING_APPROVAL(2), APPROVED_LEVEL1(3), APPROVED_LEVEL2(4), APPROVED(5), REJECTED(6).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-105-01 | Chỉ cho phép sửa bản ghi ở trạng thái DRAFT hoặc APPROVED | Update |
| BR-105-02 | Mã đài không cho phép sửa — trường disabled | Update |
| BR-105-03 | Nếu sửa bản ghi APPROVED → tự động tạo lại DRAFT, gửi duyệt lại 2 cấp | Update |
| BR-105-04 | GIS 5 trường (loại đối tượng, biểu tượng, hệ quy chiếu, quy tắc hiển thị, tọa độ) trong khối read-only vận hành/bảo trì/sự cố | Update |
| BR-105-05 | File đính kèm: thêm file mới, xóa file cũ — không sửa nội dung file đã upload | Update |
| BR-105-06 | Tên đài phải duy nhất trong cùng đơn vị quản lý (trừ chính nó) | Update |
| BR-105-07 | Ghi nhận audit log: changedField, previousValue, newValue, changedBy, changedAt | Update |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-105-01** — Sửa bản ghi DRAFT: Khi sửa bản ghi DRAFT, hệ thống lưu trực tiếp, không cần phê duyệt lại.
- **AC-105-02** — Sửa bản ghi APPROVED: Khi sửa bản ghi đã phê duyệt, hệ thống tạo lại DRAFT, gửi duyệt lại 2 cấp.
- **AC-105-03** — Không sửa bản ghi đang duyệt: Khi bản ghi ở trạng thái PENDING_APPROVAL/APPROVED_L1/APPROVED_L2, hệ thống từ chối sửa với thông báo tiếng Việt.
- **AC-105-04** — Audit log: Mọi thay đổi được ghi nhận đầy đủ vào lịch sử.

### 4.3. User Stories kế thừa (nếu có)

- **US-105-01:** Là operator, tôi muốn cập nhật thông tin đài COSPAS-SARSAT khi có thay đổi về thông số kỹ thuật hoặc tình trạng.
- **US-105-02:** Là operator, tôi muốn khi sửa bản ghi đã phê duyệt, hệ thống tự động gửi duyệt lại để đảm bảo tính hợp lệ.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem danh sách | `coastalstation:cospas-sarsat:read` |
| Sửa | `coastalstation:cospas-sarsat:update` |
| Xem chi tiết | `coastalstation:cospas-sarsat:detail` |
| Xem lịch sử | `coastalstation:cospas-sarsat:history` |

**Admin Cục:** full quyền + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 7 trạng thái: DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, APPROVED, REJECTED, DELETED |
| 2 | Có bước phê duyệt không | Có — 2 cấp (C1: Cảng vụ/Chi cục, C2: Cục Hàng hải); sửa bản ghi APPROVED → tự động gửi duyệt lại |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `org_unit_id` bắt buộc, filter theo subtree đơn vị cha, Cục xem full |
| 4 | Trường chỉ hiện trong điều kiện nào | Mã đài không cho phép sửa (disabled); chỉ sửa được khi DRAFT hoặc APPROVED |
| 5 | Quyền riêng | `coastalstation:cospas-sarsat:update` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — File đính kèm (multiple), thêm/xóa file |
| 8 | Giao diện khác mẫu chung | Có — 5 trường GIS (loại đối tượng, biểu tượng, hệ quy chiếu, quy tắc hiển thị, tọa độ) trong khối read-only vận hành/bảo trì/sự cố |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/stations/cospas-sarsat` | Danh sách đài COSPAS-SARSAT (phân trang, lọc theo đơn vị) | `coastalstation:cospas-sarsat:read` |
| PUT | `/api/v1/stations/cospas-sarsat/{id}` | Cập nhật thông tin đài COSPAS-SARSAT | `coastalstation:cospas-sarsat:update` |
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
| `station_code` | VARCHAR(50) | Có | Tự sinh `SARSAT-{seq}`, unique, không sửa |
| `station_name` | VARCHAR(255) | Có | Tên đài |
| `location_province` | VARCHAR(255) | Có | Địa điểm tỉnh/thành |
| `location_detail` | TEXT | Không | Địa chỉ chi tiết |
| `status` | SMALLINT | Có | Enum ApprovalStatus (ordinal) |
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
| `deleted_at` | TIMESTAMP | Không | Soft delete |

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
