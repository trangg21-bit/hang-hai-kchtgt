---
feature-id: F-001
document: design-plan
output-mode: lean
last-updated: "2026-08-14"
verdict: proposed
waves: 1
triage-id: TRI-1786681457834-5887
supersedes: F-002 design content (released 2026-08-05, no longer in this module's scope)
---

# F-001 Solution Design — Quản lý tài khoản người dùng — Scope Expansion TRI-1786681457834-5887

## 1. Scope and spec contract

This design replaces the stale F-002 (UserGroup) design plan that previously occupied this file. It is the
design for the **F-001 user-account scope expansion TRI-1786681457834-5887** — form reshape + 4 profile
columns + status-on-create.

| Spec source | Location | Contract used here |
|---|---|---|
| BA lean spec (authoritative) | `docs/modules/M-001-quan-tri-he-thong/ba/00-lean-spec.md` | §1.2 (capabilities), BR-001-19..22, AC-001-12/15/16/17/18/20, §7.1/7.2 (data model/DTO), §8 (API), §9 (NFR), §10.1–10.4 (UI), §11 (ambiguities), §12 (evidence anchors) |
| Triage record | `docs/intel/_intake/TRI-1786681457834-5887.json` | C3 route; schema one-way door at `src/main/resources/db/migration/V20260814120000__add_user_profile_columns.sql` |

**Delta (what this design must deliver):**

1. DB: 4 nullable columns `address`, `department`, `position`, `note` on `app_users` via Flyway
   `V20260814120000__add_user_profile_columns.sql` (BR-001-20/21, AC-001-20).
2. Backend: `CreateUserRequest` gains `status` (`@NotNull`) + 4 profile fields; `UserService.create()`
   persists `request.getStatus()` instead of the hardcoded `ACTIVE` (BR-001-19, AC-001-12); `update()` maps
   the 4 fields; `UserResponse`/`UserDetailResponse` return the 4 fields (AC-001-17).
3. Frontend: create/edit/detail drawers reshaped to the fixed field order (§10.1, AC-001-15); status Select
   on the create form with default `ACTIVE` and required validation (AC-001-16); edit drawer pre-populates
   the 4 new fields (AC-001-18); detail drawer shows 4 new rows, null → "—" (§10.3).

**Preserved by spec (do NOT change):** search-split FilterBar (2 search inputs, AC-001-07), StatusTabs/
DataTable/Pagination from `frontend/src/components/list-view/`, lock/unlock/reset-password/approval flows,
RBAC permissions (§10.4, §8).

## 2. Current seam (verified 2026-08-14)

| # | Area | Verified current state | Anchor |
|---|---|---|---|
| S1 | Entity | `@Table(name = "app_users")`; fields username/password/email/fullName/phone/orgUnit/roles/groups/status (default `ACTIVE`) — **no** address/department/position/note | `src/main/java/com/hanghai/kchtg/user/entity/User.java` — `@Table` at class level; `private String phone;` before `@ManyToOne ... orgUnit`; `private UserStatus status = UserStatus.ACTIVE;` with `@Column(name = "status", nullable = false)` |
| S2 | Create DTO | 53 lines; fields username/password/email/fullName/phone/permissionCodes/orgUnitId/groupIds — **no** `status` | `src/main/java/com/hanghai/kchtg/user/dto/CreateUserRequest.java` (read in full; 53 lines) |
| S3 | Update DTO | Has `private UserStatus status;` — **no** 4 profile fields | `src/main/java/com/hanghai/kchtg/user/dto/UpdateUserRequest.java:41` |
| S4 | Response DTOs | `@JsonInclude(NON_NULL)`; no 4 profile fields; `UserResponse.from()` builds via positional constructor | `src/main/java/com/hanghai/kchtg/user/dto/UserResponse.java:70` (`new UserResponse(...)`); `src/main/java/com/hanghai/kchtg/user/dto/UserDetailResponse.java` (setter-style `from()`) |
| S5 | Service create | `create()` at :412; `user.setStatus(UserStatus.ACTIVE);` at :431; sets username/password/email/fullName/phone | `src/main/java/com/hanghai/kchtg/user/service/UserService.java:412,431` |
| S6 | Service update | `update()` at :464 — null-means-skip semantics for email/password/fullName/phone/orgUnitId/status | `src/main/java/com/hanghai/kchtg/user/service/UserService.java:464` |
| S7 | Service /me | `updateMyProfile()` at :711 — self can update fullName/phone; admin additionally orgUnit/groups; response via `UserResponse.from` (:698, :772) | `src/main/java/com/hanghai/kchtg/user/service/UserService.java:711` |
| S8 | Controller | `@RequestMapping({"/api/users", "/api/v1/users"})` :44; POST create :131–134 (`@Valid @RequestBody CreateUserRequest`); PUT update :147–150; PUT /me :230–231; GET detail builds `UserDetailResponse.from` :124 | `src/main/java/com/hanghai/kchtg/user/controller/UserController.java:44,124,131,134,147,150,230,231` |
| S9 | FE types | `User`, `CreateUserPayload` (no `status`, no 4 fields), `UpdateUserPayload` (has `status?`) | `frontend/src/types/user.ts` |
| S10 | FE service | `create()` :89–101 hardcodes `status: 'ACTIVE'` :98; `update()` :103; `mapUser()` :12–47 | `frontend/src/services/userService.ts:12,89,98,103` |
| S11 | FE page | Drawer create/edit :413–465; username+password rendered only when `!editingUser` :430–437; fullName :438; email+phone row :439–441; orgUnitId :442–445; **status Select only when `editingUser`** :446–458; `openEditModal` sets fullName/email/phone/orgUnitId/status :111–113; create payload :131–135 (no status); update payload :121–128; detail drawer rows :601–638 (no 4 profile rows; rows array :611–623) | `frontend/src/pages/UsersPage.tsx:111-113,121-135,413-465,601-638` |
| S12 | Migrations | Highest existing version `V20260813110000__remove_group_type_from_user_groups.sql`; target `V20260814120000*` does **not** exist (glob: no files); dialect is **PostgreSQL** (partial unique index `WHERE deleted_at IS NULL`, unaccent extension) | `src/main/resources/db/migration/` — `V20260727154800__alter_users_constraints.sql`, `V20260731113500__enable_unaccent_extension.sql`; glob `V20260814120000*.sql` → 0 files |

Note: the lean-spec frontmatter declares `MSSQL Server`, but every schema migration in
`src/main/resources/db/migration/` is PostgreSQL (verified S12). The migration work order uses PostgreSQL
syntax, matching the ground-truth migration directory.

## 3. Design decisions

| # | Decision | Rationale | Alternatives rejected |
|---|---|---|---|
| D1 | Create status comes from the form: DTO `@NotNull(message = "Vui lòng chọn trạng thái")` on `status`; `create()` does `user.setStatus(request.getStatus())`; both hardcodes removed | BR-001-19 / AC-001-12 / AC-001-16. `@Valid` on `UserController.create` (:134) turns a null status into a 400 with the required message before any write | Keeping a service-side default (e.g. `request.getStatus() == null ? ACTIVE : ...`) would silently bypass the spec'd validation |
| D2 | 4 columns nullable, no default, no index | BR-001-20; §9 NFR (no index for non-filter columns; nullable so existing rows need no backfill) | NOT NULL + backfill rejected — would break F-271/legacy rows and violate "không phá dữ liệu cũ" |
| D3 | Migration `V20260814120000__add_user_profile_columns.sql`, PostgreSQL syntax, ADD COLUMN only | BR-001-21 (Flyway mandatory, no `ddl-auto`); version sorts after max existing `V20260813110000`; triage C3 one-way door | Any lower/duplicate version would be skipped or collide with applied history |
| D4 | Blank/whitespace-only profile values are trimmed and stored as `NULL` (BR-001-20): private `trimToNull(String)` helper in `UserService` | No shared util exists in the codebase (grep: no `trimToNull`); project pattern is inline `!= null && !isBlank()` checks | New shared util class rejected — smallest complete change, single consumer |
| D5 | `department`/`position` required **on the create form only** (frontend rule); **no** `@NotNull` in DTO | AMBIGUITY-002 decision: DB nullable, form-required, DTO stays optional so other API consumers (F-271) are not broken | `@NotNull` in DTO rejected explicitly by the BA decision |
| D6 | Status Select options only `ACTIVE`/`INACTIVE` (labels Hoạt động / Không hoạt động), default `active` on create | AMBIGUITY-001 decision; matches current edit-form options | LOCKED/DELETED/PENDING_* at creation rejected |
| D7 | `UserResponse` gains 4 fields; the single positional constructor call inside `UserResponse.from()` (UserResponse.java:70) is updated in the same edit | `new UserResponse(` has exactly one call site (verified); `from()` is the only mapper | Adding a second constructor rejected — one mapper, one shape |
| D8 | `/api/users/me` response carries the 4 fields (automatic via `UserResponse.from`); `/me` **write** policy unchanged — the 4 fields are writable only through the admin `update()` (F-001 edit drawer) | Spec §8 requires only "Response + 4 trường mới" for /me; self-service editing of department/position is a policy the spec does not grant | Adding self-edit for the 4 fields would invent policy beyond the spec (flagged in §11 for PO) |
| D9 | One shared form field sequence; create order = §10.1 oracle exactly (1..11); edit shows the same sequence minus username/password | AC-001-15 pins the create order; AC-001-18 pins only that edit shows the 4 fields pre-populated + status | A different edit-order layout adds complexity with no acceptance benefit |
| D10 | Detail drawer inserts 4 rows (Địa chỉ, Phòng ban, Chức vụ, Ghi chú) after Số điện thoại, null → "—"; existing rows kept | §10.3 table + §9 Usability ("4 trường null hiển thị —") | Replacing the rows array wholesale rejected (preserves audit rows like Người tạo/Người cập nhật) |

## 4. Database delta

**New file** `src/main/resources/db/migration/V20260814120000__add_user_profile_columns.sql`:

```sql
-- TRI-1786681457834-5887: F-001 user profile columns (all nullable, no default, no index)
ALTER TABLE app_users ADD COLUMN address VARCHAR(255) NULL;
ALTER TABLE app_users ADD COLUMN department VARCHAR(100) NULL;
ALTER TABLE app_users ADD COLUMN position VARCHAR(100) NULL;
ALTER TABLE app_users ADD COLUMN note VARCHAR(500) NULL;
```

- Lengths follow AMBIGUITY-003 and lean-spec §7.1 (address 255 / department 100 / position 100 / note 500),
  consistent with entity scale (email 150, fullName 200, phone 20).
- PostgreSQL dialect, matching every existing migration (S12). No `IF NOT EXISTS` — Flyway versioning makes
  the script run exactly once; a failed midway run is repaired by Flyway's own failure handling.
- No data backfill: existing rows receive `NULL` (BR-001-20, AC-001-20).

**Verification:** application startup applies the script (Flyway) — check `flyway_schema_history` for
`V20260814120000` and `SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name =
'app_users' AND column_name IN ('address','department','position','note')` → all `YES`.

## 5. Backend delta

### 5.1 Entity — `src/main/java/com/hanghai/kchtg/user/entity/User.java`

Insert after the `phone` field block (before the `orgUnit` `@ManyToOne` block):

```java
@Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
@Column(length = 255)
private String address;

@Size(max = 100, message = "Phòng ban tối đa 100 ký tự")
@Column(length = 100)
private String department;

@Size(max = 100, message = "Chức vụ tối đa 100 ký tự")
@Column(length = 100)
private String position;

@Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
@Column(length = 500)
private String note;
```

- Accessors come from the existing class-level Lombok `@Getter @Setter` (same as `status`/`lastLoginAt`).
  Do **not** add hand-written getters/setters and do not add `@NotNull` (BR-001-20: nullable).

### 5.2 `CreateUserRequest` — `src/main/java/com/hanghai/kchtg/user/dto/CreateUserRequest.java`

Add import `com.hanghai.kchtg.user.entity.UserStatus` and:

```java
@NotNull(message = "Vui lòng chọn trạng thái")
private UserStatus status;

@Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
private String address;

@Size(max = 100, message = "Phòng ban tối đa 100 ký tự")
private String department;

@Size(max = 100, message = "Chức vụ tối đa 100 ký tự")
private String position;

@Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
private String note;
```

No `@NotNull` on `department`/`position` (D5). `status` is the only new required field (BR-001-19, AC-001-16).

### 5.3 `UpdateUserRequest` — `src/main/java/com/hanghai/kchtg/user/dto/UpdateUserRequest.java`

Add the same 4 optional fields with identical `@Size` constraints (no `@NotNull`). `status` already exists
at :41 — do not duplicate it.

### 5.4 `UserResponse` — `src/main/java/com/hanghai/kchtg/user/dto/UserResponse.java`

- Add fields `private String address; private String department; private String position; private String
  note;` after `phone`.
- Update the single constructor call in `from()` (:70) — insert the 4 getters after `user.getPhone()` in
  positional order: `user.getAddress(), user.getDepartment(), user.getPosition(), user.getNote()`.
- `@JsonInclude(NON_NULL)` already present → absent values serialize as omitted/null (BR-001-20).

### 5.5 `UserDetailResponse` — `src/main/java/com/hanghai/kchtg/user/dto/UserDetailResponse.java`

- Add the 4 fields after `phone`.
- In `from()`, add `response.address = user.getAddress();` (and department/position/note) after
  `response.phone = ...`.

### 5.6 `UserService` — `src/main/java/com/hanghai/kchtg/user/service/UserService.java`

1. **`create()` (:412):** replace `user.setStatus(UserStatus.ACTIVE);` (:431) with
   `user.setStatus(request.getStatus());` and, after `user.setPhone(request.getPhone());`, add:
   ```java
   user.setAddress(trimToNull(request.getAddress()));
   user.setDepartment(trimToNull(request.getDepartment()));
   user.setPosition(trimToNull(request.getPosition()));
   user.setNote(trimToNull(request.getNote()));
   ```
2. **`update()` (:464):** after the existing `if (request.getPhone() != null)` block add (null-means-skip
   contract, blank → NULL):
   ```java
   if (request.getAddress() != null) user.setAddress(trimToNull(request.getAddress()));
   if (request.getDepartment() != null) user.setDepartment(trimToNull(request.getDepartment()));
   if (request.getPosition() != null) user.setPosition(trimToNull(request.getPosition()));
   if (request.getNote() != null) user.setNote(trimToNull(request.getNote()));
   ```
3. **Helper** (private static, at class bottom):
   ```java
   private static String trimToNull(String value) {
       if (value == null) return null;
       String trimmed = value.trim();
       return trimmed.isEmpty() ? null : trimmed;
   }
   ```
4. **`updateMyProfile()` (:711): no write-side change** — the 4 fields flow into the response through
   `UserResponse.from` (D8). `getMyProfile()` (:698) also automatically returns them.

### 5.7 Controller — no change

`UserController.java:134` (create) / `UserController.java:152` (update) already bind `@Valid @RequestBody` DTOs; the
new fields and validation flow through with zero controller edits (verified signatures).

## 6. Frontend delta

### 6.1 `frontend/src/types/user.ts`

- `User`: add `address?: string; department?: string; position?: string; note?: string;`
- `CreateUserPayload`: add `status: Status;` + the 4 optional fields
- `UpdateUserPayload` (proposed): add the 4 optional fields address, department, position, note.

### 6.2 `frontend/src/services/userService.ts`

- `create()` (:89–101): replace the literal `status: 'ACTIVE'` (:98) with
  `status: payload.status?.toUpperCase(),` and add `address: payload.address, department: payload.department,
  position: payload.position, note: payload.note,`.
- `update()` (:103+): add the same 4 fields to the PUT body.
- `mapUser()` (:12–47): add
  `address: item.address ?? undefined, department: item.department ?? undefined, position: item.position ??
  undefined, note: item.note ?? undefined,`.

### 6.3 `frontend/src/pages/UsersPage.tsx` (create/edit drawer :413–465)

**Field order (create — §10.1 oracle, AC-001-15):**

| # | Form.Item | Control | Required (create) | Notes |
|---|---|---|---|---|
| 1 | `username` | `Input` | ✅ | keep existing rules (:430–433) |
| 2 | `password` | `Input.Password` | ✅ | keep existing rules (:434–437) |
| 3 | `orgUnitId` | `OrgUnitTreeSelect` | ✅ | move **above** email; keep rule "Vui lòng chọn đơn vị trực thuộc" (:442–445) |
| 4 | `email` | `Input` | ✅ | keep rule (:440) |
| 5 | `fullName` | `Input` | ✅ | keep rule (:438) |
| 6 | `phone` | `Input` | ❌ | keep pattern rule (:441) |
| 7 | `address` | `Input` | ❌ | max 255 "Địa chỉ tối đa 255 ký tự" |
| 8 | `department` | `Input` | ✅ (create only) | "Vui lòng nhập phòng ban"; max 100; **not** required on edit (D5) |
| 9 | `position` | `Input` | ✅ (create only) | "Vui lòng nhập chức vụ"; max 100; **not** required on edit (D5) |
| 10 | `status` | `Select` | ✅ | render for **both** create and edit (move out of the `{editingUser && ...}` guard :446–458); options `active`/`inactive` (Hoạt động/Không hoạt động); rule "Vui lòng chọn trạng thái"; `initialValue: 'active'` on create (D6) |
| 11 | `note` | `Input.TextArea` | ❌ | max 500 "Ghi chú tối đa 500 ký tự" |

All fields keep `style={{ marginBottom: spaceFormField }}` and `borderRadius: radiusPill, height: 40`
(`Input.TextArea` height may be natural). Do **not** introduce new tokens/colors; reuse `tokens.ts`
presets already imported (:18). The `Row gutter={16}` two-column pair (:439–441) must be removed or
restructured so the observable order matches 1–11; the only allowed pairing is `department`+`position`
(adjacent 8–9).

**Edit drawer (AC-001-18):** same sequence minus username/password; `openEditModal` (:111–113) must
pre-populate the 4 new fields: `form.setFieldsValue({ ..., address: user.address, department:
user.department, position: user.position, note: user.note })`.

**Payloads (`handleSubmit`):**
- create (:131–135): add `status: values.status,` and `address: values.address?.trim() || undefined,
  department: values.department?.trim() || undefined, position: values.position?.trim() || undefined, note:
  values.note?.trim() || undefined,` (trim per AGENTS.md input rule; blank → undefined so backend stores NULL).
- update (:121–128): add the same 4 trimmed fields alongside the existing `status: values.status`.

**Detail drawer (:601–638):** insert 4 rows after `['Số điện thoại', ...]` in the rows array (:611–623):
`['Địa chỉ', detailUser.address || '—']`, `['Phòng ban', detailUser.department || '—']`,
`['Chức vụ', detailUser.position || '—']`, `['Ghi chú', detailUser.note || '—']` (§10.3, D10). All other
rows (including audit rows) unchanged.

## 7. Data flow and invariants

- **Create:** form → `CreateUserPayload` (status + 4 fields, trimmed) → `POST /api/users` → `@Valid`
  (status `@NotNull` fails → 400 "Vui lòng chọn trạng thái", nothing written) → `UserService.create()`
  → `user.setStatus(request.getStatus())` + `trimToNull` on the 4 fields → save.
- **Update:** form → `UpdateUserPayload` → `PUT /api/users/{id}` → `update()` null-means-skip; blank string
  maps to `NULL` (BR-001-20).
- **Read:** `UserResponse`/`UserDetailResponse` `@JsonInclude(NON_NULL)` → 4 fields absent when `NULL`;
  frontend `mapUser` defaults them to `undefined`; detail drawer renders "—".
- **Status vocabulary:** FE form values `'active' | 'inactive'`; FE service uppercases before sending
  (`ACTIVE`/`INACTIVE`); backend `UserStatus` enum ordinals unchanged (INT storage, §7.1). No
  `LOCKED`/`DELETED`/`PENDING_*` selectable at creation (D6).
- **Invariant:** `status` is the only new **required** field at the API boundary; the 4 profile fields are
  optional at the API boundary and nullable in the DB; `department`/`position` required only on the create
  form (UI rule).
- **No change to:** uniqueness checks (username/email), password policy/password-history, orgUnit FK
  validation, RBAC `@PreAuthorize` (user:create/user:update), audit columns.

## 8. Acceptance mapping

| AC / BR | Design element | Verification oracle |
|---|---|---|
| AC-001-12, BR-001-19 | D1 + §5.6.1 + §6.2/6.3 | POST `/api/users` with `"status": "INACTIVE"` → saved user is INACTIVE (GET `/api/users/{id}` shows Không hoạt động); no approval step; no `status: 'ACTIVE'` literal remains in `userService.ts` or `UserService.java` |
| AC-001-15 | §6.3 order table | Open create drawer; observable order is exactly 1–11 (username→note) |
| AC-001-16 | D1, D6, §6.3 status row | Clear status on create form → submit → error "Vui lòng chọn trạng thái", no API call (network tab), no account created; backend 400 path when status omitted |
| AC-001-17 | §5.1–5.6, §6.1–6.3 | Create with 4 fields → create/update responses contain them; GET detail returns them; empty values → `null` in DB and omitted in JSON |
| AC-001-18 | §6.3 edit drawer + `openEditModal` | Open edit drawer → address/department/position/note pre-populated from current data + status Select; save persists new values |
| AC-001-20, BR-001-21 | §4 | Flyway applies `V20260814120000`; `app_users` has 4 nullable columns; pre-existing rows have `NULL`; no `ddl-auto` involved |
| BR-001-20 | D2, D4, §5.6, §7 | Blank values trimmed and stored `NULL`; responses NON_NULL; detail shows "—" |
| BR-001-22 | §4–§6 | DB/API identifiers English (`address`, `department`, `position`, `note`); UI labels Vietnamese (Địa chỉ, Phòng ban, Chức vụ, Ghi chú) |

## 9. Work orders

### WO-01 — Backend developer (F-001)

Ordered, independently verifiable tasks:

1. **Migration** — create `src/main/resources/db/migration/V20260814120000__add_user_profile_columns.sql`
   with the exact SQL from §4.
2. **Entity** — add the 4 fields to `User.java` after the `phone` block (§5.1).
3. **DTOs** — `CreateUserRequest.java`: `status` `@NotNull` + 4 fields (§5.2); `UpdateUserRequest.java`:
   4 fields (§5.3); `UserResponse.java`: 4 fields + update the constructor call in `from()` at :70 (§5.4);
   `UserDetailResponse.java`: 4 fields + 4 setter lines in `from()` (§5.5).
4. **Service** — `UserService.java`: replace :431 with `user.setStatus(request.getStatus());`, add 4
   `trimToNull` mappings in `create()` (:412) and the guarded mappings in `update()` (:464), add the
   `trimToNull` helper (§5.6). Do not touch `updateMyProfile()` (:711) write logic.
5. **Compile & test** — run `mvn -DskipTests compile` (project rule: never start the backend). If an
   existing test class for `UserService` exists under `src/test/java/.../user/service/`, extend it with a
   case asserting `create()` persists the request status (INACTIVE) and a null-status 400 path; report the
   focused test result. Do not modify any file outside the ones listed above.

Acceptance for WO-01: `mvn -DskipTests compile` green; §8 rows for AC-001-12/17/20 pass against a local DB.

### WO-02 — Frontend developer (F-001)

Ordered, independently verifiable tasks:

1. **Types** — `frontend/src/types/user.ts`: `User` +4 optional fields; `CreateUserPayload` +`status` +4;
   `UpdateUserPayload` +4 (§6.1).
2. **Service** — `frontend/src/services/userService.ts`: `create()` (:89–101) — replace `status: 'ACTIVE'`
   (:98) with `status: payload.status?.toUpperCase()`, add 4 fields; `update()` (:103+) — add 4 fields;
   `mapUser()` (:12–47) — map 4 fields (§6.2).
3. **Page** — `frontend/src/pages/UsersPage.tsx`: reorder the create/edit drawer form to the §6.3 table
   (1–11); move the status Select out of the edit-only guard (:446–458) with `initialValue: 'active'` and
   rule "Vui lòng chọn trạng thái"; add the 4 fields with the specified rules (department/position
   required on create only — reuse the `rules={!editingUser ? [...] : undefined}` pattern already used for
   orgUnitId at :442–445); `note` as `Input.TextArea`; pre-populate 4 fields in `openEditModal` (:111–113);
   add the 4 trimmed fields to both payloads (:121–128, :131–135); insert the 4 detail rows after Số điện
   thoại in the rows array (:611–623). Reuse existing tokens/presets from `tokens.ts` (:18) — no new
   colors/spacing/font sizes; keep `spaceFormField`/`radiusPill`/`height: 40` conventions.
4. **Verify** — run `pnpm exec tsc --noEmit` and `npm test` from `frontend/`; report exact command results.

Acceptance for WO-02: typecheck green; §8 rows for AC-001-15/16/18 pass in the running UI (Vite dev);
search-split FilterBar untouched (§10.4).

## 10. Rollout / rollback

- **Deploy:** backend first (Flyway applies `V20260814120000` on startup; nullable columns are
  non-blocking and existing rows get `NULL`), then frontend bundle. Old frontend against new backend works
  (4 fields simply absent); new frontend against old backend must be avoided (POST would carry `status`
  the old DTO ignores — harmless, but the field-order reshape would not match).
- **Rollback:** deploy previous backend JAR (the 4 nullable columns are harmless without code) then the
  previous frontend bundle. No schema revert needed; no data backfill ever performed.

## 11. Risks and open questions

| # | Item | Severity | Status / action |
|---|---|---|---|
| R1 | Spec frontmatter says `MSSQL Server` but all migrations are PostgreSQL (S12) | Low | Migration uses PostgreSQL per ground truth; flag to BA/PMO to reconcile the frontmatter |
| R2 | F-271 (self-registration) might POST to the same `/api/users` endpoint and now hit `@NotNull status` | Low | Verified: `CreateUserRequest` is consumed only by `UserController.create` (:134) + `UserService.create` (:412); no other consumer in `src/main/java`. QA wave re-checks the F-271 registration path |
| R3 | `/me` self-edit policy for the 4 fields unspecified in spec (D8) | Low | Response carries fields; only admin edit writes them. Ask PO if self-service editing of department/position is wanted |
| R4 | `User.java` has hand-written accessors alongside Lombok `@Getter @Setter` (pre-existing inconsistency) | Low | New fields use Lombok only; do not refactor existing accessors (out of scope) |
| R5 | `CreateUserRequest.password` `@Size(min = 6)` vs frontend rule min 8 (pre-existing) | Low | Pre-existing; out of scope; QA note only |
| R6 | Migration runs on app startup; a syntactically invalid script blocks boot | — | Mitigated: script is 4 plain `ADD COLUMN` statements; verify via `mvn -DskipTests compile` + local startup check by QA |

## 12. Out of scope / preserved behavior

- Search-split FilterBar (2 search inputs + status/orgUnit filters), StatusTabs, DataTable, Pagination
  (AC-001-07, §10.4).
- Lock/unlock, reset-password, approve/reject, permission-assignment flows and their modals.
- RBAC permission registration — no change: this expansion adds no new `@PreAuthorize` strings; the existing
  `user:create` (UserController.java:133) / `user:update` (UserController.java:149) annotations are authorized via the seeded `user:manage` (RolePermissionSeeder.java:89) resource-manage fallback (PermissionAuthorizationManager.java:44).
- `UserStatus` enum ordinals and `status` INT storage.
- No new indexes, no `ddl-auto`, no backfill, no data seeding.
