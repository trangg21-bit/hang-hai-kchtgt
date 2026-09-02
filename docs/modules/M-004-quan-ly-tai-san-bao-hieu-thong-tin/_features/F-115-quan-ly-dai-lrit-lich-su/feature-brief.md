---
id: F-115
name: "Quản lý Đài LRIT - Lịch sử"
slug: quan-ly-dai-lrit-lich-su
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:22Z"
last-updated: "2026-09-02"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Đài LRIT - Lịch sử

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-115
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Loại:** chức năng có bước phê duyệt
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (bắt buộc đọc trước)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **\"Điểm khác biệt so với mẫu chung\"** (mục 5, dòng 3 — *\"Lọc cha-con / theo đơn vị\"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

---

## 1. Mô tả ngắn

Tính năng tra cứu lịch sử thay đổi của một Đài LRIT sau khi hồ sơ đã được phê duyệt cấp cuối. Tạo mới, cập nhật hoặc thao tác tệp ở trạng thái nháp/từ chối không tạo và không hiển thị lịch sử. Mỗi bản ghi lịch sử chứa: actionType, changedField, previousValue, newValue, changedBy, changedAt. Dịch vụ đa chọn chỉ hiển thị phần thực sự thêm/xóa; tọa độ GIS hiển thị thống nhất theo loại hình và từng điểm DMS. API GET `/api/v1/stations/lrit/{id}/history` trả về danh sách CoastalStationLRITHistoryResponse.

## 2. Trường dữ liệu & Ma trận CRUD & Filter

F-115 chỉ đặc tả màn hình lịch sử; không lặp lại ma trận dữ liệu của hồ sơ Đài LRIT tại F-110, F-111 và F-114.

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

Ghi chú triển khai: chỉ dữ liệu phát sinh **sau khi hồ sơ đã được phê duyệt cấp cuối** mới được trả về. Dịch vụ đa chọn hiển thị delta thực tế (thêm/xóa); tọa độ GIS hiển thị theo loại đối tượng và từng điểm ở định dạng DMS.

## 3. Trạng thái và phê duyệt

- Lịch sử chỉ ghi và hiển thị các thay đổi phát sinh sau phê duyệt cấp cuối; không hiển thị action CREATE, phê duyệt/từ chối hoặc thao tác nháp.
- Danh sách lịch sử sắp xếp theo thời gian giảm dần (mới nhất trước).
- Mỗi bản ghi lịch sử chứa: actionType, changedField, previousValue, newValue, changedBy, changedAt.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-115-01 | Lịch sử chỉ ghi/hiển thị thay đổi sau phê duyệt cấp cuối; danh sách đa chọn hiển thị delta thực tế, tọa độ GIS hiển thị nhất quán DMS | History |
| BR-115-02 | Lịch sử không bị xóa theo bản ghi (soft-delete vẫn giữ) | History |
| BR-115-03 | Sắp xếp theo thời gian giảm dần (mới nhất trước) | History |
| BR-115-04 | Hiển thị dạng timeline trên UI | History |
| BR-115-05 | Filter theo `orgUnitId` — đơn vị cha xem con, Cục xem toàn bộ | History |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-115-01** — Tra cứu hợp lệ: HTTP 200, trả về danh sách lịch sử đầy đủ.
- **AC-115-02** — Hồ sơ chưa duyệt trả lịch sử rỗng; dịch vụ giữ nguyên không bị hiển thị là xóa/thêm lại.
- **AC-115-03** — Hiển thị chính xác changedField, previousValue, newValue, changedBy, changedAt.
- **AC-115-04** — Soft-delete bản ghi vẫn giữ lịch sử trong danh sách.

### 4.3. User Stories kế thừa (nếu có)

- **US-115-01:** As an auditor, I want to view the full change history of an LRIT station so that I can track all modifications.
- **US-115-02:** As a manager, I want to see who changed what and when so that accountability is maintained.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem lịch sử Đài LRIT | `coastal_station_lrit:read` |

**Admin Cục:** Full quyền + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật/người duyệt/thời gian duyệt/người xóa/thời gian xóa (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 7 trạng thái nghiệp vụ; F-115 chỉ truy vấn thay đổi sau phê duyệt cấp cuối, không hiển thị log tạo mới hoặc log phê duyệt/từ chối |
| 2 | Có bước phê duyệt không | Có — 2 cấp; phê duyệt là điều kiện mở lịch sử, không phải một dòng lịch sử hiển thị |
| 3 | Lọc cha-con / theo đơn vị | Có — theo `orgUnitId`; đơn vị cha xem con, Cục xem toàn bộ |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `coastal_station_lrit:read` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — File đính kèm (UploadFileTable) |
| 8 | Giao diện khác mẫu chung | Có — Timeline UI + 3 khối read-only (vận hành, bảo trì, sự cố) + 5 trường GIS |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/stations/lrit/{id}/history` | Lịch sử thay đổi (timeline, sắp xếp giảm dần) | `coastal_station_lrit:read` |
| GET | `/api/v1/stations/lrit/{id}` | Xem chi tiết (tham chiếu) | `coastal_station_lrit:read` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `coastal_station_lrit` (Đài LRIT):**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | UUID | Có | Primary key |
| `org_unit_id` | UUID | Có | FK → org_unit, DataScopeAspect |
| `operating_org_id` | UUID | Có | FK → org_unit (đơn vị khai thác) |
| `code` | VARCHAR(50) | Có | Tự sinh `LRIT-{seq}`, unique, bất biến |
| `name` | TEXT | Có | Tên đài |
| `location_province` | VARCHAR(200) | Có | Địa điểm Tỉnh/TP |
| `location_detail` | TEXT | Không | Địa điểm chi tiết |
| `status` | SMALLINT | Có | ApprovalStatus enum (0-6) |
| `operational_status` | SMALLINT | Có | Tình trạng kỹ thuật |
| `coverage_area` | TEXT | Không | Vùng phủ sóng |
| `services_provided` | JSON/TEXT | Không | Multi-select dịch vụ |
| `notes` | TEXT | Không | Ghi chú |
| `object_type` | VARCHAR(20) | Không | GIS: Điểm/Đường/Vùng |
| `symbol` | VARCHAR(100) | Không | GIS: Biểu tượng |
| `coordinate_system` | VARCHAR(50) | Không | GIS: Hệ quy chiếu |
| `display_rule` | TEXT | Không | GIS: Quy tắc hiển thị |
| `coordinates` | JSON/TEXT | Không | GIS: Tọa độ LongLatTable |
| `approval_level1_date` | TIMESTAMP | Không | Ngày duyệt cấp L1 |
| `approval_level1_by` | UUID | Không | Người duyệt L1 |
| `approval_level1_content` | TEXT | Không | Nội dung duyệt L1 |
| `approval_level2_date` | TIMESTAMP | Không | Ngày duyệt cấp L2 |
| `approval_level2_by` | UUID | Không | Người duyệt L2 |
| `approval_level2_content` | TEXT | Không | Nội dung duyệt L2 |
| `submitted_at` | TIMESTAMP | Không | Ngày gửi phê duyệt |
| `submitted_by` | UUID | Không | Người gửi phê duyệt |
| `created_by` | UUID | Có | Người tạo |
| `created_at` | TIMESTAMP | Có | Thời gian tạo |
| `updated_by` | UUID | Không | Người sửa cuối |
| `updated_at` | TIMESTAMP | Không | Thời gian sửa cuối |
| `deleted_at` | TIMESTAMP | Không | Soft-delete |
| `deleted_by` | UUID | Không | Người xóa |
| ~~terminalId~~ | ~~VARCHAR~~ | ~~~~ | ~~Không còn theo Excel — thay bằng code~~ |
| ~~imoNumber~~ | ~~VARCHAR~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~reportingInterval~~ | ~~INT~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~antennaHeight~~ | ~~DECIMAL~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~powerOutput~~ | ~~DECIMAL~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~antennaType~~ | ~~VARCHAR~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~dataFormat~~ | ~~VARCHAR~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~communicationChannel~~ | ~~VARCHAR~~ | ~~~~ | ~~Không còn theo Excel~~ |

**Bảng `coastal_station_lrit_history` (Lịch sử thay đổi — 🔴 mới):**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | UUID | Có | Primary key |
| `station_id` | UUID | Có | FK → coastal_station_lrit.id |
| `action_type` | VARCHAR(30) | Có | CREATE, UPDATE, SOFT_DELETE, APPROVE_L1, APPROVE_L2, REJECT |
| `changed_field` | VARCHAR(100) | Không | Tên trường bị thay đổi |
| `previous_value` | TEXT | Không | Giá trị trước |
| `new_value` | TEXT | Không | Giá trị sau |
| `changed_by` | UUID | Có | Người thực hiện |
| `changed_at` | TIMESTAMP | Có | Thời gian thay đổi |
