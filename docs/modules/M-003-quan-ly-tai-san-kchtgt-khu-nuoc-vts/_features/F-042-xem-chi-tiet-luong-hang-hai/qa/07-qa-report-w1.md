# QA Report — F-042 Danh sách / Chi tiết Luồng hàng hải (M-003) — Wave 1

- **Feature:** F-042 (M-003) — Xem danh sách / chi tiết Luồng hàng hải
- **Stage:** engineering-qa-engineer-wave-1
- **Ngày chạy:** 2026-08-26 09:41 (+07)
- **Nguồn kiểm chứng:** feature-brief.md, ba/00-lean-spec.md, design/00-design-plan.md (xác nhận hiện trạng — không delta; gating Sửa/Xóa thuộc F-039/F-040, type `HistoryEntry.id` thuộc F-043), dev/05-dev-w1-list-detail-navigation-channel.md, dev/05-fe-dev-w1-list-detail-navigation-channel.md
- **Phạm vi:** Verify-only — endpoint đọc, filter set, data scope, FE list/detail đã implement từ F-038 (commit ed400cf7); wave này không sửa code.

## 1. Verification commands — output thực tế

| # | Lệnh | Kết quả | Exit |
|---|---|---|---|
| 1 | `C:\Users\trangtt1\scoop\apps\maven\current\bin\mvn.cmd test "-Dtest=NavigationChannelServiceTest,NavigationChannelServiceLifecycleTest"` (workdir: workspace root) | `Tests run: 16, Failures: 0, Errors: 0, Skipped: 0` — `NavigationChannelServiceLifecycleTest` 10/10, `NavigationChannelServiceTest` 6/6; `BUILD SUCCESS`, `Total time: 12.570 s` | 0 |
| 2 | `npx tsc --noEmit` (workdir: `frontend/`) | (no output) | 0 |
| 3 | `npx vite build` (workdir: `frontend/`) | `✓ 4044 modules transformed.` `✓ built in 1.10s`; warning chunk > 500 kB là cảnh báo có sẵn toàn repo | 0 |

## 2. Acceptance oracle — AC → test case → verdict

| AC-ID | Oracle | Kết quả thực tế (source anchor) | Verdict |
|---|---|---|---|
| AC-042-01 | Danh sách đủ cột #4/#5/#6/#8/#47/#48 + StatusTabs + filter + phân trang | FE `NavigationChannelList.tsx`: cột `channelCode`/`channelName`/`provinceId`/`conditionStatus` (badge)/`approvalStatus` (`ApprovalStatusBadge`)/`updatedAt` (sortable) `:280-320`; `STATUS_TAB_LIST` 5 tab (REJECTED gộp REJECTED/REJECTED_LEVEL1/REJECTED_LEVEL2) `:50-54`; filter đơn vị TreeSelect giữ `orgUnitId`; phân trang | **PASS** (source-verified) |
| AC-042-02 | Search 6 filter + phân trang + tổng số | Controller `GET /search` nhận `orgUnitId`/`seaportId`/`provinceId`/`conditionStatus`/`keyword`/`approvalStatus` + `page`/`size` → `service.searchDocuments` (filter rỗng/null bị bỏ qua, `approvalStatus` không hợp lệ → bỏ qua với log debug) → `SearchResultResponse` | **PASS** (source-verified) |
| AC-042-03 | Data scope đọc: user đơn vị con chỉ thấy subtree | Controller class-level `@DataScope` (`NavigationChannelController.java:25`) → `DataScopeAspect.enforceDataScopeClass` bật `orgUnitFilter` (danh sách đơn vị + subtree) + `recordSecurityLevelFilter`; entity `NavigationChannel` khai `@Filter(name="orgUnitFilter", condition="org_unit_id IN (:orgUnitIds)")` + `@Filter(name="recordSecurityLevelFilter", condition="security_level <= :maxSecurityLevel")` | **PASS** (source-verified) |
| AC-042-04 | Tab trạng thái chỉ trả đúng trạng thái | `searchDocuments` lọc `approvalStatus` (enum `ApprovalStatus.valueOf`); endpoint `GET /approval-status/{status}` → `findByApprovalStatusAndDeletedAtIsNull` cho tab nhanh | **PASS** (source-verified) |
| AC-042-05 | Chi tiết đủ #1-#71; #47-#71 read-only; null → "—" | `toResponse(nc, includeDetails)` trả 71 trường + `routeDetails`/`coordinateList`/`attachments` + `orgUnitName` (OrgUnitCacheService); FE `NavigationChannelForm.tsx` detail mode (`isDetailMode` `:97`, render `:596`): card Descriptions #1-#21, tình trạng, #47-#57, #58-#71, #46 attachments, `ApprovalActionBar` `:758`, `HistoryTimeline` `:771`; null → "—" | **PASS** (source-verified) |
| AC-042-06 | GET `/{id}` ngoài phạm vi → bị chặn | `getById` → `repo.findById` — `orgUnitFilter` active → record ngoài scope không tìm thấy → lỗi "Không tìm thấy luồng hàng hải với id" (400-family; brief cho phép "403 hoặc không tìm thấy") | **PASS** (source-verified) |
| AC-042-07 | Thiếu `navigationchannel:read` → 403 | Controller `GET /`, `GET /{id}`, `GET /search`, `GET /approval-status/{status}` đều `@PreAuthorize("@auth.check(authentication, 'navigationchannel:read')")`; seed `PermissionSeeder.java:294` | **PASS** (source-verified) |

### BR check

| BR | Kết quả | Verdict |
|---|---|---|
| BR-042-01 (page 0/20, sort `created_at DESC`, chỉ chưa xóa) | `findAll`: `Sort.by(DESC, CREATED_AT)` + `findByDeletedAtIsNull`; default page=0/size=20 (controller params) | **PASS** |
| BR-042-02 (filter rỗng bị bỏ qua) | `searchDocuments` chỉ thêm predicate khi param non-null; `approvalStatus` sai → bỏ qua | **PASS** |
| BR-042-03 (TreeSelect đơn vị giữ `orgUnitId`) | FE filter đơn vị dạng cây (OrgUnitTreeSelect) giữ giá trị `orgUnitId` | **PASS** (source-verified) |
| BR-042-04/05/06/07 | toResponse đủ trường + phân biệt null; scope bởi 2 filter; #58-#71 rỗng → "—" không placeholder; 403 khi thiếu quyền | **PASS** (source-verified) |

## 3. Findings

| # | Mức | Mô tả | Chủ sở hữu |
|---|---|---|---|
| F1 | Thông tin | Oracle tích hợp (search/data scope thực tế qua HTTP, UI 4 trạng thái loading/error/empty/data) không chạy được: Spring context fail do Flyway pre-existing `V20260822130000`; xác nhận hiện tại bằng source anchors + gate build. Gating Sửa/Xóa (F-039/F-040) và type `HistoryEntry.id` (F-043) là work order khác — đã xác nhận có mặt (xem QA report F-039 mục D4 / F-043 mục 2). | — |

## 4. Pre-existing errors ngoài phạm vi (PMO đã verify độc lập — QA xác nhận qua surefire report)

- `FlywayMigrationTest` ×2 — `V20260822130000__add_unaccent_port_buoy_search_indexes.sql:49` (`buoy_station.code` không tồn tại, SQLState 42703) — module buoy_station migration.
- `BeaconStationServiceTest$CreateTests` ×2 — `AccessDeniedException` tại `BeaconStationService.java:202` (module beacon, org-unit scope).
- Bằng chứng: surefire reports (xem F-039 QA report mục 4). **KHÔNG chấm fail F-042 vì các lỗi này.**

## 5. Coverage đã chạy / chưa chạy

- Đã chạy: 3 gate thực thi + rà soát source endpoint/filter/scope/FE.
- Chưa chạy (giới hạn): search/list/detail qua HTTP với nhiều user + org-unit khác nhau (data scope thực thi), UI E2E — cần backend + dữ liệu.

## 6. Verdict

**PASS** — toàn bộ AC-042-01..07 + BR-042-01..07 thỏa mãn theo source anchors (endpoint + filter + data scope + FE list/detail) + 3 gate xanh. Không phát hiện lệch hành vi trong phạm vi kiểm chứng.
