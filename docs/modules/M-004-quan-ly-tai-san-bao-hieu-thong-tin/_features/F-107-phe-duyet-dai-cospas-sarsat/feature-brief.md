---
id: F-107
name: "Phê duyệt Đài COSPAS-SARSAT"
slug: phe-duyet-dai-cospas-sarsat
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:14Z"
last-updated: "2026-08-23"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Phê duyệt Đài COSPAS-SARSAT

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-107
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

Tính năng cho phép người phê duyệt (approver) xem xét, phê duyệt hoặc từ chối một Đài COSPAS-SARSAT đã được gửi duyệt. Quy trình phê duyệt 2 cấp: Cấp 1 (C1) — Cảng vụ / Chi cục quản lý hàng hải xem xét hồ sơ và thông số kỹ thuật; Cấp 2 (C2) — Cục Hàng hải Việt Nam phê duyệt cuối cùng. Người phê duyệt có thể duyệt (chuyển trạng thái) hoặc từ chối (ghi lý do từ chối). Mọi thao tác được ghi nhận vào audit log.

## 2. Trường dữ liệu

Bảng mô tả các trường hiển thị trên màn hình phê duyệt (read-only):

| # | Tên trường (theo Excel) | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|------------------------|----------|-----------------|---------|
| 1 | Đơn vị quản lý | Có | SelectOrgCode + FK `org_unit_id` UUID | Read-only |
| 2 | Đơn vị khai thác | Có | SelectCateOther (TreeSelect) | Read-only |
| 3 | Mã đài | Có | Input (disabled, tự sinh `SARSAT-{seq}`) | Read-only |
| 4 | Tên đài | Có | InputTextArea, max 255 ký tự | Read-only |
| 5 | Địa điểm (Tỉnh/TP) | Có | SelectCateOther (TreeSelect theo cấp hành chính) | Read-only |
| 6 | Địa điểm chi tiết | Không | InputTextArea, max 500 ký tự | Read-only |
| 7 | Tình trạng | Có | SelectAppParams (trạng thái thiết bị) | Read-only |
| 8 | Vùng phủ sóng | Không | InputTextArea, max 1000 ký tự | Read-only |
| 9 | Dịch vụ cung cấp | Không | SelectAppParams (multi-select) | Read-only |
| 10 | Tần số liên lạc | Không | InputTextArea, max 255 ký tự | Read-only |
| 11 | Ghi chú | Không | InputTextArea, max 1000 ký tự | Read-only |
| 12 | Loại đối tượng (GIS) | Không | Select (Điểm / Đường / Vùng) | Read-only |
| 13 | Biểu tượng (GIS) | Không | Select (chọn biểu tượng bản đồ) | Read-only |
| 14 | Hệ quy chiếu (GIS) | Không | Text, mặc định WGS84 | Read-only |
| 15 | Quy tắc hiển thị (GIS) | Không | Text | Read-only |
| 16 | Tọa độ (GIS) | Không | LongLatTable (tọa độ điểm/đường/vùng) | Read-only |
| 17 | File đính kèm | Không | FileUpload (multiple) | Read-only, xem/tải file |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.7 (trạng thái lưu dạng số, không lưu chữ).
- Chức năng có bước phê duyệt → Quy trình 2 cấp:
  - **Cấp 1 (C1):** Cảng vụ / Chi cục quản lý hàng hải
    - Xem toàn bộ thông tin đài COSPAS-SARSAT
    - Duyệt → chuyển từ PENDING_APPROVAL → APPROVED_L1
    - Từ chối → chuyển từ PENDING_APPROVAL → REJECTED, bắt buộc ghi lý do từ chối
  - **Cấp 2 (C2):** Cục Hàng hải Việt Nam
    - Xem toàn bộ thông tin đài COSPAS-SARSAT + kết quả duyệt C1
    - Duyệt → chuyển từ APPROVED_L1 → APPROVED (hoặc PUBLISHED)
    - Từ chối → chuyển từ APPROVED_L1 → REJECTED, bắt buộc ghi lý do từ chối
  - Trạng thái lưu dưới dạng số (Ordinal): DRAFT(0), PROPOSED(1), PENDING_APPROVAL(2), APPROVED_LEVEL1(3), APPROVED_LEVEL2(4), APPROVED(5), REJECTED(6).
  - Chỉ bản ghi ở trạng thái PENDING_APPROVAL mới cho phép C1 duyệt/từ chối.
  - Chỉ bản ghi ở trạng thái APPROVED_L1 mới cho phép C2 duyệt/từ chối.
  - Lý do từ chối: bắt buộc nhập, max 1000 ký tự, tiếng Việt.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-107-01 | Chỉ cho phép duyệt bản ghi ở trạng thái PENDING_APPROVAL (C1) hoặc APPROVED_L1 (C2) | Approve |
| BR-107-02 | Cấp C1 chỉ duyệt bản ghi PENDING_APPROVAL → APPROVED_L1 | Approve |
| BR-107-03 | Cấp C2 chỉ duyệt bản ghi APPROVED_L1 → APPROVED/PUBLISHED | Approve |
| BR-107-04 | Từ chối ở bất kỳ cấp nào → trạng thái REJECTED, bắt buộc ghi lý do từ chối | Reject |
| BR-107-05 | Lý do từ chối bắt buộc nhập, max 1000 ký tự, tiếng Việt | Reject |
| BR-107-06 | Không cho phép cùng một người duyệt ở cả 2 cấp (4-eyes principle) | Approve |
| BR-107-07 | Ghi nhận audit log: action APPROVE_L1/APPROVE_L2/REJECT, changedBy, changedAt, rejectionReason | Approve / Reject |
| BR-107-08 | Người phê duyệt chỉ xem được đài trong phạm vi đơn vị của mình (data scope) | Approve / Reject |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-107-01** — Duyệt C1: Khi approver C1 duyệt bản ghi PENDING_APPROVAL, hệ thống chuyển status → APPROVED_L1.
- **AC-107-02** — Duyệt C2: Khi approver C2 duyệt bản ghi APPROVED_L1, hệ thống chuyển status → APPROVED/PUBLISHED.
- **AC-107-03** — Từ chối: Khi approver từ chối, hệ thống chuyển status → REJECTED, bắt buộc ghi lý do từ chối.
- **AC-107-04** — Không duyệt sai cấp: Khi approver cố duyệt bản ghi không đúng cấp, hệ thống từ chối với thông báo tiếng Việt.
- **AC-107-05** — Audit log: Mọi thao tác duyệt/từ chối được ghi nhận đầy đủ vào lịch sử.

### 4.3. User Stories kế thừa (nếu có)

- **US-107-01:** Là approver C1, tôi muốn xem xét hồ sơ đài COSPAS-SARSAT và duyệt/từ chối để đưa vào quản lý.
- **US-107-02:** Là approver C2, tôi muốn xem kết quả duyệt C1 và phê duyệt cuối cùng.
- **US-107-03:** Là approver, tôi muốn ghi lý do từ chối khi từ chối đài để người tạo biết cần sửa gì.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem danh sách chờ duyệt | `coastalstation:cospas-sarsat:read` |
| Duyệt C1 | `coastalstation:cospas-sarsat:approve_l1` |
| Duyệt C2 | `coastalstation:cospas-sarsat:approve_l2` |
| Từ chối | `coastalstation:cospas-sarsat:reject` |
| Xem chi tiết | `coastalstation:cospas-sarsat:detail` |
| Xem lịch sử | `coastalstation:cospas-sarsat:history` |

**Admin Cục:** full quyền + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 7 trạng thái: DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, APPROVED, REJECTED, DELETED |
| 2 | Có bước phê duyệt không | Có — 2 cấp (C1: Cảng vụ/Chi cục, C2: Cục Hàng hải) |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — approver chỉ xem được đài trong phạm vi đơn vị của mình |
| 4 | Trường chỉ hiện trong điều kiện nào | Toàn bộ trường read-only trên màn hình phê duyệt |
| 5 | Quyền riêng | `coastalstation:cospas-sarsat:approve_l1`, `coastalstation:cospas-sarsat:approve_l2`, `coastalstation:cospas-sarsat:reject` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không — chỉ xem/tải file đính kèm, không thêm mới |
| 8 | Giao diện khác mẫu chung | Có — 5 trường GIS (loại đối tượng, biểu tượng, hệ quy chiếu, quy tắc hiển thị, tọa độ) trong khối read-only vận hành/bảo trì/sự cố |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/stations/cospas-sarsat` | Danh sách đài COSPAS-SARSAT (phân trang, lọc theo đơn vị) | `coastalstation:cospas-sarsat:read` |
| GET | `/api/v1/stations/cospas-sarsat/{id}` | Xem chi tiết đài COSPAS-SARSAT (read-only) | `coastalstation:cospas-sarsat:detail` |
| POST | `/api/v1/stations/cospas-sarsat/{id}/approve` | Duyệt (C1 hoặc C2) | `coastalstation:cospas-sarsat:approve_l1` hoặc `approve_l2` |
| POST | `/api/v1/stations/cospas-sarsat/{id}/reject` | Từ chối (ghi lý do) | `coastalstation:cospas-sarsat:reject` |
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
