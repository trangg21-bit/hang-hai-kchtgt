---
id: F-110
name: "Quản lý Đài LRIT - Tạo mới"
slug: quan-ly-dai-lrit-tao-moi
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:22Z"
last-updated: "2026-09-01"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Đài LRIT - Tạo mới

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-110
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

Tính năng cho phép cán bộ nghiệp vụ (operator) tạo mới một Đài LRIT (Long Range Identification and Tracking — hệ thống nhận dạng và theo dõi tầm xa) trong hệ thống quản lý tài sản báo hiệu và thông tin hàng hải. Người dùng nhập thông tin hành chính (đơn vị quản lý, đơn vị khai thác, tên đài, địa điểm), thông số đặc thù LRIT (vùng phủ sóng, dịch vụ cung cấp), vị trí GIS (tọa độ, biểu tượng) và file đính kèm. Mã đài tự sinh theo định dạng `LRIT-{seq}`. Bản ghi mới có trạng thái DRAFT, sau đó gửi phê duyệt theo luồng 2 cấp.

## 2. Trường dữ liệu & Ma trận CRUD 5 Tab

Ma trận này là nguồn xác định phạm vi hiển thị của các màn Danh sách, Tạo mới, Sửa và Xem chi tiết Đài LRIT. TRUE ở cột **Danh sách** nghĩa là trường phải có cột riêng hoặc được hiển thị rõ trong cột gộp; TRUE ở **Bộ lọc** nghĩa là có điều khiển lọc tương ứng.

| STT | Tên trường | Loại điều khiển | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TAB 1 | Thông tin chung |  | FALSE | FALSE | FALSE | FALSE | FALSE |
| 1 | Mã đài | Input (disabled, tự sinh LRIT-{seq}) | TRUE | TRUE | TRUE | TRUE | TRUE |
| 2 | Tên đài (bắt buộc) | InputTextArea | TRUE | TRUE | TRUE | TRUE | TRUE |
| 3 | Đơn vị quản lý (bắt buộc) | SelectOrgCode | TRUE | TRUE | TRUE | TRUE | TRUE |
| 4 | Đơn vị khai thác | SelectCateOther | TRUE | FALSE | TRUE | TRUE | TRUE |
| 5 | Địa điểm (Tỉnh/TP) (bắt buộc) | SelectCateOther | TRUE | TRUE | TRUE | TRUE | TRUE |
| 6 | Địa điểm chi tiết (bắt buộc) | InputTextArea | FALSE | FALSE | TRUE | TRUE | TRUE |
| 7 | Tình trạng (bắt buộc) | SelectAppParams | TRUE | TRUE | TRUE | TRUE | TRUE |
| 8 | Vùng phủ sóng | InputTextArea | FALSE | FALSE | TRUE | TRUE | TRUE |
| 9 | Dịch vụ cung cấp | SelectAppParams (multi-select) | FALSE | FALSE | TRUE | TRUE | TRUE |
| 10 | Ghi chú | InputTextArea | FALSE | FALSE | TRUE | TRUE | TRUE |
| TAB 2 | Vị trí (GIS) |  | FALSE | FALSE | TRUE | TRUE | TRUE |
| 9 | Loại đối tượng | Select (Điểm/Đường/Vùng) | FALSE | FALSE | TRUE | TRUE | TRUE |
| 10 | Biểu tượng | Select | FALSE | FALSE | TRUE | TRUE | TRUE |
| 11 | Hệ quy chiếu | Text | FALSE | FALSE | TRUE | TRUE | TRUE |
| 12 | Quy tắc hiển thị | Text | FALSE | FALSE | TRUE | TRUE | TRUE |
| 13 | Tọa độ | LongLatTable | FALSE | FALSE | TRUE | TRUE | TRUE |
| TAB 3 | File đính kèm |  | FALSE | FALSE | FALSE | TRUE | TRUE |
| 16 | File đính kèm | UploadFileTable | FALSE | FALSE | TRUE | TRUE | TRUE |
| TAB 4 | Vận hành & bảo trì |  | FALSE | FALSE | FALSE | FALSE | FALSE |
|  | Thông tin vận hành khai thác |  | FALSE | FALSE | TRUE | FALSE | FALSE |
| 15 | Mã kế hoạch | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE |
| 16 | Tên kế hoạch | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE |
| 17 | Ngày bắt đầu | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE |
| 18 | Ngày kết thúc | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE |
|  | Thông tin bảo trì |  | FALSE | FALSE | TRUE | FALSE | FALSE |
| 19 | Mã kế hoạch | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE |
| 20 | Tên kế hoạch | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE |
| 21 | Thời gian bắt đầu | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE |
| 22 | Thời gian kết thúc | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE |
|  | Thông tin sự cố |  | FALSE | FALSE | TRUE | FALSE | FALSE |
| 23 | Mã sự cố | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE |
| 24 | Loại sự cố | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE |
| 25 | Địa điểm | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE |
| 26 | Thời gian | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE |
| TAB 5 | Xử lý & theo dõi (chỉ ở trang Chi tiết/Danh sách) |  | FALSE | FALSE | FALSE | FALSE | FALSE |
| 29 | Trạng thái | Badge (read-only) | TRUE | TRUE | TRUE | FALSE | FALSE |
| 30 | Ngày cập nhật | Text (read-only) | TRUE | TRUE | TRUE | FALSE | FALSE |
| 31 | Cán bộ cập nhật | Text (read-only) | TRUE | FALSE | TRUE | FALSE | FALSE |
| 32 | Ngày gửi phê duyệt | Text (read-only) | TRUE | FALSE | TRUE | FALSE | FALSE |
| 33 | Cán bộ gửi phê duyệt | Text (read-only) | TRUE | FALSE | TRUE | FALSE | FALSE |
| 34 | Ngày phê duyệt cấp Cảng vụ/Chi cục | Text (read-only) | TRUE | FALSE | TRUE | FALSE | FALSE |
| 35 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | Text (read-only) | TRUE | FALSE | TRUE | FALSE | FALSE |
| 36 | Nội dung phê duyệt | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE |
| 37 | Ngày phê duyệt cấp Cục | Text (read-only) | TRUE | FALSE | TRUE | FALSE | FALSE |
| 38 | Cán bộ phê duyệt cấp Cục | Text (read-only) | TRUE | FALSE | TRUE | FALSE | FALSE |
| 39 | Nội dung phê duyệt | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE |

Ghi chú triển khai: bộ lọc **Mã đài** và **Tên đài** dùng chung một ô từ khóa; cột gộp **Tên / Mã đài thông tin LRIT** hiển thị đủ hai giá trị. Mỗi cặp **cán bộ + thời gian** ở Tab 5 dùng một cột, xếp cán bộ ở dòng trên và thời gian ở dòng dưới. Tọa độ tạo mới mặc định rỗng, không tự sinh điểm 0,0.

## 3. Trạng thái và phê duyệt

- Đài LRIT sử dụng 7 trạng thái theo `ApprovalStatus` enum (lưu dạng số trong DB):
  - **0 — DRAFT** (Lưu tạm): Trạng thái mặc định khi tạo mới. Operator có thể sửa/xóa.
  - **1 — PROPOSED** (Đề nghị phê duyệt): Operator nhấn \"Gửi phê duyệt\" → chuyển sang trạng thái này.
  - **2 — PENDING_APPROVAL** (Chờ duyệt cấp Cảng vụ/Chi cục): Chờ Approver L1 xử lý.
  - **3 — APPROVED_LEVEL1** (Đã duyệt cấp Cảng vụ/Chi cục): Approver L1 đã phê duyệt.
  - **4 — APPROVED_LEVEL2** (Đã duyệt cấp Cục): Chờ Approver L2 phê duyệt cuối.
  - **5 — APPROVED** (Đã phê duyệt / Published): Đã hoàn thành 2 cấp, đưa vào vận hành.
  - **6 — REJECTED** (Từ chối): Bị từ chối ở bất kỳ cấp nào. Operator có thể sửa và gửi lại.
- Quy trình phê duyệt 2 cấp: DRAFT → PROPOSED → PENDING_APPROVAL → APPROVED_LEVEL1 → APPROVED_LEVEL2 → APPROVED.
- Từ chối ở bất kỳ cấp nào → REJECTED. Operator sửa lại → PROPOSED → tiếp tục luồng.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)
**Admin Cục:** Full quyền + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật (theo tài liệu nền mục 3.8).

**Lịch sử thay đổi:** Tạo mới hồ sơ DRAFT và tải/xóa tệp khi hồ sơ chưa duyệt không tạo lịch sử. Chỉ các thay đổi phát sinh sau phê duyệt cấp cuối mới hiển thị trong lịch sử.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 7 trạng thái: DRAFT, PROPOSED, PENDING_APPROVAL, APPROVED_LEVEL1, APPROVED_LEVEL2, APPROVED, REJECTED |
| 2 | Có bước phê duyệt không | Có — 2 cấp (Cảng vụ/Chi cục → Cục) |
| 3 | Lọc cha-con / theo đơn vị | Có — theo `orgUnitId`; đơn vị cha xem con, Cục xem toàn bộ (DataScopeAspect + orgUnitFilter) |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `coastal_station_lrit:create`, `coastal_station_lrit:read`, `coastal_station_lrit:submit` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — File đính kèm (UploadFileTable) |
| 8 | Giao diện khác mẫu chung | Có — 3 khối read-only (vận hành khai thác, bảo trì, sự cố) + 5 trường GIS |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/stations/lrit` | Danh sách Đài LRIT (phân trang, lọc theo đơn vị) | `coastal_station_lrit:read` |
| POST | `/api/v1/stations/lrit` | Tạo mới Đài LRIT (trạng thái DRAFT) | `coastal_station_lrit:create` |
| PUT | `/api/v1/stations/lrit/{id}` | Cập nhật thông tin Đài LRIT | `coastal_station_lrit:update` |
| DELETE | `/api/v1/stations/lrit/{id}` | Soft-delete Đài LRIT | `coastal_station_lrit:delete` |
| GET | `/api/v1/stations/lrit/{id}` | Xem chi tiết Đài LRIT | `coastal_station_lrit:read` |
| POST | `/api/v1/stations/lrit/{id}/submit` | Gửi phê duyệt (DRAFT → PROPOSED) | `coastal_station_lrit:submit` |
| GET | `/api/v1/stations/lrit/{id}/history` | Lịch sử thay đổi | `coastal_station_lrit:read` |

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
| ~~terminalId~~ | ~~VARCHAR~~ | ~~~~ | ~~Không còn theo Excel — thay bằng code~~ |
| ~~imoNumber~~ | ~~VARCHAR~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~reportingInterval~~ | ~~INT~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~antennaHeight~~ | ~~DECIMAL~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~powerOutput~~ | ~~DECIMAL~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~antennaType~~ | ~~VARCHAR~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~dataFormat~~ | ~~VARCHAR~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~communicationChannel~~ | ~~VARCHAR~~ | ~~~~ | ~~Không còn theo Excel~~ |
