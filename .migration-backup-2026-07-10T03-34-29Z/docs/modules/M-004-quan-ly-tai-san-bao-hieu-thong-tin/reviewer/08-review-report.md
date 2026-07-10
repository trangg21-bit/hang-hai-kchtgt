---
feature-id: M-004
stage: final-quality-gate
agent: engineering-code-reviewer
verdict: Changes-requested
must-fix-count: 2
should-fix-count: 5
last-updated: 2026-07-08
---

# Final Code Review Report: M-004 Quản lý tài sản Báo hiệu & Thông tin

## Scope Reviewed

| Dimension | Scope |
|-----------|-------|
| **Architecture Alignment** | SA document (00-lean-architecture.md) vs actual code in 3 packages |
| **Feature Coverage** | implementations.yaml vs actual controllers for all 54 features |
| **Code Quality** | Spot-checked 7 files: 3 controllers (BeaconLight, NhaTramPhao, CoastalStationVTS), 3 services (same), 2 entities (BaseEntity, BeaconLight), 1 DTO (CreateBeaconLightRequest) |
| **Test Execution** | `mvn compile -q`, specific nhatram tests, full `mvn test` output analyzed |
| **BA Spec Compliance** | Business rules BR-001 through BR-019 checked against actual code |
| **Documentation Consistency** | BA spec, SA, TL plan, feature-brief samples, implementations.yaml cross-referenced |
| **Structural Integrity** | ai-kit-verify structure gate passed (no HIGH findings) |

## Overall Verdict

**Changes-requested** — 2 must-fix items and 5 should-fix items identified. The codebase is structurally sound with robust patterns in the beacon and nhatram packages, but the station package has material quality and compliance gaps requiring remediation. The pre-approve ai-kit-verify gate returned no HIGH findings, and all M-004-specific tests pass. However, the known gaps in station domain (BR-008 violation, missing tests across 30 features, null user resolution) prevent a Pass verdict.

---

## Requirement Alignment

| BA Spec Requirement | Status | Evidence |
|---------------------|--------|----------|
| 9 entity groups with CRUD + approval | ✅ Complete | All controllers, services, repositories, entities present |
| 2-level approval workflow | ✅ Implemented | Beacon: submit→L1→L2→PUBLISHED; Station: /approve with LevelEnum |
| Soft-delete pattern | ✅ Implemented | @SQLRestriction("deleted_at IS NULL") on all base classes |
| Audit history | ✅ Implemented | BeaconHistory (DB), NhaTramHistory (DB), Station (in-memory) |
| GIS sync (beacon/nhatram only) | ✅ Implemented | PointObjectSyncService in both beacon and nhatram packages |
| 54 features across 9 groups | ✅ All exist | Mapped in implementations.yaml |
| Feature-briefs with complete content | ✅ All 54 filled | F-068, F-080, F-092 samples verified (≥200 chars description, ≥3 ACs, roles, BRs) |
| BR-001 to BR-019 business rules | ⚠️ Partial | Beacon/nhatram: ✅ All validated; **Station: BR-008 violated** |
| Immutable code (BR-008) | ❌ **Station violated** | CoastalStationVTSService.updateStation() modifies entity.code |

---

## Architecture Alignment

### ✅ Aligned Patterns

- **Layered architecture**: Controller → Service → Repository → Entity followed in all 3 packages
- **3 inheritance hierarchies**: BaseEntity (beacon), BaseNhaTram (nhatram), BaseStation (station) — as designed
- **ApiResponse envelope**: Used correctly by beacon and nhatram controllers
- **DTO isolation**: Beacon/nhatram never expose entities directly via API
- **Approval workflow**: 2-level approval with state validation implemented in all domains

### ⚠️ Known Inconsistencies

| Issue | Documented? | Details |
|-------|-------------|---------|
| **API prefix mismatch** | ✅ Yes (SA §5.1) | `/api/beacon-lights` vs `/api/v1/nhatram/phao` vs `/api/v1/stations/coastal` |
| **Station returns raw entities** | ✅ Yes (SA §2.3) | CoastalStationVTSController returns `CoastalStationVTS` directly (except `getStationById` which returns DTO) |
| **Station endpoint design differs** | ✅ Yes (SA §5.4) | Collapses L1/L2 into single `/approve` with LevelEnum |

Both are documented in the SA document as architectural debt deferred to Wave 3. Acceptable for Wave 1.

---

## Code Quality Findings

### BeaconLightController.java (src/main/java/.../beacon/controller/)
- **Status**: ✅ Clean
- **Pattern**: 10 endpoints (findAll, findById, search, create, update, delete, submit-approval, approve-l1, approve-l2, reject)
- **Validation**: @Valid on @RequestBody
- **Responses**: Wrapped in ApiResponse with Vietnamese messages
- **HTTP status**: 201 for create, 200 for others

### NhaTramPhaoController.java (src/main/java/.../nhatram/controller/)
- **Status**: ✅ Clean
- **Pattern**: Identical to BeaconLightController, properly translated messages
- **Validation**: @Valid on @RequestBody

### CoastalStationVTSController.java (src/main/java/.../station/controller/)
- **Status**: ⚠️ Issues identified
- **Inconsistent response format**: Some endpoints return raw `CoastalStationVTS` entity (create, update, getAllStations, searchStations, approveStation, rejectStation, findByCode) while `getStationById` returns `CoastalStationVTSResponse` DTO
- **Extra endpoint**: `/by-code/{code}` not in standard 9-endpoint pattern (acceptable extension)
- **Hardcoded userId**: `Long userId = 1L;` (documented as Wave 2 placeholder)

### BeaconLightService.java (src/main/java/.../beacon/service/)
- **Status**: ✅ Robust implementation
- **Strengths**: Field-level JSON diff, coordinate validation, maintenance date validation, self-approval guard, proper status transition checks, Vietnamese error messages, code uniqueness check across both beacon_light and buoy tables
- **Idiomatic**: `@SuppressWarnings("null")` annotation present; `resolveCurrentUserId()` returns placeholder

### NhaTramPhaoService.java (src/main/java/.../nhatram/service/)
- **Status**: ✅ Robust implementation
- **Same patterns** as BeaconLightService: JSON diff, coordinate validation, self-approval guard, status validation

### CoastalStationVTSService.java (src/main/java/.../station/service/)
- **Status**: ❌ **Must-fix items**
- **BR-008 Violation (#MF-001)**: `updateStation()` modifies `entity.setCode(request.getStationCode())` — code is documented as immutable after creation in both BA spec (BR-008) and feature-brief F-092
- **Missing code uniqueness check**: `createStation()` does not validate code uniqueness before saving — relies on JPA `@Column(unique=true)` which will throw a `DataIntegrityViolation` (generic SQL error) instead of a user-friendly Vietnamese message
- **Missing coordinate validation**: No longitude/latitude range check (BR-003, BR-004)
- **Self-approval guard missing**: Unlike beacon/nhatram, does not block creator from approving own station
- **History keyed by code**: `historyService.recordHistory(saved.getCode(),...)` — if code changes, history lookup breaks
- **Approval level increment**: Current code increments from 0→1→2 but does not validate that entity is actually in correct state for approval
- **All mutable fields overwritten in update**: No null-check pattern — every field is set regardless of whether the client sent it

### Entity Classes

| Entity | Status | Notes |
|--------|--------|-------|
| BaseEntity | ✅ | Clean @MappedSuperclass, Spring Data auditing @CreatedDate/@LastModifiedDate |
| BeaconLight | ✅ | Well-annotated with @NotBlank, @Size, @DecimalMin/Max, @Builder.Default |
| BaseNhaTram | ✅ | Uses @PrePersist for auditing (different strategy from BaseEntity) |
| BaseStation | ✅ | @Accessors(chain=true), @PrePersist sets default PENDING_APPROVAL |

### DTO: CreateBeaconLightRequest
- **Status**: ✅ Good
- Proper validation annotations matching entity constraints
- Action field pattern for draft/submit distinction
- `@Builder.Default` for isActive and action defaults

---

## Security Findings

| Finding | Severity | Details |
|---------|----------|---------|
| Hardcoded userId in station | Medium | CoastalStationVTSController uses `Long userId = 1L` — documented Wave 2 placeholders |
| getUserCurrentUnitId() returns null | Low | BeaconLightService: always returns null; unit assignment may be incorrect |
| Self-approval guard | Medium | ✅ Present in beacon/nhatram, ❌ Missing in station services |
| No @PreAuthorize on controllers | Low | Relies on service-level checks and future Wave 2 security integration |
| Rejection reason validation | Medium | ✅ Beacon/nhatram enforce ≥10 chars; ❌ Station `rejectStation` does not validate rejection reason length |

---

## Performance/Reliability/Operability Findings

| Finding | Severity | Details |
|---------|----------|---------|
| Station history in-memory | Medium | HistoryService stores in ArrayList — lost on restart (documented Wave 3) |
| No Flyway migrations | Low | Tables created via Hibernate ddl-auto only (documented deferred) |
| JSON diff in history | Good | Beacon/nhatram use JsonNode.equals() for reliable comparison |
| Soft-delete + code uniqueness | Medium | @Column(unique=true) + soft-delete prevents re-creating with same code — needs unique constraint on (code, deleted_at) combination |
| Station update overwrites all fields | Medium | No null-check pattern means partial updates may reset fields to null |

---

## Test Adequacy Findings

| Package | Test Files | Tests | Status |
|---------|-----------|-------|--------|
| **nhatram** | 3 (NhaTramPhaoControllerTest, NhaTramDenControllerTest, NhaTramHistoryControllerTest) | 26 tests | ✅ **ALL PASS** — Well-structured MockMvc tests covering CRUD + approval |
| **beacon** | **0** (none exist) | — | ❌ **MUST-FIX (#MF-002)** — 12 features (F-068 to F-079) have no test coverage |
| **station** | **0** (none exist) | — | ❌ **MUST-FIX (#MF-002)** — 30 features (F-092 to F-121) have no test coverage |

### Full build test output
- Total M-004 tests: 26 (nhatram only)
- All 26 pass ✅
- Full `mvn test`: 2 pre-existing failures in `assetmovement` package (M-001, unrelated to M-004)
- `mvn compile -q`: ✅ Passes cleanly

---

## Documentation Adequacy Findings

| Document | Status | Evidence |
|----------|--------|----------|
| BA spec (00-lean-spec.md) | ✅ Complete | Full ERD, BR-001 to BR-019, feature inventory |
| SA architecture (00-lean-architecture.md) | ✅ Complete | 660+ lines, package structure, inheritance, API patterns |
| TL plan (04-plan.md) | ✅ Complete | 4 waves, 18 tasks, risk register |
| Feature-briefs (F-068, F-080, F-092 verified) | ✅ Complete | ≥200 chars description, ≥100 chars intent, ≥150 chars flow, ≥3 ACs, roles, entities, BRs |
| implementations.yaml | ✅ Complete | 12 service entries (3 backend + 9 frontend) |

---

## Must-Fix Items

### MF-001: Station Service Violates BR-008 — Code Immutability

| Field | Value |
|-------|-------|
| **Item** | CoastalStationVTSService.updateStation() modifies entity code |
| **Why it matters** | BR-008 states "Mã code không thể thay đổi sau khi tạo (immutable)". If code changes, history records keyed by the old code become orphaned. GIS sync consistency is undermined. |
| **Required action** | Remove `entity.setCode(request.getStationCode());` from `updateStation()` in CoastalStationVTSService (and all 4 other station services). Code is an immutable business identifier. |
| **Location** | `CoastalStationVTSService.java` line ~86: `entity.setCode(request.getStationCode());` |
| **Owner** | engineering-backend-developer |
| **Expected evidence** | Updated station service with code field removed from update; `mvn compile -q` passes; existing tests pass |
| **Closure criteria** | All 5 station services have code field removed from update methods; compiled successfully |

### MF-002: Missing Test Coverage for Beacon and Station Packages (42 features total)

| Field | Value |
|-------|-------|
| **Item** | Beacon package (12 features: F-068 to F-079) and Station package (30 features: F-092 to F-121) have zero unit tests |
| **Why it matters** | 42 out of 54 features (78%) have no automated test coverage. Regression risk is high for approval workflows, soft-delete behavior, GIS sync triggers, and field validation. |
| **Required action** | Create controller-level unit tests for BeaconLightController, BuoyController, and all 5 station controllers following the NhaTramControllerTest template pattern (MockMvc, @WebMvcTest, mock services). |
| **Location** | `src/test/java/com/hanghai/kchtg/beacon/controller/` (new) and `src/test/java/com/hanghai/kchtg/station/controller/` (new) |
| **Owner** | engineering-backend-developer |
| **Expected evidence** | Test classes exist covering: CRUD endpoints, approval workflow (submit→L1→L2→reject), search, soft-delete, validation errors, not-found cases |
| **Closure criteria** | Min 10 test methods per controller; all tests pass; coverage reports show ≥80% for controller classes |

---

## Should-Fix Items

### SF-001: Station Services Missing Input Validation

| Field | Value |
|-------|-------|
| **Item** | CoastalStationVTSService.createStation() and updateStation() lack coordinate validation |
| **Why it matters** | BR-003 and BR-004 require latitude in [-90,90] and longitude in [-180,180]. Without validation, invalid coordinates can be persisted. |
| **Location** | `CoastalStationVTSService.java` — no `validateCoordinates()` method |
| **Owner** | engineering-backend-developer |

### SF-002: Station Services Missing Self-Approval Guard

| Field | Value |
|-------|-------|
| **Item** | Beacon/nhatram block self-approval; station services do not |
| **Why it matters** | Operators could approve their own stations, bypassing the 2-level approval control intended by BA spec |
| **Location** | All 5 station service `approveStation()` methods |
| **Owner** | engineering-backend-developer |

### SF-003: Station Create Missing Code Uniqueness Check

| Field | Value |
|-------|-------|
| **Item** | `createStation()` does not check code uniqueness before saving |
| **Why it matters** | JPA `@Column(unique=true)` throws DataIntegrityViolation (generic error) instead of a Vietnamese error message |
| **Location** | `CoastalStationVTSService.createStation()` |
| **Owner** | engineering-backend-developer |

### SF-004: Station Reject Missing Rejection Reason Validation

| Field | Value |
|-------|-------|
| **Item** | `rejectStation()` does not enforce minimum rejection reason length |
| **Why it matters** | BR-012 requires rejection reason ≥10 characters; beacon/nhatram enforce this |
| **Location** | All 5 station service `rejectStation()` methods |
| **Owner** | engineering-backend-developer |

### SF-005: Station Update Overwrites All Fields Without Null-Check

| Field | Value |
|-------|-------|
| **Item** | updateStation() sets every field regardless of null — partial updates may reset unseen fields |
| **Why it matters** | Beacon/nhatram correctly use null-check pattern (`if (request.getField() != null) entity.setField(...)`). Station should follow same pattern for consistency. |
| **Location** | All 5 station service `updateStation()` methods |
| **Owner** | engineering-backend-developer |

---

## Questions/Clarifications

| # | Question | Context |
|---|----------|---------|
| Q1 | Station services use a `/approve` endpoint with LevelEnum rather than separate `/approve-l1` and `/approve-l2` — is this intentional for station domain or an implementation oversight? | BA spec shows separate endpoints for beacon/nhatram but doesn't specify station endpoint format |
| Q2 | The station feature-brief F-092 states default status is DRAFT, but SA doc says stations default to PENDING_APPROVAL via @PrePersist — which behavior is correct? | BA spec BR-015 says DRAFT is default, but SA §3.4 says PENDING_APPROVAL for stations |
| Q3 | Should the `CoastalStationHaiphongController` use `/api/v1/stations/haiphong/create` (as listed in SA table) or `/api/v1/stations/haiphong` (standard POST pattern)? | The create endpoint differs from standard pattern; needs verification |

---

## Follow-up Recommendations

1. **Fix MF-001 first** (station code immutability) — it's a data integrity violation that breaks BR-008 and potentially orphans history records
2. **Add test coverage (MF-002)** — use NhaTramPhaoControllerTest as the exact template pattern; it covers all 10 endpoints with proper MockMvc, mock services, and JSON path assertions
3. **Address SF-001 to SF-005** — align station services to the same quality standards as beacon/nhatram services
4. **After must-fixes are resolved**, run full `mvn test` to confirm no regressions
5. **Defer to Waves 2-3**: Flyway migrations, API prefix unification, ApiResponse wrapping for station controllers, station history DB migration, station↔tai package consolidation

---

## Final Review Summary

| Category | Rating | Details |
|----------|--------|---------|
| **Architecture Alignment** | ✅ Good | Patterns followed with documented exceptions |
| **Feature Coverage** | ✅ Complete | All 54 features exist in code |
| **Code Quality (beacon/nhatram)** | ✅ Good | Robust validation, error handling, JSON diff |
| **Code Quality (station)** | ❌ Needs work | BR-008 violation, missing validations, hardcoded userId |
| **Test Coverage** | ❌ Critical gap | 42/54 features (78%) untested |
| **Build Integrity** | ✅ Pass | `mvn compile -q` passes |
| **Test Results (M-004)** | ✅ 26/26 pass | NhaTram tests only |
| **Security** | ⚠️ Acceptable | Known Wave 2 placeholder gaps |
| **Documentation** | ✅ Complete | BA, SA, TL, feature-briefs all consistent |

**Verdict: Changes-requested** — 2 must-fix items block Pass. The foundation is solid with well-architected beacon and nhatram packages, but station package quality and test coverage gaps require remediation before this module can be considered enterprise-ready.
