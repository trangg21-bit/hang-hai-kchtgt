# Dev W1 — Remove Org-Unit Approval Flow (F-003 scope shrink)

| Field | Value |
|---|---|
| Change request | TRI-1786950754582-5a51 (scope_shrink, C3 one-way door) |
| Module / Feature | M-001 (Quản trị hệ thống) / F-003 (Quản lý đơn vị) |
| Seat | engineering-backend-developer-wave-1 |
| Date | 2026-08-17 |
| Verdict | Pass |

## 1. Summary

Backend half of the org-unit approval-flow removal, executed exactly per the SA work order
(`design/00-design-plan.md` §5 DB + §6 backend). The approval state machine is fully deleted:
`OrgUnitStatus` (DRAFT/PENDING/APPROVED/REJECTED) + `OrgUnitStatusConverter`, the `status`
column + `approved_at` column + `idx_org_units_status` index on `org_units`, the
`orgunit:approve` permission, the `submit/approve/reject` service methods and controller
endpoints, the status filter (`filterUnits(status, ...)` / `findByFilters(status, ...)`), and
the `status`/`approvedAt` DTO fields. A unit's only remaining state is `operational_status`
(Sử dụng / Không sử dụng), preserved untouched together with `unit_history` CREATED audit,
rank, CRUD/tree/scope/cache.

## 2. Changed paths

### Modified — backend source (13 files)
- `src/main/java/com/hanghai/kchtg/orgunit/entity/OrgUnit.java` — removed `@Index idx_org_units_status`, `status` field, `approvedAt` field, `createRoot()` `status=DRAFT`, unused `java.time.LocalDateTime` import.
- `src/main/java/com/hanghai/kchtg/orgunit/entity/OrgUnitRank.java` — javadoc: dropped `mirroring {@link OrgUnitStatus}` clause.
- `src/main/java/com/hanghai/kchtg/orgunit/repository/OrgUnitRepository.java` — removed `OrgUnitStatus` import, `findByStatusAndDeletedAtIsNull`, `status` param/clause from `findByFilters`/`findByFiltersAndIds`.
- `src/main/java/com/hanghai/kchtg/orgunit/service/OrganizationService.java` — removed import, class-javadoc "approval workflow" phrase + BR-015 bullet, status param from both `filterUnits` overloads, `.status(...)` from `create()`, and the whole `── Approval Workflow ──` section (submitForApproval/approve/reject ×2 each).
- `src/main/java/com/hanghai/kchtg/orgunit/controller/OrgUnitController.java` — removed import, `status` `@RequestParam` + argument in `filter()`, javadoc "approval workflow", and the `── Approval workflow endpoints ──` block (POST `/{id}/submit|approve|reject`).
- `src/main/java/com/hanghai/kchtg/orgunit/dto/CreateOrgUnitRequest.java` — removed import + `status` field.
- `src/main/java/com/hanghai/kchtg/orgunit/dto/UpdateOrgUnitRequest.java` — removed import + `status` field.
- `src/main/java/com/hanghai/kchtg/orgunit/dto/OrgUnitResponse.java` — removed import, `status` + `approvedAt` fields, and their `.status(...)`/`.approvedAt(...)` mappings in `from()`.
- `src/main/java/com/hanghai/kchtg/orgunit/config/OrgUnitDataFixer.java` — removed import + `.status(APPROVED)` in root and `child(...)`.
- `src/main/java/com/hanghai/kchtg/seeder/DataSeeder.java` — removed import + `.status(APPROVED)` ×3 (root/child/addChild).
- `src/main/java/com/hanghai/kchtg/seeder/M001DataSeeder.java` — removed import + `.status(APPROVED)` ×3.
- `src/main/java/com/hanghai/kchtg/config/PermissionSeeder.java` — removed `seedPermission(definitions, "orgunit", "approve")` (kept `orgunit:manage`, `orgunit:read`).

### Deleted (2 files)
- `src/main/java/com/hanghai/kchtg/orgunit/entity/OrgUnitStatus.java`
- `src/main/java/com/hanghai/kchtg/orgunit/entity/OrgUnitStatusConverter.java`

### New (1 migration)
- `src/main/resources/db/migration/V20260817150000__drop_org_unit_approval.sql`

### Modified — test (1 file)
- `src/test/java/com/hanghai/kchtg/orgunit/service/OrganizationServiceTest.java` — removed `OrgUnitStatus` import + `@Nested ApprovalWorkflowTests` (5 tests) + `makeUnit` `.setStatus(APPROVED)`; added `OperationalStatus` import and a regression assertion `create()` returns `OperationalStatus.OPERATIONAL`.

## 3. Acceptance mapping

| Done-oracle criterion | Evidence |
|---|---|
| `mvn clean compile` exit 0 | `mvn -q clean compile -DskipTests` → "Build succeeded (34460ms, exit code 0)" |
| `OrganizationServiceTest` passes | `mvn test -Dtest=OrganizationServiceTest` → `Tests run: 13, Failures: 0, Errors: 0, Skipped: 0`, `BUILD SUCCESS` |
| No `OrgUnitStatus`/`OrgUnitStatusConverter`/`submit/approve/reject`/`orgunit:approve`/`status`/`approvedAt` remains in org-unit backend (except historical migrations + `OrgUnitSchemaMigrator`) | grep sweep of `src/main/java/com/hanghai/kchtg/orgunit` returns 0 approval tokens; only residual is `UnitHistory.java:36` javadoc listing generic audit action strings (KEPT audit entity, not approval-flow code) |
| `operational_status` + `unit_history` CREATED audit intact | `OrgUnit.operationalStatus` field + `OrganizationService.create()` `saveHistory(saved, "CREATED", ...)` untouched (KEEP list) |
| New migration file present | `V20260817150000__drop_org_unit_approval.sql` created; PostgreSQL dialect (Flyway enabled only for `local`/`prod` postgresql profiles) |

## 4. Migration dialect note

Flyway is **disabled** for `dev`/`local-h2` (H2) profiles and **enabled** only for `local` and
`prod` (PostgreSQL). The drop migration therefore targets PostgreSQL and matches existing
guarded-DDL idioms:
- `DROP INDEX IF EXISTS idx_org_units_status;` — mirrors `V20260727154100` (`DROP INDEX IF EXISTS uk_groups_name;`), the portable PostgreSQL form (index name is schema-global).
- `ALTER TABLE org_units DROP COLUMN IF EXISTS status;` / `... approved_at;` — mirrors `V20260817120000__drop_org_unit_address.sql` (`ALTER TABLE org_units DROP COLUMN IF EXISTS address;`).
- `operational_status` is KEPT (no statement touches it). No data backfill (seeders set `status=APPROVED` while `operational_status` defaulted to OPERATIONAL — the shrink makes those rows "Sử dụng", an accepted consequence per the design plan).

## 5. Verification commands (real stdout)

1. `mvn -q clean compile -DskipTests` (cwd `D:\project\hang-hai-kchtgt`) → exit code 0, no output (quiet success).
2. `mvn -q test -Dtest=OrganizationServiceTest` → exit code 0, no failures.
3. `mvn test -Dtest=OrganizationServiceTest` (no `-q`, to capture the count) → `Tests run: 13, Failures: 0, Errors: 0, Skipped: 0` / `BUILD SUCCESS` (breakdown: UniqueCodeTests 3, DeleteGuardTests 3, HierarchyTests 2, RankResolutionTests 5 — the 5 approval-workflow tests are gone).

## 6. Risks / notes

- **LSP diagnostics are false positives in this environment.** The Java language server fails to
  init (`Failed to init ct.sym for ...managed-jre-21...jrt-fs.jar` — a JRE, not a JDK), so its
  inline errors (`builder() is undefined`, `getParentId() is undefined`, "blank final field may
  not have been initialized") are spurious. The authoritative gates are `mvn compile` / `mvn test`,
  both green.
- **CRLF line endings in seeders.** `seeder/DataSeeder.java` and `seeder/M001DataSeeder.java` are
  CRLF while the `orgunit/**` and test files are LF; removal used content-only single-line edits
  (+ `replaceAll`) rather than multi-line context to avoid line-ending mismatch. Cosmetic blank
  lines remain in those two seeders' builder chains (harmless, no build impact).
- **No frontend / no server start / no git** — per out-of-scope. No historical migration edited.
- `OperationalStatus`/`operational_status`/`OrgUnitSchemaMigrator`/`UnitHistory` CREATED audit/rank
  were kept byte-for-byte; `OrgUnitCacheService` (uses `OrgUnitResponse::from`) still compiles.

## 7. Durable evidence

- [artifact] `docs/modules/M-001-quan-tri-he-thong/design/00-design-plan.md` (SA work order §5/§6)
- This report; source/test/migration changes listed in §2.
