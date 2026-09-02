---
id: F-116
name: "Quản lý Đài TT Hàng hải HN - Tạo mới"
slug: quan-ly-dai-tt-hang-hai-hn-tao-moi
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:30Z"
last-updated: 2026-08-24
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Đài TT Hàng hải HN - Tạo mới

**Tài liệu:** BA Feature Brief
**Feature:** F-116
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Loại:** chức năng có bước phê duyệt

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **\"Điểm khác biệt so với mẫu chung\"** (mục 5, dòng 3 — *\"Lọc cha-con / theo đơn vị\"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

---

## 1. Mô tả ngắn

Tính năng cho phép cán bộ nghiệp vụ (operator) tạo mới một Đài Thông tin Hàng hải Hà Nội (CoastalStationHaiphong) trong hệ thống quản lý tài sản báo hiệu và thông tin hàng hải. Người dùng nhập thông tin cơ bản (đơn vị quản lý, đơn vị khai thác, mã đài tự sinh, tên đài, địa điểm, tình trạng), thông tin đặc thù TTXLTT (dịch vụ cung cấp, ghi chú), vị trí GIS (loại đối tượng, biểu tượng, hệ quy chiếu, quy tắc hiển thị, tọa độ) và file đính kèm. Bản ghi mới khởi tạo ở trạng thái DRAFT → gửi duyệt → 2 cấp phê duyệt (Cảng vụ/Chi cục → Cục) → 7 trạng thái.

## 2. Trường dữ liệu & Ma trận CRUD 5 Tab

Bảng mô tả các trường theo chuẩn 5 Tab của Đài TTXLTT Hàng hải:

| STT | Tên trường | Loại điều khiển | Bắt buộc | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| **TAB 1** | **Thông tin chung** | | | | | | | | |
| 1 | Mã đài | Input (disabled, tự sinh `TTXLTT-{seq}`) | Có | Có | Có | Có | Có (Disabled) | Có (Disabled) | Tự sinh từ API `/generate-code` |
| 2 | Tên đài | InputTextArea | Có | Có | Có | Có | Có | Có | Bắt buộc |
| 3 | Đơn vị quản lý | SelectOrgCode (TreeSelect) | Có | Có | Có | Có | Có | Có | Phân cấp theo DataScope |
| 4 | Đơn vị khai thác | SelectCateOther | Không | Có | Không | Có | Có | Có | Danh mục đơn vị khai thác |
| 5 | Địa điểm (Tỉnh/TP) | SelectCateOther | Có | Có | Có | Có | Có | Có | Danh mục 63 Tỉnh/TP |
| 6 | Địa điểm chi tiết | InputTextArea | Có | Không | Có | Có | Có | Có | Bắt buộc (có lọc trên sidebar) |
| 7 | Tình trạng | SelectAppParams | Có | Có | Có | Có | Có | Có | `ConditionStatus` |
| 8 | Dịch vụ cung cấp | Select multi-select trong khung bo tròn, mỗi dịch vụ một dòng và tên dài ellipsis | Không | Không | Không | Có | Có | Có | `INMARSAT`, `COSPAS-SARSAT`, `DSC`, `RTP`,... |
| 9 | Ghi chú | InputTextArea | Không | Không | Không | Có | Có | Có | |
| **TAB 2** | **Vị trí (GIS)** | | | | | | | | |
| 10 | Loại đối tượng | Select (Điểm/Đường/Vùng) | Không | Không | Không | Có | Có | Có | `geometryType` |
| 11 | Biểu tượng | Select (kèm icon bản đồ) | Không | Không | Không | Có | Có | Có | `symbol` |
| 12 | Hệ quy chiếu | Text (WGS 84 / VN-2000) | Không | Không | Không | Có | Có | Có | GIS |
| 13 | Quy tắc hiển thị | Text (Độ, phút, giây (DMS)) | Không | Không | Không | Có | Có | Có | GIS |
| 14 | Tọa độ | LongLatTable + Modal Bản đồ | Không | Không | Không | Có | Có | Có | Bảng tọa độ DMS |
| **TAB 3** | **File đính kèm** | | | | | | | | |
| 15 | File đính kèm | UploadFileTable | Không | Không | Không | Có | Có | Có | $\le 20\text{MB}$, tối đa 10 tệp |
| **TAB 4** | **Vận hành & bảo trì** (Chỉ hiển thị trang Xem chi tiết) | | | | | | | | |
| 16 | Kế hoạch vận hành khai thác | DetailTable (read-only) | Không | Không | Không | Có | Không | Không | Mã KH, Tên KH, Ngày BĐ, Ngày KT |
| 17 | Kế hoạch bảo trì | DetailTable (read-only) | Không | Không | Không | Có | Không | Không | Mã KH, Tên KH, Thời gian BĐ, Thời gian KT |
| 18 | Thông tin sự cố | DetailTable (read-only) | Không | Không | Không | Có | Không | Không | Mã sự cố, Loại sự cố, Địa điểm, Thời gian |
| **TAB 5** | **Xử lý & theo dõi** (Chỉ hiển thị trang Xem chi tiết & Danh sách) | | | | | | | | |
| 19 | Trạng thái | Badge (read-only) | Có | Có | Có | Có | Không | Không | 6 tab trạng thái |
| 20 | Ngày cập nhật & Cán bộ cập nhật | Text (read-only) | Có | Có | Có | Có | Không | Không | |
| 21 | Ngày gửi phê duyệt & Cán bộ gửi phê duyệt | Text (read-only) | Có | Có | Không | Có | Không | Không | |
| 22 | Ngày phê duyệt & Cán bộ duyệt cấp Cảng vụ | Text (read-only) | Có | Có | Không | Có | Không | Không | Cấp L1 |
| 23 | Nội dung phê duyệt cấp 1 | Text (read-only) | Không | Không | Không | Có | Không | Không | Cấp L1 |
| 24 | Ngày phê duyệt & Cán bộ duyệt cấp Cục | Text (read-only) | Có | Có | Không | Có | Không | Không | Cấp L2 |
| 25 | Nội dung phê duyệt cấp 2 | Text (read-only) | Không | Không | Không | Có | Không | Không | Cấp L2 |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.7 (trạng thái lưu dạng số, không lưu chữ).
- Chức năng có bước phê duyệt 2 cấp:
  - **Cấp 1 (Cảng vụ/Chi cục):** DRAFT → Chờ duyệt cấp Cảng vụ/Chi cục → Duyệt → Chờ duyệt cấp Cục / Từ chối.
  - **Cấp 2 (Cục):** Chờ duyệt cấp Cục → Duyệt → Đã phê duyệt / Từ chối.
  - **7 trạng thái:** Lưu tạm, Chờ duyệt cấp Cảng vụ/Chi cục, Từ chối cấp Cảng vụ/Chi cục, Chờ duyệt cấp Cục, Từ chối cấp Cục, Đã phê duyệt, Lịch sử.
  - Từ chối ở cấp nào → sửa + gửi lại → về Chờ duyệt cấp đó.
  - Self-approval prevention: người gửi không thể duyệt chính bản ghi mình gửi.
  - Bản ghi trạng thái Lịch sử → không thể duyệt/từ chối.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/01-base-pattern.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-116-01 | Mã đài tự sinh format `TTXLTT-{seq}`, hệ thống sinh, không cho người dùng nhập | Create |
| BR-116-02 | Đơn vị quản lý mặc định theo đơn vị user đăng nhập; Admin Cục được chọn đơn vị khác | Create |
| BR-116-03 | Tên đài bắt buộc, tối đa 255 ký tự | Create, Update |
| BR-116-04 | Địa điểm chi tiết tối đa 500 ký tự | Create, Update |
| BR-116-05 | Tình trạng mặc định: Chưa khai thác/vận hành | Create |
| BR-116-06 | Tọa độ WGS84, bảng động thêm/xóa dòng, mỗi dòng Vĩ độ N* + Kinh độ E* | Create, Update |
| BR-116-07 | File đính kèm: upload nhiều file (quyết định thành lập, hồ sơ kỹ thuật, ảnh hiện trạng) | Create, Update |
| BR-116-08 | Dịch vụ cung cấp: multi-select từ 9 dịch vụ cố định | Create, Update |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-116-01** — Tạo mới thành công: Nhập đầy đủ thông tin hợp lệ, tạo thành công Đài TT Hàng hải HN (DRAFT), HTTP 200.
- **AC-116-02** — Validation bắt buộc: Bỏ trống trường bắt buộc (đơn vị quản lý, tên đài, địa điểm tỉnh/tp, địa điểm chi tiết, tình trạng) → hiển thị lỗi validation.
- **AC-116-03** — Mã đài tự sinh: Hệ thống tự sinh mã đài, không cho người dùng nhập thủ công.
- **AC-116-04** — Tọa độ hợp lệ: Nhập tọa độ ngoài phạm vi WGS84 → trả về lỗi.

### 4.3. User Stories kế thừa (nếu có)

- **US-116-01:** Là cán bộ nghiệp vụ, tôi muốn tạo mới một Đài TT Hàng hải HN với đầy đủ thông tin cơ bản, đặc thù TTXLTT, GIS và file đính kèm để đưa vào hệ thống quản lý.
- **US-116-02:** Là Admin Cục, tôi muốn chọn đơn vị quản lý khác đơn vị mặc định khi tạo mới đài.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Tạo mới đài | `coastalstationhaiphong:create` |
| Xem danh sách | `coastalstationhaiphong:read` |
| Xem chi tiết | `coastalstationhaiphong:read` |
| Gửi duyệt | `coastalstationhaiphong:submit` |

**Admin Cục:** full quyền + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 7 trạng thái (Lưu tạm, Chờ duyệt CC, Từ chối CC, Chờ duyệt Cục, Từ chối Cục, Đã phê duyệt, Lịch sử) |
| 2 | Có bước phê duyệt không | Có — 2 cấp (Cảng vụ/Chi cục → Cục) |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` (đơn vị quản lý), filter theo subtree đơn vị cha, Cục xem full |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `coastalstationhaiphong:create`, `coastalstationhaiphong:read`, `coastalstationhaiphong:submit` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — File đính kèm (UploadFileTable): quyết định thành lập, hồ sơ kỹ thuật, ảnh hiện trạng |
| 8 | Giao diện khác mẫu chung | Có — 5 nhóm thông tin: cơ bản, đặc thù TTXLTT, GIS, file đính kèm, vận hành/bảo trì/sự cố (read-only) |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/stations/coastal-haiphong` | Danh sách đài TT Hàng hải HN (phân trang, lọc theo đơn vị) | `coastalstationhaiphong:read` |
| POST | `/api/v1/stations/coastal-haiphong` | Tạo mới đài TT Hàng hải HN | `coastalstationhaiphong:create` |
| PUT | `/api/v1/stations/coastal-haiphong/{id}` | Cập nhật đài TT Hàng hải HN | `coastalstationhaiphong:update` |
| DELETE | `/api/v1/stations/coastal-haiphong/{id}` | Xóa mềm đài TT Hàng hải HN | `coastalstationhaiphong:delete` |
| POST | `/api/v1/stations/coastal-haiphong/{id}/submit` | Gửi duyệt | `coastalstationhaiphong:submit` |
| GET | `/api/v1/stations/coastal-haiphong/{id}` | Xem chi tiết đài TT Hàng hải HN | `coastalstationhaiphong:read` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `coastal_station_haiphong` (Đài Thông tin Hàng hải Hà Nội):**

- 🔴 `id` UUID PK
- 🔴 `code` VARCHAR(50) UNIQUE — tự sinh `TTXLTT-{seq}`
- 🔴 `name` VARCHAR(255) NOT NULL — tên đài
- 🔴 `org_unit_id` UUID NOT NULL — đơn vị quản lý (FK → org_unit)
- 🔴 `operating_unit_id` UUID — đơn vị khai thác (FK → org_unit)
- 🔴 `province_id` UUID NOT NULL — địa điểm tỉnh/tp
- 🔴 `detailed_location` VARCHAR(500) NOT NULL — địa điểm chi tiết
- 🔴 `usage_status` SMALLINT NOT NULL — tình trạng (0=Chưa khai thác, 1=Đang khai thác, 2=Dừng khai thác)
- 🔴 `services_provided` TEXT — dịch vụ cung cấp (JSON array)
- 🔴 `remarks` VARCHAR(2000) — ghi chú
- 🔴 `geometry_type` VARCHAR(20) — loại đối tượng GIS (Điểm/Đường/Vùng)
- 🔴 `map_symbol_id` UUID — biểu tượng bản đồ
- 🔴 `coordinate_system` VARCHAR(100) — hệ quy chiếu
- 🔴 `display_rule` TEXT — quy tắc hiển thị
- 🔴 `coordinates` TEXT — tọa độ WGS84 (JSON array)
- 🔴 `status` SMALLINT NOT NULL DEFAULT 0 — trạng thái (0=Lưu tạm, 1=Chờ duyệt CC, 2=Từ chối CC, 3=Chờ duyệt Cục, 4=Từ chối Cục, 5=Đã phê duyệt, 6=Lịch sử)
- 🔴 `approval_level` SMALLINT DEFAULT 0 — cấp phê duyệt hiện tại
- 🔴 `approved_by` UUID — người phê duyệt
- 🔴 `approved_date` TIMESTAMP — ngày phê duyệt
- 🔴 `rejection_reason` VARCHAR(500) — lý do từ chối
- 🔴 `approval_content` TEXT — nội dung phê duyệt
- 🔴 `submitted_by` UUID — người gửi duyệt
- 🔴 `submitted_date` TIMESTAMP — ngày gửi duyệt
- 🔴 `created_by` UUID NOT NULL — người tạo
- 🔴 `created_at` TIMESTAMP NOT NULL — thời gian tạo
- 🔴 `updated_by` UUID — người cập nhật
- 🔴 `updated_at` TIMESTAMP — thời gian cập nhật
- 🔴 `deleted_at` TIMESTAMP — xóa mềm
- ~~deletedAt~~ — CoastalStationVTS dùng status "Lịch sử" thay vì soft-delete

**Bảng `coastal_station_haiphong_attachment` (File đính kèm):**
- 🔴 `id` UUID PK
- 🔴 `station_id` UUID NOT NULL (FK → coastal_station_haiphong)
- 🔴 `file_name` VARCHAR(255) NOT NULL
- 🔴 `file_url` VARCHAR(500) NOT NULL
- 🔴 `file_type` VARCHAR(50) — loại file
- 🔴 `uploaded_by` UUID NOT NULL
- 🔴 `uploaded_at` TIMESTAMP NOT NULL

**Bảng `coastal_station_haiphong_operational_plan` (Vận hành khai thác - read-only):**
- 🔴 `id` UUID PK
- 🔴 `station_id` UUID NOT NULL (FK → coastal_station_haiphong)
- 🔴 `plan_code` VARCHAR(100) — mã kế hoạch
- 🔴 `plan_name` VARCHAR(255) — tên kế hoạch
- 🔴 `start_date` DATE — ngày bắt đầu
- 🔴 `end_date` DATE — ngày kết thúc

**Bảng `coastal_station_haiphong_maintenance` (Bảo trì - read-only):**
- 🔴 `id` UUID PK
- 🔴 `station_id` UUID NOT NULL (FK → coastal_station_haiphong)
- 🔴 `plan_code` VARCHAR(100) — mã kế hoạch
- 🔴 `plan_name` VARCHAR(255) — tên kế hoạch
- 🔴 `start_time` TIMESTAMP — thời gian bắt đầu
- 🔴 `end_time` TIMESTAMP — thời gian kết thúc

**Bảng `coastal_station_haiphong_incident` (Sự cố - read-only):**
- 🔴 `id` UUID PK
- 🔴 `station_id` UUID NOT NULL (FK → coastal_station_haiphong)
- 🔴 `incident_code` VARCHAR(100) — mã sự cố
- 🔴 `incident_type` VARCHAR(100) — loại sự cố
- 🔴 `location` VARCHAR(500) — địa điểm
- 🔴 `incident_time` TIMESTAMP — thời gian
