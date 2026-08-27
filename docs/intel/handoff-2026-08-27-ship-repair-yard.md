# HANDOFF — Phiên 2026-08-27: Cơ sở sửa chữa đóng tàu (ShipRepairYard)

> File bàn giao phiên clone module **Quản lý cơ sở sửa chữa đóng tàu (CSSCĐT)** theo CSV đặc tả 45 trường. Toàn bộ thay đổi ở trạng thái **local (chưa commit)** theo yêu cầu user. Triage record: `docs/intel/_intake/TRI-1787821552310-807f.json` (C3) — theo chỉ đạo user: **triển khai inline, KHÔNG dùng PMO** (như các phiên Khu chuyển tải / Khu tránh trú bão / Bến phao).

## 1. Mục tiêu
Clone toàn bộ cấu trúc **Bến phao (BuoyBerth)** — DB + BE + FE (bộ lọc, danh sách, thêm mới, chỉnh sửa, chi tiết) — sang **Cơ sở sửa chữa đóng tàu** theo CSV `HH_Tính năng & danh sách các trường thông tin(QL cơ sở sửa chữa đóng tàu).csv` (45 trường, 5 tab).

## 2. ⚠️ PHÂN BIỆT MODULE CŨ vs MỚI (bài học BuoyStation ≠ BuoyBerth)
- **Module CŨ**: `com.hanghai.kchtg.shiprepairfacility` (bảng `ship_repair_facility`, route FE `/ship-repair-facility`, quyền `shiprepairfacility:*` / `shiprepair:read`, pages `frontend/src/pages/shiprepair/`) — legacy hh.csdl, **KHÔNG ĐƯỢC ĐỤNG**.
- **Module MỚI (phiên này)**: `com.hanghai.kchtg.port` package — entity `ShipRepairYard` (bảng `ship_repair_yards`), endpoint `/api/v1/ship-repair-yard`, quyền `shiprepairyard:*`, route FE `/ship-repair-yard`, menu "Quản lý cơ sở sửa chữa đóng tàu".

## 3. Backend (đã `mvn clean compile` PASS — exit 0, IntelliJ bundled Maven)
**File mới:**
- Migration: `V20260830000000__create_ship_repair_yards.sql` (version 20260830 — sau buoy 20260829, tránh collision DB dùng chung)
- `port/entity/ShipRepairYard.java`, `port/repository/ShipRepairYardRepository.java` (search: code/name/portId/pierId/provinceId/approvalStatus/operationalStatus/updated range)
- `port/dto/shiprepairyard/` (6 file: Create/Update/Response/ApproveRequest/RejectRequest/AttachmentDto)
- `port/service/ShipRepairYardService.java` + `ShipRepairYardApprovalService.java` (duyệt 2 cấp CANG_VU → CUC)
- `port/controller/ShipRepairYardController.java` (`/api/v1/ship-repair-yard`)

**File sửa:**
- `config/PermissionSeeder.java` — block `shiprepairyard:*` (10 quyền, mục 8.2.5)
- `gis/spatial/entity/GisSpatialObjectType.java` — thêm `POLYGON_SHIP_REPAIR_YARD(38, "Cơ sở sửa chữa đóng tàu")`
- `gis/search/dto/InfrastructureType.java` — thêm `SHIP_REPAIR_YARD` (SHIP_REPAIR_FACILITY vẫn giữ cho module cũ)
- `gis/spatial/service/GisSpatialObjectService.java` — thêm case `SHIP_REPAIR_YARD`

**Điểm cần biết:**
- Mã tự sinh `{portCode}-SCDT-{seq}` (SCDT = Sửa Chữa Đóng Tàu)
- Attachment EntityType `SHIP_REPAIR_YARD` (folder `uploads/attachments/SHIP_REPAIR_YARD/`)
- Trường MỚI so với BuoyBerth: **`pierId` (Thuộc cầu cảng — KCHT_CC)** — resolve `pierName` qua `PierRepository`; KHÔNG có waterwayId/classification/operatingOrgId/đăng kiểm/công bố/khu nước
- 8 trường đặc thù CSSCĐT: `usageFunction` (Công năng sử dụng), `workshopArea` (Diện tích nhà xưởng m2), `vesselType` (Loại tàu đóng mới, sửa chữa), `vesselDwt` (Cỡ tàu DWT), `businessType` (Loại hình doanh nghiệp), `activity` (Hoạt động), `slipwayCount` (Số lượng triền đà), `remarks` (Ghi chú)
- Lịch sử TẠM TẮT như Anchorage/Transfer (bảng change_logs/approval_logs đã bị V20260825162500 drop)
- @PreAuthorize tạm comment (chuẩn Khu neo đậu) — sau restart cây quyền tự seed

## 4. Frontend (`npm run build` PASS — chunk `ShipRepairYardListPage-*.js` ~86 kB)
**File mới:** `pages/ship-repair-yard/` — `ShipRepairYardListPage.tsx`, `ShipRepairYardForm.tsx`, `ShipRepairYardDetailContent.tsx`
**File sửa:** `types/port.ts` (+ShipRepairYard + Create/Update/Approval types), `services/portService.ts` (+shipRepairYardCRUD base `/v1/ship-repair-yard`, generateCode → `{shipRepairYardCode}`), `App.tsx` (route `/ship-repair-yard`, permission `shiprepairyard:read`), `AppLayout.tsx` (menu "Quản lý cơ sở sửa chữa đóng tàu" cạnh Bến phao, icon `ToolOutlined` — 5 chỗ: permission map + title map + selectedKey + openKeys + menu item)

**Cấu trúc chuẩn (giống BuoyBerth):** Form tab Thông tin chung (ĐVQL → Cảng biển → **Cầu cảng** → Mã → Tên → Tỉnh/TP → Địa điểm chi tiết → Tình trạng) + toggle ▼ Thông tin đặc thù CSSCĐT (8 trường); tab Thông tin vị trí (GIS + bảng tọa độ DMS) + tab File đính kèm. Chi tiết 5 tab: Thông tin chung (+ đặc thù CSSCĐT toggle) / Thông tin vị trí / File đính kèm / Vận hành & bảo trì (read-only) / Xử lý & theo dõi.
- **Thuộc cầu cảng**: load `pierCRUD.search({ portId, approvalStatus: 'APPROVED' })` — khi đổi cảng biển → reset pierId + load lại (Form + ListPage filter)
- Không có tab "Kết cấu hạ tầng" (CSV CSSCĐT không có — khác Bến phao)
- Danh mục AppParams (Công năng sử dụng / Loại tàu / Loại hình DN / Hoạt động): dùng hằng số trong `ShipRepairYardForm.tsx` (USAGE_FUNCTION_OPTIONS / VESSEL_TYPE_OPTIONS / BUSINESS_TYPE_OPTIONS / ACTIVITY_OPTIONS) — **cần BA chốt danh mục chính thức** (chưa có trong AppParams/SelectAppParams)

## 5. Verify (bằng chứng thực thi)
- BE: `"C:\Program Files\JetBrains\IntelliJ IDEA 2026.1.4\plugins\maven\lib\maven3\bin\mvn.cmd" -q clean compile` → **exit 0 PASS**
- FE: `npm run build` (frontend) → **exit 0 PASS** (chunk `ShipRepairYardListPage-D4j4SyyX.js` 86.51 kB)
- FE: `npx tsc --noEmit -p tsconfig.app.json` → baseline pre-existing ~100 file (KHÔNG thuộc change); **0 lỗi thuộc change** (đã fix: portService thiếu import types; DetailContent unused Tooltip/Button/fmtDate + rowKey không phải prop PagedTable; Form unused dayjs/setGpsError + UploadFile type; ListPage unused AppDrawer)

## 6. Việc còn lại cho USER
1. **Khởi động lại backend** → Flyway áp migration `V20260830000000` (bắt buộc để tạo bảng; KHÔNG tự chạy backend theo quy định)
2. **Hard-refresh FE** (Ctrl+Shift+R) / deploy `frontend/dist` lên `10.0.229.20:30008`
3. Sau khi restart: cây phân quyền sẽ có nhóm quyền "Cơ sở sửa chữa đóng tàu" (tự seed) — gán quyền `shiprepairyard:*` cho nhóm/tài khoản cần dùng
4. **BA duyệt**: (a) danh mục 4 AppParams đặc thù CSSCĐT (Công năng sử dụng / Loại tàu / Loại hình DN / Hoạt động); (b) đồng bộ feature-brief F-050..F-055 — brief hiện ghi endpoint cũ `/api/v1/co-so-sua-chua` + quyền `cosuachua:*`, code thực tế là `/api/v1/ship-repair-yard` + `shiprepairyard:*` (docs/modules/** chỉ specialist được ghi — tôi không tự sửa)
5. **Dữ liệu mẫu**: sau migration, insert dữ liệu mẫu trực tiếp vào DB dev để test (theo AGENTS.md — không dùng Java seeder)

## 7. Lưu ý / nợ kỹ thuật
- **CHUẨN HÓA CHUỖI HIỂN THỊ (user chốt 2026-08-27, sau verify):** toàn bộ chuỗi "Cơ sở sửa chữa đóng tàu" → **"Cơ sở sửa chữa, đóng tàu"** (có dấu phẩy, khớp CSV gốc) — đã sửa: ListPage (17 chỗ: breadcrumb/toast/modal/drawer/empty), Form (2), DetailContent (toggle "Thông tin đặc thù CSSCĐT" → "Thông tin đặc thù cơ sở sửa chữa, đóng tàu" — ghi rõ, không tắt), AppLayout (2: title + menu), PermissionSeeder block 8.2.5 (20 chuỗi), Service (6), ApprovalService (3), Controller (10), GisSpatialObjectType (1), javadoc entity (1). KHÔNG đụng module cũ (PermissionSeeder dòng 488 block 9.3, ManagedAsset.java — giữ nguyên). Verify lại: mvn clean compile exit 0 (class tồn tại sau clean) + npm build exit 0 (chunk mới DwGIN27k).
- **Lỗi runtime user gặp giữa phiên** (`NoClassDefFoundError: AnchorageResponse$AnchorageResponseBuilder`): build stale — target/classes đã có đủ class (AnchorageResponse.class + $AnchorageResponseBuilder.class sau mvn clean compile), **chỉ cần restart backend** là hết, KHÔNG phải lỗi code
- Cột `workshop_area` NUMERIC(15,2) vs FE InputNumber — nhập >15 chữ số phần nguyên sẽ lỗi DB (theo convention chung, chưa đổi)
- `historyFieldValue` map tỉnh có giá trị rác — kế thừa từ BuoyBerth (history đang tạm tắt)
- Update optional FK (pierId): pattern `if != null` giống Anchorage — FE gửi undefined sẽ không clear được giá trị cũ (hạn chế kế thừa)
- `gpsError` state giữ từ template nhưng không có luồng set (baseline giống BuoyBerthForm)
- Memory đã lưu: `shiprepairyard-clone`
