---
feature-id: M-1004
stage: qa
wave: 2
agent: engineering-qa-engineer
verdict: Pass
last-updated: 2026-08-17
---

# M-1004 — Wave-2 QA Report: Acceptance Battery Execution (Field-level Authorization PoC)

Executes the wave-1 acceptance oracle (`docs/modules/M-1004-field-level-authorization/qa/07-qa-report-w1.md`) against the implemented code. All BUILD / UNIT / STATIC ACs were executed with real commands and their raw output recorded below. RUNTIME done_oracle items (S3/S4/S5) are marked **PENDING-HUMAN**: the backend was NOT started by any agent (project rule, design §13).

## 1. Execution summary

| AC | Kind | Command / probe | Result |
|---|---|---|---|
| AC-S1 | BUILD | `mvn clean compile` (root) | **PASS** — exit 0, BUILD SUCCESS |
| AC-S2 | BUILD | `npm run build` (frontend/) | **PASS** — exit 0, vite build |
| AC-WO4 | UNIT | `mvn -Dtest=FieldVisibilityServiceTest test` (root) | **PASS** — Tests run: 12, Failures: 0, Errors: 0, Skipped: 0 |
| AC-F02 | STATIC+UNIT | V121 seed grep + unit assertion #2 | **PASS** |
| AC-F01 (static part) | STATIC | PermissionMiddleware prefix grep | **PASS** |
| AC-F04 (static part) | STATIC | Interceptor afterCompletion read | **PASS** |
| AC-F05 (unit+static) | UNIT+STATIC | noRules default-ALLOW tests + D5 map | **PASS** |
| AC-SCOPE | STATIC | Seeder/SecurityConfig grep + file inventory | **PASS** |
| AC-S3 | RUNTIME | admin column + wire field | **PENDING-HUMAN** |
| AC-S4 | RUNTIME | regular user: no column, no wire field | **PENDING-HUMAN** |
| AC-S5 | RUNTIME | per-user visibility map | **PENDING-HUMAN** |

**Overall verdict: PASS** — every agent-executable AC (BUILD/UNIT/STATIC) passes with recorded output; the three runtime ACs are correctly pending a human on a live instance.

## 2. Executed verification (real command output)

### 2.1 AC-S1 — Backend build gate — PASS

Command: `mvn clean compile` (cwd `D:\project\hang-hai-kchtgt`).

```
[INFO] BUILD SUCCESS
[INFO] Total time:  19.691 s
[INFO] Finished at: 2026-08-17T11:52:53+07:00
[INFO] --- compiler:3.13.0:compile (default-compile) @ kchtg ---
[INFO] Compiling 1096 source files with javac [debug parameters release 17] to target\classes
```
Exit code: **0**. 1096 main sources compile, including the new `com.hanghai.kchtg.fieldvisibility` package (10 files) and the modified `WebConfig.java` / `PermissionMiddleware.java`. Warnings observed: itext relocation notice, `javax.annotation.meta.When` constant, three pre-existing Lombok `@EqualsAndHashCode` hints — none fatal, all pre-existing patterns unrelated to M-1004.

### 2.2 AC-S2 — Frontend build gate — PASS

Command: `npm run build` (cwd `D:\project\hang-hai-kchtgt\frontend`).

```
> frontend@0.0.0 build
> vite build
vite v8.1.5 building client environment for production...
✓ 4034 modules transformed.
dist/assets/VtsSystemList-hhW5m7--.js  21.77 kB
✓ built in 810ms
```
Exit code: **0**. One non-blocking warning (`Some chunks are larger than 500 kB` — pre-existing code-splitting advisory, not a failure). The gate is the vite build per design §12; `tsc --noEmit` baseline remains pre-existing red and is NOT this AC's gate.

### 2.3 AC-WO4 — Unit battery — PASS

Command: `mvn -Dtest=FieldVisibilityServiceTest test` (cwd `D:\project\hang-hai-kchtgt`).

```
[INFO] Running com.hanghai.kchtg.fieldvisibility.FieldVisibilityServiceTest
[INFO] Tests run: 12, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.522 s
[INFO] Results: Tests run: 12, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```
Exit code: **0**. Test class: `D:\project\hang-hai-kchtgt\src\test\java\com\hanghai\kchtg\fieldvisibility\FieldVisibilityServiceTest.java` (pure JUnit 5 + Mockito, no Spring context, no DB, no server — matches WO-BE-4 constraint). All six required assertions present and green:

| # | Required assertion (AC-WO4) | Test method (line) | Green |
|---|---|---|---|
| 1 | No rules → empty map (default ALLOW) | `noRulesDefaultsToAllow` (:35) | ✅ |
| 2 | Seed-style rule hides exactly `updatedDate`, no other field | `seedStyleRuleHidesExactlyUpdatedDateAndNothingElse` (:41) | ✅ |
| 3 | `admin:all` → empty map (bypass) | `adminAllBypassesAllRules` (:58) | ✅ |
| 4 | Higher priority wins within same specificity | `higherPriorityWinsWithinSameSpecificity` (:67) | ✅ |
| 5 | USER-subject beats PERMISSION-subject regardless of priority | `userSubjectBeatsPermissionSubjectRegardlessOfPriority` (:78) | ✅ |
| 6 | F-10: null-status GROUP matches ACTIVE-or-null predicate | `groupRuleMatchesNullStatusGroup` (:136) | ✅ |

Bonus coverage also green: `seedRuleDoesNotApplyToAnotherResource` (:50), `fieldTargetBeatsGroupTargetRegardlessOfPriority` (:108), `groupRuleMatchesActiveGroupOnly` (:120), `wildcardResourceAppliesToAnyResource` (:149), `targetAllContributesWildcardKey` (:159), `unauthenticatedUserResolvesToEmpty` (:169).

## 3. Static probes (full-path evidence)

### (a) AC-F02 — V121 seed hides exactly `updatedDate` — PASS

File: `D:\project\hang-hai-kchtgt\src\main\resources\db\migration\V121__create_field_visibility_policy.sql`

- Seed row (lines 38–39): `SELECT 0, 'vts:read', 'vts', 0, 'updatedDate', 0, 10, TRUE` — subject_type=0 (PERMISSION), subject_id=`'vts:read'`, resource=`'vts'`, **target_type=0 (FIELD)**, target_key=`'updatedDate'`, **effect=0 (HIDE)**, priority=10, active=TRUE.
- Guard (line 40): `WHERE NOT EXISTS (SELECT 1 FROM field_policy WHERE resource = 'vts' AND target_key = 'updatedDate' AND deleted_at IS NULL)` — idempotent seed.
- DDL comment (lines 3–4) confirms ordinal contract `target_type 0=FIELD 1=GROUP 2=ALL`, `effect 0=HIDE 1=READONLY`; entity enums match: `FieldTargetType { FIELD, GROUP, ALL }` (`D:\project\hang-hai-kchtgt\src\main\java\com\hanghai\kchtg\fieldvisibility\entity\FieldTargetType.java:11-14` — ordinal 0 = FIELD), `FieldEffect { HIDE, READONLY }` (`FieldEffect.java:11-13`), `FieldSubjectType { PERMISSION, GROUP, USER }` (`FieldSubjectType.java:11-14`); `FieldPolicy` uses `@Enumerated(EnumType.ORDINAL)` on all three (`FieldPolicy.java:31/40/48`) with `@SQLRestriction("deleted_at IS NULL")` (`FieldPolicy.java:26`).
- No `'*'` wildcard appears in V121 resource/target columns (F-05 static check).
- Corroborating unit test: `seedStyleRuleHidesExactlyUpdatedDateAndNothingElse` asserts `assertEquals(Map.of("updatedDate", FieldEffect.HIDE), resolved)` — any second hidden field would fail the test.

### (b) AC-F01 (static) — PermissionMiddleware public-path exemption — PASS

File: `D:\project\hang-hai-kchtgt\src\main\java\com\hanghai\kchtg\security\PermissionMiddleware.java`

- Line 53: `private static final List<String> PUBLIC_PATH_PREFIXES = List.of(` … line 63: `"/api/field-visibility"` — the exact endpoint prefix is the LAST entry in the list; no broad `/api/` prefix was added.
- Line 147: `return PUBLIC_PATH_PREFIXES.stream().anyMatch(path::startsWith);` (isPublicPath skip) — bypasses the gate at line 130: `if (!permissionRoleService.checkPermission(userId, resource, action))`.
- AuthN retained: no SecurityConfig / JwtAuthFilter change (grep below); `SecurityConfig.java:104` `.requestMatchers("/api/**").authenticated()` unchanged.
- No new permission seeded: `field-visibility|fieldvisibility|FieldVisibility` grep hits in `PermissionSeeder.java`, `RolePermissionSeeder.java`, `SecurityConfig.java` = **zero**.
- Runtime half (non-admin GET → 200, anonymous → 401): **PENDING-HUMAN**.

### (c) AC-F04 (static) — ThreadLocal cleared unconditionally — PASS

File: `D:\project\hang-hai-kchtgt\src\main\java\com\hanghai\kchtg\fieldvisibility\interceptor\FieldVisibilityInterceptor.java`

- `afterCompletion` (lines 61–65): `FieldVisibilityContext.clear();` — unconditional, no condition on `ex`.
- `preHandle` (lines 40–58): unauthenticated / non-User principal → `FieldVisibilityContext.clear(); return true;` (:48-51); resolution exception → `clear()` in `catch` (:55-57); **always returns true** (:58) so Spring always invokes `afterCompletion` (incl. handler exception paths).
- D5 path→resource map (lines 28–34): `/api/v1/vts-system`, `/api/v1/vts-systems`, `/api/v1/he-thong-vts` → `vts`; any other `/api/**` → null.
- `FieldVisibilityContext` (`D:\project\hang-hai-kchtgt\src\main\java\com\hanghai\kchtg\fieldvisibility\FieldVisibilityContext.java`): `get()` returns `Map.of()` when unset — never NPE (:31-34); `isHidden` = `(map[fieldName] ?? map['*']) == HIDE`, empty map → false (:39-49); `clear()` = `CURRENT.remove()` (:51-52).
- Runtime leak probe (strip-active request followed by a no-policy request shows no contamination): **PENDING-HUMAN**.

### (d) AC-S4 supporting — Jackson strip consults ThreadLocal at WRITE time — PASS

File: `D:\project\hang-hai-kchtgt\src\main\java\com\hanghai\kchtg\fieldvisibility\config\FieldVisibilityJacksonConfig.java`

- Lines 30–35: `SimpleFilterProvider().setFailOnUnknownId(false).setDefaultFilter(new FieldVisibilityFilter())` installed via `builder.postConfigurer(...)` — no per-DTO `@JsonFilter` anywhere.
- Lines 46–52 (the filter): `serializeAsField(...)` → `if (FieldVisibilityContext.isHidden(writer.getName())) { return; }` — the check runs **per field, at write time**, per request thread; never at serializer construction (cache-safe, design D4/D8). READONLY fields pass through (`isHidden` is HIDE-only); empty ThreadLocal → no-op (default ALLOW).

### (e) AC-S3/S4 supporting — VTS demo column + filter — PASS

File: `D:\project\hang-hai-kchtgt\frontend\src\pages\vtssystem\VtsSystemList.tsx`

- Line 18: `import { useFieldVisibility } from '../../hooks/useFieldVisibility';`
- Line 272: `const { isHidden } = useFieldVisibility('vts');`
- Lines 520–521 (inside the `columns` `useMemo` at :497): `{ key: 'updatedDate', label: 'Ngày cập nhật', dataIndex: 'updatedDate', width: 170, sortable: true, render: (val: string) => formatDate(val) }` — `formatDate` exists at line 38.
- Line 522: `.filter((c) => !(c.key === 'updatedDate' && isHidden('updatedDate'))), [page, pageSize, isHidden]);` — deps extended with `isHidden`.
- Existing columns preserved: `orgUnitName` ('Đơn vị quản lý', :514), `approvalStatus` ('Trạng thái', :515-519) — no column removed; form/history drawer untouched (scope boundary).
- Hook `D:\project\hang-hai-kchtgt\frontend\src\hooks\useFieldVisibility.ts`: `useQuery` (`queryKey: ['field-visibility', resource]`, `staleTime: 5 * 60 * 1000`), `api.get('/field-visibility', { params: { resource } })`, envelope unwrap `(res.data?.data ?? {})` — **fail-open**: any error returns `{}` (UX-only; the backend strip is authoritative, design D7).

### (f) Demo key is `updatedDate` everywhere (no stray `updatedAt` policy key) — PASS

- Grep `updatedAt` in `D:\project\hang-hai-kchtgt\src\main\java\com\hanghai\kchtg\fieldvisibility\**` → **zero matches**.
- Grep `updatedAt` in `D:\project\hang-hai-kchtgt\src\main\resources\db\migration\V121__create_field_visibility_policy.sql` → **zero matches** (only the `updated_at` DDL column exists, which is not a policy key).
- Wire key confirmed pre-existing: `D:\project\hang-hai-kchtgt\src\main\java\com\hanghai\kchtg\vtssystem\dto\VtsSystemListItemResponse.java:33` `private LocalDateTime updatedDate;`; `D:\project\hang-hai-kchtgt\src\main\java\com\hanghai\kchtg\vtssystem\repository\VtsSystemRepository.java:81` `t.updatedAt AS updatedDate`; `D:\project\hang-hai-kchtgt\frontend\src\types\vtsSystem.ts:65` and `:85` `updatedDate?: string;`.

### (g) AC-F05 — default ALLOW — PASS (unit + static)

- Unit green: `noRulesDefaultsToAllow` (`FieldVisibilityServiceTest.java:35`) — empty rule set → empty map; `seedRuleDoesNotApplyToAnotherResource` (:50) — resource `'port'` with only the `'vts'` rule → empty map.
- Static: D5 map (`FieldVisibilityInterceptor.java:28-34`) yields null resource for any non-VTS path; `FieldVisibilityService.matchesResource` (`FieldVisibilityService.java:130-136`) only matches `rule.resource == resource` or `'*'`; empty map → `isHidden` false → Jackson filter no-op.
- Runtime half (sample of other screens byte-identical): **PENDING-HUMAN**.

### h) AC-SCOPE — change-set boundary — PASS

Grep inventory (`field-visibility|fieldvisibility|FieldVisibility`): `PermissionSeeder.java` **0 hits**, `RolePermissionSeeder.java` **0 hits**, `SecurityConfig.java` **0 hits**. New-file inventory matches the 12 edit-targets + 4 documented additions exactly:

| Role | Files (full paths under `D:\project\hang-hai-kchtgt\`) |
|---|---|
| New (backend) | `src\main\java\com\hanghai\kchtg\fieldvisibility\` — `FieldVisibilityContext.java`, `entity\FieldPolicy.java`, `entity\FieldSubjectType.java`, `entity\FieldTargetType.java`, `entity\FieldEffect.java`, `repository\FieldPolicyRepository.java`, `service\FieldVisibilityService.java`, `interceptor\FieldVisibilityInterceptor.java`, `config\FieldVisibilityJacksonConfig.java`, `controller\FieldVisibilityController.java` (10 files = 7 triage targets + 3 enum additions) |
| New (migration) | `src\main\resources\db\migration\V121__create_field_visibility_policy.sql` (one new migration; `V120__ensure_vts_system_enum_storage.sql` untouched) |
| New (test) | `src\test\java\com\hanghai\kchtg\fieldvisibility\FieldVisibilityServiceTest.java` |
| Modified (backend) | `src\main\java\com\hanghai\kchtg\config\WebConfig.java` (adds interceptor registration, lines 23-36), `src\main\java\com\hanghai\kchtg\security\PermissionMiddleware.java` (adds line 63 only) |
| Modified (frontend) | `frontend\src\hooks\useFieldVisibility.ts` (new), `frontend\src\pages\vtssystem\VtsSystemList.tsx` (lines 18/272/520-522) |

No admin policy UI, no record-level / org-unit data-scope logic, no `@PreAuthorize` additions, no `field_policy` creation outside V121 (grep-verified: `field_policy` appears only in V121 + the entity/repository). Note: `git diff` was NOT run (brief forbids git); the boundary is proven by file inventory + targeted greps.

## 4. RUNTIME done_oracle — PENDING-HUMAN (backend must NOT be started by agents)

| AC | Oracle (human on a live instance) | Status |
|---|---|---|
| AC-S3 | Admin (`admin:all`/`*`) sees the "Ngày cập nhật" column on `/vts-system` AND `GET /api/v1/vts-system` (aliases `/api/v1/vts-systems`, `/api/v1/he-thong-vts`) responses still carry `updatedDate` | PENDING-HUMAN |
| AC-S4 | Regular user (`vts:read`, no `admin:all`/`*`) sees NO column AND the raw VTS list JSON contains NO `updatedDate` property — verify on the wire payload, not the rendered table | PENDING-HUMAN |
| AC-S5 | `GET /api/field-visibility?resource=vts` → admin `data: {}`; regular user `data: {"updatedDate":"HIDE"}` (envelope `ApiResponse`, `ApiResponse.java:19`) | PENDING-HUMAN |
| AC-F01 runtime | Authenticated non-admin GET `/api/field-visibility?resource=vts` → 200 (not 403); anonymous → 401 | PENDING-HUMAN |
| AC-F04 runtime | Leak probe: after a regular-user VTS request (strip active), the next request to a no-policy screen returns full JSON | PENDING-HUMAN |
| AC-F05 runtime | At least one non-VTS list screen's JSON is unchanged (spot-check, design §13 "byte-identical") | PENDING-HUMAN |

Controller contract for S5 verified statically: `FieldVisibilityController.java` (`@RestController @RequestMapping("/api/field-visibility")`, `@GetMapping` + `@RequestParam("resource")`, `ApiResponse.success(service.getVisibilityMap(user, normalized))`, trims/lowercases/caps `resource` at 100 chars — F-06 hardening).

## 5. Notes and residual risks

- Frontend `tsc --noEmit` baseline is pre-existing red (~90 files, workspace memory); the agreed gate is `npm run build` (design §12) — PASSED. No new tsc errors were attributed to M-1004 files in this run (vite build compiles all 4034 modules).
- The serializer-cache risk (design §12) is mitigated by construction: `FieldVisibilityJacksonConfig` performs the `isHidden` check inside `serializeAsField` at write time; the filter instance itself is stateless.
- Migration execution on a real DB (Flyway applies V121, seed row lands with `target_type=0`) is a runtime concern — covered implicitly by the PENDING-HUMAN oracle items; the SQL was reviewed statically and matches the house V118/V19 style (`CREATE TABLE IF NOT EXISTS`, `gen_random_uuid()`, `WHERE NOT EXISTS`).

## 6. Verdict

**Pass** — all six agent-executable gates executed with real output: `mvn clean compile` exit 0; `npm run build` exit 0; `mvn -Dtest=FieldVisibilityServiceTest test` → Tests run: 12, Failures: 0, Errors: 0, Skipped: 0; all six static probes (a)–(f) + scope re-check pass with full-path anchors. The three runtime ACs (S3/S4/S5) plus the runtime halves of F-01/F-04/F-05 are **PENDING-HUMAN** and must be signed off on a live instance before module release; agents did not and will not start the backend.
