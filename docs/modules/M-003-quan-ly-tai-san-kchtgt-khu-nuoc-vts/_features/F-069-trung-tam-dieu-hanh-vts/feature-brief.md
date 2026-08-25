---
id: F-069
name: Quản lý Trung tâm điều hành VTS
slug: trung-tam-dieu-hanh-vts
module-id: M-003
status: implemented
classification: local
priority: medium
created: 2026-08-21
last-updated: 2026-08-22
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Trung tâm điều hành VTS

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)  
**Chức năng:** F-069 — Quản lý Trung tâm điều hành VTS  
**Module:** M-003 — Quản lý tài sản KCHTGT Hàng hải: Khu nước & VTS  
**Loại:** chức năng có bước phê duyệt (2 cấp: C1 Cảng vụ/Chi cục, C2 Cục Hàng hải)  
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` + tài liệu URD III.4.51

---

## 1. Mô tả ngắn

Chức năng Quản lý Trung tâm điều hành VTS cho phép cán bộ quản lý KCHT tại các Cảng vụ Hàng hải, Chi cục và Cục Hàng hải Việt Nam thực hiện tạo mới, cập nhật, tra cứu, tải lên tài liệu đính kèm, theo dõi kết cấu hạ tầng trực thuộc, kế hoạch vận hành, bảo trì, sự cố và phê duyệt 2 cấp đối với các trung tâm điều hành VTS.

## 2. Trường dữ liệu

Bảng ma trận mô tả các trường theo đặc tả chức năng:

| # | Trường | Cột DB (`snake_case`) | Kiểu dữ liệu DB | Bắt buộc | Loại điều khiển | DS | Lọc | Chi tiết | Tạo mới | Sửa | Ghi chú |
|---|---|---|---|:---:|---|:---:|:---:|:---:|:---:|:---:|---|
| **I** | **Thông tin cơ bản** | | | | | | | | | | |
| 1 | Đơn vị quản lý | `org_unit_id` | UUID | Có | SelectOrgCode (TreeSelect) | TRUE | TRUE | TRUE | TRUE | TRUE | FK → `org_units(id)` |
| 2 | Thuộc cảng biển | `port_id` | UUID | Không | SelectKcht (CB) | TRUE | TRUE | TRUE | TRUE | TRUE | FK → `ports(id)` |
| 3 | Thuộc hệ thống VTS | `vts_system_id` | UUID | Có | SelectKcht (VTS) | TRUE | TRUE | TRUE | TRUE | TRUE | FK → `vts_system(id)` |
| 4 | Mã trung tâm điều hành VTS | `code` | VARCHAR(50) | Có | Input (disabled, tự sinh) | TRUE | TRUE | TRUE | TRUE | TRUE | Tự động sinh `TTDH-000001` |
| 5 | Tên trung tâm điều hành VTS | `name` | VARCHAR(255) | Có | Input (max 255, showCount) | TRUE | TRUE | TRUE | TRUE | TRUE | Tên trung tâm điều hành |
| 6 | Địa điểm Tỉnh/TP | `province_id` | INTEGER | Có | SelectCateOther (Select) | TRUE | TRUE | TRUE | TRUE | TRUE | FK → `provinces(id)` |
| 7 | Địa điểm chi tiết | `detailed_location` | VARCHAR(500) | Không | Input (max 500, showCount) | FALSE | FALSE | TRUE | TRUE | TRUE | Địa chỉ chi tiết |
| 8 | Tình trạng | `condition_status` | SMALLINT | Có | SelectAppParams (Select) | TRUE | TRUE | TRUE | TRUE | TRUE | 0=Hoạt động, 1=Ngừng, 2=Bảo dưỡng... |
| **II** | **Thông tin khác** | | | | | | | | | | |
| 9 | Vùng phủ sóng | `coverage` | VARCHAR(255) | Không | InputTextArea (max 255, showCount) | FALSE | FALSE | TRUE | TRUE | TRUE | Phạm vi phủ sóng giám sát |
| 10 | Ghi chú | `note` | VARCHAR(2000) | Không | InputTextArea (max 2000, showCount) | FALSE | FALSE | TRUE | TRUE | TRUE | Ghi chú bổ sung |
| **III** | **Vị trí (GIS)** | | | | | | | | | | |
| 11 | Khóa không gian GIS | `spatial_id` | UUID | Không | LongLatTable / MapPicker | FALSE | FALSE | TRUE | TRUE | TRUE | FK → `gis_spatial_objects(id)` (Lưu tập trung loại ĐT, biểu tượng, tọa độ WKT) |
| 12 | Hệ quy chiếu | — | — | Không | Read-only | FALSE | FALSE | TRUE | TRUE | TRUE | Mặc định toàn hệ thống: `WGS 84 / VN-2000` |
| 13 | Quy tắc hiển thị | — | — | Không | Read-only | FALSE | FALSE | TRUE | TRUE | TRUE | Mặc định giao diện: `Độ, phút, giây (DMS)` |
| **IV** | **File đính kèm** | | | | | | | | | | |
| 16 | File đính kèm | *bảng liên kết* | — | Không | UploadFileTable | FALSE | FALSE | TRUE | TRUE | TRUE | Bảng `infrastructure_attachments` |
| **V** | **Trạng thái & Kiểm toán** | | | | | | | | | | |
| 17 | Trạng thái phê duyệt | `approval_status` | SMALLINT | — | Badge (read-only) | TRUE | TRUE | TRUE | FALSE | FALSE | 0=DRAFT, 1=PROPOSED, 2=C1, 3=APPROVED... |
| 18 | Ngày cập nhật | `updated_at` | TIMESTAMP | — | Text (read-only) | TRUE | TRUE | TRUE | FALSE | FALSE | Thời gian sửa cuối |
| 19 | Cán bộ cập nhật | `updated_by` | UUID | — | Text (read-only) | TRUE | FALSE | TRUE | FALSE | FALSE | Người sửa cuối |
| 20 | Ngày gửi phê duyệt | `submitted_at` | TIMESTAMP | — | Text (read-only) | TRUE | FALSE | TRUE | FALSE | FALSE | Thời gian gửi duyệt |
| 21 | Cán bộ gửi phê duyệt | `submitted_by` | UUID | — | Text (read-only) | TRUE | FALSE | TRUE | FALSE | FALSE | Người gửi duyệt |
| 22 | Ngày duyệt C1 | `approved_date_level1` | TIMESTAMP | — | Text (read-only) | TRUE | FALSE | TRUE | FALSE | FALSE | Ngày duyệt C1 |
| 23 | Cán bộ duyệt C1 | `approver_level1` | UUID | — | Text (read-only) | TRUE | FALSE | TRUE | FALSE | FALSE | Người duyệt C1 |
| 24 | Nội dung duyệt C1 | `approved_comment_level1` | TEXT | — | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE | Ý kiến duyệt C1 |
| 25 | Ngày duyệt C2 | `approved_date_level2` | TIMESTAMP | — | Text (read-only) | TRUE | FALSE | TRUE | FALSE | FALSE | Ngày duyệt C2 |
| 26 | Cán bộ duyệt C2 | `approver_level2` | UUID | — | Text (read-only) | TRUE | FALSE | TRUE | FALSE | FALSE | Người duyệt C2 |
| 27 | Nội dung duyệt C2 | `approved_comment_level2` | TEXT | — | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE | Ý kiến duyệt C2 |
| **VI** | **KCHT khác thuộc TTDH** | | | | | | | |
| 28 | Tên kết cấu hạ tầng | Text (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE | Radar, AIS, trạm VHF... |
| 29 | Loại kết cấu hạ tầng | Dropdown (bộ lọc) | FALSE | FALSE | TRUE | FALSE | FALSE | Phân loại KCHT con |
| **VII** | **Thông tin vận hành khai thác** | | | | | | | |
| 30-33 | Mã KH, Tên KH, Ngày bắt đầu, Ngày kết thúc | Table (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE | Kế hoạch vận hành |
| **VIII** | **Thông tin bảo trì** | | | | | | | |
| 34-37 | Mã KH, Tên KH, Thời gian bắt đầu, kết thúc | Table (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE | Lịch sử bảo trì |
| **IX** | **Thông tin sự cố** | | | | | | | |
| 38-41 | Mã sự cố, Loại sự cố, Địa điểm, Thời gian | Table (read-only) | FALSE | FALSE | TRUE | FALSE | FALSE | Ghi nhận sự cố |

## 3. Trạng thái và phê duyệt

- Quy trình phê duyệt 2 cấp kế thừa `InfrastructureApprovalService`:
  - **Lưu tạm (DRAFT / 0, 1):** Cán bộ tạo mới, chỉnh sửa hồ sơ.
  - **Chờ duyệt (PENDING_APPROVAL / PROPOSED):** Cán bộ gửi hồ sơ lên Cảng vụ / Chi cục duyệt.
  - **Duyệt C1 (APPROVED_LEVEL1):** Lãnh đạo Cảng vụ/Chi cục duyệt vòng 1, chuyển lên Cục.
  - **Đã duyệt (APPROVED):** Lãnh đạo Cục phê duyệt vòng 2.
  - **Từ chối (REJECTED_LEVEL1 / REJECTED_LEVEL2):** Bắt buộc nhập lý do từ chối.
- Áp dụng nguyên tắc **4-eyes principle** (BR-015): Người tạo hồ sơ không được tự duyệt; Người duyệt C2 không được trùng người duyệt C1.

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-069-01 | Mã trung tâm điều hành VTS tự sinh format `TTDH-{seq}` và duy nhất trên toàn hệ thống | Create, Update |
| BR-069-02 | Xóa mềm đối với trung tâm điều hành VTS (`deleted_at`, `deleted_by`) | Delete |
| BR-069-03 | Tái sử dụng bảng đính kèm dùng chung `infrastructure_attachments` với `ref_type = VTS_OPERATION_CENTER` | Attachments |
| BR-069-04 | Tái sử dụng bảng lịch sử phê duyệt `approval_history` với `ref_type = VTS_OPERATION_CENTER` | History |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem danh sách / chi tiết | `vtsoperationcenter:read` |
| Thêm mới trung tâm | `vtsoperationcenter:create` |
| Cập nhật / Đính kèm | `vtsoperationcenter:update` |
| Xóa trung tâm | `vtsoperationcenter:delete` |
| Phê duyệt Cấp 1 | `vtsoperationcenter:approvec1` |
| Phê duyệt Cấp 2 | `vtsoperationcenter:approvec2` |
| Xem lịch sử biến động | `vtsoperationcenter:history` |

**Admin Cục:** Toàn quyền thao tác trên toàn bộ phạm vi đơn vị, xem thêm metadata người tạo, người cập nhật và thời gian chi tiết.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không có, sử dụng chuẩn `ConditionStatus` (0..3) |
| 2 | Có bước phê duyệt không | Có — Quy trình duyệt 2 cấp qua `InfrastructureApprovalService` |
| 3 | Lọc cha-con / theo đơn vị | Có — Lọc theo `orgUnitId` phân cấp dữ liệu, `vtsSystemId`, `portId` |
| 4 | Trường chỉ hiện trong điều kiện nào | Không có |
| 5 | Quyền riêng | `vtsoperationcenter:read`, `create`, `update`, `delete`, `approvec1`, `approvec2`, `history` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không có |
| 7 | Tải lên tệp | Có — Sử dụng `infrastructure_attachments` với `ref_type = VTS_OPERATION_CENTER` |
| 8 | Giao diện khác mẫu chung | Sử dụng 5 component chuẩn `ScreenHeader`, `FilterBar`, `StatusTabs`, `DataTable`, `Pagination`; Form thêm mới/chỉnh sửa và xem chi tiết hiển thị dưới dạng AppDrawer trượt phải (50% màn hình) phân chia Tab trực quan đồng bộ với Hệ thống VTS |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/vts-operation-center` | Danh sách phân trang + đếm tab trạng thái (hỗ trợ lọc `portId`, `vtsSystemId`, `orgUnitId`...) | `vtsoperationcenter:read` |
| GET | `/api/v1/vts-operation-center/options` | Lấy danh sách tùy chọn gọn nhẹ phục vụ dropdown liên kết | Công khai nội bộ |
| GET | `/api/v1/vts-operation-center/{id}` | Chi tiết trung tâm | `vtsoperationcenter:read` |
| GET | `/api/v1/vts-operation-center/generate-code` | Sinh mã tự động `TTDH-{seq}` | `vtsoperationcenter:create` |
| POST | `/api/v1/vts-operation-center` | Tạo mới trung tâm | `vtsoperationcenter:create` |
| PUT | `/api/v1/vts-operation-center/{id}` | Cập nhật trung tâm | `vtsoperationcenter:update` |
| DELETE | `/api/v1/vts-operation-center/{id}` | Xóa mềm | `vtsoperationcenter:delete` |
| POST | `/api/v1/vts-operation-center/{id}/submit` | Gửi duyệt | `vtsoperationcenter:update` |
| POST | `/api/v1/vts-operation-center/{id}/approve-c1` | Phê duyệt cấp 1 | `vtsoperationcenter:approvec1` |
| POST | `/api/v1/vts-operation-center/{id}/approve-c2` | Phê duyệt cấp 2 | `vtsoperationcenter:approvec2` |
| POST | `/api/v1/vts-operation-center/{id}/reject` | Từ chối phê duyệt | `vtsoperationcenter:approvec1` / `vtsoperationcenter:approvec2` |
| GET | `/api/v1/vts-operation-center/{id}/history` | Lấy lịch sử biến động | `vtsoperationcenter:read` |
| POST | `/api/v1/vts-operation-center/{id}/attachments` | Tải lên tệp đính kèm | `vtsoperationcenter:update` |
| GET | `/api/v1/vts-operation-center/{id}/attachments` | Danh sách tệp đính kèm | `vtsoperationcenter:read` |
| DELETE | `/api/v1/vts-operation-center/{id}/attachments/{attId}` | Xóa tệp đính kèm | `vtsoperationcenter:update` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

🔴 **Bảng `public.vts_operation_center` (Trung tâm điều hành VTS):**
- 🔴 `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- 🔴 `code` VARCHAR(50) NOT NULL UNIQUE (Format `TTDH-XXXXXX`)
- 🔴 `name` VARCHAR(255) NOT NULL (Tên trung tâm điều hành VTS)
- 🔴 `vts_system_id` UUID NOT NULL REFERENCES public.vts_system(id) (Thuộc hệ thống VTS cha)
- 🔴 `port_id` UUID REFERENCES public.ports(id) (Thuộc cảng biển)
- 🔴 `org_unit_id` UUID NOT NULL REFERENCES public.org_units(id) (Đơn vị quản lý theo phân cấp)
- 🔴 `province_id` INTEGER NOT NULL REFERENCES public.provinces(id) (Địa điểm Tỉnh/Thành phố)
- 🔴 `detailed_location` VARCHAR(500) (Địa điểm chi tiết, số nhà, đường...)
- 🔴 `coverage` VARCHAR(255) (Vùng phủ sóng)
- 🔴 `condition_status` SMALLINT NOT NULL DEFAULT 0 (0=OPERATIONAL, 1=STOPPED, 2=MAINTENANCE...)
- 🔴 `note` VARCHAR(2000) (Ghi chú bổ sung)
- 🔴 `spatial_id` UUID REFERENCES public.gis_spatial_objects(id) (Khóa ngoại không gian GIS lưu trữ tập trung tại bảng gis_spatial_objects)
- ~~`geometry_type`~~ *(Đã loại bỏ — lưu tập trung trong gis_spatial_objects)*
- ~~`coordinates`~~ *(Đã loại bỏ — lưu tập trung trong gis_spatial_objects)*
- ~~`coordinate_system`~~ *(Đã loại bỏ — hệ quy chiếu WGS-84/VN-2000 là quy chuẩn chung hệ thống, không lưu DB)*
- ~~`display_rule`~~ *(Đã loại bỏ — quy tắc hiển thị DMS là quy chuẩn frontend, không lưu DB)*
- ~~`symbol_id`~~ *(Đã loại bỏ — lưu trong gis_spatial_objects)*
- 🔴 `approval_status` SMALLINT NOT NULL DEFAULT 1 (0=DRAFT, 1=PROPOSED, 2=APPROVED_LEVEL1, 3=APPROVED, 4=REJECTED_LEVEL1, 5=REJECTED_LEVEL2)
- 🔴 `approver_level1` UUID (Cán bộ phê duyệt C1)
- 🔴 `approved_date_level1` TIMESTAMP (Ngày phê duyệt C1)
- 🔴 `approved_comment_level1` TEXT (Ý kiến phê duyệt C1)
- 🔴 `approver_level2` UUID (Cán bộ phê duyệt C2)
- 🔴 `approved_date_level2` TIMESTAMP (Ngày phê duyệt C2)
- 🔴 `approved_comment_level2` TEXT (Ý kiến phê duyệt C2)
- 🔴 `rejection_reason` VARCHAR(1000) (Lý do từ chối phê duyệt)
- 🔴 `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- 🔴 `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- 🔴 `created_by` UUID (Người tạo)
- 🔴 `updated_by` UUID (Người cập nhật cuối)
- 🔴 `deleted_at` TIMESTAMP (Thời gian xóa mềm)
- 🔴 `deleted_by` UUID (Người thực hiện xóa mềm)
