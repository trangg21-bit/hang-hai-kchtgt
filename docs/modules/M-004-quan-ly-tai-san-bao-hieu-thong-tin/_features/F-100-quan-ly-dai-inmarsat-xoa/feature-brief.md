---
id: F-100
name: "Quản lý Đài Inmarsat - Xóa"
slug: quan-ly-dai-inmarsat-xoa
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:06Z"
last-updated: "2026-08-24"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Đài Inmarsat - Xóa

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-100
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

Tính năng cho phép admin hoặc operator xóa mềm (soft-delete) một Đài Inmarsat đã tồn tại. Hệ thống đánh dấu bản ghi là `DELETED` (set `deleted_at` và `deleted_by`), bản ghi vẫn giữ trong DB để phục hồi nếu cần nhưng không còn hiển thị trong danh sách bình thường. Chỉ bản ghi ở trạng thái `DRAFT` hoặc `PUBLISHED` mới được phép xóa mềm. Hệ thống ghi nhận lịch sử xóa và không cho phép xóa bản ghi đã bị xóa hoặc đang trong quy trình phê duyệt.

## 2. Trường dữ liệu

Bảng mô tả các trường liên quan đến thao tác xóa (theo sheet "Đài Inmarsat" — cột "Danh sách" = true, dùng để xác nhận bản ghi trước khi xóa):

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Đơn vị quản lý | Có | SelectOrgCode | Mã đơn vị (orgUnitId) — scope filter |
| 2 | Đơn vị khai thác | Có | SelectCateOther | |
| 3 | Mã đài | Có | Input (disabled, tự sinh INMARSAT-{seq}) | |
| 4 | Tên đài | Có | InputTextArea | |
| 7 | Tình trạng | Có | SelectAppParams | Chỉ xóa được khi DRAFT hoặc PUBLISHED |

## 3. Trạng thái và phê duyệt

- **Không có bước phê duyệt** trong chức năng xóa mềm.
- Chỉ cho phép xóa mềm bản ghi ở trạng thái `DRAFT` hoặc `PUBLISHED`.
- Bản ghi đã ở trạng thái `DELETED`, `PENDING_APPROVAL`, `APPROVED_L1`, `APPROVED_L2`, `REJECTED` — không cho phép xóa.
- Trạng thái lưu dạng số trong DB (xem `StationStatus` enum trong `00-lean-spec.md`).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-100-01 | Chỉ cho phép xóa mềm bản ghi ở trạng thái `DRAFT` hoặc `PUBLISHED` — từ chối nếu đang `PENDING_APPROVAL`, `APPROVED_L1`, `APPROVED_L2`, `REJECTED`, `DELETED` | Delete |
| BR-100-02 | Xóa mềm: set `deleted_at` = now(), `deleted_by` = current_user_id, `status` = DELETED | Delete |
| BR-100-03 | Ghi nhận bản ghi lịch sử SOFT_DELETE với actionType = SOFT_DELETE | Delete |
| BR-100-04 | Bản ghi đã xóa mềm không thể xóa lần nữa — từ chối với HTTP 409 | Delete |
| BR-100-05 | Chỉ user có phạm vi đơn vị chứa bản ghi mới được phép xóa | Delete |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-100-01** — Xóa thành công: Khi bản ghi ở trạng thái DRAFT hoặc PUBLISHED, hệ thống xóa mềm thành công, trả về HTTP 200.
- **AC-100-02** — Trạng thái không cho phép xóa: Khi bản ghi đang ở trạng thái `PENDING_APPROVAL` hoặc `DELETED`, hệ thống từ chối (HTTP 403/409) với thông báo phù hợp.
- **AC-100-03** — Ghi nhận lịch sử: Sau khi xóa, bản ghi lịch sử SOFT_DELETE được tạo tự động.

### 4.3. User Stories kế thừa (nếu có)

- **US-100-01:** Là admin, tôi muốn xóa mềm một Đài Inmarsat không còn sử dụng để loại khỏi danh sách hiển thị nhưng vẫn giữ lịch sử kiểm toán.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xóa mềm Đài Inmarsat | `coastal-station-inmarsat:delete` |

**Admin Cục:** Full quyền + xem thêm metadata người tạo/người sửa/thời gian (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — chỉ xóa được khi DRAFT hoặc PUBLISHED |
| 2 | Có bước phê duyệt không | Không |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` bắt buộc, filter theo subtree đơn vị cha, Cục xem full |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `coastal-station-inmarsat:delete` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| DELETE | `/api/v1/stations/inmarsat/{id}` | Xóa mềm Đài Inmarsat | `coastal-station-inmarsat:delete` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `coastal_station_inmarsat` (Đài Inmarsat):**
🔴 `id` UUID PK, 🔴 `org_unit_id` UUID FK → `org_unit`, 🔴 `operator_org_id` UUID FK, 🔴 `device_code` VARCHAR(50) UNIQUE (tự sinh INMARSAT-{seq}), 🔴 `device_name` VARCHAR(255), 🔴 `location_province` VARCHAR(255), 🔴 `location_detail` TEXT, 🔴 `status` INT (StationStatus enum), 🔴 `coverage_zone` TEXT, 🔴 `services` TEXT (multi-select JSON), 🔴 `frequency` TEXT, 🔴 `notes` TEXT, 🔴 `object_type` VARCHAR(20) (Điểm/Đường/Vùng), 🔴 `symbol` VARCHAR(100), 🔴 `coordinate_system` VARCHAR(50), 🔴 `display_rule` TEXT, 🔴 `latitude` DECIMAL, 🔴 `longitude` DECIMAL, 🔴 `created_by` UUID, 🔴 `created_at` TIMESTAMP, 🔴 `updated_by` UUID, 🔴 `updated_at` TIMESTAMP, 🔴 `deleted_at` TIMESTAMP, 🔴 `deleted_by` UUID
