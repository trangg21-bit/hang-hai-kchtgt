---
id: F-099
name: "Quản lý Đài Inmarsat - Cập nhật"
slug: quan-ly-dai-inmarsat-cap-nhat
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:06Z"
last-updated: "2026-08-24"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Đài Inmarsat - Cập nhật

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-099
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Loại:** chức năng thường (không có bước phê duyệt)
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (TKCT)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **"Điểm khác biệt so với mẫu chung"** (mục 5, dòng 3 — *"Lọc cha-con / theo đơn vị"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

---

## 1. Mô tả ngắn

Tính năng cho phép cán bộ nghiệp vụ (operator) cập nhật thông tin của một Đài Inmarsat đã tồn tại. Người dùng mở form chỉnh sửa từ màn chi tiết hoặc danh sách, sửa các trường thông tin (tên đài, địa điểm, tình trạng, vùng phủ sóng, dịch vụ cung cấp, tần số liên lạc, tọa độ GIS, file đính kèm...), sau đó lưu lại. Hệ thống kiểm tra validation và ghi nhận lịch sử thay đổi. Chỉ bản ghi ở trạng thái `DRAFT` hoặc `PUBLISHED` mới được phép cập nhật.

## 2. Trường dữ liệu

Bảng mô tả các trường trên form cập nhật (theo sheet "Đài Inmarsat" — cột "Sửa" = true):

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Đơn vị quản lý | Có | SelectOrgCode | Mã đơn vị (orgUnitId) — scope filter |
| 2 | Đơn vị khai thác | Có | SelectCateOther | |
| 3 | Mã đài | Có | Input (disabled, tự sinh INMARSAT-{seq}) | Không cho sửa |
| 4 | Tên đài | Có | InputTextArea | |
| 5 | Địa điểm (Tỉnh/TP) | Có | SelectCateOther | |
| 6 | Địa điểm chi tiết | Có | InputTextArea | |
| 7 | Tình trạng | Có | SelectAppParams | |
| 8 | Vùng phủ sóng | Không | InputTextArea | Thông tin đặc thù Inmarsat |
| 9 | Dịch vụ cung cấp | Không | SelectAppParams (multi-select) | Thông tin đặc thù Inmarsat |
| 10 | Tần số liên lạc | Không | InputTextArea | Thông tin đặc thù Inmarsat |
| 11 | Ghi chú | Không | InputTextArea | |
| 12 | Loại đối tượng | Không | Select (Điểm/Đường/Vùng) | GIS |
| 13 | Biểu tượng | Không | Select | GIS |
| 14 | Hệ quy chiếu | Không | Text | GIS — mặc định WGS84 |
| 15 | Quy tắc hiển thị | Không | Text | GIS |
| 16 | Tọa độ | Không | LongLatTable | GIS |
| 17 | File đính kèm | Không | UploadFileTable | |

## 3. Trạng thái và phê duyệt

- **Không có bước phê duyệt** trong chức năng cập nhật — thay đổi trực tiếp lưu vào DB.
- Chỉ bản ghi ở trạng thái `DRAFT` hoặc `PUBLISHED` mới được phép cập nhật.
- Trạng thái lưu dạng số trong DB (xem `StationStatus` enum trong `00-lean-spec.md`).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-099-01 | Chỉ cho phép cập nhật bản ghi ở trạng thái `DRAFT` hoặc `PUBLISHED` — từ chối nếu đang `PENDING_APPROVAL`, `APPROVED_L1`, `APPROVED_L2`, `REJECTED`, `DELETED` | Update |
| BR-099-02 | Mã đài không được phép sửa (readonly) | Update |
| BR-099-03 | Các trường đánh dấu "(bắt buộc)" trong Excel PHẢI được validate bắt buộc trước khi lưu | Update |
| BR-099-04 | Ghi nhận bản ghi lịch sử UPDATE khi có thay đổi giá trị | Update |
| BR-099-05 | Tọa độ GIS phải hợp lệ (WGS84) nếu người dùng nhập | Update |
| BR-099-06 | Đơn vị quản lý không được phép đổi sang đơn vị ngoài phạm vi quyền của user | Update |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-099-01** — Cập nhật thành công: Khi nhập đầy đủ thông tin hợp lệ, hệ thống cập nhật thành công Đài Inmarsat, trả về HTTP 200 kèm đối tượng vừa sửa.
- **AC-099-02** — Trạng thái không cho phép sửa: Khi bản ghi đang ở trạng thái `PENDING_APPROVAL` hoặc `APPROVED_L1`, hệ thống từ chối (HTTP 403) với thông báo "Không thể sửa bản ghi đang trong quy trình phê duyệt".
- **AC-099-03** — Thiếu trường bắt buộc: Khi bỏ trống trường bắt buộc, hệ thống hiển thị lỗi validation tại từng trường (HTTP 400).

### 4.3. User Stories kế thừa (nếu có)

- **US-099-01:** Là operator, tôi muốn cập nhật thông tin của một Đài Inmarsat đã tồn tại để giữ dữ liệu luôn chính xác.
- **US-099-02:** Là operator, tôi muốn hệ thống ghi nhận lịch sử thay đổi khi tôi cập nhật thông tin đài.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Cập nhật Đài Inmarsat | `coastal-station-inmarsat:update` |

**Admin Cục:** Full quyền + xem thêm metadata người tạo/người sửa/thời gian (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — chỉ sửa được khi DRAFT hoặc PUBLISHED |
| 2 | Có bước phê duyệt không | Không — thuộc F-101 |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` bắt buộc, filter theo subtree đơn vị cha, Cục xem full |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `coastal-station-inmarsat:update` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — file đính kèm (UploadFileTable) |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| PUT | `/api/v1/stations/inmarsat/{id}` | Cập nhật Đài Inmarsat | `coastal-station-inmarsat:update` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `coastal_station_inmarsat` (Đài Inmarsat):**
🔴 `id` UUID PK, 🔴 `org_unit_id` UUID FK → `org_unit`, 🔴 `operator_org_id` UUID FK, 🔴 `device_code` VARCHAR(50) UNIQUE (tự sinh INMARSAT-{seq}), 🔴 `device_name` VARCHAR(255), 🔴 `location_province` VARCHAR(255), 🔴 `location_detail` TEXT, 🔴 `status` INT (StationStatus enum), 🔴 `coverage_zone` TEXT, 🔴 `services` TEXT (multi-select JSON), 🔴 `frequency` TEXT, 🔴 `notes` TEXT, 🔴 `object_type` VARCHAR(20) (Điểm/Đường/Vùng), 🔴 `symbol` VARCHAR(100), 🔴 `coordinate_system` VARCHAR(50), 🔴 `display_rule` TEXT, 🔴 `latitude` DECIMAL, 🔴 `longitude` DECIMAL, 🔴 `created_by` UUID, 🔴 `created_at` TIMESTAMP, 🔴 `updated_by` UUID, 🔴 `updated_at` TIMESTAMP, 🔴 `deleted_at` TIMESTAMP, 🔴 `deleted_by` UUID
