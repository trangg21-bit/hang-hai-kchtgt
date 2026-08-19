# QA Report — Wave 1: Acceptance Oracle (M-001 org-unit approval-flow removal)

- Module / Feature: `M-001-quan-tri-he-thong` / `F-003-quan-ly-don-vi` (Quản lý đơn vị)
- Triage: `TRI-1786950754582-5a51` (scope_shrink, C3 one-way door, 27 edit-target files)
- Stage / wave: engineering-qa-engineer, wave 1 (oracle authoring)
- Date: 2026-08-17
- Status: **ORACLE AUTHORED — implementation absent, nothing executed against post-change code in this wave** (backend-dev / frontend-dev waves are pending per the pipeline log; this report is the executable contract for wave 2). The only criterion executed at authoring time is AC-docs-1 on `qa/qa-test-cases.md` (this seat's own edit, verified after edit).

## 1. Sources

| Source | Role |
|--------|------|
| `docs/intel/_intake/TRI-1786950754582-5a51.json` | `request_summary` (line 4) + `done_oracle` (line 87): "Tạo/sửa/xóa đơn vị chạy bình thường, chỉ còn trạng thái Sử dụng/Không sử dụng (operational_status); không còn bất kỳ UI/API/enum/cột/permission nào thuộc luồng phê duyệt đơn vị; backend compile + OrganizationServiceTest pass + frontend build pass không lỗi tsc mới" |
| `docs/modules/M-001-quan-tri-he-thong/design/00-design-plan.md` | §2 verified footprint (file-by-file anchors: OrgUnit.java L42/97/132/147, OrganizationService.java L236/243/308/516-615, OrgUnitController.java L173/236/252/269, OrgUnitRepository.java L84-104, DTOs, seeders, PermissionSeeder.java L45, permissions.ts L30, organizationService.ts L27/62/68/593/748/783/820, UnitList.tsx L21-22/198-219/228-229/283-284/346-349/370-372/413-439, UnitForm.tsx L50/63, UnitTree.tsx L10-16/35-36, mockData.ts L22/210-225, OrganizationServiceTest.java L8/173-254/404); §3 target state; §4 KEEP list; §5 DB-01 guarded drop DDL; §10 acceptance mapping (done_oracle → verification) |
| `docs/modules/M-001-quan-tri-he-thong/_features/F-003-quan-ly-don-vi/qa/qa-test-cases.md` | Catalog edited this wave: 8 approval cases removed (TC-009/010/011/012/018/030/034/043), 45 → 37 cases |

## 2. Change under test

Per design plan §1/§3: completely remove the org-unit approval flow so a unit's only state is the **operational status (Sử dụng / Không sử dụng)** carried by `operational_status`. Removed: `status` + `approved_at` columns and `idx_org_units_status` index, `OrgUnitStatus` enum + converter, `submit/approve/reject` service methods and controller endpoints, `orgunit:approve` permission, `status` filter, frontend approval actions/badges/status tabs, approval test cases, and all F-003 documentation content. **Kept (explicit KEEP list, design §4):** `operational_status` + `OperationalStatus` enum + `OrgUnitSchemaMigrator`, `unit_history` + `CREATED` audit, materialized path / rank / tree / search / soft-delete / org-unit cache, historical migrations V18/V19/V102/V112, other entities' approval flows.

## 3. Acceptance criteria (the oracle)

Every criterion is checkable. **Wave 1 does not execute the code criteria** (implementation absent); they are the contract for wave 2. Grep scopes are deliberate: `approve`/`reject` exist in OTHER entities (`ApprovalService`, port/berth `approveC1/C2`) — every removal grep is scoped to the org-unit package / org-unit frontend feature only, so a hit elsewhere is NOT a violation (see AC-scope).

### AC-removal-be — backend org-unit approval flow fully gone

| ID | Oracle (checkable) | Pass condition | Source |
|----|--------------------|----------------|--------|
| AC-removal-be-1 | Files `src/main/java/com/hanghai/kchtg/orgunit/entity/OrgUnitStatus.java` and `OrgUnitStatusConverter.java` | Files deleted (glob = 0) | design §2 row "Enum + converter"; intake edit_target_files |
| AC-removal-be-2 | grep `OrgUnitStatus` in `src/main/java` + `src/test/java` | **0 hits** (enum gone; no remaining reference in entity/service/controller/repo/DTO/seeder/test) | design §2 rows 1-4/6-14; §10 row 2 |
| AC-removal-be-3 | grep `approvedAt` in `src/main/java/com/hanghai/kchtg/orgunit/**` and `src/test/java/com/hanghai/kchtg/orgunit/**` | **0 hits** (entity L132, DTO mapping, test helpers removed) | design §2 rows 2/8/14 |
| AC-removal-be-4 | grep `submitForApproval` in `src/main/java` | **0 hits** (OrganizationService L516-554 removed) | design §2 row "Approval service methods" |
| AC-removal-be-5 | grep `/submit|/approve|/reject` mapped in `src/main/java/com/hanghai/kchtg/orgunit/controller/OrgUnitController.java` (POST `/{id}/submit|approve|reject` L236/252/269) | **0 hits** — controller exposes only CRUD + `/tree` + `/search` + `/filter` | design §2 rows "Approval endpoints"; §3 "API surface" |
| AC-removal-be-6 | grep `@PreAuthorize.*orgunit:approve` in `src/main/java` | **0 hits** | design §2 row "Approval endpoints" (L252) |
| AC-removal-be-7 | grep `findByStatusAndDeletedAtIsNull` in `src/main/java` | **0 hits** (OrgUnitRepository L84-85 removed) | design §2 row "Status repo queries" |
| AC-removal-be-8 | grep `OrgUnitStatus|status` as a request/response/filter member in `CreateOrgUnitRequest.java`, `UpdateOrgUnitRequest.java`, `OrgUnitResponse.java`, and `OrgUnitController.java filter()` (L173 `@RequestParam ... OrgUnitStatus status`) | **0 hits** — DTOs carry `operationalStatus` only; `filter` keeps `level`, drops `status` | design §2 rows "DTO status/approvedAt", "Filter status request param"; §3 |
| AC-removal-be-9 | grep `OrgUnitStatus|\.status\(|APPROVED|DRAFT` in `orgunit/config/OrgUnitDataFixer.java`, `seeder/DataSeeder.java`, `seeder/M001DataSeeder.java` | **0 hits** — seeders no longer force approval status (`.status(OrgUnitStatus.APPROVED)` removed) | design §2 row "Seeders force APPROVED" |
| AC-removal-be-10 | grep `"orgunit", "approve"` / `orgunit:approve` in `src/main/java/com/hanghai/kchtg/config/PermissionSeeder.java` | **0 hits** — L45 `seedPermission(definitions, "orgunit", "approve")` removed | design §2 row "Permission seed"; §3 "Permission surface" |

### AC-removal-fe — frontend org-unit approval flow fully gone

| ID | Oracle (checkable) | Pass condition | Source |
|----|--------------------|----------------|--------|
| AC-removal-fe-1 | grep `orgunit:approve` in `frontend/src/constants/permissions.ts` | **0 hits** — `APPROVE: 'orgunit:approve'` (L30) removed | design §2 row "Frontend permission" |
| AC-removal-fe-2 | grep `orgunit:approve` in `frontend/src` | **Exactly 2 allowed legacy hits**: `frontend/src/store/permissionStore.ts:24` and `permissionStore.test.ts:91` (literal strings, out of footprint, still type-check) — 0 hits anywhere else | design §2 compile-break sweep; §4 KEEP row "permissionStore legacy" |
| AC-removal-fe-3 | grep `submit\(|approve\(|reject\(` in `frontend/src/services/organizationService.ts` | **0 hits** — methods L748/783/820 removed | design §2 row "Frontend status type + calls" |
| AC-removal-fe-4 | grep `\bstatus\b` (approval-status meaning) in `organizationService.ts` (`Organization.status` L27, `UpdateOrganizationPayload.status` L62, `OrgFilters.status` L68, normalizer mappings L146/263/285/324/414/467/546/615/766/803/840/874, create body `status: "DRAFT"` L593, update mocks L644/674) | **0 hits** — `operationalStatus` remains but no `status` member; `OrgFilters` keeps level/parentId/search, drops `status` | design §2 rows "Frontend status type + calls"; §13 "Remove OrgFilters entirely" |
| AC-removal-fe-5 | grep `STATUS_COLORS|STATUS_LABELS|getStatusKey|statusTabs` in `frontend/src/pages/organizations/UnitList.tsx` | **0 hits** — L21-22/283-284/346-349 removed; tabs/badges derive from `operationalStatus` only | design §2 row "Frontend approval UI"; §3 "UI" |
| AC-removal-fe-6 | grep `submit|approve|reject` (handler/action identifiers, e.g. row-action items L228-229, handlers L198-219, badges L370-372/413-439) in `frontend/src/pages/organizations/UnitList.tsx` | **0 hits** — no Trình duyệt / Phê duyệt / Từ chối actions; no Chờ phê duyệt label | design §2 row "Frontend approval UI"; §3 "UI" |
| AC-removal-fe-7 | grep `status: data.status` in `frontend/src/pages/organizations/UnitForm.tsx` (L50/L63) and `STATUS_MAP`/approval badge in `UnitTree.tsx` (L10-16/35-36) | **0 hits** | design §2 row "Frontend form/status leftovers" |
| AC-removal-fe-8 | grep `'approved'|'pending'|'draft'|'rejected'` in `frontend/src/services/mockData.ts` (`MOCK_ORGANIZATIONS` L210-225) and `orgunit:approve` (L22) | **0 hits** | design §2 row "Mock data" |
| AC-removal-fe-9 | grep `DRAFT|PENDING|APPROVED|REJECTED|approvedAt` in `frontend/src/pages/organizations/**`, `frontend/src/services/organizationService.ts`, `frontend/src/services/mockData.ts` | **0 hits** — no unit approval status value anywhere in the org frontend | design §3 target state; §10 row 2 |

### AC-schema — migration drops the columns, guarded, no backfill

| ID | Oracle (checkable) | Pass condition | Source |
|----|--------------------|----------------|--------|
| AC-schema-1 | File `src/main/resources/db/migration/V20260817150000__drop_org_unit_approval.sql` exists | Present (new file, the only schema change for this TRI) | design §5 DB-01; intake edit_target_files |
| AC-schema-2 | Read the migration | Contains exactly the three guarded statements: `DROP INDEX IF EXISTS idx_org_units_status ON org_units;`, `ALTER TABLE org_units DROP COLUMN IF EXISTS status;`, `ALTER TABLE org_units DROP COLUMN IF EXISTS approved_at;` — no `ADD`/`CREATE` of status/approved_at, no `INSERT`/`UPDATE` backfill | design §5 DDL block + "No data backfill" |
| AC-schema-3 | grep `status|approved_at|approvedAt` in `orgunit/config/OrgUnitSchemaMigrator.java` | **0 hits** — migrator stays limited to `operational_status` + `rank`; no status/approved_at handling added | design §4 KEEP row 1; §5 "do not add status/approved_at handling" |
| AC-schema-4 | git diff of `src/main/resources/db/migration/` | Only `V20260817150000__drop_org_unit_approval.sql` added; historical `V18__add_f003_materialized_path_fields.sql`, `V19__seed_root_org_unit.sql`, `V102__convert_org_units_enums_to_smallint.sql`, `V112__...` byte-identical (read-only by instruction) | design §4 KEEP row "Historical migrations"; §5 |

### AC-keep — negative controls (must STILL be present)

| ID | Oracle (checkable) | Pass condition | Source |
|----|--------------------|----------------|--------|
| AC-keep-1 | grep `OperationalStatus|OPERATIONAL|SUSPENDED|operational_status` in `OrgUnit.java`, `OrgUnitSchemaMigrator.java`, org DTOs, frontend org normalizers | Present and unchanged — the only unit state is Sử dụng (OPERATIONAL) / Không sử dụng (SUSPENDED) | design §3 first bullet; §4 KEEP row 1 |
| AC-keep-2 | grep `"CREATED"|saveHistory` in `src/main/java/com/hanghai/kchtg/orgunit/service/OrganizationService.java` `create()` | `saveHistory(saved, "CREATED", ...)` intact; `orgunit/entity/UnitHistory.java` + `UnitHistoryRepository.java` untouched (git diff empty) | design §4 KEEP row 2 |
| AC-keep-3 | git diff of `MaterializedPathService.java`, `OrgUnitScopeService.java`, `UnitRepository.java`, `OrgUnitCacheService.java`, `OrgUnitRank.java` + converter | No change — core F-003 (path/level/sortOrder, rank, tree, search, soft-delete, cache) unaffected; they never referenced approval status (design §2 compile-break sweep) | design §4 KEEP row 3; §2 sweep |
| AC-keep-4 | grep of `OrgUnitController.java` mappings | `GET /api/org-units` (list/paged), `GET /{id}`, `POST`, `PUT`, `DELETE` (soft), `GET /tree`, `GET /search`, `GET /filter` (params: level/parentId/search) all present; only submit/approve/reject + status param removed | design §3 "API surface" |
| AC-keep-5 | `src/test/java/com/hanghai/kchtg/orgunit/service/OrganizationServiceTest.java` | Compiles and passes WITHOUT the approval tests: `ApprovalWorkflowTests` (L173-~254) removed, `makeUnit` (L404) no longer calls `setStatus(OrgUnitStatus.APPROVED)`; grep `OrgUnitStatus|DRAFT|PENDING|APPROVED|REJECTED|approve|reject|submit` in the file → 0 hits | design §2 row "Tests"; AC-gate-2 |

### AC-scope — other entities' approval flows untouched

| ID | Oracle (checkable) | Pass condition | Source |
|----|--------------------|----------------|--------|
| AC-scope-1 | grep `ApprovalService|approvedAt` across `src/main/java` OUTSIDE `com.hanghai.kchtg.orgunit` (e.g. shared, assetmovement, port/berth) | Still present — other approval flows (port/berth `approveC1`/`approveC2`, asset movement, WaterZone UI) are out of scope and unchanged | design §4 KEEP row "Other entities' approval flows" |
| AC-scope-2 | git diff of the wave | Changed files ⊆ the 27 edit targets (16 backend incl. 1 new migration + 1 test, 6 frontend, 5 docs); no file outside the footprint modified | design §1 blast radius; intake edit_target_files |

### AC-docs — 5 F-003 docs contain no approval content

| ID | Oracle (checkable) | Pass condition | Source |
|----|--------------------|----------------|--------|
| AC-docs-1 | grep `BR-015|US-003-05|Phê duyệt đơn vị|Chờ phê duyệt|DRAFT|PENDING|APPROVED|REJECTED|submit|approve|reject|approvedAt|OrgUnitStatus` in the 5 F-003 docs: `ba/00-lean-spec.md`, `feature-brief.md`, `qa/qa-test-cases.md`, `sa/00-lean-architecture.md`, `tech-lead/04-plan.md` | **0 hits** — approval state machine, unit-status values, approval endpoints/permission gone from all 5 (the design plan is exempt: it documents the removal itself) | design §3 last bullet; §10 row 4 |
| AC-docs-2 | Headings of `feature-brief.md` | Exactly 10 sections in template order (Tổng quan → Yêu cầu giao diện người dùng) | design §10 row 4 |
| AC-docs-3 | grep `operational_status|Sử dụng|Không sử dụng|CREATED` in the 5 F-003 docs | Operational status + unit-history CREATED audit content retained where applicable | design §4 KEEP; triage done_oracle |

### AC-gate — build, test, typecheck (triage verification surface)

| ID | Command (cwd) | Pass condition | Source |
|----|---------------|----------------|--------|
| AC-gate-1 | `mvn -q clean compile -DskipTests` (repo root) | Exit 0 — full backend compiles after enum/DTO/controller removal (catches any unlisted `OrgUnitStatus` reference) | design §10 row 1; §6 "Run mvn -q clean compile" |
| AC-gate-2 | `mvn -q test -Dtest=OrganizationServiceTest` (repo root) | Exit 0, tests pass — surviving CRUD/tree/rank/soft-delete/audit tests green after approval tests removed | triage done_oracle; design §10 row 1 |
| AC-gate-3 | `npm run build` (cwd `frontend`) | Exit 0, Vite production build completes | triage done_oracle; design §10 row 3 |
| AC-gate-4 | `npx tsc --noEmit -p tsconfig.app.json` (cwd `frontend`) — diff vs pre-change baseline | **Zero NEW errors** in the 6 changed frontend files (UnitList.tsx, UnitForm.tsx, UnitTree.tsx, organizationService.ts, mockData.ts, permissions.ts). Baseline is RED (~90 pre-existing error files, `noUnusedLocals:true`); acceptance = no new errors, NOT exit 0 | design §11 risk row 2; workspace memory `frontend tsc baseline RED` |

### AC-api — live API surface (conditional; primary evidence is static)

| ID | Oracle (checkable) | Pass condition | Source |
|----|--------------------|----------------|--------|
| AC-api-1 | Live probe (only if an operator-provided running env exists): `POST /api/org-units/{id}/submit` / `/{id}/approve` / `/{id}/reject` | **404** (no mapping) — not 403/200 | design §3 "No submit/approve/reject" |
| AC-api-2 | Live probe: `GET /api/org-units/filter?status=PENDING` | **400** (param no longer bound) | design §2 filter param; §3 |
| AC-api-3 | Live probe: `GET /api/org-units/{id}` response JSON | Contains `operationalStatus`; contains NO `status` / `approvedAt` fields | design §3; §2 DTO row |
| AC-api-4 | Live probe: create unit → immediately visible in list/tree without any approval step | 201/200; unit usable immediately (no PENDING gate) | triage done_oracle clause 1; design §3 |

Note: the pipeline forbids this seat from starting the Spring Boot backend (AGENTS.md); if no environment is provided, AC-api rests on AC-removal-be-5/8 + AC-keep-4 + AC-gate-2 (controller mappings and DTOs are fully covered statically and by `OrganizationServiceTest`).

### AC-negative — prohibitions hold

| ID | Oracle (checkable) | Pass condition | Source |
|----|--------------------|----------------|--------|
| AC-negative-1 | git diff of `src/main/resources/db/migration/` | No edit to V18/V19/V102/V112 or any historical migration; only the new drop migration | design §4 KEEP; §5 |
| AC-negative-2 | grep `status|approved_at|approvedAt` in the new migration | Only the guarded `DROP` statements; no `ADD`/`CREATE`/`INSERT`/`UPDATE` reintroducing the columns or backfilling data | design §5 "No data backfill" |
| AC-negative-3 | git status/diff of the wave | No `git add`/`commit`/`push` performed; work left unstaged; no backend server started | AGENTS.md |
| AC-negative-4 | grep `OrgUnitStatus|orgunit:approve|approvedAt` in `src/main/java` + `frontend/src/pages/organizations/**` + `frontend/src/services/organizationService.ts` | 0 hits outside the two allowed legacy permissionStore literals (AC-removal-fe-2) and docs history | design §10 row 2 |

## 4. Verification plan (wave-2 execution order)

| Step | Action (cwd) | Expected | AC covered |
|------|--------------|----------|------------|
| 1 | `git status --porcelain` + diff of changed set | Change set ⊆ 27 edit targets, unstaged, no historical migration touched | AC-scope-2, AC-negative-1/3 |
| 2 | Backend greps: `OrgUnitStatus`, `approvedAt`, `submitForApproval`, `findByStatusAndDeletedAtIsNull`, `/submit|/approve|/reject` mappings, `orgunit:approve`, seeder/DTO status members (scoped to orgunit package + seeders + config + test) | 0 hits | AC-removal-be-1..10 |
| 3 | Frontend greps: `orgunit:approve` (2 allowed), `submit\(|approve\(|reject\(`, `\bstatus\b`, `STATUS_COLORS|STATUS_LABELS|getStatusKey|statusTabs`, `STATUS_MAP`, `status: data.status`, `'approved'|'pending'|'draft'|'rejected'`, `DRAFT|PENDING|APPROVED|REJECTED|approvedAt` (org feature scope) | 0 hits (except the 2 permissionStore literals) | AC-removal-fe-1..9 |
| 4 | Read `V20260817150000__drop_org_unit_approval.sql` + grep `OrgUnitSchemaMigrator.java` | 3 guarded DROP statements, no backfill; migrator free of status/approved_at | AC-schema-1..4, AC-negative-2 |
| 5 | KEEP greps: `OperationalStatus|OPERATIONAL|SUSPENDED`, `"CREATED"|saveHistory`, controller CRUD/tree/search/filter mappings, `OrgUnitRank` | Present, unchanged | AC-keep-1..5 |
| 6 | Scope greps: `ApprovalService|approvedAt` outside orgunit package | Still present (out of scope) | AC-scope-1 |
| 7 | `mvn -q clean compile -DskipTests` (repo root) | exit 0 | AC-gate-1 |
| 8 | `mvn -q test -Dtest=OrganizationServiceTest` (repo root) | exit 0, pass | AC-gate-2, AC-keep-5 |
| 9 | `npm run build` (cwd `frontend`) | exit 0 | AC-gate-3 |
| 10 | `npx tsc --noEmit -p tsconfig.app.json` (cwd `frontend`) diff vs pre-change baseline | zero NEW errors in the 6 changed files | AC-gate-4 |
| 11 | Docs greps on the 5 F-003 docs (step 2-3 patterns + `BR-015|US-003-05|Phê duyệt đơn vị|Chờ phê duyệt|approval state machine`) | 0 hits; feature-brief = 10 sections | AC-docs-1..3 |
| 12 | Live probes (only if env provided; otherwise declared not-executed) | AC-api-1..4 expectations | AC-api |

## 5. Coverage of the triage done_oracle

| done_oracle clause | Criteria |
|---|---|
| "Tạo/sửa/xóa đơn vị chạy bình thường, chỉ còn trạng thái Sử dụng/Không sử dụng (operational_status)" | AC-keep-1/2/4, AC-api-4, AC-gate-2 |
| "không còn bất kỳ UI/API/enum/cột/permission nào thuộc luồng phê duyệt đơn vị" | AC-removal-be-1..10, AC-removal-fe-1..9, AC-schema-1..4, AC-docs-1, AC-negative-1/2/4 |
| "backend compile + OrganizationServiceTest pass" | AC-gate-1, AC-gate-2 |
| "frontend build pass không lỗi tsc mới" | AC-gate-3, AC-gate-4 |

**No done_oracle clause is left without an executable oracle.**

## 6. What wave 1 did NOT verify (declared, not silently skipped)

- No build / compile / test / typecheck executed: the code removal does not exist yet (backend-dev + frontend-dev waves pending).
- No live HTTP probes: starting the Spring Boot backend is forbidden in this pipeline (AGENTS.md); AC-api is conditional on an operator-provided environment and otherwise rests on the static controller/DTO greps + `OrganizationServiceTest`.
- The tsc baseline diff (AC-gate-4) requires pre-change and post-change runs; both are wave-2 actions.
- F-003 docs criteria for the 4 non-QA docs rely on the prior BA/SA stage claims (grep 0 hits, verified in their stages); `qa/qa-test-cases.md` was verified by this seat after its edit (AC-docs-1 on that file, executed below in §7 evidence).

## 7. Wave-1 executed evidence (this seat's own artifact)

`qa/qa-test-cases.md`: removed approval cases TC-009 (Submit — DRAFT→PENDING, BR-015), TC-010 (Approve — PENDING→APPROVED, BR-015), TC-011 (Reject — PENDING→REJECTED, BR-015), TC-012 (approve on non-PENDING), TC-018 (filter?status=PENDING), TC-030 (Audit Trail on Approval), TC-034 (re-submit REJECTED→PENDING), TC-043 (Approval Comments Captured); removed `status "DRAFT"` from TC-001 expected and `status "APPROVED"` from TC-037 expected; removed the Approval Workflow summary row; catalog 45 → 37 cases. Post-edit grep for `submit|approve|reject|DRAFT|PENDING|APPROVED|REJECTED|BR-015|approvedAt` on the file returned 0 hits (verified by the typed grep tool after edit).
