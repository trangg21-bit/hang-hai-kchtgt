# M-1004 Wave-1 Backend Implementation — Field-level Authorization PoC

- Seat: engineering-backend-developer (wave 1)
- Status: **implemented** — all backend work orders WO-BE-1..WO-BE-10 done; `mvn clean compile` exits 0; unit test green.
- Scope: backend only. Frontend (WO-FE-1/2) and the runtime done_oracle belong to later waves / a human on a live instance (backend was never started).

## 1. Summary

Implemented the field-level authorization PoC exactly per the accepted design (`00-design-plan.md`): a `field_policy` rule table + Flyway seed, a resolution service computing the effective per-field effect (HIDE | READONLY | default ALLOW) with specificity > priority and a structural admin bypass, a request-scoped `ThreadLocal` context populated by a `HandlerInterceptor` on `/api/**`, a global Jackson filter that strips HIDE fields at write time with no per-DTO annotations, a `GET /api/field-visibility` UX endpoint, and the `PermissionMiddleware` public-path exemption so non-admins are not 403'd.

## 2. Source delta

### Created — new package `com.hanghai.kchtg.fieldvisibility`

| File | Purpose |
|---|---|
| `src/main/resources/db/migration/V121__create_field_visibility_policy.sql` | `field_policy` DDL + 2 indexes + ONE guarded demo seed (WO-BE-1) |
| `entity/FieldSubjectType.java` | PERMISSION, GROUP, USER (ordinal 0,1,2) |
| `entity/FieldTargetType.java` | FIELD, GROUP, ALL (ordinal 0,1,2) |
| `entity/FieldEffect.java` | HIDE, READONLY (ordinal 0,1) |
| `entity/FieldPolicy.java` | `@Entity` extends `BaseEntity`, `@FieldNameConstants`, `@SQLRestriction("deleted_at IS NULL")`, `@Enumerated(ORDINAL)` on the 3 enum columns |
| `repository/FieldPolicyRepository.java` | `JpaRepository<FieldPolicy, UUID>` with `findByActiveTrue()` |
| `service/FieldVisibilityService.java` | normative resolution algorithm (§5): `resolve(...)` + `getVisibilityMap(...)` |
| `FieldVisibilityContext.java` | `ThreadLocal<Map<String,FieldEffect>>` holder; `isHidden` = `(map[f] ?? map['*']) == HIDE`; `get()` never returns null |
| `interceptor/FieldVisibilityInterceptor.java` | `HandlerInterceptor`; D5 path→resource map; fail-open; unconditional `afterCompletion` clear |
| `config/FieldVisibilityJacksonConfig.java` | `Jackson2ObjectMapperBuilderCustomizer`; `SimpleFilterProvider().setFailOnUnknownId(false).setDefaultFilter(...)`; write-time ThreadLocal check; no per-DTO annotations |
| `controller/FieldVisibilityController.java` | `GET /api/field-visibility?resource=` → `ApiResponse<Map<String,String>>`; trims + lowercases + length-caps (100) the resource param |

### Modified

- `src/main/java/com/hanghai/kchtg/config/WebConfig.java` — constructor-injects `FieldVisibilityInterceptor`; registers it on `/api/**` after the access-log interceptor (WO-BE-7). Existing access-log registration and `ApprovalStatus` formatter untouched.
- `src/main/java/com/hanghai/kchtg/security/PermissionMiddleware.java` — appended the exact prefix `/api/field-visibility` to `PUBLIC_PATH_PREFIXES` (WO-BE-10). AuthN retained; no new permission seeded.

### Test

- `src/test/java/com/hanghai/kchtg/fieldvisibility/FieldVisibilityServiceTest.java` — 12 pure JUnit+Mockito tests, no Spring context/DB/server.

### Not touched (verified)

`PermissionSeeder`, `RolePermissionSeeder`, `SecurityConfig`, all frontend files, all other backend files. No record-level/org-unit data-scope logic, no policy-mutation endpoint, no `@PreAuthorize` addition. No `git` commands run.

## 3. Acceptance mapping

| Work order / AC | Where | Status |
|---|---|---|
| WO-BE-1 — V121 migration + seed | `V121__create_field_visibility_policy.sql` | ✅ seed row `SELECT 0,'vts:read','vts',0,'updatedDate',0,10,TRUE` guarded by `WHERE NOT EXISTS (... deleted_at IS NULL)`; `target_type=0` FIELD (AC-F02) |
| WO-BE-2 — entity + 3 ordinal enums | `FieldPolicy` + 3 enum files | ✅ declaration order == ordinal; `@Enumerated(ORDINAL)`; `@FieldNameConstants` (AC-F02 static) |
| WO-BE-3 — repository | `FieldPolicyRepository` | ✅ `findByActiveTrue()`; soft-delete excluded by inherited `@SQLRestriction` |
| WO-BE-4 — resolution service | `FieldVisibilityService` | ✅ admin bypass, subject set (USER/GROUP ACTIVE-or-null/PERMISSION), specificity `(subject,target)` then priority, default ALLOW (AC-WO4) |
| WO-BE-5 — ThreadLocal context | `FieldVisibilityContext` | ✅ static `get/set/clear`, `isHidden`; `get()` returns empty map (never NPE) (AC-F04/F05) |
| WO-BE-6 — interceptor | `FieldVisibilityInterceptor` | ✅ D5 map, fail-open, unconditional `afterCompletion` clear (AC-F04) |
| WO-BE-7 — WebConfig registration | `WebConfig` | ✅ |
| WO-BE-8 — Jackson strip | `FieldVisibilityJacksonConfig` | ✅ write-time ThreadLocal check; READONLY passthrough; no-op when empty (AC-F05) |
| WO-BE-9 — controller | `FieldVisibilityController` | ✅ `ApiResponse<Map<String,String>>`, values `effect.name()` (AC-S5 static) |
| WO-BE-10 — PermissionMiddleware exemption | `PermissionMiddleware` | ✅ exact prefix `/api/field-visibility` only (AC-F01 static) |
| AC-S1 (backend compiles) | — | ✅ see §4 |

## 4. Verification (executed, real output)

### (1) `mvn clean compile` — repo root

- Command: `mvn clean compile` (cwd `D:\project\hang-hai-kchtgt`)
- Result: **BUILD SUCCESS, exit code 0** (`Compiling 1096 source files with javac ... release 17`). Enforcer `RequireJavaVersion [17,18)` passed. Warnings are pre-existing and unrelated (itextpdf relocation; `javax.annotation.meta.When` unknown enum constant; `equals/hashCode ... callSuper=false` in BuoyStation/LighthouseStation/ShipRepairFacility).

### (2) `mvn -Dtest=FieldVisibilityServiceTest test`

- Result: **BUILD SUCCESS, exit code 0** — `Tests run: 12, Failures: 0, Errors: 0, Skipped: 0` (1.26 s). Test compile: 89 test source files.
- Coverage of the 6 AC-WO4 assertions: (1) `noRulesDefaultsToAllow`; (2) `seedStyleRuleHidesExactlyUpdatedDateAndNothingElse`; (3) `adminAllBypassesAllRules`; (4) `higherPriorityWinsWithinSameSpecificity`; (5) `userSubjectBeatsPermissionSubjectRegardlessOfPriority`; (6) `groupRuleMatchesNullStatusGroup` (F-10 ACTIVE-or-null). Extras: `seedRuleDoesNotApplyToAnotherResource`, `fieldTargetBeatsGroupTargetRegardlessOfPriority`, `groupRuleMatchesActiveGroupOnly`, `wildcardResourceAppliesToAnyResource`, `targetAllContributesWildcardKey`, `unauthenticatedUserResolvesToEmpty`.

Note: the IDE Java language server currently reports a broken-JRE error (`Failed to init ct.sym for ...managed-jre-21...jrt-fs.jar`) and consequently flags Lombok-generated setters as "undefined" — this is an environment/tooling failure, not a code defect; javac+Lombok (Maven) compiles the same files cleanly and the tests pass.

## 5. Key implementation notes

- **Target specificity ≠ enum ordinal.** `FieldTargetType` declares FIELD=0, GROUP=1, ALL=2 (ordinals = DDL values), but resolution specificity is ALL=0 < GROUP=1 < FIELD=2. `FieldVisibilityService.targetSpecificity(...)` therefore uses an explicit `switch`, NOT `ordinal()`. `subjectSpecificity` uses `switch` too (PERMISSION=0 < GROUP=1 < USER=2, which happens to match ordinal). Covered by `fieldTargetBeatsGroupTargetRegardlessOfPriority` + `userSubjectBeatsPermissionSubjectRegardlessOfPriority`.
- **Admin bypass is structural, pre-repository.** `resolve()` returns `Map.of()` before querying rules when `getAllPermissions()` contains `admin:all` or `*` — matches the frontend `permissionStore` bypass and the fact that `getAllPermissions()` only surfaces these codes via direct grants (group inheritance filters them at `User.java:153`).
- **Jackson strip is write-time.** `FieldVisibilityFilter.serializeAsField` consults `FieldVisibilityContext.isHidden(writer.getName())` per field at serialization; nothing is resolved at serializer-construction time, so Jackson's cached/shared serializers cannot leak state across requests.
- **Fail-open everywhere on the read path.** The interceptor catches any resolution exception and clears the context; a missing ThreadLocal yields an empty map; default ALLOW means only `resource=vts` has a rule in this PoC, so the other 21 screens' payloads are untouched.

## 6. Unverified edges (deferred to later waves / human)

- **Runtime done_oracle** (AC-S3/S4/S5/F01/F04/F05 RUNTIME parts): requires a live instance + human sign-in. Backend was NOT started (project rule). The Jackson strip's wire behavior, the exact `{}`/`{"updatedDate":"HIDE"}` visibility map, and the 401-vs-403 behavior are unverified at runtime by this seat.
- **Flyway execution** at startup (PostgreSQL dialect, `gen_random_uuid()`): the migration matches house style (V118/V19) but was not executed against a live DB by this seat.
- **F-03 channels** (standalone mappers / StreamingResponseBody / byte exports) are documented out-of-scope and NOT stripped — per design §9.
- `User.getGroups()` is LAZY; production requests reach the interceptor with the principal loaded via `userRepository.findByUsernameWithRelations(...)` (JwtAuthFilter), which populates groups — unit tests set groups manually. Not exercised against a live session here.
