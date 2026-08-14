# Dev record — F-001 search-split: backend `fullName` filter (wave 1)

## Task

Split the F-001 user-list search into two independent filters per `docs/modules/M-001-quan-tri-he-thong/ba/00-lean-spec.md` (BR-001-07..11, AC-001-15..19, section 5 API contract):

- `search` = email OR username (LIKE contains, case-insensitive) — `fullName` REMOVED from this clause (BR-001-07).
- `fullName` = họ tên, accent-insensitive via the existing `toSearchLike` (NFD strip + đ→d, `"van a"` matches `"Nguyễn Văn An"`) (BR-001-08).
- Both AND-combine with `status` and `orgUnit` (BR-001-09); `statusCounts` computed on the SAME combined filter set as the table (BR-001-10).

## Files changed (write boundary: `src/main/java/com/hanghai/kchtg/user/**` only)

1. **`src/main/java/com/hanghai/kchtg/user/controller/UserController.java`** — `list(...)` gains `@RequestParam(required = false) String fullName` (after `search`, before `status`); calls `userService.findAllWithCounts(search, fullName, status, orgUnitId, pageable)`.
2. **`src/main/java/com/hanghai/kchtg/user/service/UserService.java`**:
   - New 5-arg `findAllWithCounts(String search, String fullName, UserStatus status, UUID orgUnitId, Pageable pageable)`; existing 3-arg / 4-arg overloads kept, delegating with `fullName = null`.
   - Body normalizes `searchLike = toSearchLike(search)` and `fullNameLike = toSearchLike(fullName)`; passes both into `searchUserList` / `searchUserListByOrgUnits` and into `getStatusCounts(search, fullName, organizationFilter)`.
   - Private `getStatusCounts(String search, String fullName, List<UUID> organizationFilter)` normalizes both and calls `countUsersByStatus` / `countUsersByStatusAndOrgUnits`; public `getStatusCounts(String)` / `(String, UUID)` overloads delegate with `fullName = null`.
   - Legacy `findAll(String search, UserStatus status, Pageable pageable)` updated for the new `searchUsers` signature, passing `null` for `fullName`.
3. **`src/main/java/com/hanghai/kchtg/user/repository/UserRepository.java`** — all 5 queries (`countUsersByStatus`, `countUsersByStatusAndOrgUnits`, `searchUsers`, `searchUserList`, `searchUserListByOrgUnits`):
   - `:search` clause now matches `email OR username` ONLY (fullName clause removed from it).
   - New `:fullName` clause matches `fullName` ONLY, same pattern: `CAST(function('immutable_unaccent', LOWER(u.fullName)) AS string) LIKE CAST(:fullName AS string)`.
   - Both clauses ANDed with the existing `deletedAt`/`status`/`orgUnitIds` conditions.

## Acceptance criteria mapping

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | `UserController.list` accepts `@RequestParam(required=false) String fullName` and passes it to the service | Done | Controller `list` signature + `findAllWithCounts(search, fullName, status, orgUnitId, pageable)` call |
| 2 | `findAllWithCounts` + `getStatusCounts` thread `fullName` to repository, normalized via `toSearchLike` | Done | `UserService.java:215-223, 228, 276-279` (`fullNameLike`, both repository call sites, combined-filter counts) |
| 3 | All 5 queries: `:search` = email OR username only; `:fullName` = fullName only | Done | Post-edit grep: zero `LOWER(u.fullName) ... LIKE CAST(:search` occurrences; `LIKE CAST(:fullName` at `UserRepository.java:137,149,162,178,194` |
| 4 | `mvn clean compile` succeeds | Done | BUILD SUCCESS, exit code 0 (see verification) |
| 5 | No frontend / unrelated files modified | Done | Only 3 backend files + this artifact written this session |

## Verification (executed, not inferred)

- `mvn clean compile` (repo root): **BUILD SUCCESS** — `[INFO] Compiling 1098 source files ... [INFO] Total time: 25.386 s`, `Command exited with code 0`. This is the verification of record per the work order.
- `npm run build` (frontend/, cross-check per brief; this seat made zero frontend changes): `✓ built in 1.07s`, exit code 0; >500 kB chunk warning non-blocking (pre-existing, same as frontend seat's report).
- Post-edit grep spot-check: `LOWER(u.fullName)` appears only against `:fullName`; `fullNameLike` threaded through both list and count paths.
- Note: JDT/LSP editor diagnostics reported stale errors (JDT failed to init `ct.sym` in the managed JRE — environment failure, not code); invalidated by the real `mvn clean compile` pass.

## Risks / notes

- Legacy public overloads kept for compatibility (`findAllWithCounts(search, status, pageable)`, `findAllWithCounts(search, status, orgUnitId, pageable)`, `getStatusCounts(search)`, `getStatusCounts(search, orgUnitId)`) — grep found no external callers; their semantics unchanged except the mandated BR-001-07 narrowing (`:search` no longer matches fullName anywhere).
- `searchUsers` sole caller is the legacy `findAll` (UserService.java:173) — updated in place. No test references to any of the 5 repository methods (src/test grep: none).
- No entity/schema/Enum changes, no migration, no permission changes; `RolePermissionSeeder` untouched; no server started; no git operations.
