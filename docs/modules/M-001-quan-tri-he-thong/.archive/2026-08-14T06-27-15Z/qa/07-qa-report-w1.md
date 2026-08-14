# QA Report — Wave 1 (Acceptance Oracle) — F-001 Quản lý tài khoản người dùng

- **Triage:** TRI-1786681457834-5887 (scope_expansion, C3)
- **Module / Feature:** M-001 Quản trị hệ thống / F-001 Quản lý tài khoản người dùng
- **Stage:** Engineering QA — acceptance oracle (authored BEFORE wave-1 implementation; executable in wave-2)
- **Date authored:** 2026-08-14
- **Execution status:** NOT EXECUTED — this document is the pre-implementation oracle. No test was run while authoring it (per dispatch instruction). Every case below is executable in wave 2 with the stated oracles.

## 1. Scope of this oracle

One test case per acceptance criterion of the expansion, derived from the BA lean spec (AC-001-12/15/16/17/18/20, BR-001-19..22) and the design plan work orders (WO-01 backend, WO-02 frontend):

| Case ID | Canonical AC | Brief label (dispatch) | Behavior under test | Source anchors |
|---|---|---|---|---|
| TC-AC-001-12 | AC-001-12 (Critical) | AC-12 | Create with `status=INACTIVE` stores INACTIVE (status from form, not hardcoded ACTIVE) | spec §5 AC-001-12, BR-001-19; design D1, §8 row |
| TC-AC-001-15 | AC-001-15 (Critical) | AC-15 | Create form renders the exact 11-field order | spec §10.1 oracle, BR-001-22; design §6.3 table, D9 |
| TC-AC-001-16 | AC-001-16 (Critical) | — (success-criteria list) | Missing status on create → validation error, no API call, no account | spec §5 AC-001-16, BR-001-19; design D1/D6, §8 row |
| TC-AC-001-17 | AC-001-17 (Major) | AC-16 | 4 new fields persist via API and return in `UserResponse`/`UserDetailResponse` | spec §5 AC-001-17, BR-001-20; design §5.1–5.6, §8 row |
| TC-AC-001-18 | AC-001-18 (Major) | AC-17 | Edit form pre-populates + shows the 4 fields + status; save persists | spec §5 AC-001-18, §10.2; design D9, §6.3 edit drawer |
| TC-AC-001-19 | AC-001-19 (Major) | AC-18 (detail drawer) | Detail drawer shows the 4 fields (+ status), null → "—" | spec §5 AC-001-19, §10.3; design D10, §6.3 detail rows |
| TC-AC-001-20 | AC-001-20 (Critical) | AC-20 | Flyway migration adds 4 nullable columns to `app_users` | spec §5 AC-001-20, BR-001-21; design §4 |

> **Coverage map (dispatch brief ↔ canonical numbering):** the dispatch brief's labels "AC-16 4 fields persist", "AC-17 edit form", "AC-18 detail drawer" correspond to spec AC-001-17, AC-001-18, AC-001-19 respectively (design plan §8 confirms the canonical mapping). The six required cases are keyed to canonical AC-001-12/15/16/17/18/20; the detail-drawer case is carried as TC-AC-001-19 because the dispatch brief explicitly requires that behavior. No coverage from the brief is dropped.

## 2. Shared test data and environment

- **Stack under test:** Spring Boot (Maven) backend + React/AntD frontend (Vite). API base `http://localhost:8080/api` (controller maps both `/api/users` and `/api/v1/users`; lean spec §8, `UserController.java:44`).
- **Auth:** Admin (system-admin) bearer token with `user.create` / `user.edit` / `user.manage` resource fallback. RBAC strings unchanged by this expansion (design §12).
- **Migration:** `src/main/resources/db/migration/V20260814120000__add_user_profile_columns.sql`, PostgreSQL dialect (design §4; note R1: spec frontmatter says MSSQL but the ground-truth migration directory is PostgreSQL).
- **Field vocabulary:** API/DB English (`address`, `department`, `position`, `note`, `status`); UI labels Vietnamese (Địa chỉ, Phòng ban, Chức vụ, Ghi chú, Trạng thái) — BR-001-22.
- **Status vocabulary:** form values `active`/`inactive` (Hoạt động / Không hoạt động); API values `ACTIVE`/`INACTIVE`; only these two selectable at creation (design D6, AMBIGUITY-001).
- **Seeded org unit:** one active org unit UUID `org-uuid-seed` for create cases.
- **Distinct emails/usernames** per created user (unique constraints unchanged).

---

## TC-AC-001-12 — Create with `status=INACTIVE` stores INACTIVE (status from form)

- **AC:** AC-001-12 (Critical, BR-001-19)
- **Type:** UI + API (positive; both status branches)
- **Precondition:**
  - Backend compiled with `CreateUserRequest.status` (`@NotNull`, message "Vui lòng chọn trạng thái") and `UserService.create()` doing `user.setStatus(request.getStatus())` (design D1); migration applied.
  - Admin logged in with `user.create`; valid org unit exists; email unique; no approval step exists on direct create.
  - Frontend `create()` no longer sends a hardcoded `status: 'ACTIVE'` literal (`frontend/src/services/userService.ts:98` replaced, design WO-02 task 2).
- **Steps:**
  1. Open Quản lý tài khoản → click "Thêm mới" → drawer opens.
  2. Fill required fields (username `qa.inactive.01`, password meeting policy, org unit, email unique, fullName) and set Trạng thái Select = **"Không hoạt động"** (inactive).
  3. Click "Tạo mới" → observe toast.
  4. Call `GET /api/users/{id}` of the created user → read `status`.
  5. Repeat steps 1–4 with Trạng thái = **"Hoạt động"** (active) for a second user (`qa.active.01`).
  6. (API-only negative of the hardcode removal) `grep` both `frontend/src/services/userService.ts` and `src/main/java/com/hanghai/kchtg/user/service/UserService.java` for a `status: 'ACTIVE'` literal / `user.setStatus(UserStatus.ACTIVE)` in `create()`.
- **Expected result:**
  - User `qa.inactive.01` is created with `status=INACTIVE`; `GET /api/users/{id}` returns `"status": "INACTIVE"` and the UI badge reads "Không hoạt động".
  - User `qa.active.01` is created with `status=ACTIVE` ("Hoạt động").
  - No approval/PendingApproval state is produced by either direct create.
  - No `status: 'ACTIVE'` hardcode remains in the FE create path; `UserService.create()` contains no `setStatus(UserStatus.ACTIVE)`.
- **Pass/fail criteria:**
  - **PASS** iff both created users' stored/returned status equals the form selection (INACTIVE and ACTIVE respectively) AND no hardcoded-ACTIVE literal remains in the two anchors.
  - **FAIL** if either user is stored ACTIVE despite selecting INACTIVE, if the create path still hardcodes ACTIVE anywhere, or if an approval step is triggered.
- **Evidence to record:** created user IDs, GET `/api/users/{id}` status values, grep results (file, line, hit count).

## TC-AC-001-15 — Create form renders the exact 11-field order

- **AC:** AC-001-15 (Critical, BR-001-22)
- **Type:** UI (structure inspection)
- **Precondition:** Frontend running in Vite dev; admin logged in with `user.create`; create drawer openable.
- **Steps:**
  1. Open "Thêm mới" drawer.
  2. Enumerate the visible `Form.Item` controls in DOM order (top to bottom), recording the `name`/label of each.
  3. Compare the sequence against the done_oracle order: 1 username, 2 password, 3 orgUnit, 4 email, 5 fullName, 6 phone, 7 address, 8 department, 9 position, 10 status, 11 note (spec §10.1 / design §6.3).
  4. Check labels: Tên đăng nhập, Mật khẩu, Đơn vị trực thuộc, Email, Họ và tên, Số điện thoại, Địa chỉ, Phòng ban, Chức vụ, Trạng thái, Ghi chú (Vietnamese, BR-001-22).
  5. Check required markers: username, password, orgUnit, email, fullName, department, position, status required; phone, address, note optional (design §6.3). Department/position required **on create only** (AMBIGUITY-002/D5).
  6. Check controls: orgUnit = TreeSelect (value = `orgUnitId`), status = Select (options active/inactive), note = `Input.TextArea`; `spaceFormField`/`radiusPill`/`height: 40` conventions (design §6.3).
- **Expected result:** DOM order is exactly 1–11 with no extra input control interleaved; the only allowed two-column pairing is department+position (adjacent 8–9) preserving relative order; labels and required markers match the oracle.
- **Pass/fail criteria:**
  - **PASS** iff the observed order equals 1–11 exactly (including position 10 status BEFORE 11 note) and required/optional flags match.
  - **FAIL** on any deviation (e.g. status rendered before position, note before status, orgUnit after email, or an extra control between items).
- **Evidence to record:** ordered list of observed Form.Item names with DOM indexes; screenshot (optional); mismatch diff.

## TC-AC-001-16 — Missing status on create → validation error, no API call

- **AC:** AC-001-16 (Critical, BR-001-19)
- **Type:** UI (negative) + API (negative)
- **Precondition:** Create drawer open (frontend); backend with `CreateUserRequest.status` `@NotNull`; admin token for the API probe.
- **Steps:**
  1. (UI) Fill all create fields but leave Trạng thái empty → click "Tạo mới".
  2. Observe form validation message and the network tab.
  3. Confirm no account was created: `GET /api/users` page count unchanged (or the intended username absent).
  4. (API) `POST /api/users` WITHOUT the `status` field, all other fields valid → read HTTP status and error body.
  5. (API) `POST /api/users` with `status` present but null (`"status": null`) → read HTTP status.
- **Expected result:**
  - UI: inline error "Vui lòng chọn trạng thái" under Trạng thái; **no** POST request issued (network tab); no user created.
  - API: 400 with message "Vui lòng chọn trạng thái" (via `@Valid` on `UserController.create`, design D1); no row written.
  - No default-status fallback exists in `UserService.create()` (design D1 rejected a service-side default).
- **Pass/fail criteria:**
  - **PASS** iff the UI blocks submission with the exact message and no API call, AND the backend returns 400 for both missing and null status with no write.
  - **FAIL** if a user is created with any default status (e.g. ACTIVE), if the UI submits without error, or if the backend returns 2xx.
- **Evidence to record:** UI error text, network-tab capture, HTTP status + body for both API probes, user-count before/after.

## TC-AC-001-17 — 4 new fields persist via API and return in `UserResponse`/`UserDetailResponse`

- **AC:** AC-001-17 (Major, BR-001-20)
- **Type:** API (round-trip, positive + null boundary)
- **Precondition:** Backend with entity fields, DTO fields, and service mappings implemented (design §5.1–5.6); migration applied; admin token.
- **Steps:**
  1. `POST /api/users` with all 4 fields non-empty: `address: "Số 1, đường Hàng Hải"`, `department: "Phòng Quản lý cảng"`, `position: "Chuyên viên"`, `note: "Tài khoản tạo đợt 1"` + `status: "ACTIVE"` + required fields (payload shape per spec §8 example) → 2xx.
  2. `GET /api/users/{id}` → assert the 4 fields are present with the exact values; `GET /api/users/me` under that user (or admin detail) also carries the 4 fields (design D8).
  3. `PUT /api/users/{id}` updating `department` and `note` → `GET /api/users/{id}` reflects new values (null-means-skip semantics preserved for un-sent fields, design S6).
  4. `POST /api/users` a second user with blank/whitespace-only 4 fields (`"   "`) + valid rest → inspect DB row: the 4 columns are `NULL` (trim→NULL, design D4/§7) and the JSON responses **omit** the 4 fields (`@JsonInclude(NON_NULL)`, design §7).
  5. Verify response DTO field names are exactly `address`, `department`, `position`, `note` (English, BR-001-22).
- **Expected result:** exact round-trip of the 4 values through create/update/read; blank input stored as `NULL` and omitted from JSON; un-sent update fields untouched.
- **Pass/fail criteria:**
  - **PASS** iff all three round-trips hold (create → GET detail, PUT → GET detail) AND blank values become DB `NULL` with JSON omission.
  - **FAIL** if any of the 4 fields is lost, renamed, not returned by `UserResponse`/`UserDetailResponse`, or blank stored as empty string instead of `NULL`.
- **Evidence to record:** POST/PUT/GET bodies, DB row values for the 4 columns, JSON keys present/absent.

## TC-AC-001-18 — Edit form pre-populates + shows the 4 fields + status; save persists

- **AC:** AC-001-18 (Major, BR-001-20)
- **Type:** UI
- **Precondition:** A user exists with known profile values (e.g. address "12 Lê Lợi", department "Phòng Kế hoạch", position "Trưởng phòng", note "Hồ sơ cũ") and status INACTIVE; admin logged in with `user.edit`; edit drawer opens via row action "Sửa".
- **Steps:**
  1. Open "Sửa" on that user → drawer renders the edit sequence (create sequence minus username/password; design D9).
  2. Assert `address`, `department`, `position`, `note` inputs are pre-populated with the known values (design §6.3 `openEditModal` must set all 4 — previously only fullName/email/phone/orgUnitId/status).
  3. Assert Trạng thái Select shows the current status (INACTIVE/"Không hoạt động"); assert username is not editable (readonly/absent, spec §10.2).
  4. Change `department` (e.g. "Phòng Vận hành") and save → observe toast "Cập nhật tài khoản thành công".
  5. `GET /api/users/{id}` → assert `department` = new value and the other 3 fields unchanged.
  6. Clear `note` to empty and save → DB `note` = NULL (blank → NULL via `trimToNull`), UI edit drawer shows it empty.
- **Expected result:** pre-population matches current data for all 4 fields + status; save persists the changed field and preserves un-changed ones; blank note clears to NULL.
- **Pass/fail criteria:**
  - **PASS** iff pre-population is complete (4 fields + status) AND the persisted values after save match (changed field updated, others intact, blank → NULL).
  - **FAIL** if any of the 4 fields is missing from the edit form, empty despite stored data, or the save drops/reverts another field.
- **Evidence to record:** pre-populate snapshot, PUT payload, GET detail after save, DB note value.

## TC-AC-001-19 — Detail drawer shows the 4 fields (+ status), null → "—"

- **AC:** AC-001-19 (Major, BR-001-20; the dispatch brief's "AC-18 detail drawer")
- **Type:** UI (read-only)
- **Precondition:** Two users: (a) one with all 4 profile values filled (e.g. from TC-AC-001-17 step 1) and status ACTIVE; (b) one created before the expansion (or with all 4 null). Any logged-in user can open the detail drawer (read-only).
- **Steps:**
  1. Open "Xem chi tiết" for user (a) → read the "Thông tin tài khoản" group.
  2. Assert rows Địa chỉ, Phòng ban, Chức vụ, Ghi chú appear **after** Số điện thoại (design D10/§10.3) with values exactly matching the stored data.
  3. Assert Trạng thái renders as a badge — Hoạt động for ACTIVE.
  4. Open detail for user (b) → assert the 4 rows render "—" for null values (design D10; §9 Usability "4 trường null hiển thị —").
  5. Assert the group is read-only (no inputs); audit/permission groups unchanged (design D10).
- **Expected result:** 4 new rows present with correct values; null → "—" (never empty string); status badge correct; no edit affordance in the drawer.
- **Pass/fail criteria:**
  - **PASS** iff both users show the 4 rows in the right position with correct values, null renders "—", and the status badge matches.
  - **FAIL** if any row is missing, values mismatch, null renders blank/empty instead of "—", or the badge is wrong.
- **Evidence to record:** rows rendered for both users, badge text, screenshot (optional).

## TC-AC-001-20 — Flyway migration adds 4 nullable columns to `app_users`

- **AC:** AC-001-20 (Critical, BR-001-21)
- **Type:** schema / DB
- **Precondition:** A database containing pre-expansion `app_users` rows (data from before this change, or a backup copy); migration file `src/main/resources/db/migration/V20260814120000__add_user_profile_columns.sql` present in the source tree.
- **Steps:**
  1. Inspect the script content: exactly 4 `ALTER TABLE app_users ADD COLUMN ... NULL` statements — `address VARCHAR(255)`, `department VARCHAR(100)`, `position VARCHAR(100)`, `note VARCHAR(500)` — PostgreSQL syntax, no `IF NOT EXISTS`, no `ddl-auto` involvement (design §4; BR-001-21).
  2. Start the backend once (or run `flyway migrate` against the test DB) so Flyway applies the script; note: project rule forbids QA starting the backend for routine checks — apply via the migration runner / a dedicated test DB instance instead, and record which mechanism was used.
  3. Query `flyway_schema_history` → row `V20260814120000` with success.
  4. Query `SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'app_users' AND column_name IN ('address','department','position','note')` → all 4 present, `is_nullable = YES`.
  5. Select pre-existing rows → the 4 columns contain `NULL` (no backfill, no data loss, BR-001-20).
  6. Confirm no other migration/`ddl-auto` adds or alters these columns.
- **Expected result:** 4 columns exist and are nullable; pre-existing rows have `NULL`; script applied exactly once.
- **Pass/fail criteria:**
  - **PASS** iff all 4 columns exist with `is_nullable = YES`, pre-existing data is intact with `NULL` in the new columns, and the history row records success.
  - **FAIL** if any column is missing or NOT NULL, if the script is absent/syntactically invalid, or if existing data was altered/backfilled.
- **Evidence to record:** script content, `flyway_schema_history` row, `information_schema` query result, sample pre-existing row values.

## 3. Cross-cutting checks (non-blocking watch items)

| # | Item | Anchor | Watch |
|---|---|---|---|
| W1 | `/me` self-edit policy for the 4 fields not granted by spec (D8) | design §11 R3 | Only admin `update()` writes the 4 fields; if `/me` PUT accepts them, flag — not a fail of any AC above |
| W2 | F-271 self-registration posts to the same `/api/users` without `status` | design §11 R2 | The 400 path of TC-AC-001-16 is expected; confirm F-271 sends `status` or is unaffected — QA wave re-checks |
| W3 | `CreateUserRequest.password` `@Size(min=6)` vs FE min 8 (pre-existing) | design §11 R5 | Out of scope; report-only |
| W4 | Search-split FilterBar must remain untouched (2 search inputs + status/orgUnit filters) | spec §10.4, AC-001-07 | Visual regression check in wave 2; any change is a regression finding |

## 4. Verification commands for wave 2 (per triage + design)

- Backend: `mvn -DskipTests compile` (triage verification command; project rule: never start the backend).
- Frontend: `pnpm exec tsc --noEmit` and `npm test` from `frontend/` (design WO-02).
- UI probes: Vite dev against the running backend for TC-AC-001-15/16/18/19; API probes for TC-AC-001-12/16/17.
- All results must be recorded with exact command, exit code, and observed output before any wave-2 verdict is issued. This oracle itself was authored without executing any test.
