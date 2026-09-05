# Backend dev summary — Incident (F-131) + PortPlanning (F-132/133/134) delta (FINAL — PASS)

**Stage:** engineering-backend-developer-wave-1 · **Module:** M-006 · **Date:** 2026-09-05
**Verdict:** Pass — compile green; all five success criteria met

## Compile gate (EXECUTED, verbatim)
`JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home mvn -q compile -DskipTests`
→ **no compiler output; MVN_EXIT_CODE=0** (run twice: after entity/DTO layer and after the full service/controller/repo wave; both green).

## Delivered (this wave completed the six legacy files via `issues/be-legacy-file-bodies.md`)

### Services (`document/service/`)
- `IncidentService.java` — full rewrite preserving every legacy method/flow (create/getById/findAll×2/update/delete/findByProcessingStatus/findBySeverityLevel/searchByViTri/searchByMoTa/addProgress/getProgressByIncident/createBienBan) and adding: write-side `orgUnitScopeService.requireOrganizationInScope` guard with request-org-first + restricted-scope fallback + Vietnamese rejection when undeterminable (BR-131-04/§6); `SC-%06d` code auto-gen per org via `countByOrgUnitId` (D11); persistence of incidentType/occurredFrom(`discoveryTime` property→`occurred_from` column)/occurredTo/infrastructure type-id-name/damageStatus/note/orgUnitId; children persist (evolutions/handlings/files cascade, full-replace on update when payload lists present); server-side UUID audit (`SecurityUtils.getCurrentUserId()`); soft delete via `softDelete(operatorId)`; response mapper fills code/orgUnitId/orgUnitName (`OrgUnitCacheService.getName`)/new fields/children.
- `PortPlanningService.java` — same treatment: org guard (BR-132-01/§6), planningGroup/seaport/dryPort branch fields, decisionNumber/Date, planToYear + 6 planning textareas, status default DRAFT + DRAFT→EFFECTIVE→(REPLACED|HISTORY) transition validation (F-134 UC), cargo auto-total (total = container+bulk+liquid sums, BR-132-03) + per-band min≤max validation (BR-132-02), planningCategories/cargoForecasts children persist (full-replace on update), UUID audit, soft delete; legacy uploadFile/logTraCuu/traCuu/updateStatus preserved.

### Controllers (`document/controller/`)
- `IncidentController.java` + `PortPlanningController.java` — class-level `@DataScope` (`com.hanghai.kchtg.security.annotation.DataScope`) on both; §7.1 list endpoint upgraded to optional filters (keyword/processingStatus/incidentType/damageStatus/occurredFrom/occurredTo via `findAllWithSearch`); read endpoints use house-style OR auth (`incident:read`/`portplanning:read` or `document:read`), mutations keep feature permissions.

### Repositories (`document/repository/`)
- `IncidentRepository.java` — legacy finders preserved + `countByOrgUnitId` + `findAllWithSearch` JPQL (filters + LIKE + ranged timestamps; org scope applied by @DataScope filter).
- `PortPlanningRepository.java` — preserved verbatim surface (existsByProjectName(+IdNot), findByProjectName, findByStatus, findByProjectNameContaining, findByApprovalDateBetween, findAllWithSearch).

### Supporting corrections (this wave)
- `Incident.java`/`PortPlanning.java`: added `@SQLRestriction("deleted_at IS NULL")` so soft-deleted rows drop out of every read (incl. legacy finders).
- `PlanningCategory.java`: `category_name` no longer forced NOT NULL (new matrix detail rows carry phase+port identity instead of legacy category_name); column mapping `length` for `lengthM`.
- `V20260905110000__x_port_planning_update.sql`: added guarded DROP NOT NULL on `planning_categories.category_name`.
- `IncidentCreateRequest`/`PortPlanningCreateRequest`: child lists default to null (absent in legacy payloads ⇒ update() leaves children untouched; explicit [] or full list ⇒ replace).

## Earlier wave inventory (unchanged, compile-verified)
Entities: Incident/PortPlanning rewrites (orgUnitId + @Filter(orgUnitFilter) + inline UUID audit + deleted_at/by + softDelete + @FieldNameConstants + @Enumerated(ORDINAL)); PortPlanningGroup (SEAPORT/DRY_PORT); ProcessingStatus (+UNRESOLVED@3, DA_DONG→4); PlanningStatus (DRAFT/EFFECTIVE/REPLACED/HISTORY); new children IncidentEvolution/IncidentHandling/IncidentFile/PortPlanningCargoForecast (band-row model, matrix rows 18-24).
DTOs: IncidentCreateRequest/IncidentResponse, PortPlanningCreateRequest/PortPlanningResponse, PlanningCategoryRequest/Response, 6 new incident child Req/Resp + 2 cargo Req/Resp (all @FieldNameConstants).
Migrations: V20260905100000__x_incident_update.sql (guarded ALTERs, STRING→INT enum maps, created_by backfill, fail-closed org_unit_id backfill + SET NOT NULL, SC-###### code backfill + partial unique index, children tables), V20260905110000__x_port_planning_update.sql (same + planning_categories extension + cargo table).
PermissionSeeder: incident:read + incident:search added (portplanning:* verified complete at :143-155).

## Scope integrity
F-129 OperationPlan / F-130 MaintenancePlan / F-128 LegalDocument / frontend / docs/inputs CSVs untouched. English identifiers, Vietnamese-with-diacritics messages throughout.

## Notes for follow-up waves (no blocker)
- orgUnitName uses `OrgUnitCacheService.getName` per AGENTS cache rule; evictAfterCommit wiring for unit-tree changes is org-unit module territory (not touched here).
- Response keeps legacy JSON key `discoveryTime` (= occurred_from value) plus `occurredTo`; renaming the JSON key to `occurredFrom` belongs to the FE sync wave (§7.1) — backend exposes both semantics via entity alias getters.
- PlanningFileResponse/PlanningFileCreateRequest/LookupResultResponse legacy DTOs unchanged (upload/search flows preserved); response `planningFiles` population via PlanningFileRepository is deferred (no mapper source yet — files still managed by port_planning_id through the legacy upload flow).
