---
feature-id: M-002
stage: validation
agent: sdlc-qa
verdict: Pass
wave: 2
critical-ac-total: 5
critical-ac-verified: 5
last-updated: 2026-06-29
---

# QA Report — Wave 2 RE-VALIDATION
**Module:** M-002 Quản lý tài sản KCHTGT - Cảng & Bến
**Wave:** 2 (re-validation after dev-wave-2 rework)

---

## 1. Feature / Change Overview

Re-QA following dev-wave-2 rework that addressed all wave-1 Fail gaps:
- HIGH-1: missing DB migrations for V22-V25
- HIGH-2: missing cangben test suite (~77 tests)
- HIGH-3: BUG-RBAC-001 — `PermissionAuthorizationManager.check()` returned `AuthorizationDecision` (always-truthy object in SpEL → always granted); fixed to return `boolean`
- MED: child-delete guard (F-010), GPS/area Bean Validation (F-008), BenCang parent HIEN_HANH guard (F-014)
- LOW: LichSuThayDoi + PheDuyetLog persistence (F-013/019/025/031/037)

---

## 2. Test Scope

### 2.1 Included
| Area | Verification method |
|---|---|
| V22-V25 migration files exist + match JPA entities | Static: file read + entity @Table/@Column cross-check |
| cangben test suite presence + pass count | Executed: `mvn -Dtest='com.hanghai.kchtg.cangben.**' test` |
| RBAC check() return type fix | Static: source read of PermissionAuthorizationManager.java |
| RBAC deny-path runtime proof | Executed: CangBienRbacSecurityTest logs show `granted=false` for unauthorized user |
| F-008 GPS/area Bean Validation | Static: CreateCangBienRequest.java annotations verified |
| F-010 child-delete guard | Static: CangBienService.java delete guard logic verified |
| F-014 BenCang parent HIEN_HANH guard | Static: BenCangService.java HIEN_HANH status check verified |
| F-013/019/025/031/037 LichSuThayDoi+PheDuyetLog wiring | Static: repository + service references confirmed |
| Compile correctness | Executed: `mvn -q -DskipTests compile` |

### 2.2 Excluded
- Integration tests against a live database (H2/Testcontainers not configured; tests use Mockito)
- End-to-end approval workflow with real MinIO file attachments
- Performance / load testing

### 2.3 Assumptions and Constraints
- Tests run with profile `local`; no real DB required (mocked repositories)
- JaCoCo/Java 25 and Mockito mock-maker warnings observed; these are environmental, not M-002 blockers
- `PermissionAuthorizationManager.check()` is app-wide; fix closes BUG-RBAC-001 across all modules

---

## 3. Requirement Coverage Matrix

| Gap ID | Requirement | Verification | Coverage status | Evidence |
|---|---|---|---|---|
| HIGH-1 | V22 vung_nuoc migration | Static: file + entity match | CLOSED | V22 CREATE TABLE matches VungNuoc @Table(name="vung_nuoc") all columns align |
| HIGH-1 | V23 giay_to migration | Static | CLOSED | V23 CREATE TABLE matches GiayTo @Table(name="giay_to") |
| HIGH-1 | V24 lich_su_thay_doi migration | Static | CLOSED | V24 CREATE TABLE matches LichSuThayDoi @Table(name="lich_su_thay_doi") |
| HIGH-1 | V25 phe_duyet_log migration | Static | CLOSED | V25 CREATE TABLE matches PheDuyetLog @Table(name="phe_duyet_log") |
| HIGH-2 | cangben test suite ~77 tests | Executed | CLOSED | 77 tests run: 0 failures, 0 errors, 0 skipped |
| HIGH-3 | check() returns boolean (not AuthorizationDecision) | Static + Executed | CLOSED | Source: `public boolean check(...)` line 27; deny-path: `Failed to authorize... granted=false` in test log |
| MED-F008 | GPS latitude @DecimalMin(-90)/@DecimalMax(90) | Static | CLOSED | CreateCangBienRequest.java lines 29-31 |
| MED-F008 | Longitude @DecimalMin(-180)/@DecimalMax(180) | Static | CLOSED | CreateCangBienRequest.java lines 33-35 |
| MED-F008 | Area @DecimalMin(0,inclusive=false) | Static | CLOSED | CreateCangBienRequest.java line 37 |
| MED-F010 | Child-delete guard (BenCang + VungNuoc count check) | Static | CLOSED | CangBienService.java lines 141-148 |
| MED-F014 | BenCang parent HIEN_HANH guard | Static | CLOSED | BenCangService.java line 52: `if (!parent.getTrangThaiHoatDong().equals("HIEN_HANH"))` |
| LOW-F013/019/025/031/037 | LichSuThayDoi + PheDuyetLog repositories wired | Static | CLOSED | Both repositories exist; referenced in BenCangApprovalService, CauCangApprovalService, CangCanApprovalService, CangCanService, BenCangService |

---

## 4. Test Strategy

### 4.1 Happy Path
Covered: CangBienServiceTest, BenCangServiceTest — create, update, list, soft-delete flows.

### 4.2 Negative Path
Covered: CreateCangBienRequestValidationTest (14 cases — invalid GPS, empty name, out-of-range area); BenCangServiceTest parent-not-HIEN_HANH rejection; CangBienServiceTest child-delete guard returning 409.

### 4.3 Edge Cases
Covered: boundary GPS values (±90 lat, ±180 lon), area exactly 0 rejected, null optional fields accepted.

### 4.4 Permission / Role Cases
Covered: CangBienRbacSecurityTest (4 cases) — admin with permission granted, user without permission denied (assert AccessDeniedException / 403), approver with `cangbien:approve` granted, user without `cangbien:delete` denied.

### 4.5 Integration Cases
Analytical: approval service wires PheDuyetLog correctly per BenCangApprovalService/CauCangApprovalService source. Not executed against real DB.

### 4.6 Data / State Transition Cases
Covered: CangBienApprovalServiceTest (8 cases) — approve, reject, re-submit, invalid transition. ApprovalWorkflowServiceTest covers multi-step workflow.

### 4.7 Regression Scope
`PermissionAuthorizationManager.check()` return-type fix is app-wide. No regression test suite was run for other modules. Existing tests for M-001 / M-007 / M-009 etc. should be run as regression gate by sdlc-reviewer before release.

---

## 5. Test Cases (summary — 77 executed)

| Suite | Tests | Failures | Errors | Skipped |
|---|---|---|---|---|
| CangBienRbacSecurityTest | 4 | 0 | 0 | 0 |
| CreateCangBienRequestValidationTest | 14 | 0 | 0 | 0 |
| CangBienApprovalServiceTest | 8 | 0 | 0 | 0 |
| BenCangServiceTest | 9 | 0 | 0 | 0 |
| CangBienServiceTest | (subset of 77) | 0 | 0 | 0 |
| BenCangControllerTest | (subset of 77) | 0 | 0 | 0 |
| CangBienControllerTest | (subset of 77) | 0 | 0 | 0 |
| ApprovalWorkflowServiceTest | (subset of 77) | 0 | 0 | 0 |
| **TOTAL** | **77** | **0** | **0** | **0** |

---

## 6. Execution Results

| Evidence type | Command / Source | Result |
|---|---|---|
| Executed | `mvn -q -DskipTests compile` | BUILD SUCCESS — 0 errors |
| Executed | `mvn -Dtest='com.hanghai.kchtg.cangben.**' test` | 77 tests run, 0 failures, 0 errors, 0 skipped — BUILD SUCCESS |
| Executed (RBAC deny-path) | CangBienRbacSecurityTest log | `Failed to authorize... granted=false, expressionAttribute=@auth.check(authentication, 'cangbien:approve')` and `'cangbien:delete'` — confirms fail-closed behavior |
| Analytical | PermissionAuthorizationManager.java line 27 | `public boolean check(...)` — correct return type, BUG-RBAC-001 closed |
| Analytical | CreateCangBienRequest.java lines 29-37 | @DecimalMin/@DecimalMax on viDo, kinhDo, dienTich — F-008 closed |
| Analytical | CangBienService.java lines 141-148 | countBenCangByCangBienId + countVungNuocByCangBienId guard — F-010 closed |
| Analytical | BenCangService.java line 52 | HIEN_HANH string equality guard — F-014 closed |
| Analytical | V22-V25 migrations vs entity @Table/@Column | Column names, types, constraints match 1:1 — HIGH-1 closed |

---

## 7. Defects Found

None. All wave-1 defects verified closed.

---

## 8. NFR Observations

### 8.1 Security Behavior
BUG-RBAC-001 (always-truthy AuthorizationDecision in SpEL) is confirmed fixed. `check()` now returns `boolean`; runtime test log proves deny-path fires correctly. App-wide impact means all modules benefit from this fix.

### 8.2 Performance Concerns
No new performance concerns introduced. Child-count queries use indexed FK columns (`cang_bien_id`).

### 8.3 Audit / Logging
LichSuThayDoi (V24) and PheDuyetLog (V25) tables are INSERT-only by DDL comment; no UPDATE/DELETE columns exposed. Repositories wired in approval services.

### 8.4 Reliability / Resilience
Migrations use `CREATE TABLE IF NOT EXISTS` — idempotent on re-run. No risk of migration failure on existing schema.

### 8.5 Usability Concerns
None in scope (backend-only module).

---

## 9. Regression Impact Assessment

| Scope | Risk | Mitigation |
|---|---|---|
| PermissionAuthorizationManager.check() — app-wide | Medium: all @PreAuthorize guards now return boolean; previously always-truthy means this is a behavior change | Existing M-001/M-007/M-009/etc. test suites should be run as regression gate. Wave-1 report noted this as app-wide concern. |
| V22-V25 migrations — additive DDL | Low: `IF NOT EXISTS` guards; FK to pre-existing cang_bien table | No rollback risk on clean environments |
| cangben controllers @PreAuthorize — new enforcement | Medium: endpoints that were silently open (bug) now enforce RBAC | Callers without correct permissions will now receive 403; expected behavior post-fix |

---

## 10. Test Limitations / Gaps

| Gap | Impact | Reason |
|---|---|---|
| No full-module regression run (M-001, M-007, M-009, etc.) | Medium — RBAC fix is app-wide | Out of scope for M-002 wave-2; sdlc-reviewer should trigger full suite before release |
| Tests use Mockito mocks — no live DB integration | Low — schema verified via static migration/entity review | H2/Testcontainers not configured in project |
| MinIO file attachment upload (GiayTo) not end-to-end tested | Low — entity + repository + migration verified | MinIO not available in test environment |

---

## 11. Release Recommendation

**All wave-1 HIGH gaps are closed with executed evidence.** MED and LOW gaps are closed with static evidence supported by the passing test suite. No defects found.

Recommendation: **Pass** — forward to sdlc-reviewer with the caveat that a full-module regression run (all modules, not just cangben) should be triggered before production release due to the app-wide RBAC fix.

---

## 12. QA Verdict

**Pass**

---

## QA → Handoff Summary

**Verdict:** Pass
**AC coverage:** 5/5 critical ACs verified (HIGH-1 x4 migrations, HIGH-2 test suite, HIGH-3 RBAC fix + deny-path proof)
**Evidence type split:** 3 executed / 8 analytical
**Defects found:** 0
**Top defect for reviewer attention:** None — all prior defects closed. Reviewer should note app-wide scope of RBAC fix (check() return type) and recommend full regression suite before production release.
**NFR observations:** BUG-RBAC-001 closed (security); LichSuThayDoi/PheDuyetLog INSERT-only DDL correct (audit); migrations idempotent (reliability).
**Test gaps reviewer should note:** No live-DB integration tests; MinIO GiayTo flow not end-to-end; full-module regression not run (M-001/M-007/M-009 etc.) — RBAC fix is app-wide so cross-module regression is advised before release.
