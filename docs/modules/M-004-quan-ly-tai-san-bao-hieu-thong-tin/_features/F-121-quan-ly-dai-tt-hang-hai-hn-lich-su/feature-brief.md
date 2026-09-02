---
id: F-121
name: "Quản lý Đài TT Hàng hải HN - Lịch sử"
slug: quan-ly-dai-tt-hang-hai-hn-lich-su
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:30Z"
last-updated: 2026-09-02
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Đài TT Hàng hải HN - Lịch sử

**Tài liệu:** BA Feature Brief
**Feature:** F-121
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Loại:** chức năng có bước phê duyệt

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **\"Điểm khác biệt so với mẫu chung\"** (mục 5, dòng 3 — *\"Lọc cha-con / theo đơn vị\"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

---

## 1. Mô tả ngắn

Tính năng tra cứu lịch sử thay đổi của một Đài Thông tin Hàng hải Hà Nội. Ghi nhận mọi action: CREATE, UPDATE, SOFT_DELETE, APPROVE_L1, APPROVE_L2, REJECT. Mỗi bản ghi lịch sử có actionType, changedField, previousValue, newValue, changedBy, changedAt. Hiển thị dạng timeline theo thứ tự thời gian giảm dần. Phục vụ kiểm toán dữ liệu, đáp ứng yêu cầu quản lý nhà nước về hàng hải.

## 2. Trường dữ liệu & Ma trận CRUD & Filter

F-121 chỉ đặc tả màn hình lịch sử; ma trận dữ liệu hồ sơ Đài TTXLTT Hàng hải dùng F-116, F-117 và F-120.

| STT | Tên trường | Loại điều khiển | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa |
| --- | --- | --- | --- | --- | --- | --- | --- |
| KHU VỰC TRA CỨU | Nội dung thay đổi | InputText | FALSE | TRUE | FALSE | FALSE | FALSE |
| 1 | Từ ngày | DatePicker | FALSE | TRUE | FALSE | FALSE | FALSE |
| 2 | Đến ngày | DatePicker | FALSE | TRUE | FALSE | FALSE | FALSE |
| DANH SÁCH LỊCH SỬ | Thời điểm thay đổi | Text (read-only) | TRUE | FALSE | TRUE | FALSE | FALSE |
| 3 | Loại thao tác | Badge (read-only) | TRUE | FALSE | TRUE | FALSE | FALSE |
| 4 | Cán bộ cập nhật | Text (read-only) | TRUE | FALSE | TRUE | FALSE | FALSE |
| 5 | Đơn vị của cán bộ cập nhật | Text (read-only) | TRUE | FALSE | TRUE | FALSE | FALSE |
| CHI TIẾT THAY ĐỔI | Tên trường thay đổi | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE |
| 6 | Giá trị trước thay đổi | Text / danh sách DMS (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE |
| 7 | Giá trị sau thay đổi | Text / danh sách DMS (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE |

Ghi chú triển khai: dịch vụ đa chọn hiển thị delta thực tế (thêm/xóa); tọa độ GIS hiển thị theo loại đối tượng và từng điểm ở định dạng DMS.

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.7 (trạng thái lưu dạng số, không lưu chữ).
- Lịch sử thay đổi ghi nhận mọi action types:
  - **CREATE** — Tạo mới bản ghi
  - **UPDATE** — Cập nhật thông tin
  - **SOFT_DELETE** — Xóa mềm (chuyển sang Lịch sử)
  - **APPROVE_L1** — Phê duyệt cấp 1 (Cảng vụ/Chi cục)
  - **APPROVE_L2** — Phê duyệt cấp 2 (Cục)
  - **REJECT** — Từ chối (C1 hoặc C2)
- Mỗi bản ghi lịch sử có: actionType, changedField, previousValue, newValue, changedBy, changedAt.
- Hiển thị dạng timeline theo thứ tự thời gian giảm dần.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/01-base-pattern.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-121-01 | Lịch sử không bị xóa theo bản ghi | Read |
| BR-121-02 | Ghi nhận mọi action types: CREATE, UPDATE, SOFT_DELETE, APPROVE_L1, APPROVE_L2, REJECT | Read |
| BR-121-03 | Hiển thị chính xác changedField, previousValue, newValue | Read |
| BR-121-04 | Sắp xếp theo thời gian giảm dần (mới nhất trước) | Read |
| BR-121-05 | Filter theo đơn vị: đơn vị nào chỉ xem dữ liệu đơn vị đó; đơn vị cha xem subtree; Cục xem full | Read |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-121-01** — Tra cứu hợp lệ: Trả về HTTP 200 với danh sách lịch sử theo timeline.
- **AC-121-02** — Bao gồm tất cả action types: CREATE, UPDATE, SOFT_DELETE, APPROVE_L1, APPROVE_L2, REJECT.
- **AC-121-03** — Hiển thị chính xác: changedField, previousValue, newValue, changedBy, changedAt.
- **AC-121-04** — Filter theo đơn vị: Chỉ hiển thị lịch sử của dữ liệu trong phạm vi đơn vị của user.

### 4.3. User Stories kế thừa (nếu có)

- **US-121-01:** Là người dùng có quyền xem, tôi muốn tra cứu lịch sử thay đổi của Đài TT Hàng hải HN để kiểm toán và xác định ai thay đổi thông tin.
- **US-121-02:** Là Admin Cục, tôi muốn xem toàn bộ lịch sử thay đổi bao gồm metadata người tạo/người sửa/thời gian.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem lịch sử | `coastalstationhaiphong:read` |
| Xem danh sách | `coastalstationhaiphong:read` |
| Xem chi tiết | `coastalstationhaiphong:read` |

**Admin Cục:** full quyền + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 7 trạng thái (hiển thị trong timeline lịch sử) |
| 2 | Có bước phê duyệt không | Có — 2 cấp (lịch sử ghi nhận APPROVE_L1/APPROVE_L2/REJECT) |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` (đơn vị quản lý), filter theo subtree đơn vị cha, Cục xem full |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `coastalstationhaiphong:read` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Có — Timeline lịch sử với 6 action types, hiển thị changedField/previousValue/newValue |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/stations/coastal-haiphong/{id}/history` | Lịch sử thay đổi của đài TT Hàng hải HN | `coastalstationhaiphong:read` |
| GET | `/api/v1/stations/coastal-haiphong` | Danh sách đài TT Hàng hải HN (phân trang, lọc) | `coastalstationhaiphong:read` |
| GET | `/api/v1/stations/coastal-haiphong/{id}` | Xem chi tiết đài TT Hàng hải HN | `coastalstationhaiphong:read` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `coastal_station_haiphong` (Đài Thông tin Hàng hải Hà Nội):**

- `id` UUID PK — không thay đổi
- `code` VARCHAR(50) UNIQUE — không thay đổi
- `name` VARCHAR(255) NOT NULL — không thay đổi
- `org_unit_id` UUID NOT NULL — không thay đổi
- `operating_unit_id` UUID — không thay đổi
- `province_id` UUID NOT NULL — không thay đổi
- `detailed_location` VARCHAR(500) NOT NULL — không thay đổi
- `usage_status` SMALLINT NOT NULL — không thay đổi
- `services_provided` TEXT — không thay đổi
- `remarks` VARCHAR(2000) — không thay đổi
- `geometry_type` VARCHAR(20) — không thay đổi
- `map_symbol_id` UUID — không thay đổi
- `coordinate_system` VARCHAR(100) — không thay đổi
- `display_rule` TEXT — không thay đổi
- `coordinates` TEXT — không thay đổi
- `status` SMALLINT NOT NULL DEFAULT 0 — không thay đổi
- `approval_level` SMALLINT DEFAULT 0 — không thay đổi
- `approved_by` UUID — không thay đổi
- `approved_date` TIMESTAMP — không thay đổi
- `rejection_reason` VARCHAR(500) — không thay đổi
- `approval_content` TEXT — không thay đổi
- `submitted_by` UUID — không thay đổi
- `submitted_date` TIMESTAMP — không thay đổi
- `updated_by` UUID — không thay đổi
- `updated_at` TIMESTAMP — không thay đổi
- `created_by` UUID NOT NULL — không thay đổi
- `created_at` TIMESTAMP NOT NULL — không thay đổi
- `deleted_at` TIMESTAMP — không thay đổi
- ~~deletedAt~~ — CoastalStationVTS dùng status "Lịch sử" thay vì soft-delete

**Bảng `coastal_station_haiphong_history` (Lịch sử thay đổi - 🔴 mới):**
- 🔴 `id` UUID PK
- 🔴 `station_id` UUID NOT NULL (FK → coastal_station_haiphong)
- 🔴 `action_type` VARCHAR(20) NOT NULL — CREATE / UPDATE / SOFT_DELETE / APPROVE_L1 / APPROVE_L2 / REJECT
- 🔴 `changed_field` VARCHAR(100) — tên trường thay đổi
- 🔴 `previous_value` TEXT — giá trị trước
- 🔴 `new_value` TEXT — giá trị sau
- 🔴 `changed_by` UUID NOT NULL — người thực hiện
- 🔴 `changed_at` TIMESTAMP NOT NULL — thời gian thay đổi

**Bảng `coastal_station_haiphong_attachment` (File đính kèm):**
- Không thay đổi khi xem lịch sử

**Bảng `coastal_station_haiphong_operational_plan` (Vận hành khai thác - read-only):**
- Không thay đổi khi xem lịch sử

**Bảng `coastal_station_haiphong_maintenance` (Bảo trì - read-only):**
- Không thay đổi khi xem lịch sử

**Bảng `coastal_station_haiphong_incident` (Sự cố - read-only):**
- Không thay đổi khi xem lịch sử
