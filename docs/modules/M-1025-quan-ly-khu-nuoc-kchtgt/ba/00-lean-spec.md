---
document: lean-spec
module-id: M-1025
module-name: Quản lý khu nước KCHTGT
scope: module-anchor
version: 1.0
last-updated: 2026-08-28
---

# Lean Spec — Module M-1025: Quản lý khu nước KCHTGT

> **Loại module:** doc-parity (tài liệu đặc tả BA khớp code đã ship). Module M-1025 gồm 3 thực thể "khu nước" con của Cảng biển (Port): **Khu chuyển tải (TransferArea)**, **Khu tránh trú bão (StormShelterArea)**, **Khu neo đậu (Anchorage)**. Tất cả CRUD + phê duyệt + lịch sử đã được code và commit; tài liệu này là nguồn đặc tả nghiệp vụ cho 18 feature F-300..F-317.

## 1. Mô hình miền (Domain Model)

Mỗi sub-domain gồm 1 entity cha + 2 bảng con (khu nước neo buộc + điểm neo). Cả 3 entity cha kế thừa `BaseEntity` (UUID PK, soft-delete, JPA auditing) và khai `@FieldNameConstants`.

| # | Sub-domain | Entity (bảng) | Mã tự sinh | Bảng con (phạm vi neo buộc) | Bảng con (điểm neo) |
|---|---|---|---|---|---|
| 1 | Khu chuyển tải | `TransferArea` (`transfer_areas`) | `{portCode}-CT-{seq}` | `TransferAreaMooringWaterArea` (`transfer_area_mooring_water_areas`, FK `transfer_area_id`) | `TransferAreaMooringWaterAreaAnchorPoint` (`transfer_area_mooring_water_area_anchor_points`, FK `transfer_area_mooring_water_area_id`) |
| 2 | Khu tránh trú bão | `StormShelterArea` (`storm_shelter_areas`) | `{portCode}-TTB-{seq}` | `StormShelterMooringWaterArea` (`storm_shelter_mooring_water_areas`, FK `storm_shelter_area_id`) | `StormShelterMooringWaterAreaAnchorPoint` (`storm_shelter_mooring_water_area_anchor_points`, FK `storm_shelter_mooring_water_area_id`) |
| 3 | Khu neo đậu | `Anchorage` (`anchorages`) | `{portCode}-ND-{seq}` | `MooringWaterArea` (`mooring_water_areas`, FK `anchorage_id`) | `MooringWaterAreaAnchorPoint` (`mooring_water_area_anchor_points`, FK `mooring_water_area_id`) |

> **Chú ý đặt tên:** sub-domain Khu neo đậu dùng tên entity con **KHÔNG tiền tố** `MooringWaterArea` / `MooringWaterAreaAnchorPoint` (đã xác nhận bằng cách đọc file `src/main/java/com/hanghai/kchtg/port/entity/MooringWaterArea.java` và `MooringWaterAreaAnchorPoint.java`), trong khi hai sub-domain kia dùng tên có tiền tố.

### 1.1. Cấu trúc entity cha (chung 3 loại)

Các trường cốt lõi (tên cột DB — đã đối chiếu với `@Column` trong entity):

| Nhóm | Trường (entity → cột DB) | Ghi chú |
|---|---|---|
| Định danh | `transferAreaCode`/`stormShelterCode`/`anchorageCode` → `*_code` | unique, server sinh, client KHÔNG sửa |
| Định danh | `transferAreaName`/`stormShelterName`/`anchorageName` → `*_name` | bắt buộc |
| Liên kết | `portId` → `port_id` | FK NOT NULL → `ports.id` (Thuộc cảng biển) |
| Phạm vi | `orgUnitId` → `org_unit_id` | đơn vị quản lý (data scope) |
| Liên kết | `navigationChannelId` → `navigation_channel_id` | Thuộc luồng hàng hải (chỉ StormShelter + Anchorage) |
| Liên kết | `buoyStationId` → `buoy_station_id` | Thuộc bến phao — **DRIFT: ngữ nghĩa là BuoyBerth (M-002), không phải BuoyStation** (chỉ StormShelter + Anchorage) |
| Phân loại | `classification` → `classification` | chỉ StormShelterArea |
| Địa lý | `provinceId` → `province_id` (Integer), `detailedLocation` → `detailed_location` | |
| Nghiệp vụ | `operationalFunctions` → `operational_functions` | Công năng khai thác — chỉ TransferArea |
| Trạng thái | `operationalStatus` (`@Convert OperationalStatusConverter`), `approvalStatus` (`@Enumerated ORDINAL`) | lưu INT |
| Bảo mật | `securityLevel` (`@Enumerated ORDINAL`, SMALLINT, mặc định NORMAL) | filter `recordSecurityLevelFilter` |
| Kỹ thuật | `shapeDescription`, `area`, `designWaterDepth`, `currentWaterDepth`, `bottomElevationDesign`, `maxVesselDWT`, `active*Count`, `published*Count`, `underInvestment*Count`, `remarks` | |
| GIS | `mapSymbolId`, `coordinateSystem` (Integer), `displayRule` (Integer), `spatialId` | GIS tab (TAB 2) |
| Công bố | `openingAnnouncementDate`, `publicDecision`, `investmentAgreement` | |
| Thời gian HĐ | `activityStartDate`, `activityEndDate` | **chỉ TransferArea** (Anchorage có `activityStatus` String thay thế; StormShelter không có) |
| Phê duyệt | `submittedForApprovalAt/By`, `portAuthorityApprovedAt/By/Content` (C1), `departmentApprovedAt/By/Content` (C2), `rejectionReason` | tracking 2 cấp |

### 1.2. Bảng con Khu nước neo buộc (MooringWaterArea — 3 biến thể)

Mỗi bảng con có cấu trúc giống nhau, chỉ khác tên FK:

| Trường | Cột DB | Ghi chú |
|---|---|---|
| FK cha | `transfer_area_id` / `storm_shelter_area_id` / `anchorage_id` | NOT NULL |
| `description` | `description` | Phạm vi khu nước neo buộc tàu (1000) |
| `geometryType` | `geometry_type` | Điểm ('1') / Đường ('2') / Vùng ('3') — length 20 |
| `mapSymbolId` | `map_symbol_id` | Biểu tượng |
| `coordinateSystem` | `coordinate_system` | Hệ quy chiếu (Integer) |
| `displayRule` | `display_rule` | Quy tắc hiển thị (255) |

### 1.3. Bảng con Điểm neo (AnchorPoint — 3 biến thể)

| Trường | Cột DB | Ghi chú |
|---|---|---|
| FK cha | `*_mooring_water_area_id` | NOT NULL |
| `name` | `name` | Tên điểm neo |
| `latitude` | `latitude` | BigDecimal |
| `longitude` | `longitude` | BigDecimal |

## 2. Quy tắc chung toàn module (bắt buộc cho mọi feature)

1. **Mã tự sinh — 3 dạng khác nhau, client KHÔNG sửa:** Khu chuyển tải `{portCode}-CT-{seq}` (`TransferAreaService.generateTransferAreaCode`); Khu tránh trú bão `{portCode}-TTB-{seq}` (`StormShelterAreaService.generateStormShelterCode`); Khu neo đậu `{portCode}-ND-{seq}` (`AnchorageService.generateAnchorageCode`). Ô mã disabled, unique. Endpoint gợi ý mã: `GET /{resource}/generate-code?portId=`.
2. **Phê duyệt 2 cấp (Cảng vụ/Chi cục → Cục):** theo `docs/conventions/approval-2-level-spec.md` mục 3. 7 trạng thái lưu dạng số enum `ApprovalStatus` (DRAFT=0, PENDING_APPROVAL=2, APPROVED_LEVEL1=3, APPROVED=5, ARCHIVED=7, REJECTED_LEVEL1=8, REJECTED_LEVEL2=9); lý do từ chối bắt buộc ≥ 10 ký tự; chống tự duyệt (4-eyes); ghi nhật ký; xóa mềm chỉ ở DRAFT.
3. **Data scope theo đơn vị:** 3 entity cha khai `@Filter(name="orgUnitFilter", condition="org_unit_id IN (:orgUnitIds)")`; 3 controller khai `@DataScope` class-level (TransferAreaController.java:34, StormShelterAreaController.java, AnchorageController.java); đơn vị cha xem subtree, Cục xem full; không để `orgUnitId` NULL khi ghi.
4. **Enum → INT:** `approvalStatus`, `operationalStatus` (converter), `securityLevel` lưu dạng số, không lưu VARCHAR.
5. **UI:** label tiếng Việt có dấu; tên code/DB/field/API tiếng Anh chuẩn; không hardcode màu/spacing/font (theo `theme.ts` + `tokens.ts`); mọi màn danh sách dùng bộ `ScreenHeader`/`FilterBar`/`StatusTabs`/`DataTable`/`Pagination`; Drawer detail dùng `AppDrawer`.

## 3. Logic "khu nước neo buộc" (BẮT BUỘC — nguồn: sheet "1 số logic")

Áp dụng cho bảng con Khu nước neo buộc tàu (MooringWaterArea) ở mọi sub-domain; phải xuất hiện trong lean-spec của từng feature Tạo mới (F-300/F-306/F-312):

- **Loại đối tượng = Điểm ('1'):** bắt buộc **đúng 1** cặp tọa độ (`completeCount !== 1` → lỗi, trừ khi `isDefaultLoaiDoiTuong=true`).
- **Loại đối tượng = Đường ('2'):** **tối thiểu 2** tọa độ (`completeCount < 2` → lỗi).
- **Loại đối tượng = Vùng ('3'):** **tối thiểu 3** tọa độ (`completeCount < 3` → lỗi).
- **Hệ quy chiếu mặc định = WGS-84**; **Quy tắc hiển thị mặc định = Độ, phút, giây (DMS)**.
- **VN-2000 / Độ thập phân (DD)** chỉ được dùng khi migration dữ liệu về — không phải lựa chọn nhập liệu bình thường.

## 4. Lịch sử (approved-only)

- Màn Lịch sử **chỉ hiển thị các thay đổi ĐÃ duyệt** (approved-only): bản ghi mới tạo ở trạng thái Nháp + "Lưu tạm" → **không** tạo/không hiển thị bản ghi lịch sử.
- Bản ghi đã được phê duyệt và được chỉnh sửa thành công (sửa hồ sơ Đã duyệt = "Lưu và phê duyệt") → mới ghi nhận và hiển thị tại màn Lịch sử (bản cũ lưu vào nhật ký thay đổi, hồ sơ giữ `APPROVED`).

## 5. Phân quyền (10 permission mỗi resource — ĐÃ seed, CHỈ document)

`PermissionSeeder.java` đã seed 10 permission cho mỗi resource `transferarea` / `stormshelter` / `anchorage`:

`read`, `read:restricted`, `read:confidential`, `create`, `update`, `delete`, `approve`, `approvec1`, `approvec2`, `history`.

> **KHÔNG re-seed, KHÔNG sửa PermissionSeeder.** Các brief mục 4 chỉ khai báo `<resource>:<action>` + bảng vai trò × thao tác + Admin Cục.

## 6. Endpoint (đã xác minh trong code — mục 6 brief là đề xuất, SA chốt)

Base path (frontend gọi `/v1/...`, backend `@RequestMapping("/api/v1/...")`):

| Resource | Base path | Các endpoint chính |
|---|---|---|
| Khu chuyển tải | `/api/v1/transfer-area` | `GET` (list/search), `POST`, `PUT`, `DELETE /{id}`, `GET /generate-code`, `GET /{id}`, `POST /{id}/approve`, `POST /{id}/reject`, `GET /{id}/history`, `GET /history/all`, `GET /{id}/children`, `POST /{id}/attachments`, `GET /{id}/attachments`, `DELETE /{id}/attachments/{attId}` |
| Khu tránh trú bão | `/api/v1/storm-shelter` | tương tự TransferArea |
| Khu neo đậu | `/api/v1/anchorage` | tương tự TransferArea |

## 7. Drift đã ghi nhận (doc-parity — KHÔNG sửa code, SA/Dev xử lý)

1. **`@PreAuthorize` bị comment** ở cả 3 controller (TransferArea/StormShelterArea/Anchorage) với ghi chú "TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN". Permission ĐÃ seed trong `PermissionSeeder.java` (10/resource) nhưng **chưa được enforce ở controller** — mọi user đăng nhập hiện gọi được API bất kể quyền. `@DataScope` vẫn bật (filter đơn vị hoạt động). Đây là điểm lệch phải được SA/PMO chốt, KHÔNG sửa trong module này.
2. **"Thuộc bến phao" → `buoyStationId`:** cột entity đặt tên `buoy_station_id` nhưng ngữ nghĩa nghiệp vụ là **BuoyBerth** (M-002), không phải BuoyStation. Frontend `search` truyền `buoyStationId` (portService.ts).
3. **Storm-shelter CSV #16 "Cỡ tàu (DWT)" và #20 "Ghi chú":** mọi flag (List/Filter/Detail/Create/Edit) đều FALSE → DB-parity-only (chỉ tồn tại trong DB/entity `maxVesselDWT`, `remarks`; không hiển thị trên form/list).
4. **Tỉnh/TP filter:** CSV Khu chuyển tải đánh dấu `Filter=FALSE` cho #5 "Địa điểm (Tỉnh/TP)" nhưng code hiện có filter tỉnh/TP (search param `provinceId`).
5. **Lệch Input vs InputTextArea:** một số trường CSV khai `InputTextArea` nhưng code dùng `Input` (và ngược lại) — chi tiết ở từng brief mục 2.
6. **3 auto-code khác nhau:** `-CT-` / `-TTB-` / `-ND-` (không dùng chung một khuôn).
7. **Storm-shelter CSV TAB1 "Xem chi tiết" = FALSE** cho toàn bộ trường thông tin chung (trong khi Khu chuyển tải/Khu neo đậu để TRUE) — khả năng là lỗi nhập liệu CSV; code DetailContent vẫn hiển thị các trường này. Cần PMO/SA chốt ma trận chuẩn.

## 8. Index feature

| Feature | Sub-domain | Chức năng | Brief | Lean-spec |
|---|---|---|---|---|
| F-300 | Khu chuyển tải | Tạo mới | `_features/F-300-quan-ly-khu-chuyen-tai-tao-moi/feature-brief.md` | `_features/F-300-quan-ly-khu-chuyen-tai-tao-moi/ba/00-lean-spec.md` |
| F-301 | Khu chuyển tải | Cập nhật | `_features/F-301-quan-ly-khu-chuyen-tai-cap-nhat/feature-brief.md` | `_features/F-301-quan-ly-khu-chuyen-tai-cap-nhat/ba/00-lean-spec.md` |
| F-302 | Khu chuyển tải | Xóa (soft delete) | `_features/F-302-quan-ly-khu-chuyen-tai-xoa/feature-brief.md` | `_features/F-302-quan-ly-khu-chuyen-tai-xoa/ba/00-lean-spec.md` |
| F-303 | Khu chuyển tải | Phê duyệt | `_features/F-303-phe-duyet-khu-chuyen-tai/feature-brief.md` | `_features/F-303-phe-duyet-khu-chuyen-tai/ba/00-lean-spec.md` |
| F-304 | Khu chuyển tải | Xem chi tiết | `_features/F-304-xem-chi-tiet-khu-chuyen-tai/feature-brief.md` | `_features/F-304-xem-chi-tiet-khu-chuyen-tai/ba/00-lean-spec.md` |
| F-305 | Khu chuyển tải | Lịch sử | `_features/F-305-quan-ly-khu-chuyen-tai-lich-su/feature-brief.md` | `_features/F-305-quan-ly-khu-chuyen-tai-lich-su/ba/00-lean-spec.md` |
| F-306 | Khu tránh trú bão | Tạo mới | `_features/F-306-quan-ly-khu-tranh-tru-bao-tao-moi/feature-brief.md` | `_features/F-306-quan-ly-khu-tranh-tru-bao-tao-moi/ba/00-lean-spec.md` |
| F-307 | Khu tránh trú bão | Cập nhật | `_features/F-307-quan-ly-khu-tranh-tru-bao-cap-nhat/feature-brief.md` | `_features/F-307-quan-ly-khu-tranh-tru-bao-cap-nhat/ba/00-lean-spec.md` |
| F-308 | Khu tránh trú bão | Xóa (soft delete) | `_features/F-308-quan-ly-khu-tranh-tru-bao-xoa/feature-brief.md` | `_features/F-308-quan-ly-khu-tranh-tru-bao-xoa/ba/00-lean-spec.md` |
| F-309 | Khu tránh trú bão | Phê duyệt | `_features/F-309-phe-duyet-khu-tranh-tru-bao/feature-brief.md` | `_features/F-309-phe-duyet-khu-tranh-tru-bao/ba/00-lean-spec.md` |
| F-310 | Khu tránh trú bão | Xem chi tiết | `_features/F-310-xem-chi-tiet-khu-tranh-tru-bao/feature-brief.md` | `_features/F-310-xem-chi-tiet-khu-tranh-tru-bao/ba/00-lean-spec.md` |
| F-311 | Khu tránh trú bão | Lịch sử | `_features/F-311-quan-ly-khu-tranh-tru-bao-lich-su/feature-brief.md` | `_features/F-311-quan-ly-khu-tranh-tru-bao-lich-su/ba/00-lean-spec.md` |
| F-312 | Khu neo đậu | Tạo mới | `_features/F-312-quan-ly-khu-neo-dau-tao-moi/feature-brief.md` | `_features/F-312-quan-ly-khu-neo-dau-tao-moi/ba/00-lean-spec.md` |
| F-313 | Khu neo đậu | Cập nhật | `_features/F-313-quan-ly-khu-neo-dau-cap-nhat/feature-brief.md` | `_features/F-313-quan-ly-khu-neo-dau-cap-nhat/ba/00-lean-spec.md` |
| F-314 | Khu neo đậu | Xóa (soft delete) | `_features/F-314-quan-ly-khu-neo-dau-xoa/feature-brief.md` | `_features/F-314-quan-ly-khu-neo-dau-xoa/ba/00-lean-spec.md` |
| F-315 | Khu neo đậu | Phê duyệt | `_features/F-315-phe-duyet-khu-neo-dau/feature-brief.md` | `_features/F-315-phe-duyet-khu-neo-dau/ba/00-lean-spec.md` |
| F-316 | Khu neo đậu | Xem chi tiết | `_features/F-316-xem-chi-tiet-khu-neo-dau/feature-brief.md` | `_features/F-316-xem-chi-tiet-khu-neo-dau/ba/00-lean-spec.md` |
| F-317 | Khu neo đậu | Lịch sử | `_features/F-317-quan-ly-khu-neo-dau-lich-su/feature-brief.md` | `_features/F-317-quan-ly-khu-neo-dau-lich-su/ba/00-lean-spec.md` |
