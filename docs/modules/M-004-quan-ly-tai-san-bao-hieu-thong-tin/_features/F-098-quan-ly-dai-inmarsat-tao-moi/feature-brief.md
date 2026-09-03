---
id: F-098
name: "Quản lý Đài Inmarsat - Tạo mới"
slug: quan-ly-dai-inmarsat-tao-moi
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:06Z"
last-updated: "2026-09-01"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Đài Inmarsat - Tạo mới

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-098
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

Tính năng cho phép cán bộ nghiệp vụ (operator) tạo mới một Đài Inmarsat (trạm thông tin vệ tinh) trong hệ thống quản lý tài sản báo hiệu và thông tin hàng hải. Người dùng nhập đầy đủ thông tin nghiệp vụ của đài bao gồm: mã đài (tự sinh INMARSAT-{seq}), tên đài, địa điểm, tình trạng, vùng phủ sóng, dịch vụ cung cấp, tần số liên lạc, tọa độ GIS và file đính kèm. Dữ liệu được kiểm tra tính hợp lệ trước khi lưu — mã đài phải duy nhất. Kết quả trả về đối tượng `CoastalStationInmarsat` đã được tạo với trạng thái mặc định `DRAFT` (Lưu tạm).

## 2. Trường dữ liệu

Bảng mô tả các trường trên form tạo mới (theo sheet "Đài Inmarsat" trong Excel nguồn sự thật):

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Đơn vị quản lý | Có | SelectOrgCode | Mã đơn vị (orgUnitId) — scope filter |
| 2 | Đơn vị khai thác | Có | SelectCateOther | |
| 3 | Mã đài | Có | Input (disabled, tự sinh INMARSAT-{seq}) | Hệ thống tự sinh, không cho người dùng nhập |
| 4 | Tên đài | Có | InputTextArea | |
| 5 | Địa điểm (Tỉnh/TP) | Có | SelectCateOther | |
| 6 | Địa điểm chi tiết | Có | InputTextArea | |
| 7 | Tình trạng | Có | SelectAppParams | |
| 8 | Vùng phủ sóng | Không | InputTextArea | Thông tin đặc thù Inmarsat |
| 9 | Dịch vụ cung cấp | Không | Select multi-select trong khung bo góc, mỗi dịch vụ hiển thị một dòng, tên dài ellipsis | Thông tin đặc thù Inmarsat |
| 10 | Tần số liên lạc | Không | InputTextArea | Thông tin đặc thù Inmarsat |
| 11 | Ghi chú | Không | InputTextArea | |
| 12 | Loại đối tượng | Không | Select (Điểm/Đường/Vùng) | GIS |
| 13 | Biểu tượng | Không | Select | GIS |
| 14 | Hệ quy chiếu | Không | Text | GIS — mặc định WGS84 |
| 15 | Quy tắc hiển thị | Không | Text | GIS |
| 16 | Tọa độ | Không | LongLatTable | GIS |
| 17 | File đính kèm | Không | UploadFileTable | |

## 3. Trạng thái và phê duyệt

- Trạng thái mặc định khi tạo mới: **DRAFT** (Lưu tạm).
- **Không có bước phê duyệt** trong chức năng tạo mới — quy trình phê duyệt thuộc F-101.
- Trạng thái lưu dạng số trong DB (xem `ApprovalStatus` enum trong `00-lean-spec.md`).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-098-01 | Mã đài tự sinh theo định dạng `INMARSAT-{seq}` (seq tăng dần), không cho người dùng nhập thủ công | Create |
| BR-098-02 | Mã đài phải duy nhất trong toàn hệ thống — từ chối tạo nếu trùng | Create |
| BR-098-03 | Trạng thái mặc định sau khi tạo: `DRAFT` (Lưu tạm) | Create |
| BR-098-04 | Các trường đánh dấu "(bắt buộc)" trong Excel PHẢI được validate bắt buộc trước khi lưu | Create |
| BR-098-05 | Tọa độ GIS phải hợp lệ (WGS84) nếu người dùng nhập | Create |
| BR-098-06 | Đơn vị quản lý là trường bắt buộc — gán từ đơn vị của user đăng nhập nếu không có trong request | Create |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-098-01** — Tạo thành công: Khi nhập đầy đủ thông tin hợp lệ, hệ thống tạo thành công Đài Inmarsat mới trạng thái DRAFT, trả về HTTP 200 kèm đối tượng vừa tạo.
- **AC-098-02** — Trùng mã đài: Khi mã đài đã tồn tại, hệ thống từ chối tạo mới (HTTP 400) với thông báo "Mã đài đã tồn tại".
- **AC-098-03** — Thiếu trường bắt buộc: Khi bỏ trống trường bắt buộc, hệ thống hiển thị lỗi validation tại từng trường (HTTP 400).

### 4.3. User Stories kế thừa (nếu có)

- **US-098-01:** Là operator, tôi muốn tạo mới một Đài Inmarsat với đầy đủ thông tin kỹ thuật và hành chính để đưa vào quản lý.
- **US-098-02:** Là operator, tôi muốn hệ thống tự sinh mã đài theo định dạng chuẩn để đảm bảo tính nhất quán.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Tạo mới Đài Inmarsat | `coastal-station-inmarsat:create` |

**Admin Cục:** Full quyền + xem thêm metadata người tạo/người sửa/thời gian (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, PUBLISHED, REJECTED, DELETED (theo `StationStatus`) |
| 2 | Có bước phê duyệt không | Không — thuộc F-101 |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` bắt buộc, filter theo subtree đơn vị cha, Cục xem full |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `coastal-station-inmarsat:create` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — file đính kèm (UploadFileTable) |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/v1/stations/inmarsat` | Tạo mới Đài Inmarsat | `coastal-station-inmarsat:create` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `coastal_station_inmarsat` (Đài Inmarsat):**
🔴 `id` UUID PK, 🔴 `org_unit_id` UUID FK → `org_unit`, 🔴 `operator_org_id` UUID FK, 🔴 `device_code` VARCHAR(50) UNIQUE (tự sinh INMARSAT-{seq}), 🔴 `device_name` VARCHAR(255), 🔴 `location_province` VARCHAR(255), 🔴 `location_detail` TEXT, 🔴 `status` INT (StationStatus enum), 🔴 `coverage_zone` TEXT, 🔴 `services` TEXT (multi-select JSON), 🔴 `frequency` TEXT, 🔴 `notes` TEXT, 🔴 `object_type` VARCHAR(20) (Điểm/Đường/Vùng), 🔴 `symbol` VARCHAR(100), 🔴 `coordinate_system` VARCHAR(50), 🔴 `display_rule` TEXT, 🔴 `latitude` DECIMAL, 🔴 `longitude` DECIMAL, 🔴 `created_by` UUID, 🔴 `created_at` TIMESTAMP, 🔴 `updated_by` UUID, 🔴 `updated_at` TIMESTAMP, 🔴 `deleted_at` TIMESTAMP, 🔴 `deleted_by` UUID
