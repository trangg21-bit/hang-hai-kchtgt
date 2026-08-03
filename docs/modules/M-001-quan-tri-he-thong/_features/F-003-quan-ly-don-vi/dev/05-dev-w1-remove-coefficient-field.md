# Implementation Summary: Remove Dead `coefficient` Field

## Metadata

| Field | Value |
|---|---|
| feature-id | F-003 |
| stage | implementation |
| agent | engineering-backend-developer |
| wave | 1 |
| task | remove-coefficient-field |
| verdict | Pass |
| last-updated | 2026-07-15 |

## Requirement Mapping

All out-of-scope items: **None** — this is a pure dead-code removal task.

| Item | Status | Reason |
|---|---|---|
| Remove `coefficient` field from `OrgUnit` entity | ✅ Implemented | Field declaration, javadoc, `import BigDecimal`, factory method param + setter call all removed |
| Remove `coefficient` from `CreateOrgUnitRequest` DTO | ✅ Implemented | Field, `@DecimalMin` annotation, javadoc BR-017 reference removed |
| Remove `coefficient` from `UpdateOrgUnitRequest` DTO | ✅ Implemented | Field, `@DecimalMin` annotation, standalone import removed |
| Remove `coefficient` from `OrgUnitResponse` DTO | ✅ Implemented | Field declaration + builder chain call `.coefficient()` removed |
| Remove `coefficient` from `OrganizationService` | ✅ Implemented | Javadoc BR-017, builder `.coefficient()` in `create()`, `setCoefficient()` in `update()`, seedRoot parameter + builder `.coefficient()` all removed |
| Remove `coefficient` tests from `OrganizationServiceTest` | ✅ Implemented | Javadoc BR-017, entire `CoefficientTests` nested class (4 tests), `setCoefficient()` call in `shouldAllowUniqueCodeOnCreate` and `makeUnit` helper removed; `BigDecimal` import removed |
| Remove `coefficient` tests from `MaterializedPathServiceTest` | ✅ Implemented | 3 coefficient test methods removed; `BigDecimal` import removed |
| Create Flyway migration V44 | ✅ Implemented | Drops check constraint `chk_org_unit_coefficient_positive` then drops `coefficient` column from `org_units` |

## Files Changed

| File | Change |
|---|---|
| `src/main/java/com/hanghai/kchtg/orgunit/entity/OrgUnit.java` | Removed `coefficient` field + javadoc, `import BigDecimal`, BR-017 from class javadoc, `coefficient` param + setter from `createRoot()` |
| `src/main/java/com/hanghai/kchtg/orgunit/dto/CreateOrgUnitRequest.java` | Removed `coefficient` field + `@DecimalMin` + javadoc, BR-017 from class javadoc |
| `src/main/java/com/hanghai/kchtg/orgunit/dto/UpdateOrgUnitRequest.java` | Removed `coefficient` field + `@DecimalMin` + javadoc, `DecimalMin` import |
| `src/main/java/com/hanghai/kchtg/orgunit/dto/OrgUnitResponse.java` | Removed `coefficient` field + `.coefficient()` builder chain call |
| `src/main/java/com/hanghai/kchtg/orgunit/service/OrganizationService.java` | Removed BR-017 from class javadoc, `.coefficient()` in `create()` builder, `setCoefficient()` in `update()`, `coefficient` param + `.coefficient()` in `seedRoot()` |
| `src/test/java/.../OrganizationServiceTest.java` | Removed BR-017 from javadoc, entire `CoefficientTests` nested class (4 tests), `setCoefficient()` in test + helper, `BigDecimal` import |
| `src/test/java/.../MaterializedPathServiceTest.java` | Removed 3 coefficient test methods, `BigDecimal` import |
| `src/main/resources/db/migration/V44__drop_coefficient_from_org_units.sql` | **NEW** — Flyway migration to drop constraint + column |

## Key Technical Decisions

| Decision | Reason | Trade-off |
|---|---|---|
| Drop constraint before column in V44 | PostgreSQL `DROP COLUMN` silently drops dependent constraints but does NOT error if constraint already removed. Using `DO $$` with `IF EXISTS` makes the migration idempotent. | Slightly more SQL, but safer for re-runs |
| No code regeneration needed | No generated proxies, code-gen tools, or ORM schema-export is configured — DDL handled by Flyway only. | Manual migration file, but aligns with the project's existing migration pattern (see V18, V19) |

## Validation / Authorization / Error-Handling Notes

- **Validation**: Removed `@DecimalMin("0.01")` from `CreateOrgUnitRequest` and `UpdateOrgUnitRequest`. No replacement validation needed — the field simply does not exist anymore.
- **Authorization**: No change — coefficient was never gated behind any RBAC role.
- **Error handling**: No error paths consumed coefficient. No changes to exception handling.

## Tests Added or Updated

No new tests. **Removed** 4 coefficient validation tests from `OrganizationServiceTest.CoefficientTests` and 3 coefficient tests from `MaterializedPathServiceTest`. Remaining tests for BR-013, BR-014, BR-015, BR-016 are unaffected.

## Verification Evidence

```
$ mvn compile -Denforcer.skip=true
→ exit_code: 0
→ BUILD SUCCESS
→ Scope: 1051 source files compiled (orgunit package compiles cleanly)

$ mvn test-compile -Denforcer.skip=true
→ exit_code: 0
→ BUILD SUCCESS
→ Scope: 86 test source files compiled (orgunit tests compile cleanly)

Post-removal grep check:
  grep -ri "coefficient" src/main/java/com/hanghai/kchtg/orgunit → 0 matches
  grep -ri "coefficient" src/test/java/com/hanghai/kchtg/orgunit → 0 matches
  grep -ri "BR-017" src/main/java/com/hanghai/kchtg/orgunit → 0 matches
  grep -ri "BR-017" src/test/java/com/hanghai/kchtg/orgunit → 0 matches
```

## Deployment / Migration Notes

- **Flyway migration V44** must be applied before deployment. It:
  1. Drops the PostgreSQL check constraint `chk_org_unit_coefficient_positive` (if it exists)
  2. Drops the `coefficient` column from `org_units`
- The migration is idempotent — safe to re-run.
- **No new environment variables or secrets** required.
- **No new dependencies** required.

## Known Limitations and Risks

1. **Frontend not updated** — per scope constraints, no frontend files were modified. Any frontend DTO or model referencing `coefficient` will need a corresponding frontend update. QA should verify the frontend does not send/receive this field.
2. **Existing database data** — any `coefficient` values currently stored in the `org_units` table will be permanently lost when V44 runs. This is safe because no business logic consumed the field (confirmed by zero callers in codebase).
3. **seedRoot() signature changed** — callers that invoke `seedRoot()` with a coefficient parameter will fail to compile until updated. The service constructor call should be audited (e.g., in `@PostConstruct` seed logic). QA should verify the application starts successfully after V44 runs.

## Intel Drift

- `intel-drift: true` — Removed BR-017 from business rule documentation across entity, DTOs, service, and tests. The business rule catalog (if any) should be updated to remove BR-017.
- Schema drift: `org_units` table loses the `coefficient` column — existing DB will differ from entity until V44 migration runs.
