---
feature-id: M-1004
stage: review
agent: engineering-code-reviewer
verdict: Pass
last-updated: 2026-08-17
---

# Code Review Report — M-1004 Field-level Authorization PoC

**Verdict: Pass** (no blocking defect survives reproduction). Reviewed the implemented diff
(10 `fieldvisibility/` package files + `V121` migration + `WebConfig.java` + `PermissionMiddleware.java`
+ unit test + 2 frontend files) against the accepted design plan (WO-BE-1..10, WO-FE-1..2, WO-INT-1, §5
resolution algorithm, D1..D8), the threat model (F-01..F-11), the security review, and the QA oracle.

## 1. Scope inspected

- Backend: `com.hanghai.kchtg.fieldvisibility.**` (entity `FieldPolicy`, enums `FieldSubjectType`/`FieldTargetType`/`FieldEffect`,
  `FieldPolicyRepository`, `FieldVisibilityService`, `FieldVisibilityContext`, `FieldVisibilityInterceptor`,
  `FieldVisibilityJacksonConfig`, `FieldVisibilityController`), `V121__create_field_visibility_policy.sql`,
  modified `WebConfig.java` and `PermissionMiddleware.java`, test `FieldVisibilityServiceTest.java`.
- Frontend: `frontend/src/hooks/useFieldVisibility.ts`, modified `frontend/src/pages/vtssystem/VtsSystemList.tsx`.
- Cross-cutting greps: `@JsonFilter`/`@JsonView` tree-wide, `useFieldVisibility(` consumers, seeders
  (`PermissionSeeder`, `RolePermissionSeeder`), `SecurityConfig` permitAll list, data-scope references in the package.

## 2. Per-area verification

| # | Review area | Result | Evidence (file:line) |
|---|---|---|---|
| 1 | Resolution algorithm — specificity USER>GROUP>PERMISSION, FIELD>GROUP>ALL, then priority; default ALLOW; admin bypass; resource `*` | **CORRECT** | `FieldVisibilityService.java:51-52` admin bypass on `admin:all`/`*`; `:135` `subjectSpecificity` PERMISSION=0<GROUP=1<USER=2; `:147` `targetSpecificity` ALL=0<GROUP=1<FIELD=2 (decoupled from ordinal); `:156-161` lexicographic `beats` (higher wins, tie keeps existing); `:47` null user → `Map.of()`; `:116-124` `matchesResource` exact-or-`*`; `:58` loads active rules, in-memory resource filter (WO-BE-3). Reproduced: `mvn -Dtest=FieldVisibilityServiceTest test` → **12/12 pass** (default-ALLOW, exactly-`updatedDate`, admin bypass, priority, subject/target specificity, group status, wildcard resource/target, unauth). |
| 2 | Jackson strip — write-time ThreadLocal check, HIDE-only, READONLY passthrough, no serializer-construction-time cache, no per-DTO annotations | **CORRECT** | `FieldVisibilityJacksonConfig.java:30-31` `SimpleFilterProvider().setFailOnUnknownId(false).setDefaultFilter(...)`; `:32` installed via `postConfigurer` on the global mapper; `:43-50` `serializeAsField` consults `FieldVisibilityContext.isHidden(writer.getName())` **at write time** and returns without writing only when HIDE, else delegates `writer.serializeAsField`; filter class is stateless (no fields). READONLY passes (`isHidden` is HIDE-only, `FieldVisibilityContext.java:39-48`). Grep: only `@JsonFilter`/`@JsonView` match in the tree is a Javadoc comment (`FieldVisibilityJacksonConfig.java:15`) — zero annotations. |
| 3 | ThreadLocal lifecycle — set per request, cleared unconditionally in `afterCompletion` incl. unauth/exception | **CORRECT** | `FieldVisibilityInterceptor.java:52` `set(resolve(...))` in `preHandle`; `:48` `clear()` on unauthenticated/not-`User`; `:55` `clear()` in catch (fail-open, never throws); `:61-65` `afterCompletion(...)` → `clear()` with no condition (signature includes `Exception ex`). `FieldVisibilityContext.java:31-33` `get()` returns `Map.of()` when absent (no NPE); `:51-52` `clear()` uses `ThreadLocal.remove()`. |
| 4 | Migration V121 (not V120); seed target_type=0 FIELD for `updatedDate` HIDE; WHERE NOT EXISTS guard | **CORRECT** | `V121__create_field_visibility_policy.sql` (filename correct; `V120` already taken per D1). Table `:5-21`; indexes `:23-24`; seed `:28-30` `SELECT 0,'vts:read','vts',0,'updatedDate',0,10,TRUE WHERE NOT EXISTS (… resource='vts' AND target_key='updatedDate' AND deleted_at IS NULL)`. Ordinal comments match enums (subject 0=PERMISSION, target 0=FIELD, effect 0=HIDE). |
| 5 | PermissionMiddleware exemption — exact prefix, authN retained, no new permission | **CORRECT** | `PermissionMiddleware.java:63` `"/api/field-visibility"` appended to `PUBLIC_PATH_PREFIXES` (list at `:53`, `startsWith` skip at `:148`, gate call at `:131`). `SecurityConfig.java` permitAll list (grep `:77-103`) contains **no** `field-visibility` entry → `/api/**` `.authenticated()` retained. Grep `PermissionSeeder.java` / `RolePermissionSeeder.java`: zero `field`/`visibility`/`FieldPolicy` matches — no new permission seeded. |
| 6 | Conventions — `@FieldNameConstants`, ordinal enums, Lombok DTOs, no hardcoded field-name strings, English/Vietnamese | **CORRECT** | `FieldPolicy.java:25` `@FieldNameConstants`; `:17-19` Lombok `@Getter/@Setter/@NoArgsConstructor`; `:30/40/46` `@Enumerated(EnumType.ORDINAL)` on all three enum fields. Enums carry append-only Javadoc (`FieldSubjectType.java:6-7`, `FieldTargetType.java:6-7`, `FieldEffect.java:6-7`). No hardcoded field-name strings in Java logic (service operates generically on `rule.getTargetKey()`); `@SQLRestriction("deleted_at IS NULL")` at `FieldPolicy.java:28` is the established house pattern (identical redeclaration on `User.java:32`, `Buoy.java:23`, etc. — all extend `BaseEntity`; tolerated, verified). Identifiers English; the only user-facing string is the Vietnamese label "Ngày cập nhật" (`VtsSystemList.tsx`). |
| 7 | Frontend — fail-open hook, memoized `isHidden`, `dataIndex` updatedDate + `isHidden` in `useMemo` deps, no hardcoded hex/spacing | **CORRECT** | `useFieldVisibility.ts:23` `useQuery` keyed `['field-visibility', resource]`, `staleTime 5*60*1000`; fail-open `apiQuery.data ?? {}` (`:39`); `isHidden`/`isReadonly` memoized via `useCallback` (`:29-36`). `VtsSystemList.tsx:272` `useFieldVisibility('vts')`; column `{ key:'updatedDate', dataIndex:'updatedDate', … render: formatDate(val) }` with `.filter((c) => !(c.key==='updatedDate' && isHidden('updatedDate')))` and deps `[page, pageSize, isHidden]` (≈`:520-522`); `formatDate` pre-exists at `:39`. New column has no inline style — no hardcoded hex/spacing/font-size. |
| 8 | Scope discipline — single VTS screen, no admin policy UI, no record-level/org-unit data-scope, no seeder change, no git | **CORRECT** | `useFieldVisibility(` has exactly 2 occurrences tree-wide (hook definition + `VtsSystemList.tsx:272`). Only controller is GET `FieldVisibilityController` (no policy CRUD). Grep `fieldvisibility/` for `DataScope|orgUnitId|org_unit`: no matches (Javadoc "scope" words only). Seeders untouched (see area 5). Reviewer ran no `git` commands; only `mvn -Dtest=FieldVisibilityServiceTest test`. |

## 3. Findings

**Blocking defects: none.** Every load-bearing claim was checked at its definition site and the
resolution algorithm was independently reproduced by executing the unit suite.

**Non-blocking observations** (informational; none are correctness/security/contract violations in PoC scope):

| ID | Observation | Severity | Anchor |
|---|---|---|---|
| O-1 | `resolveResource` uses `startsWith` on `getRequestURI()`; assumes no servlet context path (consistent with the pre-existing `PermissionMiddleware.extractResource`, not a regression) | Informational | `FieldVisibilityInterceptor.java:68-78` |
| O-2 | `/api/field-visibility` exemption is prefix-based, so hypothetical `/api/field-visibility/<sub>` paths would also skip the gate; only one GET mapping exists today | Informational | `PermissionMiddleware.java:63`, `FieldVisibilityController.java:24` |
| O-3 | `findByActiveTrue()` has no `ORDER BY`; on an exact specificity+priority tie the "keep existing" winner is DB-iteration-order dependent. Design §5 calls exact ties a policy-authoring error; PoC seeds one rule → non-issue | Informational | `FieldVisibilityService.java:58`, `FieldPolicyRepository.java:17` |
| O-4 | `matchesResource` lowercases the input resource but not the DB `rule.resource`; a rule authored with an uppercase resource would never match. Seed is lowercase; conventions expect lowercase | Informational | `FieldVisibilityService.java:116-124` |
| O-5 | `FieldVisibilityContext.isHidden` hardcodes the `"*"` sentinel while the service uses the `WILDCARD` constant | Nit (style) | `FieldVisibilityContext.java:46` vs `FieldVisibilityService.java:32` |

The duplicate `@SQLRestriction` (`BaseEntity.java:33` + `FieldPolicy.java:28`) was investigated as a
potential startup failure and cleared: `User`, `Buoy`, `DataConnection`, `Port` all extend `BaseEntity`
**and** redeclare the identical restriction, and those are working production entities — the duplicate is
the house pattern, not a FieldPolicy-specific defect.

## 4. Verification executed this session

- `mvn clean compile` (cwd root) → **exit 0, BUILD SUCCESS** — 1096 main sources compile, including the new
  `com.hanghai.kchtg.fieldvisibility` package and the modified `WebConfig.java`/`PermissionMiddleware.java`.
- `mvn -Dtest=FieldVisibilityServiceTest test` (cwd root) → **exit 0, Tests run: 12, Failures: 0, Errors: 0, Skipped: 0**
  (independent reproduction of the resolution algorithm; pure JUnit + Mockito, no server started, no Spring context).
- `npm run build` (cwd `frontend/`) → **exit 0** — vite build succeeded (4034 modules, incl. `VtsSystemList` chunk);
  the only warning is the pre-existing >500 kB chunk-size advisory, unrelated to M-1004.
- Source-level: full reads of all 10 package files, the V121 migration, `WebConfig.java`, `PermissionMiddleware.java`,
  the unit test, and both frontend files; targeted greps for `@JsonFilter`/`@JsonView`, seeder contents,
  `SecurityConfig` permitAll list, `useFieldVisibility(` consumers, and data-scope references.
- No backend/frontend server started. Runtime done_oracle (AC-S3/S4/S5, F-01/F-04/F-05 runtime halves) remains
  **PENDING-HUMAN** by design (project rule: agents must not start the backend) — that is a release gate for QA,
  not a defect in this diff.

## 5. Spot-check statement

Carried-read spot-check: `VtsSystemListItemResponse.java:33` (`private LocalDateTime updatedDate;`) re-verified —
the serialized JSON property name matches the seeded `target_key='updatedDate'` (adaptation A2), so the strip fires
on the actual wire contract. `BaseEntity` re-read to resolve the `@SQLRestriction` question (cleared, see §3).
`formatDate` existence re-verified at `VtsSystemList.tsx:39`.

## 6. Verdict

**Pass** — the implemented diff is correct, complete, and in-scope with no blocking defects. All 8 review areas
verified with anchored evidence; the resolution algorithm reproduced green (12/12 tests). Non-blocking observations
O-1..O-5 are informational only and do not block.
