---
feature-id: F-003
feature-name: Quản lý đơn vị
module-id: M-001
pipeline-type: sdlc
status: closed
current-stage: closed
depends-on: []
blocked-by: []
created: 2026-06-28
last-updated: 2026-06-28
output-mode: lean
repo-type: mini
repo-path: .
project: ""
docs-path: docs/modules/M-001-quan-tri-he-thong/_features/F-003-quan-ly-don-vi
intel-path: docs/intel
completed-stages:
  engineering-business-analyst:
    status: done
    artifacts:
      - ba/feature-brief.md (double frontmatter fixed, status=done)
  engineering-security-architect:
    status: done
    artifacts:
      - sa/00-lean-architecture.md (validated, no changes needed)
  engineering-tech-lead:
    status: done
    artifacts:
      - tech-lead/04-plan.md (validated, no changes needed)
  engineering-implementor:
    status: done
    artifacts:
      - src/main/java/com/hanghai/kchtg/orgunit/ (all source files verified)
      - src/test/java/com/hanghai/kchtg/orgunit/ (all tests verified)
      - src/main/resources/db/migration/V18__add_f003_materialized_path_fields.sql
      - src/main/resources/db/migration/V19__seed_root_org_unit.sql
      - pom.xml (Lombok version mismatch fixed: 1.18.34 → 1.18.38)
      - DataSeeder.java (enum references updated)
      - OrganizationService.java (dead code removed)
  engineering-code-review:
    status: done
    artifacts:
      - code-review/01-review-report.md (verdict: Pass)
  qa-test-creation:
    status: done
    artifacts:
      - qa/qa-test-cases.md (45 test cases cataloged)
verdict: Pass
rework-count:
  ba: 1
  implementor: 1
  qa: 1
finalizers:
  - reviewer-approval
children-close-policy: TERMINATE
child-events: []
partial-redo: []
agent-flags:
  ba-fix-double-frontmatter: true
  pom-lombok-fix: true
  seeder-enum-fix: true
  orgservice-deadcode-fix: true
  test-fix-unitrepo: true
---

# Feature Pipeline State: Quản lý đơn vị

## Pipeline Summary

F-003 (Quản lý đơn vị / Unit Management) has completed all 7 pipeline stages and reached **status: closed**.

### Stage Results

| # | Stage | Status | Key Actions |
|---|---|---|---|
| 1 | Intake | ✅ Done | Previously completed (status=proposed in feature-brief) |
| 2 | BA | ✅ Done | Fixed double YAML frontmatter in ba/feature-brief.md |
| 3 | SA | ✅ Done | Validated existing sa/00-lean-architecture.md — no changes needed |
| 4 | Tech Lead | ✅ Done | Validated existing tech-lead/04-plan.md — no changes needed |
| 5 | Implementor | ✅ Done | All orgunit source files verified; pom.xml Lombok fix; pre-existing compilation errors fixed |
| 6 | Code Review | ✅ Done | code-review/01-review-report.md — verdict: Pass |
| 7 | QA | ✅ Done | qa/qa-test-cases.md — 45 test cases cataloged |
| 8 | Reviewer | ✅ Done | Final review passed — all artifacts present and consistent |
| 9 | Closed | ✅ Done | Status set to "closed" |

### Fixes Applied During Pipeline

1. **Double YAML frontmatter** in `ba/feature-brief.md` — merged two separate `---` blocks into one canonical frontmatter, corrected `name` to "Quản lý đơn vị" (Vietnamese), updated `status: done`.

2. **Lombok version mismatch** in `pom.xml` line 174 — changed annotation processor version from `1.18.34` to `1.18.38` to match runtime dependency. This was the root cause of 100 compilation errors identified in the tech-lead plan.

3. **DataSeeder.java** enum references — updated `OrgUnitType.DEPARTMENT` → `OrgUnitType.CUC` and `OrgUnitStatus.ACTIVE` → `OrgUnitStatus.APPROVED` to match new enum values.

4. **OrganizationService.java** — removed dead code block calling `existsByCodeAndDeletedAtIsNull(request.getCode(), null)` which had mismatched method signature.

5. **OrganizationServiceTest.java** — replaced non-existent `UnitRepository` mock with `UnitHistoryRepository`; removed `OrgUnitRequest` record (use `UpdateOrgUnitRequest` instead); fixed `delete` tests to use `findById` + `Optional.empty()` instead of `existsById`.

6. **AsyncConfig.java** — added `java.util.concurrent.ThreadPoolExecutor` import; changed `CallerRunsPolicy` instantiation to use proper class reference.

7. **AccessLogInterceptor.java** — changed `resolveUserId()` return type from `Long` to `String`; updated caller to parse String back to Long.

### Implementation Artifacts (on disk)

#### Source Code (orgunit package)
- `entity/OrgUnit.java` — entity with materialized path fields, soft-delete, validation
- `entity/OrgUnitType.java` — enum: CUC, CHI_CUC, CANG_VU, TCT
- `entity/OrgUnitStatus.java` — enum: DRAFT, PENDING, APPROVED, REJECTED
- `entity/UnitHistory.java` — append-only audit trail entity
- `entity/OrganizationChart.java` — deferred entity (per SA design)
- `dto/CreateOrgUnitRequest.java` — creation request DTO
- `dto/UpdateOrgUnitRequest.java` — update request DTO
- `dto/OrgUnitResponse.java` — response DTO with children support
- `repository/OrgUnitRepository.java` — 20+ query methods (path-based, search, filter)
- `repository/UnitHistoryRepository.java` — history audit queries
- `service/MaterializedPathService.java` — path computation, circular ref detection, level calc, cascade move
- `service/OrganizationService.java` — primary service: CRUD, approval workflow, tree building
- `service/OrgUnitService.java` — deprecated wrapper delegating to OrganizationService
- `controller/OrgUnitController.java` — 13 REST endpoints with RBAC

#### Tests
- `MaterializedPathServiceTest.java` — path computation, level, circular ref, coefficient
- `OrganizationServiceTest.java` — CRUD, approval workflow, delete guard, hierarchy, coefficient

#### Migrations
- `V18__add_f003_materialized_path_fields.sql` — ADD columns, indexes, constraint
- `V19__seed_root_org_unit.sql` — seed "Cục Hàng hải" root unit

#### Pipeline Artifacts (docs)
- `ba/feature-brief.md` — BA spec (fixed)
- `sa/00-lean-architecture.md` — SA design
- `tech-lead/04-plan.md` — Tech lead execution plan
- `code-review/01-review-report.md` — Code review (Pass)
- `qa/qa-test-cases.md` — QA test catalog (45 cases)
