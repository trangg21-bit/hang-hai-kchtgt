# Dev Summary — WO-01 Backend: F-001 form-reshape 4 columns + create status from form

- **Module:** M-001 — Quản trị hệ thống (F-001 — Quản lý tài khoản người dùng)
- **Triage:** TRI-1786681457834-5887 (scope expansion)
- **Stage:** engineering-backend-developer-wave-1
- **Date:** 2026-08-14 (updated after code-review round F1)
- **Author:** Engineering Backend Developer (WO-01)

## 1. Work order

Implemented `WO-01` of `design/00-design-plan.md` per `ba/00-lean-spec.md` BR-001-19/20/21/22 and AC-001-12/16/17/18/20, plus the F1 code-review follow-up (mandated tests + dead-stub fix):

1. Flyway migration `V20260814120000__add_user_profile_columns.sql` — 4 nullable columns on `app_users`.
2. `User` entity + 4 DTOs gain `address` / `department` / `position` / `note`; `CreateUserRequest` gains `status` (`@NotNull`).
3. `UserService.create()` persists `request.getStatus()` (hardcoded `ACTIVE` removed); `update()` maps the 4 fields via `trimToNull`.
4. **F1:** `UserServiceTest` extended with create-status-INACTIVE + null-status cases; `UserRolePermissionControllerTest` dead 3-arg stub fixed to the 5-arg `findAllWithCounts` overload + controller-level 400 contract test added.

## 2. Source delta (implementation round)

| File | Change |
|---|---|
| `src/main/resources/db/migration/V20260814120000__add_user_profile_columns.sql` | **new** — `ALTER TABLE app_users ADD COLUMN address VARCHAR(255) NULL; department VARCHAR(100) NULL; position VARCHAR(100) NULL; note VARCHAR(500) NULL;` (PostgreSQL dialect, matching the migration directory ground truth; no default, no index, no `IF NOT EXISTS`; max existing version was `V20260813110000`) |
| `src/main/java/com/hanghai/kchtg/user/entity/User.java` | 4 fields inserted after `phone` block: `@Size(max=255\|100\|100\|500, message="Địa chỉ tối đa 255 ký tự" \| "Phòng ban tối đa 100 ký tự" \| "Chức vụ tối đa 100 ký tự" \| "Ghi chú tối đa 500 ký tự")` + `@Column(length=255\|100\|100\|500)`; nullable (no `@NotNull`); accessors via existing class-level Lombok `@Getter @Setter` |
| `src/main/java/com/hanghai/kchtg/user/dto/CreateUserRequest.java` | `+ import UserStatus`; `+ @NotNull(message = "Vui lòng chọn trạng thái") private UserStatus status;`; `+` 4 `@Size`-constrained optional fields (no `@NotNull` on department/position — design D5) |
| `src/main/java/com/hanghai/kchtg/user/dto/UpdateUserRequest.java` | `+` 4 optional `@Size`-constrained fields after `phone` (`status` already present) |
| `src/main/java/com/hanghai/kchtg/user/dto/UserResponse.java` | `+` 4 fields after `phone`; single positional constructor call in `from()` (verified one call site) extended with the 4 getters; `@JsonInclude(NON_NULL)` already present |
| `src/main/java/com/hanghai/kchtg/user/dto/UserDetailResponse.java` | `+` 4 fields after `phone`; `from()` adds 4 setter lines |
| `src/main/java/com/hanghai/kchtg/user/service/UserService.java` | `create()` (:431): `user.setStatus(UserStatus.ACTIVE)` → `user.setStatus(request.getStatus())`; after `setPhone` add 4 `trimToNull` mappings (:432–435). `update()` (:497–500): guarded null-means-skip mappings (blank → NULL). New helper `private static String trimToNull(String)` (:887). **`updateMyProfile()` write logic untouched** (design D8 + WO-01 item 4: the 4 fields writable only through admin `update()`; `/me` responses carry them automatically via `UserResponse.from`) |

## 3. Test delta (F1 review round — write scope `src/test/java/com/hanghai/kchtg/user/**`)

| File | Change |
|---|---|
| `src/test/java/com/hanghai/kchtg/user/service/UserServiceTest.java` | `+ create_shouldPersistRequestStatusInsteadOfHardcodedActive` — request `status=INACTIVE` → `ArgumentCaptor<User>` on `userRepository.save` asserts the persisted entity has `INACTIVE` (discriminating: fails if `create()` re-hardcodes `ACTIVE`), returned user also `INACTIVE`. `+ createUserRequest_shouldRejectNullStatusByBeanValidation` — Jakarta `Validator` (Hibernate Validator 8.0.1) validates a `CreateUserRequest` without `status` → violation on property `status` with message `"Vui lòng chọn trạng thái"` (the `@NotNull` contract, BR-001-19/AC-001-16; the wire-level 400 is covered in the controller test below). No main-source change in this round. |
| `src/test/java/com/hanghai/kchtg/user/UserRolePermissionControllerTest.java` | **F2 fix:** dead 3-arg stub `when(userService.findAllWithCounts(any(), any(), any()))` → 5-arg `(any(), any(), any(), any(), any())` matching the overload the controller actually calls (verified `UserController.list` :90 calls the 5-arg `(search, fullName, status, orgUnitId, pageable)`); added discriminating assertions `$.data.content` is an array + `$.data.pageNumber == 0` (before the fix the mock returned null → vacuous `success(null)`). `+ createUser_withoutStatus_shouldReturn400AndNotReachService` — `POST /api/users` with all required fields except `status` → 400, `$.success == false`, `$.data.status == "Vui lòng chọn trạng thái"` (via `GlobalExceptionHandler.handleMethodArgumentNotValid`), and `verify(userService, never()).create(any())` proves `create()` is not reached. |

## 4. Acceptance mapping

| AC / BR | Status | Evidence |
|---|---|---|
| AC-001-12 / BR-001-19 | Done | `UserService.create()` = `user.setStatus(request.getStatus())` (`UserService.java:431`); `CreateUserRequest.status` `@NotNull("Vui lòng chọn trạng thái")`; no `setStatus(UserStatus.ACTIVE)` in `UserService` (grep: only :549 soft-delete `DELETED`, :673 `changeStatus`); guarded by `UserServiceTest.create_shouldPersistRequestStatusInsteadOfHardcodedActive` |
| AC-001-16 | Done | Unit: bean-validator violation on `status`; wire: MockMvc `POST /api/users` without status → 400 + `create()` never invoked |
| AC-001-17 | Done | create()/update() persist the 4 fields; `UserResponse`/`UserDetailResponse` return them (NON_NULL → omitted when null) |
| AC-001-18 | Done (backend side) | update() null-means-skip + blank→NULL; frontend pre-population is WO-02 scope |
| AC-001-20 / BR-001-21 | Done | Migration file exists (exact SQL from design §4; version sorts after max existing) |
| BR-001-20 | Done | Columns nullable; blank → NULL via `trimToNull`; responses NON_NULL |
| BR-001-22 | Done | DB/API identifiers English; error messages Vietnamese with diacritics |

## 5. Verification (executed, real output)

1. `mvn clean compile` (repo root, 2026-08-14 12:50:09 and 12:51:47) — **BUILD SUCCESS, exit code 0** (1098 sources, javac release 17).
2. `mvn -Dtest=UserServiceTest test` (2026-08-14 13:10:24) — **BUILD SUCCESS, exit code 0**; `Tests run: 10, Failures: 0, Errors: 0, Skipped: 0` (8 pre-existing + 2 new).
3. `mvn -Dtest=UserRolePermissionControllerTest test` (2026-08-14 13:11:27) — **BUILD SUCCESS, exit code 0**; `Tests run: 6, Failures: 0, Errors: 0, Skipped: 0` (5 pre-existing + 1 new; Spring context under `test` profile).
4. Server never started. No frontend files touched. No git operations. `npm run build` (dispatch-template line) is not a valid oracle for this Java-only delta — zero frontend files changed; the record verification per brief criterion 4 and design WO-01 is the Maven compile/test gate, which passed.

## 6. Scope notes / risks

- **updateMyProfile()**: brief text mentions mapping there, but design §5.6.4 / D8 / WO-01 item 4 explicitly forbid touching its write logic (self-service editing of department/position is policy the spec does not grant). The 4 fields still flow into `/me` responses via `UserResponse.from`. Flagged for the orchestrator in case the brief intended self-edit — that would be a spec/design change, not a code fix.
- **Migration runtime**: applied by Flyway on next startup (server start out of scope); nullable columns → no backfill.
- **Constructor safety**: `User` entity `@AllArgsConstructor` signature changed — all `new User(...)` call sites verified no-args only (`UserService.java:425`, `RegistrationService.java:192`, `ApprovalService.java:189`, seeder files); `UserResponse` all-args constructor has exactly one call site (its own `from()`), updated in the same edit; test files use no-args DTO constructors only.
- **Dead-stub fix note**: the pre-existing `listWithoutSort` test passed vacuously before (3-arg stub matched no overload the controller calls → `data: null`); it now exercises the real 5-arg path and asserts a non-null payload.
