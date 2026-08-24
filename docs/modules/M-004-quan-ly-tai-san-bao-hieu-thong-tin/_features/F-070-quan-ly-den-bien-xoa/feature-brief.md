---
id: F-070
name: "Quản lý Đèn biển - Xóa"
slug: quan-ly-den-bien-xoa
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:17Z"
last-updated: 2026-08-23
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Đèn biển - Xóa

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-070
**Module:** M-004 — Quản lý tài sản báo hiệu thông tin
**Loại:** chức năng có bước phê duyệt
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (TKCT)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **"Điểm khác biệt so với mẫu chung"** (mục 5, dòng 3 — *"Lọc cha-con / theo đơn vị"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

---

## 1. Mô tả ngắn

Cho phép người dùng xóa một đèn biển khỏi hệ thống. Đây là xóa mềm (soft-delete): bản ghi vẫn tồn tại trong cơ sở dữ liệu nhưng bị ẩn khỏi mọi truy vấn thông qua cơ chế `@SQLRestriction("deleted_at IS NULL")`. Trường `deletedAt` được gán thời gian hiện tại và trạng thái chuyển thành DELETED. Không thể xóa đèn biển đang trong quy trình phê duyệt (PENDING_APPROVAL, APPROVED_L1, APPROVED_L2). Khi xóa, điểm GIS tương ứng trên bản đồ M-007 bị ẩn đi.

## 2. Trường dữ liệu

Bảng mô tả các trường trên form tạo mới/chỉnh sửa:

| # | Tên trường (theo Excel) | Loại điều khiển (theo Excel) | Bắt buộc | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Mã đèn biển | Input (disabled) | Có | Có | Có | Có | Có | Không | Immutable, không cho sửa |
| 2 | Tên đèn biển | InputTextArea | Có | Có | Có | Có | Có | Không | Immutable, không cho sửa |
| 3 | Đơn vị quản lý | SelectOrgCode | Có | Có | Có | Có | Có | Không | Immutable, không cho sửa |
| 4 | Thuộc cảng biển | SelectKcht (CB) | Không | Có | Có | Có | Có | Không | Immutable, không cho sửa |
| 5 | Đơn vị vận hành | SelectCateOther | Không | Có | Có | Có | Có | Không | Immutable, không cho sửa |
| 6 | Địa điểm (Tỉnh/TP) | SelectCateOther | Không | Có | Có | Có | Có | Không | Immutable, không cho sửa |
| 7 | Địa điểm chi tiết | InputTextArea | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 8 | Tình trạng | SelectAppParams | Có | Có | Có | Có | Có | Không | Immutable, không cho sửa |
| 9 | Chủng loại đèn chính | Input | Không | Không | Có | Có | Có | Không | Immutable, không cho sửa |
| 10 | Chủng loại đèn dự phòng | Input | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 11 | Cấp trạm đèn | SelectAppParams | Có | Có | Có | Có | Có | Không | Immutable, không cho sửa |
| 12 | Địa bàn | InputTextArea | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 13 | Đặc điểm nhận dạng | InputTextArea | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 14 | Hình dạng | InputTextArea | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 15 | Chiều cao tháp đèn (m) | InputDecimal | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 16 | Chiều cao tâm sáng (m) | InputDecimal | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 17 | Tầm hiệu lực địa lý | Input | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 18 | Tầm hiệu lực ánh sáng | Input | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 19 | Màu sắc tháp đèn | InputTextArea | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 20 | Nguồn năng lượng | InputTextArea | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 21 | Thời điểm đưa vào sử dụng | DatePicker | Không | Không | Có | Có | Có | Không | Immutable, không cho sửa |
| 22 | Thời điểm sửa chữa gần nhất | DatePicker | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 23 | Địa điểm đặt trạm đèn | InputTextArea | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 24 | Kết cấu | InputTextArea | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 25 | Diện tích (m²) | InputDecimal | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 26 | Diện tích sử dụng trạm đèn (m²) | InputDecimal | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 27 | Số lượng nhân sự bố trí | InputTextArea | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 28 | Ghi chú | InputTextArea | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 29 | Loại đối tượng (GIS) | SelectAppParams | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 30 | Biểu tượng (GIS) | SelectIcon | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 31 | Hệ quy chiếu (GIS) | SelectAppParams | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 32 | Quy tắc hiển thị (GIS) | SelectAppParams | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 33 | Tọa độ (GIS) | LongLatTable | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 34 | Danh sách file | UploadFileTable | Không | Không | Không | Có | Có | Không | Immutable, không cho sửa |
| 35 | Ngày cập nhật | Textarea | Có | Có | Có | Có | Không | Không | Read-only, hệ thống tự điền |
| 36 | Cán bộ cập nhật | Textarea | Không | Không | Có | Có | Không | Không | Read-only, hệ thống tự điền |
| 37 | Ngày gửi phê duyệt | Textarea | Không | Không | Không | Có | Không | Không | Read-only, hệ thống tự điền |
| 38 | Cán bộ gửi phê duyệt | Textarea | Không | Không | Không | Có | Không | Không | Read-only, hệ thống tự điền |
| 39 | Ngày phê duyệt cấp Cảng vụ/Chi cục | Textarea | Không | Không | Không | Có | Không | Không | Read-only, hệ thống tự điền |
| 40 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | Textarea | Không | Không | Không | Có | Không | Không | Read-only, hệ thống tự điền |
| 41 | Nội dung phê duyệt | Textarea | Không | Không | Không | Có | Không | Không | Read-only, hệ thống tự điền |
| 42 | Ngày phê duyệt cấp Cục | Textarea | Không | Không | Không | Có | Không | Không | Read-only, hệ thống tự điền |
| 43 | Cán bộ phê duyệt cấp Cục | Textarea | Không | Không | Không | Có | Không | Không | Read-only, hệ thống tự điền |
| 44 | Nội dung phê duyệt | Textarea | Không | Không | Không | Có | Không | Không | Read-only, hệ thống tự điền |
| 45 | Trạng thái (Trạng thái phê duyệt) | Select (Dropdown) | Có | Có | Có | Có | Không | Không | Read-only, hệ thống tự quản |
| 46 | Mã kế hoạch (vận hành) | Text (read-only) | Không | Không | Không | Có | Không | Không | Khối read-only vận hành |
| 47 | Tên kế hoạch (vận hành) | Text (read-only) | Không | Không | Không | Có | Không | Không | Khối read-only vận hành |
| 48 | Ngày bắt đầu (vận hành) | Text (read-only) | Không | Không | Không | Có | Không | Không | Khối read-only vận hành |
| 49 | Ngày kết thúc (vận hành) | Text (read-only) | Không | Không | Không | Có | Không | Không | Khối read-only vận hành |
| 50 | Mã kế hoạch (bảo trì) | Text (read-only) | Không | Không | Không | Có | Không | Không | Khối read-only bảo trì |
| 51 | Tên kế hoạch (bảo trì) | Text (read-only) | Không | Không | Không | Có | Không | Không | Khối read-only bảo trì |
| 52 | Thời gian bắt đầu (bảo trì) | Text (read-only) | Không | Không | Không | Có | Không | Không | Khối read-only bảo trì |
| 53 | Thời gian kết thúc (bảo trì) | Text (read-only) | Không | Không | Không | Có | Không | Không | Khối read-only bảo trì |
| 54 | Mã sự cố | Text (read-only) | Không | Không | Không | Có | Không | Không | Khối read-only sự cố |
| 55 | Loại sự cố | Text (read-only) | Không | Không | Không | Có | Không | Không | Khối read-only sự cố |
| 56 | Địa điểm (sự cố) | Text (read-only) | Không | Không | Không | Có | Không | Không | Khối read-only sự cố |
| 57 | Thời gian (sự cố) | Text (read-only) | Không | Không | Không | Có | Có | Không | Khối read-only sự cố |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.7 (trạng thái lưu dạng số, không lưu chữ).
- Chức năng có bước phê duyệt 2 cấp:
  - **7 trạng thái:** DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, PUBLISHED, REJECTED, DELETED.
  - Không thể xóa đèn biển đang trong quy trình phê duyệt (PENDING_APPROVAL, APPROVED_L1, APPROVED_L2).
  - Khi xóa thành công, trạng thái chuyển thành DELETED.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/01-base-pattern.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-070-01 | Không thể xóa vĩnh viễn — chỉ soft-delete (đặt deleted_at) | Delete |
| BR-070-02 | Không thể xóa đèn biển đang trong quy trình phê duyệt (PENDING_APPROVAL, APPROVED_L1, APPROVED_L2) | Delete |
| BR-070-03 | Không thể xóa đèn biển đã bị xóa trước đó (status = DELETED) | Delete |
| BR-070-04 | Khi xóa đèn biển, điểm GIS tương ứng bị ẩn (không xóa) | Delete |
| BR-070-05 | Sau khi xóa, record không xuất hiện trong danh sách tìm kiếm hoặc xem chi tiết | Delete |
| BR-070-06 | Lịch sử SOFT_DELETE được ghi vào bảng beacon_history | Delete |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-070-01** — Xóa thành công: Xóa thành công đèn biển ở trạng thái DRAFT hoặc PUBLISHED — hệ thống trả về HTTP 200 với thông báo "Đã xóa đèn biển thành công".
- **AC-070-02** — Từ chối xóa đã xóa: Hệ thống từ chối xóa nếu đèn biển đã bị xóa trước đó (status = DELETED) — trả về lỗi "Đèn biển này đã bị xóa trước đó".
- **AC-070-03** — Từ chối xóa đang phê duyệt: Hệ thống từ chối xóa nếu đèn biển đang trong quy trình phê duyệt (PENDING_APPROVAL/APPROVED_L1/APPROVED_L2) — trả về lỗi "Không thể xóa đèn biển đang chờ phê duyệt".
- **AC-070-04** — Ẩn khỏi danh sách: Sau khi xóa, record không xuất hiện trong danh sách tìm kiếm hoặc xem chi tiết.
- **AC-070-05** — Ẩn điểm GIS: Điểm GIS trên bản đồ (M-007) bị ẩn sau khi xóa (không bị xóa vĩnh viễn).
- **AC-070-06** — Ghi lịch sử SOFT_DELETE: Lịch sử SOFT_DELETE được ghi vào bảng beacon_history.

### 4.3. User Stories kế thừa (nếu có)

- **US-070-01:** Như một quản trị viên, tôi muốn xóa mềm đèn biển không còn hoạt động để ẩn khỏi danh sách tác nghiệp nhưng vẫn lưu trữ dữ liệu lịch sử.
- **US-070-02:** Như một người vận hành, tôi muốn hệ thống tự động ẩn điểm GIS trên bản đồ khi xóa đèn biển.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xóa đèn biển | `beaconlight:delete` |
| Xem chi tiết | `beaconlight:read` |

**Admin Cục:** Full quyền + xem thêm metadata người tạo/người sửa/thời gian (ngày tạo, ngày cập nhật, cán bộ cập nhật, ngày gửi phê duyệt, cán bộ gửi phê duyệt, ngày phê duyệt cấp Cảng vụ/Chi cục, cán bộ phê duyệt cấp Cảng vụ/Chi cục, nội dung phê duyệt, ngày phê duyệt cấp Cục, cán bộ phê duyệt cấp Cục, nội dung phê duyệt).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 7 trạng thái: DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, PUBLISHED, REJECTED, DELETED |
| 2 | Có bước phê duyệt không | Có — 2 cấp: Cảng vụ/Chi cục (L1) → Cục (L2); cấm xóa đèn đang chờ phê duyệt |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` bắt buộc, controller khai `@DataScope`, aspect kích hoạt Hibernate global filter `orgUnitFilter`, đơn vị cha xem được đơn vị con (subtree), Cục xem full |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — khối read-only vận hành/bảo trì/sự cố chỉ hiển thị khi có dữ liệu liên kết từ bảng kế hoạch/bảo trì/sự cố |
| 5 | Quyền riêng | `beaconlight:delete`, `beaconlight:read` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — file đính kèm (UploadFileTable) |
| 8 | Giao diện khác mẫu chung | Có — 5 trường quy ước GIS (loại đối tượng, biểu tượng, hệ quy chiếu, quy tắc hiển thị, tọa độ), khối read-only vận hành/bảo trì/sự cố |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/beacon-lights/{id}` | Xem chi tiết đèn biển theo UUID để chuẩn bị form xóa | `beaconlight:read` |
| DELETE | `/api/beacon-lights/{id}` | Xóa mềm đèn biển | `beaconlight:delete` |
| GET | `/api/beacon-history?type=BEACON_LIGHT` | Xem lịch sử thao tác trên đèn biển | `beaconlight:history` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `beacon_light` (Đèn biển):** 🔴`code` (VARCHAR 50, unique, not null), 🔴`name` (VARCHAR 200, not null), 🔴`org_unit_id` (UUID, not null, FK → org_unit), 🔴`port_id` (UUID, FK → port), 🔴`operating_unit_id` (UUID, FK → org_unit), 🔴`province` (VARCHAR 100), 🔴`detail_location` (TEXT), 🔴`status` (INT, not null — trạng thái), 🔴`main_light_type` (VARCHAR 100), 🔴`backup_light_type` (VARCHAR 100), 🔴`station_level` (INT, not null), 🔴`area` (TEXT), 🔴`landmark_features` (TEXT), 🔴`shape` (TEXT), 🔴`tower_height_m` (DECIMAL), 🔴`light_center_height_m` (DECIMAL), 🔴`geographic_range` (DECIMAL), 🔴`light_range` (DECIMAL), 🔴`tower_color` (TEXT), 🔴`energy_source` (TEXT), 🔴`commissioning_date` (DATE), 🔴`last_repair_date` (DATE), 🔴`station_location` (TEXT), 🔴`structure` (TEXT), 🔴`area_m2` (DECIMAL), 🔴`used_area_m2` (DECIMAL), 🔴`staff_count` (VARCHAR 50), 🔴`notes` (TEXT), 🔴`gis_object_type` (VARCHAR 50), 🔴`gis_icon` (VARCHAR 50), 🔴`gis_coordinate_system` (VARCHAR 50), 🔴`gis_display_rule` (VARCHAR 50), 🔴`gis_coordinates` (TEXT — JSON), 🔴`approval_status` (INT), 🔴`approval_level` (INT), 🔴`approved_by` (UUID), 🔴`approved_date` (TIMESTAMP), 🔴`rejection_reason` (TEXT), 🔴`created_at` (TIMESTAMP), 🔴`updated_at` (TIMESTAMP), 🔴`created_by` (UUID), 🔴`updated_by` (UUID), 🔴`deleted_at` (TIMESTAMP), 🔴`deleted_by` (UUID)

**Bảng `beacon_history` (Lịch sử đèn biển):** 🔴`id` (UUID, PK), 🔴`entity_id` (UUID, FK → beacon_light), 🔴`beacon_type` (VARCHAR 50), 🔴`action_type` (VARCHAR 50 — CREATE/UPDATE/APPROVE_L1/APPROVE_L2/REJECT/SOFT_DELETE), 🔴`changed_field` (TEXT), 🔴`previous_value` (TEXT — JSON), 🔴`new_value` (TEXT — JSON), 🔴`changed_by` (UUID), 🔴`changed_at` (TIMESTAMP)

**Bảng `beacon_file` (File đính kèm đèn biển):** 🔴`id` (UUID, PK), 🔴`beacon_id` (UUID, FK → beacon_light), 🔴`file_name` (VARCHAR 255), 🔴`file_path` (VARCHAR 500), 🔴`file_size` (BIGINT), 🔴`uploaded_at` (TIMESTAMP), 🔴`uploaded_by` (UUID)