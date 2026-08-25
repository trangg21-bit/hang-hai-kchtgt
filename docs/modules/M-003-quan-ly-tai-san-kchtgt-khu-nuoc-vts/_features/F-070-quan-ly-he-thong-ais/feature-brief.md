---
id: F-070
name: Quản lý hệ thống AIS
slug: quan-ly-he-thong-ais
module-id: M-003
status: implemented
classification: local
priority: medium
created: 2026-08-21
last-updated: 2026-08-22
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý hệ thống AIS

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)  
**Chức năng:** F-070 — Quản lý hệ thống AIS  
**Module:** M-003 — Quản lý tài sản KCHTGT Hàng hải: Khu nước & VTS  
**Loại:** chức năng có bước phê duyệt (2 cấp: C1 Cảng vụ/Chi cục, C2 Cục Hàng hải)  
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` + tài liệu URD III.4.55

---

## 1. Mô tả ngắn

Chức năng Quản lý hệ thống AIS cho phép cán bộ quản lý KCHT tại các đơn vị thực hiện quản lý danh mục thiết bị AIS bờ, trạm lặp AIS, máy phát AIS thuộc trung tâm điều hành VTS. Cung cấp các tính năng tạo mới, cập nhật, xóa mềm, tra cứu, thống kê số lượng/đơn vị tính, theo dõi tình trạng hoạt động, thông số kỹ thuật, lịch sử bảo trì và quy trình phê duyệt 2 cấp.

## 2. Trường dữ liệu

Bảng mô tả các trường trên form tạo mới/chỉnh sửa:

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Mã thiết bị (`code`) | Có | Text (50 ký tự), tự sinh hoặc nhập tay, duy nhất | Format `AIS-XXXXXX` |
| 2 | Tên thiết bị (`name`) | Có | Text (255 ký tự) | Tên thiết bị / trạm AIS |
| 3 | Thuộc TT điều hành VTS (`vtsOperationCenterId`) | Có | Select (FK -> `vts_operation_center.id`) | Thuộc TT điều hành VTS cha |
| 4 | Đơn vị khai thác (`operatingOrgId`) | Có | TreeSelect (FK -> `org_units.id`) | Đơn vị trực tiếp vận hành |
| 5 | Đơn vị quản lý (`orgUnitId`) | Có | TreeSelect (FK -> `org_units.id`) | Đơn vị quản lý theo phân cấp |
| 6 | Địa điểm Tỉnh/TP (`provinceId`) | Không | Select (FK -> `provinces.id`) | Tỉnh/Thành phố trực thuộc |
| 7 | Địa điểm chi tiết (`detailedLocation`) | Không | Text (500 ký tự) | Địa chỉ chi tiết |
| 8 | Đơn vị tính (`unitOfMeasure`) | Có | Select Enum SmallInt | 1=Bộ, 2=Cái, 3=Hệ thống, 4=Trạm |
| 9 | Số lượng (`quantity`) | Có | Number (min 1) | Số lượng thiết bị |
| 10 | Model (`model`) | Không | Text (100 ký tự) | Model thiết bị |
| 11 | Thông số kỹ thuật (`specifications`) | Không | TextArea (1000 ký tự) | Tần số, công suất phát, độ nhạy |
| 12 | Hãng sản xuất (`manufacturer`) | Không | Text (255 ký tự) | Nhà sản xuất |
| 13 | Năm đưa vào SD (`commissioningYear`) | Không | Number (1900..2100) | Năm bắt đầu khai thác |
| 14 | Tình trạng hoạt động (`conditionStatus`) | Có | Select Enum SmallInt | 0=OPERATIONAL, 1=STOPPED, 2=MAINTENANCE, 3=UNDER_CONSTRUCTION |
| 15 | Thông tin bảo trì (`maintenanceInfo`) | Không | TextArea (2000 ký tự) | Lịch sử / chu kỳ bảo trì |
| 16 | Ghi chú (`note`) | Không | TextArea (2000 ký tự) | Ghi chú bổ sung |
| 17 | Tài liệu đính kèm (`attachments`) | Không | Multi-file Upload | Bảng `infrastructure_attachments` |

## 3. Trạng thái và phê duyệt

- Quy trình phê duyệt 2 cấp kế thừa `InfrastructureApprovalService`:
  - **Lưu tạm (DRAFT / 0, 1):** Cán bộ tạo mới, chỉnh sửa hồ sơ thiết bị AIS.
  - **Chờ duyệt (PENDING_APPROVAL / PROPOSED):** Cán bộ gửi hồ sơ lên Cảng vụ / Chi cục duyệt.
  - **Duyệt C1 (APPROVED_LEVEL1):** Lãnh đạo Cảng vụ/Chi cục duyệt vòng 1, chuyển lên Cục.
  - **Đã duyệt (APPROVED):** Lãnh đạo Cục phê duyệt vòng 2.
  - **Từ chối (REJECTED_LEVEL1 / REJECTED_LEVEL2):** Bắt buộc nhập lý do từ chối.
- Áp dụng nguyên tắc **4-eyes principle** (BR-015): Người tạo hồ sơ không được tự duyệt; Người duyệt C2 không được trùng người duyệt C1.

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-070-01 | Mã thiết bị AIS là duy nhất trên toàn hệ thống | Create, Update |
| BR-070-02 | Xóa mềm đối với hệ thống AIS (`deleted_at`, `deleted_by`) | Delete |
| BR-070-03 | Tái sử dụng bảng đính kèm dùng chung `infrastructure_attachments` với `ref_type = AIS_SYSTEM` | Attachments |
| BR-070-04 | Tái sử dụng bảng lịch sử phê duyệt `approval_history` với `ref_type = AIS_SYSTEM` | History |

### 4.2. Acceptance Criteria

- **AC-070-01** — Thêm mới thành công hệ thống/thiết bị AIS với đầy đủ các trường bắt buộc.
- **AC-070-02** — Cập nhật và ghi log lịch sử biến động chi tiết từng trường thay đổi.
- **AC-070-03** — Gửi duyệt, duyệt C1, duyệt C2 và từ chối kèm lý do hoạt động chính xác theo quy trình 2 cấp.

### 4.3. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem danh sách / chi tiết | `aissystem:read` |
| Thêm mới hệ thống AIS | `aissystem:create` |
| Cập nhật / Đính kèm | `aissystem:update` |
| Xóa hệ thống AIS | `aissystem:delete` |
| Phê duyệt Cấp 1 | `aissystem:approvec1` |
| Phê duyệt Cấp 2 | `aissystem:approvec2` |
| Xem lịch sử biến động | `aissystem:history` |

**Admin Cục:** Toàn quyền thao tác trên toàn bộ phạm vi đơn vị, xem thêm metadata người tạo, người cập nhật và thời gian chi tiết.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Chuẩn `ConditionStatus` (0..3), Đơn vị tính `UnitOfMeasure` (1..4) |
| 2 | Có bước phê duyệt không | Có — Quy trình duyệt 2 cấp qua `InfrastructureApprovalService` |
| 3 | Lọc cha-con / theo đơn vị | Có — Lọc theo `orgUnitId` và `operatingOrgId` |
| 4 | Trường chỉ hiện trong điều kiện nào | Không có |
| 5 | Quyền riêng | `aissystem:read`, `create`, `update`, `delete`, `approvec1`, `approvec2`, `history` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không có |
| 7 | Tải lên tệp | Có — Sử dụng `infrastructure_attachments` với `ref_type = AIS_SYSTEM` |
| 8 | Giao diện khác mẫu chung | Sử dụng 5 component chuẩn `ScreenHeader`, `FilterBar`, `StatusTabs`, `DataTable`, `Pagination`; Form thêm mới/chỉnh sửa và xem chi tiết hiển thị dưới dạng Drawer trượt phải đồng bộ với Hệ thống VTS |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/ais-system` | Danh sách phân trang + đếm tab trạng thái | `aissystem:read` |
| GET | `/api/v1/ais-system/options` | Lấy danh sách tùy chọn gọn nhẹ | Công khai nội bộ |
| GET | `/api/v1/ais-system/{id}` | Chi tiết hệ thống AIS | `aissystem:read` |
| GET | `/api/v1/ais-system/generate-code` | Sinh mã tự động | `aissystem:create` |
| POST | `/api/v1/ais-system` | Tạo mới hệ thống AIS | `aissystem:create` |
| PUT | `/api/v1/ais-system/{id}` | Cập nhật hệ thống AIS | `aissystem:update` |
| DELETE | `/api/v1/ais-system/{id}` | Xóa mềm | `aissystem:delete` |
| POST | `/api/v1/ais-system/{id}/submit` | Gửi duyệt | `aissystem:update` |
| POST | `/api/v1/ais-system/{id}/approve-c1` | Phê duyệt cấp 1 | `aissystem:approvec1` |
| POST | `/api/v1/ais-system/{id}/approve-c2` | Phê duyệt cấp 2 | `aissystem:approvec2` |
| POST | `/api/v1/ais-system/{id}/reject` | Từ chối phê duyệt | `aissystem:approvec1` / `aissystem:approvec2` |
| GET | `/api/v1/ais-system/{id}/history` | Lấy lịch sử biến động | `aissystem:read` |
| POST | `/api/v1/ais-system/{id}/attachments` | Tải lên tệp đính kèm | `aissystem:update` |
| GET | `/api/v1/ais-system/{id}/attachments` | Danh sách tệp đính kèm | `aissystem:read` |
| DELETE | `/api/v1/ais-system/{id}/attachments/{attId}` | Xóa tệp đính kèm | `aissystem:update` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

🔴 **Bảng `public.ais_system` (Quản lý hệ thống AIS):**
- 🔴 `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- 🔴 `code` VARCHAR(50) NOT NULL UNIQUE
- 🔴 `name` VARCHAR(255) NOT NULL
- 🔴 `vts_operation_center_id` UUID NOT NULL REFERENCES vts_operation_center(id)
- 🔴 `operating_org_id` UUID NOT NULL REFERENCES org_units(id)
- 🔴 `detailed_location` VARCHAR(500)
- 🔴 `unit_of_measure` SMALLINT NOT NULL DEFAULT 1
- 🔴 `quantity` INTEGER NOT NULL DEFAULT 1
- 🔴 `model` VARCHAR(100)
- 🔴 `specifications` VARCHAR(1000)
- 🔴 `manufacturer` VARCHAR(255)
- 🔴 `commissioning_year` INTEGER
- 🔴 `condition_status` SMALLINT NOT NULL DEFAULT 0
- 🔴 `maintenance_info` VARCHAR(2000)
- 🔴 `note` VARCHAR(2000)
- 🔴 `org_unit_id` UUID REFERENCES org_units(id)
- 🔴 `province_id` INTEGER REFERENCES provinces(id)
- 🔴 `spatial_id` UUID
- 🔴 `approval_status` SMALLINT NOT NULL DEFAULT 1
- 🔴 `approver_level1` UUID
- 🔴 `approved_date_level1` TIMESTAMP
- 🔴 `approver_level2` UUID
- 🔴 `approved_date_level2` TIMESTAMP
- 🔴 `rejection_reason` VARCHAR(1000)
- 🔴 `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- 🔴 `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- 🔴 `created_by` UUID
- 🔴 `updated_by` UUID
- 🔴 `deleted_at` TIMESTAMP
- 🔴 `deleted_by` UUID
