# QA Report — Wave 2 (Validation) — F-001 Quản lý tài khoản người dùng

- **Triage:** TRI-1786681457834-5887 (scope_expansion, C3)
- **Module / Feature:** M-001 Quản trị hệ thống / F-001 Quản lý tài khoản người dùng
- **Stage:** Engineering QA — wave-2 validation of the wave-1 implementation against oracle `qa/07-qa-report-w1.md`
- **Date executed:** 2026-08-14
- **Method:** direct code read-back with file:line evidence + DoD build commands. No server was started (project rule: never start the backend); no runtime UI/DB probes executed — static verification only where noted.

## 1. DoD verification — REAL command output

| Command | Dir | Exit | Output (real) |
|---|---|---|---|
| `mvn clean compile` | repo root | 0 | Background job settled exit 0 (clean → enforcer `RequireJavaVersion passed` → jacoco agent → resources copied → compiler `Recompiling the module because of changed source code`). Re-run `mvn compile` for the full tail: `Nothing to compile - all classes are up to date.` → `BUILD SUCCESS` — `Total time: 2.150 s`, `Finished at: 2026-08-14T12:56:17+07:00` |
| `npm run build` | `frontend/` | 0 | `vite v8.1.5 building client environment for production...` → `✓ 4033 modules transformed` → `dist/` assets emitted incl. `dist/assets/UsersPage-2j692Bbx.js 25.77 kB` → `✓ built in 789ms`. Only advisory: `(!) Some chunks are larger than 500 kB after minification` (pre-existing, non-blocking) |

## 2. Per-AC verdicts

| AC | Verdict | Summary | Key evidence (file:line) |
|---|---|---|---|
| AC-001-12 | **PASS** | Create status comes from the form; no hardcoded ACTIVE in any create path | `UserService.java:431`, `userService.ts` create(), `UsersPage.tsx:438/460-466` |
| AC-001-15 | **PASS** | Create form renders the exact 11-field order | `UsersPage.tsx:441-474` |
| AC-001-16 | **PASS** (static) | Missing status blocked at UI and API with "Vui lòng chọn trạng thái" | `UsersPage.tsx:459-462`, `CreateUserRequest.java:43-44`, `UserController.java:134` |
| AC-001-17 | **PASS** | 4 fields persist (trim→NULL) and return in `UserResponse`/`UserDetailResponse` | `User.java:82/89/96/103`, `UserService.java:432-435/497-500/887-891`, `UserResponse.java:28-31/78-81`, `UserDetailResponse.from()`, `userService.ts:31-34/98-101/110-113` |
| AC-001-18 | **PASS** | Edit form pre-populates 4 fields + status; save persists | `UsersPage.tsx:111-114`, `:441-474` (shared form), `:123-131` update payload; `UserService.java:471-472/497-500` |
| AC-001-19 | **PASS** | Detail drawer shows 4 fields after Số điện thoại, null → "—", status badge | `UsersPage.tsx:635-638/641` |
| AC-001-20 | **PASS** | Flyway migration adds 4 nullable columns | `src/main/resources/db/migration/V20260814120000__add_user_profile_columns.sql` |

> **Coverage map (dispatch brief labels ↔ canonical spec IDs, same as wave-1 oracle):** brief's "AC-16 4 fields persist + return" = spec **AC-001-17**; brief's "AC-17 edit form" = spec **AC-001-18**; brief's "AC-18 detail drawer" = spec **AC-001-19**. The six canonical AC-001-12/15/16/17/18/20 are all covered above; the detail-drawer case is reported as AC-001-19.

### 2.1 AC-001-12 — Create status from form, no hardcoded ACTIVE — **PASS**

- `src/main/java/com/hanghai/kchtg/user/service/UserService.java:431` — inside `create()` (:412): `user.setStatus(request.getStatus());` — replaces the former `user.setStatus(UserStatus.ACTIVE);` (was :431 per spec §12).
- Grep `UserStatus\.ACTIVE` in `UserService.java` → **0 hits**; the only `setStatus` calls are `request.getStatus()` (:431), `changeStatus` (:472, :673), and soft-delete `UserStatus.DELETED` (:549) — none in the create path.
- `frontend/src/services/userService.ts` `create()` (:89-101): body sends `status: payload.status?.toUpperCase(),` — no `'ACTIVE'` literal. Grep `ACTIVE` in `userService.ts` → 1 hit at :18 (`String(item.status || 'ACTIVE')` — read-response display fallback in `mapUser`, not the create path).
- `frontend/src/pages/UsersPage.tsx` — create payload in `handleSubmit` includes `status: values.status`; Form `initialValues={{ status: 'active' }}` (:438) (spec: default ACTIVE on create, selection is sent and stored).
- **Observation (non-blocking):** `User.java` retains the pre-existing field initializer `private UserStatus status = UserStatus.ACTIVE;` (entity default). It cannot leak into the admin-create path because `create()` unconditionally overwrites via :431; the initializer only serves non-admin construction paths (e.g., F-271 self-registration, out of scope). Per-oracle criterion "no hardcoded ACTIVE in the create path" is satisfied.

### 2.2 AC-001-15 — Create form 11-field order — **PASS**

Observed DOM/JSX order of `Form.Item`s in the create drawer (`UsersPage.tsx`, Form block :439-475):

| # (oracle) | Field | Evidence | Required (create) |
|---|---|---|---|
| 1 | username | `UsersPage.tsx:441` (`name="username"`, create-only) | ✅ |
| 2 | password | `UsersPage.tsx:442` (`name="password"`, Input.Password, create-only) | ✅ |
| 3 | orgUnit | `UsersPage.tsx:444` (`name="orgUnitId"`, OrgUnitTreeSelect) | ✅ |
| 4 | email | `UsersPage.tsx:451` | ✅ |
| 5 | fullName | `UsersPage.tsx:452` | ✅ |
| 6 | phone | `UsersPage.tsx:453` | ❌ |
| 7 | address | `UsersPage.tsx:454` | ❌ |
| 8 | department | `UsersPage.tsx:456` (Col md=12, paired row) | ✅ (create only) |
| 9 | position | `UsersPage.tsx:457` (Col md=12, paired row) | ✅ (create only) |
| 10 | status | `UsersPage.tsx:460-466` (Select, both create+edit) | ✅ |
| 11 | note | `UsersPage.tsx:474` (Input.TextArea) | ❌ |

- Order is exactly 1–11 per the §10.1 done_oracle; status (10) precedes note (11); the only two-column pairing is department+position (adjacent 8–9).
- Labels Vietnamese (Tên đăng nhập, Mật khẩu, Đơn vị trực thuộc, Email, Họ và tên, Số điện thoại, Địa chỉ, Phòng ban, Chức vụ, Trạng thái, Ghi chú); `spaceFormField` margins, `radiusPill`/`height: 40` on inputs (BR-001-22, §9 Usability).

### 2.3 AC-001-16 — Missing status blocked at UI + API — **PASS** (static)

- UI rule: `UsersPage.tsx:459-462` — status `Form.Item` has `rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}` → `form.validateFields()` in `handleSubmit` blocks submission with that message and no API call.
- API: `CreateUserRequest.java:43-44` — `@NotNull(message = "Vui lòng chọn trạng thái") private UserStatus status;` → `UserController.java:134` `create(@Valid @RequestBody CreateUserRequest request)` turns a missing/null status into HTTP 400 before any write.
- No service-side default fallback exists (design D1: `request.getStatus()` used directly at :431).
- **Coverage limit:** verified by code read-back only; the interactive browser path (clear Select → submit → inline error, network tab empty) was not executed (no server start per project rule). The API 400 path is structurally guaranteed by `@Valid` + `@NotNull`.

### 2.4 AC-001-17 — 4 profile fields persist and return — **PASS**

- Entity: `User.java:82` `address`, `:89` `department`, `:96` `position`, `:103` `note` — all `@Size` + `@Column(length=…)` (255/100/100/500), no `@NotNull`/`nullable=false` → nullable (BR-001-20).
- Create: `UserService.java:432-435` — `user.setAddress(trimToNull(request.getAddress()))`, same for department/position/note.
- Update: `UserService.java:497-500` — guarded (`if (request.getX() != null)`) null-means-skip semantics preserved.
- Trim→NULL: `UserService.java:887-891` — `trimToNull` trims and returns `null` for blank.
- Responses: `UserResponse.java:28-31` fields; `:78-81` positional constructor passes `user.getAddress()/getDepartment()/getPosition()/getNote()`. `UserDetailResponse` declares `address/department/position/note` and `from()` maps them (`response.address = user.getAddress(); … response.note = user.getNote();`) — class is `@JsonInclude(NON_NULL)` (BR-001-20: null omitted from JSON).
- Frontend: `userService.ts:31-34` `mapUser` maps the 4 fields (`?? undefined`); `create()` :98-101 sends them; `update()` :110-113 sends them. `types/user.ts` — `User` +4 optional fields; `CreateUserPayload.status: Status` +4; `UpdateUserPayload.status?` +4.
- **Coverage limit:** persistence was verified by read-back of the mapping chain; no live POST/PUT/GET against a DB was executed (backend never started).

### 2.5 AC-001-18 — Edit form pre-populates 4 fields + status; save persists — **PASS**

- `UsersPage.tsx:111-114` — `openEditModal` does `form.setFieldsValue({ fullName, email, phone, orgUnitId, status, address, department, position, note })` — all 4 new fields + status pre-populated (previously only fullName/email/phone/orgUnitId/status per spec §12).
- Edit drawer = the same Form block minus username/password (create-only wrapper `{!editingUser && …}` at :440-443); department/position required only on create (`required: !editingUser`, :456-457).
- Save path: `UsersPage.tsx:123-131` — update payload sends `status: values.status` + the 4 trimmed fields (`values.address?.trim() || undefined` …); `UserService.update()` (:468) persists status via `changeStatus` with audit note (:471-472) and the 4 guarded mappings (:497-500).
- **Coverage limit:** pre-population verified by read-back; interactive save not executed (no runtime UI probe).

### 2.6 AC-001-19 — Detail drawer shows 4 fields, null → "—" — **PASS**

- `UsersPage.tsx:635-638` — rows `['Địa chỉ', detailUser.address || '—']`, `['Phòng ban', detailUser.department || '—']`, `['Chức vụ', detailUser.position || '—']`, `['Ghi chú', detailUser.note || '—']` — inserted immediately after `['Số điện thoại', detailUser.phone || '—']` (:634), matching design D10 exactly.
- `UsersPage.tsx:641` — `Trạng thái` rendered as a badge (`status-badge` class + `STATUS_LABEL` mapping, e.g. Hoạt động/Không hoạt động).
- **Deviation from oracle (observation only, not a failure):** spec §10.3's illustrative row order lists Trạng thái before Đơn vị trực thuộc; the implementation renders Đơn vị trực thuộc / Nhóm nghiệp vụ before Trạng thái. Design D10 explicitly requires only "insert 4 rows after Số điện thoại; existing rows kept", which is satisfied; the illustrative §10.3 order was not pinned as an acceptance assertion in the wave-1 oracle.

### 2.7 AC-001-20 — Flyway migration: 4 nullable columns — **PASS**

- `src/main/resources/db/migration/V20260814120000__add_user_profile_columns.sql` exists and contains exactly (verbatim, matches design §4):
  - `ALTER TABLE app_users ADD COLUMN address VARCHAR(255) NULL;`
  - `ALTER TABLE app_users ADD COLUMN department VARCHAR(100) NULL;`
  - `ALTER TABLE app_users ADD COLUMN position VARCHAR(100) NULL;`
  - `ALTER TABLE app_users ADD COLUMN note VARCHAR(500) NULL;`
- All 4 columns nullable (`NULL`), no default, no index; PostgreSQL syntax matching the ground-truth migration directory (design §4 / risk R1); no `ddl-auto` involvement (BR-001-21).
- **Coverage limit:** script content verified by direct read; runtime application by Flyway (startup or `flyway migrate`) was not executed (backend never started per project rule) — the design §4 verification query (`information_schema.columns` … `is_nullable = YES`) remains for a runtime pass.

## 3. Deviation and risk log

| # | Item | Severity | Disposition |
|---|---|---|---|
| D1 | Detail-row order: Trạng thái after Đơn vị/Nhóm (vs §10.3 illustrative order) | Info | Pre-existing rows kept per D10; 4 new rows inserted exactly where D10 requires; not an acceptance failure |
| D2 | Entity field default `status = UserStatus.ACTIVE` still present | Info | Always overwritten by `create()` :431 on the admin path; only affects non-admin construction (F-271, out of scope) |
| R2 | F-271 self-registration may POST to `/api/users` without `status` → now 400 | Watch | Design §11 R2: `CreateUserRequest` consumed only by `UserController.create`; verify the F-271 registration payload in its own flow before release |
| R5 | `CreateUserRequest.password` `@Size(min=6)` vs frontend rule min 8 | Watch | Pre-existing (design §11 R5), out of scope |

## 4. Coverage limits (what was NOT verified)

- No browser/Vite runtime probe (AC-15/16/17/18/19 UI interactions) — backend never started (AGENTS.md project rule); a running-surface pass requires a live probe in a later wave.
- No live DB: Flyway application and the 4-column nullability were verified at script level only; no `information_schema` query executed.
- `npm test` and `pnpm exec tsc --noEmit` were not part of this dispatch's DoD (DoD = `mvn clean compile` + `npm run build`, both executed and green); they remain listed in design WO-02 acceptance for a follow-up pass.
- Static read-back verifies wiring, not runtime behavior; every PASS above is grounded in the quoted file:line anchors.

## 5. Conclusion

All six canonical acceptance criteria (AC-001-12/15/16/17/18/20) PASS by code read-back against the wave-1 oracle, with the detail-drawer case (AC-001-19) also PASS. Both DoD commands executed with exit 0 (`mvn compile` → BUILD SUCCESS; `npm run build` → built in 789ms). No source file was modified during this validation; the only file written this session is this report.
