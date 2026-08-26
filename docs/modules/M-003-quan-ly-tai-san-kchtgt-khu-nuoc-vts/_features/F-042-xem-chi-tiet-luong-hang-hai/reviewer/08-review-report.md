# Code Review Report — F-042 Danh sách / Chi tiết Luồng hàng hải (M-003, Wave 1)

- **Stage:** engineering-code-reviewer
- **Ngày review:** 2026-08-26
- **Diff baseline:** working tree vs `ed400cf7` (F-038 state) — **F-042 là verify-only, không có delta code**
- **Nguồn đối chiếu:** `feature-brief.md`, `design/00-design-plan.md` (xác nhận hiện trạng), dev reports BE/FE, QA report
- **Verdict: Approved** (1 finding Low — pre-existing từ F-038, không phải regression wave này, không chặn)

## 1. Phạm vi review

Không có file nào thay đổi cho F-042 trong pipeline này (xác nhận: diff chỉ chạm gating nút Sửa/Xóa — thuộc F-039/F-040 — và `HistoryEntry.id` — thuộc F-043). Review = xác nhận hiện trạng list/search/detail theo brief ("verify-only").

## 2. Đối chiếu spec — kết quả xác nhận

| Yêu cầu (AC/BR) | Kết quả xác nhận (source mở trong phiên) | Verdict |
|---|---|---|
| AC-042-01/BR-042-01: list phân trang, sort `created_at DESC`, chỉ hồ sơ chưa xóa; cột #4/#5/#6/#8/#47/#48; StatusTabs | `findAll(page,size)` → `findByDeletedAtIsNull(PageRequest.of(page, size, Sort.by(DESC, CREATED_AT)))`; FE cột `channelCode`/`channelName`/`provinceId`/`conditionStatus`/`approvalStatus`/`updatedAt` + `STATUS_TAB_LIST` 6 tab (REJECTED gộp 3) | **PASS** |
| AC-042-02/BR-042-02: search 6 filter (orgUnitId, seaportId, provinceId, conditionStatus, keyword, approvalStatus), filter rỗng bỏ qua, invalid status bỏ qua | Controller `/search` bind đủ 6 param; `searchDocuments` :592-616 — null predicate bị bỏ qua; `ApprovalStatus.valueOf` fail → `log.debug` + bỏ qua; keyword `%kw.trim().toLowerCase()%` + `LOWER(l.channelName) LIKE` (BR input trim) | **PASS** |
| AC-042-03/BR-042-05: data scope đọc — user đơn vị con chỉ thấy subtree | `@DataScope` class-level (controller :25) → `DataScopeAspect.processDataScope` bật `orgUnitFilter` (subtree IDs, :145) + `recordSecurityLevelFilter` (:106); entity `@Filter(name="orgUnitFilter", condition="org_unit_id IN (:orgUnitIds)")` + `@Filter(recordSecurityLevelFilter)`; nationwide (`orgunit:scope_all`/`admin:all`/`*`) bỏ org predicate | **PASS** |
| AC-042-04: tab trạng thái chỉ trả đúng trạng thái | `searchDocuments` filter `approvalStatus`; `GET /approval-status/{status}` → `findByApprovalStatusAndDeletedAtIsNull` | **PASS** |
| AC-042-05: detail 71 trường; #47-#71 read-only; null → "—" | `toResponse(nc, includeDetails)` trả #1-#71 + `routeDetails`/`coordinateList`/`attachments`/`orgUnitName` (OrgUnitCacheService); #58-#71 không populate (F-038 chốt để trống) → FE render "—"; FE detail mode: card Descriptions #1-#21, #47-#57, #58-#71, ApprovalActionBar, HistoryTimeline | **PASS** |
| AC-042-06: GET `/{id}` ngoài phạm vi → bị chặn | `getById` → `repo.findById` qua `orgUnitFilter` → empty → "Không tìm thấy luồng hàng hải với id" (brief cho phép 400-family) | **PASS** |
| AC-042-07: thiếu `navigationchannel:read` → 403 | `@PreAuthorize` trên GET /, /{id}, /search, /approval-status/{status}; seed `navigationchannel:read` (PermissionSeeder.java:294) | **PASS** |
| BR-042-03: filter đơn vị dạng cây giữ `orgUnitId` | `OrgUnitTreeSelect` giữ `orgUnitId` (không dùng path), value gửi API là `orgUnitId` | **PASS** |

## 3. Findings

| # | Mức | Finding | Anchor | Bằng chứng | Hướng sửa |
|---|---|---|---|---|---|
| F1 | **Low** (pre-existing từ F-038, không phải regression wave này) | **Filter UI chết (dead filters):** FE gửi `channelCode`, `updatedFrom`, `updatedTo`, `updatedBy`, `sortField`, `sortOrder` tới `GET /search` nhưng backend không bind các param này (controller chỉ nhận orgUnitId/seaportId/provinceId/conditionStatus/keyword/approvalStatus/page/size) → Spring MVC bỏ qua âm thầm: ô "Mã luồng (#4)", "Cán bộ cập nhật (#49)", "Ngày cập nhật (#48)" và sort cột hiển thị nhưng không lọc/sort. Không vi phạm AC-042 (6 filter chính đều hoạt động) nhưng gây hiểu nhầm UX | `frontend/src/services/navigationChannelService.ts` search params :44-57; `NavigationChannelList.tsx` filter state :86-97 + fetchData :166-183; `NavigationChannelController.java` `/search` :139-151 | Đọc source cả 2 phía; diff wave này không chạm vùng filter (chỉ gating) | Wave sau: hoặc bind `channelCode`/`updatedFrom`/`updatedTo`/`updatedBy`/sort vào backend `/search`, hoặc gỡ UI control không dùng — chủ sở hữu PMO/SA |
| F2 | Info | Integration oracle (search/data scope qua HTTP với nhiều org-unit) chưa chạy được do Spring context fail bởi Flyway pre-existing — đã ghi nhận giới hạn, không phải lỗi code | — | QA report F-042 mục 3 | Chạy khi migration buoy_station được sửa |

## 4. Verification đã chạy (tái lập trong phiên review)

| Lệnh | Kết quả |
|---|---|
| `mvn.cmd test "-Dtest=NavigationChannelServiceTest,NavigationChannelServiceLifecycleTest"` | **18/18 pass**, BUILD SUCCESS |
| `npx tsc --noEmit` (frontend/) | exit 0 |

## 5. Pre-existing errors ngoài phạm vi (PMO đã verify)

`FlywayMigrationTest` ×2 (`buoy_station.code`) + `BeaconStationServiceTest$CreateTests` ×2 (beacon scope) — xác nhận trong `target/surefire-reports/*.txt`, KHÔNG chấm fail F-042.

## 6. Kết luận

**Approved.** AC-042-01..07 + BR-042-01..07 đáp ứng theo source anchors (endpoint, 6 filter, data scope 2 lớp filter, detail 71 trường) + gates xanh. 1 finding Low pre-existing (F1 — dead UI filters) giao PMO/SA wave sau, không chặn.
