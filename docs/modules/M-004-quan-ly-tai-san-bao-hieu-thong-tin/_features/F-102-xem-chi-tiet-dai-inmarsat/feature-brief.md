---
id: F-102
name: "Quản lý Đài Inmarsat - Xem chi tiết"
slug: xem-chi-tiet-dai-inmarsat
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:06Z"
last-updated: "2026-08-24"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Đài Inmarsat - Xem chi tiết

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-102
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

Tính năng cho phép người dùng xem toàn bộ thông tin chi tiết của một Đài Inmarsat cụ thể, bao gồm: thông tin cơ bản (mã đài, tên đài, địa điểm, tình trạng), thông tin đặc thù Inmarsat (vùng phủ sóng, dịch vụ cung cấp, tần số liên lạc), vị trí GIS (tọa độ, loại đối tượng, biểu tượng), file đính kèm, trạng thái & kiểm toán (trạng thái hiện tại, lịch sử phê duyệt), thông tin vận hành khai thác, thông tin bảo trì và thông tin sự cố. Dữ liệu hiển thị ở chế độ read-only (không cho sửa trực tiếp từ màn chi tiết).

## 2. Trường dữ liệu

Bảng mô tả toàn bộ 40 trường hiển thị trên màn chi tiết (theo sheet "Đài Inmarsat" — cột "Xem chi tiết" = true):

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Đơn vị quản lý | Có | SelectOrgCode | Mã đơn vị (orgUnitId) — scope filter |
| 2 | Đơn vị khai thác | Có | SelectCateOther | |
| 3 | Mã đài | Có | Input (disabled, tự sinh INMARSAT-{seq}) | |
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
| 18 | Trạng thái | Có | Badge (read-only) | Màu theo trạng thái |
| 19 | Ngày cập nhật | Có | Text (read-only) | |
| 20 | Cán bộ cập nhật | Có | Text (read-only) | |
| 21 | Ngày gửi phê duyệt | Có | Text (read-only) | |
| 22 | Cán bộ gửi phê duyệt | Có | Text (read-only) | |
| 23 | Ngày phê duyệt cấp Cảng vụ/Chi cục | Có | Text (read-only) | Cấp 1 |
| 24 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | Có | Text (read-only) | Cấp 1 |
| 25 | Nội dung phê duyệt | Không | Text (read-only) | Cấp 1 |
| 26 | Ngày phê duyệt cấp Cục | Có | Text (read-only) | Cấp 2 |
| 27 | Cán bộ phê duyệt cấp Cục | Có | Text (read-only) | Cấp 2 |
| 28 | Nội dung phê duyệt | Không | Text (read-only) | Cấp 2 |
| 29 | Mã kế hoạch (vận hành) | Không | Text (read-only) | |
| 30 | Tên kế hoạch (vận hành) | Không | Text (read-only) | |
| 31 | Ngày bắt đầu (vận hành) | Không | Text (read-only) | |
| 32 | Ngày kết thúc (vận hành) | Không | Text (read-only) | |
| 33 | Mã kế hoạch (bảo trì) | Không | Text (read-only) | |
| 34 | Tên kế hoạch (bảo trì) | Không | Text (read-only) | |
| 35 | Thời gian bắt đầu (bảo trì) | Không | Text (read-only) | |
| 36 | Thời gian kết thúc (bảo trì) | Không | Text (read-only) | |
| 37 | Mã sự cố | Không | Text (read-only) | |
| 38 | Loại sự cố | Không | Text (read-only) | |
| 39 | Địa điểm sự cố | Không | Text (read-only) | |
| 40 | Thời gian sự cố | Không | Text (read-only) | |

## 3. Trạng thái và phê duyệt

- Màn chi tiết hiển thị trạng thái hiện tại của Đài Inmarsat dưới dạng Badge màu (read-only).
- Hiển thị đầy đủ thông tin phê duyệt (2 cấp) nếu có.
- **Không có bước phê duyệt** trong chức năng xem chi tiết — chỉ hiển thị thông tin.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-102-01 | Chỉ hiển thị bản ghi thuộc phạm vi đơn vị của user (theo `orgUnitId`) | Read |
| BR-102-02 | Admin Cục xem thêm metadata: người tạo, người sửa, thời gian tạo/cập nhật | Read |
| BR-102-03 | Tất cả trường hiển thị ở chế độ read-only — không cho sửa trực tiếp từ màn chi tiết | Read |
| BR-102-04 | File đính kèm cho phép tải xuống (download) | Read |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-102-01** — Hiển thị đầy đủ: Khi mở màn chi tiết, hệ thống trả về HTTP 200 kèm toàn bộ thông tin Đài Inmarsat (40 trường).
- **AC-102-02** — Phạm vi đơn vị: User chỉ thấy thông tin của đơn vị mình có quyền — không thấy dữ liệu đơn vị khác.
- **AC-102-03** — Read-only: Tất cả trường hiển thị ở chế độ chỉ đọc, không có nút sửa trực tiếp trên màn chi tiết.

### 4.3. User Stories kế thừa (nếu có)

- **US-102-01:** Là operator/approver, tôi muốn xem toàn bộ thông tin chi tiết của một Đài Inmarsat để nắm rõ trạng thái và thông số kỹ thuật.
- **US-102-02:** Là lãnh đạo, tôi muốn xem thông tin phê duyệt (2 cấp) của Đài Inmarsat để theo dõi tiến trình.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem chi tiết Đài Inmarsat | `coastal-station-inmarsat:read` |

**Admin Cục:** Full quyền + xem thêm metadata người tạo/người sửa/thời gian (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — hiển thị Badge màu theo 7 trạng thái StationStatus |
| 2 | Có bước phê duyệt không | Không — chỉ hiển thị thông tin phê duyệt |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` bắt buộc, filter theo subtree đơn vị cha, Cục xem full |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `coastal-station-inmarsat:read` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không (chỉ tải xuống file đính kèm) |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/stations/inmarsat/{id}` | Xem chi tiết Đài Inmarsat | `coastal-station-inmarsat:read` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `coastal_station_inmarsat` (Đài Inmarsat):**
🔴 `id` UUID PK, 🔴 `org_unit_id` UUID FK → `org_unit`, 🔴 `operator_org_id` UUID FK, 🔴 `device_code` VARCHAR(50) UNIQUE (tự sinh INMARSAT-{seq}), 🔴 `device_name` VARCHAR(255), 🔴 `location_province` VARCHAR(255), 🔴 `location_detail` TEXT, 🔴 `status` INT (StationStatus enum), 🔴 `coverage_zone` TEXT, 🔴 `services` TEXT (multi-select JSON), 🔴 `frequency` TEXT, 🔴 `notes` TEXT, 🔴 `object_type` VARCHAR(20) (Điểm/Đường/Vùng), 🔴 `symbol` VARCHAR(100), 🔴 `coordinate_system` VARCHAR(50), 🔴 `display_rule` TEXT, 🔴 `latitude` DECIMAL, 🔴 `longitude` DECIMAL, 🔴 `created_by` UUID, 🔴 `created_at` TIMESTAMP, 🔴 `updated_by` UUID, 🔴 `updated_at` TIMESTAMP, 🔴 `deleted_at` TIMESTAMP, 🔴 `deleted_by` UUID
