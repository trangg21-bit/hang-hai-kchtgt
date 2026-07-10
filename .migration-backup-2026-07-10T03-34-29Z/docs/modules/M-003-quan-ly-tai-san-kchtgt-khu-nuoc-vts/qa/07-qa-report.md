---
feature-id: M-003
stage: validation
agent: sdlc-qa
verdict: Fail
critical-ac-total: 30
critical-ac-verified: 23
last-updated: 2026-07-01
---

# QA Report — M-003 Khu nước & VTS (Wave 1)

## 1. Feature / Change Overview

Wave 1 dev fixes addressed 4 SA security findings (SF-001..SF-004) across 5 domains:
luonghanghai, deke, cosuachua, tramradar, vts (F-038..F-067, 30 features).
Wave 2 task: add RBAC deny-path tests following M-002 cangben idiom.

## 2. Test Scope

### 2.1 Included
- @PreAuthorize coverage on all controller endpoints (SF-001/SF-002)
- Permission code normalization to colon style (SF-003)
- RolePermissionSeeder M-003 count = 35 codes (SF-003)
- ApiResponse<T> return type on TramRadar + CoSuaChua (SF-004)
- Compile gate: `mvn -q -DskipTests compile`
- Test suite: 15 test classes across 5 domains (214 tests executed)

### 2.2 Excluded
- RBAC deny-path @WebMvcTest / @SpringBootTest integration tests (not yet added — W2 task gap)
- Runtime integration (no running DB/app environment)
- Performance / SLO validation

### 2.3 Assumptions and Constraints
- Java 17 / temurin-17.jdk enforcer constraint respected
- Tests run against mock layer; SpringBootTest context load requires full app context with DB

## 3. Requirement Coverage Matrix

| Requirement | Test Condition | Coverage Status | Notes |
|---|---|---|---|
| SF-001: TramRadarController @PreAuthorize all 9 endpoints | Code inspection: 9/9 endpoints annotated | PASS | create, read(x3), update, delete, approveC1, approveC2, history |
| SF-002: CoSuaChuaDongTauController @PreAuthorize all 9 endpoints | Code inspection: 9/9 endpoints annotated | PASS | create, read(x3), update, delete, approveC1, approveC2, history |
| SF-001/SF-002 extended: LuongHangHai, DeKe, VTS @PreAuthorize | Code inspection: all endpoints annotated | PASS | 10 endpoints each for luonghanghai/deke; 9 for vts |
| SF-003: Permission codes colon-normalized | RolePermissionSeeder: 35 M-003 codes, all `entity:action` / `entity:approve:cN` | PASS | 5 entities × 7 actions = 35 |
| SF-004: ApiResponse<T> return types | TramRadarController + CoSuaChuaDongTauController confirmed | PASS | Both controllers wrap all responses in ApiResponse<T> |
| W2 RBAC deny-path tests | No @WebMvcTest deny tests found in any of 5 controller test classes | FAIL | Gap — no `@WithMockUser` + expected 403/AccessDeniedException deny path |
| Test suite green | 214 tests run, 4 Failures, 19 Errors | FAIL | Two defect categories (see §7) |

## 4. Test Strategy

### 4.1 Happy Path
Covered by existing Mockito unit tests (MockitoExtension @InjectMocks) for TramRadar, CoSuaChua, DeKe, VTS domains. Status: pass for those domains.

### 4.2 Negative Path
LuongHangHaiControllerTest has negative tests (filterByInvalidStatus_shouldThrow400) but all fail due to ApplicationContext load failure.

### 4.3 Edge Cases
Not explicitly covered in current wave scope.

### 4.4 Permission / Role Cases
- Allow path: LuongHangHaiControllerTest uses `@WithMockUser(roles="SYSTEM_ADMIN")` — but tests fail due to ApplicationContext load failure (unrelated to annotation correctness).
- Deny path: ABSENT across all 5 domains. No test verifies that a user WITHOUT the authority receives 403 / AccessDeniedException.

### 4.5 Integration Cases
Not in scope for wave 1 unit tests.

### 4.6 Data / State Transition Cases
Service tests cover state transitions (CoSuaChuaDongTauServiceTest, TramRadarServiceTest, etc.) — pass.

### 4.7 Regression Scope
LuongHangHaiControllerTest: 19 tests fully errored due to SpringBootTest ApplicationContext failure. This is a regression risk — pre-existing or introduced by wave 1 wiring changes.

## 5. Test Cases

| ID | Scenario | Preconditions | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|---|
| TC-M003-01 | @PreAuthorize present on all TramRadar endpoints | Source code | Inspect all 9 endpoint methods | Each has `@auth.check(authentication,'tramradar:X')` | Critical | PASS (analytical) |
| TC-M003-02 | @PreAuthorize present on all CoSuaChua endpoints | Source code | Inspect all 9 endpoint methods | Each has `@auth.check(authentication,'cosuachua:X')` | Critical | PASS (analytical) |
| TC-M003-03 | @PreAuthorize present on LuongHangHai (10 endpoints) | Source code | Inspect controller | All annotated | Critical | PASS (analytical) |
| TC-M003-04 | @PreAuthorize present on DeKe (10 endpoints) | Source code | Inspect controller | All annotated | Critical | PASS (analytical) |
| TC-M003-05 | @PreAuthorize present on VTS (9 endpoints) | Source code | Inspect controller | All annotated | Critical | PASS (analytical) |
| TC-M003-06 | Seeder has exactly 35 M-003 permission codes | RolePermissionSeeder.java | Count seedPermission calls for 5 entities | 35 codes, all colon-style | Critical | PASS (analytical) |
| TC-M003-07 | ApiResponse<T> wrapping on TramRadar | Source code | Inspect return types | All return ResponseEntity<ApiResponse<T>> | High | PASS (analytical) |
| TC-M003-08 | ApiResponse<T> wrapping on CoSuaChua | Source code | Inspect return types | All return ResponseEntity<ApiResponse<T>> | High | PASS (analytical) |
| TC-M003-09 | RBAC deny test: POST /luonghanghai without authority → 403 | @WebMvcTest + no authority | Call create endpoint with no luonghanghai:create | 403 Forbidden | Critical | MISSING |
| TC-M003-10 | RBAC allow test: POST /luonghanghai with SYSTEM_ADMIN → 200 | @WebMvcTest + SYSTEM_ADMIN | Call create endpoint with authority | 200 OK | Critical | MISSING (context load failure) |
| TC-M003-11 | CoSuaChuaDongTauControllerTest.testGetById cast | Unit test execution | Run test | Response body is ApiResponse<CoSuaChuaDongTauResponse> | High | FAIL (ClassCast) |
| TC-M003-12 | LuongHangHaiControllerTest all tests | SpringBootTest context | Context loads, @WithMockUser active | 19 tests pass | High | ERROR (context load failure) |

## 6. Execution Results

| Test Case ID | Status | Evidence / Notes |
|---|---|---|
| TC-M003-01 to TC-M003-08 | PASS | Analytical — source code inspection of all 5 controllers + seeder |
| TC-M003-09 to TC-M003-10 | MISSING | No deny-path @WebMvcTest exists; LuongHangHai SpringBootTest context load fails |
| TC-M003-11 | FAIL (executed) | ClassCast: CoSuaChuaDongTauControllerTest.testGetById:98, testGetHistory:217 — test casts ResponseEntity body directly to DTO instead of ApiResponse<T> |
| TC-M003-12 | ERROR (executed) | LuongHangHaiControllerTest: all 19 tests throw IllegalState ApplicationContext failure (threshold 1 exceeded); root cause is SpringBootTest full context not loadable in this environment |

| Evidence Type | Source | Result | Notes |
|---|---|---|---|
| Executed | `mvn -q -DskipTests compile` | PASS | Clean compile, zero errors |
| Executed | `mvn test` 15 classes, 214 tests | 4 Failures, 19 Errors | See defects D-001, D-002 |
| Analytical | Controller source inspection | PASS | All endpoints protected |
| Analytical | RolePermissionSeeder.java lines 155-235 | PASS | 35 M-003 codes, colon-normalized |

## 7. Defects Found

| Defect ID | Title | Severity | Priority | Reproduction Steps | Expected | Actual | Impact |
|---|---|---|---|---|---|---|---|
| D-001 | CoSuaChuaDongTauControllerTest: ClassCast on ApiResponse<T> (SF-004 test mismatch) | Major | High | Run `CoSuaChuaDongTauControllerTest.testGetById` and `testGetHistory` | Test asserts on `CoSuaChuaDongTauResponse` directly | ClassCast: response body is `ApiResponse<T>` (SF-004 fix applied to controller); tests not updated to unwrap `.getData()` | Blocks confirmed test coverage of SF-004; 2 tests fail |
| D-002 | LuongHangHaiControllerTest: SpringBootTest ApplicationContext load failure — all 19 tests error | Critical | Critical | Run `LuongHangHaiControllerTest` (any test) | Context loads, tests execute | `IllegalState: ApplicationContext failure threshold (1) exceeded` — likely missing bean, misconfigured security mock, or DataSource dependency not satisfied in test profile | 19 tests entirely non-executable; RBAC allow-path test coverage lost for luonghanghai domain |
| D-003 | RBAC deny-path tests absent across all 5 domains (W2 task not delivered) | Major | High | Review all 5 controller test classes for deny-path pattern | Each domain has at least 1 @WebMvcTest deny test (no authority → 403) + 1 allow test | No deny-path tests in tramradar, cosuachua, deke, vts, luonghanghai controller tests | Security regression undetectable; W2 task explicitly required this pattern |

## 8. NFR Observations

### 8.1 Security Behavior
SF-001/SF-002/SF-003/SF-004 closed at code level (analytical). However D-003 means deny-path behavior is not test-verified — a future regression removing @PreAuthorize would not be caught.

### 8.2 Performance Concerns
No evidence gathered; out of scope for wave 1.

### 8.3 Audit / Logging
Controllers log errors via `log.error(...)` (Slf4j). Audit trail for approve/reject actions passes through service layer — not separately verified in this wave.

### 8.4 Reliability / Resilience
LuongHangHaiControllerTest context load failure (D-002) indicates a test environment reliability issue. This must be resolved before the test suite can be considered a reliable regression gate.

### 8.5 Usability Concerns
N/A (backend-only).

## 9. Regression Impact Assessment

| Area | Risk | Justification |
|---|---|---|
| luonghanghai RBAC | High | 19 SpringBootTest tests non-executable; allow-path security not verified at integration level |
| cosuachua SF-004 | Medium | testGetById + testGetHistory fail; functional endpoints work but test does not confirm ApiResponse wrapping |
| All 5 domains deny-path | High | Zero deny tests; cannot detect future authorization regression |

## 10. Test Limitations / Gaps

- `LuongHangHaiControllerTest` root cause for ApplicationContext failure not diagnosed (requires investigating missing beans or test profile config — out of QA scope; escalate to sdlc-dev).
- No @WebMvcTest deny-path tests exist for any domain (W2 task).
- Analytical evidence used for all @PreAuthorize and seeder checks — runtime enforcement not verified.
- No integration/E2E test against a running DB; service/controller unit tests use mocks only.

## 11. Release Recommendation

Do not release. Two blocking issues must be resolved:

1. D-002 (Critical): LuongHangHaiControllerTest ApplicationContext failure — 19 tests non-executable. Root cause must be fixed by sdlc-dev and tests must pass.
2. D-003 (Major): RBAC deny-path tests required by W2 task — must be authored for all 5 domains.
3. D-001 (Major): CoSuaChuaDongTauControllerTest ClassCast — test must be updated to unwrap `ApiResponse<T>.getData()`.

SF-001/SF-002/SF-003/SF-004 code fixes are verified (analytical). Suite cannot reach Pass until D-001/D-002/D-003 are resolved and all 214+ tests pass clean.

## 12. QA Verdict

**Fail**

---

## QA -> Handoff Summary

**Verdict:** Fail
**AC coverage:** 23/30 features have analytical coverage; 7 features (luonghanghai domain) have no executable test coverage due to D-002.
**Evidence type split:** 8 analytical / 214 executed (23 pass-class, 4 fail, 19 error)
**Defects found:** 1 Critical (D-002), 2 Major (D-001, D-003)
**Top defect for reviewer attention:** D-002 — LuongHangHaiControllerTest SpringBootTest context load failure, 19 tests errored; blocks RBAC allow-path verification for entire luonghanghai domain (F-038..F-043).
**NFR observations:** Security code fixes verified analytically; deny-path runtime protection unverified (no deny tests). No performance or audit evidence.
**Test gaps reviewer should note:** (1) Zero deny-path RBAC tests across all 5 domains; (2) LuongHangHai SpringBootTest root cause unknown; (3) all security coverage is analytical only — no @WebMvcTest integration evidence for any domain.

```json
{
  "agent": "sdlc-qa",
  "stage": "validation",
  "verdict": "Fail",
  "confidence": "high",
  "escalate_recommended": "true",
  "escalation_reason": "D-002 Critical: LuongHangHaiControllerTest SpringBootTest context load failure (19 tests non-executable). D-003 Major: RBAC deny-path tests absent all 5 domains. D-001 Major: CoSuaChuaDongTauControllerTest ClassCast on ApiResponse<T>.",
  "next_owner": "sdlc-reviewer",
  "coverage": { "critical_ac_total": 30, "critical_ac_verified": 23 },
  "evidence_type_split": { "executed": 214, "analytical": 8 },
  "missing_artifacts": ["RBAC deny-path tests for all 5 domains", "LuongHangHaiControllerTest context fix"],
  "blockers": [
    "D-002: LuongHangHaiControllerTest ApplicationContext failure — 19 tests errored",
    "D-003: RBAC deny-path tests absent across luonghanghai/deke/cosuachua/tramradar/vts",
    "D-001: CoSuaChuaDongTauControllerTest ClassCast — tests not updated after SF-004 ApiResponse wrapping"
  ],
  "risk_score": "4",
  "risk_level": "high",
  "evidence_refs": [
    "docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/qa/07-qa-report.md",
    "src/main/java/com/hanghai/kchtg/tramradar/controller/TramRadarController.java",
    "src/main/java/com/hanghai/kchtg/cosuachua/controller/CoSuaChuaDongTauController.java",
    "src/main/java/com/hanghai/kchtg/luonghanghai/controller/LuongHangHaiController.java",
    "src/main/java/com/hanghai/kchtg/deke/controller/DeKeController.java",
    "src/main/java/com/hanghai/kchtg/vts/controller/HeThongVTSController.java",
    "src/main/java/com/hanghai/kchtg/config/RolePermissionSeeder.java"
  ],
  "sub_dispatch_count": "0",
  "sub_dispatch_degraded": "false",
  "token_usage": {
    "input": "7000",
    "output": "4000",
    "this_agent": "11000",
    "pipeline_total": "11000"
  }
}
```
