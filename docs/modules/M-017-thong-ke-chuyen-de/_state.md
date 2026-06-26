---
feature-id: M-017
feature-name: Thống kê chuyên đề
pipeline-type: sdlc
status: done
sealed: true
closed-at: "2026-06-26T00:00:00Z"
depends-on: []
blocked-by: []
created: 2026-06-16T15:43:53Z
last-updated: "2026-06-26T00:00:00Z"
current-stage: closed
output-mode: lean
repo-type: mini
repo-path: .
project: ""
docs-path: docs/modules/M-017-thong-ke-chuyen-de
intel-path: docs/intel
stages-queue: []
completed-stages:
  consulting-intelligence-extractor:
    verdict: Ready for BA
    completed-at: 2026-06-16T15:43:53Z
kpi:
  tokens-total: 0
  cycle-time-start: 2026-06-16T15:43:53Z
  tokens-by-stage: {}
  tokens-by-feature: {}
rework-count: {}
locked-fields: []
version: 1
finalizers: [seal]
children-close-policy: TERMINATE
child-events: []
partial-redo: []
agent-flags: {}
feature-req:
  file: docs/modules/M-017-thong-ke-chuyen-de/module-brief.md
  canonical-fallback: docs/intel/_snapshot.md
  scope-modules: []
  scope-features: []
  dev-unit: ""
clarification-notes: ""
name: Thống kê chuyên đề
---
# Pipeline State: Thống kê chuyên đề

## Business Goal

[CẦN BỔ SUNG: 1-2 câu mô tả mục tiêu nghiệp vụ của module]

## Stage Progress

| # | Stage | Agent | Verdict | Artifact | Date |
|---|---|---|---|---|---|
| 1 | Intake | consulting-intelligence-extractor | Ready for BA | docs/intel/_snapshot.md | 2026-06-16T15:43:53Z |
| 2 | engineering-system-architect | engineering-system-architect | — | — | — |
| 3 | engineering-technical-lead | engineering-technical-lead | — | — | — |
| 4 | engineering-backend-developer-wave-1 | engineering-backend-developer-wave-1 | — | — | — |
| 5 | engineering-qa-engineer-wave-1 | engineering-qa-engineer-wave-1 | — | — | — |
| 6 | engineering-code-reviewer | engineering-code-reviewer | — | — | — |

## Current Stage

**ba** — Ready to start. Input: `docs/modules/M-017-thong-ke-chuyen-de/module-brief.md`.

## Next Action

Run: `/resume-module M-017` để dispatch BA agent.

## Active Blockers

none

## Wave Tracker

| Wave | Tasks | Dev Status | QA Status |
|---|---|---|---|

## Escalation Log

| Date | Item | Decision |
|---|---|---|

## Wave 1 — Entity & Repository Scaffold (2026-06-26)

**Status:** ✅ Complete

### Files created (7 source files)

| # | File | Path | Type |
|---|------|------|------|
| 1 | BaseEntity.java | `src/main/java/com/hanghai/kchtg/statistics/entity/BaseEntity.java` | abstract `@MappedSuperclass` |
| 2 | StatFormType.java | `src/main/java/com/hanghai/kchtg/statistics/entity/StatFormType.java` | enum (13 constants) |
| 3 | StatFormStatus.java | `src/main/java/com/hanghai/kchtg/statistics/entity/StatFormStatus.java` | enum (4 statuses) |
| 4 | StatisticsForm.java | `src/main/java/com/hanghai/kchtg/statistics/entity/StatisticsForm.java` | `@Entity` (main form) |
| 5 | FormApprovalHistory.java | `src/main/java/com/hanghai/kchtg/statistics/entity/FormApprovalHistory.java` | `@Entity` (audit trail) |
| 6 | StatisticsFormRepository.java | `src/main/java/com/hanghai/kchtg/statistics/repository/StatisticsFormRepository.java` | `JpaRepository` |
| 7 | FormApprovalHistoryRepository.java | `src/main/java/com/hanghai/kchtg/statistics/repository/FormApprovalHistoryRepository.java` | `JpaRepository` |

### Package tree

```
com.hanghai.kchtg.statistics
├── entity
│   ├── BaseEntity.java              (abstract, @MappedSuperclass)
│   ├── StatFormType.java            (enum, 13 constants)
│   ├── StatFormStatus.java          (enum, 4 statuses)
│   ├── StatisticsForm.java          (@Entity, single-table inheritance)
│   └── FormApprovalHistory.java     (@Entity, audit trail)
└── repository
    ├── StatisticsFormRepository.java
    └── FormApprovalHistoryRepository.java
```

### Key design decisions

- **BaseEntity** is a separate abstract `@MappedSuperclass` in `statistics.entity` (not shared with `report.entity`). Statistics domain uses `Long` identity (vs report's `UUID`).
- **StatFormType** covers all 28 biểu codes mapped to 13 enum constants.
- **StatisticsForm** uses JPA single-table inheritance (`@DiscriminatorValue("STAT_FORM")`) to support future subtype entities.
- **StatFormStatus** uses `EnumType.STRING` in DB with Vietnamese labels (`Nháp`, `ĐÃ nộp`, `Đã duyệt`, `Từ chối`).
- **FormApprovalHistory** stores SUBMIT/APPROVE/REJECT/DRAFT actions with actor and optional comments.
- **StatisticsFormRepository** provides typed queries: by formCode, formType, formStatus, period, and year+type combo.

### Wave Tracker update

| Wave | Tasks | Dev Status | QA Status |
|---|---|---|---|
| 1 | Entity & Repository scaffold | ✅ Complete | — |

### Wave 2 — DTOs & Services (2026-06-26)

**Status:** ✅ Complete

### Files created (10 files)

#### DTOs (5)

| # | File | Package | Purpose |
|---|------|---------|---------|
| 1 | `StatisticsFormRequest.java` | `statistics.dto` | Create/update request DTO. `@NotBlank` on `formType` and `reportingPeriod`. |
| 2 | `StatisticsFormResponse.java` | `statistics.dto` | Full response DTO including `BaseEntity` fields (`code`, `name`, `createdBy`, `updatedBy`, `createdAt`, `updatedAt`). |
| 3 | `StatisticsFilter.java` | `statistics.dto` | Filter parameters for paginated queries (`formType`, `formStatus`, `year`, page/size). |
| 4 | `BulkStatisticsRequest.java` | `statistics.dto` | Batch creation with `List<StatisticsFormRequest>` and optional `approvedBy`. |
| 5 | `StatisticsSummary.java` | `statistics.dto` | Aggregated dashboard summary (`totalForms`, `approvedForms`, `pendingForms`, `totalValue`, etc.). |

#### Services (5)

| # | File | Package | Purpose |
|---|------|---------|---------|
| 6 | `StatisticsService.java` | `statistics.service` | Core CRUD + aggregation: `createForm`, `findById`, `findByCode`, `findAll` (filtered/paginated), `findByFormType`, `updateStatus`, `countByStatus`, `getSummary`. |
| 7 | `FormApprovalService.java` | `statistics.service` | Approval lifecycle: `submitForm`, `approveForm`, `rejectForm` with audit trail in `FormApprovalHistory`. |
| 8 | `PortThroughputService.java` | `statistics.service` | PORT_THROUGHPUT forms (Biểu 01-N, 01B-N, 06-N, 07-N): port-period queries + code generation. |
| 9 | `CargoVolumeService.java` | `statistics.service` | CARGO_VOLUME forms (Biểu 03-Q/N, 12-T, 12-N): month/year queries. |
| 10 | `ShipMovementService.java` | `statistics.service` | SHIP_MOVEMENT forms (Biểu 04-6T/N, 04B-N, 11-T, 11B-T, 16-Q, 17-Q): port-period + year queries. |

### Package tree

```
com.hanghai.kchtg.statistics
├── dto
│   ├── StatisticsFormRequest.java      (create/update request)
│   ├── StatisticsFormResponse.java     (full response with BaseEntity fields)
│   ├── StatisticsFilter.java           (paginated query filters)
│   ├── BulkStatisticsRequest.java      (batch creation)
│   └── StatisticsSummary.java          (dashboard aggregation)
├── entity
│   ├── BaseEntity.java                 (abstract, @MappedSuperclass)
│   ├── StatFormType.java               (enum, 13 constants)
│   ├── StatFormStatus.java             (enum, 4 statuses)
│   ├── StatisticsForm.java             (@Entity, single-table inheritance)
│   └── FormApprovalHistory.java        (@Entity, audit trail)
├── repository
│   ├── StatisticsFormRepository.java
│   └── FormApprovalHistoryRepository.java
└── service
    ├── StatisticsService.java          (core CRUD + aggregation)
    ├── FormApprovalService.java        (approval lifecycle + audit trail)
    ├── PortThroughputService.java      (PORT_THROUGHPUT specialized)
    ├── CargoVolumeService.java         (CARGO_VOLUME specialized)
    └── ShipMovementService.java        (SHIP_MOVEMENT specialized)
```

### Key design decisions (Wave 2)

1. **Entity field alignment** — Adapted to actual Wave 1 entity definitions:
   - `StatisticsForm` uses `formCode` (String, business code) and `formStatus` (enum); `code`/`name` come from `BaseEntity`.
   - `StatisticsFormResponse` exposes both `code` (system ID) and `formCode` (business code).
   - Entity mutations use `entity.setFormStatus(StatFormStatus.X)` and `entity.setUpdatedAt(Instant.now())`.

2. **Repository query reuse** — Services use existing repository methods:
   - `findByFormType(StatFormType)` — all forms of a type
   - `findByFormTypeAndPeriod(type, period)` — type + period
   - `findByYearAndType(year, type)` — year-based queries
   - `countByStatus(StatFormStatus)` — counts per status
   - `findByFormStatus(status, pageable)` / `findByFormTypeAndFormStatus(type, status, pageable)` — paginated filtering

3. **Approval history** — `FormApprovalService` records every action (SUBMIT, APPROVE, REJECT) to `form_approval_history` via `FormApprovalHistoryRepository.findByFormIdOrderByCreatedAtDesc()`.

4. **Validation** — DTOs use `@NotBlank` on required fields, `@NotEmpty` on list fields. Follows M-016 `ReportRequest` pattern.

5. **Specialized services** — `PortThroughputService`, `CargoVolumeService`, `ShipMovementService` are thin wrappers over `StatisticsFormRepository` with form-type-specific query conventions and code generation helpers. These will be wired to dedicated REST endpoints in Wave 3.

### Wave Tracker update

| Wave | Tasks | Dev Status | QA Status |
|---|---|---|---|
| 1 | Entity & Repository scaffold | ✅ Complete | — |
| 2 | DTOs + Services | ✅ Complete | — |

### Wave 3 — Unit Tests (2026-06-26)

**Status:** ✅ Complete

### Files created (3 files)

#### Service Tests (1)

| # | File | Test Methods | Scope |
|---|------|-------------|-------|
| 1 | `FormApprovalServiceTest.java` | 8 tests | Approval lifecycle — submit, approve, reject, history queries |

#### Controller Tests (2)

| # | File | Test Methods | Scope |
|---|------|-------------|-------|
| 2 | `StatisticsControllerTest.java` | 9 tests | CRUD + aggregation REST endpoints |
| 3 | `FormApprovalControllerTest.java` | 4 tests | Approval REST endpoints (submit/approve/reject/history) |

### Test file inventory

```
src/test/java/com/hanghai/kchtg/statistics/
├── FormApprovalServiceTest.java          (8 tests: submit, approve, reject, history)
├── FormApprovalControllerTest.java       (4 tests: submit/approve/reject/history endpoints)
├── StatisticsControllerTest.java         (9 tests: CRUD + aggregation + summary + type)
└── StatisticsServiceTest.java            (already existed — core service tests)
```

### Wave Tracker update

| Wave | Tasks | Dev Status | QA Status |
|---|---|---|---|
| 1 | Entity & Repository scaffold | ✅ Complete | — |
| 2 | DTOs + Services | ✅ Complete | — |
| 3 | Unit Tests | ✅ Complete | — |

### Next waves (planned)

- **Wave 4:** Flyway migration scripts (`V1__create_statistics_tables.sql`)
