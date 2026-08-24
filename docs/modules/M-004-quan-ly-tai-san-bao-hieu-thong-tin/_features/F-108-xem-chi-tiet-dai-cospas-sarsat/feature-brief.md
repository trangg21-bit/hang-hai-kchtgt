---
id: F-108
name: "Xem chi tiết Đài COSPAS-SARSAT"
slug: xem-chi-tiet-dai-cospas-sarsat
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:14Z"
last-updated: "2026-08-23"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Xem chi tiết Đài COSPAS-SARSAT

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-108
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

Tính năng cho phép người dùng xem toàn bộ thông tin chi tiết của một Đài COSPAS-SARSAT đã được chọn từ danh sách. Màn hình hiển thị đầy đủ thông tin hành chính (đơn vị quản lý, đơn vị khai thác, tên đài, địa điểm), thông số kỹ thuật đặc thù SARSAT (vùng phủ sóng, dịch vụ cung cấp, tần số liên lạc), vị trí GIS (5 trường), file đính kèm, trạng thái hiện tại, và lịch sử phê duyệt. Tất cả trường ở chế độ read-only. Người dùng có thể tải file đính kèm về.

## 2. Trường dữ liệu

Bảng mô tả các trường hiển thị trên màn hình chi tiết (read-only):

| # | Tên trường (theo Excel) | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|------------------------|----------|-----------------|---------|
| 1 | Đơn vị quản lý | Có | SelectOrgCode + FK `org_unit_id` UUID | Read-only, hiển thị tên đơn vị |
| 2 | Đơn vị khai thác | Có | SelectCateOther (TreeSelect) | Read-only, hiển thị tên đơn vị |
| 3 | Mã đài | Có | Input (disabled, tự sinh `SARSAT-{seq}`) | Read-only |
| 4 | Tên đài | Có | InputTextArea, max 255 ký tự | Read-only |
| 5 | Địa điểm (Tỉnh/TP) | Có | SelectCateOther (TreeSelect theo cấp hành chính) | Read-only, hiển thị tên |
| 6 | Địa điểm chi tiết | Không | InputTextArea, max 500 ký tự | Read-only |
| 7 | Tình trạng | Có | SelectAppParams (trạng thái thiết bị) | Read-only, hiển thị badge màu |
| 8 | Vùng phủ sóng | Không | InputTextArea, max 1000 ký tự | Read-only |
| 9 | Dịch vụ cung cấp | Không | SelectAppParams (multi-select) | Read-only, hiển thị tags |
| 10 | Tần số liên lạc | Không | InputTextArea, max 255 ký tự | Read-only |
| 11 | Ghi chú | Không | InputTextArea, max 1000 ký tự | Read-only |
| 12 | Loại đối tượng (GIS) | Không | Select (Điểm / Đường / Vùng) | Read-only |
| 13 | Biểu tượng (GIS) | Không | Select (chọn biểu tượng bản đồ) | Read-only, hiển thị icon |
| 14 | Hệ quy chiếu (GIS) | Không | Text, mặc định WGS84 | Read-only |
| 15 | Quy tắc hiển thị (GIS) | Không | Text | Read-only |
| 16 | Tọa độ (GIS) | Không | LongLatTable (tọa độ điểm/đường/vùng) | Read-only, hiển thị trên bản đồ |
| 17 | File đính kèm | Không | FileUpload (multiple) | Read-only, xem/tải file |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.7 (trạng thái lưu dạng số, không lưu chữ).
- Chức năng có bước phê duyệt → Quy trình 2 cấp:
  - Màn hình chi tiết hiển thị badge trạng thái màu tương ứng:
    - DRAFT: xám nhạt
    - PENDING_APPROVAL: vàng
    - APPROVED_L1: xanh dương
    - APPROVED_L2: xanh lá nhạt
    - APPROVED/PUBLISHED: xanh lá đậm
    - REJECTED: đỏ
    - DELETED: xám đậm
  - Hiển thị approvalLevel badge (C1/C2) khi đã duyệt.
  - Nếu từ chối, hiển thị lý do từ chối (rejectionReason).
  - Trạng thái lưu dưới dạng số (Ordinal): DRAFT(0), PROPOSED(1), PENDING_APPROVAL(2), APPROVED_LEVEL1(3), APPROVED_LEVEL2(4), APPROVED(5), REJECTED(6).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-108-01 | Toàn bộ trường ở chế độ read-only trên màn hình chi tiết | Detail |
| BR-108-02 | Hiển thị badge trạng thái màu tương ứng với giá trị status | Detail |
| BR-108-03 | Hiển thị approvalLevel badge (C1/C2) khi đã duyệt | Detail |
| BR-108-04 | Nếu từ chối, hiển thị lý do từ chối (rejectionReason) | Detail |
| BR-108-05 | GIS 5 trường (loại đối tượng, biểu tượng, hệ quy chiếu, quy tắc hiển thị, tọa độ) trong khối read-only vận hành/bảo trì/sự cố | Detail |
| BR-108-06 | File đính kèm: hiển thị danh sách file, cho phép tải về | Detail |
| BR-108-07 | Data scope: chỉ xem được đài trong phạm vi đơn vị của mình | Detail |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-108-01** — Hiển thị đầy đủ: Khi xem chi tiết, hệ thống hiển thị toàn bộ thông tin đài COSPAS-SARSAT ở chế độ read-only.
- **AC-108-02** — Badge trạng thái: Hệ thống hiển thị badge màu tương ứng với trạng thái hiện tại.
- **AC-108-03** — Badge duyệt: Khi đã duyệt, hệ thống hiển thị approvalLevel badge (C1/C2).
- **AC-108-04** — Lý do từ chối: Khi bản ghi bị từ chối, hệ thống hiển thị lý do từ chối.
- **AC-108-05** — Data scope: Người dùng chỉ xem được đài trong phạm vi đơn vị của mình.

### 4.3. User Stories kế thừa (nếu có)

- **US-108-01:** Là người dùng, tôi muốn xem toàn bộ thông tin chi tiết của một đài COSPAS-SARSAT từ danh sách.
- **US-108-02:** Là người dùng, tôi muốn thấy badge trạng thái và badge duyệt để biết tình trạng hồ sơ.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem chi tiết | `coastalstation:cospas-sarsat:detail` |
| Xem danh sách | `coastalstation:cospas-sarsat:read` |
| Xem lịch sử | `coastalstation:cospas-sarsat:history` |

**Admin Cục:** full quyền + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 7 trạng thái: DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, APPROVED, REJECTED, DELETED |
| 2 | Có bước phê duyệt không | Có — 2 cấp (C1: Cảng vụ/Chi cục, C2: Cục Hàng hải); hiển thị approvalLevel badge |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — chỉ xem được đài trong phạm vi đơn vị của mình |
| 4 | Trường chỉ hiện trong điều kiện nào | Toàn bộ trường read-only; badge trạng thái màu; approvalLevel badge |
| 5 | Quyền riêng | `coastalstation:cospas-sarsat:detail` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không — chỉ xem/tải file đính kèm, không thêm mới |
| 8 | Giao diện khác mẫu chung | Có — 5 trường GIS (loại đối tượng, biểu tượng, hệ quy chiếu, quy tắc hiển thị, tọa độ) trong khối read-only vận hành/bảo trì/sự cố |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/stations/cospas-sarsat/{id}` | Xem chi tiết đài COSPAS-SARSAT (read-only) | `coastalstation:cospas-sarsat:detail` |
| GET | `/api/v1/stations/cospas-sarsat` | Danh sách đài COSPAS-SARSAT (phân trang, lọc theo đơn vị) | `coastalstation:cospas-sarsat:read` |
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

**Bảng `approval_history` (Lịch sử phê duyệt):**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | UUID | Có | Primary key |
| `station_id` | UUID | Có | FK → coastal_station_cospas_sarsat |
| `action_type` | VARCHAR(50) | Có | APPROVE_L1, APPROVE_L2, REJECT |
| `approval_level` | SMALLINT | Có | Cấp duyệt (1 hoặc 2) |
| `approver_id` | UUID | Có | Người duyệt |
| `previous_status` | SMALLINT | Có | Trạng thái trước |
| `new_status` | SMALLINT | Có | Trạng thái sau |
| `rejection_reason` | TEXT | Không | Lý do từ chối |
| `created_at` | TIMESTAMP | Có | Thời gian duyệt |
