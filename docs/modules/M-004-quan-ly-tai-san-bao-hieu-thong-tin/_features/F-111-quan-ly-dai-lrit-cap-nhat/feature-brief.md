---
id: F-111
name: "Quản lý Đài LRIT - Cập nhật"
slug: quan-ly-dai-lrit-cap-nhat
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:22Z"
last-updated: "2026-08-23"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Đài LRIT - Cập nhật

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-111
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

Tính năng cho phép operator cập nhật thông tin Đài LRIT đã tồn tại. Chỉ được sửa khi bản ghi ở trạng thái DRAFT hoặc REJECTED. Các trường có thể chỉnh sửa: tên đài, địa điểm, tình trạng, vùng phủ sóng, dịch vụ cung cấp, ghi chú, file đính kèm, GIS 5 trường. Mã đài (`code`) và `terminalId` là bất biến — không cho sửa. Khi bản ghi đang ở trạng thái PROPOSED/PENDING_APPROVAL/APPROVED_LEVEL1/APPROVED_LEVEL2/APPROVED, không cho phép cập nhật (chỉ xem chi tiết). Sau khi sửa, hệ thống ghi lịch sử thay đổi (audit log).

## 2. Trường dữ liệu

Bảng mô tả các trường có thể cập nhật trên form sửa, trích từ sheet Excel \"Đài LRIT\":

| # | Tên trường (theo Excel) | Loại điều khiển | Bắt buộc | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| **Thông tin cơ bản** | | | | | | | | | |
| 1 | Đơn vị quản lý (bắt buộc) | SelectOrgCode | Có | Có | Có | Có | Có | Có | Không đổi nếu đã duyệt |
| 2 | Đơn vị khai thác | SelectCateOther | Có | Không | Có | Có | Có | Có | |
| 3 | Mã đài | Input (disabled, tự sinh LRIT-{seq}) | Có | Có | Có | Có | Có | Không | Bất biến |
| 4 | Tên đài (bắt buộc) | InputTextArea | Có | Có | Có | Có | Có | Có | |
| 5 | Địa điểm (Tỉnh/TP) (bắt buộc) | SelectCateOther | Có | Có | Có | Có | Có | Có | |
| 6 | Địa điểm chi tiết (bắt buộc) | InputTextArea | Có | Không | Có | Có | Có | Có | |
| 7 | Tình trạng (bắt buộc) | SelectAppParams | Có | Có | Có | Có | Có | Có | |
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
| 17 | Trạng thái | Badge (read-only) | Có | Có | Có | Có | Không | Không | |
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

- Chỉ được cập nhật khi bản ghi ở trạng thái **DRAFT (0)** hoặc **REJECTED (6)**.
- Khi bản ghi ở trạng thái PROPOSED (1), PENDING_APPROVAL (2), APPROVED_LEVEL1 (3), APPROVED_LEVEL2 (4), hoặc APPROVED (5) — không cho phép cập nhật, chỉ xem chi tiết.
- Sau khi sửa, bản ghi vẫn giữ nguyên trạng thái (DRAFT hoặc REJECTED).
- Nếu bản ghi REJECTED, operator sửa xong có thể gửi lại phê duyệt (chuyển sang PROPOSED).
- Ghi lịch sử thay đổi (audit log) với actionType = UPDATE cho mọi trường bị thay đổi.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-111-01 | Chỉ sửa được khi trạng thái = DRAFT hoặc REJECTED | Update |
| BR-111-02 | Mã đài (`code`) bất biến — không cho sửa | Update |
| BR-111-03 | `orgUnitId` không đổi nếu bản ghi đã ở trạng thái đã duyệt | Update |
| BR-111-04 | Validate `orgUnitId` trong phạm vi user (OrgUnitScopeService) trước khi ghi | Update |
| BR-111-05 | GIS 5 trường đồng bộ: nếu sửa 1 trong 5 thì phải đủ cả 5 | Update |
| BR-111-06 | Ghi audit log: changedField, previousValue, newValue, updatedBy, updatedAt | Update |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-111-01** — Cập nhật thành công: Trạng thái DRAFT/REJECTED, sửa trường hợp lệ, HTTP 200.
- **AC-111-02** — Sửa bản ghi đang chờ duyệt: Hệ thống từ chối, HTTP 403, thông báo \"Chỉ sửa được khi trạng thái Lưu tạm hoặc Từ chối\".
- **AC-111-03** — Sửa trường bất biến (code): Hệ thống từ chối, HTTP 400.
- **AC-111-04** — Thiếu trường bắt buộc sau sửa: Hiển thị lỗi validation, HTTP 400.

### 4.3. User Stories kế thừa (nếu có)

- **US-111-01:** As an operator, I want to update an LRIT station's information when it's in DRAFT or REJECTED state so that data stays accurate.
- **US-111-02:** As an operator, I want the system to log all changes so that audit trail is maintained.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Cập nhật Đài LRIT | `coastal_station_lrit:update` |
| Xem danh sách | `coastal_station_lrit:read` |
| Xem chi tiết | `coastal_station_lrit:read` |

**Admin Cục:** Full quyền + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 7 trạng thái; chỉ sửa được khi DRAFT hoặc REJECTED |
| 2 | Có bước phê duyệt không | Có — 2 cấp; không sửa được khi đang chờ duyệt |
| 3 | Lọc cha-con / theo đơn vị | Có — theo `orgUnitId`; đơn vị cha xem con, Cục xem toàn bộ |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `coastal_station_lrit:update`, `coastal_station_lrit:read` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — File đính kèm (UploadFileTable) |
| 8 | Giao diện khác mẫu chung | Có — 3 khối read-only (vận hành, bảo trì, sự cố) + 5 trường GIS |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/stations/lrit/{id}` | Xem chi tiết Đài LRIT (dữ liệu hiện tại) | `coastal_station_lrit:read` |
| PUT | `/api/v1/stations/lrit/{id}` | Cập nhật thông tin Đài LRIT | `coastal_station_lrit:update` |
| GET | `/api/v1/stations/lrit/{id}/history` | Lịch sử thay đổi | `coastal_station_lrit:read` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `coastal_station_lrit` (Đài LRIT):**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | UUID | Có | Primary key |
| `org_unit_id` | UUID | Có | FK → org_unit, DataScopeAspect |
| `operating_org_id` | UUID | Có | FK → org_unit (đơn vị khai thác) |
| `code` | VARCHAR(50) | Có | Tự sinh `LRIT-{seq}`, unique, **bất biến** |
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
| ~~terminalId~~ | ~~VARCHAR~~ | ~~~~ | ~~Không còn theo Excel — thay bằng code~~ |
| ~~imoNumber~~ | ~~VARCHAR~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~reportingInterval~~ | ~~INT~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~antennaHeight~~ | ~~DECIMAL~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~powerOutput~~ | ~~DECIMAL~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~antennaType~~ | ~~VARCHAR~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~dataFormat~~ | ~~VARCHAR~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~communicationChannel~~ | ~~VARCHAR~~ | ~~~~ | ~~Không còn theo Excel~~ |
