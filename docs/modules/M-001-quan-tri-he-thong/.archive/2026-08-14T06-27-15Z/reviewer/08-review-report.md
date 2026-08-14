# Code Review Report — F-001 Form Reshape (TRI-1786681457834-5887)

- **Reviewer:** Engineering Code Reviewer (review seat, SDLC pipeline)
- **Date:** 2026-08-14 (updated — F1/F2 resolved; verdict revised to Pass)
- **Change under review:** F-001 scope expansion — 4 profile columns (`address`/`department`/`position`/`note`), create-status-from-form, 11-field form order, search-split preservation.
- **Contract:** `docs/modules/M-001-quan-tri-he-thong/ba/00-lean-spec.md` (BR-001-19..22, AC-001-12/15/16/17/18/20), `docs/modules/M-001-quan-tri-he-thong/design/00-design-plan.md` (WO-01/WO-02).
- **Scope inspected:** the 10 F-001 files — migration `V20260814120000__add_user_profile_columns.sql`, `User.java`, `CreateUserRequest.java`, `UpdateUserRequest.java`, `UserResponse.java`, `UserDetailResponse.java`, `UserService.java`, `UsersPage.tsx`, `services/userService.ts`, `types/user.ts` — plus the two test files extended to close F1/F2. No code modified by the reviewer.
- **Verdict:** **Pass** — all 4 review points pass on the code, and the two previously missing/weak test deliverables (F1 WO-01 task 5 test cases, F2 controller-test dead stub) are now implemented and reproduced green.

---

## 1. Review point 1 — create() status-from-form; hardcoded ACTIVE fully removed — PASS

| Check | Evidence |
|---|---|
| Backend create persists request status | `UserService.java:431` — `user.setStatus(request.getStatus())` replaces `user.setStatus(UserStatus.ACTIVE)` (confirmed in `git diff`: `- user.setStatus(UserStatus.ACTIVE); + user.setStatus(request.getStatus());`). Grep of `UserService.java` for `UserStatus.ACTIVE` → 0 hits. |
| DTO requires status | `CreateUserRequest.java:43-44` — `@NotNull(message = "Vui lòng chọn trạng thái") private UserStatus status;` (AC-001-16, BR-001-19). |
| Frontend create no longer hardcodes ACTIVE | `userService.ts:101` — `status: payload.status?.toUpperCase(),`; diff confirms `- status: 'ACTIVE',` removed (was :98). No `status: 'ACTIVE'` literal in the create path. |
| Null-status cannot reach persistence | Sole consumer of `CreateUserRequest` is `UserController.create` (`UserController.java:134-135`, `@Valid @RequestBody` → 400 before write). Grep `new CreateUserRequest(` in `src/main/java` → 0 hits; no other `userService.create(request)` callers. |
| Frontend required rule + default | `UsersPage.tsx:460-465` — status Select `rules=[{ required: true, message: 'Vui lòng chọn trạng thái' }]`; `initialValues={{ status: 'active' }}` on the Form (:436); options `active`/`inactive` Hoạt động/Không hoạt động (:466-469) — design D6. |

Observation (non-blocking, unchanged): `userService.ts:18` `String(item.status || 'ACTIVE')` in `mapUser()` still contains the literal `'ACTIVE'` — a **read-side** fallback, pre-existing (not in this change's diff hunks), not the create path. QA oracle TC-AC-001-12 greps both files for the literal and will hit this line; scope the grep to the create path or have PO adjudicate the fallback.

## 2. Review point 2 — 4 columns nullable + trimmed + DTO/response mapping — PASS

| Check | Evidence |
|---|---|
| Migration nullable, exact SQL | `V20260814120000__add_user_profile_columns.sql` — 4× `ALTER TABLE app_users ADD COLUMN ... VARCHAR(255|100|100|500) NULL;` — byte-equal to design §4; version sorts after max existing `V20260813110000`. |
| Entity nullable, no @NotNull | `User.java:77-104` — `@Size(max=255|100|100|500, message="...")` + `@Column(length=...)`; no `nullable = false`, no `@NotNull`; Lombok class-level `@Getter @Setter` (no hand-written accessors). |
| Blank → NULL on create | `UserService.java:432-435` — `user.setAddress/Department/Position/Note(trimToNull(...))` after `setPhone`. |
| Blank → NULL on update (null-means-skip preserved) | `UserService.java:497-500` — 4 guarded `if (request.getX() != null) user.setX(trimToNull(...))`. |
| Helper | `UserService.java:885-891` — `private static String trimToNull` (null-safe: null → null, blank-after-trim → null). |
| Response DTOs carry fields + NON_NULL | `UserResponse.java:29-32` (fields) + positional ctor call `from()` (:77-80) — `user.getAddress(), getDepartment(), getPosition(), getNote()` inserted after `getPhone()`; ctor param order (:13-17) matches field order exactly. `UserDetailResponse.java:21-24` + setter lines in `from()` (:48-51). Both classes `@JsonInclude(NON_NULL)` (`UserResponse.java:13`, `UserDetailResponse.java:10`). |
| Frontend round-trip | create/update payloads `values.address?.trim() || undefined` etc. (`UsersPage.tsx:127-130, 143-146`); `mapUser` `?? undefined` (`userService.ts:31-34`); detail rows `detailUser.address || '—'` etc. (`UsersPage.tsx:635-638`). |
| Column lengths match spec | lean-spec §7.1 (:215-218) — address 255 / department 100 / position 100 / note 500, all NULL. |

## 3. Review point 3 — form field order matches the oracle — PASS

Observed DOM order in the create drawer (`UsersPage.tsx:441-475`) vs AC-001-15 oracle (1 username … 11 note):

| # | Field | Anchor |
|---|---|---|
| 1 | username | `UsersPage.tsx:441` |
| 2 | password | `UsersPage.tsx:442` |
| 3 | orgUnitId | `UsersPage.tsx:444` (moved above email) |
| 4 | email | `UsersPage.tsx:451` |
| 5 | fullName | `UsersPage.tsx:452` |
| 6 | phone | `UsersPage.tsx:453` |
| 7 | address | `UsersPage.tsx:454` |
| 8 | department | `UsersPage.tsx:456` (paired `Col` with position — the only allowed pairing, design §6.3) |
| 9 | position | `UsersPage.tsx:457` |
| 10 | status | `UsersPage.tsx:460-472` — rendered for **both** create and edit (outside the `{!editingUser && ...}` guard at :441-442); required rule; options active/inactive |
| 11 | note | `UsersPage.tsx:474-475` — `Input.TextArea` |

Additional AC coverage: department/position required **create-only** (`rules={[{ required: !editingUser, ...}]}` :456-457 — design D5); `openEditModal` pre-populates the 4 fields (`UsersPage.tsx:112` — AC-001-18); detail rows insert 4 rows after Số điện thoại (:635-638 — AC-001-19). Token compliance: `spaceFormField`, `radiusPill`, `height: 40`, `labelProps()` reused; no hardcoded hex/spacing.

## 4. Review point 4 — no regression to the prior search-split — PASS

End-to-end plumbing verified in the current state:

- **Page:** two FilterBar inputs — `search` "Tìm theo email / tên đăng nhập" (`UsersPage.tsx:362`), `fullName` "Tìm theo họ tên" (:370); `handleFilterApply` commits both (:207-215); reset clears both (:228-229); `useUsers` receives `fullName: fullName || undefined` (:94).
- **Service:** `userService.list` sends `fullName: params.fullName?.trim() || undefined` (`userService.ts:62`); `useUsers.ts` ListParams carries `fullName?`.
- **Controller:** `UserController.java:88` binds `fullName` → `findAllWithCounts(search, fullName, status, orgUnitId, pageable)` (:106).
- **Service:** 5-arg `findAllWithCounts` overload (`UserService.java:190-194`) → `searchUserList(searchLike, fullNameLike, status, ...)` / `searchUserListByOrgUnits` (:227-228) and `getStatusCounts(search, fullName, organizationFilter)` (:280-283); `toSearchLike` is null-safe (:352-361) so the null fullName path is safe.
- **Repository:** all 5 queries carry the `:fullName` predicate on `immutable_unaccent(LOWER(u.fullName))` (`UserRepository.java:140-160` counts, :165-176 `searchUsers`, :181-191 `searchUserList`, :198-202 org-scoped variants).

## 5. Executed verification (gates)

| Gate | Command | Result |
|---|---|---|
| Backend compile (WO-01 acceptance) | `mvn -DskipTests compile` (repo root) | **BUILD SUCCESS** exit 0 (incremental up-to-date; dev report records clean compile 61.8s, same sources) |
| Test sources compile | `mvn -DskipTests test-compile` | **exit 0** — all test sources compile against the new 5-arg overloads |
| Frontend typecheck (WO-02 acceptance) | `npx tsc --noEmit` (frontend/) | **exit 0**, no violations |
| **F1 test class (reproduced)** | `mvn -Dtest=UserServiceTest test` | **Tests run: 10, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS exit 0** (log confirms `Created user: statususer` — the INACTIVE-status case executed through `create()`) |
| **F2 test class (reproduced)** | `mvn -Dtest=UserRolePermissionControllerTest test` | **Tests run: 6, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS exit 0** (Spring Boot test profile context started) |
| Frontend unit tests | `npm test` | **NOT EXECUTABLE**: `frontend/package.json` has no `test` script; vitest not installed (no `frontend/node_modules/vitest`). Design WO-02 acceptance line "run … `npm test`" is inaccurate w.r.t. the repo. Colocated `frontend/src/services/userService.test.ts` is stale — it calls `getAllUsers`/`createUser`/`lockAccount`/etc., none of which the current `userService` exports (unmodified by this change → pre-existing). |

Runtime verification (Flyway apply on a real DB, UI field order at runtime, AC-001-12/16/17/18 round-trips) remains with QA wave 2 — the QA oracle `qa/07-qa-report-w1.md` is authored but NOT EXECUTED.

## 6. Findings

### F1 — CLOSED (was Changes-requested) — WO-01 task 5 test cases now implemented and passing
- **Required by:** `design/00-design-plan.md` §9 WO-01 task 5 — "extend it with a case asserting `create()` persists the request status (INACTIVE) and a null-status 400 path".
- **Evidence (re-read by reviewer):**
  - `UserServiceTest.java` — `create_shouldPersistRequestStatusInsteadOfHardcodedActive()`: sets `request.setStatus(UserStatus.INACTIVE)`, runs `create()`, `ArgumentCaptor<User>` on `userRepository.save` → `assertEquals(UserStatus.INACTIVE, savedCaptor.getValue().getStatus())` + same on the result. **Discriminating**: reverting `create()` to `setStatus(UserStatus.ACTIVE)` fails this test.
  - `UserServiceTest.java` — `createUserRequest_shouldRejectNullStatusByBeanValidation()`: validates a status-less `CreateUserRequest` via `Validation.buildDefaultValidatorFactory()`, asserts a violation on property `status` with message `Vui lòng chọn trạng thái`.
  - `UserRolePermissionControllerTest.java` — `createUser_withoutStatus_shouldReturn400AndNotReachService()` (beyond task-5 minimum): MVC `POST /api/users` without `status` → 400, `$.success` false, `$.data.status` == "Vui lòng chọn trạng thái", `verify(userService, never()).create(...)` — full HTTP-level 400 + no-write assertion.
- **Executed:** `mvn -Dtest=UserServiceTest test` → 10/10 pass exit 0 (reviewer reproduction).

### F2 — CLOSED — controller-test stub now targets the real call path
- **Evidence (re-read):** `UserRolePermissionControllerTest.java` `listWithoutSort_shouldUseDefaultSortInsteadOfFailingOnNullSortField()` now stubs the **5-arg** overload `findAllWithCounts(any(), any(), any(), any(), any())` and adds `$.data.content` isArray + `$.data.pageNumber` == 0 assertions — a dead/stale stub now fails the test instead of passing vacuously.
- **Executed:** `mvn -Dtest=UserRolePermissionControllerTest test` → 6/6 pass exit 0 (reviewer reproduction).

### F3 — [observation, non-blocking] mapUser retains `'ACTIVE'` literal
- **Anchor:** `userService.ts:18` — read-side fallback, pre-existing, not the create path (see §1). QA grep must scope to the create path; PO may decide whether the fallback should change.

### F4 — [observation, non-blocking] Design acceptance line unexecutable
- Design WO-02 acceptance says `npm test` from `frontend/`, but no `test` script exists and vitest is not installed; dev correctly substituted `npm run build` + `npx tsc --noEmit` (both green). Design doc should be corrected to the executable verification.

## 7. Conclusion

The implementation satisfies all four review points with anchored evidence: status-from-form is correct with the hardcoded ACTIVE removed at both ends; the 4 columns are nullable and trim-to-NULL with full DTO/response mapping (positional constructor order verified); the create form follows the 1-11 oracle exactly; the search-split (search/fullName) is intact end-to-end. Backend compile, test-compile, and frontend typecheck pass. The two test deliverables flagged in the first review pass (F1: WO-01 task 5 discriminating tests for AC-001-12/16; F2: dead controller-test stub) are now implemented with genuine assertions and reproduced green by the reviewer (10/10 and 6/6, exit 0). No blocking findings remain; only the two non-blocking observations F3/F4 stand.

**Verdict: Pass.** No code was modified by this review.

---

## Verdict Envelope

```xml
<verdict_envelope>
  <verdict>Pass</verdict>
  <confidence>high</confidence>
  <structured_summary>
    <key_findings>
      <item>Point 1 PASS: UserService.java:431 setStatus(request.getStatus()); userService.ts:101 payload.status?.toUpperCase() — no status:'ACTIVE' in create path; CreateUserRequest.status @NotNull (:43); sole consumer UserController.create @Valid (:134).</item>
      <item>Point 2 PASS: migration 4x ADD COLUMN NULL; entity nullable @Column(length=...); trimToNull on create (:432-435) + guarded update (:497-500); UserResponse positional ctor + UserDetailResponse setters, both @JsonInclude(NON_NULL); FE trim/or undefined/?? undefined/— round-trip.</item>
      <item>Point 3 PASS: form order 1-11 exactly (UsersPage.tsx:441-475); status rendered for both create+edit with required rule and initialValue 'active'; department/position required create-only; openEditModal pre-populates (:112); detail rows after phone (:635-638).</item>
      <item>Point 4 PASS: search/fullName intact page→hook→service→controller(:88,:106)→service 5-arg overload→repository 5 queries with immutable_unaccent fullName predicate; toSearchLike null-safe.</item>
      <item>F1 CLOSED: UserServiceTest gains create_shouldPersistRequestStatusInsteadOfHardcodedActive (ArgumentCaptor INACTIVE) + createUserRequest_shouldRejectNullStatusByBeanValidation; UserRolePermissionControllerTest gains createUser_withoutStatus_shouldReturn400AndNotReachService (400 + never() create). Reproduced: mvn -Dtest=UserServiceTest test → 10/10 exit 0.</item>
      <item>F2 CLOSED: listWithoutSort stubs the 5-arg overload with data assertions (dead stub would fail). Reproduced: mvn -Dtest=UserRolePermissionControllerTest test → 6/6 exit 0.</item>
      <item>Gates: mvn -DskipTests compile BUILD SUCCESS; mvn -DskipTests test-compile exit 0; npx tsc --noEmit exit 0; npm test unexecutable (no script, no vitest — F4, non-blocking observation).</item>
    </key_findings>
    <artifacts_produced>
      <item>docs/modules/M-001-quan-tri-he-thong/reviewer/08-review-report.md</item>
    </artifacts_produced>
  </structured_summary>
  <blockers>
    <!-- none — F1 and F2 closed with passing, reproduced tests -->
  </blockers>
</verdict_envelope>
```
