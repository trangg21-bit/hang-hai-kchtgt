---
feature-id: F-038
module-id: M-003
document: design-plan
stage: engineering-solution-designer
status: accepted
last-updated: 2026-08-25
source-of-truth:
  - _features/F-038-quan-ly-luong-hang-hai-tao-moi/feature-brief.md
  - _features/F-038-quan-ly-luong-hang-hai-tao-moi/ba/00-lean-spec.md
---

# Design Plan — F-038 Tạo mới Luồng hàng hải (M-003)

## 1. Mục đích và phạm vi

F-038 cho phép tạo mới hồ sơ Luồng hàng hải theo đúng 71 trường Excel sheet "Luồng hàng hải":
nhập #1-#46 (hồ sơ chính, tuyến luồng, phạm vi bảo vệ, bản đồ, tọa độ, file đính kèm), chỉ bắt
buộc 3 trường `orgUnitId` (#1), `channelName` (#5), `conditionStatus` (#8); tự sinh mã `channelCode`
prefix `LHH`; #47-#71 read-only do hệ thống ghi; phê duyệt 2 cấp (Cảng vụ/Chi cục → Cục); data
scope theo `orgUnitId`; RBAC `navigationchannel:*`.

Thiết kế này chốt: (a) target schema, (b) migration + backfill, (c) cơ chế phê duyệt, (d) data
scope, (e) xác nhận permission, (f) work orders BE/FE tách file. Mọi nhận định "hiện trạng" đều
được mở và dẫn nguồn `Basename.ext:line` trong phiên này.

## 2. Hiện trạng code (đã verify — anchor)

| Hạng mục | Hiện trạng | Anchor |
|---|---|---|
| Entity `NavigationChannel` | Extends `BaseApprovableEntity`; khai `@Filter(orgUnitFilter)` + `recordSecurityLevelFilter`; có sẵn 25 cột legacy | `NavigationChannel.java:20-30` |
| Bảng con tuyến luồng | `@Table(name = "chi_tiet_tuyen_luong")`, 21 cột tiếng Việt, không `@FieldNameConstants`, không extend `BaseEntity` | `ChannelRouteDetail.java:13-46` |
| Approval base | `BaseApprovableEntity` đã có `provinceId`, `orgUnitId`, `approvalStatus` (ORDINAL SMALLINT), `approverLevel1/2`, `approvedDateLevel1/2`, `rejectionReason`; **thiếu** `submittedAt/By`, `level1/2ApprovalContent` | `BaseApprovableEntity.java:44-70` |
| Enum trạng thái | `ApprovalStatus` 10 giá trị ORDINAL (DRAFT=0 … REJECTED_LEVEL2=9), label tiếng Việt | `ApprovalStatus.java:4-13` |
| Enum tình trạng | `ConditionStatus` **đã tồn tại** (OPERATIONAL/STOPPED/MAINTENANCE/UNDER_CONSTRUCTION), lưu SMALLINT ordinal | `vtssystem/entity/ConditionStatus.java:7-10` |
| Approval service | `InfrastructureApprovalService.submit/approveC1/approveC2` có sẵn Rule 14 + 4-eyes + history; chưa ghi 4 field mới | `InfrastructureApprovalService.java:53-210` |
| Controller | `@DataScope` class-level; base path `/api/v1/navigation-channel`; đã có `POST /{id}/approve/c1`, `/approve/c2`, `GET /{id}/history` (guard `navigationchannel:read`) | `NavigationChannelController.java:23-25,77-107` |
| Codegen mã | Tự sinh `"NC-" + %06d` theo `countByOrgUnitId`, không unique index | `NavigationChannelService.java:70-77` |
| Attachment | Service đã đọc attachment từ `infrastructure_attachments` theo `refType=NAVIGATION_CHANNEL` (ordinal **6**); entity lưu `ref_type` ORDINAL SMALLINT | `InfrastructureType.java:4-10`; `InfrastructureAttachment.java:14,32-34`; `NavigationChannelService.java:429-438` |
| Data scope | `@FilterDef orgUnitFilter` trên `BaseEntity`; `DataScopeAspect` bật filter + `recordSecurityLevelFilter`; `OrgUnitScopeService.Scope.allows()` có sẵn | `BaseEntity.java:31-38`; `DataScopeAspect.java:70-78,143-155`; `OrgUnitScopeService.java:74-84` |
| Permission | 9 code `navigationchannel:*` đã seed | `PermissionSeeder.java:294-310` |
| Flyway | Migrations gần đây dùng version timestamp (lớn nhất `V20260822130000`); prod `out-of-order: true`, `ddl-auto: none` | glob `db/migration/V2026*.sql`; `application.yml:152,166` |

## 3. Quyết định thiết kế (chốt) và hiệu chỉnh so với bản chốt trước

| # | Quyết định | Trạng thái | Ghi chú hiệu chỉnh |
|---|---|---|---|
| a1 | `navigation_channel`: rename-reuse legacy + drop cột ngoài Excel | **Giữ**, hiệu chỉnh danh sách drop | Code cho thấy **10** cột ngoài Excel (không phải 9): `status`, `is_approved_level1`, `is_approved_level2`, `clearance_height`, `location`, `registered_area`, `operating_hours`, `recorded_date`, `quantity`, `load_capacity` (`NavigationChannel.java:56-57,75-76,86-108`). `location` varchar(6) và `clearance_height` varchar(20) không có trong Excel 71 trường → drop theo BR-038-01 |
| a2 | `conditionStatus` + `GisGeometryType` lưu ORDINAL SMALLINT | **Giữ** | Tái sử dụng enum `ConditionStatus` có sẵn (`vtssystem/entity/ConditionStatus.java:7-10`), không tạo enum mới; `GisGeometryType` POINT/LINE/POLYGON (`GisGeometryType.java:7-9`) |
| a3 | Codegen `LHH` + unique index theo đơn vị | **Giữ** | Đổi prefix `NC-` → `LHH` giữ nguyên cơ chế `count+1` (`NavigationChannelService.java:76`); thêm unique index partial `(org_unit_id, channel_code) WHERE deleted_at IS NULL` |
| a4 | `channel_route_detail` RENAME từ `chi_tiet_tuyen_luong`, English columns + 2 field mới (`route_latest_maintenance_year`, `route_grade`) | **Giữ** | Thêm: child phải extend `BaseEntity` (audit + soft delete), bỏ `cong_cong`/`chuyen_dung`/`pham_vi_bao_ve_luong` (phạm vi bảo vệ #39 là field parent), cast String→NUMERIC cho 3 cột (`chieu_cao_tinh_khong`, `do_sau_hien_tai`, `mai_doc_thiet_ke`) |
| a5 | `navigation_channel_coordinate` MỚI | **Giữ** | Bảng con Kinh độ/Vĩ độ #45; giữ nguyên luồng GIS `GisSpatialObject`/`spatial_id` cho bản đồ (không phá luồng hiện có `NavigationChannelService.java:79-90`) |
| a6 | Attachment: tái sử dụng `infrastructure_attachments` (ref_type=6), KHÔNG tạo `navigation_channel_attachment` | **Giữ — xác nhận bằng code** | `InfrastructureType.NAVIGATION_CHANNEL` là ordinal 6 (`InfrastructureType.java:10`); service đã đọc theo refType này; chỉ thiếu chiều GHI (create/update chưa `save`) |
| b | Flyway "V122" | **HIỆU CHỈNH → `V20260825120000`** | Toàn bộ migration từ 2026-07-27 dùng version timestamp, lớn nhất `V20260822130000`. Thêm `V122` (122 < 20260822130000) chỉ chạy được nhờ `out-of-order: true` (`application.yml:152`) và phá convention; dùng `V20260825120000__navigation_channel_excel_71_fields.sql` |
| c | Approval: extend `BaseApprovableEntity` 4 field + extend `InfrastructureApprovalService` + 5 endpoint submit/approve/reject + history | **Giữ**, bổ sung chi tiết | `ApprovableEntity` interface thêm default accessor để service generic viết được 4 field mới (chỉ `BaseApprovableEntity` implement — grep xác nhận 1 nơi). Endpoint approve cấp 1/2: **giữ** `/approve/c1`, `/approve/c2` hiện có, thêm `/submit-approval`, `/reject-level-1`, `/reject-level-2`; đổi guard `/history` sang `navigationchannel:history` |
| d | Data scope: `@DataScope` + `orgUnitFilter` + write-scope `OrgUnitScopeService.Scope.allows` | **Giữ** | `@DataScope` đã có sẵn trên controller; chỉ thiếu validate chiều GHI trong service (pattern `UserGroupService.java:615-620`) |
| e | Permission: 9 code đã seed, không seed mới | **Giữ — xác nhận** | `PermissionSeeder.java:294-310` (grep 9 dòng) |
| f | Work orders BE/FE tách file | **Giữ** | Xem mục 10 |

## 4. (a) Target schema

### 4.1 `navigation_channel` — target (sau rename/add/drop)

Cột thừa kế từ `BaseApprovableEntity` + `BaseEntity` (không đổi): `id UUID PK`, `security_level SMALLINT NOT NULL`, `province_id INT FK provinces(id)`, `org_unit_id UUID` (**NOT NULL sau backfill**), `spatial_id UUID`, `approval_status SMALLINT NOT NULL`, `approver_level1 UUID`, `approved_date_level1 TIMESTAMP`, `approver_level2 UUID`, `approved_date_level2 TIMESTAMP`, `rejection_reason VARCHAR(500)`, `created_at`, `updated_at`, `deleted_at`, `deleted_by`, `created_by`, `updated_by`.

| Column (English) | JPA type | Ghi chú Excel |
|---|---|---|
| `channel_name` | `String @Column(nullable=false, length=100)` | #5 bắt buộc |
| `channel_code` | `String length=50` | #4, tự sinh `LHH`+%06d |
| `seaport_id` | `UUID` | #2 |
| `operating_unit_id` | `UUID` | #3 |
| `condition_status` | `ConditionStatus @Enumerated(ORDINAL) @Column(nullable=false, columnDefinition="SMALLINT")` | #8 bắt buộc; backfill 0 |
| `detailed_location` | `String length=500` | #7 |
| `management_station` | `String length=500` | #9 — RENAME từ `channel_management_station` |
| `station_count` | `Integer` | #10 — RENAME từ `station_amountt` |
| `station_staff_count` | `Integer` | #11 — RENAME từ `station_staff_amount` |
| `station_area_square_meters` | `BigDecimal NUMERIC(19,4)` | #12 — RENAME từ `station_area` |
| `latest_station_repair_month` | `LocalDate` (giữ DATE, FE hiển thị tháng/năm) | #13 — RENAME từ `latest_station_repair_date` |
| `latest_maintenance_year` | `Integer` | #14 — giữ nguyên |
| `latest_dredging_volume_cubic_meters` | `BigDecimal NUMERIC(19,4)` | #15 — RENAME từ `dredging_volume` |
| `buoy_count` | `Integer` | #16 — RENAME từ `buoy_amount` |
| `beacon_count` | `Integer` | #17 — RENAME từ `beacon_amount` |
| `notes` | `String length=500` | #18 — RENAME từ `note` |
| `announcement_decision_number` | `String length=100` | #19 MỚI |
| `announcement_decision_date` | `LocalDate` | #20 MỚI |
| `announcement_decision_issuer` | `String length=500` | #21 MỚI |
| `protection_scope_meters` | `BigDecimal NUMERIC(19,4)` | #39 MỚI (chuyển từ child legacy) |
| `protection_notes` | `String length=500` | #40 MỚI |
| `geometry_type` | `GisGeometryType @Enumerated(ORDINAL) columnDefinition="SMALLINT"` | #41 MỚI |
| `map_icon_id` | `UUID` | #42 MỚI |
| `coordinate_reference_system` | `String length=50` | #43 MỚI |
| `display_rule` | `String length=500` | #44 MỚI |
| `submitted_at` | `LocalDateTime` | #50 MỚI (base) |
| `submitted_by` | `UUID` | #51 MỚI (base) |
| `level1_approval_content` | `String length=2000` | #54 MỚI (base) |
| `level2_approval_content` | `String length=2000` | #57 MỚI (base) |

**DROP (10 cột ngoài Excel):** `status`, `is_approved_level1`, `is_approved_level2`, `clearance_height`,
`location`, `registered_area`, `operating_hours`, `recorded_date`, `quantity`, `load_capacity`.

**Index:**
- `ux_navigation_channel_org_code UNIQUE (org_unit_id, channel_code) WHERE deleted_at IS NULL` — MỚI (chốt a3)
- Giữ nguyên: `idx_navigation_channel_dashboard (deleted_at, status, approval_status)` → cập nhật trong cùng migration: drop index cũ chứa cột `status` (sắp drop) và tạo lại `(deleted_at, approval_status)`; `idx_navigation_channel_spatial` (V106 giữ nguyên)
- `idx_navigation_channel_org_unit (org_unit_id)` — MỚI (hỗ trợ filter #1)

### 4.2 `channel_route_detail` — RENAME từ `chi_tiet_tuyen_luong` (target)

Entity: đổi sang extend `BaseEntity`, thêm `@FieldNameConstants`, bỏ `@PrePersist` thủ công (audit do `AuditingEntityListener`).

| Column (English) | JPA type | Nguồn (cũ) |
|---|---|---|
| `id` UUID PK | `@GeneratedValue(UUID)` | giữ |
| `navigation_channel_id` UUID NOT NULL FK | `@ManyToOne(LAZY)` | giữ |
| `sequence_no` | `Integer NOT NULL` | RENAME `sequenceNo` (sửa casing) |
| `route_classification` | `String length=5` | RENAME `phan_loai` (#22) |
| `route_code` | `String length=50` | RENAME `ma` (#23, tự sinh/disabled) |
| `route_name` | `String length=500` | RENAME `ten` (#24) |
| `route_type` | `Integer` | RENAME `loai_tuyen_luong` (#25) |
| `turning_basin_location` | `String length=500` | RENAME `vi_tri_vung_quay_tau` (#26) |
| `turning_basin_radius_meters` | `BigDecimal NUMERIC(19,4)` | RENAME `ban_kinh_vung_quay_tau` (#27) |
| `vertical_clearance_meters` | `BigDecimal NUMERIC(19,4)` | RENAME `chieu_cao_tinh_khong` (#28, cast String→numeric) |
| `channel_length_kilometers` | `BigDecimal NUMERIC(19,4)` | RENAME `chieu_dai` (#29) |
| `maximum_design_width_meters` | `BigDecimal NUMERIC(19,4)` | RENAME `rong_lon_nhat` (#30) |
| `minimum_design_width_meters` | `BigDecimal NUMERIC(19,4)` | RENAME `rong_nho_nhat` (#31) |
| `design_depth_meters` | `BigDecimal NUMERIC(19,4)` | RENAME `do_sau` (#32) |
| `current_depth_meters` | `BigDecimal NUMERIC(19,4)` | RENAME `do_sau_hien_tai` (#33, cast) |
| `design_slope` | `BigDecimal NUMERIC(19,4)` | RENAME `mai_doc_thiet_ke` (#34, cast) |
| `minimum_curve_radius_meters` | `BigDecimal NUMERIC(19,4)` | RENAME `ban_kinh_cong_nho_nhat` (#35) |
| `route_latest_dredging_volume_cubic_meters` | `BigDecimal NUMERIC(19,4)` | RENAME `khoi_luong_nao_vet` (#36) |
| `route_latest_maintenance_year` | `Integer` | **MỚI** (#37) |
| `route_grade` | `Integer` | **MỚI** (#38) |
| `created_at`, `updated_at`, `deleted_at`, `deleted_by`, `created_by`, `updated_by` | từ `BaseEntity` | giữ `created_at`/`updated_at`, thêm còn lại |

**DROP:** `cong_cong`, `chuyen_dung`, `pham_vi_bao_ve_luong`.
**Index:** `idx_channel_route_detail_nc (navigation_channel_id)` — MỚI.

### 4.3 `navigation_channel_coordinate` — MỚI (#45)

| Column | JPA type |
|---|---|
| `id` | `UUID PK` |
| `navigation_channel_id` | `UUID NOT NULL FK → navigation_channel(id) ON DELETE CASCADE` |
| `sequence_no` | `Integer NOT NULL` |
| `longitude` | `BigDecimal NUMERIC(10,7)` |
| `latitude` | `BigDecimal NUMERIC(9,7)` |

Entity mới `NavigationChannelCoordinate` extends `BaseEntity`, `@FieldNameConstants`.
Index: `idx_navigation_channel_coordinate_nc (navigation_channel_id)`.

### 4.4 Attachments (#46) — KHÔNG tạo bảng mới

Tái sử dụng `infrastructure_attachments` (`InfrastructureAttachment.java:14`), `ref_type=6`
(NAVIGATION_CHANNEL, `InfrastructureType.java:10`), `ref_id = navigation_channel.id`.
Service tạo/sửa ghi attachment trong cùng transaction qua `InfrastructureAttachmentRepository.save(...)`
(dependency đã inject sẵn `NavigationChannelService.java:64`; hiện chỉ đọc chưa ghi).

## 5. (b) Migration `V20260825120000__navigation_channel_excel_71_fields.sql`

**Lý do đổi tên so với bản chốt "V122":** repo dùng version timestamp từ 2026-07-27 (lớn nhất
`V20260822130000`); `V122` < `V20260822130000` nên chỉ chạy được nhờ `out-of-order: true`
(`application.yml:152`) và lệch convention. Bắt buộc version > `V20260822130000`.

Cấu trúc (toàn bộ guarded — pattern DO-block có sẵn `V20260820020000__rename_dike_revetment_ma_cang_bien_to_english.sql`):

1. **navigation_channel — RENAME (9):** `channel_management_station→management_station`, `station_amountt→station_count`, `station_staff_amount→station_staff_count`, `station_area→station_area_square_meters`, `latest_station_repair_date→latest_station_repair_month`, `dredging_volume→latest_dredging_volume_cubic_meters`, `buoy_amount→buoy_count`, `beacon_amount→beacon_count`, `note→notes` — mỗi rename trong `IF EXISTS (information_schema.columns) THEN ALTER ... RENAME COLUMN ... END IF`.
2. **ADD COLUMN IF NOT EXISTS:** 10 field Excel mới (#19-#21, #39-#44 → `announcement_*`, `protection_*`, `geometry_type SMALLINT`, `map_icon_id UUID`, `coordinate_reference_system`, `display_rule`), `condition_status SMALLINT NOT NULL DEFAULT 0`, 4 field approval (`submitted_at TIMESTAMP`, `submitted_by UUID`, `level1_approval_content VARCHAR(2000)`, `level2_approval_content VARCHAR(2000)`).
3. **Backfill `org_unit_id` (cấm NULL):** `UPDATE navigation_channel nc SET org_unit_id = (SELECT u.org_unit_id FROM users u WHERE u.id = nc.created_by) WHERE nc.org_unit_id IS NULL;` — nếu vẫn còn NULL (không tìm được user) → gán đơn vị mặc định theo config hoặc FAIL migration (ưu tiên fail-closed theo quy ước AGENTS.md); sau đó `ALTER COLUMN org_unit_id SET NOT NULL` (guarded).
4. **Backfill `province_id` từ `location` (best-effort):** map `location` (mã legacy varchar(6)) → `provinces.id` qua bảng mapping code nếu có; dòng không map được giữ nguyên giá trị V109 đã gán (`V109__sync_kcht_province_code.sql:25-31`). KHÔNG đổi kiểu `province_id` (đã có FK `fk_navigation_channel_province`).
5. **Backfill `condition_status`:** `UPDATE ... SET condition_status = 0 WHERE condition_status IS NULL;` (0 = OPERATIONAL).
6. **Backfill `channel_code`:** dòng NULL → sinh `LHH` + %06d theo `org_unit_id` (thứ tự `created_at`).
7. **DROP COLUMN IF EXISTS (10):** `status`, `is_approved_level1`, `is_approved_level2`, `clearance_height`, `location`, `registered_area`, `operating_hours`, `recorded_date`, `quantity`, `load_capacity`.
8. **Index:** drop `idx_navigation_channel_dashboard` (chứa cột `status`) rồi tạo lại `(deleted_at, approval_status)`; tạo `ux_navigation_channel_org_code UNIQUE (org_unit_id, channel_code) WHERE deleted_at IS NULL`; tạo `idx_navigation_channel_org_unit (org_unit_id)`.
9. **channel_route_detail:** `ALTER TABLE chi_tiet_tuyen_luong RENAME TO channel_route_detail` (guarded `to_regclass`); RENAME 17 cột (danh sách mục 4.2, mỗi rename guarded); cast 3 cột String→`NUMERIC(19,4)` bằng `USING` (bỏ giá trị không số → NULL, log cảnh báo); ADD COLUMN IF NOT EXISTS `route_latest_maintenance_year INT`, `route_grade INT`, `created_by UUID`, `updated_by UUID`, `deleted_at TIMESTAMP`, `deleted_by UUID`; DROP `cong_cong`, `chuyen_dung`, `pham_vi_bao_ve_luong`; CREATE INDEX `idx_channel_route_detail_nc`.
10. **navigation_channel_coordinate:** `CREATE TABLE IF NOT EXISTS` + PK + FK cascade + index.
11. **4 cột approval cho 4 bảng còn lại extend `BaseApprovableEntity`** (`vts_system`, `dike_revetment`, `radar_station`, `ship_repair_facility` — grep `extends BaseApprovableEntity`): `ADD COLUMN IF NOT EXISTS submitted_at/submitted_by/level1_approval_content/level2_approval_content` (cùng kiểu) — bắt buộc vì base class thừa kế cột này cho mọi entity, `ddl-auto: none` nên thiếu cột → lỗi runtime khi select.

## 6. (c) Cơ chế phê duyệt

### 6.1 Mở rộng model
- `BaseApprovableEntity.java`: thêm 4 field — `submittedAt LocalDateTime (submitted_at)`, `submittedBy UUID (submitted_by)`, `level1ApprovalContent String length=2000 (level1_approval_content)`, `level2ApprovalContent String length=2000 (level2_approval_content)`.
- `ApprovableEntity.java`: thêm default accessor cho 4 field (`default void setSubmittedAt(...) {}` ...) để `InfrastructureApprovalService` (nhận `ApprovableEntity`) ghi được; an toàn vì chỉ `BaseApprovableEntity` implement (`grep implements ApprovableEntity` = 1 kết quả).
- Độ dài content: `VARCHAR(2000)` theo precedent `buoy_station` (`V20260819130000:15-16`; buoy/berth/piers dùng 1000).

### 6.2 Mở rộng `InfrastructureApprovalService.java`
- `submit(...)`: sau khi chuyển trạng thái → `setSubmittedAt(now)`, `setSubmittedBy(userId)` (kể cả khi gửi lại sau reject — refresh timestamp).
- `approveC1(...)`: nhánh approve ghi `setLevel1ApprovalContent(reason)`; nhánh reject ghi `setLevel1ApprovalContent(reason.trim())` (brief: trả về vẫn ghi #54).
- `approveC2(...)`: nhánh approve/reject ghi `setLevel2ApprovalContent(reason)` (#57).
- Giữ nguyên Rule 14 (Cục submit → thẳng `APPROVED_LEVEL1`) và 4-eyes (`InfrastructureApprovalService.java:110-116,151-166`).

### 6.3 State machine F-038
`DRAFT(0)` → `submit` → `PENDING_APPROVAL(2)` (người gửi cấp Cảng vụ/Chi cục) hoặc `APPROVED_LEVEL1(3)` (người gửi cấp Cục — Rule 14) → approve C1 → `APPROVED_LEVEL1(3)` → approve C2 → `APPROVED(5)`. Trả về: `REJECTED_LEVEL1(8)` / `REJECTED_LEVEL2(9)`, gửi lại được từ 2 trạng thái này. **Quyết định:** không dùng `PROPOSED(1)` trong luồng F-038 (brief cho phép SA chốt; dùng DRAFT cho lưu tạm như brief mục 3). Lưu ý: `BaseApprovableEntity.java:74-76` mặc định PROPOSED khi persist — service.create phải set `DRAFT` tường minh.

### 6.4 Endpoints
| Method + Path | Quyền | Trạng thái | Ghi chú |
|---|---|---|---|
| `POST /api/v1/navigation-channel` | `navigationchannel:create` | có sẵn (`NavigationChannelController.java:30-31`) | giữ; thêm body mới |
| `GET /api/v1/navigation-channel` | `navigationchannel:read` | có sẵn | mở rộng filter |
| `GET /api/v1/navigation-channel/{id}` | `navigationchannel:read` + `read:restricted/read:confidential` theo security level | có sẵn | giữ |
| `PUT /api/v1/navigation-channel/{id}` | `navigationchannel:update` | có sẵn | giữ; thêm body mới |
| `DELETE /api/v1/navigation-channel/{id}` | `navigationchannel:delete` | có sẵn | giữ |
| `POST /{id}/submit-approval` | `navigationchannel:update` | **MỚI** | gọi `service.submit(id, userId)` |
| `POST /{id}/approve/c1` | `navigationchannel:approvec1` | có sẵn (`:77-86`) | **giữ** (tương đương approve-level-1 của brief) |
| `POST /{id}/approve/c2` | `navigationchannel:approvec2` | có sẵn | **giữ** (tương đương approve-level-2) |
| `POST /{id}/reject-level-1` | `navigationchannel:approvec1` | **MỚI** | gọi `service.reject(id, req, userId)` với `approvalLevel=LEVEL_1` (method đã có `NavigationChannelService.java:281-292`, chưa expose) |
| `POST /{id}/reject-level-2` | `navigationchannel:approvec2` | **MỚI** | `approvalLevel=LEVEL_2` |
| `GET /{id}/history` | **đổi** `navigationchannel:read` → `navigationchannel:history` | sửa | `NavigationChannelController.java:104-107` |

History tiếp tục dùng `ApprovalHistory` + `InfrastructureType.NAVIGATION_CHANNEL` (`NavigationChannelService.java:319-334`), không tạo bảng mới.

## 7. (d) Data scope

- **Đọc:** giữ nguyên — `@DataScope` class-level (`NavigationChannelController.java:25`) kích hoạt `DataScopeAspect` (`DataScopeAspect.java:70-78`) → bật `orgUnitFilter` (`BaseEntity.java:31-34`; entity đã khai `@Filter` `NavigationChannel.java:22`) + `recordSecurityLevelFilter`.
- **Ghi:** thêm vào `service.create` và `service.update` trước khi persist:
  `if (!orgUnitScopeService.currentUserScope().allows(req.getOrgUnitId())) throw new AccessDeniedException("Đơn vị quản lý nằm ngoài phạm vi được phân quyền");`
  — pattern `OrgUnitScopeService.Scope.allows` (`OrgUnitScopeService.java:81-84`) và `UserGroupService.requireOrganizationInScope` (`UserGroupService.java:615-620`). `orgUnitId` bắt buộc (validation DTO) + backfill + NOT NULL → không bao giờ NULL.
- **Tên đơn vị:** response trả `orgUnitName` qua `OrgUnitCacheService.getName(...)` — đã có (`NavigationChannelService.java:553-555`), giữ nguyên.

## 8. (e) Permission — xác nhận

9 code `navigationchannel:*` đã seed tại `PermissionSeeder.java:294-310` (grep chính xác 9 dòng):
`read`, `read:restricted`, `read:confidential`, `create`, `update`, `delete`, `approvec1`,
`approvec2`, `history`. **Không cần seed mới.** Chỉ đổi guard của `/history` (mục 6.4).
Ma trận vai trò theo brief mục 4.4 (Chuyên viên/Lãnh đạo Cảng vụ/Lãnh đạo Cục/Admin Cục/Quản trị hệ thống) — không có thay đổi.

## 9. Mapping acceptance criteria

| AC | Thiết kế đáp ứng | Oracle kiểm chứng |
|---|---|---|
| AC-038-01 | DTO create 46 field nhập, #47-#71 không có trong DTO | TS-038-01: response/DOM form đủ #1-#46, không có input #47-#71 |
| AC-038-02 | `@NotNull` `orgUnitId`/`channelName`/`conditionStatus` + message tiếng Việt | TS-038-02: HTTP 400 + message tiếng Việt, không tạo bản ghi |
| AC-038-03 | codegen `LHH`, DTO không nhận field read-only, audit từ session | TS-038-03: `channelCode` prefix `LHH` |
| AC-038-04 | route details lưu cùng transaction (cascade ALL + orphanRemoval) | TS-038-04: lỗi 1 dòng → rollback toàn bộ |
| AC-038-05 | `navigation_channel_coordinate` + attachments cùng transaction | TS-038-05: longitude/latitude + file có trong DB |
| AC-038-06/07 | `InfrastructureApprovalService` ghi #52-#57 từ session | TS-038-07/08: field từ workflow, không từ payload |
| AC-038-08 | DTO create/update loại trừ #58-#71; response trả null có kiểm soát | TS-038-09: payload có #58-#71 bị bỏ qua/400 |
| AC-038-09 | write-scope `Scope.allows` + `orgUnitFilter` đọc | TS-038-06: 403 + không phát sinh bản ghi |
| AC-038-10 | `@PreAuthorize("navigationchannel:<action>")` toàn bộ endpoint | TS-038-10: 403 khi thiếu permission |

## 10. (f) Work orders — tách file BE/FE (disjoint)

### Backend
| WO | File (đường dẫn tương đối) | Nội dung | Oracle |
|---|---|---|---|
| WO-BE-1 | `src/main/resources/db/migration/V20260825120000__navigation_channel_excel_71_fields.sql` | Mục 5 toàn bộ | Flyway migrate thành công trên PG; `org_unit_id`/`condition_status` không NULL; unique index tồn tại |
| WO-BE-2 | `common/entity/BaseApprovableEntity.java`, `common/entity/ApprovableEntity.java` | 4 field + default accessor | `mvn -DskipTests compile`; entity map đủ cột |
| WO-BE-3 | `common/service/InfrastructureApprovalService.java` | submit ghi submitted*, approve/reject ghi level*ApprovalContent | Test service: submit → submittedAt/By set; reject C1 → level1ApprovalContent set |
| WO-BE-4 | `navigationchannel/entity/NavigationChannel.java` | Rename/retype/drop/add theo 4.1; `conditionStatus` dùng enum có sẵn; thêm `List<NavigationChannelCoordinate>` | Compile + mapping check |
| WO-BE-5 | `navigationchannel/entity/ChannelRouteDetail.java` | extend `BaseEntity`, rename field, 2 field mới, `@FieldNameConstants` | Compile |
| WO-BE-6 | `navigationchannel/entity/NavigationChannelCoordinate.java` (MỚI), `navigationchannel/repository/NavigationChannelCoordinateRepository.java` (MỚI) | Bảng 4.3 | Compile |
| WO-BE-7 | `navigationchannel/dto/NavigationChannelCreateRequest.java`, `UpdateRequest.java`, `Response.java`, `ChannelRouteDetailResponse.java`, + `NavigationChannelCoordinateRequest/Response.java` (MỚI) | DTO 46 field nhập; loại trừ #47-#71; `@NotNull` 3 field; `@FieldNameConstants`; response bổ sung `conditionStatus`, `submitted*`, `level*ApprovalContent`, `routeLatestMaintenanceYear`, `routeGrade`, `coordinates`, `orgUnitName` | Compile + validation test |
| WO-BE-8 | `navigationchannel/service/NavigationChannelService.java` | codegen `LHH`, write-scope, lưu route details/coordinates/attachments cùng transaction, trim chuỗi, create set DRAFT, `submit(id, userId)` mới | TS-038-02..09 chạy được |
| WO-BE-9 | `navigationchannel/controller/NavigationChannelController.java` | thêm 3 endpoint mới; đổi guard history | Test 403/200 từng endpoint |
| WO-BE-10 | `navigationchannel/repository/NavigationChannelRepository.java` | mở rộng `searchDocuments` thêm `seaportId`, `provinceId`, `conditionStatus` | Test filter DS/Lọc |

Thứ tự thực thi BE: WO-BE-1 → WO-BE-2 → WO-BE-3 → WO-BE-4/5/6 → WO-BE-7 → WO-BE-8 → WO-BE-9/10 (WO-BE-4..6 độc lập nhau sau WO-BE-1).

### Frontend (chưa tồn tại file — tạo mới; tuân thủ `frontend/src/theme.ts`, `frontend/src/tokens.ts` preset, `components/list-view/*`, `components/shared/ApprovalModal|ApprovalActionBar|ApprovalStatusBadge`, mẫu chuẩn `pages/UsersPage.tsx`)
| WO | File (tạo mới) | Nội dung | Oracle |
|---|---|---|---|
| WO-FE-1 | `frontend/src/pages/NavigationChannelPage.tsx` | Danh sách: ScreenHeader + FilterBar (lọc #1/#2/#4/#5/#6/#8/#47/#48; orgUnit dùng TreeSelect giữ `orgUnitId`) + StatusTabs + DataTable + Pagination | TS-038-01 (UI) |
| WO-FE-2 | `frontend/src/pages/NavigationChannelPage.tsx` (modal Create/Edit) | Form #1-#46 đúng control Excel; bắt buộc 3 field; `channelCode`/`routeCode` disabled; bảng con tuyến luồng #22-#38; tọa độ #45; UploadFileTable #46; trim trước khi gửi; label tiếng Việt có dấu | TS-038-02/03 (UI) |
| WO-FE-3 | `frontend/src/pages/NavigationChannelDetailPage.tsx` (MỚI) | Chi tiết 71 trường; #47-#71 read-only (Badge `ApprovalStatusBadge`); khối #58-#71 rỗng có kiểm soát, không placeholder; metadata nhạy cảm theo quyền | TS-038-08/09 (UI) |
| WO-FE-4 | `frontend/src/services/navigationchannel/navigationChannelApi.ts` (MỚI) + route/menu trong `frontend/src/App.tsx` | API client: create/update/list/detail/history/submit-approval/approve-c1/approve-c2/reject-level-1/reject-level-2; nút hành động theo permission; dialog reject bắt buộc lý do | TS-038-07/10 (UI) |

## 11. Trade-off đã cân nhắc

1. **Migration version V20260825120000 thay vì V122** — đúng convention repo; V122 chỉ chạy nhờ `out-of-order: true` (`application.yml:152`) — tránh phụ thuộc cấu hình.
2. **Giữ `/approve/c1`, `/approve/c2` + thêm endpoint mới** thay vì rename theo tên brief — không phá consumer hiện có; tên brief là đề xuất BA, SA chốt ánh xạ ở mục 6.4.
3. **Tái sử dụng `ConditionStatus` (vtssystem)** thay vì tạo enum riêng — tránh trùng lặp; 4 giá trị đủ cho #8; nếu sau này cần giá trị khác, mở rộng enum chung.
4. **Giữ luồng `GisSpatialObject`/`spatial_id` + thêm `navigation_channel_coordinate`** — bảng con đáp ứng grid Excel #45, GIS phục vụ hiển thị bản đồ KCHT (không phá luồng đồng bộ bản đồ hiện có).
5. **`latest_station_repair_month` giữ kiểu DATE** (rename) — ít churn; FE hiển thị tháng/năm; nếu cần chuẩn hoá YYYYMM thì đổi sang INT trong cùng migration (mở, ghi chú cho implementer).

## 12. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| DB `approved_date_level1/2` đang là DATE (`V20260804111500:33-37`) trong khi entity là `LocalDateTime` | Thấp | KHÔNG đụng trong F-038; cột mới `submitted_at`/`level*_approved_at` dùng TIMESTAMP |
| Extend base 4 field ảnh hưởng 4 bảng khác | Trung bình | WO-BE-1 bước 11 add cột cho cả 5 bảng; `ddl-auto: none` nên thiếu cột = lỗi runtime, test tích hợp bắt kịp |
| Codegen `count+1` không atomic → trùng `channel_code` | Thấp | Unique index `ux_navigation_channel_org_code` chặn; service bắt `DataIntegrityViolationException` retry 1 lần với count mới |
| Cast String→NUMERIC mất dữ liệu không parse được (`chieu_cao_tinh_khong`…) | Thấp | Cast `USING`, giá trị không hợp lệ → NULL + log; số lượng nhỏ (legacy) |
| FE chưa có file navigation-channel nào | Thấp | Work order tạo mới, theo mẫu chuẩn `UsersPage.tsx` + list-view convention |

## 13. Ràng buộc bắt buộc (nhắc lại cho implementer)

- Tên bảng/cột/field/API: **English chuẩn**; message/label UI: **tiếng Việt có dấu**.
- Mọi Entity/DTO cập nhật: `@FieldNameConstants`; không hardcode tên field/enum string — dùng `EntityFields`, `ApprovalStatus.X.name()`, `ConditionStatus.OPERATIONAL`…
- Enum xuống DB: `@Enumerated(EnumType.ORDINAL)` + `SMALLINT` (không VARCHAR).
- `orgUnitName` từ `OrgUnitCacheService`; sau mọi thay đổi đơn vị gọi `evictAfterCommit()` (không nằm trong F-038, chỉ nhắc).
- `ApprovalStatus` 10 giá trị — không thêm giá trị mới trong F-038.
- Input text: trim trước khi gửi API và trước khi lưu.
- Không chạy backend; xác nhận bằng `mvn -DskipTests compile` (+ test theo WO oracle).
