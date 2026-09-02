---
id: F-117
name: "Quản lý Đài TT Hàng hải HN - Cập nhật"
slug: quan-ly-dai-tt-hang-hai-hn-cap-nhat
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:30Z"
last-updated: 2026-08-24
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Đài TT Hàng hải HN - Cập nhật

**Tài liệu:** BA Feature Brief
**Feature:** F-117
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Loại:** chức năng có bước phê duyệt

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **\"Điểm khác biệt so với mẫu chung\"** (mục 5, dòng 3 — *\"Lọc cha-con / theo đơn vị\"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

---

## 1. Mô tả ngắn

Tính năng cho phép cán bộ nghiệp vụ cập nhật thông tin một Đài Thông tin Hàng hải Hà Nội đã tồn tại. Form cập nhật bao gồm các nhóm thông tin: cơ bản (đơn vị quản lý, đơn vị khai thác, tên đài, địa điểm, tình trạng), đặc thù TTXLTT (dịch vụ cung cấp, ghi chú), GIS (loại đối tượng, biểu tượng, hệ quy chiếu, quy tắc hiển thị, tọa độ) và file đính kèm. Mã đài không được chỉnh sửa (immutable). Bản ghi cập nhật giữ nguyên trạng thái hiện tại (không tự động gửi duyệt lại).

## 2. Trường dữ liệu & Ma trận CRUD 5 Tab

Bảng mô tả các trường theo chuẩn 5 Tab của Đài TTXLTT Hàng hải:

| STT | Tên trường | Loại điều khiển | Bắt buộc | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| **TAB 1** | **Thông tin chung** | | | | | | | | |
| 1 | Mã đài | Input (disabled, tự sinh `TTXLTT-{seq}`) | Có | Có | Có | Có | Có (Disabled) | Có (Disabled) | Tự sinh, bất biến |
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
- Chức năng có bước phê duyệt 2 cấp (xem F-116).
- Cập nhật **không tự động gửi duyệt lại** — bản ghi giữ nguyên trạng thái hiện tại.
- Nếu cần phê duyệt lại sau cập nhật, operator phải chủ động nhấn nút "Gửi duyệt" (F-119).
- Bản ghi trạng thái Lịch sử → không thể cập nhật.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/01-base-pattern.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-117-01 | Mã đài immutable — không cho chỉnh sửa khi cập nhật | Update |
| BR-117-02 | Đơn vị quản lý mặc định theo đơn vị user; Admin Cục chọn được | Update |
| BR-117-03 | Tên đài bắt buộc, tối đa 255 ký tự | Update |
| BR-117-04 | Địa điểm chi tiết tối đa 500 ký tự | Update |
| BR-117-05 | Tọa độ WGS84, bảng động thêm/xóa dòng, mỗi dòng Vĩ độ N* + Kinh độ E* | Update |
| BR-117-06 | File đính kèm: upload nhiều file, có thể thêm/xóa file cũ | Update |
| BR-117-07 | Không cập nhật bản ghi trạng thái Lịch sử | Update |
| BR-117-08 | Cập nhật không tự động gửi duyệt lại — giữ nguyên trạng thái hiện tại | Update |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-117-01** — Cập nhật thành công: Sửa thông tin hợp lệ, lưu thành công, HTTP 200.
- **AC-117-02** — Validation bắt buộc: Bỏ trống trường bắt buộc (tên đài, địa điểm tỉnh/tp, địa điểm chi tiết, tình trạng) → hiển thị lỗi validation.
- **AC-117-03** — Mã đài không chỉnh sửa: Trường mã đài hiển thị read-only, không cho sửa.
- **AC-117-04** — Không cập nhật Lịch sử: Bản ghi trạng thái Lịch sử → HTTP 400 "Đài TTDH ở trạng thái Lịch sử không thể cập nhật".

### 4.3. User Stories kế thừa (nếu có)

- **US-117-01:** Là cán bộ nghiệp vụ, tôi muốn cập nhật thông tin Đài TT Hàng hải HN (tên, địa điểm, tình trạng, dịch vụ, GIS, file đính kèm) để duy trì dữ liệu luôn chính xác.
- **US-117-02:** Là Admin Cục, tôi muốn chọn đơn vị quản lý khác khi cập nhật đài.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Cập nhật đài | `coastalstationhaiphong:update` |
| Xem danh sách | `coastalstationhaiphong:read` |
| Xem chi tiết | `coastalstationhaiphong:read` |

**Admin Cục:** full quyền + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 7 trạng thái (giữ nguyên trạng thái hiện tại sau cập nhật) |
| 2 | Có bước phê duyệt không | Có — 2 cấp (nhưng cập nhật không tự động gửi duyệt lại) |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` (đơn vị quản lý), filter theo subtree đơn vị cha, Cục xem full |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `coastalstationhaiphong:update`, `coastalstationhaiphong:read` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — File đính kèm (UploadFileTable): có thể thêm/xóa file |
| 8 | Giao diện khác mẫu chung | Có — 5 nhóm thông tin: cơ bản, đặc thù TTXLTT, GIS, file đính kèm, vận hành/bảo trì/sự cố (read-only) |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/stations/coastal-haiphong/{id}` | Xem chi tiết đài TT Hàng hải HN (dữ liệu hiện tại) | `coastalstationhaiphong:read` |
| PUT | `/api/v1/stations/coastal-haiphong/{id}` | Cập nhật đài TT Hàng hải HN | `coastalstationhaiphong:update` |
| GET | `/api/v1/stations/coastal-haiphong` | Danh sách đài TT Hàng hải HN (phân trang, lọc) | `coastalstationhaiphong:read` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `coastal_station_haiphong` (Đài Thông tin Hàng hải Hà Nội):**

- `id` UUID PK — không thay đổi
- `code` VARCHAR(50) UNIQUE — immutable, không cập nhật
- `name` VARCHAR(255) NOT NULL — tên đài (có thể cập nhật)
- `org_unit_id` UUID NOT NULL — đơn vị quản lý (có thể cập nhật)
- `operating_unit_id` UUID — đơn vị khai thác (có thể cập nhật)
- `province_id` UUID NOT NULL — địa điểm tỉnh/tp (có thể cập nhật)
- `detailed_location` VARCHAR(500) NOT NULL — địa điểm chi tiết (có thể cập nhật)
- `usage_status` SMALLINT NOT NULL — tình trạng (có thể cập nhật)
- `services_provided` TEXT — dịch vụ cung cấp (có thể cập nhật)
- `remarks` VARCHAR(2000) — ghi chú (có thể cập nhật)
- `geometry_type` VARCHAR(20) — loại đối tượng GIS (có thể cập nhật)
- `map_symbol_id` UUID — biểu tượng bản đồ (có thể cập nhật)
- `coordinate_system` VARCHAR(100) — hệ quy chiếu (có thể cập nhật)
- `display_rule` TEXT — quy tắc hiển thị (có thể cập nhật)
- `coordinates` TEXT — tọa độ WGS84 (có thể cập nhật)
- `status` SMALLINT NOT NULL DEFAULT 0 — trạng thái (giữ nguyên sau cập nhật)
- `updated_by` UUID — người cập nhật (tự động set)
- `updated_at` TIMESTAMP — thời gian cập nhật (tự động set)
- `created_by` UUID NOT NULL — người tạo (không thay đổi)
- `created_at` TIMESTAMP NOT NULL — thời gian tạo (không thay đổi)
- `deleted_at` TIMESTAMP — xóa mềm
- ~~deletedAt~~ — CoastalStationVTS dùng status "Lịch sử" thay vì soft-delete

**Bảng `coastal_station_haiphong_attachment` (File đính kèm):**
- Có thể thêm/xóa file qua API riêng
- `station_id` FK → coastal_station_haiphong

**Bảng `coastal_station_haiphong_operational_plan` (Vận hành khai thác - read-only):**
- Không cập nhật qua form này

**Bảng `coastal_station_haiphong_maintenance` (Bảo trì - read-only):**
- Không cập nhật qua form này

**Bảng `coastal_station_haiphong_incident` (Sự cố - read-only):**
- Không cập nhật qua form này
