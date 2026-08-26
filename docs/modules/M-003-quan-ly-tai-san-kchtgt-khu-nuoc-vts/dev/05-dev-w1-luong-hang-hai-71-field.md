# Dev report — Backend F-038 "Tạo mới Luồng hàng hải" (M-003) — Wave 1

- **Stage:** engineering-backend-developer
- **Feature:** F-038 — Tạo mới Luồng hàng hải (71-field Excel spec)
- **Module:** M-003 — Quản lý tài sản KCHTGT khu nước & VTS
- **Contract:** `design/00-design-plan.md` (WO-BE-1..WO-BE-10), `_features/F-038-quan-ly-luong-hang-hai-tao-moi/feature-brief.md`, `ba/00-lean-spec.md`
- **Date:** 2026-08-25

## 1. Tóm tắt

Toàn bộ 10 work order backend (WO-BE-1..WO-BE-10) đã triển khai đúng design plan đã chốt:
migration `V20260825120000` (rename + backfill + index mới), `BaseApprovableEntity` +4 field workflow,
`InfrastructureApprovalService` ghi `submitted*`/`level*ApprovalContent`, entity `NavigationChannel`
theo target schema 71-field (drop 10 cột legacy, thêm `conditionStatus`/`announcement_*`/`protection_*`/`map_*`),
`ChannelRouteDetail` rename English + extends `BaseEntity`, entity/repository mới
`NavigationChannelCoordinate`, bộ DTO write #1-#46 (loại trừ #47-#71), service codegen `LHH` +
write-scope + transaction toàn phần, controller +3 endpoint phê duyệt, repository mở rộng filter.

**Verify đã chạy:**
- `mvn -DskipTests compile` → **BUILD SUCCESS** (EXIT=0)
- `mvn test -Dtest=M003RbacSecurityTest,InfrastructureApprovalServiceTest` → **Tests run: 18, Failures: 0, Errors: 0, Skipped: 0** (BUILD SUCCESS)
- `mvn test -Dtest=F151ReportHandlerTest` → **Tests run: 5, Failures: 0, Errors: 0** (sau khi cập nhật caller bị vỡ bởi rename chốt)
- `mvn clean test -Dtest=FlywayMigrationTest` → kết quả ghi ở mục 4 (migration chain trên PostgreSQL embedded)

## 2. Chi tiết từng WO

| WO | File(s) | Nội dung | Kết quả verify |
|---|---|---|---|
| WO-BE-1 | `src/main/resources/db/migration/V20260825120000__navigation_channel_excel_71_fields.sql` | RENAME 9 cột legacy → English; ADD 10 field Excel mới + `condition_status SMALLINT NOT NULL DEFAULT 0` + 4 field approval; backfill `org_unit_id` từ `users` (fail-closed RAISE EXCEPTION nếu còn NULL) + `SET NOT NULL`; backfill `condition_status=0`; backfill `channel_code='LHH'+%06d` theo org_unit_id; DROP 10 cột ngoài Excel (`status`, `is_approved_level1/2`, `clearance_height`, `location`, `registered_area`, `operating_hours`, `recorded_date`, `quantity`, `load_capacity`); rebuild `idx_navigation_channel_dashboard (deleted_at, approval_status)`; mới `ux_navigation_channel_org_code UNIQUE (org_unit_id, channel_code) WHERE deleted_at IS NULL` + `idx_navigation_channel_org_unit`; rename bảng `chi_tiet_tuyen_luong→channel_route_detail` + 16 cột + cast 3 String→NUMERIC(19,4) USING + add `route_latest_maintenance_year`/`route_grade` + audit; drop `cong_cong`/`chuyen_dung`/`pham_vi_bao_ve_luong`; CREATE TABLE `navigation_channel_coordinate` + FK ON DELETE CASCADE + index; add 4 approval cột cho `vts_system`/`dike_revetment`/`radar_station`/`ship_repair_facility`. `province_id` backfill best-effort: không có bảng mapping code (`provinces` chỉ có id/name — V108) nên giữ giá trị V109. | Compile OK; SQL theo pattern DO-block guarded của `V20260820020000`; migration chain chạy trên embedded PG — xem mục 4 |
| WO-BE-2 | `common/entity/BaseApprovableEntity.java`, `common/entity/ApprovableEntity.java` | +4 field: `submittedAt (submitted_at)`, `submittedBy (submitted_by)`, `level1ApprovalContent (level1_approval_content VARCHAR(2000))`, `level2ApprovalContent (level2_approval_content VARCHAR(2000))`; interface thêm 4 default accessor (chỉ `BaseApprovableEntity` implement — grep xác nhận 5 entity). | Compile OK; `InfrastructureApprovalServiceTest` 14/14 pass |
| WO-BE-3 | `common/service/InfrastructureApprovalService.java` | `submit(...)` ghi `setSubmittedAt(now)` + `setSubmittedBy(userId)` (refresh cả khi gửi lại sau reject); `approveC1` approve/reject ghi `level1ApprovalContent` (#54); `approveC2` approve/reject ghi `level2ApprovalContent` (#57). Giữ nguyên Rule 14 + 4-eyes. | `InfrastructureApprovalServiceTest` 14/14 pass |
| WO-BE-4 | `navigationchannel/entity/NavigationChannel.java` | Rename/retype theo §4.1: `managementStation`, `stationCount`, `stationStaffCount`, `stationAreaSquareMeters`, `latestStationRepairMonth`, `latestDredgingVolumeCubicMeters`, `buoyCount`, `beaconCount`, `notes`; thêm `conditionStatus` (dùng enum `ConditionStatus` có sẵn, ORDINAL SMALLINT NOT NULL), `announcementDecisionNumber/Date/Issuer`, `protectionScopeMeters`, `protectionNotes`, `geometryType` (GisGeometryType ORDINAL SMALLINT), `mapIconId`, `coordinateReferenceSystem`, `displayRule`; DROP field legacy (status, location, clearanceHeight, isApprovedLevel1/2, registeredArea, operatingHours, recordedDate, quantity, loadCapacity); thêm `List<NavigationChannelCoordinate> coordinates` (cascade ALL + orphanRemoval). | Compile OK |
| WO-BE-5 | `navigationchannel/entity/ChannelRouteDetail.java` | `@Table(name="channel_route_detail")`, extends `BaseEntity` (audit + soft delete), bỏ `@PrePersist/@PreUpdate` thủ công, `@FieldNameConstants`; 17 field English: `sequenceNo`, `routeClassification`, `routeCode`, `routeName`, `routeType`, `turningBasinLocation`, `turningBasinRadiusMeters`, `verticalClearanceMeters`, `channelLengthKilometers`, `maximumDesignWidthMeters`, `minimumDesignWidthMeters`, `designDepthMeters`, `currentDepthMeters`, `designSlope`, `minimumCurveRadiusMeters`, `routeLatestDredgingVolumeCubicMeters`, `routeLatestMaintenanceYear`, `routeGrade`. | Compile OK |
| WO-BE-6 | `navigationchannel/entity/NavigationChannelCoordinate.java` (MỚI), `navigationchannel/repository/NavigationChannelCoordinateRepository.java` (MỚI) | Bảng con #45: extends `BaseEntity`, `sequence_no NOT NULL`, `longitude NUMERIC(10,7)`, `latitude NUMERIC(9,7)`; repository `findByNavigationChannelIdOrderBySequenceNoAsc`. | Compile OK |
| WO-BE-7 | 8 DTO (`NavigationChannelCreateRequest`, `NavigationChannelUpdateRequest`, `NavigationChannelResponse`, `ChannelRouteDetailRequest` (MỚI), `ChannelRouteDetailResponse`, `NavigationChannelCoordinateRequest/Response` (MỚI), `NavigationChannelAttachmentRequest` (MỚI)) | Create: 46 field nhập #1-#46, **không có** #47-#71, không nhận `channelCode` (#4)/`routeCode` (#23) (BR-038-03); `@NotNull` 3 field `orgUnitId`/`channelName`/`conditionStatus` + message tiếng Việt (BR-038-02); tất cả `@FieldNameConstants`. Response: đầy đủ 71-field view — `conditionStatus`, `submittedAt/By`, `level1/2ApprovalContent`, `routeDetails`, `coordinateList`, `orgUnitName`, audit; không còn field legacy. | Compile OK |
| WO-BE-8 | `navigationchannel/service/NavigationChannelService.java` | Codegen `LHH`+%06d theo `countByOrgUnitId` (đổi từ `NC-`), retry 1 lần khi `DataIntegrityViolationException` (unique index chặn trùng); **write-scope** `orgUnitScopeService.currentUserScope().allows(req.getOrgUnitId())` → 403 `AccessDeniedException` khi ngoài phạm vi (create + update); trim toàn bộ text input (BR-038-05); create set `approvalStatus=DRAFT` (design §6.3 — không dùng PROPOSED); lưu route details/coordinates/attachments cùng transaction (BR-038-08, `infrastructure_attachments` ref_type=NAVIGATION_CHANNEL, uploadedBy=userId); `submit(id, userId)` mới; `rejectLevel1/rejectLevel2` mới (luôn reject đúng cấp, bỏ qua payload); `softDelete(id, operatorId)` truyền audit; toResponse mới theo 71-field. | Compile OK; M003RbacSecurityTest 4/4 pass |
| WO-BE-9 | `navigationchannel/controller/NavigationChannelController.java` | MỚI: `POST /{id}/submit-approval` (`navigationchannel:update`), `POST /{id}/reject-level-1` (`navigationchannel:approvec1`), `POST /{id}/reject-level-2` (`navigationchannel:approvec2`); giữ `/approve/c1`, `/approve/c2`; đổi guard `/history` `navigationchannel:read` → `navigationchannel:history`; `DELETE` truyền operatorId; `/search` thêm filter `seaportId`, `provinceId`, `conditionStatus`. `@DataScope` class-level giữ nguyên. | Compile OK; M003RbacSecurityTest 4/4 pass (approve deny/allow paths) |
| WO-BE-10 | `navigationchannel/repository/NavigationChannelRepository.java` | `searchDocuments` mở rộng thêm `seaportId`, `provinceId`, `conditionStatus` (filter DS/Lọc #1/#2/#6/#8). | Compile OK |

## 3. Sibling callers bị ảnh hưởng bởi rename (bắt buộc cập nhật — đã sửa)

Rename field entity theo design làm vỡ compile 2 module khác (deepest shared cause = entity đã chốt, caller phải theo):

1. `gis/search/service/KchtGis155Service.java:661` — `nc.getNote()` → `nc.getNotes()`.
2. `report/handler/F151ReportHandler.java` — toàn bộ getter cũ → mới: `getChannelManagementStation→getManagementStation`, `getStationAmountt→getStationCount`, `getStationArea→getStationAreaSquareMeters`, `getLatestStationRepairDate→getLatestStationRepairMonth`, `getStationStaffAmount→getStationStaffCount`, `getLength→getChannelLengthKilometers`, `getDredgingVolume→getRouteLatestDredgingVolumeCubicMeters`, `getName→getRouteName`, `getMaxWidth→getMaximumDesignWidthMeters`, `getMinWidth→getMinimumDesignWidthMeters`, `getDepth→getDesignDepthMeters`, `getCurrentDepth→getCurrentDepthMeters`, `getCode→getRouteCode`. Cột parent `clearance_height` đã drop → "Chiều cao tĩnh không" lấy từ child `vertical_clearance_meters` (first row). Cột `cong_cong`/`chuyen_dung` đã drop → bỏ 2 cột khỏi report.
3. `report/handler/F151ReportHandlerTest.java` (test cũ dùng builder API cũ) — cập nhật builder method + bỏ assertion trên 2 cột đã drop. **Lưu ý cho verifier:** đây là hệ quả bắt buộc của design chốt (WO-BE-4/5), không phải sửa acceptance oracle; các oracle `M003RbacSecurityTest`/`InfrastructureApprovalServiceTest` không đụng.

## 4. Migration chain trên PostgreSQL (WO-BE-1 oracle)

- `mvn test -Dtest=FlywayMigrationTest` lần đầu FAIL với "Flyway Found more than one migration with version 80" — **không phải do F-038**: file cũ `V80__remove_quarantine_water_zone_type.sql` (đã được rename sang version timestamp ở src) còn sót trong `target/classes` từ build trước; file này không tồn tại trong `src/main/resources`.
- Đã chạy `mvn clean test -Dtest=FlywayMigrationTest` để loại bỏ stale `target/classes` → validation qua được V80, nhưng chain **FAIL tại migration cũ có sẵn** `V20260822130000__add_unaccent_port_buoy_search_indexes.sql:49` (CREATE INDEX `idx_buoy_station_active_code_unaccent_trgm` ON `buoy_station(code)`) — lỗi `column "code" does not exist` trên fixture UAT-shaped của test. Migration này có từ 2026-08-22, **ngoài phạm vi F-038**; migration của F-038 (`V20260825120000`) nằm cuối chain nên **chưa được thực thi** bởi test này.
- Surefire report: `Tests run: 2, Failures: 0, Errors: 2, Skipped: 0` — cả 2 lỗi đều là `V20260822130000` (migrationsApplyCleanly + migrationsAreIdempotent).
- **Kết luận WO-BE-1:** migration đã viết đủ toàn bộ rename/backfill/unique index theo §5 design (kiểm chứng bằng đọc file); pattern DO-block guarded khớp `V20260820020000` (đã chạy được trong repo). Oracle "Flyway migrate thành công trên PG" **chưa thể chạy tới** vì lỗi chain có sẵn ở migration cũ hơn — cần verifier/owner sửa `V20260822130000` (hoặc fixture) trước, sau đó chain sẽ tự chạy qua `V20260825120000`.

## 5. Ràng buộc tuân thủ

- Tên bảng/cột/field/API: **English chuẩn** (không transliterated Vietnamese); message/UI error: tiếng Việt có dấu.
- `@FieldNameConstants` trên mọi entity/DTO mới/cập nhật; không hardcode field/enum string.
- Enum xuống DB: `@Enumerated(EnumType.ORDINAL)` + SMALLINT (`conditionStatus`, `geometryType`, `approvalStatus`, `refType`) — không VARCHAR.
- `ApprovalStatus` 10 giá trị — **không thêm giá trị mới** (dùng DRAFT=0 cho lưu tạm, PENDING_APPROVAL=2, APPROVED_LEVEL1=3, APPROVED=5, REJECTED_LEVEL1/2=8/9 theo design §6.3).
- `conditionStatus` tái sử dụng enum `ConditionStatus` có sẵn (vtssystem) — không tạo enum mới.
- Data scope: `@DataScope` class-level controller + `orgUnitFilter` (entity đã khai) + write-scope `OrgUnitScopeService.Scope.allows` (pattern `UserGroupService.requireOrganizationInScope`).
- `orgUnitId` bắt buộc (DTO `@NotNull`) + backfill + `SET NOT NULL` → không bao giờ NULL.
- `orgUnitName` từ `OrgUnitCacheService` (giữ nguyên).
- Input text: trim (và rỗng→null) trước khi lưu.
- Audit: `softDelete(operatorId)`, `updatedBy` truyền từ session; attachment `uploadedBy=userId`.
- Permission: 9 code `navigationchannel:*` đã seed (không seed mới); chỉ đổi guard `/history` → `navigationchannel:history` theo design.

## 6. Rủi ro / ghi chú cho verifier

1. **FlywayMigrationTest / V80 duplicate:** cần `mvn clean` trước khi chạy migration-chain test (stale target/classes). Nếu verifier chạy test này mà không clean sẽ thấy lỗi V80 — không liên quan F-038.
2. `channel_route_detail` migration: cột cũ `sequenceno` (lowercase, tạo bởi V20260803370000) được rename → `sequence_no`; entity map đúng.
3. `latest_station_repair_month` giữ kiểu DATE (rename thuần, design §11 chốt a5).
4. `province_id` backfill: không có mapping table `location→provinces.id` (provinces chỉ có id/name) → giữ giá trị V109 (đúng design §5 bước 4 "nếu có").
5. DTO create/update không nhận `channelCode`/`routeCode` — FE không thể gửi; mã do hệ thống sinh (LHH) / để trống cho route con.
6. `NavigationChannelResponse` bỏ các field legacy (`status`, `isApprovedLevel1/2`, `clearanceHeight`, `location`, `registeredArea`, `operatingHours`, `recordedDate`, `quantity`, `loadCapacity`) — nếu FE cũ còn đọc các field này cần cập nhật (nằm trong work order FE).

## 7. Files đã thay đổi (delta)

```
M src/main/resources/db/migration/V20260825120000__navigation_channel_excel_71_fields.sql   (MỚI)
M src/main/java/com/hanghai/kchtg/common/entity/BaseApprovableEntity.java
M src/main/java/com/hanghai/kchtg/common/entity/ApprovableEntity.java
M src/main/java/com/hanghai/kchtg/common/service/InfrastructureApprovalService.java
M src/main/java/com/hanghai/kchtg/navigationchannel/entity/NavigationChannel.java
M src/main/java/com/hanghai/kchtg/navigationchannel/entity/ChannelRouteDetail.java
A src/main/java/com/hanghai/kchtg/navigationchannel/entity/NavigationChannelCoordinate.java
A src/main/java/com/hanghai/kchtg/navigationchannel/repository/NavigationChannelCoordinateRepository.java
M src/main/java/com/hanghai/kchtg/navigationchannel/repository/NavigationChannelRepository.java
M src/main/java/com/hanghai/kchtg/navigationchannel/service/NavigationChannelService.java
M src/main/java/com/hanghai/kchtg/navigationchannel/controller/NavigationChannelController.java
M src/main/java/com/hanghai/kchtg/navigationchannel/dto/NavigationChannelCreateRequest.java
M src/main/java/com/hanghai/kchtg/navigationchannel/dto/NavigationChannelUpdateRequest.java
M src/main/java/com/hanghai/kchtg/navigationchannel/dto/NavigationChannelResponse.java
M src/main/java/com/hanghai/kchtg/navigationchannel/dto/ChannelRouteDetailResponse.java
A src/main/java/com/hanghai/kchtg/navigationchannel/dto/ChannelRouteDetailRequest.java
A src/main/java/com/hanghai/kchtg/navigationchannel/dto/NavigationChannelCoordinateRequest.java
A src/main/java/com/hanghai/kchtg/navigationchannel/dto/NavigationChannelCoordinateResponse.java
A src/main/java/com/hanghai/kchtg/navigationchannel/dto/NavigationChannelAttachmentRequest.java
M src/main/java/com/hanghai/kchtg/gis/search/service/KchtGis155Service.java            (caller fix)
M src/main/java/com/hanghai/kchtg/report/handler/F151ReportHandler.java               (caller fix)
M src/test/java/com/hanghai/kchtg/report/F151ReportHandlerTest.java                   (caller fix — xem mục 3)
```

## 8. Kết quả verify cuối

- `mvn -DskipTests compile` → **BUILD SUCCESS** (EXIT=0) ✅
- `mvn test -Dtest=M003RbacSecurityTest,InfrastructureApprovalServiceTest` → **Tests run: 18, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS** ✅
- `mvn test -Dtest=F151ReportHandlerTest` → **Tests run: 5, Failures: 0, Errors: 0** ✅
- `mvn clean test -Dtest=FlywayMigrationTest` → **Tests run: 2, Errors: 2** ❌ — cả 2 lỗi tại migration cũ có sẵn `V20260822130000:49` (`buoy_station.code` không tồn tại trên fixture), không thuộc F-038; migration `V20260825120000` chưa được chain chạy tới (xem mục 4).

## 9. Rework round (QA/reviewer Changes-requested) — 2026-08-25

QA (`qa/07-qa-report-w1.md`) + reviewer (`reviewer/08-review-report.md`) trả **Changes-requested** với 2 defect blocking (F1, BR-038-03) + 2 minor (F5, F2). Đã sửa toàn bộ trong source + thêm regression tests (mục 10).

| Fix | Mức | Root cause | Fix anchor | Verify |
|---|---|---|---|---|
| F1 | Blocking (AC-038-01) | FE gửi query param `approvalStatus` (camelCase) nhưng BE bind `@RequestParam(name = "ApprovalStatus")` — Spring bind case-sensitive → filter luôn null → StatusTabs count/filter trả toàn bộ rows | `NavigationChannelController.java` search: `@RequestParam(name = "approvalStatus", required = false) String approvalStatus` + forward cùng tên; `NavigationChannelRepository.java:36,43`: JPQL `:ApprovalStatus` → `:approvalStatus`, `@Param("ApprovalStatus") ApprovalStatus ApprovalStatus` → `@Param("approvalStatus") ApprovalStatus approvalStatus`; service `searchDocuments(... String statusStr ...)` giữ nguyên (không có token `ApprovalStatus` làm tên param/JPQL — đã grep xác nhận 0 match) | `NavigationChannelServiceTest` 6/6 pass (2 controller-binding + 2 service-parse) |
| BR-038-03 | Blocking | `routeCode` (#23) "Tự sinh" nhưng chưa bao giờ được set — `toRouteDetail` omit `.routeCode(...)` → `ChannelRouteDetail.routeCode` persist NULL → F151 `maTuyenLuong` rỗng (`F151ReportHandler.getRouteCode`) | `NavigationChannelService.java` `toRouteDetail(d, nc, index)`: `routeCode = nc.getChannelCode() + "-" + String.format("%02d", sequenceNo)`; `sequenceNo` null → `index + 1` (vị trí dòng) → không bao giờ NULL; 2 call site (create `attachChildren` + update) truyền index; KHÔNG thêm PrePersist/DB default, KHÔNG đổi cột sang NOT NULL (legacy rows có thể null) | `NavigationChannelServiceTest` routeCode 2/2 pass (format `{channelCode}-{NN}` + fallback index) |
| F5 | Minor | Literal `"REJECTED"` ở `rejectLevel1`/`rejectLevel2` (`NavigationChannelService.java:389,399`) | Thay bằng `ApprovalStatus.REJECTED.name()` (import sẵn; runtime value giữ nguyên). **Ghi nhận:** `rejectLevel1/2` có thể nên dùng `REJECTED_LEVEL1/REJECTED_LEVEL2` (8/9) về mặt ngữ nghĩa — theo dispatch KHÔNG đổi (cần BA/SA chốt) | Compile OK + 24/24 test pass |
| F2 | Minor | `ApprovalRequest.java:21` message `@NotBlank` chưa có dấu | → `"Trạng thái không được để trống"` (tiếng Việt có dấu) | Compile OK |

## 10. Regression tests (rework) — `src/test/java/com/hanghai/kchtg/navigationchannel/NavigationChannelServiceTest.java` (MỚI)

Pure Mockito unit tests (không Spring context — không phụ thuộc Flyway/DB; theo convention `InfrastructureApprovalServiceTest`).

- `search_bindsCamelCaseApprovalStatusParam` — standalone MockMvc: `/search?approvalStatus=PROPOSED` → service nhận `"PROPOSED"` (chứng minh binding camelCase đúng).
- `search_doesNotBindPascalCaseApprovalStatusParam` — `/search?ApprovalStatus=PROPOSED` (sai case, hành vi cũ) → service nhận `null` (chứng minh defect F1).
- `searchDocuments_forwardsParsedApprovalStatus` — service parse `"  PROPOSED  "` (trim) → `ApprovalStatus.PROPOSED` → repo.
- `searchDocuments_ignoresInvalidStatus` — status lạ → repo nhận `null` (không crash, bỏ qua filter).
- `toRouteDetail_generatesRouteCodeFromSequenceNo` — `LHH000001` + sequenceNo 3 → routeCode `LHH000001-03`, sequenceNo 3.
- `toRouteDetail_routeCodeFallsBackToListIndex` — sequenceNo null + index 2 → routeCode `LHH000042-03`, sequenceNo = 3 (không bao giờ NULL).

## 11. Verify rework (chạy trong bash của dev — `C:\Users\trangtt1\scoop\apps\maven\current\bin\mvn.cmd`)

- `mvn -DskipTests compile` → **BUILD SUCCESS** (EXIT=0) ✅
- `mvn -Dtest=NavigationChannelServiceTest test` → **Tests run: 6, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS** ✅
- `mvn -Dtest=NavigationChannelServiceTest,M003RbacSecurityTest,InfrastructureApprovalServiceTest test` → **Tests run: 24, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS** ✅ (NavigationChannelServiceTest 6/6 mới; M003RbacSecurityTest 4/4 — Spring context boot OK trên profile `test`; InfrastructureApprovalServiceTest 14/14)
- FlywayMigrationTest: fail pre-existing `V20260822130000:49` (`buoy_station.code`) — **ngoài scope F-038, không sửa** (giữ nguyên kết luận mục 4).

**Files delta rework:**

```
M src/main/java/com/hanghai/kchtg/navigationchannel/controller/NavigationChannelController.java  (F1)
M src/main/java/com/hanghai/kchtg/navigationchannel/repository/NavigationChannelRepository.java   (F1)
M src/main/java/com/hanghai/kchtg/navigationchannel/service/NavigationChannelService.java         (BR-038-03 + F5)
M src/main/java/com/hanghai/kchtg/navigationchannel/dto/ApprovalRequest.java                     (F2)
A src/test/java/com/hanghai/kchtg/navigationchannel/NavigationChannelServiceTest.java             (regression 6 tests)
```

**Ngoài scope rework (ghi nhận cho verifier):** các finding khác của reviewer thuộc FE/report — `fontSize:12` `NavigationChannelForm.tsx:1027` (frontend, không đụng) và F151 classification `congCong/chuyenDung` đã drop cùng migration (design chốt) — không nằm trong work order backend round này.
