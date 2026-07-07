---
feature-id: M-002
stage: validation
agent: sdlc-qa
verdict: Fail
critical-ac-total: 12
critical-ac-verified: 4
last-updated: 2026-06-28
---

# QA Report — M-002 Quản lý tài sản KCHTGT - Cảng & Bến (Wave 1 Consolidated)

## 1. Feature / Change Overview

| Field | Value |
|---|---|
| module-id | M-002 |
| scope | F-008..F-037 (30 features, 5 entity groups: CangBien/BenCang/CauCang/CangCan/VungNuoc) |
| wave | W1-W4 consolidated |
| risk-score | 3 (RBAC + approval workflow + file upload/MinIO + audit logging) |
| service-path | src/main/java/com/hanghai/kchtg/cangben/ |
| entities delivered | 5 (CangBien, BenCang, CauCang, CangCan, VungNuoc) |

## 2. Test Scope

### 2.1 Included

- All 5 entity Java source files + repositories + services + approval services + controllers + shared services
- Flyway DDL migrations V14-V17 (CangBien, BenCang, CauCang, CangCan)
- W0 shared infra: ApprovalWorkflowService, LichSuThayDoiService, AuditLogService, CangBenNotificationService, GiayToService
- GiayTo file attachment (W4): entity, controller, service, DTO
- Compilation gate: `mvn -q -DskipTests compile`
- Full test suite execution: `mvn -DskipTests=false test`
- Security configuration analysis for endpoint RBAC coverage
- AC coverage analysis across all 30 feature briefs

### 2.2 Excluded

- UI/frontend (backend-only module)
- Playwright screenshots (no web UI)
- MinIO live integration (MinIO stub only, no real MinIO available)
- Performance load testing
- Database-connected integration tests (no test DB provisioned)

### 2.3 Assumptions and Constraints

- Tests run on JVM 25 (Homebrew OpenJDK); Mockito inline mock failures are a pre-existing JVM-25 incompatibility affecting many modules — NOT introduced by M-002.
- Default Spring profile = `local` with `ddl-auto: update`. Production profile uses `ddl-auto: validate` — missing migrations will cause startup failure in `prod`.
- LichSuThayDoiService and PheDuyetLog services exist as stubs that log to console but do NOT persist to DB (no entity class or migration for `lich_su_thay_doi` or `phe_duyet_log` tables).

## 2b. Traceability / Code Connect Evidence

### 2b.1 Scope components

| Component | Expected | Actual | Status |
|---|---|---|---|
| CangBien entity + repo + service + approval + controller | W1-T1/T2/T3 | Present | OK |
| BenCang entity + repo + service + approval + controller | W2-T1/T2 | Present | OK |
| CauCang entity + repo + service + approval + controller | W3-T1/T2 | Present | OK |
| CangCan entity + repo + service + approval + controller | W2-T3 | Present | OK |
| VungNuoc entity + repo + service + approval + controller | W3-T3 | Present | OK |
| GiayTo entity + repo + service + controller | W4-T1 | Present | OK |
| ApprovalWorkflowService (shared) | W0-T3 | Present | OK |
| LichSuThayDoiService (shared, stub) | W0-T3 | Present (no DB persistence) | Partial |
| AuditLogService (shared) | W0-T3 | Present | OK |
| CangBenNotificationService (shared, stub) | W4-T3 | Present | OK |
| Flyway V14 cang_bien DDL | W0-T1 | Present | OK |
| Flyway V15 ben_cang DDL | W0-T1 | Present | OK |
| Flyway V16 cau_cang DDL | W0-T1 | Present | OK |
| Flyway V17 cang_can DDL | W0-T1 | Present | OK |
| Flyway vung_nuoc DDL | W0-T1 | **MISSING** | FAIL |
| Flyway giay_to DDL | W0-T1 | **MISSING** | FAIL |
| Flyway lich_su_thay_doi DDL | W0-T1 | **MISSING** | FAIL |
| Flyway phe_duyet_log DDL | W0-T1 | **MISSING** | FAIL |
| Unit/integration tests for cangben package | W1-T4/W2-T4/W3-T4/W4-T4 | **MISSING** | FAIL |
| @PreAuthorize on cangben endpoints | W1-T3 (AC1 all features) | **MISSING** | FAIL |
| CangBien soft-delete child count guard (BenCang/VungNuoc) | W1-T1 BR | Stubbed (returns 0) | FAIL |

### 2b.2 Mapping coverage

- Files-in-scope delivered: 54/54 (100%) — all Java source files exist
- Flyway migrations: 4/8 (50%) — 4 tables missing DDL
- Unit/integration tests: 0/8 (0%) — all wave test tasks undelivered
- Authorization enforcement: 0/5 (0%) controllers have @PreAuthorize or equivalent

## 3. Requirement Coverage Matrix

| Requirement / AC | Feature(s) | Test Condition | Coverage Status | Notes |
|---|---|---|---|---|
| Create entity; reject duplicate code (409) | F-008/014/020/026/032 | Analytical: existsByMaX() guard present in all services | Analytical only | Service code inspected; no executable test |
| Default status CHO_PHE_DUYET on create | F-008/014/020/026/032 | Analytical: all services set `trangThaiPheDuyet = "CHO_PHE_DUYET"` | Analytical only | String literal, not enum — drift risk |
| Mandatory field validation | F-008/014/020/026/032 | Analytical: @NotBlank/@NotNull on all DTOs | Analytical only | Not executed |
| GPS coordinate validation (lat/lng range) | F-008/032 (VN-36) | Not implemented: no @DecimalMin/@DecimalMax on ViDo/KinhDo in CangBienRequest | NOT COVERED | Business rule BR-2 of F-008 missing from DTO |
| Code format VN-36 (6-10 chars, pattern) | F-008 | Not implemented: only @NotBlank, no @Pattern on maCang | NOT COVERED | BR-1 of F-008 missing |
| Area max 5000 km² | F-008 | Not implemented: no @DecimalMax on dienTich | NOT COVERED | BR-3 of F-008 missing |
| Update resets to CHO_PHE_DUYET | F-009/015/021/027/033 | Analytical: all services call resetToPending or set string explicitly | Analytical only | No test |
| Soft-delete blocked if active children | F-010 (CangBien→BenCang/VungNuoc) | FAIL: CangBienService.countBenCangByCangBienId() stubbed → always 0 | NOT COVERED | Child count guard non-functional |
| Parent CangBien must be hien_hanh to create BenCang | F-014 | NOT IMPLEMENTED: BenCangService checks parent exists but NOT parent status | NOT COVERED | Business rule from W2-T1 not enforced |
| Approve/reject state machine | F-011/017/023/029/035 | Analytical: ApprovalWorkflowService enforces CHO_PHE_DUYET guard | Analytical only | |
| Cannot approve non-pending entity | F-011/017/023/029/035 | Analytical: IllegalStateException thrown by ApprovalWorkflowService | Analytical only | |
| Reject requires reason | F-011/017/023/029/035 | Analytical: IllegalArgumentException if reason blank | Analytical only | |
| List pagination default 20, max 100 | F-012/018/024/030/036 | Analytical: all services cap at min(size,100) | Analytical only | |
| Org-unit filter for SPECIALIST role | F-012/018/024/030/036 | Analytical: `findAllActive(orgUnitId, pageable)` in repositories | Analytical only | Security enforcement untested |
| History returns change log | F-013/019/025/031/037 | FAIL: all history methods return empty list stub | NOT COVERED | LichSuThayDoi not persisted |
| Role-based access (cangbien:create/read/update/delete/approve) | ALL 30 features AC-1 | FAIL: no @PreAuthorize on any cangben controller | NOT COVERED | Only .authenticated() global rule — any authenticated user can approve |
| File upload MIME validation (PDF/DOCX/JPEG only) | F-008..F-037 GiayTo | Analytical: validateMimeType() in GiayToService | Analytical only | MIME from client header only — no Tika content verification |
| File size max 10MB | F-008..F-037 GiayTo | Analytical: MAX_FILE_SIZE constant present | Analytical only | |
| Audit log written on create/update/approve | F-008..F-037 | Analytical: AuditLogService injected in controllers/approval services | Analytical only | Not injected in CauCangService/VungNuocService per W3 notes |
| VungNuoc table exists at runtime | F-032..F-037 | FAIL: no Flyway migration for vung_nuoc table | NOT COVERED | Entity references `vung_nuoc` table; prod startup will fail with ddl-auto:validate |
| giay_to table exists at runtime | F-008..F-037 | FAIL: no Flyway migration for giay_to table | NOT COVERED | Same as above |
| lich_su_thay_doi table exists at runtime | ALL history ACs | FAIL: no migration; service is stub only | NOT COVERED | |
| phe_duyet_log table exists at runtime | ALL approval ACs | FAIL: no migration; PheDuyetLog entity class missing | NOT COVERED | |

## 4. Test Strategy

### 4.1 Happy Path
**Designed (not executed — no test files exist):**
- Create CangBien with valid data → 201; status = CHO_PHE_DUYET
- Approve CangBien (CHO_PHE_DUYET) → status = DUOC_PHE_DUYET
- Update approved CangBien → status resets to CHO_PHE_DUYET
- List with pagination page=0, size=20
- Upload GiayTo (PDF, ≤10MB) → 200, metadata saved

### 4.2 Negative Path
**Designed (not executed):**
- Duplicate maCang on create → 409
- Approve entity not in CHO_PHE_DUYET → 422 (IllegalStateException)
- Reject without reason → 400 (IllegalArgumentException)
- Get non-existent entity → 404 (EntityNotFoundException)
- Upload file with MIME image/gif → 400/415

### 4.3 Edge Cases
**Designed (not executed):**
- GPS latitude = 91.0 (out of range) → expect 400; ACTUAL: not validated — passes through
- Area = 6000 km² → expect 400; ACTUAL: not validated — passes through
- maCang = "AB" (< 6 chars) → expect 400; ACTUAL: only @NotBlank, no length validation
- Soft-delete CangBien with active BenCang children → expect 409; ACTUAL: always allowed (stub returns 0)

### 4.4 Permission / Role Cases
**Critical gap — designed but unverifiable:**
- Nhân viên vận hành calling POST /api/v1/cang-bien → should 403; ACTUAL: no @PreAuthorize, only authenticated() applies
- Non-admin user calling POST /api/v1/cang-bien/{id}/approve → should 403; ACTUAL: any authenticated user can approve

### 4.5 Integration Cases
**Designed (not executed due to no test DB):**
- Create BenCang when parent CangBien does NOT exist → 404 (parent FK guard exists in service)
- Create CauCang when parent BenCang not in hien_hanh → currently NOT enforced

### 4.6 Data / State Transition Cases
- CHO_PHE_DUYET → DUOC_PHE_DUYET (approve) — state machine present
- CHO_PHE_DUYET → TU_CHOI (reject) — state machine present
- DUOC_PHE_DUYET → (update triggers) → CHO_PHE_DUYET — present in services
- Update → no PheDuyetLog persisted (stub)

### 4.7 Regression Scope
- Orgunit package: W4 fixed 4 orgunit DTO/service source files (Double→BigDecimal); test file `OrganizationServiceTest.java:366` PASSES (BigDecimal.valueOf(1.0) is valid) — test-compile succeeds as of this run
- Broader project: 719 test errors are pre-existing JVM-25 Mockito incompatibility (beacon, totp, etc.) — pre-date M-002 work

## 5. Test Cases

| ID | Scenario | Preconditions | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|---|
| TC-M002-01 | Create CangBien with valid data | DB clean, user authenticated as admin | POST /api/v1/cang-bien with valid body | 200, trangThaiPheDuyet=CHO_PHE_DUYET | Critical | Not executed (no test file) |
| TC-M002-02 | Duplicate maCang rejected | CangBien with code CB001 exists | POST /api/v1/cang-bien with maCang=CB001 | 409 / IllegalArgumentException | Critical | Not executed |
| TC-M002-03 | Approve CangBien | Entity in CHO_PHE_DUYET state | POST /api/v1/cang-bien/{id}/approve | 200, state=DUOC_PHE_DUYET | Critical | Not executed |
| TC-M002-04 | Approve non-pending entity | Entity in DUOC_PHE_DUYET state | POST /api/v1/cang-bien/{id}/approve | 422, IllegalStateException | Critical | Not executed |
| TC-M002-05 | Reject without reason | Entity in CHO_PHE_DUYET | POST /api/v1/cang-bien/{id}/reject?userId=X (no reason) | 400 | High | Not executed |
| TC-M002-06 | Unauthorized approval attempt | User without cangbien:approve permission | POST /api/v1/cang-bien/{id}/approve | 403 | Critical | Not executed; EXPECTED TO FAIL (no @PreAuthorize) |
| TC-M002-07 | GPS out-of-range validation | None | POST CangBien with viDo=91.0 | 400 | High | Not executed; EXPECTED TO FAIL (no validation) |
| TC-M002-08 | Area exceeds 5000 km² | None | POST CangBien with dienTich=6000 | 400 | Medium | Not executed; EXPECTED TO FAIL |
| TC-M002-09 | Soft-delete CangBien with active BenCang | Parent CangBien has 1 active BenCang | DELETE /api/v1/cang-bien/{id} | 409 | High | Not executed; EXPECTED TO FAIL (stub returns 0) |
| TC-M002-10 | Create BenCang with hien_hanh parent | None (parent status check missing) | POST BenCang with parent in CHO_PHE_DUYET | should 422; actual: likely 200 | High | Not executed; EXPECTED TO FAIL |
| TC-M002-11 | GiayTo upload with invalid MIME | None | POST /api/v1/giay-to with image/gif | 400/415 | High | Not executed |
| TC-M002-12 | GiayTo upload >10MB file | None | POST with 11MB file | 400 | Medium | Not executed |
| TC-M002-13 | VungNuoc entity DB table missing | prod profile (ddl-auto:validate) | Application startup | Should fail at Flyway/Hibernate validation | Blocker | Confirmed analytically: no V18+ migration for vung_nuoc |
| TC-M002-14 | giay_to DB table missing | prod profile | Application startup | Fail at Hibernate validation | Blocker | Confirmed analytically |
| TC-M002-15 | History returns empty always | None | GET /api/v1/cang-bien/{id}/history | Returns empty list (stub) | High | Confirmed analytically: LichSuThayDoiService logs only, no DB write |
| TC-M002-16 | Pagination size > 100 capped | None | GET /api/v1/cang-bien?size=500 | Returns at most 100 | Medium | Not executed |

## 6. Execution Results

| Test Case ID | Status | Evidence Type | Evidence |
|---|---|---|---|
| TC-M002-01..02 | Skipped | — | No test files in src/test/java/com/hanghai/kchtg/cangben/ |
| TC-M002-06 (auth) | Fail (predicted) | Analytical | SecurityConfig.java: only .authenticated() for /api/**; no @PreAuthorize in any cangben controller |
| TC-M002-07/08 (GPS/area validation) | Fail (predicted) | Analytical | CreateCangBienRequest DTO has @NotBlank/@NotNull but no @DecimalMin/@DecimalMax/@Pattern on viDo/kinhDo/dienTich |
| TC-M002-09 (child delete guard) | Fail (predicted) | Analytical | CangBienService.java:156-165: countBenCangByCangBienId() returns 0 (stub) |
| TC-M002-10 (parent status guard) | Fail (predicted) | Analytical | BenCangService: checks parent exists (FK) but not trangThaiHoatDong == hien_hanh |
| TC-M002-13/14 (missing DDL) | Fail (confirmed) | Analytical | No SQL file matching vung_nuoc or giay_to in src/main/resources/db/migration/ |
| TC-M002-15 (history stub) | Fail (confirmed) | Analytical | LichSuThayDoiService.java: no DB insert, returns empty list from ApprovalService |
| Compilation gate | Pass | Executed | `mvn -q -DskipTests compile` → EXIT=0; 625 source files compiled |
| Test suite run | Executed with failures | Executed | 1206 tests run; 682 errors all JVM-25 Mockito pre-existing; 0 cangben-specific tests run (no tests exist) |

**Evidence type split: Executed=2 (compile gate + test suite invocation), Analytical=14**

## 7. Defects Found

| Defect ID | Title | Severity | Priority | Reproduction Steps | Expected | Actual | Impact |
|---|---|---|---|---|---|---|---|
| D-M002-01 | Missing Flyway migrations for vung_nuoc and giay_to tables | Blocker | P1 | Start application with `spring.profiles.active=prod` (ddl-auto:validate) | Application starts; tables exist | Startup fails — Hibernate cannot validate VungNuoc and GiayTo entities against non-existent tables | F-032..F-037 (VungNuoc), F-008..F-037 GiayTo completely non-functional in prod |
| D-M002-02 | Missing Flyway migrations for lich_su_thay_doi and phe_duyet_log tables | Blocker | P1 | Same as above | Audit/history tables exist | Tables absent from schema | History (F-013/019/025/031/037) and approval logs functionally broken in prod |
| D-M002-03 | Zero unit/integration test files for cangben package | Critical | P1 | Check src/test/java/com/hanghai/kchtg/cangben/ | Test suites per wave plan W1-T4/W2-T4/W3-T4/W4-T4 | Directory does not exist; no tests | Cannot execute automated regression; all 30 features unverified by automated test |
| D-M002-04 | No RBAC enforcement on cangben endpoints — any authenticated user can approve/delete | Critical | P1 | Authenticate as low-privilege user (nhân viên vận hành); call POST /api/v1/cang-bien/{id}/approve | 403 Forbidden | 200 OK (approval succeeds) | All 30 features' AC-1 (role-based access) unmet; approval workflow security compromised |
| D-M002-05 | GPS coordinate and area range validation missing from CangBien/VungNuoc DTOs | Major | P2 | POST /api/v1/cang-bien with viDo=500.0, kinhDo=-999.0, dienTich=99999.0 | 400 Bad Request | 200 OK (invalid data persisted) | F-008 BR-1/BR-2/BR-3; data integrity of geographic coordinates |
| D-M002-06 | CangBien soft-delete child count guard is a stub — always allows deletion | Major | P2 | Create CangBien with 1 active BenCang child; DELETE parent | 409 (children exist) | 200 OK (deleted despite children) | F-010 data integrity; orphaned BenCang/VungNuoc records |
| D-M002-07 | BenCang creation does not validate parent CangBien status (hien_hanh guard missing) | Major | P2 | Create BenCang with parent in CHO_PHE_DUYET state | 422 / error | 201 (BenCang created under non-active parent) | F-014 business rule from wave plan W2-T1 unimplemented |
| D-M002-08 | History endpoints return empty list stubs — LichSuThayDoi never persisted | Major | P2 | Create/update CangBien; GET /api/v1/cang-bien/{id}/history | Returns change records | Returns `{"historyRecords":[]}` always | F-013/019/025/031/037 (all history ACs) |
| D-M002-09 | AuditLogService not injected in CauCangService and VungNuocService | Minor | P3 | Update CauCang; check audit_log table | Audit entry written | No audit entry for CauCang/VungNuoc updates | F-021/022/033/034 auditability |
| D-M002-10 | GiayTo MIME validation uses client-declared type — Tika content detection deferred | Minor | P3 | Upload file with renamed extension (e.g. .exe renamed to .pdf) | Rejected by content inspection | Accepted (MIME from Content-Type header only) | F-008..F-037 file security; acknowledged in W4 as deferred risk |

## 8. NFR Observations

### 8.1 Security Behavior

CRITICAL: All 5 entity controllers (CangBienController, BenCangController, CauCangController, CangCanController, VungNuocController) have zero method-level security annotations. SecurityConfig.java provides only `@EnableMethodSecurity(prePostEnabled = true)` at class level and `.requestMatchers("/api/**").authenticated()` — meaning authentication (valid JWT) is enforced, but **authorization** (permission codes `cangbien:approve`, `cangbien:delete`, etc.) is NOT enforced. Any valid JWT holder can perform any CRUD or approval action on any entity.

The controller Javadoc comment on CangBienController.java line 32-35 describes the intended `@auth.check(authentication, 'cangbien:action')` pattern but it is NOT implemented in any endpoint method.

### 8.2 Performance Concerns

- GiayToService.listByEntity() loads full entity list into memory before converting to Page (Decision 3 in W4 notes). Acceptable for low attachment counts but could become a problem if many attachments accumulate per entity.
- No concerns identified in pagination logic (size capped at 100).

### 8.3 Audit / Logging

- AuditLogService writes to `audit_log` table (via AuditLogRepository) — this table presumably exists from prior migrations. Injection confirmed in CangBienApprovalService and BenCangApprovalService.
- CauCangService and VungNuocService do NOT inject AuditLogService per W3 dev notes — audit trail incomplete for 2 of 5 entities.
- LichSuThayDoiService is a logging-only stub — field-level change history is never persisted (table missing, entity missing). The `lich_su_thay_doi` table required by wave plan W0-T1 was not created.
- PheDuyetLog: no entity class, no migration, no persistence — approval decisions are not logged to DB.

### 8.4 Reliability / Resilience

- MinIO integration is fully stubbed. GiayToService logs MinIO key to console but does not call any MinIO client. File binaries are not stored anywhere. This is acknowledged as deferred (W0 spec), but it means F-008..F-037 file attachment functionality is non-functional end-to-end.
- Transactional boundaries are correctly applied (@Transactional on mutations, @Transactional(readOnly=true) on reads).

### 8.5 Usability Concerns

- CangBienController.reject() calls `cangBienApprovalService.approve(id, userId, reason)` — correct behavior (approve() is dual-purpose) but the naming is confusing and could cause maintainability issues. Low risk, flagged for review.

## 9. Regression Impact Assessment

| Area | Impact | Evidence |
|---|---|---|
| orgunit package | W4 fixed Double→BigDecimal type mismatch in 4 orgunit source files. OrganizationServiceTest.java now compiles and runs (0 tests but no error). | test-compile: BUILD SUCCESS |
| Pre-existing JVM-25 Mockito failures | 682 errors in beacon/totp/group packages are pre-existing; M-002 work did not introduce or worsen them. | `mvn test` output: errors limited to beacon.*,TotpAuthServiceTest,GroupController — no cangben package tests |
| Redis repository scan warning | 6 cangben repositories trigger Spring Data Redis "cannot safely identify" INFO warnings at startup — harmless but indicates missing `@Repository` qualifier or explicit `@EnableJpaRepositories` scoping. Not a blocker. | Test run log output |

## 10. Test Limitations / Gaps

1. **Zero automated tests for cangben package**: Wave plan tasks W1-T4, W2-T4, W3-T4, W4-T4 all specified unit/integration test suites. None were delivered. This is a structural gap — QA cannot produce Pass verdict without at minimum a smoke-level integration test.
2. **No test database**: Functional integration tests (create→approve flow) cannot be verified without a running database. All functional coverage is analytical.
3. **MinIO stub**: File upload end-to-end cannot be tested.
4. **Missing migrations block prod startup**: Tests cannot be run in a production-like environment until V18-V21 (or equivalent) migrations are provided.
5. **RBAC not testable without @PreAuthorize**: Permission enforcement cannot be verified until controllers are annotated.
6. **VN-36 code format validation**: The wave plan specifies VN-36 format for maCang (6-10 chars, pattern). CreateCangBienRequest has only @NotBlank — pattern constraint is absent. Cannot verify format rejection without both the @Pattern annotation and an executable test.

## 11. Release Recommendation

**DO NOT RELEASE.** The following blocking issues must be resolved before M-002 is release-ready:

1. (Blocker) Create Flyway migrations for `vung_nuoc`, `giay_to`, `lich_su_thay_doi`, `phe_duyet_log` tables — application will fail startup in prod with ddl-auto:validate.
2. (Critical) Add @PreAuthorize annotations to all cangben controller endpoints — approval and delete operations are unprotected by role.
3. (Critical) Deliver unit/integration test suites per W1-T4/W2-T4/W3-T4/W4-T4 scope in wave plan — currently 0 tests cover any M-002 functionality.
4. (Major) Wire CangBienService child-count guards to actual BenCangRepository/VungNuocRepository — soft-delete guard is non-functional.
5. (Major) Implement parent-status guard in BenCangService (parent CangBien must be hien_hanh).
6. (Major) Add GPS range and area size Bean Validation constraints to CreateCangBienRequest (and CreateVungNuocRequest for coordinates).

Items 4-6 can be parallel to items 1-3. A minimum viable second review is possible once items 1-3 are resolved and an integration test delivers executed evidence.

## 12. QA Verdict

**Fail**

Rationale:
- 4 Flyway migrations missing → prod startup failure confirmed analytically (Blocker × 2)
- RBAC entirely absent from endpoint layer → Critical security gap
- 0 automated tests for 30 features → no executable evidence for any AC
- 5 business rules unimplemented (child-delete guard, parent-status guard, GPS validation, area validation, code format validation)
- AC coverage: 4/12 critical ACs verified analytically (approval state machine logic, pagination enforcement, duplicate code rejection, entity FK checks); 8/12 critical ACs either not implemented or not verifiable

---

## QA → Handoff Summary

**Verdict:** Fail
**AC coverage:** 4/12 critical ACs verified (analytical); 8/12 unverified or known-failing
**Evidence type split:** 2 executed (compile gate + test suite run) / 14 analytical
**Defects found:** 2 Blockers, 2 Critical, 4 Major, 2 Minor
**Top defect for reviewer attention:** D-M002-04 — No RBAC enforcement on any cangben endpoint; any authenticated user can approve/delete assets (Critical, all 30 features affected)
**NFR observations:** Authorization gap (all endpoints unprotected beyond authentication); missing DB audit persistence (lich_su_thay_doi/phe_duyet_log stubs only); MinIO fully stubbed (file storage non-functional)
**Test gaps reviewer should note:** Zero automated tests exist for cangben package — all AC verification is static code analysis only. Release decision must require minimum integration test evidence before re-review.

---

```json
{
  "agent": "sdlc-qa",
  "stage": "validation",
  "verdict": "Fail",
  "confidence": "high",
  "escalate_recommended": false,
  "escalation_reason": "",
  "next_owner": "sdlc-dev",
  "coverage": { "critical_ac_total": 12, "critical_ac_verified": 4 },
  "evidence_type_split": { "executed": 2, "analytical": 14 },
  "missing_artifacts": [
    "src/test/java/com/hanghai/kchtg/cangben/ (all test suites)",
    "Flyway V??__create_vung_nuoc.sql",
    "Flyway V??__create_giay_to.sql",
    "Flyway V??__create_lich_su_thay_doi.sql",
    "Flyway V??__create_phe_duyet_log.sql"
  ],
  "blockers": [
    "D-M002-01: Missing Flyway DDL for vung_nuoc and giay_to — prod startup failure",
    "D-M002-02: Missing Flyway DDL for lich_su_thay_doi and phe_duyet_log",
    "D-M002-03: Zero unit/integration tests for entire cangben package",
    "D-M002-04: No @PreAuthorize on any cangben controller endpoint"
  ],
  "risk_score": "4",
  "risk_level": "critical",
  "evidence_refs": [
    "docs/modules/M-002-quan-ly-tai-san-kchtgt-cang-ben/qa/07-qa-report.md",
    "docs/modules/M-002-quan-ly-tai-san-kchtgt-cang-ben/dev/05-dev-w2-bencang-cangcan.md",
    "docs/modules/M-002-quan-ly-tai-san-kchtgt-cang-ben/dev/05-dev-w3-caucang-vungnuoc.md",
    "docs/modules/M-002-quan-ly-tai-san-kchtgt-cang-ben/dev/05-dev-w4-giayto-hardening.md",
    "src/main/resources/db/migration/V14__create_cang_bien.sql",
    "src/main/java/com/hanghai/kchtg/cangben/controller/CangBienController.java",
    "src/main/java/com/hanghai/kchtg/config/SecurityConfig.java",
    "src/main/java/com/hanghai/kchtg/cangben/service/CangBienService.java"
  ],
  "sub_dispatch_count": 0,
  "sub_dispatch_degraded": false,
  "token_usage": {
    "input": 9500,
    "output": 4500,
    "this_agent": 14000,
    "pipeline_total": 14000
  }
}
```
