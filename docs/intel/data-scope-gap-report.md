# Báo cáo lỗ hổng phân quyền theo đơn vị (Data Scope) — Toàn hệ thống

- **Ngày:** 2026-08-20
- **Phạm vi:** rà soát tĩnh (read-only) toàn bộ `src/main/java/com/hanghai/kchtg/` — 30 package
- **Cơ chế chuẩn đối chiếu:** "đơn vị chỉ thấy dữ liệu đơn vị mình; đơn vị cha thấy đơn vị con (subtree); Cục xem full qua `orgunit:scope_all`/`admin:all`/`*`"
- **Trạng thái:** BÁO CÁO PHÂN TÍCH — chưa sửa gì. Chờ duyệt phạm vi từng đợt khắc phục.

---

## 0. Cơ chế chuẩn hiện có (đã hoạt động đúng — tham chiếu)

| Thành phần | Vị trí | Vai trò |
|---|---|---|
| `DataScopeAspect` | `security/aspect/DataScopeAspect.java` | AOP bật Hibernate filter khi controller có `@DataScope`; subtree BFS (cha thấy con) tại dòng 113-121; Cục full bỏ filter tại 108-111 |
| `orgUnitFilter` (FilterDef) | `common/entity/BaseEntity.java:35-43` | Khai báo filter `org_unit_id IN (:orgUnitIds)` |
| `OrgUnitScopeService` | `orgunit/service/OrgUnitScopeService.java:33-70` | Scope từ đơn vị tài khoản + `orgunit:scope_all` → chỉ dùng ở M-001 |
| `OrgUnitCacheService` | `orgunit/service/OrgUnitCacheService.java` | Map `orgUnitId → tên` (không TTL, `evictAfterCommit`) |

**Nguyên tắc hoạt động:** filter chỉ có hiệu lực khi (1) entity khai `@Filter(name="orgUnitFilter")` **và** (2) endpoint đi qua controller có `@DataScope`.

---

## 1. Lỗ hổng NGHIÊM TRỌNG (🔴) — dữ liệu không bị chặn theo đơn vị

### 1.1. assetmovement (M-005 — biến động tài sản, luồng phê duyệt)

| Mục | Chi tiết |
|---|---|
| Vị trí | `assetmovement/**` (10 entity: MovementRequest, InfraAsset, InventoryPlan, InventoryReport, InventoryAsset, AssetIncreaseRequest, AssetDecreaseRequest, AssetExploitation, AssetProcessingRecord, ApprovalRecord) |
| Lỗ hổng | **Không entity nào có trường đơn vị** (orgUnitId/unitId/owningOrgId); repository không có param đơn vị; **0 controller có `@DataScope`** (grep toàn repo 39 vị trí `@DataScope`, 0 ở assetmovement) |
| Hệ quả | User có quyền thao tác (vd `movementrequest:manage`) thấy **toàn bộ** dữ liệu mọi đơn vị |
| Đề xuất | (a) Migration thêm `org_unit_id` cho các bảng nghiệp vụ + backfill từ người tạo; (b) thêm field entity + `@Filter`; (c) thêm `@DataScope` lên controller; (d) xác định nguồn đơn vị khi ghi (từ user tạo, không phải client) |

### 1.2. trade (luồng hàng hải)

| Mục | Chi tiết |
|---|---|
| Vị trí | `trade/entity/TradeFlow.java:24-51` — không có trường đơn vị, không extends BaseEntity |
| Lỗ hổng | Không lọc, không `@DataScope` (`TradeFlowController.java`) |
| Hệ quả | Dữ liệu Sankey/heatmap/bar demo (F-105) không phân quyền đơn vị |
| Đề xuất | Xác định đây là dữ liệu phân tích tổng hợp hay nghiệp vụ; nếu nghiệp vụ → thêm cột đơn vị + filter; nếu demo → ghi rõ out-of-scope |

### 1.3. Toàn bộ 7 package tích hợp

| Package | Bằng chứng |
|---|---|
| dataconnection | `DataConnection`, `SyncLog`, `ConnectionHealth` — không cột đơn vị, migration `V105__create_interconnect_tables.sql` không có `org_unit_id` |
| datasharing | `SharedData` + `ShareHistory` — không cột đơn vị; filter DTO không có unit |
| datasharingaggregation | `DataSharingAggregationRecord` — không cột đơn vị |
| businessintegration | `BusinessDataIntegrationRecord` — không cột đơn vị |
| integration | `PortStatus`, `IntegrationSyncJob`, `IntegrationDlq`, `CargoAggregate` — không cột; **`PortCargoIntegrationService.java:44-51` đọc thẳng GIS objects không lọc** |
| interconnect | `IntegrationConnection`, `IntegrationTransaction`, `DataSharingLog` — không cột |
| systemintegration | `SystemIntegrationRecord` — không cột |

| Hệ quả | Dữ liệu chia sẻ/tích hợp không bị chặn theo đơn vị; cổng KCHT (PortCargoIntegrationService) hiển thị dữ liệu KCHT thô không scope |
|---|---|
| Đề xuất | Phạm vi lớn: cần quyết định nghiệp vụ — các nhật ký tích hợp có cần scope theo đơn vị không, hay chỉ cần permission thao tác? Nếu cần → migration + filter + `@DataScope` cho từng module |

### 1.4. GIS search (KchtGis155) — client tự quyết phạm vi

| Mục | Chi tiết |
|---|---|
| Vị trí | `gis/search/controller/KchtGis155RestController.java:28`; `gis/search/service/KchtGis155Service.java:365-374` |
| Lỗ hổng | `orgUnitId = isRootOrg ? null : rawOrgUnitId` — **root detect bằng TÊN** ("Cục Hàng hải Việt Nam"); client gửi `null` = xem toàn quốc; controller **không `@DataScope`** |
| Hệ quả | Bất kỳ user nào cũng có thể gửi `orgUnitId=null` hoặc tên root để xem toàn bộ dữ liệu APPROVED |
| Đề xuất | Tính scope từ server (`OrgUnitScopeService`/`DataScopeAspect`), không tin client; bỏ root-detect bằng tên |

### 1.5. dashboard — lọc theo tỉnh, không theo đơn vị

| Mục | Chi tiết |
|---|---|
| Vị trí | `dashboard/**`; `KchtAssetCountService.java:101` — comment thẳng *"NO org_unit_id fallback!"* |
| Lỗ hổng | Phạm vi theo `provinceId` (Integer), không theo cây đơn vị; snapshot `findByYearNational` |
| Hệ quả | Trang chủ dashboard không nhất quán với mô hình scope đơn vị |
| Đề xuất | Quyết định: chuyển sang org_unit_id hay giữ tỉnh (cần đối chiếu nghiệp vụ) |

---

## 2. Lỗ hổng KỸ THUẬT cần sửa ngay (🟠) — filter có nhưng dữ liệu NULL

### 2.1. Buoy + BeaconLight: cột `org_unit_id` không bao giờ được set

| Mục | Chi tiết |
|---|---|
| Vị trí | `beacon/entity/Buoy.java:42-43,81-82`; `beacon/entity/BeaconLight.java:42-43,85-86`; `beacon/service/BuoyService.java:188` (chỉ set `unitId`); `BuoyService.java:818-819` + `BeaconLightService.java:519-520` — `getCurrentUserUnitId()` là **stub trả null** |
| Lỗ hổng | Filter `orgUnitFilter` chạy trên `org_unit_id` vốn luôn NULL → `NULL IN (...)` = false → **user cấp đơn vị thấy 0 bản ghi, 404 khi mở chi tiết** |
| Hệ quả | Fail-closed (an toàn) nhưng **chức năng hỏng** với mọi user không phải Cục |
| Đề xuất | Set `org_unit_id` khi create/update (từ request hoặc fallback đơn vị user tạo); backfill dữ liệu cũ qua migration; bỏ stub `getCurrentUserUnitId()` |

### 2.2. 5 Coastal station: `unit_id` không bao giờ được set

| Mục | Chi tiết |
|---|---|
| Vị trí | `station/entity/CoastalStationVTS.java:47` (và LRIT/Inmarsat/Haiphong/CospasSarsat) — entity có `unit_id` + `@Filter`; **5 service coastal không có bất kỳ `setUnitId` nào** (grep toàn `station/service`) |
| Lỗ hổng | Toàn bộ bản ghi coastal có `unit_id` NULL → scoped user thấy 0 bản ghi |
| Đề xuất | Thêm `unitId` vào DTO + set khi create/update + backfill |

### 2.3. LighthouseStation / BuoyStation: không fallback đơn vị

| Mục | Chi tiết |
|---|---|
| Vị trí | `station/service/LighthouseStationService.java:97` (set từ request, không fallback); `BuoyStationService.java:157,611-612` (fallback stub null) |
| Lỗ hổng | Client không gửi `unitId` → NULL → scoped user không thấy |
| Đề xuất | Fallback = đơn vị của user tạo khi request không có |

---

## 3. Lỗ hổng TRUNG BÌNH (🟡) — enforce không đầy đủ

### 3.1. shiprepairfacility: đọc có scope, ghi không validate

| Mục | Chi tiết |
|---|---|
| Vị trí | `shiprepairfacility/service/ShipRepairFacilityService.java:66,163-188` — create/update set `orgUnitId` từ request KHÔNG kiểm tra scope (service chỉ import `OrgUnitCacheService` để map tên) |
| Hệ quả | Filter chỉ chặn đọc; user tạo được bản ghi thuộc đơn vị ngoài phạm vi |
| Đề xuất | Thêm validate `orgUnitId` thuộc scope trước create/update (kiểu `requireOrganizationInScope` như `UserGroupService.java:78`) |

### 3.2. port & nhóm KCHT (dikerevetment, navigationchannel): dropdown/cache không scope + chưa audit write

| Mục | Chi tiết |
|---|---|
| Vị trí | `port/service/PortCacheService` + `PortRepository.java:42` (`findAllOptions` trả toàn bộ); `DataScopeAspect.java:36-39` TODO(SECURITY): chưa audit detail/update/delete/approve/export |
| Hệ quả | Dropdown options hiển thị đơn vị ngoài phạm vi; detail/update/delete phụ thuộc filter có thực sự bật khi query entity |
| Đề xuất | Scope hóa các query options; audit đầy đủ các endpoint còn lại theo TODO |

### 3.3. report (Bcc157): TODO(SECURITY) công khai + root-detect bằng tên

| Mục | Chi tiết |
|---|---|
| Vị trí | `report/service/Bcc157Service.java:34-35` — TODO *"Enforce OrgUnitScope ... repository access is currently unscoped"*; `report/service/ReportService.java:4487-4508` (`resolveOrgUnitId` client-supplied, `"-demo"` → đơn vị gốc đầu tiên); `KchtGis155Service.java:365-374` |
| Hệ quả | Báo cáo Bcc157 không bị scope; root-detect bằng tên dễ giả mạo |
| Đề xuất | Enforce scope ở service (không chỉ dựa Hibernate filter); root-detect bằng cấu trúc dữ liệu (parentId == null) |

### 3.4. managedasset: seeder tạo dữ liệu orgUnitId = NULL

| Mục | Chi tiết |
|---|---|
| Vị trí | `managedasset/entity/ManagedAsset.java:26,49` (có `@Filter`); `ManagedAssetDataSeeder` seed 8 bản ghi KHÔNG set orgUnitId |
| Hệ quả | Dữ liệu seed vô hình với user không nationwide |
| Đề xuất | Seeder gán orgUnitId thật |

### 3.5. History entities không scope được

| Mục | Chi tiết |
|---|---|
| Vị trí | `BeaconHistory` (controller thiếu `@DataScope`), `StationHistory` (class thường, không extends BaseEntity) |
| Hệ quả | Lịch sử không phân quyền đơn vị |
| Đề xuất | Quyết định nghiệp vụ: lịch sử có cần scope không; nếu cần → thêm cột + filter |

### 3.6. accesslog: orgUnit là String tên

| Mục | Chi tiết |
|---|---|
| Vị trí | `accesslog/entity/AccessLog.java:65` (`orgUnit` String); `AccessLogInterceptor.java:344-358` ghi `user.getOrgUnit().getName()` |
| Hệ quả | Lọc theo chuỗi tự do, không kiểm tra scope |
| Đề xuất | Lưu `orgUnitId` (UUID) song song hoặc thay thế |

---

## 4. Mô-đun ĐÚNG CHUẨN (🟢 — giữ nguyên, dùng làm mẫu tham chiếu)

| Module | Điểm chuẩn |
|---|---|
| **vtssystem** | 3 lớp: SQL scope param (`VtsSystemRepository`), `resolveDataScope()` ở service (`VtsSystemService.java:1270-1296`), validate write (`:228,246,332-333`) — enforce chính ở predicate SQL, aspect chỉ defence-in-depth |
| **radarstation** | Set `orgUnitId` từ request khi create/update (`RadarStationService.java:71,175`) + `OrgUnitCacheService` map tên + `@DataScope` |
| **KCHT đọc-side** (port/dikerevetment/navigationchannel/beacon/station/shiprepairfacility) | Entity `@Filter` + controller `@DataScope` → cha thấy con + Cục full đúng |

---

## 5. Quyết định nghiệp vụ đã chốt (2026-08-20 — chủ dự án)

| # | Hạng mục | Quyết định | Hệ quả triển khai |
|---|---|---|---|
| 1 | 7 package tích hợp (dataconnection, datasharing, datasharingaggregation, businessintegration, integration, interconnect, systemintegration) | **CÓ chặn theo đơn vị** | Thêm cột `org_unit_id` + filter + `@DataScope` + xác định nguồn đơn vị khi ghi |
| 2 | Dashboard (M-022) | **KHÔNG chặn** — dành cho lãnh đạo xem con số tổng hợp | Giữ nguyên lọc theo tỉnh; không thêm scope đơn vị |
| 3 | Lịch sử (BeaconHistory, StationHistory) | **CÓ chặn theo đơn vị của bản ghi** | Thêm cột đơn vị cho bảng history (kế thừa đơn vị bản ghi cha) |
| 4 | F-105 Biểu đồ trao đổi thương mại (`trade`) | **CÓ chặn theo đơn vị** — báo cáo phải xem theo đơn vị | Thêm cột đơn vị cho `trade_flows` + filter; cần BA xác định đơn vị của luồng liên cảng (cảng nguồn/đích) khi triển khai |
| 5 | Chống tái diễn | **ĐỒNG Ý** — đã thực hiện | AGENTS.md mục Data Scope Convention + template feature-brief (xem mục 6) |

## 6. Chống tái diễn — đã thực hiện (2026-08-20)

- **`AGENTS.md`** — thêm mục **"Data Scope Convention (MANDATORY)"**: mọi entity nghiệp vụ mới bắt buộc có trường đơn vị + `@Filter(orgUnitFilter)` + controller `@DataScope`; create/update phải gán đơn vị (cấm NULL) và validate trong phạm vi `OrgUnitScopeService`; migration kèm backfill; ngoại lệ duy nhất đã chốt = Dashboard.
- **`docs/feature-brief-template.md`** — thêm blockquote bắt buộc: bảng "Điểm khác biệt" (mục 5, dòng 3 — lọc theo đơn vị) BA phải khai báo đầy đủ và SA chốt cơ chế; brief dữ liệu nghiệp vụ phải khai báo trường đơn vị bắt buộc/không + nguồn gán + validate chiều ghi.

## 7. Đề xuất thứ tự khắc phục (cập nhật theo quyết định — chờ duyệt phạm vi)

| Đợt | Phạm vi | Loại | Ước lượng |
|---|---|---|---|
| **1** | Beacon + Coastal station + Lighthouse/BuoyStation (set cột đơn vị + backfill + bỏ stub) | 🟠 kỹ thuật | Nhỏ — fix dữ liệu NULL, chức năng đang hỏng |
| **2** | shiprepairfacility + port write-side validate | 🟡 | Nhỏ |
| **3** | GIS search (KchtGis155) — scope từ server | 🔴 | Trung bình |
| **4** | assetmovement (M-005) thêm cột đơn vị + filter + `@DataScope` | 🔴 | Lớn — migration + backfill |
| **5** | 7 package tích hợp — thêm cột đơn vị + filter + `@DataScope` (đã chốt: CÓ chặn) | 🔴 | Lớn — migration + backfill; BA xác định nguồn đơn vị khi ghi |
| **6** | F-105 trade (CÓ chặn) + Lịch sử Beacon/Station (CÓ chặn theo bản ghi) | 🟡 | Trung bình — thêm cột + filter |
| **7** | accesslog (lưu orgUnitId) / report Bcc157 (enforce scope) / managedasset seeder | 🟡 | Trung bình |
| — | Dashboard (M-022) | ✅ Đã chốt KHÔNG chặn | Không làm — giữ nguyên |

> Ghi chú quy trình: mọi thay đổi phải kèm migration Flyway (`src/main/resources/db/migration/`) cho thay đổi schema; mỗi đợt đi qua intake_triage để phân lớp trước khi dispatch pipeline.

---

## Phụ lục — Bằng chứng cơ chế chuẩn (đã xác minh trực tiếp)

- `DataScopeAspect.java:106-147` — bật filter; user nationwide (`orgunit:scope_all`/`admin:all`/`*`) bỏ qua orgUnit filter (Cục full); user không đơn vị → scope `[UUID(0,0)]` (0 bản ghi)
- `DataScopeAspect.java:151-177` — `collectSubtreeIds` BFS qua `orgUnitCacheService.getList()` theo `parentId`
- `OrgUnitScopeService.java:59-66` — scope = subtree đơn vị user; chỉ mở rộng khi có quyền đặc biệt
- `User.java:143-159` — `getAllPermissions()` loại `group:manage`, `admin:all`, `admin:manage`, `orgunit:scope_all`, `*` khỏi quyền kế thừa nhóm
- Danh sách entity có `@Filter(name="orgUnitFilter")` (14): Port, Pier, Berth, DryPort, WaterZone, NavigationChannel, DikeRevetment, VtsSystem, Buoy, BeaconLight, RadarStation, LighthouseStation, BuoyStation, CoastalStation*(5), ManagedAsset, ShipRepairFacility
