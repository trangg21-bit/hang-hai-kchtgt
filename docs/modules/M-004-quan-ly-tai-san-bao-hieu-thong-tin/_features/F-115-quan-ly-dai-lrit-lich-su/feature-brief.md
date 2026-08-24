---
id: F-115
name: "Quản lý Đài LRIT - Lịch sử"
slug: quan-ly-dai-lrit-lich-su
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:22Z"
last-updated: "2026-08-23"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Đài LRIT - Lịch sử

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-115
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Loại:** chức năng có bước phê duyệt
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (bắt buộc đọc trước)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **\"Điểm khác biệt so với mẫu chung\"** (mục 5, dòng 3 — *\"Lọc cha-con / theo đơn vị\"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

---

## 1. Mô tả ngắn

Tính năng tra cứu lịch sử thay đổi của một Đài LRIT. Ghi nhận mọi action: CREATE, UPDATE, SOFT_DELETE, APPROVE_L1, APPROVE_L2, REJECT. Mỗi bản ghi lịch sử chứa: actionType, changedField, previousValue, newValue, changedBy, changedAt. Lịch sử không bị xóa theo bản ghi (soft-delete vẫn giữ lịch sử). Hiển thị dạng timeline trên UI, API GET `/api/v1/stations/lrit/{id}/history` trả về danh sách CoastalStationLRITHistoryResponse.

## 2. Trường dữ liệu

Bảng mô tả các trường liên quan đến lịch sử thay đổi, trích từ sheet Excel \"Đài LRIT\":

| # | Tên trường (theo Excel) | Loại điều khiển | Bắt buộc | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| **Thông tin cơ bản** | | | | | | | | | |
| 1 | Đơn vị quản lý (bắt buộc) | SelectOrgCode | Có | Có | Có | Có | Có | Có | FK → org_unit |
| 2 | Đơn vị khai thác | SelectCateOther | Có | Không | Có | Có | Có | Có | |
| 3 | Mã đài | Input (disabled, tự sinh LRIT-{seq}) | Có | Có | Có | Có | Có | Có | Tự sinh, bất biến |
| 4 | Tên đài (bắt buộc) | InputTextArea | Có | Có | Có | Có | Có | Có | |
| 5 | Địa điểm (Tỉnh/TP) (bắt buộc) | SelectCateOther | Có | Có | Có | Có | Có | Có | |
| 6 | Địa điểm chi tiết (bắt buộc) | InputTextArea | Có | Không | Có | Có | Có | Có | |
| 7 | Tình trạng (bắt buộc) | SelectAppParams | Có | Có | Có | Có | Có | Có | Enum trạng thái kỹ thuật |
| **Thông tin đặc thù LRIT** | | | | | | | | | |
| 8 | Vùng phủ sóng | InputTextArea | Không | Không | Có | Có | Có | Có | |
| 9 | Dịch vụ cung cấp | SelectAppParams (multi-select) | Không | Không | Có | Có | Có | Có | |
| 10 | Ghi chú | InputTextArea | Không | Không | Có | Có | Có | Có | |
| **Vị trí (GIS)** | | | | | | | | | |
| 11 | Loại đối tượng | Select (Điểm/Đường/Vùng) | Không | Không | Không | Có | Có | Có | GIS |
| 12 | Biểu tượng | Select | Không | Không | Không | Có | Có | Có | GIS |
| 13 | Hệ quy chiếu | Text | Không | Không | Không | Có | Có | Có | GIS (WGS84) |
| 14 | Quy tắc hiển thị | Text | Không | Không | Không | Có | Có | Có | GIS |
| 15 | Tọa độ | LongLatTable | Không | Không | Không | Có | Có | Có | GIS |
| **File đính kèm** | | | | | | | | | |
| 16 | File đính kèm | UploadFileTable | Không | Không | Có | Có | Có | Có | |
| **Trạng thái & Kiểm toán** (chỉ hiển thị, không tạo/sửa) | | | | | | | | | |
| 17 | Trạng thái | Badge (read-only) | Có | Có | Có | Có | Không | Không | 7 trạng thái |
| 18 | Ngày cập nhật | Text (read-only) | Có | Có | Có | Có | Không | Không | |
| 19 | Cán bộ cập nhật | Text (read-only) | Có | Không | Có | Có | Không | Không | |
| 20 | Ngày gửi phê duyệt | Text (read-only) | Có | Không | Có | Có | Không | Không | |
| 21 | Cán bộ gửi phê duyệt | Text (read-only) | Có | Không | Có | Có | Không | Không | |
| 22 | Ngày phê duyệt cấp Cảng vụ/Chi cục | Text (read-only) | Có | Không | Có | Có | Không | Không | Cấp L1 |
| 23 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | Text (read-only) | Có | Không | Có | Có | Không | Không | Cấp L1 |
| 24 | Nội dung phê duyệt | Text (read-only) | Không | Không | Có | Có | Không | Không | Cấp L1 |
| 25 | Ngày phê duyệt cấp Cục | Text (read-only) | Có | Không | Có | Có | Không | Không | Cấp L2 |
| 26 | Cán bộ phê duyệt cấp Cục | Text (read-only) | Có | Không | Có | Có | Không | Không | Cấp L2 |
| 27 | Nội dung phê duyệt | Text (read-only) | Không | Không | Có | Có | Không | Không | Cấp L2 |
| **Thông tin vận hành khai thác** (read-only) | | | | | | | | | |
| 28 | Mã kế hoạch | Text (read-only) | Không | Không | Có | Có | Không | Không | |
| 29 | Tên kế hoạch | Text (read-only) | Không | Không | Có | Có | Không | Không | |
| 30 | Ngày bắt đầu | Text (read-only) | Không | Không | Có | Có | Không | Không | |
| 31 | Ngày kết thúc | Text (read-only) | Không | Không | Có | Có | Không | Không | |
| **Thông tin bảo trì** (read-only) | | | | | | | | | |
| 32 | Mã kế hoạch | Text (read-only) | Không | Không | Có | Có | Không | Không | |
| 33 | Tên kế hoạch | Text (read-only) | Không | Không | Có | Có | Không | Không | |
| 34 | Thời gian bắt đầu | Text (read-only) | Không | Không | Có | Có | Không | Không | |
| 35 | Thời gian kết thúc | Text (read-only) | Không | Không | Có | Có | Không | Không | |
| **Thông tin sự cố** (read-only) | | | | | | | | | |
| 36 | Mã sự cố | Text (read-only) | Không | Không | Có | Có | Không | Không | |
| 37 | Loại sự cố | Text (read-only) | Không | Không | Có | Có | Không | Không | |
| 38 | Địa điểm | Text (read-only) | Không | Không | Có | Có | Không | Không | |
| 39 | Thời gian | Text (read-only) | Không | Không | Có | Có | Không | Không | |

## 3. Trạng thái và phê duyệt

- Lịch sử ghi nhận mọi action type:
  - **CREATE**: Khi tạo mới bản ghi (trạng thái DRAFT).
  - **UPDATE**: Khi cập nhật thông tin (trạng thái DRAFT hoặc REJECTED).
  - **SOFT_DELETE**: Khi xóa mềm bản ghi.
  - **APPROVE_L1**: Khi Approver L1 phê duyệt.
  - **APPROVE_L2**: Khi Approver L2 phê duyệt cuối.
  - **REJECT**: Khi bị từ chối ở bất kỳ cấp nào.
- Lịch sử không bị xóa theo bản ghi (soft-delete vẫn giữ lịch sử).
- Danh sách lịch sử sắp xếp theo thời gian giảm dần (mới nhất trước).
- Mỗi bản ghi lịch sử chứa: actionType, changedField, previousValue, newValue, changedBy, changedAt.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-115-01 | Lịch sử ghi nhận mọi action: CREATE, UPDATE, SOFT_DELETE, APPROVE_L1, APPROVE_L2, REJECT | History |
| BR-115-02 | Lịch sử không bị xóa theo bản ghi (soft-delete vẫn giữ) | History |
| BR-115-03 | Sắp xếp theo thời gian giảm dần (mới nhất trước) | History |
| BR-115-04 | Hiển thị dạng timeline trên UI | History |
| BR-115-05 | Filter theo `orgUnitId` — đơn vị cha xem con, Cục xem toàn bộ | History |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-115-01** — Tra cứu hợp lệ: HTTP 200, trả về danh sách lịch sử đầy đủ.
- **AC-115-02** — Danh sách bao gồm tất cả action types (CREATE, UPDATE, SOFT_DELETE, APPROVE_L1, APPROVE_L2, REJECT).
- **AC-115-03** — Hiển thị chính xác changedField, previousValue, newValue, changedBy, changedAt.
- **AC-115-04** — Soft-delete bản ghi vẫn giữ lịch sử trong danh sách.

### 4.3. User Stories kế thừa (nếu có)

- **US-115-01:** As an auditor, I want to view the full change history of an LRIT station so that I can track all modifications.
- **US-115-02:** As a manager, I want to see who changed what and when so that accountability is maintained.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem lịch sử Đài LRIT | `coastal_station_lrit:read` |

**Admin Cục:** Full quyền + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật/người duyệt/thời gian duyệt/người xóa/thời gian xóa (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 7 trạng thái; lịch sử ghi nhận mọi trạng thái chuyển đổi |
| 2 | Có bước phê duyệt không | Có — 2 cấp; lịch sử ghi APPROVE_L1/APPROVE_L2/REJECT |
| 3 | Lọc cha-con / theo đơn vị | Có — theo `orgUnitId`; đơn vị cha xem con, Cục xem toàn bộ |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `coastal_station_lrit:read` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — File đính kèm (UploadFileTable) |
| 8 | Giao diện khác mẫu chung | Có — Timeline UI + 3 khối read-only (vận hành, bảo trì, sự cố) + 5 trường GIS |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/stations/lrit/{id}/history` | Lịch sử thay đổi (timeline, sắp xếp giảm dần) | `coastal_station_lrit:read` |
| GET | `/api/v1/stations/lrit/{id}` | Xem chi tiết (tham chiếu) | `coastal_station_lrit:read` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `coastal_station_lrit` (Đài LRIT):**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | UUID | Có | Primary key |
| `org_unit_id` | UUID | Có | FK → org_unit, DataScopeAspect |
| `operating_org_id` | UUID | Có | FK → org_unit (đơn vị khai thác) |
| `code` | VARCHAR(50) | Có | Tự sinh `LRIT-{seq}`, unique, bất biến |
| `name` | TEXT | Có | Tên đài |
| `location_province` | VARCHAR(200) | Có | Địa điểm Tỉnh/TP |
| `location_detail` | TEXT | Không | Địa điểm chi tiết |
| `status` | SMALLINT | Có | ApprovalStatus enum (0-6) |
| `operational_status` | SMALLINT | Có | Tình trạng kỹ thuật |
| `coverage_area` | TEXT | Không | Vùng phủ sóng |
| `services_provided` | JSON/TEXT | Không | Multi-select dịch vụ |
| `notes` | TEXT | Không | Ghi chú |
| `object_type` | VARCHAR(20) | Không | GIS: Điểm/Đường/Vùng |
| `symbol` | VARCHAR(100) | Không | GIS: Biểu tượng |
| `coordinate_system` | VARCHAR(50) | Không | GIS: Hệ quy chiếu |
| `display_rule` | TEXT | Không | GIS: Quy tắc hiển thị |
| `coordinates` | JSON/TEXT | Không | GIS: Tọa độ LongLatTable |
| `approval_level1_date` | TIMESTAMP | Không | Ngày duyệt cấp L1 |
| `approval_level1_by` | UUID | Không | Người duyệt L1 |
| `approval_level1_content` | TEXT | Không | Nội dung duyệt L1 |
| `approval_level2_date` | TIMESTAMP | Không | Ngày duyệt cấp L2 |
| `approval_level2_by` | UUID | Không | Người duyệt L2 |
| `approval_level2_content` | TEXT | Không | Nội dung duyệt L2 |
| `submitted_at` | TIMESTAMP | Không | Ngày gửi phê duyệt |
| `submitted_by` | UUID | Không | Người gửi phê duyệt |
| `created_by` | UUID | Có | Người tạo |
| `created_at` | TIMESTAMP | Có | Thời gian tạo |
| `updated_by` | UUID | Không | Người sửa cuối |
| `updated_at` | TIMESTAMP | Không | Thời gian sửa cuối |
| `deleted_at` | TIMESTAMP | Không | Soft-delete |
| `deleted_by` | UUID | Không | Người xóa |
| ~~terminalId~~ | ~~VARCHAR~~ | ~~~~ | ~~Không còn theo Excel — thay bằng code~~ |
| ~~imoNumber~~ | ~~VARCHAR~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~reportingInterval~~ | ~~INT~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~antennaHeight~~ | ~~DECIMAL~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~powerOutput~~ | ~~DECIMAL~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~antennaType~~ | ~~VARCHAR~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~dataFormat~~ | ~~VARCHAR~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~communicationChannel~~ | ~~VARCHAR~~ | ~~~~ | ~~Không còn theo Excel~~ |

**Bảng `coastal_station_lrit_history` (Lịch sử thay đổi — 🔴 mới):**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | UUID | Có | Primary key |
| `station_id` | UUID | Có | FK → coastal_station_lrit.id |
| `action_type` | VARCHAR(30) | Có | CREATE, UPDATE, SOFT_DELETE, APPROVE_L1, APPROVE_L2, REJECT |
| `changed_field` | VARCHAR(100) | Không | Tên trường bị thay đổi |
| `previous_value` | TEXT | Không | Giá trị trước |
| `new_value` | TEXT | Không | Giá trị sau |
| `changed_by` | UUID | Có | Người thực hiện |
| `changed_at` | TIMESTAMP | Có | Thời gian thay đổi |
