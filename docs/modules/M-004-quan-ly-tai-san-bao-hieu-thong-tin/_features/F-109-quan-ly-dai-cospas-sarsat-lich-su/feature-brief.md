---
id: F-109
name: "Quản lý Đài COSPAS-SARSAT - Lịch sử"
slug: quan-ly-dai-cospas-sarsat-lich-su
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:14Z"
last-updated: "2026-08-23"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Đài COSPAS-SARSAT - Lịch sử

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-109
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

Tính năng tra cứu lịch sử thay đổi của một Đài COSPAS-SARSAT. Ghi nhận mọi thao tác: CREATE, UPDATE, SOFT_DELETE, APPROVE_L1, APPROVE_L2, REJECT. Mỗi bản ghi lịch sử có actionType, changedField, previousValue, newValue, changedBy, changedAt. Lịch sử thay đổi giúp kiểm toán dữ liệu, đáp ứng yêu cầu quản lý nhà nước về an toàn hàng hải. Lịch sử không bị xóa theo bản ghi — ngay cả khi bản ghi đài bị xóa (chuyển DELETED), lịch sử vẫn được giữ nguyên.

## 2. Trường dữ liệu

Bảng mô tả các trường hiển thị trên màn hình lịch sử (read-only):

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
  - Lịch sử ghi nhận các action types:
    - **CREATE**: Bản ghi được tạo mới (trạng thái DRAFT)
    - **UPDATE**: Bản ghi được sửa đổi (DRAFT hoặc APPROVED)
    - **DELETE**: Bản ghi DRAFT bị xóa → chuyển DELETED (Lịch sử)
    - **APPROVE_L1**: Phê duyệt cấp 1 (PENDING_APPROVAL → APPROVED_L1)
    - **APPROVE_L2**: Phê duyệt cấp 2 (APPROVED_L1 → APPROVED/PUBLISHED)
    - **REJECT**: Từ chối ở bất kỳ cấp nào → REJECTED
  - Mỗi bản ghi lịch sử có: actionType, changedField, previousValue, newValue, changedBy, changedAt.
  - Lịch sử không bị xóa theo bản ghi — ngay cả khi bản ghi đài bị xóa (DELETED), lịch sử vẫn được giữ nguyên.
  - Trạng thái lưu dưới dạng số (Ordinal): DRAFT(0), PROPOSED(1), PENDING_APPROVAL(2), APPROVED_LEVEL1(3), APPROVED_LEVEL2(4), APPROVED(5), REJECTED(6).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-109-01 | Lịch sử ghi nhận mọi action types: CREATE, UPDATE, DELETE, APPROVE_L1, APPROVE_L2, REJECT | History |
| BR-109-02 | Lịch sử không bị xóa theo bản ghi — giữ nguyên ngay cả khi bản ghi DELETED | History |
| BR-109-03 | Mỗi bản ghi lịch sử có changedField, previousValue, newValue, changedBy, changedAt | History |
| BR-109-04 | Hiển thị dạng timeline (dòng thời gian) trên UI | History |
| BR-109-05 | Data scope: chỉ xem được lịch sử của đài trong phạm vi đơn vị của mình | History |
| BR-109-06 | GIS 5 trường (loại đối tượng, biểu tượng, hệ quy chiếu, quy tắc hiển thị, tọa độ) trong khối read-only vận hành/bảo trì/sự cố | History |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-109-01** — Tra cứu hợp lệ: Khi xem lịch sử, hệ thống trả về HTTP 200 kèm danh sách lịch sử đầy đủ.
- **AC-109-02** — Bao gồm tất cả action types: Danh sách bao gồm CREATE, UPDATE, DELETE, APPROVE_L1, APPROVE_L2, REJECT.
- **AC-109-03** — Hiển thị chính xác: changedField, previousValue, newValue, changedBy, changedAt được hiển thị chính xác.
- **AC-109-04** — Lịch sử không bị xóa: Ngay cả khi bản ghi đài bị xóa (DELETED), lịch sử vẫn được giữ nguyên.

### 4.3. User Stories kế thừa (nếu có)

- **US-109-01:** Là người dùng, tôi muốn xem lịch sử thay đổi của một đài COSPAS-SARSAT để biết ai đã thay đổi gì và khi nào.
- **US-109-02:** Là auditor, tôi muốn lịch sử không bị xóa để phục vụ kiểm toán.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem danh sách | `coastalstation:cospas-sarsat:read` |
| Xem chi tiết | `coastalstation:cospas-sarsat:detail` |
| Xem lịch sử | `coastalstation:cospas-sarsat:history` |

**Admin Cục:** full quyền + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 7 trạng thái: DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, APPROVED, REJECTED, DELETED |
| 2 | Có bước phê duyệt không | Có — 2 cấp (C1: Cảng vụ/Chi cục, C2: Cục Hàng hải); lịch sử ghi nhận APPROVE_L1/APPROVE_L2/REJECT |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — chỉ xem được lịch sử của đài trong phạm vi đơn vị của mình |
| 4 | Trường chỉ hiện trong điều kiện nào | Toàn bộ trường read-only; lịch sử không bị xóa theo bản ghi |
| 5 | Quyền riêng | `coastalstation:cospas-sarsat:history` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không — chỉ xem/tải file đính kèm, không thêm mới |
| 8 | Giao diện khác mẫu chung | Có — 5 trường GIS (loại đối tượng, biểu tượng, hệ quy chiếu, quy tắc hiển thị, tọa độ) trong khối read-only vận hành/bảo trì/sự cố |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/stations/cospas-sarsat/{id}/history` | Lịch sử thay đổi của đài COSPAS-SARSAT | `coastalstation:cospas-sarsat:history` |
| GET | `/api/v1/stations/cospas-sarsat/{id}` | Xem chi tiết đài COSPAS-SARSAT | `coastalstation:cospas-sarsat:detail` |
| GET | `/api/v1/stations/cospas-sarsat` | Danh sách đài COSPAS-SARSAT (phân trang, lọc theo đơn vị) | `coastalstation:cospas-sarsat:read` |

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

**Bảng `audit_log` (Lịch sử thay đổi):**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | UUID | Có | Primary key |
| `station_id` | UUID | Có | FK → coastal_station_cospas_sarsat |
| `action_type` | VARCHAR(50) | Có | CREATE, UPDATE, DELETE |
| `changed_field` | VARCHAR(255) | Không | Tên trường thay đổi |
| `previous_value` | TEXT | Không | Giá trị trước |
| `new_value` | TEXT | Không | Giá trị sau |
| `changed_by` | UUID | Có | Người thay đổi |
| `changed_at` | TIMESTAMP | Có | Thời gian thay đổi |
