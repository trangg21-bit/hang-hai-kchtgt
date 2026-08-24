---
id: F-094
name: Quản lý Đài TTDH - Xóa
slug: quan-ly-dai-ttdh-xoa
module-id: M-004
status: proposed
classification: local
priority: medium
created: 2026-07-07T03:32:57Z
last-updated: 2026-08-23
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Đài TTDH - Xóa

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-094
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Loại:** chức năng có bước phê duyệt
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (TKCT)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **\"Điểm khác biệt so với mẫu chung\"** (mục 5, dòng 3 — *\"Lọc cha-con / theo đơn vị\"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

> **⚠️ LƯU Ý QUAN TRỌNG — Sửa (S) = false toàn bộ trường:**
> Sheet Excel `Đài TTDH` đánh dấu **Sửa = false** cho TOÀN BỘ trường (cột \"Sửa\" trống). Feature F-094 (Xóa) không liên quan đến sửa trường — chỉ thực hiện xóa mềm. Ghi chú này được thêm dưới dạng banner để cảnh báo mâu thuẫn với F-093 (Cập nhật).

---

## 1. Mô tả ngắn

Cho phép cán bộ nghiệp vụ xóa mềm (soft delete) một Đài Thông tin Duyên hải (TTDH) đã tồn tại. Thao tác xóa không xóa bản ghi khỏi database mà đánh dấu trạng thái thành `DELETED` (6), đồng thời ghi nhận vào audit log. Bản ghi đã xóa vẫn hiển thị trong danh sách (có thể lọc theo trạng thái) và trong xem chi tiết (hiển thị mờ/greyed out). Xóa mềm cho phép khôi phục sau này nếu cần.

## 2. Trường dữ liệu

Feature F-094 (Xóa) **không có trường dữ liệu để chỉnh sửa** — chỉ là thao tác xác nhận xóa. Các trường liên quan đến xóa:

| STT | Tên trường (theo Excel) | Loại điều khiển | Bắt buộc | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| — | Xác nhận xóa | Confirm dialog | — | — | — | — | — | — | Popup xác nhận: \"Bạn có chắc muốn xóa Đài TTDH [tên]? Thao tác này chỉ xóa mềm, bản ghi vẫn tồn tại trong hệ thống.\" |
| — | Lý do xóa (nếu có) | TextArea | Không | — | — | — | — | — | Tùy chọn, bắt buộc nếu bản ghi đang ACTIVE |

## 3. Trạng thái và phê duyệt

- **7 trạng thái** (lưu dạng số trong DB, không lưu chữ):
  1. `DRAFT` (0) — Nháp
  2. `PROPOSED` (1) — Đã gửi phê duyệt
  3. `APPROVED_L1` (2) — Đã duyệt cấp 1 (Cảng vụ / Chi cục)
  4. `APPROVED_L2` (3) — Đã duyệt cấp 2 (Cục)
  5. `ACTIVE` (4) — Đang hoạt động
  6. `SUSPENDED` (5) — Tạm ngừng
  7. `DELETED` (6) — Đã xóa (soft delete)

- **Xóa mềm:**
  - Thao tác xóa → chuyển trạng thái thành `DELETED` (6).
  - Ghi nhận vào `station_history` với `actionType = DELETE`.
  - Bản ghi vẫn tồn tại trong DB, chỉ bị ẩn khỏi danh sách mặc định (lọc `approval_status != DELETED`).
  - Có thể khôi phục bằng cách chuyển lại trạng thái cũ (nếu cần).

- **Ràng buộc:**
  - Chỉ xóa được bản ghi ở trạng thái `DRAFT`, `SUSPENDED`, hoặc `DELETED` (không xóa được bản ghi ACTIVE mà không hủy hoạt động trước).
  - Nếu bản ghi đang ACTIVE: cần chuyển sang SUSPENDED trước khi xóa.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/01-base-pattern.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-094-01 | Xóa mềm — không xóa bản ghi khỏi DB, chỉ đánh dấu `approval_status = DELETED` | Delete |
| BR-094-02 | Chỉ xóa được bản ghi DRAFT/SUSPENDED/DELETED; bản ghi ACTIVE cần chuyển SUSPENDED trước | Delete |
| BR-094-03 | Ghi nhận vào station_history với actionType = DELETE, changedBy = người xóa | Delete |
| BR-094-04 | Lý do xóa bắt buộc nếu bản ghi đang ACTIVE | Delete |
| BR-094-05 | Bản ghi DELETED vẫn hiển thị trong danh sách (có thể lọc theo trạng thái) | Delete |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-094-01** — Popup xác nhận xóa với tên Đài TTDH và thông báo \"xóa mềm\".
- **AC-094-02** — Sau khi xóa, bản ghi chuyển sang DELETED, không hiển thị trong danh sách mặc định.
- **AC-094-03** — Audit log ghi nhận deletedBy, deletedAt.
- **AC-094-04** — Không cho xóa bản ghi ACTIVE trực tiếp — phải chuyển SUSPENDED trước.

### 4.3. User Stories kế thừa (nếu có)

- **US-094-01:** Như một cán bộ nghiệp vụ, tôi muốn xóa mềm một Đài TTDH để loại bỏ dữ liệu không còn sử dụng nhưng vẫn giữ lại lịch sử.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xóa mềm Đài TTDH | `coastalstation:delete` |

**Admin Cục:** full quyền + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 7 trạng thái: DRAFT, PROPOSED, APPROVED_L1, APPROVED_L2, ACTIVE, SUSPENDED, DELETED |
| 2 | Có bước phê duyệt không | Không — xóa mềm không cần phê duyệt (trừ khi quy định riêng) |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — chỉ xóa được bản ghi trong phạm vi đơn vị của user |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `coastalstation:delete` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Không — popup xác nhận xóa tiêu chuẩn |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| DELETE | `/api/v1/coastalstations/{id}` | Xóa mềm Đài TTDH | `coastalstation:delete` |
| GET | `/api/v1/coastalstations/{id}/history` | Xem lịch sử thay đổi | `coastalstation:read` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `coastal_station` (Đài Thông tin Duyên hải):**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| id | UUID | Có | Primary key |
| org_unit_id | UUID | Có | Đơn vị quản lý, FK → org_unit |
| operating_unit_id | UUID | Không | Đơn vị khai thác, FK → org_unit |
| code | VARCHAR(50) | Có | Mã đài tự sinh `DTTDH-{seq}`, unique, immutable |
| name | VARCHAR(255) | Có | Tên đài |
| station_level | SMALLINT | Có | Phân loại: 0=Loại I, 1=Loại II, ..., 4=Loại V |
| province_id | UUID | Có | Tỉnh/TP, FK → province |
| detailed_location | VARCHAR(500) | Có | Địa điểm chi tiết |
| usage_status | SMALLINT | Có | Tình trạng: 0=Chưa khai thác, 1=Đang khai thác, 2=Dừng khai thác |
| coverage_area | TEXT | Không | Vùng phủ sóng |
| services_provided | JSON | Không | Dịch vụ cung cấp (mảng 9 dịch vụ cố định) |
| remarks | VARCHAR(2000) | Không | Ghi chú |
| geometry_type | VARCHAR(20) | Không | GIS: Point/Line/Polygon |
| map_symbol_id | UUID | Không | GIS: biểu tượng |
| coordinate_system | VARCHAR(100) | Không | GIS: hệ quy chiếu |
| display_rule | TEXT | Không | GIS: quy tắc hiển thị |
| coordinates | JSON | Không | GIS: tọa độ WGS84 (mảng {lat, lon}) |
| approval_status | SMALLINT | Có | Trạng thái phê duyệt: 0=DRAFT, 1=PROPOSED, 2=APPROVED_L1, 3=APPROVED_L2, 4=ACTIVE, 5=SUSPENDED, 6=DELETED |
| deleted_at | TIMESTAMP | Không | Xóa mềm |
| deleted_by | UUID | Không | Người xóa |
| created_by | UUID | Có | Người tạo |
| created_at | TIMESTAMP | Có | Thời gian tạo |
| updated_by | UUID | Không | Người sửa cuối |
| updated_at | TIMESTAMP | Không | Thời gian sửa cuối |

🔴 **Trường mới cần thêm:** `deleted_at`, `deleted_by`.

**Bảng `station_history` (Lịch sử thay đổi):**

| Trường | Kiểu | Ghi chú |
|---|---|---|
| id | UUID | Primary key |
| entity_id | UUID | FK → coastal_station.id |
| action_type | VARCHAR(20) | CREATE, UPDATE, DELETE, APPROVE_L1, APPROVE_L2, REJECT |
| changed_field | VARCHAR(100) | Tên trường thay đổi |
| previous_value | TEXT | Giá trị cũ |
| new_value | TEXT | Giá trị mới |
| changed_by | UUID | Người thực hiện |
| changed_at | TIMESTAMP | Thời gian thay đổi |
