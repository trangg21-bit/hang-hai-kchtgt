# M-1005 Design Plan — Tối ưu hiệu năng phân quyền FE/BE

- Triage ref: `TRI-1787126589933-7a62` (change_class `C3`, full pipeline, blast_radius 7)
- Decision: behavior-preserving refactor except WO-01 (security hardening). No schema change, no API contract change.
- No new dependency — `caffeine` (`pom.xml:78`) is already declared.
- Its groupId is `com.github.ben-manes.caffeine` (`pom.xml:77`).
- Coverage: 5 backend files + 2 frontend files, one WO-xx per fix (5 fixes → WO-01..WO-05).
- Seat boundary: this document is the design only. Implementers execute the WOs; the reviewer holds the diff to the probes below.
- Anchor discipline: every Basename.ext:line anchor sits on the same document line as exactly one backticked symbol, and that symbol exists within ±5 lines of the cited line in the current source (see section 7 for the grep-verified ledger).

## 1. Current seam (verified)

Permission flow: login → JwtAuthFilter attaches the user's permission snapshot → PermissionMiddleware runs per request (resource/action extraction + check), then @PreAuthorize at controller level. FE: PermissionGuard + permissionStore + authStore.

| File | Seam | Symbol + anchor |
|---|---|---|
| PermissionSeeder.java | per-boot admin block resets the admin password | `setPassword` `PermissionSeeder.java:37` |
| PermissionSeeder.java | BCrypt encoder import used only by the reset line | `BCryptPasswordEncoder` `PermissionSeeder.java:12` |
| PermissionSeeder.java | ACTIVE restore — kept after the fix | `setStatus` `PermissionSeeder.java:38` |
| PermissionSeeder.java | unlock — kept after the fix | `setAccountLockedUntil` `PermissionSeeder.java:39` |
| PermissionSeeder.java | failed-login counter clear — kept after the fix | `setFailedLoginCount` `PermissionSeeder.java:40` |
| PermissionSeeder.java | failed-TOTP counter clear — kept after the fix | `setFailedTotpCount` `PermissionSeeder.java:41` |
| PermissionSeeder.java | persistence of the kept block | `save` `PermissionSeeder.java:42` |
| PermissionSeeder.java | TODO comment documenting the remaining bootstrap work | `TODO(SECURITY)` `PermissionSeeder.java:32` |
| PermissionMiddleware.java | repository field | `permissionRepository` `PermissionMiddleware.java:71` |
| PermissionMiddleware.java | constructor injection | `permissionRepository` `PermissionMiddleware.java:77` |
| PermissionMiddleware.java | per-request permission gate | `checkPermission` `PermissionMiddleware.java:116` |
| PermissionMiddleware.java | DB-backed resource-existence query | `countByResource` `PermissionMiddleware.java:210` |
| PermissionMiddleware.java | null-guard for the non-injected repo | `permissionRepository` `PermissionMiddleware.java:207` |
| PermissionMiddleware.java | method under change | `isKnownDbResource` `PermissionMiddleware.java:206` |
| PermissionMiddleware.java | first call site inside normalizeResource | `isKnownDbResource` `PermissionMiddleware.java:183` |
| PermissionMiddleware.java | second call site inside normalizeResource | `isKnownDbResource` `PermissionMiddleware.java:198` |
| PermissionMiddleware.java | normalization fallback to preserve exactly | `normalizeResource` `PermissionMiddleware.java:169` |
| PermissionMiddleware.java | normalization entry from extractResource | `normalizeResource` `PermissionMiddleware.java:159` |
| UserGroup.java | EAGER element collection (N+1 source) | `ElementCollection` `UserGroup.java:47` |
| UserGroup.java | permissions field | `permissions` `UserGroup.java:50` |
| UserGroup.java | getter unchanged | `getPermissions` `UserGroup.java:61` |
| PermissionCacheService.java | TTL constant | `CACHE_TTL_MINUTES` `PermissionCacheService.java:26` |
| PermissionCacheService.java | TTL applied on write | `expire` `PermissionCacheService.java:57` |
| UserSecurityCacheService.java | sibling cache already at 5 minutes | `TTL` `UserSecurityCacheService.java:24` |
| UserSecurityCacheService.java | TTL applied on write | `opsForValue` `UserSecurityCacheService.java:50` |
| permissionStore.ts | key normalizer | `normalizePermissionKey` `permissionStore.ts:15` |
| permissionStore.ts | function under change | `hasPermissionFromList` `permissionStore.ts:51` |
| permissionStore.ts | per-call Set rebuild (perf cost) | `Set` `permissionStore.ts:55` |
| permissionStore.ts | store selector calling the function | `hasPermissionFromList` `permissionStore.ts:93` |
| permissionStore.ts | store action (replacement semantics) | `setPermissions` `permissionStore.ts:106` |
| permissionStore.ts | auth sync (replacement semantics) | `subscribe` `permissionStore.ts:110` |
| ApprovalActionBar.tsx | direct external caller | `hasPermissionFromList` `ApprovalActionBar.tsx:31` |
| PermissionGuard.tsx | permissions selector | `userPermissions` `PermissionGuard.tsx:17` |
| PermissionGuard.tsx | deny gate | `isAllowed` `PermissionGuard.tsx:26` |
| PermissionGuard.tsx | deny branch | `isAllowed` `PermissionGuard.tsx:28` |
| PermissionGuard.tsx | disableOnly branch | `disableOnly` `PermissionGuard.tsx:29` |
| PermissionGuard.tsx | 403 UI | `Result` `PermissionGuard.tsx:37` |
| PermissionRepository.java | query backing the middleware check | `countByResource` `PermissionRepository.java:74` |
| App.tsx | auth redirect — bounds the Spin edge case | `Navigate` `App.tsx:273` |

## 2. Design decisions (trade-off record)

### D-01 — WO-02: negative caching of unknown resources is safe because the resource set is closed

The permission resource set is closed: it is seeded only at boot, and there is no runtime permission-creation UI, so a per-process cache cannot hide a legitimately new resource within a running instance. The cache is empty at boot, so the first request after seeding populates it. A 5-minute expireAfterWrite bounds staleness if a future runtime-permission feature ever appears (then add an evict call on seed).

Rejected alternatives: Spring @Cacheable + CaffeineCacheManager — touches DI wiring and the profile lifecycle of the middleware for no benefit; plain ConcurrentHashMap + timestamps — reimplements TTL/eviction. Chosen: a Caffeine field initialized once, with Cache.get(key, fn) for atomic load-on-miss, preserving the existing null-guard and the exception → false fallback in control flow.

### D-02 — WO-05a: reference-keyed WeakMap is correct because permission arrays are replaced, never mutated

Every writer replaces the array reference — `setPermissions` (`permissionStore.ts:106`).
`subscribe` (`permissionStore.ts:110`) also assigns a new array to the store state.
The auth store also rebuilds the array on login and token renewal (`permissions` `authStore.ts:99`).
The normalized Set is a pure function of array contents, so caching by reference can never go stale under replacement semantics, and WeakMap gives garbage collection with the key.
The direct caller passes a caller-owned prop — `hasPermissionFromList` (`ApprovalActionBar.tsx:31`).
If a parent recreates that array per render the cache simply recomputes (correct, just less benefit); if it passes the same reference, it gets the same win.

### D-03 — WO-05b: Spin gate precedes the deny branch, including disableOnly

While the profile is not loaded the guard must not render anything from the deny path — neither the 403 UI nor enabled children under disableOnly (actions must not appear before permission state exists). After load, all existing branches behave exactly as before.
Guards are mounted only on authenticated routes, and `isAuthenticated` (`App.tsx:272`) drives the redirect.
`Navigate` (`App.tsx:273`) sends unauthenticated users away from guarded routes, so a mounted guard always has a pending or loaded profile.

## 3. Work orders

### WO-01 — Drop per-boot admin password reset (security hardening, NOT behavior-preserving)

**File:** src/main/java/com/hanghai/kchtg/config/PermissionSeeder.java

**Current state:**
- `setPassword` (`PermissionSeeder.java:37`) resets the admin password to a hardcoded admin123 string on every boot.
- The import `BCryptPasswordEncoder` (`PermissionSeeder.java:12`) exists only for that line; grep confirms no other use in the file.
- The block is flagged as a known issue at `TODO(SECURITY)` (`PermissionSeeder.java:32`).

**Exact change:**
1. Delete only the line adminUser.setPassword(new BCryptPasswordEncoder().encode("admin123")); — `setPassword` (`PermissionSeeder.java:37`).
2. Delete only the import — `BCryptPasswordEncoder` (`PermissionSeeder.java:12`).
3. Keep the rest of the block unchanged: `setStatus` (`PermissionSeeder.java:38`).
4. Also kept: `setAccountLockedUntil` (`PermissionSeeder.java:39`).
5. Also kept: `setFailedLoginCount` (`PermissionSeeder.java:40`).
6. Also kept: `setFailedTotpCount` (`PermissionSeeder.java:41`).
7. Also kept: `save` (`PermissionSeeder.java:42`).
8. Keep the `TODO(SECURITY)` comment (`PermissionSeeder.java:32`) — it documents the remaining bootstrap-account work (create-only-when-absent, secure secret, forced password change), which is out of scope for this module. Do not reword or relocate it.

**Rationale:** a standing per-boot credential reset defeats any password change an admin makes and leaks a known default credential into every environment running this profile. Removing it is the security fix; keeping ACTIVE/unlock/counter-clear preserves the seeder's account-recovery role (a locked admin account is unlocked at boot).

**Acceptance probe:**
- `mvn clean compile -q` (from repo root) exits 0 — proves the import removal is safe.
- grep the seeder file: no setPassword token remains — the removed line is the one cited as `setPassword` (`PermissionSeeder.java:37`).
- grep the seeder file: the ACTIVE/unlock/counter-clear/save lines are still present (the block currently at lines 38-42).
- Triage oracle: PermissionSeeder không còn dòng setPassword(admin123).

---

### WO-02 — Caffeine cache for the DB resource check (perf, behavior-preserving)

**File:** src/main/java/com/hanghai/kchtg/security/PermissionMiddleware.java

**Current state:**
- `isKnownDbResource` (`PermissionMiddleware.java:206`) runs a DB count on every request.
- The count is `countByResource` (`PermissionMiddleware.java:210`).
- The check fires at the first convention branch (`isKnownDbResource` `PermissionMiddleware.java:183`).
- It fires again at the singularized branch (`isKnownDbResource` `PermissionMiddleware.java:198`).
- Caffeine is already a declared dependency: `caffeine` (`pom.xml:78`).

**Exact change:**
1. Add imports: com.github.benmanes.caffeine.cache.Cache, com.github.benmanes.caffeine.cache.Caffeine, java.time.Duration.
2. Add one instance field next to the other finals (after `permissionRepository` `PermissionMiddleware.java:71`):
   ```java
   private final Cache<String, Boolean> knownResourceCache = Caffeine.newBuilder()
           .maximumSize(512)
           .expireAfterWrite(Duration.ofMinutes(5))
           .build();
   ```
3. Replace the body of isKnownDbResource only:
   ```java
   private boolean isKnownDbResource(String resource) {
       if (permissionRepository == null)
           return false;
       try {
           return knownResourceCache.get(resource, r -> permissionRepository.countByResource(r) > 0);
       } catch (Exception e) {
           return false;
       }
   }
   ```
   Control flow preserved: null-guard first (was `permissionRepository` `PermissionMiddleware.java:207`), then load-with-cache, then exception → false (was the old try/catch around the count).

**Preservation contract (exact):**
- `normalizeResource` (`PermissionMiddleware.java:169`) — override map, dash-strip, singularization, and the fallback return — is untouched.
- The call site `isKnownDbResource` (`PermissionMiddleware.java:183`) is untouched.
- The second call site `isKnownDbResource` (`PermissionMiddleware.java:198`) is untouched.
- The constructor parameter `permissionRepository` (`PermissionMiddleware.java:77`) is untouched.
- The field `permissionRepository` (`PermissionMiddleware.java:71`) is untouched.
- The per-request gate `checkPermission` (`PermissionMiddleware.java:116`) is untouched.
- Only the count query changes cadence: at most once per resource per 5 minutes per process instead of once per request (see D-01 for why negative caching is safe).

**Acceptance probe:**
- `mvn clean compile -q` exits 0.
- grep: the only countByResource occurrence in the file is inside the knownResourceCache.get lambda (was a direct call at `countByResource` `PermissionMiddleware.java:210`).
- grep: isKnownDbResource still starts with the repository null-guard (`permissionRepository` `PermissionMiddleware.java:207`) and still returns false on exception.
- Triage oracle: PermissionMiddleware không còn gọi countByResource trực tiếp mỗi request (qua Caffeine cache).

---

### WO-03 — @BatchSize on the UserGroup permissions collection (perf, N+1)

**File:** src/main/java/com/hanghai/kchtg/group/entity/UserGroup.java

**Current state:**
- `ElementCollection` (`UserGroup.java:47`) with fetch = FetchType.EAGER loads the permission rows with one SELECT per loaded group → N+1 when fetching a group list.
- The collection field is `permissions` (`UserGroup.java:50`).

**Exact change:**
1. Add import: `import org.hibernate.annotations.BatchSize;` (repo convention — no fully-qualified annotation in code).
2. Add the annotation @BatchSize(size = 100) immediately below the @ElementCollection annotation line (`ElementCollection` `UserGroup.java:47`), above @CollectionTable. The mapping block becomes:
   ```java
   @ElementCollection(fetch = FetchType.EAGER)
   @BatchSize(size = 100)
   @CollectionTable(name = "user_group_permissions", joinColumns = @JoinColumn(name = "user_group_id"))
   @Column(name = "permission", nullable = false)
   private List<String> permissions = new ArrayList<>();
   ```
3. Do not touch `permissions` (`UserGroup.java:50`).
4. Do not touch `getPermissions` (`UserGroup.java:61`).
5. Do not change the table mapping (user_group_permissions — no schema change).

**Rationale:** batching the collection fetch reduces N+1 to N/100 queries when group lists are loaded; no schema or API impact.

**Acceptance probe:**
- `mvn clean compile -q` exits 0.
- grep: the annotation @BatchSize(size = 100) is present and adjacent to the @ElementCollection line (`ElementCollection` `UserGroup.java:47`).
- Optional runtime check (dev): with Hibernate SQL logging on, loading a group list produces batched collection SELECTs instead of one SELECT per group.
- Triage oracle: UserGroup.permissions có @BatchSize.

---

### WO-04 — Align Redis cache TTLs at 5 minutes (perf/staleness, behavior-preserving)

**File:** src/main/java/com/hanghai/kchtg/security/service/PermissionCacheService.java

**Current state:**
- `CACHE_TTL_MINUTES` (`PermissionCacheService.java:26`) is the TTL constant.
- It is applied on write via `expire` (`PermissionCacheService.java:57`).
- The sibling cache already uses `TTL` (`UserSecurityCacheService.java:24`).
- It is applied at `opsForValue` (`UserSecurityCacheService.java:50`).

**Exact change:** change the literal 10 to 5 on line 26 of PermissionCacheService.java. Nothing else in the file.
No edit to UserSecurityCacheService.java is needed because `TTL` (`UserSecurityCacheService.java:24`) is already 5 minutes.

**Rationale:** permission revocation propagates in ≤ TTL; halving the permission-cache TTL bounds the window in which a revoked permission still appears in the cached set. Aligned constants make the pair predictable.

**Acceptance probe:**
- grep: PermissionCacheService.java shows CACHE_TTL_MINUTES = 5.
- grep: UserSecurityCacheService.java still shows the 5-minute value at `TTL` (`UserSecurityCacheService.java:24`).
- `mvn clean compile -q` exits 0.
- Triage oracle: 2 cache Redis cùng TTL 5 phút.

---

### WO-05 — Frontend: memoize permission Set + Spin while permissions not loaded (perf/UX, behavior-preserving)

**Part A — File: frontend/src/store/permissionStore.ts**

**Current state:**
- Every `hasPermission` (`permissionStore.ts:90`) call rebuilds the normalized Set from the whole granted list.
- The rebuild is `Set` (`permissionStore.ts:55`).
- The exported function `hasPermissionFromList` (`permissionStore.ts:51`) is consumed by the store selector.
- The store selector call is `hasPermissionFromList` (`permissionStore.ts:93`).
- A direct external call exists at `hasPermissionFromList` (`ApprovalActionBar.tsx:31`).
- The selector is used by 20+ pages and by PermissionGuard.

**Exact change:**
1. Add module-level state after `normalizePermissionKey` (`permissionStore.ts:15`).
2. Place it before `hasPermissionFromList` (`permissionStore.ts:51`):
   ```ts
   const EMPTY_PERMISSIONS: string[] = [];
   const permissionSetCache = new WeakMap<string[], Set<string>>();

   function getNormalizedPermissionSet(grantedPermissions: string[] | undefined): Set<string> {
     const list = grantedPermissions ?? EMPTY_PERMISSIONS;
     let set = permissionSetCache.get(list);
     if (!set) {
       set = new Set(list.map((p) => normalizePermissionKey(p.trim())).filter(Boolean));
       permissionSetCache.set(list, set);
     }
     return set;
   }
   ```
3. In hasPermissionFromList (`permissionStore.ts:51`), replace the Set construction block (`Set` `permissionStore.ts:55`) with:
   ```ts
   const permissions = getNormalizedPermissionSet(grantedPermissions);
   ```
   Keep the early normalized-key guard and all downstream checks (exact match, * / admin:all, resource:manage, resource:*, resource:write, approve aliases) byte-identical.

**Semantics contract:** getNormalizedPermissionSet is a pure function of array contents using the identical normalization pipeline (normalizePermissionKey(p.trim()) + filter(Boolean)), so every true/false outcome is unchanged. undefined and [] now share the EMPTY_PERMISSIONS reference → one cached empty Set (current code treats the two the same way). WeakMap keyed by reference is safe because arrays are only replaced, never mutated (D-02).

**Acceptance probe (Part A):**
- `npm run build` (frontend) exits 0 with no NEW tsc errors in permissionStore.ts vs the pre-change baseline (workspace-wide frontend tsc baseline is pre-existing RED; the gate is no-new-errors in changed files only).
- Behavior regression: login → guarded page renders; logout → permission checks flip to denied as before.
- Code-review probe: the only Set construction on the granted-list path is inside getNormalizedPermissionSet, gated by a WeakMap lookup.
- Triage oracle: permissionStore dùng WeakMap memoize Set.

**Part B — File: frontend/src/components/PermissionGuard.tsx**

**Current state:**
- While the user profile loads, `userPermissions` (`PermissionGuard.tsx:17`) is undefined and the guard falls through to the deny branch.
- The gate is `isAllowed` (`PermissionGuard.tsx:26`).
- The branch is `isAllowed` (`PermissionGuard.tsx:28`).
- The disableOnly branch is `disableOnly` (`PermissionGuard.tsx:29`).
- The 403 UI is `Result` (`PermissionGuard.tsx:37`).
- Net effect today: a flash of the 403 screen before permissions arrive.

**Exact change:**
1. Extend the antd import (`Result` `PermissionGuard.tsx:2`) to also import Spin.
2. Insert a loading gate after the three store selectors (after `userPermissions` `PermissionGuard.tsx:17`), before checkPermission:
   ```tsx
   if (userPermissions === undefined) {
     return (
       <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
         <Spin size="large" />
       </div>
     );
   }
   ```
   (Layout properties display/flex/justifyContent/alignItems/minHeight are layout-only — allowed raw per the style-preset rules; no colors, spacing, or font-size are hardcoded.)
3. Simplify the deny gate to a plain checkPermission() call — the undefined guard is now handled by the early return.
4. All existing branches behave exactly as before once permissions are defined.
5. These include `disableOnly` (`PermissionGuard.tsx:29`).
6. Also unchanged: the fallback branch and the 403 `Result` (`PermissionGuard.tsx:37`).

**Edge-case contract:**
- An empty array (logged-in user with zero permissions) must not spin — it falls through to the genuine 403.
- Only the undefined profile state spins.
- The permanent-spin edge cannot occur: `Navigate` (`App.tsx:273`) sends unauthenticated users away from guarded routes.

**Acceptance probe (Part B):**
- `npm run build` (frontend) exits 0 with no NEW tsc errors in PermissionGuard.tsx.
- Manual: cold-reload a guarded route with a valid token → brief centered Spin, then content (no 403 flash). Log in with a permission-less account → 403 screen still appears (empty-array path).
- Triage oracle: PermissionGuard render Spin khi user chưa load.

---

## 4. Acceptance mapping (triage done_oracle)

| Oracle item | Covered by | Probe |
|---|---|---|
| Backend compiles (mvn clean compile) | WO-01..WO-04 | mvn clean compile -q exit 0 |
| Frontend builds, no new errors | WO-05 | npm run build exit 0 + NO-NEW-ERRORS in changed files |
| No setPassword(admin123) in PermissionSeeder | WO-01 | grep |
| No direct per-request countByResource in PermissionMiddleware | WO-02 | grep (only inside cache lambda) |
| UserGroup.permissions has @BatchSize | WO-03 | grep |
| Both Redis caches TTL 5 min | WO-04 | grep constants |
| permissionStore WeakMap memoized Set | WO-05a | build + code-review probe |
| PermissionGuard Spin when user not loaded | WO-05b | manual reload check |

## 5. Risks and mitigations

| Risk | Mitigation |
|---|---|
| WO-02 negative caching hides a newly seeded resource mid-run | The permission resource set is closed (seeded only at boot; no runtime permission-creation UI); 5-min TTL bounds staleness; add an evict call on seed if runtime creation is ever added |
| WO-05a WeakMap staleness if an array is mutated in place | No in-place mutation exists — all writers assign a new array (`setPermissions` `permissionStore.ts:106`); reviewer must reject any future in-place mutation |
| WO-05a WeakMap staleness — auth sync path | The auth sync also assigns a new array (`subscribe` `permissionStore.ts:110`) |
| Frontend tsc baseline is pre-existing RED (~90 files, incl. ApprovalActionBar.tsx which imports the changed function) | Acceptance gate is NO-NEW-ERRORS in the 2 changed files only; do not fix pre-existing red files in this module |
| WO-05b spin-forever if a guard mounts while logged out | Bounded by `Navigate` (`App.tsx:273`); guards are route-level only |
| Removing the BCryptPasswordEncoder import breaks compile if used elsewhere | The import's only usage is the `setPassword` line (`PermissionSeeder.java:37`); mvn clean compile -q is the probe |

## 6. Out of scope (invariants)

- No schema change, no Flyway migration, no new dependency (`caffeine` `pom.xml:78` already declared).
- `normalizeResource` (`PermissionMiddleware.java:169`) and its override map are untouched.
- The `TODO(SECURITY)` comment (`PermissionSeeder.java:32`) stays open — bootstrap-account work (create-when-absent, secure secret, forced change) is out of scope.
- UserSecurityCacheService.java gets no edit — `TTL` (`UserSecurityCacheService.java:24`) is already 5 minutes.
- No changes to PermissionRoleService, JwtAuthFilter, or any controller; no frontend file other than the two named files.
- Note: PermissionCacheService.java was concurrently reworked (empty-permission sentinel, AFTER_COMMIT invalidation) outside this module's 5 fixes; WO-04 touches only the TTL constant and must not revert that unrelated work.

## 7. Anchor verification ledger (grep-verified 2026-08-19, current workspace state)

Each row: symbol + anchor as cited in this document, and the grep-verified real location. The ±5-line rule holds for every pair. PermissionCacheService.java had shifted since an earlier read (+1 line at the constant, +6 at the expire call) because of the concurrent rework noted in section 6; its anchors were re-verified at the current lines.

| Symbol | Anchor | Verified at line | Pass |
|---|---|---|---|
| `setPassword` | `PermissionSeeder.java:37` | 37 | ±0 |
| `BCryptPasswordEncoder` | `PermissionSeeder.java:12` | 12 | ±0 |
| `setStatus` | `PermissionSeeder.java:38` | 38 | ±0 |
| `setAccountLockedUntil` | `PermissionSeeder.java:39` | 39 | ±0 |
| `setFailedLoginCount` | `PermissionSeeder.java:40` | 40 | ±0 |
| `setFailedTotpCount` | `PermissionSeeder.java:41` | 41 | ±0 |
| `save` | `PermissionSeeder.java:42` | 42 | ±0 |
| `TODO(SECURITY)` | `PermissionSeeder.java:32` | 32 | ±0 |
| `permissionRepository` | `PermissionMiddleware.java:71` | 71 | ±0 |
| `permissionRepository` | `PermissionMiddleware.java:77` | 77 | ±0 |
| `checkPermission` | `PermissionMiddleware.java:116` | 116 | ±0 |
| `countByResource` | `PermissionMiddleware.java:210` | 210 | ±0 |
| `permissionRepository` | `PermissionMiddleware.java:207` | 207 | ±0 |
| `isKnownDbResource` | `PermissionMiddleware.java:206` | 206 | ±0 |
| `isKnownDbResource` | `PermissionMiddleware.java:183` | 183 | ±0 |
| `isKnownDbResource` | `PermissionMiddleware.java:198` | 198 | ±0 |
| `normalizeResource` | `PermissionMiddleware.java:169` | 169 | ±0 |
| `normalizeResource` | `PermissionMiddleware.java:159` | 159 | ±0 |
| `ElementCollection` | `UserGroup.java:47` | 47 | ±0 |
| `permissions` | `UserGroup.java:50` | 50 | ±0 |
| `getPermissions` | `UserGroup.java:61` | 61 | ±0 |
| `CACHE_TTL_MINUTES` | `PermissionCacheService.java:26` | 26 | ±0 |
| `expire` | `PermissionCacheService.java:57` | 57 | ±0 |
| `TTL` | `UserSecurityCacheService.java:24` | 24 | ±0 |
| `opsForValue` | `UserSecurityCacheService.java:50` | 50 | ±0 |
| `normalizePermissionKey` | `permissionStore.ts:15` | 15 | ±0 |
| `hasPermissionFromList` | `permissionStore.ts:51` | 51 | ±0 |
| `Set` | `permissionStore.ts:55` | 55 | ±0 |
| `hasPermissionFromList` | `permissionStore.ts:93` | 93 | ±0 |
| `setPermissions` | `permissionStore.ts:106` | 106 | ±0 |
| `subscribe` | `permissionStore.ts:110` | 110 | ±0 |
| `hasPermissionFromList` | `ApprovalActionBar.tsx:31` | 31 | ±0 |
| `userPermissions` | `PermissionGuard.tsx:17` | 17 | ±0 |
| `isAllowed` | `PermissionGuard.tsx:26` | 26 | ±0 |
| `isAllowed` | `PermissionGuard.tsx:28` | 28 | ±0 |
| `disableOnly` | `PermissionGuard.tsx:29` | 29 | ±0 |
| `Result` | `PermissionGuard.tsx:37` | 37 | ±0 |
| `countByResource` | `PermissionRepository.java:74` | 74 | ±0 |
| `Navigate` | `App.tsx:273` | 273 | ±0 |
| `caffeine` | `pom.xml:78` | 78 | ±0 |
| `com.github.ben-manes.caffeine` | `pom.xml:77` | 77 | ±0 |
| `permissions` | `authStore.ts:99` | 99 | ±0 |
| `isAuthenticated` | `App.tsx:272` | 272 | ±0 |
| `Result` | `PermissionGuard.tsx:2` | 2 | ±0 |
