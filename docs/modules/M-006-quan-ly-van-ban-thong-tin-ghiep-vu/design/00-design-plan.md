# Design Plan — M-006 sync scope: F-131 Incident, F-132/133/134 PortPlanning, F-128 confirm (change_type=architecture)

- module-id: M-006
- scope: F-131, F-132, F-133, F-134 (delta), F-128 (confirm-only)
- document: design-plan
- stage: engineering-solution-designer
- last-updated: 2026-09-05
- engine of record: PostgreSQL (NOT MSSQL — `application-local.yml:14` url `jdbc:postgresql://…`, `:31` PostgreSQLDialect; `application.yml:169,177`; production `ddl-auto: none` `application.yml:179`). All migration SQL below is Postgres, mirroring the house template `V20260826170000__navigation_channel_excel_71_fields.sql`.

## 1. Grounding — evidence opened this session

| Fact | Anchor |
|---|---|
| Runtime DB Postgres, ddl-auto none | `src/main/resources/application-local.yml:14,31`; `application.yml:169,179` |
| House org-scope entity pattern (inline audit, NOT BaseEntity) | `document/entity/OperationPlan.java:29` `@Filter(name="orgUnitFilter", condition="org_unit_id IN (:orgUnitIds)")`, `:55-56` `@Column(name="org_unit_id") UUID orgUnitId`; same in `MaintenancePlan.java:29,56-57` |
| House controller pattern | `document/controller/OperationPlanController.java:29` `@DataScope` (class-level); `MaintenancePlanController.java:29` |
| BaseEntity = audit + FilterDef only, NO orgUnitId | `common/entity/BaseEntity.java` (full read): `@FilterDef(name="orgUnitFilter", parameters=ParamDef orgUnitIds UUID)` at class level; fields id/createdAt/updatedAt/deletedAt/deletedBy/createdBy(UUID)/updatedBy(UUID); `@SQLRestriction("deleted_at IS NULL")` |
| F-128 = reference (already conformant) | `document/entity/LegalDocument.java:24` table legal_documents, `:30` `@FieldNameConstants`, `:31` `extends BaseEntity`, `:51,:58` `@Enumerated(EnumType.ORDINAL)` |
| Incident current state | `document/entity/Incident.java` (full read): table `incidents`; id, discovery_time, location(300), severity_level `EnumType.STRING`(30), description TEXT, processing_status `EnumType.STRING`(30), reporter(100), created_at, updated_by **String(100)**, updated_at; child `processingProgress` (orphanRemoval); @PrePersist/@PreUpdate; **no org_unit_id, no deleted_at, no created_by UUID, no @FieldNameConstants** |
| Incident DDL truth | `db/migration/V20260803370000__repair_all_schema_types_and_columns.sql:4580-4660` — incidents columns are the varchar set above; **no org_unit_id / created_by / deleted_at** |
| ProcessingProgress current child | same repair file `:9384-9424`: incident_id UUID, progress_description TEXT, updated_by VARCHAR(100), updated_at TIMESTAMP |
| PortPlanning current state | `document/entity/PortPlanning.java` (full read): table `port_planning`; project_name(200), approval_authority(200), approval_date DATE, application_scope(500), map_scale(50), status `EnumType.STRING` (PlanningStatus), file_path(500), created_by String(100), created_at, updated_by String(100), updated_at; child `planningCategories`; **no org_unit_id/deleted_at/@FieldNameConstants** |
| PortPlanning DDL truth | repair file `:9060-9154` — varchar audit; port_planning.status VARCHAR(50) holding `'HIEN_HANH'…` legacy names |
| legal_documents DDL (no org_unit_id, ORDINAL-ready) | repair file `:5710-5780` (document_type/status already INTEGER columns) |
| Controllers today | `IncidentController.java:25` `@RequestMapping("/api/v1/incidents")` (no @DataScope); `PortPlanningController.java:24` `@RequestMapping("/api/v1/port-planning")` (no @DataScope); `LegalDocumentController.java:56` `@RequestMapping("/api/v1/legal-documents")` |
| Permissions already seeded | `config/PermissionSeeder.java:143-155` portplanning:* (manage/read/create/update/delete/search), `:856-861` incident:* (manage/create/update/delete/progress), `:132-140` document:* (F-128) |
| Scope assertion service | `orgunit/service/OrgUnitScopeService.java`: `Scope.allows(UUID)` + `requireOrganizationInScope(UUID)` (AccessDeniedException with Vietnamese message); sibling usage `UserGroupService.java:78` |
| House org_unit_id backfill + fail-closed NOT NULL migration | `db/migration/V20260826170000__navigation_channel_excel_71_fields.sql:96` (users-join backfill), `:108` (RAISE EXCEPTION if remaining NULL), `:112` (SET NOT NULL), `:131` (per-org sequential code backfill via ROW_NUMBER); file header `:9` documents the fail-closed intent |
| BA spec = executed spec | `ba/00-lean-spec.md` §4.2 (BR-131-01..06), §4.3, §5.2 (BR-132-01..06), §5.3, §6 (permission matrix), §7 (SA-open items #2/#3/#4/#5), §8 (assumptions) |
| Field matrices | F-131 brief §2 (24 rows, sheet #37) + §7 child tables `incident_evolution`/`incident_handling`/`incident_file`; F-132 brief §2 (41 rows, sheet #38 shared F-132/133/134) + §7 child tables `port_planning_cargo_forecast`/`port_planning_detail`/`port_planning_file`; lean-spec §5.3 (SA chốt mapping to PlanningCategory/PlanningFile) |
| KCHT linkage inputs | `docs/inputs/HH_…(QL bến phao).csv`, `(Khu tránh, trú bão).csv`, `(Khu chuyển tải).csv` — asset modules' own detail drawers render KCHT rows read-only; they confirm asset linkage semantics (loại + mã + tên), not M-006 storage beyond `infrastructure_type/id/name` (lean-spec §8) |

## 2. Finalized decisions (this plan = SA chốt for brief §6/§7)

| # | Decision | Rationale / evidence |
|---|---|---|
| D1 | **Endpoint routes stay as-is**: `/api/v1/incidents`, `/api/v1/port-planning`, `/api/v1/legal-documents`. BA proposals `/api/incidents`, `/api/portplannings` (F-132 §6, lean §4.4/§5.4) are REJECTED — the live controllers + frontend pages already consume the `/api/v1/*` routes; renaming adds churn with no contract gain. | Controller anchors above |
| D2 | **Incident + PortPlanning adopt the OperationPlan/MaintenancePlan shape** (inline audit + orgUnitId + class-level @Filter — OperationPlan.java:29, orgUnitId OperationPlan.java:55-56), NOT extends BaseEntity: BaseEntity's audit contract (D2 anchor evidence bullets below this table) assumes auditing already writes UUIDs, while the legacy rows store display names (bullets below) — so switching to BaseEntity needs an unreliable name→UUID backfill. Copy OperationPlan's module-local seam instead; add deleted_at/deleted_by soft-delete columns + softDelete() mirroring BaseEntity (proposed additions; pattern lines in the bullets). | D2 anchor evidence bullets below — all opened/grepped this session |
| D3 | **Enums → `EnumType.ORDINAL` with explicit old-name→ordinal mapping migrations**, constants renamed English, UI labels Vietnamese-with-diacritics (label map in the enum or a UI constant — never hardcoded strings elsewhere). | AGENTS.md enum rule + lean-spec §7#5 |
| D4 | **Incident statuses** (`ProcessingStatus` type kept): RECEIVED(0,"Đã tiếp nhận")←TIEP_NHAN; PROCESSING(1,"Đang xử lý")←DANG_XU_LY; RESOLVED(2,"Đã xử lý, đang theo dõi")←DA_XU_LY; **UNRESOLVED(3,"Không thể xử lý")←new**; CLOSED(4,"Đã đóng")←DA_DONG. Tab "Chỉ đạo xử lý sự cố" renders when status ∈ {RESOLVED, UNRESOLVED, CLOSED} — matches UC-131-02/03 set verbatim. | lean-spec §4.1 UC-131-02/03; ProcessingStatus enum full read |
| D5 | **Severity** (`SeverityLevel` kept): MINOR(0,"Nhẹ")←NHE; MODERATE(1,"Trung bình")←TRUNG_BINH; SEVERE(2,"Nghiêm trọng")←NGHIEM_TRONG; CRITICAL(3,"Cực kỳ nghiêm trọng")←CUC_NGIEM_TRONG. | SeverityLevel enum full read |
| D6 | **PlanningStatus**: DRAFT(0,"Lưu tạm")←new; EFFECTIVE(1,"Ban hành/Hiện hành")←HIEN_HANH; REPLACED(2,"Đã thay thế")←DA_THAY_THE; HISTORY(3,"Lịch sử")←LICH_SU. Covers UC-134 "lưu tạm/ban hành/lịch sử" while preserving legacy REPLACED distinctness. | PlanningStatus enum full read; F-132 brief §3 note + §5#1; UC-134-01 |
| D7 | **SUPERSEDED — replaced by §2.1 D7-FINAL (2026-09-05)**: investigation proved no option-list source exists in this workspace (Excel sheet "30->43" carries only control names/scopes; no hh.csdl; no enums). Final: incident_type and damage_status are FREE TEXT (VARCHAR(100)/VARCHAR(500)), Nhóm = fixed 2-value enum PortPlanningGroup, classification/seaport_group/exploitation_function free text, cảng/cạn/berth/pier pickers are record pickers from the port module master data. This row kept for change history only — do not execute its old instructions. | §2.1 table + anchors (Buoy.java:256-259, StormShelterArea.java:64-65, BerthType.java, PierType.java, port/entity listing) |
| D8 | **F-131 children FINAL**: `incident_evolution` (diễn biến), `incident_handling` (chỉ đạo/xử lý), `incident_file` (tệp) per F-131 brief §7 — new dedicated child tables + entities `IncidentEvolution`, `IncidentHandling`, `IncidentFile`. Legacy children `processing_progress` (ProcessingProgress) and `incident_records` (IncidentRecord) are **superseded but preserved** (no drop, per repo rule "never delete working code/features without explicit request"); their entities/repos remain and are simply no longer written by the new service flow. | F-131 brief §7; repair file :9384 (processing_progress), :4572 (incident_records) |
| D9 | **F-132/133/134 children FINAL**: keep `port_planning` + existing `PlanningCategory`/`planning_categories` + `PlanningFile`/`planning_files`; ADD `port_planning_cargo_forecast` (new entity `PortPlanningCargoForecast`). The BA §7 trio maps: `port_planning_detail` → existing `planning_categories` (its phase column already models Hiện trạng/Sau quy hoạch per lean §5.3) — plan to rename/migrate `planning_categories` → `port_planning_detail`? **No**: renaming breaks the live PlanningAdjustment legacy flow (`planning-adjustments` controller/repo) that writes these tables — instead extend `planning_categories` columns to carry the detail fields, keep table/entity names. `port_planning_file` → existing `planning_files`. | lean-spec §5.3 "SA chốt ánh xạ sang PlanningCategory hiện có"; dto/PlanningFileResponse (full read) |
| D10 | Files: F-131 files use the new dedicated `incident_file` (sibling modules use dedicated `*_files` tables, e.g. planning_files); LegalDocument keeps its generic `AttachedDocument` (F-128 unchanged). | D8/D9; AttachedDocument per lean-spec §1.3 |
| D11 | Incident Mã tự sinh: `'SC-' + lpad(seq,6,'0')` partitioned per `org_unit_id` ordered by `created_at` — mirrors navigation_channel channel_code backfill (V20260826170000:127-131). Existing rows backfilled in migration. | BR-131-01 |
| D12 | `discovery_time` renamed → `occurred_from`; add `occurred_to`. Excel "Thời gian xảy ra sự cố" = RangePicker(occurred_from, occurred_to). Legacy discovery data preserved by column rename. | F-131 §2 row 4; dispatch field list |
| D13 | History: incident/port-planning state changes recorded to central `infrastructure_history` via `InfrastructureHistoryRepository` with an `InfrastructureType` constant (verify/add `INCIDENT`, `PORT_PLANNING` in `gis/search/dto/InfrastructureType.java` — F-128 uses `LEGAL_DOCUMENT` at `:29`). Not an approval flow (no C1/C2 per Excel). | lean-spec §1.4, §8; AGENTS.md audit-trail rule |
| D14 | F-128: **no delta**. LegalDocument already conforms (BaseEntity + ORDINAL + FieldNameConstants). It is deliberately NOT org-unit scoped (absent from lean-spec §7 gap list; legal docs are Cục-level documents) — do not add orgUnitId/@DataScope to legal_documents in this sync. | lean-spec §1.3 row 1, §7#2; LegalDocument anchors |

**D2 anchor evidence — existing behavior, one symbol + one anchor per line (BaseEntity.java and the repair migration opened/grepped this session):**
- `@SQLRestriction("deleted_at IS NULL")` enforced at `BaseEntity.java:29`
- `deleted_at` soft-delete column at `BaseEntity.java:61`
- `deleted_by` column at `BaseEntity.java:68`
- `created_by` UUID audit column at `BaseEntity.java:76`
- `updated_by` UUID audit column at `BaseEntity.java:84`
- `createdAt` audit field at `BaseEntity.java:49`
- `updatedAt` audit field at `BaseEntity.java:56`
- `softDelete(UUID)` method at `BaseEntity.java:107`
- `updated_by` stored VARCHAR(100) on incidents at `V20260803370000__repair_all_schema_types_and_columns.sql:4642`
- `created_by` stored VARCHAR(100) on port_planning at `V20260803370000__repair_all_schema_types_and_columns.sql:9122`
- `updated_by` stored VARCHAR(100) on port_planning at `V20260803370000__repair_all_schema_types_and_columns.sql:9139`

## 2.1 D7 FINAL — option lists / free-text fields (SA resolution 2026-09-05, unblocks FE wave)

Investigation result: no source in this workspace enumerates the option values. Excel 2.9 sheet "30->43" lists only control names/scopes (confirmed by FE dev + by re-reading both brief matrices); no `hh.csdl` exists in the workspace (`**/*csdl*` and `**/*CSDL*` globs both return 0 hits); no IncidentType/DamageStatus/planning-classification enum exists in `document/entity/`. The only `incident_type` precedent is a free `String(100)` field (`beacon/entity/Buoy.java:256-259`, comment "CSV STT 53-56, read-only"). The port module itself stores `classification` as free text `String(100)` (`port/entity/StormShelterArea.java:64-65`, free-text LIKE filters at `port/repository/StormShelterAreaRepository.java:66-68`). Per-field FINAL decision:

| Field (Excel label) | Control per matrix | FINAL | BE storage | FE widget |
|---|---|---|---|---|
| Loại sự cố (`incident_type`, F-131 row 2) | Select (no options anywhere) | **FREE TEXT** (no catalog) | `incidents.incident_type VARCHAR(100)` (nullable) | `<Input maxLength=100>`; upgrade to enum only if a catalog (Excel options tab / hh.csdl / app-params seed) is later supplied, via a new migration |
| Tình trạng thiệt hại (`damage_status`, F-131 row 10) | **InputTextArea** (F-131 brief §2 row 10 — overrides the earlier D7 "catalog code" wording) | **FREE TEXT** | `incidents.damage_status VARCHAR(500)` (nullable) | `<Input.TextArea>` |
| Nhóm (F-132 row 5) | Select (Cảng biển/Cảng cạn) — the two values ARE the matrix label | **FIXED 2-VALUE ENUM** `PortPlanningGroup { SEAPORT(0,"Cảng biển"), DRY_PORT(1,"Cảng cạn") }` (`EnumType.ORDINAL`, new file `document/entity/PortPlanningGroup.java`) | `port_planning.planning_group INT` | `<Select>` fed by the enum (branch logic per BR-132-01) |
| Nhóm cảng biển (F-132 row 7) | Select (no options anywhere; `port/entity/Port.java` has no group field) | **FREE TEXT** (filter-tolerant) | `port_planning.seaport_group VARCHAR(100)` | `<Input>` used as keyword filter |
| Phân loại cảng, bến cảng, cầu cảng (F-132 rows 18/25/28) | Select (no enumerated options) | **FREE TEXT** (precedent: port module `classification` is free text, StormShelterArea.java:64-65) | `port_planning_cargo_forecast.classification VARCHAR(100)`, `planning_categories.classification VARCHAR(100)` | `<Input>`; existing catalogs `BerthType.java` (CONTAINER/GENERAL_CARGO/SPECIALIZED/PASSENGER/MOORING_BUOY/INLAND_WATERWAY) and `PierType.java` may be offered as suggestions at FE level but are NOT bound as the stored value |
| Công năng khai thác (F-132 row 27) | Select (no options anywhere) | **FREE TEXT** | `planning_categories.exploitation_function VARCHAR(200)` | `<Input>` |
| Record pickers — Cảng biển quy hoạch (rows 4/6), Cảng cạn quy hoạch (row 8), Cảng/bến/cầu (rows 19/26) | Select | **RECORD PICKERS, not option lists** — source = existing master data of the `port` module (`port/entity/Port.java`, `DryPort.java`, `Berth.java`, `Pier.java`; services `port/service/PortService.java`, `DryPortService.java`, `BerthService.java`) | BE stores the record UUID (`seaport_id`, `dry_port_id` on `port_planning`; child rows keep their own target ids/names) | FE fetches options from the owning module's list endpoints; no new catalog |

**Storage override:** for the four free-text fields above, the column widths in §3.1/§4.1/§5 tables are superseded by this table (`incident_type` 100, `damage_status` 500, `classification`/`seaport_group` 100, `exploitation_function` 200) — use these values in the §5 migrations and the work orders. Nothing in this section changes D3-D6 (status/severity enums remain enum-backed).

## 3. F-131 — Incident entity/DTO delta (sheet #37, 24 rows)

Current columns (repair file :4580-4660 + Incident.java): id, discovery_time, location, severity_level, description, processing_status, reporter, created_at, updated_by, updated_at.

### 3.1 Field mapping (Excel row → Java/column)

| # | UI (VN) | Java field (Incident) | Column | Type / store | Δ |
|---|---|---|---|---|---|
| 1 | Đơn vị quản lý | `orgUnitId` | org_unit_id | UUID, NOT NULL | **ADD** + @Filter |
| 2 | Loại sự cố | `incidentType` | incident_type | VARCHAR(50) catalog code → promote to ORDINAL enum per D7 | **ADD** |
| 3 | Mã sự cố | `code` | code | VARCHAR(20), auto `SC-######` per org (D11) | **ADD** |
| 4 | Thời gian xảy ra | `occurredFrom`/`occurredTo` | occurred_from/occurred_to | TIMESTAMP | **RENAME** discovery_time→occurred_from + **ADD** occurred_to (D12) |
| 5 | Địa điểm xảy ra sự cố | `location` | location | VARCHAR(300) | existing |
| 6 | Loại KCHT xảy ra sự cố | `infrastructureType` | infrastructure_type | VARCHAR(100) code (D7) | **ADD** |
| 7 | Mã KCHT (chọn → tự điền Tên) | `infrastructureId` | infrastructure_id | UUID (soft ref, no FK) | **ADD** |
| 8 | Tên KCHT (disabled) | `infrastructureName` | infrastructure_name | VARCHAR(300) denormalized | **ADD** |
| 9 | Nội dung sự cố | `description` | description | TEXT | existing (do NOT add `content` — §7 proposal deduped to existing description) |
| 10 | Tình trạng thiệt hại | `damageStatus` | damage_status | VARCHAR(50) catalog code (D7) | **ADD** |
| 11 | Trạng thái sự cố | `processingStatus` | processing_status | INT — ORDINAL ProcessingStatus (D4) | convert STRING→ORDINAL |
| 12 | Ghi chú | `note` | note | VARCHAR(500) | **ADD** |
| 13-14 | Diễn biến: Thời gian từ-đến + Sự kiện | child `incidentEvolution` → `IncidentEvolution` | incident_evolution | child rows: incident_id UUID FK, from_date DATE, to_date DATE, event VARCHAR(1000) | **ADD child** |
| 15 | File thông tin sự cố | child `incidentFiles` → `IncidentFile` | incident_file | incident_id, file_name VARCHAR(255), file_path VARCHAR(500), file_type VARCHAR(50), file_size BIGINT, uploaded_at, uploaded_by | **ADD child** |
| 16-21 | Chỉ đạo/xử lý: Cán bộ chỉ đạo, Nội dung chỉ đạo, Ngày chỉ đạo, Biện pháp xử lý, Kết quả xử lý, Ghi chú | child `incidentHandling` → `IncidentHandling` | incident_handling | incident_id, handler VARCHAR(150), directive_content VARCHAR(2000), directive_date DATE, measure VARCHAR(2000), result VARCHAR(2000), note VARCHAR(500) | **ADD child** |
| 22 | File kết quả xử lý | rows of `incident_file` with `file_category='RESULT'` | incident_file.file_category | VARCHAR(20) ('INFO'|'RESULT') — one child table, two file intents (F-131 §7 single `incident_file`) | see row 15 |
| 23 | Cán bộ cập nhật | `updatedBy` | updated_by | UUID (see §5 audit) | convert |
| 24 | Ngày cập nhật | `updatedAt` | updated_at | TIMESTAMP | existing |

SeverityLevel (row-9-adjacent control, current field) also converted STRING→ORDINAL (D5).

### 3.2 Entity seams to add on `Incident.java` (+ incident child entities)
- `@FieldNameConstants` (class), `@Filter(name="orgUnitFilter", condition="org_unit_id IN (:orgUnitIds)")` (class), `orgUnitId` (org_unit_id), audit/del: `createdBy` UUID created_by, `updatedBy` UUID updated_by (column stays `updated_by`), `deletedAt`/`deletedBy`, `softDelete(UUID)` — copy OperationPlan.java seam (OperationPlan.java:29,55-56) + BaseEntity.java softDelete.
- Replace `processingProgress` collection binding only if/when legacy child is dropped (NOT this sync, D8) — new service flow persists `incidentEvolution`/`incidentHandling`/`incidentFiles`; legacy ProcessingProgress/IncidentRecord collections stay mapped but unwritten (code preservation).
- New child entities with `@FieldNameConstants`, ORDINAL where enum, FK `incident_id`, cascade ALL + orphanRemoval on Incident side.
- DTOs: `IncidentCreateRequest`/`IncidentResponse` (both exist; full rewrite of fields), new `IncidentEvolutionRequest/Response`, `IncidentHandlingRequest/Response`, `IncidentFileRequest/Response`. Response gains `orgUnitId`, `orgUnitName` (OrgUnitCacheService — AGENTS cache rule), `code`, `infrastructureType/id/name`, `damageStatus`, `note`, `occurredTo`, children lists. List responses: paged via existing `Page` (IncidentController already returns `Page<…>`).

## 4. F-132/133/134 — PortPlanning delta (sheet #38, 41 rows shared)

Current (PortPlanning.java + repair file :9060-9154): project_name, approval_authority, approval_date, application_scope, map_scale, status, file_path + legacy varchar audit. Children: planning_categories, planning_files (+ separate legacy planning_adjustments flow untouched).

### 4.1 Field mapping by Excel tab group

| Excel rows (group) | UI (VN) | Java field | Column | Δ |
|---|---|---|---|---|
| 1 | Đơn vị quản lý | `orgUnitId` | org_unit_id UUID NOT NULL | **ADD** + @Filter |
| 2 | Số quyết định quy hoạch | `decisionNumber` | decision_number VARCHAR(100) | **ADD** (BR-132-04 required) |
| 3 | Ngày quyết định quy hoạch | `decisionDate` | decision_date DATE | **ADD** (BR-132-04) |
| 4+6-8 | Cảng biển quy hoạch / Nhóm (Cảng biển/Cảng cạn) + branch selects | `planningGroup` (VARCHAR(50), D7) + `seaportId`/`seaportGroup`/`dryPortId` branch keys | planning_group VARCHAR(50), seaport_id UUID, seaport_group VARCHAR(50), dry_port_id UUID | **ADD** (branch UI logic = FE; BE stores whichever branch populated; BR-132-01) |
| 5 | Nhóm — list/filter only | derived from planningGroup (not persisted separately) | — | FE |
| 9-10 | Thông tin cập nhật (Cán bộ/Ngày) | updatedBy/updatedAt | UUID/TIMESTAMP | convert (audit) |
| 11 | Kế hoạch quy hoạch: Dự báo đến năm | `planToYear` | plan_to_year INT | **ADD** |
| 12 | Nội dung quy hoạch | `planContent` | plan_content VARCHAR(4000) | **ADD** |
| 13 | Nhu cầu sử dụng đất và mặt nước | `landWaterDemand` | land_water_demand VARCHAR(4000) | **ADD** |
| 14 | Nhu cầu vốn đầu tư | `capitalDemand` | capital_demand VARCHAR(4000) | **ADD** |
| 15 | Giải pháp thực hiện quy hoạch | `implementationSolution` | implementation_solution VARCHAR(4000) | **ADD** |
| 16 | Dự án ưu tiên đầu tư | `priorityProjects` | priority_projects VARCHAR(4000) | **ADD** |
| 17 | Tổ chức thực hiện | `implementationOrg` | implementation_org VARCHAR(4000) | **ADD** |
| 18-24 | Dự báo hàng hóa (child) | `cargoForecasts` → `PortPlanningCargoForecast` | port_planning_cargo_forecast | **ADD child** — columns per F-132 §7: id, port_planning_id FK, container_min, container_max, general_cargo_min, general_cargo_max, liquid_min, liquid_max, total_min, total_max (DOUBLE; total auto-computed BR-132-02, min ≤ max BR-132-03), note VARCHAR(500), + classification VARCHAR(50) for the Phân loại (CB/BC/CC) select and a VARCHAR target key for the cảng/bến/cầu picker (exact Excel dropdown pairing verified by dev per D7 before coding) |
| 25-38 | Danh mục chi tiết Hiện trạng / Sau quy hoạch | child `planningCategories` → extend `PlanningCategory` (keep names, D9) | planning_categories | **extend** — add per F-132 §7: port_category VARCHAR(100), port_name VARCHAR(300), exploitation_function VARCHAR(200), classification VARCHAR(100), berth_count INT, length DOUBLE (m), ship_size VARCHAR(100), capacity DOUBLE, land_area DOUBLE (m²), water_area DOUBLE (m²); phase stays (Hiện trạng/Sau quy hoạch) |
| 39 | File đính kèm | `planningFiles` → PlanningFile | planning_files | existing (PlanningFileResponse full read) — no schema Δ; wire into create/update payloads |
| (n/a) | Trạng thái ban hành (D6) | `status` | status INT ORDINAL | convert STRING→ORDINAL, enum DRAFT/EFFECTIVE/REPLACED/HISTORY (UC-134 lưu tạm/ban hành/lịch sử) |

`projectName` (existing) maps to… legacy header; Excel matrix has no "Tên quy hoạch" — KEEP `project_name` as the human-readable hồ sơ title (used by list page + legacy data) and treat "Số quyết định" as the Excel-required id field; no drop (data preservation).

### 4.2 PortPlanning entity seams
- Add `@FieldNameConstants`, class `@Filter(orgUnitFilter)`, orgUnitId + audit/del columns (same as §3.2), ORDINAL for `status`, children `cargoForecasts` (new), existing `planningCategories`/`planningFiles` mapped in request/response DTOs.
- DTOs: rewrite `PortPlanningCreateRequest`/`PortPlanningResponse` (response currently mirrors the 8 legacy fields + `planningCategories`, `createdBy` String — full read done); new `PortPlanningCargoForecastRequest/Response`; extend `PlanningCategoryResponse` with the §4.1 detail columns. Response gains orgUnitId + orgUnitName.

## 5. Flyway migration plan (`src/main/resources/db/migration/`)

Two versioned, one-way-door files (timestamp prefix per repo convention; engine Postgres):

1. `V20260905100000__x_incident_update.sql` — incidents + children + enums.
2. `V20260905110000__x_port_planning_update.sql` — port_planning + planning_categories + port_planning_cargo_forecast + enums.

Both must be written in the house guarded style of `V20260803370000` (`ADD COLUMN IF NOT EXISTS` + `information_schema` type guards) and the fail-closed backfill style of `V20260826170000:96,108,112`. Never `DROP COLUMN` existing data columns; enum + audit conversions only via guarded ALTER with explicit mapping.

### 5.1 x_incident_update.sql steps (order matters)
1. `ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS code VARCHAR(20)`, org_unit_id UUID, incident_type VARCHAR(50), occurred_to TIMESTAMP, infrastructure_type VARCHAR(100), infrastructure_id UUID, infrastructure_name VARCHAR(300), damage_status VARCHAR(50), note VARCHAR(500), created_by UUID, deleted_at TIMESTAMP, deleted_by UUID.
2. Guarded `RENAME COLUMN discovery_time TO occurred_from` (only if occurred_from absent AND discovery_time present).
3. Enum conversions (guard: only when column udt_name = 'varchar'): severity_level and processing_status → INT via explicit per-name mapping:
   - severity_level: `'NHE'→0, 'TRUNG_BINH'→1, 'NGHIEM_TRONG'→2, 'CUC_NGIEM_TRONG'→3` (else NULL → 0 default only after dev confirms no stray values; log strays in a `SELECT` check first).
   - processing_status: `'TIEP_NHAN'→0, 'DANG_XU_LY'→1, 'DA_XU_LY'→2, 'DA_DONG'→4` (3 = UNRESOLVED has no legacy rows).
   - Use `DO $$ … $$` blocks with `information_schema` guards exactly like `V20260803370000:4592-4660`.
4. Audit fix: `updated_by` VARCHAR→UUID `USING` (valid-uuid cast or NULL when name-string), `created_by` backfill: `UPDATE incidents i SET created_by = u.id FROM users u WHERE i.created_by IS NULL AND (u.full_name = i.updated_by OR u.username = i.updated_by) LIMIT…` per-row best-effort; rows with unresolvable legacy audit stay NULL created_by (NOT NULL not enforced on created_by for legacy; service always sets it for new rows).
5. **org_unit_id backfill (D2/mandatory)**: `UPDATE public.incidents i SET org_unit_id = u.org_unit_id FROM public.users u WHERE i.org_unit_id IS NULL AND i.created_by = u.id AND u.org_unit_id IS NOT NULL;` then fail-closed check mirroring `V20260826170000:96-112` (`:108` RAISE EXCEPTION with remaining count + instruction to assign org manually for legacy rows without resolvable creator; `:112` SET NOT NULL).
6. **code backfill**: `ROW_NUMBER() OVER (PARTITION BY org_unit_id ORDER BY created_at NULLS LAST, id)` → `'SC-' || lpad(rn::text, 6, '0')` for rows with NULL code (template `V20260826170000:131`); partial unique index on `(org_unit_id, code) WHERE deleted_at IS NULL`.
7. Child tables `CREATE TABLE IF NOT EXISTS` incident_evolution / incident_handling / incident_file per §3.1 (+ file_category VARCHAR(20) NOT NULL DEFAULT 'INFO').
8. Indexes: `idx_incidents_org_unit (org_unit_id)`, `(org_unit_id, created_at DESC)`, `(org_unit_id, code)`; FKs incident_id → incidents(id) (ON DELETE CASCADE for orphans is acceptable — children are cascade-managed; legacy processing_progress/incident_records untouched).

### 5.2 x_port_planning_update.sql steps
1. ADD org_unit_id UUID, decision_number VARCHAR(100), decision_date DATE, planning_group VARCHAR(50), seaport_id UUID, seaport_group VARCHAR(50), dry_port_id UUID, plan_to_year INT, plan_content/land_water_demand/capital_demand/implementation_solution/priority_projects/implementation_org VARCHAR(4000), created_by UUID, deleted_at/deleted_by.
2. status VARCHAR→INT: `'HIEN_HANH'→1, 'DA_THAY_THE'→2, 'LICH_SU'→3` (0=DRAFT has no legacy rows).
3. Audit + org_unit_id backfill + NOT NULL + indexes — identical pattern to §5.1 steps 4-5/8 (created_by currently VARCHAR(100) holding names — same guarded cast).
4. Extend `planning_categories`: ADD port_category/port_name/exploitation_function/classification VARCHARs, berth_count INT, length/capacity/land_area/water_area DOUBLE PRECISION, ship_size VARCHAR(100) (per §4.1; guarded ADD COLUMN IF NOT EXISTS).
5. `CREATE TABLE IF NOT EXISTS port_planning_cargo_forecast` per §4.1 (+ FK, index on port_planning_id).

## 6. Data-scope wiring (both entities)

1. **Entity**: class `@Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")` (OperationPlan.java:29) + `@Column(name="org_unit_id") UUID orgUnitId` (:55-56) + `@FieldNameConstants`.
2. **Controller**: class-level `@DataScope` on `IncidentController` and `PortPlanningController` (OperationPlanController.java:29). LegalDocumentController deliberately NOT scoped (D14).
3. **Write-side validation** in services (create/update methods of `document/service/IncidentService.java` + `PortPlanningService.java` — dev locates the create/update methods and inserts the guard at the top of each): `orgUnitScopeService.requireOrganizationInScope(request.getOrgUnitId())` before persist; never fall back silently to the caller's unit when the request carries orgUnitId, and reject NULL orgUnitId with a Vietnamese 400 message (BR-131-04/BR-132-01: gán trong phạm vi, không NULL).
4. **Read-side**: `@DataScope` aspect turns the Hibernate filter on; list/filter queries (paged specs) run under it — org subtree visible per AGENTS data-scope convention; Admin Cục / scope_all sees full. When response needs orgUnitName use `OrgUnitCacheService` (AGENTS cache rule) — never per-row org queries, never frontend ID→name mapping calls.
5. Children inherit scope through the parent FK (no separate filter on child tables).

## 7. API contract (final — D1) for the three frontend pages

Base routes stay `/api/v1/*`. All endpoints `@PreAuthorize` use the seeded permissions (PermissionSeeder anchors in §1). Query/body params below are the DTO field deltas; dev must confirm current method-level mappings inside each controller when rewiring payloads (only class mappings were opened this session — method signatures are located by the dev wave, not invented here).

### 7.1 IncidentList.tsx → IncidentController (/api/v1/incidents)
| Method/Path | Purpose | Auth | Key payload changes |
|---|---|---|---|
| GET `/api/v1/incidents?page=&size=&keyword=&orgUnitId=&occurredFrom=&occurredTo=&processingStatus=&incidentType=&damageStatus=` | list + filters | `incident:read` | filter params mirror §3.1; response `Page<IncidentResponse>` incl. code, orgUnitId/orgUnitName, occurredFrom/To, incidentType, infrastructureType/id/name, damageStatus, processingStatus, severityLevel, location, description, note, updatedBy, updatedAt |
| GET `/api/v1/incidents/{id}` | detail | `incident:read` | full + children `incidentEvolution`, `incidentHandling`, `incidentFiles` (each with file_category INFO/RESULT) |
| POST `/api/v1/incidents` | create | `incident:create` | `IncidentCreateRequest`: orgUnitId (required), incidentType, occurredFrom/occurredTo, location, infrastructureType/id/name, description, damageStatus, processingStatus(=RECEIVED default), note, evolution[] + handling[] + files[]; code server-generated (BR-131-01, ignored/disabled on FE) |
| PUT `/api/v1/incidents/{id}` | update | `incident:update` | same shape, full replace of child rows (cascade); tab gating {RESOLVED,UNRESOLVED,CLOSED} enforced on FE (UC-131-02/03) |
| DELETE `/api/v1/incidents/{id}` | soft delete | `incident:delete` | `softDelete(currentUserId)` — no physical delete (lean §7#5) |

### 7.2 PortPlanningList.tsx → PortPlanningController (/api/v1/port-planning) — serves F-132 create / F-133 view / F-134 update
| Method/Path | Purpose | Auth | Key payload changes |
|---|---|---|---|
| GET `/api/v1/port-planning?page=&size=&keyword=&orgUnitId=&status=&decisionFrom=&decisionTo=` | list | `portplanning:read` | response `PortPlanningResponse` + §4.1 fields |
| GET `/api/v1/port-planning/{id}` | detail (F-133) | `portplanning:read` | + planningCategories, cargoForecasts, planningFiles |
| POST `/api/v1/port-planning` | create (F-132) | `portplanning:create` | `PortPlanningCreateRequest` §4.1 incl. orgUnitId required, decisionNumber/decisionDate required (BR-132-04), branch keys per planningGroup, cargoForecasts[] min≤max + auto total (BR-132-02/03), planningCategories[], file upload ids; status default DRAFT |
| PUT `/api/v1/port-planning/{id}` | update (F-134) | `portplanning:update` | same shape; status transitions DRAFT→EFFECTIVE→(REPLACED|HISTORY) validated server-side |
| DELETE `/api/v1/port-planning/{id}` | delete | `portplanning:delete` | soft delete |

### 7.3 LegalDocumentList.tsx → LegalDocumentController (/api/v1/legal-documents)
No contract change in this sync (D14). Listed for regression: existing GET list/detail, POST, PUT, DELETE + attached-document upload endpoints remain as-is; page keeps consuming them unchanged. Any org-unit filter must NOT be added to this page.

## 8. Work orders (dev waves)

### Backend wave (single wave; files listed with exact paths)
1. **Enums**: rewrite `document/entity/SeverityLevel.java`, `ProcessingStatus.java`, `PlanningStatus.java` (English constants per D4-D6, with Vietnamese label helpers or FE label map); add ONE new enum `PortPlanningGroup` (per §2.1); the option-list fields are free text per §2.1 — no Excel-catalog dependency remains.
2. **Incident family**: extend `document/entity/Incident.java` (orgUnitId/@Filter/@FieldNameConstants/audit/del/children §3.2); add `IncidentEvolution.java`, `IncidentHandling.java`, `IncidentFile.java` under `document/entity/`; rewrite `document/dto/IncidentCreateRequest.java`/`IncidentResponse.java`; add the 3 child request/response DTOs; extend `IncidentController.java` (@DataScope class-level + payload wiring) and `document/service/IncidentService.java` (orgUnit guard + history record + soft delete + code generation on create).
3. **PortPlanning family**: extend `document/entity/PortPlanning.java`, `PlanningCategory.java` (+detail columns), add `PortPlanningCargoForecast.java`; rewrite `PortPlanningCreateRequest`/`PortPlanningResponse`; extend `PlanningCategoryResponse`, `PlanningFileResponse` untouched; add cargo-forecast DTOs; extend `PortPlanningController.java` (@DataScope) + `PortPlanningService.java` (guards, DRAFT default, status transitions, history).
4. **Migrations**: author the two files per §5; run against a scratch Postgres schema only (`mvn` compile-level verification is not DB execution; no backend server start — AGENTS rule). Confirm column pre-state with `information_schema` probes before finalizing guards.
5. **Permissions**: already seeded (§1) — verify only (`incident:*` :856-861, `portplanning:*` :143-155); no PermissionSeeder edit expected.
6. Gate: `mvn -DskipTests compile` passes; migration files reviewed against §5 checklist; report remaining-NULL counts of the fail-closed checks.

### Frontend wave (pages exist under `frontend/src/pages/document/`)
1. `IncidentList.tsx` → new list filters + create/edit drawers + detail drawer with Diễn biến/Chỉ đạo xử lý (tab gated by status per D4)/files, per list-screen + drawer conventions (ScreenHeader/FilterBar/StatusTabs/DataTable/Pagination; tokens; `DRAWER_TABLE_SCROLL_Y`); org-unit TreeSelect keeping orgUnitId; option values per §2.1 D7-FINAL (free text / PortPlanningGroup enum / port-module record pickers).
2. `PortPlanningList.tsx` → F-132 create / F-133 view / F-134 edit drawer flows with tab groups per §4.1 (branch UI by "Nhóm"), cargo table rows with auto-total and min≤max validation, detail child table proportions per `docs/conventions/drawer-table-layout-standard.md`.
3. `LegalDocumentList.tsx` → NO functional change (D14); touch only if a type error surfaces from untouched shared components.
4. Gate: affected files typecheck clean (zero IDE errors/warnings per AGENTS IDE rule); no hardcoded hex/scale values; all UI text Vietnamese-with-diacritics.

## 9. Risks & verification checklist (dev must confirm during wave, not assume)
- R1 (catalog values — RESOLVED by §2.1 D7-FINAL): no option-list source exists in this workspace (Excel sheet "30->43" enumerates none — verified by FE dev and brief re-read; no hh.csdl — glob 0 hits; no enums in document/entity; only free-String precedents Buoy.java:256-259 / StormShelterArea.java:64-65). incident_type + damage_status + planning classification/seaport_group/exploitation_function are declared FREE TEXT; Nhóm = PortPlanningGroup enum; cảng/bến/cầu pickers = port-module record pickers. No Excel-dependent Blocked path remains.
- R2 (legacy audit names): incidents/port_planning `created_by`/`updated_by` may hold display names, not UUIDs — cast guard keeps NULL; Cục (scope_all) still sees those rows; new writes always set UUIDs.
- R3: `InfrastructureType` (gis/search/dto/InfrastructureType.java:29) — verify `INCIDENT`/`PORT_PLANNING` constants exist before history recording; add them if missing (tiny, in-scope).
- R4: legacy `processing_progress`/`incident_records`/`planning_adjustments` remain live tables written by legacy paths — the new service flow must not delete rows from them (D8/D9).
- R5: migration one-way door — never re-run against a database that already applied them; Flyway versioned files are immutable once applied.

## 10. Acceptance mapping (success criteria → where satisfied)
| Success criterion | Satisfied by |
|---|---|
| (1) Entity/DTO field additions mapped to BA matrices | §3 (F-131, 24-row), §4 (F-132-134, 41-row); brief §6/§7 finalized via D1/D8/D9/D12 |
| (2) Flyway file names + org_unit_id backfill from created_by | §5 (names `V20260905100000__x_incident_update.sql`, `V20260905110000__x_port_planning_update.sql`; backfill steps 5.1.5/5.2.3 mirroring V20260826170000:96-112) |
| (3) @Filter/@DataScope/OrgUnitScopeService wiring | §6 (OperationPlan.java:29,55-56 + OperationPlanController.java:29 patterns; OrgUnitScopeService.requireOrganizationInScope) |
| (4) API contract for the 3 pages | §7 |
| (5) EnumType.ORDINAL + @FieldNameConstants both entities | §3.2/§4.2 + D3-D6 (conversion migrations §5) |
