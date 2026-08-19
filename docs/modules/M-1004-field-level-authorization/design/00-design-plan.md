# Design Plan — M-1004 Field-level Authorization PoC

- Triage: `TRI-1786938535184-0213` (C3, full pipeline, dev_footprint = mixed)
- Change type: architecture. Shape: scaffolded (11 triage edit-target files + 12th PMO-amended `PermissionMiddleware.java`, 1 write-scope cluster)
- Status: **Ready for implementation** — this plan turns the AGREED DESIGN into executable work orders (WO-BE-*, WO-FE-*, WO-INT-*).

## 1. Objective (one paragraph)

Build a PoC of field-level authorization: a `field_policy` rule table + a resolution service that, for the current user and a feature resource, computes the effective per-field effect (HIDE | READONLY | default ALLOW); a Spring `HandlerInterceptor` on `/api/**` resolves the hidden-field set into a `ThreadLocal` context; a global Jackson customization (no per-DTO annotations) strips HIDE fields from JSON responses. One demo: the VTS list screen (`/vts-system`) hides the "Ngày cập nhật" column for regular users while admins (`admin:all` / `*`) still see it — both in the UI (via `GET /api/field-visibility`) and in the wire payload (Jackson strip is authoritative).

## 2. Agreed design (locked direction — this plan only decides HOW)

1. Flyway migration -> table `field_policy` (subject_type, subject_id, resource, target_type, target_key, effect, priority, active + audit columns).
2. Resolution service: per user + resource compute effective effect per field; specificity (USER > GROUP > PERMISSION; FIELD > GROUP > ALL) then priority; default ALLOW — no rule must break the existing 22 screens.
3. READ-path enforcement: HandlerInterceptor registered in `WebConfig` on `/api/**` -> ThreadLocal context -> global Jackson `BeanSerializerModifier`/`PropertyFilter` strips HIDE fields; READONLY fields still returned; write rejection OUT of scope.
4. `GET /api/field-visibility?resource=<resource>` returns the per-field map for the current user (frontend UX layer only).
5. Reuse the existing permission model as subjects (codes from `User.getAllPermissions()`, `UserGroup` id, user id). No parallel auth system.
6. Seed ONE demo policy: resource `vts`, hidden field = the audit "last updated" value, HIDE for regular users, NOT for holders of `admin:all` / `*`.

## 3. Design decisions (with verified anchors)

### D1 — Migration version is **V121**, not V120
`V120__ensure_vts_system_enum_storage.sql` already exists in `src/main/resources/db/migration/` (verified by glob this session). The triage one-way-door path `V120__create_field_visibility_policy.sql` would collide with it and make Flyway fail at startup (duplicate version). Decision: **`src/main/resources/db/migration/V121__create_field_visibility_policy.sql`** (V121 is free). Everything else in the agreed design is unchanged.

### D2 — Policy `target_key` is the **serialized JSON property name**; the demo key is `updatedDate`
The strip works on what Jackson serializes, so `target_key` must equal the JSON property name. The agreed design's "field `updatedAt`" refers to the source entity field `BaseEntity.updatedAt` (`src/main/java/com/hanghai/kchtg/common/entity/BaseEntity.java`, `@LastModifiedDate private LocalDateTime updatedAt;`). On the demo screen the value is serialized as **`updatedDate`**:
- `src/main/java/com/hanghai/kchtg/vtssystem/dto/VtsSystemResponse.java` — `private LocalDateTime updatedDate;`
- `src/main/java/com/hanghai/kchtg/vtssystem/repository/VtsSystemRepository.java` — `t.updatedAt AS updatedDate` (projection alias)
- `frontend/src/types/vtsSystem.ts` — `VtsSystemListItem.updatedDate?: string`

Decision: the seeded policy uses `target_type = FIELD`, `target_key = 'updatedDate'`. (A policy keyed `updatedAt` would never fire on the VTS screen — nothing to strip; the demo would be empty.)

### D3 — Resolution semantics: specificity (subject, then target) > priority, default ALLOW, structural admin bypass
- Subject set of the current `User` (all lowercased, matching `User.getAllPermissions()` at `src/main/java/com/hanghai/kchtg/user/entity/User.java`):
  - USER: `user.getId()` (UUID)
  - GROUP: `id` of every `UserGroup` with ACTIVE-or-null status in `user.getGroups()` (same predicate as the group filter in `getAllPermissions()` at `User.java:143`)
  - PERMISSION: every code in `user.getAllPermissions()` `User.java:129` (already trimmed + lowercased)
- Specificity order (least -> most): subject `PERMISSION(0) < GROUP(1) < USER(2)`; target `ALL(0) < GROUP(1) < FIELD(2)`.
- Compare candidates lexicographically by `(subjectSpecificity, targetSpecificity, priority)` — higher wins. Equal on all three: keep the existing winner (deterministic; exact tie is a policy-authoring error, not a runtime case).
- **Admin bypass (structural, not a rule):** if `getAllPermissions()` `User.java:129` contains `admin:all` or `*`, resolution returns the empty map (nothing hidden). Rationale: the effect enum is fixed to HIDE|READONLY (agreed design), so an "ALLOW override for admins" cannot be expressed as a higher-priority rule; and this mirrors the existing frontend bypass semantic in `frontend/src/store/permissionStore.ts` ("chỉ `admin:all` hoặc `*` mới được bypass"). Note `User.getAllPermissions()` already excludes `admin:all`/`*`/`group:manage`/`orgunit:scope_all` from GROUP inheritance `User.java:153` — these codes can only be granted directly, so the bypass is not triggerable by group membership.
- Default ALLOW: a field with no winning rule is absent from the returned map -> Jackson filter does not touch it -> all existing screens keep their current payloads (only `resource = vts` has a rule in this PoC).

### D4 — Enforcement wiring (request lifecycle)
1. `FieldVisibilityInterceptor.preHandle` (registered in `WebConfig` beside `accessLogInterceptor`, which is registered at `src/main/java/com/hanghai/kchtg/config/WebConfig.java` on `/api/**`):
   - Read `SecurityContextHolder`; if not authenticated or principal is not a `User` -> `FieldVisibilityContext.clear()` and continue (skip).
   - Derive `resource` from the request URI via a private path->resource map (D5); resolve `Map<String,FieldEffect>`; `FieldVisibilityContext.set(...)`.
   - Never blocks the request (always returns `true`) — visibility is a serialization concern, not access control.
2. `FieldVisibilityContext`: `ThreadLocal` holder with `get/set/clear` and `isHidden(fieldName)` semantics (`Map.get(field) ?? Map.get("*") == HIDE`).
3. Jackson strip (WO-BE-8): `FieldVisibilityJacksonConfig implements Jackson2ObjectMapperBuilderCustomizer`; a `SimpleFilterProvider().setFailOnUnknownId(false).setDefaultFilter(fieldVisibilityFilter)` is installed on the mapper. `setDefaultFilter` applies to every bean WITHOUT a `@JsonFilter` annotation -> **zero per-DTO annotations**. The filter is a stateless `SimpleBeanPropertyFilter` whose `serializeAsField` consults the ThreadLocal **at write time** (per field, per request thread) — this is cache-safe: serializer/writer instances are cached and shared across requests, so the check must not happen at serializer-construction time.
4. `afterCompletion`: `FieldVisibilityContext.clear()` (no thread-local leak across pooled threads).
5. READONLY fields: returned untouched (only exposed via the GET map for form disabling). Write rejection is out of scope.

### D5 — Path -> resource mapping
Explicit prefix map inside `FieldVisibilityInterceptor` (no extra file; PoC-lean):
- `/api/v1/vts-system`, `/api/v1/vts-systems`, `/api/v1/he-thong-vts` -> `vts` (the controller maps all three: `src/main/java/com/hanghai/kchtg/vtssystem/controller/VtsSystemController.java` `@RequestMapping({"/api/v1/vts-systems", "/api/v1/vts-system", "/api/v1/he-thong-vts"})`)
- any other `/api/**` path -> `null` (no resource-scoped rules; only `resource = '*'` rules apply; the PoC has none, so the strip is a no-op elsewhere — this is what guarantees the existing 22 screens are untouched).

### D6 — Seeded demo policy (exactly one)
In `V121`:
- `subject_type = PERMISSION`, `subject_id = 'vts:read'` (existing, seeded code — `PermissionSeeder.java` `seedPermission(definitions, "vts", "read")`; **no** RolePermissionSeeder/PermissionSeeder change, per scope boundary). Every user who can open the VTS list holds `vts:read`; admins are then exempted structurally by D3's bypass.
- `resource = 'vts'`, `target_type = FIELD`, `target_key = 'updatedDate'`, `effect = HIDE`, `priority = 10`, `active = TRUE`.

### D7 — Frontend: fail-open hook; backend strip stays authoritative
`useFieldVisibility(resource)` calls `GET /api/field-visibility?resource=...` through the shared axios instance (`frontend/src/services/api.ts`, baseURL `/api`, envelope `res.data.data` per `ApiResponse`). On any error it returns `{}` (nothing hidden client-side) — the Jackson strip is the security boundary; the hook is only the UX layer.

### D8 — Enum storage and entity conventions (project constraints)
`subject_type`, `target_type`, `effect` are enums stored as **ordinal SMALLINT** (`@Enumerated(EnumType.ORDINAL)`); `FieldPolicy extends BaseEntity` (gets id/createdAt/updatedAt/deletedAt/createdBy/updatedBy + `@SQLRestriction("deleted_at IS NULL")` automatically); `@FieldNameConstants` on the entity and DTOs; no hardcoded field-name strings (`FieldPolicy.Fields.*`); Lombok `@Getter/@Setter/@NoArgsConstructor`; all identifiers English, all user-facing messages Vietnamese with diacritics.

## 4. Data model — `field_policy` (WO-BE-1 DDL contract)

House DDL style verified from `V118__create_user_permission_assignment_tables.sql` and `V19__seed_root_org_unit.sql` (`id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`, audit columns, `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`).

```sql
CREATE TABLE IF NOT EXISTS field_policy (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_type SMALLINT NOT NULL,          -- 0=PERMISSION 1=GROUP 2=USER (ordinal)
    subject_id  VARCHAR(255) NOT NULL,       -- permission code | group UUID | user UUID
    resource    VARCHAR(100) NOT NULL,       -- feature key; '*' = all resources
    target_type SMALLINT NOT NULL,           -- 0=FIELD 1=GROUP 2=ALL (ordinal)
    target_key  VARCHAR(255) NOT NULL,       -- JSON property name; '*' when target_type=ALL
    effect      SMALLINT NOT NULL,           -- 0=HIDE 1=READONLY (ordinal)
    priority    INT NOT NULL DEFAULT 0,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP,
    deleted_by  UUID,
    created_by  UUID,
    updated_by  UUID
);
CREATE INDEX IF NOT EXISTS idx_field_policy_resource_active ON field_policy (resource, active);
CREATE INDEX IF NOT EXISTS idx_field_policy_subject ON field_policy (subject_type, subject_id);
-- Seed: ONE demo policy (D6)
INSERT INTO field_policy (subject_type, subject_id, resource, target_type, target_key, effect, priority, active)
SELECT 0, 'vts:read', 'vts', 0, 'updatedDate', 0, 10, TRUE
WHERE NOT EXISTS (SELECT 1 FROM field_policy WHERE resource = 'vts' AND target_key = 'updatedDate' AND deleted_at IS NULL);
```

Entity mapping (`FieldPolicy`): `subjectType`, `subjectId`, `resource`, `targetType`, `targetKey`, `effect` (all `@Enumerated(EnumType.ORDINAL)` where enum), `priority int`, `active boolean` — plus inherited `BaseEntity` audit columns. New enum files (documented additions beyond the triage edit-target files): `FieldSubjectType`, `FieldTargetType`, `FieldEffect` in `com.hanghai.kchtg.fieldvisibility.entity`.

## 5. Resolution algorithm (normative spec for WO-BE-4)

```
resolve(user, resource):
  if user == null: return {}                              # unauthenticated -> nothing hidden
  perms = user.getAllPermissions()                        # lowercased (User.java)
  if perms contains 'admin:all' OR perms contains '*': return {}   # D3 bypass
  subjects = { USER: user.id }
             ∪ { GROUP: g.id | g ∈ user.groups, g.status == null || ACTIVE }
             ∪ { PERMISSION: code | code ∈ perms }
  rules = repository.findActiveByResource(resource)       # resource OR '*', active = TRUE, deleted_at IS NULL
  for r in rules:
    if not matchesSubject(r, subjects): continue
    key  = (r.targetType == ALL) ? '*' : r.targetKey
    cand = (r, subjectSpec(r.subjectType), targetSpec(r.targetType), r.priority)
    if cand beats current[key] lexicographically: current[key] = r.effect
  return { field: effect }                                # absent field == ALLOW

subjectSpec: PERMISSION=0 < GROUP=1 < USER=2
targetSpec:  ALL=0 < GROUP=1 < FIELD=2
beats: compare (subjectSpec, targetSpec, priority) — higher wins; tie keeps existing
```

Context `isHidden(fieldName)` = `(map[fieldName] ?? map['*']) == HIDE`.

## 6. API contract — `GET /api/field-visibility`

- Path: `/api/field-visibility?resource=vts` (Spring `@RequestMapping("/api/field-visibility")`; SecurityConfig's `.requestMatchers("/api/**").authenticated()` already protects it — no SecurityConfig change). **PermissionMiddleware** (second enforcement layer after JwtAuthFilter) would otherwise 403 every non-admin — it must exempt this path (threat-model F-01; WO-BE-10); authentication is retained, no new permission seeded.
- Response: standard envelope `ApiResponse<Map<String,String>>` (`src/main/java/com/hanghai/kchtg/common/dto/ApiResponse.java`: `{ success, message, data, timestamp }`); `data` = `{ "updatedDate": "HIDE" }` (only non-ALLOW fields; missing key == ALLOW). Values are enum names `HIDE` / `READONLY`.
- No `@PreAuthorize` needed: any authenticated user may read their own visibility map (no sensitive data).

## 7. Frontend integration

- `frontend/src/hooks/useFieldVisibility.ts` (new): `useFieldVisibility(resource)` -> `{ visibility, isLoading, isHidden(field), isReadonly(field) }`, backed by `useQuery` from `@tanstack/react-query` (already a dependency — `frontend/package.json`) with `queryKey ['field-visibility', resource]`, `staleTime 5 * 60 * 1000`, fail-open on error. `isHidden`/`isReadonly` must be memoized (`useCallback` on `visibility`) so the consumer's `useMemo` deps stay stable.
- `frontend/src/pages/vtssystem/VtsSystemList.tsx` (modify): at the columns `useMemo` `VtsSystemList.tsx:497` (currently `[stt, systemName, address, conditionStatus, orgUnitName, approvalStatus]`, deps `[page, pageSize]`):
  - add a column `{ key: 'updatedDate', label: 'Ngày cập nhật', dataIndex: 'updatedDate', width: 170, sortable: true, render: (val) => formatDate(val) }` — `formatDate` already exists in this file at `VtsSystemList.tsx:38`;
  - the response field `updatedDate` already exists in the backend list DTO at `VtsSystemListItemResponse.java:33` and in the frontend type at `vtsSystem.ts:65` — no type-file change needed;
  - filter: `.filter((c) => !(c.key === 'updatedDate' && isHidden('updatedDate')))`; add `isHidden` to the `useMemo` deps;
  - styling via tokens only (`fontSizeMd`, `textSecondary`, ...) per `frontend/src/tokens.ts` / `frontend/src/theme.ts`; no hardcoded hex/spacing/font-size; keep the shared list-view components (`ScreenHeader`, `DataTable`, ...) untouched.
- READONLY UX (form disabling) is a documented pattern for later, NOT implemented in this PoC.

## 8. Acceptance mapping

| Triage done_oracle / criterion | Design element | Work order | Gate |
|---|---|---|---|
| Admin sees "Ngày cập nhật" column | D3 bypass + FE column added, not filtered | WO-BE-4, WO-FE-2 | runtime oracle (QA) |
| Regular user does not see the column | D6 seed + FE filter | WO-BE-1, WO-FE-2 | runtime oracle (QA) |
| GET VTS response no longer carries the audit field for regular users | D2/D4 Jackson strip (authoritative) | WO-BE-6/7/8 | runtime oracle (QA) + code review |
| Existing 22 screens unaffected | default ALLOW + resource-scoped mapping (D5) | WO-BE-4/6 | `mvn clean compile` + review |
| No record-level scope, no admin UI, no parallel auth | scope boundary | all WOs | review |
| Visibility map returns 200 for ANY authenticated user (not just admin) | PermissionMiddleware public-path exemption | WO-BE-9 + WO-BE-10 | `mvn clean compile` + review |
| Seed hides exactly `updatedDate` (target_type = FIELD=0), no other vts field | V121 seed + unit test | WO-BE-1 + WO-BE-4 | unit test + review |

Runtime oracle note: backend must not be started by agents (project rule); the QA wave exercises the done_oracle on a live instance.

## 9. Security requirements (from threat model)

Source: `docs/modules/M-1004-field-level-authorization/security/03-threat-model.md` (findings F-01..F-11, as present in the source document). This section is binding for the implementer and the reviewer; items marked out-of-scope are accepted PoC boundaries, not omissions.

- **F-01 (blocking, fixed by WO-BE-10):** `GET /api/field-visibility` must be exempted from `PermissionMiddleware`'s resource-permission gate via the public-path prefix list (`PermissionMiddleware.java:53`, startsWith match at `PermissionMiddleware.java:147`, gate call at `PermissionMiddleware.java:130`) while KEEPING authentication — otherwise every non-admin gets 403 and the done_oracle cannot pass. No new permission is seeded; `PermissionSeeder`/`RolePermissionSeeder` are untouched.
- **F-02 (blocking, fixed in WO-BE-1/WO-BE-4):** the V121 seed uses `target_type = 0` (FIELD), so only `updatedDate` is hidden; the WO-BE-4 unit test asserts exactly `updatedDate` is hidden and no other vts field.
- **F-03 (out of scope, documented):** the global Jackson strip does NOT cover standalone ObjectMapper instances (ChartIntegrationService — `ChartIntegrationService.java:34`), StreamingResponseBody exports (LogExportController — `LogExportController.java:56`), or byte exports (ReportController — `ReportController.java:146`, file verified at src/main/java/com/hanghai/kchtg/report/controller/ReportController.java) — those channels are NOT stripped in this PoC (defense-in-depth boundary). WO-INT-1 records this; any future policy on a resource with export/stream endpoints must re-audit these channels (fix-as-convention).
- **F-04 (mitigated):** the interceptor clears the ThreadLocal unconditionally in `afterCompletion`, including unauthenticated requests and exception paths, and async/streaming writers are never populated — no wrong-strip or leak; async JSON responses on policy-bearing resources are out of PoC scope.
- **F-05 (Low):** a `resource = '*'` wildcard rule applies to EVERY resource; the PoC seeds no wildcard rules and default ALLOW remains the baseline; unit tests must cover wildcard behavior.
- **F-06 (Low):** subjects are derived only from the authenticated principal (SecurityContext), never from request parameters — no spoofing surface; harden the `resource` query parameter with a length cap (cheap, optional).
- **F-07 (Medium):** enum columns are ordinals (SMALLINT) — evolve append-only, never reorder or insert mid-list (F-02 hit this trap); enforced in WO-BE-2.
- **F-08 (Low):** per-request DB read of active rules is accepted for the PoC (rule count is tiny); policy caching (`@Cacheable` + eviction) is deferred to post-PoC work.
- **F-10 (Medium):** GROUP subjects use the ACTIVE-or-null predicate, mirroring the group filter in `getAllPermissions()` at `User.java:143`, so group-scoped rules never silently fail open for null-status groups.
- **F-11 (compliant):** the PoC has no policy-mutation endpoints; the DDL audit columns exist for future use.

## 10. Work orders

Execution order: WO-BE-1 .. WO-BE-10 (backend wave, dependency chain), then WO-FE-1, WO-FE-2 (frontend wave), then WO-INT-1 (verification). Every WO: exact files, task, binding rules, verification.

Edit-target file list: the 11 triage `edit_target_files` + **12th (PMO-authorized scope amendment, threat-model DC-1/F-01): `src/main/java/com/hanghai/kchtg/security/PermissionMiddleware.java`** (WO-BE-10). Documented additions beyond the list stay: 3 enum files + 1 unit test.

### Backend wave

#### WO-BE-1 — Flyway migration `field_policy` + seed
- Files: **create** `src/main/resources/db/migration/V121__create_field_visibility_policy.sql` (deviation from triage filename `V120...` — see D1).
- Task: DDL per section 4 (table, 2 indexes, seed policy `('vts:read', 'vts', FIELD 'updatedDate', HIDE, priority 10)` guarded by `WHERE NOT EXISTS`). Enum columns as SMALLINT ordinals; audit columns per house style (V118). Follow the `CREATE TABLE IF NOT EXISTS` / `gen_random_uuid()` / `NOW()` patterns of V118/V19 exactly.
- Constraints: never edit an existing migration; identifiers English; comments in Vietnamese or English are both fine, SQL identifiers English.
- Verification: `mvn clean compile` (root) — and visual review that no other migration is touched (one new file only).

#### WO-BE-2 — Entity + enums
- Files: **create** `src/main/java/com/hanghai/kchtg/fieldvisibility/entity/FieldPolicy.java`, `FieldSubjectType.java`, `FieldTargetType.java`, `FieldEffect.java` (3 enum files are documented additions beyond the triage edit list).
- Task: `FieldPolicy extends BaseEntity`; `@Entity @Table(name = "field_policy")`; fields per section 4; `@Enumerated(EnumType.ORDINAL)` on the three enum fields; `@FieldNameConstants` on `FieldPolicy`; Lombok `@Getter/@Setter/@NoArgsConstructor`. Enums: `FieldSubjectType { PERMISSION, GROUP, USER }`, `FieldTargetType { FIELD, GROUP, ALL }`, `FieldEffect { HIDE, READONLY }` (declaration order == ordinal == DDL values).
- Constraints: no hardcoded field-name strings anywhere else — use `FieldPolicy.Fields.*`.
- Verification: `mvn clean compile`.

#### WO-BE-3 — Repository
- Files: **create** `src/main/java/com/hanghai/kchtg/fieldvisibility/repository/FieldPolicyRepository.java`.
- Task: `JpaRepository<FieldPolicy, UUID>` with `List<FieldPolicy> findByActiveTrue()` (Spring Data derives `active = TRUE`; `@SQLRestriction("deleted_at IS NULL")` on the entity already excludes soft-deleted rows). No custom JPQL needed for the PoC; the service filters by subject/resource in memory (rule count is tiny).
- Verification: `mvn clean compile`.

#### WO-BE-4 — Resolution service
- Files: **create** `src/main/java/com/hanghai/kchtg/fieldvisibility/service/FieldVisibilityService.java`.
- Task: implement the normative algorithm of section 5 exactly — admin bypass (`admin:all` / `*`), subject set from `User.getAllPermissions()` + ACTIVE `groups` + `user.getId()`, specificity `(subject, target)` then `priority`, default ALLOW. Public API:
  - `Map<String, FieldEffect> resolve(User user, String resource)` — full map incl. READONLY (used by interceptor);
  - `Map<String, String> getVisibilityMap(User user, String resource)` — for the controller: only HIDE/READONLY entries, values `effect.name()`.
  - `resource` handling: match rules with `resource == resource` OR `resource == '*'`; `target_type == ALL` contributes under the special key `'*'`.
- Constraints: reuse existing permission model only; do NOT touch RolePermissionSeeder/PermissionSeeder; no new auth system; Vietnamese Javadoc welcome but not required.
- Verification: `mvn clean compile`; plus a unit test (new test file under `src/test/java/com/hanghai/kchtg/fieldvisibility/`) asserting: (1) no rules -> empty map (default ALLOW); (2) seed-style rule hides exactly `updatedDate` and no other field for a user holding `vts:read`; (3) user holding `admin:all` gets empty map; (4) higher priority wins within the same specificity; (5) USER-subject beats PERMISSION-subject regardless of priority. Tests must not require a running server.

#### WO-BE-5 — ThreadLocal context
- Files: **create** `src/main/java/com/hanghai/kchtg/fieldvisibility/FieldVisibilityContext.java`.
- Task: `ThreadLocal<Map<String, FieldEffect>>` holder; static `get()`, `set(Map)`, `clear()`; instance method `boolean isHidden(String fieldName)` = `(map.get(fieldName) ?? map.get("*")) == FieldEffect.HIDE`. Guard `get()` against missing ThreadLocal (return empty map — never NPE in the serializer path).
- Verification: `mvn clean compile`.

#### WO-BE-6 — Interceptor
- Files: **create** `src/main/java/com/hanghai/kchtg/fieldvisibility/interceptor/FieldVisibilityInterceptor.java`.
- Task: `HandlerInterceptor`. `preHandle`: principal from `SecurityContextHolder` must be a `User` and authenticated, else `FieldVisibilityContext.clear()` and return `true`; derive resource via private path->resource map (D5: `/api/v1/vts-system`, `/api/v1/vts-systems`, `/api/v1/he-thong-vts` -> `vts`; else `null`); `FieldVisibilityContext.set(service.resolve(user, resource))`; return `true` always. `afterCompletion`: `FieldVisibilityContext.clear()`. Never throw; never block.
- Verification: `mvn clean compile`.

#### WO-BE-7 — Register interceptor in WebConfig
- Files: **modify** `src/main/java/com/hanghai/kchtg/config/WebConfig.java` (constructor-inject `FieldVisibilityInterceptor` like the existing `AccessLogInterceptor`; in `addInterceptors`, after `registry.addInterceptor(accessLogInterceptor)...` add `registry.addInterceptor(fieldVisibilityInterceptor).addPathPatterns("/api/**");` — no exclude patterns needed).
- Constraints: do not change the existing access-log registration or the ApprovalStatus formatter.
- Verification: `mvn clean compile`.

#### WO-BE-8 — Global Jackson strip
- Files: **create** `src/main/java/com/hanghai/kchtg/fieldvisibility/config/FieldVisibilityJacksonConfig.java` (the filter class is a private nested class here — no extra file).
- Task: `@Configuration implements Jackson2ObjectMapperBuilderCustomizer`; in `customize(...)` install `SimpleFilterProvider().setFailOnUnknownId(false).setDefaultFilter(filter)` (via `builder.postConfigurer`). Filter = `SimpleBeanPropertyFilter` subclass overriding `serializeAsField(pojo, gen, prov, writer)`: if `FieldVisibilityContext.get() != null && context.isHidden(writer.getName())` -> return WITHOUT writing; else `writer.serializeAsField(...)`. The check happens at write time (per field), NOT at serializer construction — required for cache safety (serializer instances are shared across requests/threads). READONLY fields pass through untouched.
- Constraints: no per-DTO `@JsonFilter`/annotations anywhere; must be a no-op when the ThreadLocal is empty (default ALLOW).
- Verification: `mvn clean compile`.

#### WO-BE-9 — Controller
- Files: **create** `src/main/java/com/hanghai/kchtg/fieldvisibility/controller/FieldVisibilityController.java`.
- Task: `@RestController @RequestMapping("/api/field-visibility")`; `@GetMapping` with `@RequestParam("resource") String resource`; principal `User` from `SecurityContextHolder`; returns `ResponseEntity<ApiResponse<Map<String,String>>>` via `ApiResponse.success(service.getVisibilityMap(user, resource))`. Vietnamese user-facing message text where any (e.g., missing param handled by Spring's default 400).
- Verification: `mvn clean compile`.

#### WO-BE-10 — Exempt `/api/field-visibility` from the PermissionMiddleware permission gate
- Files: **modify** `src/main/java/com/hanghai/kchtg/security/PermissionMiddleware.java` — the 12th edit-target file (PMO-authorized scope amendment per threat-model F-01/DC-1).
- Task: append `/api/field-visibility` to the `PUBLIC_PATH_PREFIXES` list (declared at `PermissionMiddleware.java:53`) so `isPublicPath` (startsWith match at `PermissionMiddleware.java:147`) skips the `checkPermission` gate (call at `PermissionMiddleware.java:130`) for this endpoint. Authentication is RETAINED: `JwtAuthFilter` still authenticates the request and `SecurityConfig`'s `.requestMatchers("/api/**").authenticated()` stays unchanged — the exemption skips only the resource-permission check, not authN.
- Constraints: do NOT seed a new permission (`fieldvisibility:read`); do NOT touch PermissionSeeder/RolePermissionSeeder; do NOT use a broad prefix — add only the exact endpoint prefix `/api/field-visibility`.
- Verification: `mvn clean compile`.

### Frontend wave

#### WO-FE-1 — Visibility hook
- Files: **create** `frontend/src/hooks/useFieldVisibility.ts`.
- Task: per section 7 — `useQuery` (`@tanstack/react-query`), `api.get('/field-visibility', { params: { resource } })` (shared axios instance `frontend/src/services/api.ts`, envelope `res.data?.data`), fail-open `{}` on error, `staleTime 5 * 60 * 1000`, memoized `isHidden`/`isReadonly` via `useCallback`. Export `type FieldEffect = 'HIDE' | 'READONLY' | 'ALLOW'`.
- Constraints: English identifiers; no UI code in the hook; no hardcoded strings beyond the effect names.
- Verification: `npm run build` (in `frontend/`).

#### WO-FE-2 — VTS list demo column
- Files: **modify** `frontend/src/pages/vtssystem/VtsSystemList.tsx`.
- Task: per section 7 — call `useFieldVisibility('vts')`; append the `updatedDate` column (`key: 'updatedDate'`, `label: 'Ngày cập nhật'`, `dataIndex: 'updatedDate'`, `width: 170`, `sortable: true`, `render: (val: string) => formatDate(val)` — `formatDate` already exists in the file `VtsSystemList.tsx:38`); filter the array when `isHidden('updatedDate')`; extend `useMemo` deps with `isHidden`. Tokens only for styling; shared list-view components untouched.
- Constraints: no hardcoded hex/spacing/font-size; Vietnamese label with diacritics; do not remove any existing column; do not touch the form/history drawer (scope: ONE demo screen, list columns only).
- Verification: `npm run build` (in `frontend/`).

### Integration

#### WO-INT-1 — Build gates + review checklist
- Task: run `mvn clean compile` from `D:\project\hang-hai-kchtgt` (backend never started) and `npm run build` from `D:\project\hang-hai-kchtgt\frontend`; both must exit 0. Reviewer checklist: exactly the files above changed (12 edit-target files — 11 triage + `PermissionMiddleware.java` per PMO amendment — + 4 documented additions: 3 enums + 1 test file); no RolePermissionSeeder/PermissionSeeder/SecurityConfig change; no record-level or org-unit data-scope logic; no admin policy UI; `field_policy` created only via V121; V121 seed uses `target_type = 0` (FIELD) so only `updatedDate` is stripped; PermissionMiddleware public-path exemption in place (WO-BE-10); Jackson strip consults the ThreadLocal at write time; frontend fail-open.
- Verification: the two commands above; runtime done_oracle is QA's (backend must not be started by agents).

## 11. Out of scope (do not implement)

- Admin policy-management UI (CRUD for `field_policy`), record-level / org-unit data-scope changes, READONLY write rejection, async/streaming response handling, policy caching (per-request DB read is accepted for the PoC), `@PreAuthorize` changes, any `RolePermissionSeeder`/`PermissionSeeder` modification, and any change to the other 21 screens.

## 12. Risks

- **Serializer caching** (high if wrong): any strip logic evaluated at serializer-construction time leaks across requests. Mitigated by D4/D8: write-time check only. Reviewer must verify this in WO-BE-8.
- **Field-name collisions across resources**: resource-scoped resolution (D5) limits stripping to the VTS resource; the `'*'` special key only activates for `target_type = ALL` rules, which the PoC does not seed.
- **ThreadLocal leak**: `afterCompletion` clears unconditionally; unauthenticated paths clear too (WO-BE-6).
- **Migration version collision**: resolved by D1 (V121); any future work must not reuse V120/V121 names.
- **Frontend typecheck baseline**: `tsc --noEmit` is red pre-existing (workspace memory); the gate is `npm run build` (vite), not tsc.

## 13. Verification commands (canonical)

- Backend: `mvn clean compile` (cwd `D:\project\hang-hai-kchtgt`, timeout 300 s) — never start the server.
- Frontend: `npm run build` (cwd `D:\project\hang-hai-kchtgt\frontend`, timeout 180 s).
- Runtime done_oracle (QA wave, on a live instance): admin sees the "Ngày cập nhật" column on `/vts-system` and the VTS list JSON still carries `updatedDate`; a regular user (holding `vts:read`, no `admin:all`/`*`) sees no column and the VTS list JSON omits `updatedDate`; other screens' payloads are byte-identical.
