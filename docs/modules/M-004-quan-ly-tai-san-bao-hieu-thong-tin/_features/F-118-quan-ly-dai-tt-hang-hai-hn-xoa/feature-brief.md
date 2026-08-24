---
id: F-118
name: "Quản lý Đài TT Hàng hải HN - Xóa"
slug: quan-ly-dai-tt-hang-hai-hn-xoa
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:30Z"
last-updated: 2026-08-24
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Đài TT Hàng hải HN - Xóa

**Tài liệu:** BA Feature Brief
**Feature:** F-118
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Loại:** chức năng có bước phê duyệt

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **\"Điểm khác biệt so với mẫu chung\"** (mục 5, dòng 3 — *\"Lọc cha-con / theo đơn vị\"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

---

## 1. Mô tả ngắn

Tính năng cho phép cán bộ nghiệp vụ xóa mềm (soft-delete) một Đài Thông tin Hàng hải Hà Nội đã tồn tại. Xóa mềm đánh dấu bản ghi bị xóa nhưng vẫn giữ lại trong database để phục vụ kiểm toán. Bản ghi sau khi xóa mềm chuyển sang trạng thái Lịch sử (status = 6). Không thể xóa mềm bản ghi đã ở trạng thái Lịch sử. Ghi nhận lịch sử DELETE.

## 2. Trường dữ liệu

Bảng mô tả các trường liên quan đến thao tác xóa:

| # | Tên trường (theo Excel) | Loại điều khiển | Bắt buộc | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Đơn vị quản lý (bắt buộc) | SelectOrgCode | Có | Có | Có | Có | — | — | Chỉ hiển thị |
| 2 | Đơn vị khai thác | SelectCateOther | Không | Có | — | Có | — | — | Chỉ hiển thị |
| 3 | Mã đài | Input (disabled, tự sinh TTXLTT-{seq}) | Có | Có | Có | Có | — | — | Chỉ hiển thị |
| 4 | Tên đài (bắt buộc) | InputTextArea | Có | Có | Có | Có | — | — | Chỉ hiển thị |
| 5 | Địa điểm (Tỉnh/TP) (bắt buộc) | SelectCateOther | Có | Có | Có | Có | — | — | Chỉ hiển thị |
| 6 | Địa điểm chi tiết (bắt buộc) | InputTextArea | Có | Có | Có | Có | — | — | Chỉ hiển thị |
| 7 | Tình trạng (bắt buộc) | SelectAppParams | Có | Có | Có | Có | — | — | Chỉ hiển thị |
| 8 | Dịch vụ cung cấp | SelectAppParams (multi-select) | Không | — | — | Có | — | — | Chỉ hiển thị |
| 9 | Ghi chú | InputTextArea | Không | — | — | Có | — | — | Chỉ hiển thị |
| 10 | Loại đối tượng | Select (Điểm/Đường/Vùng) | Không | — | — | Có | — | — | Chỉ hiển thị |
| 11 | Biểu tượng | Select | Không | — | — | Có | — | — | Chỉ hiển thị |
| 12 | Hệ quy chiếu | Text | Không | — | — | Có | — | — | Chỉ hiển thị |
| 13 | Quy tắc hiển thị | Text | Không | — | — | Có | — | — | Chỉ hiển thị |
| 14 | Tọa độ | LongLatTable | Không | — | — | Có | — | — | Chỉ hiển thị |
| 15 | File đính kèm | UploadFileTable | Không | — | — | Có | — | — | Chỉ hiển thị |
| 16 | Trạng thái | Badge (read-only) | Có | Có | Có | Có | — | — | Hiển thị trạng thái Lịch sử sau khi xóa |
| 17 | Ngày cập nhật | Text (read-only) | Có | Có | Có | Có | — | — | — |
| 18 | Cán bộ cập nhật | Text (read-only) | Có | — | — | Có | — | — | — |
| 19 | Ngày gửi phê duyệt | Text (read-only) | Có | — | — | Có | — | — | — |
| 20 | Cán bộ gửi phê duyệt | Text (read-only) | Có | — | — | Có | — | — | — |
| 21 | Ngày phê duyệt cấp Cảng vụ/Chi cục | Text (read-only) | Có | — | — | Có | — | — | — |
| 22 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | Text (read-only) | Có | — | — | Có | — | — | — |
| 23 | Nội dung phê duyệt | Text (read-only) | Không | — | — | Có | — | — | Cấp C1 |
| 24 | Ngày phê duyệt cấp Cục | Text (read-only) | Có | — | — | Có | — | — | — |
| 25 | Cán bộ phê duyệt cấp Cục | Text (read-only) | Có | — | — | Có | — | — | — |
| 26 | Nội dung phê duyệt | Text (read-only) | Không | — | — | Có | — | — | Cấp C2 |
| 27 | Mã kế hoạch (vận hành) | Text (read-only) | Không | — | — | Có | — | — | Read-only vận hành |
| 28 | Tên kế hoạch (vận hành) | Text (read-only) | Không | — | — | Có | — | — | Read-only vận hành |
| 29 | Ngày bắt đầu (vận hành) | Text (read-only) | Không | — | — | Có | — | — | Read-only vận hành |
| 30 | Ngày kết thúc (vận hành) | Text (read-only) | Không | — | — | Có | — | — | Read-only vận hành |
| 31 | Mã kế hoạch (bảo trì) | Text (read-only) | Không | — | — | Có | — | — | Read-only bảo trì |
| 32 | Tên kế hoạch (bảo trì) | Text (read-only) | Không | — | — | Có | — | — | Read-only bảo trì |
| 33 | Thời gian bắt đầu (bảo trì) | Text (read-only) | Không | — | — | Có | — | — | Read-only bảo trì |
| 34 | Thời gian kết thúc (bảo trì) | Text (read-only) | Không | — | — | Có | — | — | Read-only bảo trì |
| 35 | Mã sự cố | Text (read-only) | Không | — | — | Có | — | — | Read-only sự cố |
| 36 | Loại sự cố | Text (read-only) | Không | — | — | Có | — | — | Read-only sự cố |
| 37 | Địa điểm (sự cố) | Text (read-only) | Không | — | — | Có | — | — | Read-only sự cố |
| 38 | Thời gian (sự cố) | Text (read-only) | Không | — | — | Có | — | — | Read-only sự cố |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.7 (trạng thái lưu dạng số, không lưu chữ).
- Chức năng có bước phê duyệt 2 cấp (xem F-116).
- Xóa mềm → bản ghi chuyển sang trạng thái **Lịch sử** (status = 6).
- Bản ghi trạng thái Lịch sử → không thể xóa mềm thêm.
- Ghi nhận lịch sử DELETE.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/01-base-pattern.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-118-01 | Xóa mềm → chuyển status sang Lịch sử (status = 6) | Delete |
| BR-118-02 | Không thể xóa mềm bản ghi đã ở trạng thái Lịch sử | Delete |
| BR-118-03 | Ghi nhận lịch sử DELETE với operatorId, deletedAt | Delete |
| BR-118-04 | Xóa mềm không xóa dữ liệu khỏi database — chỉ đánh dấu deletedAt | Delete |
| BR-118-05 | Bản ghi xóa mềm vẫn hiển thị trong danh sách (có thể lọc theo trạng thái) | Delete |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-118-01** — Xóa mềm thành công: Nhấn "Xóa" → bản ghi chuyển sang Lịch sử, HTTP 200.
- **AC-118-02** — Không xóa Lịch sử: Bản ghi trạng thái Lịch sử → HTTP 400 "Đài TTDH ở trạng thái Lịch sử không thể xóa".
- **AC-118-03** — Ghi lịch sử: Lịch sử DELETE được ghi nhận với operatorId, deletedAt.
- **AC-118-04** — Dữ liệu không mất: Bản ghi xóa mềm vẫn tồn tại trong database, chỉ đánh dấu deletedAt.

### 4.3. User Stories kế thừa (nếu có)

- **US-118-01:** Là cán bộ nghiệp vụ, tôi muốn xóa mềm một Đài TT Hàng hải HN để đánh dấu không còn hoạt động nhưng vẫn giữ lại dữ liệu phục vụ kiểm toán.
- **US-118-02:** Là Admin Cục, tôi muốn xem bản ghi đã xóa mềm trong danh sách (có thể lọc theo trạng thái Lịch sử).

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xóa mềm đài | `coastalstationhaiphong:delete` |
| Xem danh sách | `coastalstationhaiphong:read` |
| Xem chi tiết | `coastalstationhaiphong:read` |

**Admin Cục:** full quyền + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — Xóa mềm → chuyển sang trạng thái Lịch sử (status = 6) thay vì soft-delete |
| 2 | Có bước phê duyệt không | Có — 2 cấp (nhưng xóa mềm không cần duyệt, chỉ cần quyền delete) |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` (đơn vị quản lý), filter theo subtree đơn vị cha, Cục xem full |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `coastalstationhaiphong:delete`, `coastalstationhaiphong:read` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Có — 5 nhóm thông tin: cơ bản, đặc thù TTXLTT, GIS, file đính kèm, vận hành/bảo trì/sự cố (read-only) |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| DELETE | `/api/v1/stations/coastal-haiphong/{id}` | Xóa mềm đài TT Hàng hải HN → chuyển sang Lịch sử | `coastalstationhaiphong:delete` |
| GET | `/api/v1/stations/coastal-haiphong` | Danh sách đài TT Hàng hải HN (phân trang, lọc theo trạng thái) | `coastalstationhaiphong:read` |
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
- `status` SMALLINT NOT NULL DEFAULT 0 — **chuyển sang 6 (Lịch sử) khi xóa mềm**
- `deleted_at` TIMESTAMP — **set khi xóa mềm**
- `updated_by` UUID — người xóa mềm
- `updated_at` TIMESTAMP — thời gian xóa mềm
- `created_by` UUID NOT NULL — người tạo (không thay đổi)
- `created_at` TIMESTAMP NOT NULL — thời gian tạo (không thay đổi)
- ~~deletedAt~~ — CoastalStationVTS dùng status "Lịch sử" thay vì soft-delete

**Bảng `coastal_station_haiphong_attachment` (File đính kèm):**
- Không xóa file khi xóa mềm đài

**Bảng `coastal_station_haiphong_operational_plan` (Vận hành khai thác - read-only):**
- Không xóa khi xóa mềm đài

**Bảng `coastal_station_haiphong_maintenance` (Bảo trì - read-only):**
- Không xóa khi xóa mềm đài

**Bảng `coastal_station_haiphong_incident` (Sự cố - read-only):**
- Không xóa khi xóa mềm đài
