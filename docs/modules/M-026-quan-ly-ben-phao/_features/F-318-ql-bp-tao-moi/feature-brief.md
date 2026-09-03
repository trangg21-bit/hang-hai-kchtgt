---
id: F-318
name: "Quản lý Bến phao - Tạo mới"
slug: ql-bp-tao-moi
module-id: M-026
status: proposed
classification: local
priority: medium
created: "2026-08-28"
last-updated: "2026-08-28"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Bến phao - Tạo mới

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-318
**Module:** M-026 — Quản lý Bến phao
**Loại:** chức năng thường (không có bước phê duyệt) — việc gửi duyệt sau khi tạo thực hiện qua nút "Lưu và gửi phê duyệt", quy trình phê duyệt thuộc F-321
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (TKCT): CSV "QL bến phao" + Excel sheet "QL bến phao"

> **Trước khi viết:** đọc tài liệu nền của module (`ba/00-lean-spec.md`) để biết phần CHUNG (ma trận 57 trường, mã tự sinh, DataScope, phân quyền). File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):** khai báo đầy đủ ở mục 5, dòng 3 và mục 4.1 (BR-318-05/06): trường `orgUnitId` bắt buộc, nguồn gán = tự động từ `port.orgUnitId`, chiều ghi validate phạm vi qua `@DataScope` — SA chốt khi duyệt.

---

## 1. Mô tả ngắn

Cán bộ Cảng vụ/Chi cục tạo mới hồ sơ bến phao từ màn hình Danh sách (route `/buoy-berth`) bằng drawer "Thêm mới hồ sơ". Hồ sơ có thể lưu tạm (DRAFT) hoặc lưu và gửi phê duyệt ngay (chờ Cảng vụ/Chi cục duyệt). Mã bến phao tự sinh theo mẫu `{mã cảng biển}-BP-{seq}` và không sửa được. Người dùng nhập 26 trường thông tin chung/kỹ thuật/công bố/phạm vi khu nước + tab Vị trí (GIS) + tab File đính kèm. Dữ liệu tạo phải thuộc đơn vị quản lý của cảng biển cha.

## 2. Trường dữ liệu

Thứ tự form theo **Excel sheet "QL bến phao"** (source of truth). Ma trận đầy đủ 57 trường tại `ba/00-lean-spec.md` mục 4; bảng dưới chỉ liệt kê trường Create=TRUE:

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Mã bến phao | Có (tự sinh) | Input disabled, tự sinh `{portCode}-BP-{seq:03d}` | BR-318-02; bất biến sau tạo |
| 2 | Tên bến phao | Có | TextArea, max 255 | BR-318-03 |
| 3 | Đơn vị quản lý | Có | OrgUnitTreeSelect | Tự gán từ `port.orgUnitId` khi lưu (BR-318-05) |
| 4 | Thuộc cảng biển | Có | Select (chỉ bản ghi APPROVED) | Bắt buộc khi tạo; cascading theo đơn vị quản lý |
| 5 | Thuộc luồng hàng hải | Không | Select KCHT (LHH) | |
| 6 | Địa điểm (Tỉnh/TP) | Có | Select Tỉnh/TP (tìm không dấu) | |
| 7 | Địa điểm chi tiết | Không | TextArea, max 500 | |
| 8 | Phân cấp công trình | Không | Select Cấp đặc biệt/1/2/3/4 | VARCHAR(100), không enum |
| 9 | Tình trạng | Có | Select Đang/Chưa/Dừng khai thác | Mặc định "Chưa khai thác/vận hành" |
| 10 | Đơn vị khai thác | Có | Select `/common/options/operating-units` | |
| 11–21 | Kỹ thuật & đăng kiểm (độ sâu, cao độ, DWT×2, đăng kiểm×2, thời hạn, năng lực, số lượng×3) | Không | InputNumber ≥ 0 / DatePicker | Nhãn theo Excel |
| 22 | Sản lượng hàng thông qua | **Có** | InputDecimal ≥ 0 | Chốt BA (a) — lệch CSV |
| 23–25 | Công bố mở, đưa vào sử dụng (thời điểm, quyết định, văn bản thỏa thuận) | Không | DatePicker / TextArea | |
| 26 | Phạm vi khu nước neo buộc tàu | Không | TextArea, FE max 2000 | drift c.1 |
| 27–31 | Vị trí (GIS): loại đối tượng, biểu tượng, hệ quy chiếu, quy tắc hiển thị, tọa độ | Không | Select/Text/LocationInformationForm | POLYGON_BUOY_BERTH |
| 32 | File đính kèm | Không | Upload, ≤ 10MB | Tải sau khi tạo xong (có id) |

## 3. Trạng thái và phê duyệt

- Trạng thái lưu dạng số (`ApprovalStatus` ORDINAL), theo tài liệu nền mục 3.7 (7 trạng thái chuẩn).
- **Không có bước phê duyệt** trong phạm vi chức năng Tạo mới: hồ sơ mới mặc định `DRAFT` (0). Nếu người dùng bấm "Lưu và gửi phê duyệt" (`saveAction=SUBMIT`) → hồ sơ chuyển `APPROVED_LEVEL1` (chờ Cảng vụ/Chi cục duyệt), ghi `submittedForApprovalAt/By`. Quy trình duyệt C1→C2 đầy đủ thuộc F-321.
- Trước khi tạo phải thỏa: cảng biển cha `APPROVED` (BR-318-04), tên/tỉnh/tình trạng/sản lượng/đơn vị khai thác hợp lệ.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-318-01 | Tạo mới chỉ thực hiện từ màn danh sách `/buoy-berth` qua drawer "Thêm mới hồ sơ"; không có route riêng | Create |
| BR-318-02 | Mã tự sinh `{portCode}-BP-{seq:03d}`: gọi `GET /api/v1/buoy-berth/generate-code?portId=…`; seq = max hiện có (chưa xóa) + 1; mã disabled và bất biến | Create |
| BR-318-03 | `buoyBerthName`, `portId`, `provinceId`, `operationalStatus`, `cargoThroughput` bắt buộc (code `@NotNull`/`@NotBlank`) | Create |
| BR-318-04 | Chỉ tạo được khi cảng biển cha `approvalStatus = APPROVED`, ngược lại báo lỗi "cảng biển cha phải ở trạng thái được phê duyệt" | Create |
| BR-318-05 | `orgUnitId` bắt buộc khi lưu nhưng KHÔNG lấy từ request: service gán tự động từ `port.orgUnitId`; cột không được NULL | Create |
| BR-318-06 | Chiều ghi validate phạm vi: gán bến phao vào cảng ngoài phạm vi đơn vị user bị từ chối (DataScope) | Create |
| BR-318-07 | Giá trị số ≥ 0 (`@DecimalMin("0")`); count ≥ 0; `lastInspectionDate` gửi `YYYY-MM` chuyển thành `YYYY-MM-DD` trước khi gửi API | Create |
| BR-318-08 | GIS: lưu vào `gis_spatial_objects` qua `GisSpatialObjectService` (type POLYGON_BUOY_BERTH(37), tên `BUOY_BERTH_{code}`); không tọa độ thì bỏ qua | Create |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-318-01 — Tạo Lưu tạm:** Người dùng có `buoyberth:create` mở drawer, điền đủ trường bắt buộc, bấm "Lưu tạm" → API trả thành công, hồ sơ `DRAFT`, chỉ người nhập thấy trong danh sách. Khi lỗi validation: hiển thị lỗi tiếng Việt có dấu ngay trên form, không gửi API.
- **AC-318-02 — Tạo và gửi duyệt:** Bấm "Lưu và gửi phê duyệt" → hồ sơ `APPROVED_LEVEL1`, có `submittedForApprovalAt`; tab Lịch sử không hiển thị khi đang tạo (`drawerMode === 'create'`).
- **AC-318-03 — Mã tự sinh duy nhất:** Sau khi lưu, mã = `{portCode}-BP-{seq+1}`; tạo tiếp → seq tăng dần, không trùng, không nhảy cóc khi có bản ghi bị xóa.

### 4.3. User Stories kế thừa (nếu có)

- **US-318-01:** Là cán bộ Cảng vụ, tôi muốn tạo hồ sơ bến phao đúng mẫu KCHT chung để hệ thống quản lý thống nhất 28 loại hạ tầng.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Mở drawer tạo mới, sinh mã | `buoyberth:create` |
| Tạo hồ sơ (Lưu tạm / Lưu và gửi duyệt) | `buoyberth:create` |
| Tải file đính kèm sau tạo | `buoyberth:update` |

**Admin Cục:** full quyền `buoyberth:*` + xem thêm metadata (người tạo, người sửa cuối, thời gian tạo/cập nhật) — theo tài liệu nền mục 3.7/3.8, không có quyền riêng ngoài seed. **10 quyền `buoyberth:*` ĐÃ SEED trong `PermissionSeeder.java` — không seed lại.**

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không có — dùng 7 trạng thái chuẩn KCHT (DRAFT là mặc định khi tạo) |
| 2 | Có bước phê duyệt không | Không trong phạm vi Tạo mới; nút "Lưu và gửi phê duyệt" chuyển `APPROVED_LEVEL1` (quy trình đầy đủ ở F-321) |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — `orgUnitId` bắt buộc, tự gán từ `port.orgUnitId`, chiều ghi validate DataScope; không ngoại lệ |
| 4 | Trường chỉ hiện trong điều kiện nào | Không có — toàn bộ trường Create=TRUE hiển thị theo Excel (Mã #1, Tên #2 đứng đầu) |
| 5 | Quyền riêng | `buoyberth:create` (đã seed, không re-seed) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — File đính kèm ≤ 10MB (PDF/DOCX/XLSX/PNG/JPG/CAD), upload sau khi tạo xong |
| 8 | Giao diện khác mẫu chung | Không — theo `list-screen-ui-standard.md` + `form-and-list-patterns.md` (drawer AppDrawer, pill radius, token từ theme.ts/tokens.ts) |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/v1/buoy-berth` | Tạo mới hồ sơ (body `CreateBuoyBerthRequest`, `saveAction=DRAFT\|SUBMIT`) | `buoyberth:create` |
| GET | `/api/v1/buoy-berth/generate-code?portId={portId}` | Sinh mã tự động `{portCode}-BP-{seq:03d}` | `buoyberth:create` |
| GET | `/api/common/options/operating-units` | Danh sách đơn vị khai thác (bảng `operating_units`) | xem chung |
| POST | `/api/v1/buoy-berth/{id}/attachments` | Upload file đính kèm (multipart) | `buoyberth:update` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ. *(Đã có migration `V20260829040000__create_buoy_berths.sql` — bảng này là hiện trạng, không đề xuất thay đổi.)*

**Bảng `buoy_berths` (hồ sơ bến phao):** `id` (UUID PK), `buoy_berth_code` VARCHAR(50) UNIQUE (tự sinh `{portCode}-BP-{seq}`), `buoy_berth_name` VARCHAR(255) NOT NULL, `port_id` UUID NOT NULL, `org_unit_id` UUID (tự gán từ port), `waterway_id` UUID, `classification` VARCHAR(100), `province_id` INTEGER, `detailed_location` VARCHAR(500), `operational_status` SMALLINT, `approval_status` SMALLINT NOT NULL DEFAULT 0, `operating_org_id` UUID, `current_water_depth`/`bottom_elevation_design` NUMERIC(10,2), `max_vessel_dwt`/`planned_vessel_dwt`/`design_capacity`/`cargo_throughput` NUMERIC(15,2), `last_inspection_date`/`next_inspection_date`/`operation_expiry_date` DATE, `active_buoy_berth_count`/`published_buoy_berth_count`/`under_investment_buoy_berth_count` INTEGER, `opening_announcement_date` TIMESTAMP, `public_decision` VARCHAR(500), `investment_agreement` TEXT, `mooring_water_area_scope` VARCHAR(1000), `map_symbol_id`/`spatial_id` UUID, `coordinate_system`/`display_rule` INTEGER, `submitted_for_approval_at/by`, `port_authority_approved_at/by`, `port_authority_approval_content` VARCHAR(1000), `department_approved_at/by`, `department_approval_content` VARCHAR(1000), `rejection_reason` VARCHAR(500), + audit cột `BaseEntity` (`created_at/updated_at/created_by/updated_by/deleted_at/deleted_by/security_level`). Index: `idx_buoy_berths_code`, `idx_buoy_berths_port_id`, `idx_buoy_berths_org_unit`, `idx_buoy_berths_waterway_id`, `idx_buoy_berths_approval_status`, `idx_buoy_berths_operational_status`, `idx_buoy_berths_deleted_at`.
