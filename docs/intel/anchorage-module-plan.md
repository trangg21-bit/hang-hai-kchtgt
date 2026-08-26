# Plan: Module Quản Lý Khu Neo Đậu (Anchorage)

## Tổng quan
- Pattern: Clone từ Berth (Bến cảng)
- Source: CSV 57 trường + Berth pattern
- Triage: C3 (full_pipeline) - record: TRI-1787628018539-33ab
- Change type: implementation → pipeline vào stage engineering-solution-designer

## Trạng thái hiện tại

### ✅ ĐÃ HOÀN THÀNH:
1. **Entity**: `src/main/java/com/hanghai/kchtg/port/entity/Anchorage.java` ✅
   - 151 dòng, đầy đủ 57 trường theo CSV
   - @SuperBuilder, @FieldNameConstants, @Filter orgUnitFilter + recordSecurityLevelFilter
   - @RecordSecurityLevel, @Table(uniqueConstraint=anchorage_code)
   - Fields: securityLevel, anchorageCode, anchorageName, portId, orgUnitId, navigationChannelId, buoyStationId, provinceId, detailedLocation, operationalStatus, shapeDescription, area, designWaterDepth, currentWaterDepth, bottomElevationDesign, maxVesselDWT, activeAnchorageCount, publishedAnchorageCount, underInvestmentAnchorageCount, remarks, openingAnnouncementDate, publicDecision, investmentAgreement, activityStatus, submittedForApprovalAt, submittedForApprovalBy, portAuthorityApprovedAt, portAuthorityApprovedBy, portAuthorityApprovalContent, departmentApprovedAt, departmentApprovedBy, departmentApprovalContent, rejectionReason

### ⏳ CHƯA LÀM - CẦN DISPATCH PMO:

#### Phần 2: DTOs (3 files)
- **CreateAnchorageRequest.java**: @Data, validation (NotBlank, NotNull, Size), saveAction
- **UpdateAnchorageRequest.java**: @Data, validation, saveAction, @NotNull cho id
- **AnchorageResponse.java**: @Builder, @Data, portName, orgUnitName, audit fields
- Path: `src/main/java/com/hanghai/kchtg/port/dto/anchorage/`

#### Phần 3: Repository
- **AnchorageRepository.java**: JpaRepository + search unaccent + countByApprovalStatus
- Path: `src/main/java/com/hanghai/kchtg/port/repository/`

#### Phần 4: Services (2 files)
- **AnchorageService.java**: CRUD + generateCode + attachments + audit
  - Inject: AnchorageRepository, PortRepository, UserResolverService, OrgUnitCacheService, PortCacheService, AttachmentRepository, SecurityUtils
- **AnchorageApprovalService.java**: 2 cấp (CANG_VU → CUC)
  - Methods: approve, reject, getHistory, getAllHistory
  - EntityType = "Anchorage"
- Path: `src/main/java/com/hanghai/kchtg/port/service/`

#### Phần 5: Controller
- **AnchorageController.java**
- @RequestMapping("/api/v1/anchorage"), @DataScope, @PreAuthorize(anchorage:*)
- Endpoints: CRUD + approve + reject + history + attachments + generate-code
- Path: `src/main/java/com/hanghai/kchtg/port/controller/`

#### Phần 6: Migration SQL
- **V120__create_anchorages.sql**: CREATE TABLE anchorages + indexes
- Path: `src/main/resources/db/migration/`

#### Phần 7: Permission Seeder
- Edit: `PermissionSeeder.java` thêm 6 permissions: anchorage:read/create/update/delete/approve/history

#### Phần 8: FE Types
- Edit: `frontend/src/types/port.ts` thêm Anchorage interfaces

#### Phần 9: FE Service
- Edit: `frontend/src/services/portService.ts` thêm anchorageCRUD

#### Phần 10-12: FE Pages (3 files)
- **AnchorageListPage.tsx**: ScreenHeader + FilterBar + StatusTabs + DataTable + Pagination + Modal + Drawer
- **AnchorageForm.tsx**: Form fields theo CSV + validation tiếng Việt
- **AnchorageDetailContent.tsx**: Tab sections + sub-tables + approval history
- Path: `frontend/src/pages/anchorage/`

#### Phần 13: FE Router
- Edit: `frontend/src/App.tsx` thêm lazy import + route + PermissionGuard

## Thứ tự thực hiện (PMO)
1. ✅ Entity (Đã làm)
2. → DTOs (3 files)
3. → Repository
4. → Services (2 files)
5. → Controller
6. → Migration SQL
7. → Permission Seeder
8. → FE Types
9. → FE Service
10. → FE Pages (3 files)
11. → FE Router (App.tsx)
12. → Verify build (mvn + tsc)

## Quy tắc BẮT BUỘC
- KHÔNG hardcode màu hex → dùng tokens.ts
- KHÔNG viết fully qualified names → dùng import
- Lombok: @FieldNameConstants (Entity), @Data (DTOs), @Builder (Response)
- @Enumerated(EnumType.ORDINAL) cho enums
- Validation messages tiếng Việt
- Response messages tiếng Việt
- Code variables tiếng Anh
- @DataScope cho Controller
- @PreAuthorize cho endpoints
- Entity nghiệp vụ có org_unit_id + @Filter
- Migration: CREATE TABLE IF NOT EXISTS + indexes
- Attachment: EntityType = "ANCHORAGE"
- ApprovalLog: EntityType = "Anchorage"
- Mã tự sinh: "{port_code}-ND-{seq}"

## Verification
- BE: `mvn clean compile -q`
- FE: `npx tsc --noEmit -p frontend/tsconfig.app.json`

## Triage Record
- File: `docs/intel/_intake/TRI-1787628018539-33ab.json`
- Class: C3 (full_pipeline)
- Next: Dispatch pmo-software-project-manager với brief mang record pointer
