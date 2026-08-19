---
feature-id: M-1004
stage: qa
wave: 1
agent: engineering-qa-engineer
verdict: Pass
last-updated: 2026-08-17
---

# M-1004 — Wave-1 QA Report: Acceptance Oracle (Field-level Authorization PoC)

## 1. Orientation and scope

- **What this artifact is:** the wave-1 acceptance oracle for M-1004. It converts the triage `done_oracle` (TRI-1786938535184-0213) and the accepted design (00-design-plan.md) into checkable AC-* criteria that wave-2 QA will execute against the implementation and the reviewer will use. The implementation does NOT exist yet — this wave-1 artifact writes NO product code, runs NO builds.
- **Sources read this session:** `docs/modules/M-1004-field-level-authorization/design/00-design-plan.md` (273 lines, full), `docs/modules/M-1004-field-level-authorization/security/03-threat-model.md` (105 lines, full), `docs/intel/_intake/TRI-1786938535184-0213.json` (full).
- **Scope boundary (carried from brief, binding on wave-2):** single VTS demo screen (`/vts-system` list); no admin policy UI; no record-level / org-unit data-scope logic; no write (READONLY) rejection; no change to the other 21 screens.

### 1.1 Load-bearing adaptations (carried from the brief — do NOT re-derive)

| # | Adaptation | Anchor(s) |
|---|---|---|
| A1 | Flyway migration is **V121** (`V121__create_field_visibility_policy.sql`), because `V120__ensure_vts_system_enum_storage.sql` already exists — triage path `V120__create_field_visibility_policy.sql` would collide (design D1) | design §3 D1 |
| A2 | Demo field key is **`updatedDate`**, NOT `updatedAt`. A policy keyed `updatedAt` would never fire because the wire property is `updatedDate` | `VtsSystemListItemResponse.java:33` (`private LocalDateTime updatedDate;`), `VtsSystemRepository.java:81` (`t.updatedAt AS updatedDate`), `vtsSystem.ts:65` and `vtsSystem.ts:85` (`updatedDate?: string;`) |
| A3 | `PermissionMiddleware.java` is the PMO-authorized **12th edit-target file**; WO-BE-10 appends the exact prefix `/api/field-visibility` to `PUBLIC_PATH_PREFIXES` so the endpoint is not 403'd for non-admins (authN retained) | `PermissionMiddleware.java:53` (list), `PermissionMiddleware.java:130` (gate call), `PermissionMiddleware.java:147` (startsWith skip); design WO-BE-10 |
| A4 | V121 seed INSERT must use **`target_type = 0` (FIELD, enum ordinal 0)**, NOT 2 (= ALL). `2` would land under the special key `'*'` and hide every vts field (threat-model F-02, design line 95) | design §4 seed block; threat-model F-02 |

### 1.2 Oracle key calibration (CRITICAL for wave-2)

The triage `done_oracle` text says *"API GET VTS không còn trả trường **updatedAt**"*. That name is WRONG for the wire contract — the serialized JSON property is `updatedDate` (adaptation A2, verified at `VtsSystemListItemResponse.java:33` and `vtsSystem.ts:65`). **Every AC below keys on `updatedDate`.** Any wave-2 probe asserting on `updatedAt` can never pass and is a mis-execution, not a product failure.

### 1.3 Verification taxonomy (used by every AC)

| Kind | Who runs | Examples |
|---|---|---|
| **BUILD** (agent-executable) | wave-2 QA | `mvn clean compile` (root); `npm run build` (frontend/) |
| **UNIT TEST** (agent-executable) | wave-2 QA | focused `mvn test` on the new fieldvisibility test class (must not require a running server, design WO-BE-4) |
| **STATIC** (agent-executable) | wave-2 QA / reviewer | anchor-verified grep/read of the 12 edit-target files + V121 + test file |
| **RUNTIME done_oracle** (human-only) | human on a live instance | browser + network-payload checks; **agents MUST NOT start the backend** (project rule, design §13) |

**Pass rule for wave-2:** every AC marked BUILD/UNIT/STATIC must be executed with the stated command and the observed output recorded; every AC marked RUNTIME must be signed off by a human on a live instance with the stated observation. A RUNTIME-only AC that wave-2 cannot execute is reported as unverifiable, never silently marked satisfied.

## 2. Acceptance criteria

### AC-S1 — Backend compiles clean

- **Criterion (S1):** `mvn clean compile` exits 0 at the workspace root.
- **Oracle:** Maven `BUILD SUCCESS`; exit code 0; no compilation errors.
- **Pass:** exit 0. **Fail:** non-zero exit or any compile error.
- **Verification method (BUILD):** run `mvn clean compile` (cwd `D:\project\hang-hai-kchtgt`, timeout 300 s) — compile only, the server is never started.
- **Notes:** this gate also proves the new `fieldvisibility` package (entity/enums/repository/service/context/interceptor/config/controller) and the `WebConfig` interceptor registration compile against the existing codebase.

### AC-S2 — Frontend builds clean

- **Criterion (S2):** `npm run build` exits 0 in `frontend/`.
- **Oracle:** vite production build completes; exit code 0.
- **Pass:** exit 0. **Fail:** non-zero exit.
- **Verification method (BUILD):** run `npm run build` (cwd `D:\project\hang-hai-kchtgt\frontend`, timeout 180 s).
- **Notes:** the gate is the vite build, NOT `tsc --noEmit` — the frontend typecheck baseline is pre-existing red (~90 files; workspace memory) and the design explicitly names `npm run build` as the gate (design §12). A wave-2 report that substitutes `tsc` results for this AC is a mis-execution.

### AC-S3 — Admin sees the column and the wire field

- **Criterion (S3):** an admin (holds `admin:all` / `*`) sees the "Ngày cập nhật" column on the VTS list screen AND `GET /api/v1/vts-system` (and aliases `/api/v1/vts-systems`, `/api/v1/he-thong-vts` per `VtsSystemController.java` `@RequestMapping`) responses still contain `updatedDate`.
- **Oracle (human):** on a live instance, sign in as admin → `/vts-system` renders the "Ngày cập nhật" column; the network payload of the VTS list request still carries `updatedDate` with a value. Column label exactly "Ngày cập nhật" (Vietnamese with diacritics, WO-FE-2).
- **Pass:** column visible AND payload contains `updatedDate`. **Fail:** either missing.
- **Verification method:**
  - RUNTIME done_oracle (human): the observation above. Agents never start the backend.
  - Supporting STATIC (agent): the column is defined at the `columns` `useMemo` (`VtsSystemList.tsx:497`) with `key: 'updatedDate'`, `dataIndex: 'updatedDate'`, render `formatDate` (`VtsSystemList.tsx:38`), and is filtered ONLY by `.filter((c) => !(c.key === 'updatedDate' && isHidden('updatedDate')))` — for admin, `isHidden('updatedDate')` must be false.
  - Supporting UNIT (agent): WO-BE-4 unit test #3 — user holding `admin:all` resolves to an empty map (admin bypass, design §5), i.e. the strip is a no-op for admin.
- **Evidence anchors:** `VtsSystemList.tsx:497`, `VtsSystemList.tsx:38`, `VtsSystemListItemResponse.java:33`, `User.java:129` (lowercased permission codes), design §5 admin bypass.

### AC-S4 — Regular user sees neither the column nor the JSON field

- **Criterion (S4):** a regular user (holds `vts:read`, does NOT hold `admin:all` / `*`) sees NEITHER the "Ngày cập nhật" column NOR the `updatedDate` JSON field. **The backend strip must be proven on the wire payload — UI hiding alone is not sufficient** (design §1: "Jackson strip is authoritative").
- **Oracle (human):** on a live instance, sign in as a user holding only `vts:read` → the VTS list shows no "Ngày cập nhật" column; the raw JSON of the VTS list request contains NO `updatedDate` property (network tab / curl of the same endpoint with the user's token). The absence must be verified in the payload, not by looking at the rendered table.
- **Pass:** both observations hold. **Fail:** column visible OR `updatedDate` present in the payload for this user.
- **Verification method:**
  - RUNTIME done_oracle (human): observation above, with the wire-payload check mandatory.
  - Supporting UNIT (agent): WO-BE-4 unit test #2 — a `vts:read` holder with the seed-style rule resolves to `{updatedDate: HIDE}` and NO other field (design §5 / WO-BE-4).
  - Supporting STATIC (agent): Jackson filter overrides `serializeAsField` and returns WITHOUT writing when `FieldVisibilityContext.get() != null && context.isHidden(writer.getName())` — the check is at write time (design WO-BE-8); the FE hook `useFieldVisibility('vts')` (WO-FE-1) is fail-open (design D7) so it can never be the enforcement point.
- **Evidence anchors:** `VtsSystemList.tsx:497`, `vtsSystem.ts:65`, design §5/§6, WO-BE-8, D7.

### AC-S5 — Visibility map endpoint returns the correct per-user map

- **Criterion (S5):** `GET /api/field-visibility?resource=vts` returns the correct per-user visibility map, wrapped in the standard envelope `ApiResponse` (`ApiResponse.java:19`).
- **Expected data:**
  - Admin: `data` = `{}` (empty — all fields ALLOW; missing key == ALLOW, design §6).
  - Regular `vts:read` user: `data` = `{ "updatedDate": "HIDE" }` (only non-ALLOW fields; values are enum names `HIDE`/`READONLY`).
- **Pass:** the observed `data` matches the expectation for the signed-in user. **Fail:** any mismatch (e.g. `updatedDate` absent for the regular user, or present for admin).
- **Verification method:**
  - RUNTIME done_oracle (human): two sign-ins (admin, regular) on a live instance, calling the endpoint with each user's token; record both `data` bodies.
  - Supporting STATIC (agent): controller is `@RestController @RequestMapping("/api/field-visibility")` returning `ApiResponse.success(service.getVisibilityMap(user, resource))` (WO-BE-9); service `getVisibilityMap` returns only HIDE/READONLY entries with `effect.name()` (WO-BE-4).
- **Evidence anchors:** `ApiResponse.java:19`, design §6, WO-BE-4/WO-BE-9.

### AC-F01 — Endpoint is not 403 for non-admins; authN retained

- **Criterion (F-01):** `GET /api/field-visibility?resource=vts` must NOT be 403'd by `PermissionMiddleware` for a non-admin; authentication is retained (401 still applies to anonymous). No new permission is seeded.
- **Oracle:** regular `vts:read` user → HTTP 200 with the envelope. Anonymous → 401 (not 200, not 403-by-permission).
- **Pass:** 200 for the authenticated non-admin; 401 for anonymous. **Fail:** 403 for the authenticated non-admin; 200 for anonymous.
- **Verification method:**
  - STATIC (agent): grep the public-path list at `PermissionMiddleware.java:53` — it must contain the exact prefix `/api/field-visibility`; the startsWith skip at `PermissionMiddleware.java:147` therefore bypasses the `checkPermission` gate call at `PermissionMiddleware.java:130` for this path only. Grep that `PermissionSeeder` / `RolePermissionSeeder` / `SecurityConfig` are NOT modified by the diff (no `fieldvisibility` permission code anywhere). Grep that no broad prefix (e.g. `/api/`) was added — only the exact endpoint prefix.
  - RUNTIME done_oracle (human): the two HTTP observations above on a live instance.
- **Evidence anchors:** `PermissionMiddleware.java:53`, `PermissionMiddleware.java:130`, `PermissionMiddleware.java:147`, `SecurityConfig.java:104` (`/api/**` authenticated — unchanged), threat-model F-01, design WO-BE-10.

### AC-F02 — Seed hides exactly `updatedDate` and no other vts field

- **Criterion (F-02):** the V121 seed creates exactly ONE demo policy: `subject_type=PERMISSION(0)`, `subject_id='vts:read'`, `resource='vts'`, `target_type=FIELD(0)`, `target_key='updatedDate'`, `effect=HIDE(0)`, `priority=10`, `active=TRUE`, guarded by `WHERE NOT EXISTS`. No other vts field may be hidden.
- **Oracle (static):** V121 file contains exactly one seed `INSERT` row with the values above; `target_type` value is `0` (FIELD ordinal), never `2`.
- **Pass:** all static checks hold and the unit test below is green. **Fail:** any deviation (e.g. `target_type=2`, `target_key='updatedAt'`, extra rows, unguarded insert).
- **Verification method:**
  - STATIC (agent): grep/read `src/main/resources/db/migration/V121__create_field_visibility_policy.sql` — assert the seed row values exactly as above; assert `WHERE NOT EXISTS (SELECT 1 FROM field_policy WHERE resource = 'vts' AND target_key = 'updatedDate' AND deleted_at IS NULL)`; assert no `'*'` wildcard appears in `resource` or `target_key` columns of V121 (design §9 F-05 check); assert enum declaration order `FieldTargetType { FIELD, GROUP, ALL }` (WO-BE-2) matches the DDL ordinal comment (`0=FIELD 1=GROUP 2=ALL`) so ordinal 0 is FIELD (design D8, threat-model F-07).
  - UNIT (agent): WO-BE-4 unit test #2 — exactly `updatedDate` hidden, no other vts field, for a `vts:read` holder (see AC-WO4).
- **Evidence anchors:** design §4 seed block (line 95), design D6/D8, threat-model F-02/F-07.

### AC-F04 — ThreadLocal cleared unconditionally in `afterCompletion`

- **Criterion (F-04):** the interceptor clears the `FieldVisibilityContext` ThreadLocal unconditionally in `afterCompletion` — including unauthenticated requests and exception paths. No cross-request contamination may occur. Async/streaming writer threads are never populated with a context.
- **Oracle (static):** `FieldVisibilityInterceptor` (WO-BE-6):
  - `preHandle`: if the `SecurityContextHolder` principal is not an authenticated `User` → `FieldVisibilityContext.clear()` and return `true`; otherwise resolve the resource via the private path→resource map (`/api/v1/vts-system`, `/api/v1/vts-systems`, `/api/v1/he-thong-vts` → `vts`; else `null`) and `FieldVisibilityContext.set(...)`; always returns `true` (never `false`, never throws).
  - `afterCompletion`: calls `FieldVisibilityContext.clear()` with no condition.
  - Because `preHandle` always returns `true`, Spring invokes `afterCompletion` on every request that reached the interceptor — the clear is therefore effective on exception paths too. Filter-level short-circuits (`JwtAuthFilter` 401/403) never reach the interceptor, so nothing is set there to leak (threat-model F-04).
- **Oracle (runtime leak probe, human):** after a regular-user request to the VTS list (strip active), the user's NEXT request to a resource with no policy (e.g. another list screen) returns the full JSON (no `updatedDate`-style stripping there). Two consecutive requests must not contaminate each other.
- **Pass:** static checks hold AND the leak probe shows no cross-request contamination. **Fail:** any conditional/absent clear, or a leak observed.
- **Verification method:** STATIC (agent) read of `FieldVisibilityInterceptor` (WO-BE-6) + `FieldVisibilityContext` (WO-BE-5: `get()` returns empty map when unset — never NPE in the serializer path) + RUNTIME done_oracle (human leak probe).
- **Evidence anchors:** design WO-BE-5/WO-BE-6, threat-model F-04, `AsyncConfig.java:22` (async boundary, out of PoC scope).

### AC-F05 — Default ALLOW: a resource with no policy returns untouched JSON

- **Criterion (F-05):** any resource without a matching policy rule resolves to an empty map (default ALLOW) — the Jackson strip is a no-op and the JSON is byte-identical to the pre-PoC output. The PoC seeds no `'*'` wildcard rules.
- **Oracle:** for any non-VTS `/api/**` path (path→resource map returns `null`, design D5), `resolve()` returns `{}`; the serializer writes every field.
- **Pass:** unit test #1 green (no rules → empty map) and the no-policy runtime sample is byte-identical. **Fail:** any stripping observed on a no-policy resource.
- **Verification method:**
  - UNIT (agent): WO-BE-4 unit test #1 — no rules → empty map; `isHidden()` false for every field (see AC-WO4).
  - STATIC (agent): D5 map has no entry for non-VTS paths → interceptor sets an empty map; Jackson filter's `FieldVisibilityContext.get() != null` guard makes the filter a no-op when the ThreadLocal is empty (WO-BE-8, D4).
  - RUNTIME done_oracle (human): on a live instance, sample at least one non-VTS list screen — its JSON is unchanged from before the PoC (spot-check of a few payloads, "byte-identical" as in design §13).
- **Evidence anchors:** design §5 (default ALLOW), D4/D5/D7, WO-BE-8, threat-model F-05.

### AC-WO4 — Field-visibility unit-test suite (WO-BE-4 assertions)

- **Criterion:** a unit-test class exists under `src/test/java/com/hanghai/kchtg/fieldvisibility/` (the documented 4th addition: 3 enums + 1 test file) that asserts, WITHOUT requiring a running server:
  1. No rules → empty map (default ALLOW).
  2. Seed-style rule (`vts:read` holder, `target_type=FIELD`, `target_key='updatedDate'`) → exactly `updatedDate` hidden and NO other vts field.
  3. User holding `admin:all` → empty map (admin bypass).
  4. Higher priority wins within the same specificity.
  5. USER-subject beats PERMISSION-subject regardless of priority.
  6. (F-10) A GROUP subject with `status == null` matches the ACTIVE-or-null predicate — mirrors `User.java:143`; a null-status group's rule must NOT silently fail open.
- **Oracle:** focused `mvn test` run of the new class exits 0 with all assertions passing; the test file contains one test per numbered assertion (or equivalent discriminating coverage — at minimum the six behaviors above, never a test that stays green after the behavior is removed).
- **Pass:** focused test run green. **Fail:** any assertion missing, weakened, or red.
- **Verification method (UNIT, agent):** run the focused class, e.g. `mvn -Dtest=<NewFieldVisibilityTestClass> test` (cwd `D:\project\hang-hai-kchtgt`), and record the exact class name, the command, the exit code, and the test counts. Tests must not start the server (WO-BE-4 constraint); `@SpringBootTest(webEnvironment = NONE)` or plain unit instantiation is acceptable.
- **Evidence anchors:** design WO-BE-4 (line 203 — grep-verified unit-test assertion list), threat-model F-02, threat-model F-10, `User.java:143`.

### AC-SCOPE — Change-set boundary guardrail (WO-INT-1 checklist)

- **Criterion:** the implementation changes EXACTLY the 12 edit-target files (11 triage + `PermissionMiddleware.java` per A3) plus the 4 documented additions (3 enum files + 1 unit-test file). No `RolePermissionSeeder` / `PermissionSeeder` / `SecurityConfig` change; no admin policy UI; no record-level / org-unit data-scope logic; `field_policy` created only via V121.
- **Oracle (static):** the diff/grep inventory shows: exactly one new migration `V121__create_field_visibility_policy.sql` and no edits to any existing migration; no `fieldvisibility`/`field-visibility` mention inside `RolePermissionSeeder.java` / `PermissionSeeder.java`; no `SecurityConfig` diff; no `@PreAuthorize` additions; no new FE route/page (the demo lives inside the existing `VtsSystemList.tsx` list screen); no policy-mutation endpoint.
- **Pass:** inventory matches the boundary. **Fail:** any file outside the list is modified, or any forbidden file is touched.
- **Verification method (STATIC, agent):** grep inventory + diff review per WO-INT-1; agents may run read-only diff/grep — never `git` write operations. Backend is never started.
- **Evidence anchors:** design §10 edit-target list (line 175: PermissionMiddleware.java 12th target), WO-INT-1 checklist (line 254), threat-model DC-1.

## 3. Coverage map

| AC | Success criterion / finding / WO | Verification kinds | Owner of the final sign-off |
|---|---|---|---|
| AC-S1 | S1 (backend build) | BUILD | wave-2 QA (agent) |
| AC-S2 | S2 (frontend build) | BUILD | wave-2 QA (agent) |
| AC-S3 | S3 (admin sees column + wire field) | RUNTIME + STATIC + UNIT | human (live instance) + wave-2 QA |
| AC-S4 | S4 (regular user: neither column nor field — strip proven) | RUNTIME + UNIT + STATIC | human (live instance) + wave-2 QA |
| AC-S5 | S5 (visibility map per user) | RUNTIME + STATIC | human (live instance) + wave-2 QA |
| AC-F01 | F-01 (endpoint not 403 for non-admin; authN retained) | STATIC + RUNTIME | wave-2 QA + human |
| AC-F02 | F-02 (seed hides exactly `updatedDate`) | STATIC + UNIT | wave-2 QA (agent) |
| AC-F04 | F-04 (ThreadLocal cleared unconditionally) | STATIC + RUNTIME | wave-2 QA + human |
| AC-F05 | F-05 (default ALLOW, no-policy untouched) | UNIT + STATIC + RUNTIME | wave-2 QA + human |
| AC-WO4 | WO-BE-4 unit suite (5 assertions + F-10 null-status group) | UNIT | wave-2 QA (agent) |
| AC-SCOPE | WO-INT-1 change-set boundary | STATIC | reviewer + wave-2 QA |

## 4. Accepted PoC limitations (documented, NOT gated by wave-1)

These threat-model findings are ADDRESSED as documented out-of-scope boundaries in design §9; wave-2 QA must NOT fail the run on them, but the report must confirm they remain un-implemented as documented:

- **F-03** — standalone mappers (`ChartIntegrationService.java:34`), StreamingResponseBody (`LogExportController.java:56`), byte exports (`ReportController.java:146`) are NOT stripped. Acceptable while no policy-bearing resource has export/stream endpoints.
- **F-07** — enum ordinals evolve append-only (enforced inside AC-F02 static check).
- **F-08** — per-request DB read accepted for the PoC; caching deferred.
- **F-11** — DDL audit columns exist; no policy-mutation endpoints in the PoC (enforced inside AC-SCOPE).
- **F-06** — principal-derived subjects only; `resource` length cap optional (Low).

## 5. What wave-1 did NOT verify

- No product code was written or executed; no builds were run this wave (the implementation does not exist yet).
- The RUNTIME done_oracle observations (AC-S3/S4/S5/F01/F04/F05) are assigned to a human on a live instance; agents must not start the backend (design §13). Until a human signs them off, those ACs are pending, and the module cannot be Passed on runtime evidence alone.
- Frontend `tsc --noEmit` remains red pre-existing and is NOT a gate (AC-S2 note).

## 6. Spot-check statement

This wave-1 artifact was re-read after writing: the AC set covers all 5 success criteria (S1–S5), F-01/F-02/F-04/F-05, and the WO-BE-4 exactly-`updatedDate` unit assertion; each AC states its verification method and kind; the four load-bearing adaptations (V121, `updatedDate`, PermissionMiddleware 12th file, seed ordinal 0) are reflected as §1.1 and used throughout; every existing-behavior claim carries a backtick-quoted `Basename.ext:line` anchor from this session's reads.
