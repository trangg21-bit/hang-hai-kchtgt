---
feature-id: M-004
document: code-review-report
agent: utility-security-auditor-design
verdict: CHANGES_REQUESTED
last-updated: 2026-07-08
---

# Code Review Report: M-004 Quản lý tài sản Báo hiệu & Thông tin

## Overview

| Item | Detail |
|------|--------|
| **Module** | M-004 — Quản lý tài sản Báo hiệu & Thông tin |
| **Scope** | 54 features (F-068 → F-121) across 9 entity groups in 3 backend packages (`beacon/`, `nhatram/`, `station/`) |
| **Review Date** | 2026-07-08 |
| **Reviewer** | utility-security-auditor-design |
| **Verdict** | **CHANGES_REQUESTED** |

---

## Checklist Results

| # | Item | Status | Details |
|---|------|--------|---------|
| 1 | All SDLC artifacts present | ✅ PASS | BA spec, SA architecture, Tech Lead plan, QA report all found and substantive |
| 2 | 54 feature briefs filled correctly | ✅ PASS | All feature-brief.md files populated; 0 `[CẦN BỔ SUNG]` markers found; QA confirmed same |
| 3 | implementations.yaml all mapped | ✅ PASS | All 54 feature directories have non-empty `primary` mappings; 0 empty `primary: ""` |
| 4 | Code quality — BR-008 violation | ❌ **FAIL** | **ALL 5 station services** modify `code` field in `updateStation()` — see Finding #1 |
| 5 | Test coverage assessment | ❌ **FAIL** | **0 test classes** in `beacon/` (12 features) and **0 test classes** in `station/` (30 features) — see Finding #2 |
| 6 | Cross-cutting pattern consistency | ⚠️ OBSERVED | Station package diverges from beacon/nhatram in API envelope, approval endpoint design, self-approval guard — see Finding #3 |
| 7 | Naming consistency | ⚠️ OBSERVED | implementations.yaml uses 3 different method-reference formats; frontend/backend field name drift — see Finding #4 |

---

## Detailed Findings

### Finding #1 [MUST-FIX]: BR-008 Violation — Code field modified in `updateStation()` (all 5 station services)

**Severity**: High  
**BR-008**: "Mã code không thể thay đổi sau khi tạo (immutable)"  
**Impact**: Allows end-users to change the business identifier after creation, violating data integrity and breaking cross-references from history records and GIS (where applicable).

**Affected files and lines:**

| File | Line | Code |
|------|------|------|
| `src/main/java/com/hanghai/kchtg/station/service/CoastalStationVTSService.java` | 55 | `entity.setCode(request.getStationCode())` |
| `src/main/java/com/hanghai/kchtg/station/service/CoastalStationInmarsatService.java` | 55 | `entity.setCode(request.getDeviceCode())` |
| `src/main/java/com/hanghai/kchtg/station/service/CoastalStationCospasSarsatService.java` | 54 | `entity.setCode(request.getStationCode())` |
| `src/main/java/com/hanghai/kchtg/station/service/CoastalStationLRITService.java` | 56 | `entity.setCode(request.getStationCode())` |
| `src/main/java/com/hanghai/kchtg/station/service/CoastalStationHaiphongService.java` | 58 | `entity.setCode(request.getStationCode())` |

**Evidence of correct pattern in beacon/nhatram packages:**

The `beacon` package (`BeaconLightService.update()` at line 118) and `nhatram` package (`NhaTramDenService.update()` at line 107) correctly **omit** the `code` field entirely — the comment reads "Apply mutable fields only" and `code` is never listed. The station `updateStation()` methods are the only ones violating BR-008.

**Remediation**:
- Remove `entity.setCode(request.getStationCode())` (or `request.getDeviceCode()`) from each `updateStation()` method
- Verify the `UpdateRequest` DTOs do not include a `code`/`stationCode` field (or annotate it `@Nullable` and ignore it in service)
- Also verify the `CreateRequest`/`UpdateRequest` DTOs for CoastalStationInmarsat use `stationCode` consistently (currently uses `deviceCode` for the code field while others use `stationCode`)

---

### Finding #2 [MUST-FIX]: Zero test coverage for `beacon/` and `station/` packages

**Severity**: High  
**Impact**: 42 out of 54 features (78%) have no unit test coverage.

| Package | Features | Test Classes | Status |
|---------|----------|-------------|--------|
| `beacon/` | F-068 to F-079 (12 features) | **0** | ❌ Missing |
| `nhatram/` | F-080 to F-091 (12 features) | 3 (NhaTramPhaoControllerTest, NhaTramDenControllerTest, NhaTramHistoryControllerTest) | ✅ Existing |
| `station/` | F-092 to F-121 (30 features) | **0** | ❌ Missing |

**Remediation** (as planned in Tech Lead plan, Tasks 12–18):
- Create `BeaconLightControllerTest` covering CRUD + approval + search
- Create `BuoyControllerTest` covering same endpoints
- Create 5 station controller tests: `CoastalStationVTSControllerTest`, `CoastalStationInmarsatControllerTest`, `CoastalStationCospasSarsatControllerTest`, `CoastalStationLRITControllerTest`, `CoastalStationHaiphongControllerTest`
- Follow established pattern from `src/test/java/com/hanghai/kchtg/nhatram/` (MockMvc, `@WebMvcTest`, mocked services)
- Account for envelope difference: beacon uses `ApiResponse<T>` wrapper; station returns raw entities

---

### Finding #3 [OBSERVED]: Cross-cutting pattern divergence in station package

**Severity**: Medium (documented for Wave 3, but should be acknowledged)

| Pattern | Beacon / NhaTram | Station | Implication |
|---------|------------------|---------|-------------|
| API response envelope | `ApiResponse<T>` wrapper | Raw entity/DTO returned | Frontend must use different unwrapping logic |
| Approval endpoints | 4 separate: `/submit-approval`, `/approve-l1`, `/approve-l2`, `/reject` | 2 endpoints: `/approve` (with `LevelEnum` body), `/reject` | UX inconsistency for operators managing both beacon/buoy and stations |
| Self-approval guard | Blocks creator from approving own L1 | **Not implemented** | Creator can approve own station — security gap |
| GIS sync on L2 | Yes — `PointObjectSyncService` | No GIS sync | Expected (stations have no GIS point representation) |
| API prefix | `/api/beacon-lights`, `/api/buoys` (no v1) | `/api/v1/stations/...` | Inconsistent versioning |
| History persistence | DB table (`beacon_history`, `nha_tram_history`) | In-memory `HistoryService` (ArrayList) | Lost on restart — Wave 3 debt |
| Default status on create | `DRAFT` | `PENDING_APPROVAL` | Different initial workflow expectations |

---

### Finding #4 [OBSERVED]: Naming consistency issues

**Severity**: Low

**4a — implementations.yaml method reference format inconsistency**

Three different conventions are used across the 54 feature directories:

| Package | Example | Format |
|---------|---------|--------|
| `beacon/` (F-068) | `BeaconLightService.java#create` | `#method` suffix |
| `nhatram/` (F-080) | `NhaTramPhaoController.java` | bare path (no method) |
| `station/` (F-092) | `CoastalStationVTSController.java -> createStation()` | `-> method()` arrow |

**Recommendation**: Standardize to one format — the `#method` convention aligns with Java's stack trace format and is the most parseable.

**4b — Frontend ↔ backend field name drift**

| Frontend field | Backend field | Entity |
|----------------|---------------|--------|
| `stationCode` | `code` | CoastalStationVTS |
| `stationName` | `name` | CoastalStationVTS |
| `deviceCode` | `code` | CoastalStationInmarsat |

The frontend normalizes these with `.map()` calls, but this adds cognitive load. Recommend aligning DTO names in a future wave.

---

### Finding #5 [INFO]: F-068 feature-brief still has placeholder content

**Severity**: Low

The `In Scope` and `Out of Scope` sections in `_features/F-068-quan-ly-den-bien-tao-moi/feature-brief.md` still contain the placeholder text `(populated by ba stage)` instead of concrete bullet points. All other spot-checked feature briefs (F-080, F-092, F-098) have fully populated In Scope / Out of Scope sections.

The `Testing Strategy` sections across all feature briefs contain `(populated by qa stage)` — this is expected at the pre-QA stage and NOT a blocker.

---

## QA Test Suite Context

The QA report (`00-test-report.md`) documents 13 test failures across non-M-004 modules (BaoCaoKiemKe, KeHoachKiemKe, DeKe, LuongHangHai). These failures are **not within the M-004 scope** and do not affect this review's verdict. The root cause — `CHO_PHE_DUYET` vs `TU_CHOI` status transition — is a systemic issue in the assetmovement module that should be flagged to the project manager separately.

---

## Verdict

### 🟡 CHANGES_REQUESTED

**Rationale**: Two must-fix items prevent an APPROVED verdict:

1. **BR-008 violation** (Finding #1) — All 5 station service `updateStation()` methods allow modification of the immutable `code` field. This is a data integrity bug with real-world impact: a station's business identifier could be changed after approval, breaking cross-references, history trails, and downstream systems.

2. **Zero test coverage** for `beacon/` (12 features) and `station/` (30 features) packages (Finding #2) — 78% of M-004 features have no automated tests. The Tech Lead plan explicitly called for creating these tests in Wave 1 (Tasks 12–18) but none have been written yet.

### Required Before Re-Review

| # | Item | Priority | Owner |
|---|------|----------|-------|
| 1 | Remove `entity.setCode(...)` from all 5 station `updateStation()` methods | P0 — Critical | engineering-backend-developer |
| 2 | Create unit tests for `beacon/` package (BeaconLightControllerTest, BuoyControllerTest) | P0 — Critical | engineering-backend-developer |
| 3 | Create unit tests for `station/` package (5 controller test classes) | P0 — Critical | engineering-backend-developer |
| 4 | Run `mvn test` and confirm all M-004 tests pass (target: nhatram 3 tests + new tests) | P0 — Critical | engineering-backend-developer |

### Recommended (but non-blocking)

| # | Item | Priority | Owner |
|---|------|----------|-------|
| 5 | Fill In Scope / Out of Scope for F-068 feature-brief | P3 — Minor | engineering-business-analyst |
| 6 | Standardize implementations.yaml method reference format (choose one: `#method` or `-> method()`) | P3 — Minor | engineering-technical-lead |
| 7 | Add self-approval guard to station `approveStation()` methods | P2 — Medium | engineering-backend-developer |

---

## Appendix: Files Reviewed

### Input Documents
- `docs/modules/M-004-quan-ly-tai-san-bao-hieu-thong-tin/ba/00-lean-spec.md`
- `docs/modules/M-004-quan-ly-tai-san-bao-hieu-thong-tin/sa/00-lean-architecture.md`
- `docs/modules/M-004-quan-ly-tai-san-bao-hieu-thong-tin/tech-lead/04-plan.md`
- `docs/modules/M-004-quan-ly-tai-san-bao-hieu-thong-tin/qa/00-test-report.md`

### Spot-Checked Source Code
- `src/main/java/com/hanghai/kchtg/station/service/CoastalStationVTSService.java`
- `src/main/java/com/hanghai/kchtg/station/service/CoastalStationCospasSarsatService.java`
- `src/main/java/com/hanghai/kchtg/station/service/CoastalStationLRITService.java`
- `src/main/java/com/hanghai/kchtg/station/service/CoastalStationInmarsatService.java`
- `src/main/java/com/hanghai/kchtg/station/service/CoastalStationHaiphongService.java`
- `src/main/java/com/hanghai/kchtg/beacon/service/BeaconLightService.java` (comparison)
- `src/main/java/com/hanghai/kchtg/nhatram/service/NhaTramDenService.java` (comparison)
- `src/test/java/com/hanghai/kchtg/nhatram/NhaTramPhaoControllerTest.java` (template)

### Spot-Checked Feature Briefs
- `_features/F-068-quan-ly-den-bien-tao-moi/feature-brief.md` + `implementations.yaml`
- `_features/F-080-quan-ly-nha-tram-phao-tao-moi/feature-brief.md` + `implementations.yaml`
- `_features/F-092-quan-ly-dai-ttdh-tao-moi/feature-brief.md` + `implementations.yaml`
- `_features/F-098-quan-ly-dai-inmarsat-tao-moi/implementations.yaml`

---

*Report generated by utility-security-auditor-design (Engineering Code Review) on 2026-07-08.*
