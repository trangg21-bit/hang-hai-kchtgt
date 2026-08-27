# Plan: Module Quản Lý Khu Chuyển Tải (Transfer Area)

## Tổng quan
- Pattern: Clone từ Khu neo đậu (Anchorage) — bản thân Anchorage clone từ Berth (Bến cảng)
- Source: `docs/inputs/HH_Tính năng & danh sách các trường thông tin(Khu chuyển tải).csv` (58 trường, 5 tab) + Anchorage pattern
- Triage: C3 (full_pipeline) — record: `docs/intel/_intake/TRI-1787792881776-6edd.json`
- Change type: implementation
- **Chỉ đạo user (2026-08-27): triển khai inline trong phiên, KHÔNG dùng PMO** — máy yêu cầu dispatch pmo-software-project-manager nhưng user override; build seat tự triển khai + verify riêng (verify subagent).

## Cấu trúc đã triển khai

### Backend
1. **Migrations (2 file)**
   - `V20260828000000__create_transfer_areas.sql` — bảng transfer_areas (clone anchorages: code/name/port/org_unit/province/detailed_location/operational_functions/operational_status/approval_status + technical + publication + activity_start_date/activity_end_date + approval 2 cấp) + indexes
   - `V20260828010000__transfer_area_gis_mooring.sql` — GIS columns + bảng con transfer_area_mooring_water_areas + transfer_area_mooring_water_area_anchor_points
   - ⚠️ LƯU Ý VERSION: bản đầu dùng V20260827100000/27110000 NHƯNG dev DB dùng chung (10.0.229.20/vmd_csdl_v2_dev) đã bị luồng song song khác chiếm 2 version đó ('create transmission table' 08:49 + 'restore security level vts operation center' 08:58, 2026-08-27) → Flyway (validate-on-migrate=false) bỏ qua file của ta → bảng không được tạo. Đã đổi sang V20260828000000/28010000 (TRI-1787796842441-2400).
2. **Entity (3)**: `TransferArea` (+ @Filter orgUnitFilter + recordSecurityLevelFilter, @FieldNameConstants), `TransferAreaMooringWaterArea`, `TransferAreaMooringWaterAreaAnchorPoint`
3. **Repository (3)**: `TransferAreaRepository` (searchTransferAreas unaccent, KHÔNG có navigationChannelId/buoyStationId, thêm operationalFunctions LIKE), 2 repo con
4. **DTO (11)**: `transferarea/` — Create/Update/Response + Approve/Reject/Attachment + MooringWaterArea Request/Response + AnchorPoint Request/Response
5. **Service (2)**: `TransferAreaService` (CRUD + generateTransferAreaCode prefix `{portCode}-CT-{seq}` + attachments EntityType "TRANSFER_AREA" + GIS POLYGON_TRANSSHIPMENT/TRANSSHIPMENT_AREA + mooring thay thế toàn bộ; lịch sử TẠM TẮT như Anchorage do V20260825162500 drop change_logs/approval_logs), `TransferAreaApprovalService` (2 cấp CANG_VU → CUC)
6. **Controller**: `/api/v1/transfer-area`, @DataScope, @PreAuthorize comment tạm (chuẩn Anchorage)
7. **Permission Seeder**: block `transferarea:*` (read/read:restricted/read:confidential/create/update/delete/approve/approvec1/approvec2/history) — resource `transferarea`
8. **GIS**: thêm `GisSpatialObjectType.POLYGON_TRANSSHIPMENT(36)` + case `TRANSSHIPMENT_AREA` trong `GisSpatialObjectService.resolveSpatialObjectType` (InfrastructureType.TRANSSHIPMENT_AREA đã có sẵn)

### Frontend
1. **Types**: `frontend/src/types/port.ts` — TransferArea, CreateTransferAreaRequest, UpdateTransferAreaRequest, TransferAreaApprovalResponse (KHÔNG navigationChannelId/buoyStationId; thêm operationalFunctions + activityStartDate/activityEndDate; counter activeTransferCount/publishedTransferCount/underInvestmentTransferCount)
2. **Service**: `frontend/src/services/portService.ts` — `transferAreaCRUD` (endpoints /v1/transfer-area, generateCode → { transferAreaCode })
3. **Pages (3)**: `frontend/src/pages/transfer-area/` — TransferAreaListPage, TransferAreaForm, TransferAreaDetailContent (clone Anchorage, delta theo CSV: thêm Công năng khai thác multi-select, Thời gian hoạt động Từ/Đến, bỏ luồng/trạm phao tiêu, bỏ activityStatus)
4. **Router/Menu**: App.tsx route `/transfer-area` + PermissionGuard `transferarea:read`; AppLayout menu 'Quản lý khu chuyển tải' (icon SwapOutlined) dưới nhánh port-parent, MENU_PERMISSION_MAP + pageTitles + selectedKey/openKeys

## Khác biệt chính so với Anchorage (theo CSV)
- Mã tự sinh: `{portCode}-CT-{seq}` (Anchorage: -ND-)
- Bỏ navigationChannelId/buoyStationId (CSV Khu chuyển tải không có)
- Thêm operationalFunctions (Công năng khai thác — multi-select AppParams, lưu VARCHAR nối dấu phẩy)
- Thêm activityStartDate/activityEndDate (Thời gian hoạt động Từ/Đến) — thay cho activityStatus
- EntityType attachment: TRANSFER_AREA
- GIS: POLYGON_TRANSSHIPMENT (36) / TRANSSHIPMENT_AREA

## Lịch sử (TẠM TẮT) — chuẩn Anchorage
- Bảng change_logs/approval_logs đã bị V20260825162500 drop → service không ghi/đọc 2 bảng này (comment), getHistory/getAllHistory trả rỗng. Nếu user muốn lịch sử trở lại → tạo migration tái tạo bảng.

## Verification
- BE: `"C:\Program Files\JetBrains\IntelliJ IDEA 2026.1.4\plugins\maven\lib\maven3\bin\mvn.cmd" clean compile -q` (mvn KHÔNG có trên PATH — Maven bundled IntelliJ)
- FE: `npx tsc --noEmit -p tsconfig.app.json` + `npm run build` (vite)

## Triage Record
- File: `docs/intel/_intake/TRI-1787792881776-6edd.json`
- Class: C3 (full_pipeline) — one-way door schema
- Next (máy): dispatch pmo — bị user override (chỉ đạo inline)
