---
feature-id: M-1004
stage: review
agent: utility-security-auditor
verdict: Pass
last-updated: 2026-08-17
---

# M-1004 Field-level Authorization PoC — Security Review of Implemented Code

Baseline: threat model `security/03-threat-model.md` (findings F-01..F-11) + accepted design plan (amended 2026-08-17, WO-BE-1..WO-BE-10, WO-FE-1..2, WO-INT-1). This review verifies the IMPLEMENTED code against every security requirement with full-path evidence. All 12 backend files, the V121 migration, the unit test, and the 2 frontend files were read this session.

## 1. Review scope

Domains assessed: authentication (JWT unchanged, `/api/**` authenticated), authorization (PermissionMiddleware gate + structural admin bypass), data protection (write-time Jackson strip), serialization bypass channels, ThreadLocal lifecycle, resolution-order correctness, input validation (visibility endpoint), audit columns, per-request DB reads, enum ordinal stability, scope discipline (no seeder/SecurityConfig/other-screen changes).

## 2. Per-requirement verification (F-01..F-11)

| ID | Requirement | Result | Evidence (implemented code, full paths) |
|---|---|---|---|
| F-01 | Visibility endpoint exempt from PermissionMiddleware resource gate; authN retained; no new permission seeded | **VERIFIED** | `src/main/java/com/hanghai/kchtg/security/PermissionMiddleware.java:63` — `"/api/field-visibility"` appended to `PUBLIC_PATH_PREFIXES` (list declared at `:53`, startsWith skip at `:147`). AuthN retained: `src/main/java/com/hanghai/kchtg/config/SecurityConfig.java:104` `.requestMatchers("/api/**").authenticated()` unchanged; no `field-visibility` permitAll anywhere in SecurityConfig (grep-verified). No new permission: `PermissionSeeder.java` and `RolePermissionSeeder.java` contain no `field`/`FieldPolicy`/`visibility` references (grep-verified). Exact prefix only — no broad `/api/` exemption. |
| F-02 | V121 seed: target_type=0 (FIELD), effect HIDE, target_key 'updatedDate', subject 'vts:read', guarded | **VERIFIED** | `src/main/resources/db/migration/V121__create_field_visibility_policy.sql:22` — `SELECT 0, 'vts:read', 'vts', 0, 'updatedDate', 0, 10, TRUE` with `WHERE NOT EXISTS (SELECT 1 FROM field_policy WHERE resource = 'vts' AND target_key = 'updatedDate' AND deleted_at IS NULL)` (`:24`); DDL comments `0=FIELD 1=GROUP 2=ALL` / `0=HIDE 1=READONLY` match enum ordinals. |
| F-03 | Bypass channels (standalone mappers, streaming, byte exports) documented out-of-scope; no NEW channel added | **VERIFIED** | Pre-existing channels confirmed unchanged: `src/main/java/com/hanghai/kchtg/gis/service/ChartIntegrationService.java:34` (`new ObjectMapper()` — deserialization only), `src/main/java/com/hanghai/kchtg/accesslog/controller/LogExportController.java:56` (StreamingResponseBody — CSV), `src/main/java/com/hanghai/kchtg/report/controller/ReportController.java:146` (byte[] export). The new package adds no mapper/stream/export: `fieldvisibility/` contains only entity/service/repository/context/interceptor/config/controller (all read; no ObjectMapper instantiation, no StreamingResponseBody/SseEmitter). Documented out-of-scope in design §9. |
| F-04 | ThreadLocal cleared UNCONDITIONALLY in afterCompletion incl. exception paths; no async-thread population; get() never NPEs | **VERIFIED** | `src/main/java/com/hanghai/kchtg/fieldvisibility/interceptor/FieldVisibilityInterceptor.java:61` — `afterCompletion(...)` calls `FieldVisibilityContext.clear()` (`:65`) with no conditions (signature includes `Exception ex`). `preHandle` clears on unauthenticated/not-User (`:48`) and on resolution failure (`:55` fail-open). `src/main/java/com/hanghai/kchtg/fieldvisibility/FieldVisibilityContext.java:33` — `get()` returns `Map.of()` when absent (never null); `clear()` uses `ThreadLocal.remove()` (`:52`). ThreadLocal populated only in `preHandle` (`:52` set) on the request thread — async writer threads see empty context → strip no-op (no wrong-strip). |
| F-05 | Default ALLOW; `*` resource/target wildcards cannot strip across the 22 screens; specificity > priority | **VERIFIED** | `src/main/java/com/hanghai/kchtg/fieldvisibility/service/FieldVisibilityService.java:116` `matchesResource` — only exact match or `resource='*'`; interceptor maps non-VTS paths to null resource (`FieldVisibilityInterceptor.java:70`), where only `*`-resource rules apply (PoC seeds none). Empty winners map = default ALLOW (`:74`). `beats()` lexicographic `(subjectSpec, targetSpec, priority)` (`:156`); subjectSpec PERMISSION=0<GROUP=1<USER=2 (`:135`), targetSpec ALL=0<GROUP=1<FIELD=2 (`:147`). Unit tests: `FieldVisibilityServiceTest.java` `seedRuleDoesNotApplyToAnotherResource`, `wildcardResourceAppliesToAnyResource`, `targetAllContributesWildcardKey`, `userSubjectBeatsPermissionSubjectRegardlessOfPriority`, `fieldTargetBeatsGroupTargetRegardlessOfPriority`. |
| F-06 | Subjects derived only from authenticated principal; resource param hardened | **VERIFIED** | `src/main/java/com/hanghai/kchtg/fieldvisibility/controller/FieldVisibilityController.java:33` — `currentUser()` from `SecurityContextHolder`; only client input is `resource`, trimmed + lowercased + capped at 100 chars (`:28-32`). No subjectId/subjectType params. `FieldVisibilityService.java:96` `buildSubjectSet` from principal only (USER id, ACTIVE-or-null GROUPs, PERMISSION codes). Resolution queries are derived Spring Data (parameterized — no SQLi). |
| F-07 | Enum ordinals stable; append-only evolution | **VERIFIED** | `FieldSubjectType.java:8`, `FieldTargetType.java:8`, `FieldEffect.java:7` all carry "Append-only: never reorder or insert mid-list (threat-model F-07)" Javadoc; declaration order matches DDL comments. Specificity switches in `FieldVisibilityService.java:133/141` are explicit, decoupled from ordinals — a future enum reorder cannot silently change ranking. `@Enumerated(EnumType.ORDINAL)` on all three fields (`FieldPolicy.java:30/40/46`). |
| F-08 | Per-request DB read accepted; no caching bug | **VERIFIED** | `FieldPolicyRepository.java:17` `findByActiveTrue()` only; no `@Cacheable` anywhere in the package (no stale-cache risk). `FieldVisibilityService.java:58` loads once per resolve call; table is 1-row, indexed (`V121__create_field_visibility_policy.sql:19-20` idx_resource_active + idx_subject). Admin bypass short-circuits BEFORE the query (`FieldVisibilityService.java:50-52`); null user short-circuits too (`:46-47`, test `unauthenticatedUserResolvesToEmpty`). |
| F-09 | Admin bypass structurally sound; direct-grant only | **VERIFIED** | `FieldVisibilityService.java:50-52` — bypass on `admin:all` OR `*` from `user.getAllPermissions()` (which excludes those codes from group inheritance at `User.java:153`); matches `PermissionRoleService.isSuperAdmin` (`PermissionRoleService.java:85`). Test `adminAllBypassesAllRules`. Dev mock token pre-existing (`JwtAuthFilter.java:82`), unchanged. |
| F-10 | GROUP subjects use ACTIVE-or-null predicate | **VERIFIED** | `FieldVisibilityService.java:105` — `group.getStatus() == null || group.getStatus() == GroupStatus.ACTIVE`, mirroring `User.java:143`. Tests: `groupRuleMatchesActiveGroupOnly` (INACTIVE skipped), `groupRuleMatchesNullStatusGroup` (null status → rule applies — no silent fail-open). |
| F-11 | Audit columns present; no policy-mutation endpoints | **VERIFIED** | `V121__create_field_visibility_policy.sql:14-16` (`deleted_at`, `deleted_by`, `created_by`, `updated_by`); `FieldPolicy.java:21` extends `BaseEntity` with `@SQLRestriction("deleted_at IS NULL")`. Only controller is `FieldVisibilityController` (GET-only) — no admin CRUD UI. |
| Jackson strip (WO-BE-8) | Write-time ThreadLocal check; HIDE-only; READONLY passthrough; no per-DTO annotations; global mapper only | **VERIFIED** | `src/main/java/com/hanghai/kchtg/fieldvisibility/config/FieldVisibilityJacksonConfig.java:29-31` — `SimpleFilterProvider().setFailOnUnknownId(false).setDefaultFilter(new FieldVisibilityFilter())` installed via `postConfigurer` (`:32`) on the global mapper; no `@JsonFilter`/`@JsonView` anywhere in the tree — grep-verified. `:43-47` — `serializeAsField` consults `FieldVisibilityContext.isHidden(writer.getName())` (`:47`) AT WRITE TIME per field; skips only HIDE; READONLY passes (isHidden is HIDE-only); empty ThreadLocal → no-op (default ALLOW). Filter class stateless (`:40`) — safe with Jackson's cached serializer instances. `FieldVisibilityContext.isHidden` implements `(map[field] ?? map['*']) == HIDE` (`FieldVisibilityContext.java:44`/`:46`). |
| FE fail-open (WO-FE-1/2) | Hook is UX-only; backend strip authoritative; no other screen touched | **VERIFIED** | `frontend/src/hooks/useFieldVisibility.ts:23` — `useQuery` with `queryKey ['field-visibility', resource]`, `staleTime 5*60*1000`, fail-open `{}` on error (`:39` `apiQuery.data ?? {}`), memoized `isHidden`/`isReadonly` via `useCallback`. `frontend/src/pages/vtssystem/VtsSystemList.tsx:272` — `useFieldVisibility('vts')`; `:520-521` — column `{ key: 'updatedDate', label: 'Ngày cập nhật', dataIndex: 'updatedDate', width: 170, sortable: true, render: (val) => formatDate(val) }`; `:522` — `.filter((c) => !(c.key === 'updatedDate' && isHidden('updatedDate')))` with deps `[page, pageSize, isHidden]`. Grep of `frontend/src` shows `useFieldVisibility(` used ONLY in the hook + VtsSystemList — no other screen touched. |

## 3. Implementation-level observations (no new findings)

| ID | Domain | Observation | Severity | Evidence |
|---|---|---|---|---|
| O-1 | Input validation | `resource` longer than 100 chars is silently truncated rather than rejected; benign (service compares against fixed rule resources, and resolution is per-principal) | Informational | `FieldVisibilityController.java:31` |
| O-2 | Authorization | The `/api/field-visibility` public-prefix exemption uses startsWith, so hypothetical `/api/field-visibility/<sub>` paths would also skip the gate; only one GET mapping exists today — no sub-paths | Informational | `PermissionMiddleware.java:63`, `FieldVisibilityController.java:19` |
| O-3 | Concurrency | `afterCompletion` clears unconditionally, but the AccessLogInterceptor registered before it (`WebConfig.java:30`) still runs its own afterCompletion afterwards — no interaction with the visibility context (verified: `AccessLogInterceptor.java:75` touches no FieldVisibilityContext) | Informational | `WebConfig.java:30` |

## 4. Compliance considerations

| Standard | Requirement | Status | Gap |
|---|---|---|---|
| OWASP Top 10 2025 A01/A10 (kb-0309e880693bbe0a) | Server-side authorization on every access; no fail-open enforcement | Compliant | `/api/**` authenticated retained; middleware exemption is authN-preserving; FE fail-open is UX-only (backend strip authoritative). |
| Internal RBAC convention (AGENTS.md) | New protected endpoints map to registered permissions | Compliant (config exemption) | Public-path exemption for the self-service endpoint; no new permission; seeders untouched. |
| VN personal data (NĐ 13/2023; Law 91/2025/QH15) | No exposure beyond need | Compliant | Only audit metadata (`updatedDate`) hidden in the demo; no personal data in `field_policy`. |
| Project audit convention | Mutation paths record operator identity | Compliant (N/A) | No policy-mutation endpoints in scope. |

## 5. Must-fix items

None — no blocking findings remain. Both previously blocking findings (F-01, F-02) verified remediated in the implemented code (section 2, full-path evidence).

## 6. Should-fix items (post-PoC obligations, unchanged from threat model)

| ID | Finding | Risk if deferred | Priority |
|---|---|---|---|
| F-03 | Export/stream channels not stripped (CSV/byte exports, standalone mappers) | Any future policy on a resource with exports leaks HIDE fields | High (re-audit before new policies) |
| F-07 | Enum ordinals append-only (documented) | Reorder would remap stored rows | Medium |
| F-08 | Per-request DB read | Add evict-after-commit caching when rules grow | Low |
| F-06 | Resource-param truncation vs rejection | None today | Low |

## 7. Verification statement

- Verification executed this session: **source-level only** — full reads of all 12 backend implementation files (`fieldvisibility/` package, `WebConfig.java`, `PermissionMiddleware.java`, `V121__create_field_visibility_policy.sql`), the unit test, and both frontend files, plus targeted greps (seeders, SecurityConfig permitAll list, `useFieldVisibility(` usage tree-wide, org-unit/data-scope references in the package).
- NO build/typecheck/test command was executed by this seat (read-only allowlist, no shell; per brief, builds are already green — that is the implementer's reported WO-INT-1 result, not this seat's claim). The unit test `FieldVisibilityServiceTest.java` (13 tests, pure JUnit+Mockito, no server) was READ and its assertions mapped to requirements; it is the implementer gate for the resolution algorithm and must be run by the pipeline gate.
- The LSP diagnostics observed during this session (JRE `ct.sym` init failure, unrelated `orgunit` Lombok errors) are pre-existing and unrelated to the reviewed files.
- Scope discipline confirmed: no `PermissionSeeder`/`RolePermissionSeeder` change, no `SecurityConfig` change for the endpoint (authN block intact), no record-level/org-unit data-scope logic in `fieldvisibility/`, no admin policy UI, no other screen touched (single `useFieldVisibility` consumer).
