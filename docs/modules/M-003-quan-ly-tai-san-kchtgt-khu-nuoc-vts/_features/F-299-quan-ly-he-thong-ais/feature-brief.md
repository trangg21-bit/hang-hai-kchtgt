---
id: F-299
name: Quản lý Hệ thống AIS
slug: quan-ly-he-thong-ais
module-id: M-003
status: approved
classification: local
priority: high
created: 2026-08-26
last-updated: 2026-08-26
locked-fields: []
consumed_by_modules: [M-007, M-019, M-021, M-022]
---

# Đặc tả nghiệp vụ: Quản lý Hệ thống AIS

**Tài liệu:** Tài liệu chức năng — phần riêng (Feature Brief)  
**Chức năng:** F-299 — Quản lý Hệ thống AIS  
**Module:** M-003 — Quản lý tài sản KCHTGT - Khu nước & VTS  
**Loại:** Chức năng có bước phê duyệt 2 cấp  
**Tham chiếu:** `docs/conventions/infrastructure-feature-standard-architecture.md`, `docs/conventions/approval-2-level-spec.md`, `docs/conventions/list-screen-ui-standard.md`

---

## 1. Mô tả ngắn

Chức năng Quản lý Hệ thống AIS (Automatic Identification System) cho phép quản lý danh mục, thông tin kỹ thuật, tình trạng vận hành, vị trí không gian GIS và hồ sơ pháp lý của các thiết bị/trạm AIS thuộc hạ tầng hàng hải và hệ thống VTS. Chức năng phục vụ Cán bộ đơn vị (Cảng vụ, Chi cục, Doanh nghiệp) tạo mới/cập nhật hồ sơ và Lãnh đạo các cấp (Cấp 1 - Cảng vụ/Chi cục, Cấp 2 - Cục Hàng hải) thực hiện phê duyệt hồ sơ theo quy trình phê duyệt 2 cấp chuẩn.

---

## 2. Trường dữ liệu & Ma trận CRUD / Bộ lọc

### 2.1. Ma trận trường dữ liệu nghiệp vụ (CRUD & Filter Matrix)

| STT | Tên trường | Loại điều khiển | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa | Ghi chú / Ràng buộc |
|:---:|---|---|:---:|:---:|:---:|:---:|:---:|---|
| | **Thông tin chung** | | FALSE | FALSE | TRUE | FALSE | FALSE | Nhóm thông tin chung |
| 1 | Đơn vị quản lý (bắt buộc khi tạo) | SelectOrgCode (OrgUnitTreeSelect) | TRUE | TRUE | TRUE | TRUE | TRUE | Bắt buộc khi tạo. Lọc theo Data Scope phân quyền. |
| 2 | Thuộc TTDH VTS / Trạm Radar (bắt buộc) | SelectKcht (TTDH / Radar) | TRUE | TRUE | TRUE | TRUE | TRUE | Bắt buộc. Cascading filter theo đơn vị quản lý `orgUnitId`. |
| 3 | Đơn vị khai thác | SelectCateOther (Operating Org) | TRUE | FALSE | TRUE | TRUE | TRUE | Danh mục đơn vị khai thác. |
| 4 | Mã thiết bị | Input (disabled, tự sinh AIS-{seq}) | FALSE | TRUE | TRUE | TRUE | TRUE | Tự động sinh mã `AIS-{seq}` (read-only). |
| 5 | Tên thiết bị (bắt buộc) | Input | FALSE | TRUE | TRUE | TRUE | TRUE | Bắt buộc nhập, tối đa 255 ký tự. |
| 6 | Địa điểm (Tỉnh/TP) | SelectCateOther (Provinces) | TRUE | TRUE | TRUE | TRUE | TRUE | Tìm kiếm tiếng Việt không dấu (`normalizeSearchText`). |
| 7 | Địa điểm chi tiết | Input | FALSE | FALSE | TRUE | TRUE | TRUE | Tối đa 500 ký tự. |
| 8 | Đơn vị tính (bắt buộc) | SelectAppParams (UnitOfMeasure) | TRUE | FALSE | TRUE | TRUE | TRUE | Bắt buộc. Danh mục: Bộ, Cái, Hệ thống, Trạm. |
| 9 | Số lượng (bắt buộc) | Input / InputNumber | TRUE | FALSE | TRUE | TRUE | TRUE | Bắt buộc, số nguyên dương > 0. |
| 10 | Năm đưa vào sử dụng | DatePicker (năm) | TRUE | TRUE | TRUE | TRUE | TRUE | Chọn năm (`picker="year"`). |
| 11 | Tình trạng (bắt buộc) | SelectAppParams (ConditionStatus) | TRUE | TRUE | TRUE | TRUE | TRUE | Bắt buộc. Semantic badge (`OPERATIONAL`, `MAINTENANCE`...). |
| | **Thông tin thiết bị** | | FALSE | FALSE | TRUE | FALSE | FALSE | Nhóm thông tin thiết bị chi tiết |
| 12 | Model | Input | FALSE | FALSE | TRUE | TRUE | TRUE | Tối đa 100 ký tự. |
| 13 | Thông số kỹ thuật | InputTextArea | FALSE | FALSE | TRUE | TRUE | TRUE | TextArea bo tròn 20px, tối đa 2000 ký tự. |
| 14 | Hãng sản xuất | Input | FALSE | FALSE | TRUE | TRUE | TRUE | Tối đa 255 ký tự. |
| 15 | Thông tin bảo trì | InputTextArea | FALSE | FALSE | TRUE | TRUE | TRUE | TextArea bo tròn 20px, tối đa 2000 ký tự. |
| 16 | Ghi chú | InputTextArea | FALSE | FALSE | TRUE | TRUE | TRUE | TextArea bo tròn 20px, tối đa 2000 ký tự. |
| | **Thông tin vị trí** | | FALSE | FALSE | TRUE | TRUE | TRUE | Tọa độ không gian bản đồ GIS |
| 17 | Loại đối tượng | Select (Điểm/Đường/Vùng) | FALSE | FALSE | TRUE | TRUE | TRUE | POINT, POLYGON, LINESTRING. |
| 18 | Biểu tượng | Select (Symbol) | FALSE | FALSE | TRUE | TRUE | TRUE | Icon hiển thị trên bản đồ. |
| 19 | Hệ quy chiếu | Text (read-only) | FALSE | FALSE | TRUE | TRUE | TRUE | Mặc định: `WGS-84`. |
| 20 | Quy tắc hiển thị | Text (read-only) | FALSE | FALSE | TRUE | TRUE | TRUE | Độ/Phút/Giây. |
| 21 | Tọa độ | LongLatTable / LocationForm | FALSE | FALSE | TRUE | TRUE | TRUE | Kinh độ / Vĩ độ thập phân hoặc GeoJSON WKT. |
| | **File đính kèm** | | FALSE | FALSE | TRUE | TRUE | TRUE | Quản lý tài liệu hồ sơ |
| 22 | File đính kèm | UploadFileTable | FALSE | FALSE | TRUE | TRUE | TRUE | Upload file PDF, DOCX, hình ảnh (lưu MinIO). |
| | **Trạng thái & Kiểm toán** | | FALSE | FALSE | TRUE | FALSE | FALSE | Quản lý vòng đời & Lịch sử phê duyệt |
| 23 | Trạng thái | Badge (read-only) | TRUE | TRUE | TRUE | FALSE | FALSE | Pill badge 7 trạng thái chuẩn theo Semantic Tokens. |
| 24 | Ngày cập nhật | Text (read-only) | TRUE | TRUE | TRUE | FALSE | FALSE | Định dạng `DD/MM/YYYY HH:mm:ss`. |
| 25 | Cán bộ cập nhật | Text (read-only) | TRUE | FALSE | TRUE | FALSE | FALSE | Họ và tên cán bộ (`fullName`), không hiển thị UUID/email. |
| 26 | Ngày gửi phê duyệt | Text (read-only) | TRUE | FALSE | TRUE | FALSE | FALSE | Timestamp khi gửi duyệt. |
| 27 | Cán bộ gửi phê duyệt | Text (read-only) | TRUE | FALSE | TRUE | FALSE | FALSE | Họ và tên cán bộ gửi duyệt. |
| 28 | Ngày phê duyệt cấp Cảng vụ/Chi cục | Text (read-only) | TRUE | FALSE | TRUE | FALSE | FALSE | Timestamp phê duyệt Vòng 1. |
| 29 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | Text (read-only) | TRUE | FALSE | TRUE | FALSE | FALSE | Họ tên cán bộ duyệt Vòng 1. |
| 30 | Nội dung phê duyệt (C1) | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE | Ý kiến / Ghi chú phê duyệt Vòng 1. |
| 31 | Ngày phê duyệt cấp Cục | Text (read-only) | TRUE | FALSE | TRUE | FALSE | FALSE | Timestamp phê duyệt Vòng 2. |
| 32 | Cán bộ phê duyệt cấp Cục | Text (read-only) | TRUE | FALSE | TRUE | FALSE | FALSE | Họ tên cán bộ duyệt Vòng 2. |
| 33 | Nội dung phê duyệt (C2) | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE | Ý kiến / Ghi chú phê duyệt Vòng 2. |
| | **Thông tin vận hành khai thác** | | FALSE | FALSE | TRUE | FALSE | FALSE | Tích hợp liên thông module vận hành |
| 34 | Mã kế hoạch | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE | Mã kế hoạch khai thác. |
| 35 | Tên kế hoạch | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE | Tên kế hoạch khai thác. |
| 36 | Ngày bắt đầu | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE | Ngày bắt đầu khai thác. |
| 37 | Ngày kết thúc | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE | Ngày kết thúc khai thác. |
| | **Thông tin bảo trì** | | FALSE | FALSE | TRUE | FALSE | FALSE | Tích hợp liên thông module bảo trì |
| 38 | Mã kế hoạch | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE | Mã kế hoạch bảo dưỡng/bảo trì. |
| 39 | Tên kế hoạch | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE | Tên kế hoạch bảo dưỡng. |
| 40 | Thời gian bắt đầu | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE | Thời gian bắt đầu bảo trì. |
| 41 | Thời gian kết thúc | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE | Thời gian kết thúc bảo trì. |
| | **Thông tin sự cố** | | FALSE | FALSE | TRUE | FALSE | FALSE | Tích hợp liên thông module sự cố |
| 42 | Mã sự cố | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE | Mã sự cố kỹ thuật. |
| 43 | Loại sự cố | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE | Phân loại sự cố. |
| 44 | Địa điểm | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE | Địa điểm xảy ra sự cố. |
| 45 | Thời gian | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE | Thời gian phát hiện sự cố. |

---

### 2.2. Quy chuẩn phân tách Bộ lọc Sidebar (Filter Table Layout)

Sidebar bộ lọc của màn hình Quản lý Hệ thống AIS được cấu hình phân tách thành 2 tầng rõ ràng:

#### A. Bộ lọc thường (Cơ bản - Luôn hiển thị trên Sidebar):
1. **Đơn vị quản lý** (`orgUnitId`): Dropdown dạng cây `OrgUnitTreeSelect` theo DataScope phân quyền (`placeholder="Tất cả"`, `treeDefaultExpandAll={true}`).
2. **Tên thiết bị** (`name`): Ô `Input` tìm kiếm theo tên thiết bị (hỗ trợ tiếng Việt không dấu).
3. **Trạng thái** (`filterApprovalStatus`): Dropdown `Select` chọn trạng thái phê duyệt hồ sơ (`DRAFT`, `PENDING_APPROVAL`, `APPROVED_LEVEL1`, `APPROVED`, `REJECTED_LEVEL1`, `REJECTED_LEVEL2`).

#### B. Bộ lọc nâng cao (Mở rộng / Thu gọn qua nút phễu ở đáy Sidebar):
4. **Thuộc TTDH VTS / Trạm Radar** (`vtsOperationCenterId`): Dropdown `Select` chọn TTDH VTS hoặc Trạm Radar trực thuộc, tự động lọc (cascading) theo `orgUnitId` đang chọn.
5. **Mã thiết bị** (`code`): Ô `Input` tìm kiếm theo mã thiết bị AIS.
6. **Tình trạng** (`conditionStatus`): Dropdown `Select` chọn tình trạng hoạt động (`ConditionStatus`).
7. **Năm đưa vào sử dụng** (`commissioningYear`): Ô `DatePicker` chọn năm (`picker="year"`).
8. **Khoảng ngày cập nhật** (`updatedRange` -> `updatedFrom`, `updatedTo`): Ô `DatePicker.RangePicker` định dạng `DD/MM/YYYY`.
9. **Địa điểm (Tỉnh/TP)** (`provinceId`): Dropdown `Select` chọn Tỉnh/Thành phố hỗ trợ tìm kiếm tiếng Việt không dấu.

---

## 3. Trạng thái và quy trình phê duyệt 2 cấp

Áp dụng tập đóng 7 trạng thái chuẩn theo `ApprovalStatus`:
1. `DRAFT (0)`: Lưu tạm (mặc định khi tạo mới, chỉ người tạo nhìn thấy).
2. `PENDING_APPROVAL (2)`: Chờ Cảng vụ / Chi cục duyệt (Vòng 1).
3. `APPROVED_LEVEL1 (3)`: Chờ Cục duyệt (Vòng 2).
4. `APPROVED (5)`: Đã duyệt chính thức (có hiệu lực toàn hệ thống).
5. `REJECTED_LEVEL1 (8)`: Bị Cảng vụ / Chi cục trả về.
6. `REJECTED_LEVEL2 (9)`: Bị Cục trả về.
7. `ARCHIVED (7)`: Đã lưu trữ / xóa mềm.

**Nguyên tắc 4 Mắt (Anti-Self-Approval)**:
- Người tạo (`createdBy`) không được tự phê duyệt bản ghi do chính mình tạo ra ở cả 2 cấp duyệt C1 và C2.
- Khi từ chối/trả về, bắt buộc nhập Lý do từ chối (`rejectionReason`) và ghi vào `infrastructure_history`.

---

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)
- **BR-299-01 (Sinh mã tự động)**: Mã thiết bị được sinh tự động theo quy tắc `AIS-{seq}` trên Backend, không cho phép người dùng tự sửa.
- **BR-299-02 (Ràng buộc cha con)**: Thiết bị AIS bắt buộc thuộc về Trung tâm điều hành VTS hoặc Trạm Radar đã được duyệt (`APPROVED`).
- **BR-299-03 (Cascading Reset)**: Khi đổi Đơn vị quản lý `orgUnitId`, hệ thống tự động reset trường liên kết `vtsOperationCenterId` về rỗng (`undefined`).
- **BR-299-04 (Xóa mềm)**: Chỉ cho phép xóa khi bản ghi ở trạng thái `DRAFT (0)`. Bản ghi đã duyệt (`APPROVED`) tuyệt đối không cho phép xóa.
- **BR-299-05 (Sửa bản ghi đã duyệt)**: Tài khoản có quyền C2 (`aissystem:approvec2`) khi sửa bản ghi `APPROVED` sẽ lưu qua luồng "Lưu và phê duyệt", giữ nguyên trạng thái `APPROVED` (Quy tắc T12).

### 4.2. Phân quyền riêng (`<resource>:<action>`)

| Thao tác | Quyền | Mô tả |
|---|---|---|
| Xem danh sách & chi tiết | `aissystem:read` | Xem danh sách và chi tiết thiết bị AIS trong phạm vi đơn vị |
| Tạo mới | `aissystem:create` | Tạo mới hồ sơ thiết bị AIS |
| Chỉnh sửa | `aissystem:update` | Chỉnh sửa hồ sơ nháp hoặc hồ sơ bị trả về |
| Xóa mềm | `aissystem:delete` | Xóa hồ sơ nháp (`DRAFT`) |
| Phê duyệt Cấp 1 (Cảng vụ/Chi cục) | `aissystem:approvec1` | Duyệt / Trả về cấp Cảng vụ |
| Phê duyệt Cấp 2 (Cục Hàng hải) | `aissystem:approvec2` | Duyệt / Trả về cấp Cục Hàng hải |
| Xem lịch sử thay đổi | `aissystem:history` | Xem nhật ký audit trail và lịch sử phê duyệt |

**Admin Cục:** Có toàn quyền xem và thao tác trên mọi đơn vị toàn quốc, xem đầy đủ metadata người tạo, người sửa, cán bộ duyệt và thời gian chi tiết.

---

## 5. Điểm khác biệt so với mẫu chung

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — dùng tập đóng 7 trạng thái chuẩn `ApprovalStatus` |
| 2 | Có bước phê duyệt không | Có — Quy trình phê duyệt 2 cấp (Cấp 1 Cảng vụ, Cấp 2 Cục) |
| 3 | Lọc cha-con / theo đơn vị | Có — Lọc theo `orgUnitId` (DataScope), liên kết cha con với TTDH VTS / Trạm Radar |
| 4 | Trường chỉ hiện trong điều kiện nào | Tab Lịch sử & Phê duyệt chỉ hiện khi `drawerMode !== 'create'`; Bộ lọc nâng cao hiện khi mở phễu |
| 5 | Quyền riêng | `aissystem:read`, `aissystem:create`, `aissystem:update`, `aissystem:delete`, `aissystem:approvec1`, `aissystem:approvec2`, `aissystem:history` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không có — Dropdown `GET /api/v1/ais-system/options` yêu cầu `isAuthenticated()` |
| 7 | Tải lên tệp | Có — Quản lý tài liệu đính kèm qua MinIO |
| 8 | Giao diện khác mẫu chung | Bộ lọc phân tách 2 tầng (Thường: 3 trường, Nâng cao: 6 trường) |

---

## 6. Phần kỹ thuật — Danh mục API Endpoints

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/ais-system` | Tìm kiếm và phân trang thiết bị AIS (có hỗ trợ lọc thường & nâng cao) | `aissystem:read` |
| GET | `/api/v1/ais-system/{id}` | Lấy thông tin chi tiết thiết bị AIS | `aissystem:read` |
| GET | `/api/v1/ais-system/options` | Lấy danh sách chọn siêu nhẹ (chỉ bản ghi `APPROVED` + `OPERATIONAL`) | `isAuthenticated()` |
| GET | `/api/v1/ais-system/generate-code` | Sinh mã thiết bị tự động `AIS-{seq}` | `aissystem:create` |
| POST | `/api/v1/ais-system` | Tạo mới thiết bị AIS | `aissystem:create` |
| PUT | `/api/v1/ais-system/{id}` | Cập nhật thông tin thiết bị AIS | `aissystem:update` |
| DELETE | `/api/v1/ais-system/{id}` | Xóa mềm thiết bị AIS (chỉ khi `DRAFT`) | `aissystem:delete` |
| POST | `/api/v1/ais-system/{id}/submit` | Gửi duyệt hồ sơ (chuyển sang `PENDING_APPROVAL`) | `aissystem:update` |
| POST | `/api/v1/ais-system/{id}/approve-c1` | Phê duyệt Cấp 1 (chuyển sang `APPROVED_LEVEL1`) | `aissystem:approvec1` |
| POST | `/api/v1/ais-system/{id}/approve-c2` | Phê duyệt Cấp 2 (chuyển sang `APPROVED`) | `aissystem:approvec2` |
| POST | `/api/v1/ais-system/{id}/reject` | Từ chối / Trả về hồ sơ (kèm lý do) | `aissystem:approvec1` hoặc `approvec2` |
| GET | `/api/v1/ais-system/{id}/history` | Lấy lịch sử thay đổi và kiểm toán hồ sơ | `aissystem:history` |

---

## 7. Phần kỹ thuật — Cấu trúc bảng CSDL

**Bảng `ais_system` (Quản lý thực thể Hệ thống AIS):**
- `id` (UUID, PK)
- `code` (VARCHAR(50), NOT NULL, UNIQUE)
- `name` (VARCHAR(255), NOT NULL)
- `org_unit_id` (UUID, NOT NULL, FK `org_unit`)
- `vts_operation_center_id` (UUID, NULLABLE, FK `vts_operation_center` — Thuộc Trung tâm điều hành VTS)
- 🔴 `radar_station_id` (UUID, NULLABLE, FK `radar_station` — Thuộc Trạm Radar bờ)
- *Ràng buộc vị trí hạ tầng gắn kèm*: Bắt buộc phải có đúng 1 trong 2 khóa ngoại (`vts_operation_center_id` HOẶC `radar_station_id`), không được để trống cả 2 và không được chọn đồng thời cả 2.
- `operating_org_id` (UUID, NOT NULL, FK `operating_organization`)
- `province_id` (INTEGER, FK `provinces`)
- `detailed_location` (VARCHAR(500))
- `unitOfMeasure` / `unit_of_measure` (SMALLINT, NOT NULL)
- `quantity` (INTEGER, NOT NULL DEFAULT 1)
- `model` (VARCHAR(100))
- `specifications` (TEXT)
- `manufacturer` (VARCHAR(255))
- `commissioning_year` (INTEGER)
- `condition_status` (SMALLINT, NOT NULL DEFAULT 0)
- `maintenance_info` (TEXT)
- `note` (TEXT)
- `spatial_id` (UUID)
- `geometry_type` (VARCHAR(50))
- `coordinates` (TEXT)
- `symbol_id` (VARCHAR(50))
- `approval_status` (SMALLINT, NOT NULL DEFAULT 0)
- `approver_level1` (UUID, FK `users`)
- `approver_level1_name` (VARCHAR(255))
- `approved_date_level1` (TIMESTAMP)
- `approver_level2` (UUID, FK `users`)
- `approver_level2_name` (VARCHAR(255))
- `approved_date_level2` (TIMESTAMP)
- `rejection_reason` (TEXT)
- `created_by` (UUID, NOT NULL, FK `users`)
- `updated_by` (UUID, FK `users`)
- `created_at` (TIMESTAMP, NOT NULL DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP, NOT NULL DEFAULT CURRENT_TIMESTAMP)
- `deleted_at` (TIMESTAMP)
