# QA Report — Wave 2: F-001 Search-split (2 input search: email/username + họ tên)

**Module:** M-001 — Quản trị hệ thống
**Feature:** F-001 — Quản lý tài khoản người dùng (bộ lọc danh sách)
**Triage:** `TRI-1786680781355-486b` (change_class C2, change_type business_rule)
**QA seat:** engineering-qa-engineer (verify seat — read-only on all sources)
**Date:** 2026-08-14
**Oracle sources:** `docs/intel/_intake/TRI-1786680781355-486b.json` (done_oracle), `docs/modules/M-001-quan-tri-he-thong/ba/00-lean-spec.md` (AC-001-15..19, BR-001-07..11, API contract §5)

---

## 1. Verdict summary

| AC | Criterion (short) | Verdict | Primary evidence |
|---|---|---|---|
| AC-001-15 | Filter renders 2 separate inputs (email/username + họ tên) | **PASS** | `UsersPage.tsx:352-355`, `:360-363`, `:46-49`, `:197-213` |
| AC-001-16 | `:search` matches email OR username only (contains, case-insensitive, no fullName) | **PASS** | `UserRepository.java:134-135` (all 5 queries: `:134-135, :146-147, :159-160, :175-176, :191-192`) |
| AC-001-17 | `:fullName` matches fullName accent-insensitively via `toSearchLike` | **PASS** | `UserService.java:352-361` (`toSearchLike`), `:215`; `UserRepository.java:137,149,162,178,194` |
| AC-001-18 | search+fullName AND-combine with status+orgUnit; statusCounts on SAME combined filter | **PASS** | `UserService.java:214-223`, `:228`, `:261-281`; `UserRepository.java:132-138` |
| AC-001-19 | Whitespace input = no filter (`.trim()`); empty result → empty state + zero counts | **PASS** | `userService.ts:63-64`; `UserService.java:353-355`; `UsersPage.tsx:327-333` |
| API §5 | `fullName` query param wired end-to-end, `user:read` preserved | **PASS** | `UserController.java:85-86`, `:101`; `useUsers.ts:10-13,19-25`; `UsersPage.tsx:94-97` |

**Overall: PASS — all 5 acceptance criteria (AC-001-15..19) and the API-contract §5 checks verified by direct source read-back with file:line anchors. Both DoD commands executed and green. No defects found in the F-001 search-split scope.**

---

## 2. Verification commands — REAL output (executed this session)

### 2.1 `mvn clean compile` (repo root `D:\project\hang-hai-kchtgt`) — **exit code 0, BUILD SUCCESS**

```
[INFO] --- compiler:3.13.0:compile (default-compile) @ kchtg ---
[INFO] Recompiling the module because of changed source code.
[INFO] Compiling 1098 source files with javac [debug parameters release 17] to target\classes
[INFO] BUILD SUCCESS
[INFO] Total time:  26.843 s
[INFO] Finished at: 2026-08-14T11:59:49+07:00
```

Non-blocking warnings observed (no impact on the gate): deprecated API in `LogService.java`; Lombok equals/hashCode notes on 3 entity classes; itext7 artifact relocation notice.

### 2.2 `npm run build` (frontend/) — **exit code 0**

```
> frontend@0.0.0 build
> vite build
vite v8.1.5 building client environment for production...
✓ 4033 modules transformed.
✓ built in 940ms
```

Non-blocking warning: `(!) Some chunks are larger than 500 kB after minification` (chunk-size advisory; exit code 0 — same warning class reported by the prior frontend-dev run).

### 2.3 Supplementary gate: `npx tsc --noEmit` (frontend/) — **exit code 0, no errors**

Run because `vite build` does not typecheck. Note: `tsc` is not on PATH; resolved via `npx` against local `typescript ~6.0.2` (declared in `frontend/package.json`).

### 2.4 Unit tests — NOT executed (pre-existing gap, see §5 Finding F-2)

`frontend/package.json` declares no `test` script and no vitest/jest in devDependencies (scripts: dev/build/lint/preview/e2e/e2e-ui; devDeps: eslint, playwright, vite, typescript, typescript-eslint...). The two candidate suites for touched files are stale (see Finding F-2) and their runner is not installed.

---

## 3. Per-AC verification (direct code read-back)

### AC-001-15 — PASS — Filter renders TWO separate search inputs

- Independent state pairs: `UsersPage.tsx:46` `const [searchInput, setSearchInput] = useState('')`, `:47` `const [search, setSearch] = useState('')`, `:48` `const [fullNameInput, setFullNameInput] = useState('')`, `:49` `const [fullName, setFullName] = useState('')` — two independent input state channels.
- Input 1: `UsersPage.tsx:352-355` — `<Input placeholder="Tìm theo email / tên đăng nhập" allowClear value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onPressEnter={handleFilterApply} style={{ borderRadius: radiusPill, height: 40 }} />` (tokens used; no hardcoded radius).
- Input 2: `UsersPage.tsx:360-363` — `<Input placeholder="Tìm theo họ tên" allowClear value={fullNameInput} onChange={(e) => setFullNameInput(e.target.value)} onPressEnter={handleFilterApply} ... />`.
- Typing in one input only mutates its own state (`:354` vs `:362`), so one field does not affect the other. Both are combined only at apply time in `handleFilterApply` (`UsersPage.tsx:198-199`: `const nextSearch = searchInput.trim(); const nextFullName = fullNameInput.trim();`).

### AC-001-16 — PASS — `search` matches email OR username only (contains, case-insensitive, no fullName)

All five repository queries were split so the `:search` branch matches **only** `u.email` OR `u.username`; `u.fullName` appears **only** in the separate `:fullName` branch:

| Query | search branch (email OR username) | fullName branch |
|---|---|---|
| `countUsersByStatus` | `UserRepository.java:134-135` | `:137` |
| `countUsersByStatusAndOrgUnits` | `:146-147` | `:149` |
| `searchUsers` | `:159-160` | `:162` |
| `searchUserList` | `:175-176` | `:178` |
| `searchUserListByOrgUnits` | `:191-192` | `:194` |

- **No fullName in search**: a 15-match grep over `LOWER(u.email|u.username|u.fullName)` shows all email/username predicates bind to `CAST(... LIKE CAST(:search ...)`, and all fullName predicates bind to `:fullName`. The pre-change seam (`UserRepository.java:155` baseline: `fullName ... LIKE :search`) is gone.
- **Contains**: `toSearchLike` wraps the keyword in `%...%` (`UserService.java:360`).
- **Case-insensitive**: `LOWER(u.email)`/`LOWER(u.username)` (`:134-135`) + input lowercased in `toSearchLike` (`:356`). The lean spec §5 note confirms `toSearchLike` on the ASCII email/username fields is a superset of case-insensitivity.
- **Negative case (AC-16's "Nguyễn Văn An must NOT appear for search=NGUYEN"):** with no fullName predicate in the `:search` branch, users matching only their họ tên are excluded from `search` results. (Note: an email that literally contains "nguyen" still matches — that is the intended email OR username semantics.)

### AC-001-17 — PASS — `fullName` matches fullName accent-insensitively via `toSearchLike`

- `UserService.java:352-361` — `toSearchLike(String keyword)`: `null/trim-empty → null` (`:353-355`); else `Normalizer.normalize(keyword.trim().toLowerCase(Locale.ROOT), NFD)` + strip `\p{M}+` + `đ→d` (`:356-359`); return `"%" + normalized + "%"` (`:360`). Doc comment `:347-348`: *"Kết quả vẫn dùng LIKE chứa nên \"Van A\" khớp \"Nguyễn Văn An\""*.
- Wired in: `UserService.java:215` `String fullNameLike = toSearchLike(fullName);` → passed to `searchUserList`/`searchUserListByOrgUnits` (`:222-223`).
- Repository branch (all 5 queries, e.g. `:137`): `CAST(function('immutable_unaccent', LOWER(u.fullName)) AS string) LIKE CAST(:fullName AS string)`. Diacritics are stripped on BOTH sides — stored name via `immutable_unaccent`, input via `toSearchLike` — so no-diacritics input `"van a"` matches diacritic name `"Nguyễn Văn An"`, and accented input `"nguyễn văn an"` normalizes to the same form.
- Split-assertion (AC-17: "van a" in ô 1 yields nothing): the `:search` branch has no fullName predicate (AC-16 evidence), so họ tên matches cannot leak into the email/username input.

### AC-001-18 — PASS — search ∧ fullName ∧ status ∧ orgUnit AND-combine; statusCounts on the SAME combined filter

- **AND combination in SQL**: every query ANDs `(:search … OR …)` ∧ `(:fullName … OR …)` ∧ `u.deletedAt IS NULL` ∧ `(:status IS NULL OR u.status = :status)` (list queries, e.g. `:173-174,177-179`) ∧ `u.orgUnit.id IN :orgUnitIds` (ByOrgUnits variants, e.g. `:196`). Missing param → branch skipped via `IS NULL OR = ''` guards (`:132-133, :136`), satisfying BR-001-09.
- **List path**: `UserService.java:214-216` (`searchLike`, `fullNameLike`, `resolveOrganizationFilter(orgUnitId)`) → `:222-223` repository calls with `(searchLike, fullNameLike, status, [organizationFilter], pageable)`.
- **Count path — SAME combined filter**: `UserService.java:228` `counts = getStatusCounts(search, fullName, organizationFilter)` — same raw search, same fullName, same org-unit filter as the list. The private method (`:261-281`) recomputes both LIKE params (`:275-276`) and calls `countUsersByStatus(searchLike, fullNameLike)` (`:278`) or `countUsersByStatusAndOrgUnits(searchLike, fullNameLike, organizationFilter)` (`:279`).
- **Table total matches tabs**: `UserService.java:229-231` — `totalElements = status == null ? counts["total"] : counts[status.name().toLowerCase()]`, i.e. the table's total comes from the same counts map as the tabs. Intent documented at `:230-232`: *"The status tabs must describe the same filtered result set as the table."*
- **Tab totals invariant (BR-001-10)**: count queries `GROUP BY u.status` with no status predicate (`:126-140`), and `counts.put("total", total)` sums the per-status rows (`:285-287`) → "Tất cả" = sum of the other tabs, all under the combined search+fullName+orgUnit filter (not whole-DB counts while searching).
- **Out-of-scope org → zero**: empty `organizationFilter` short-circuits to `emptyUserPage` + `getEmptyStatusCounts` (all zeros) (`UserService.java:218-220`, `:262-264`), so tabs and table agree on 0.

### AC-001-19 — PASS — whitespace treated as no-filter; empty result → empty state + zero counts

- **Frontend trim**: `userService.ts:63-64` — `search: params.search?.trim() || undefined`, `fullName: params.fullName?.trim() || undefined` — whitespace-only values become `undefined` and are omitted from the request (BR-001-11).
- **Apply-time trim**: `UsersPage.tsx:198-199` trims both inputs in `handleFilterApply` before promoting them to applied filters; `handleFilterReset` clears both channels (`:217-220`).
- **Backend guard**: `toSearchLike` returns `null` for null/whitespace (`UserService.java:353-355`); repository `IS NULL OR = ''` guards skip the branch (`:132-133, :136`), so an empty keyword never narrows the result and never errors.
- **Empty result**: `UsersPage.tsx:327-329` — `emptyDescription = search || fullName || filterStatus || filterOrganizationId ? 'Không tìm thấy người dùng nào phù hợp' : 'Chưa có người dùng nào'` (includes `fullName` in the filter-awareness check); `EmptyState` rendered when `tableData.length === 0` (`:330-333`). Backend zero path returns `statusCounts` with `total: 0` (`getEmptyStatusCounts`, `UserService.java:263-272`), consumed by the "Tất cả" tab (`UsersPage.tsx:382` `count: statusCounts?.total ?? (data?.total || 0)`).

### API contract §5 (supporting checks) — PASS

| Contract point | Evidence |
|---|---|
| `GET /api/v1/users` (+ alias `/api/users`) | `UserController.java:45` `@RequestMapping({"/api/users", "/api/v1/users"})` |
| New optional param `fullName` | `UserController.java:86` `@RequestParam(required = false) String fullName` (alongside `search` at `:85`) |
| Params forwarded to service | `UserController.java:101` `userService.findAllWithCounts(search, fullName, status, orgUnitId, pageable)` |
| Permission `user:read` | `UserController.java:84` `@PreAuthorize("@auth.check(authentication, 'user:read')")` |
| Frontend sends both params | `userService.ts:63-64` (`search`, `fullName`), `:65-70` (`status` uppercased, `orgUnitId`, paging) |
| Hook contract | `useUsers.ts:10-13` `ListParams { search?, fullName?, status?, orgUnitId?, ... }`; `:19-25` `useQuery({ queryKey: ['users', params], queryFn: () => userService.list(params), ... })` |
| Page wiring | `UsersPage.tsx:94-97` `useUsers({ page, pageSize, search: search || undefined, fullName: fullName || undefined, status: filterStatus, orgUnitId: filterOrganizationId, sortField, sortOrder })` |
| Response shape unchanged | `UserService.java:233-240` — `UserPageResponse(content, page, size, totalElements, totalPages, counts)` |

---

## 4. Verification coverage statement

**Covered (executed or direct read with file:line anchor):**
- All 5 ACs + API §5 — direct source read-back this session (files listed in §3).
- `mvn clean compile` (repo root) — executed, exit 0.
- `npm run build` (frontend/) — executed, exit 0.
- `npx tsc --noEmit` (frontend/) — executed, exit 0 (supplementary; vite build does not typecheck).

**Not covered (stated honestly):**
- No runtime/DB probe: the work order's verification commands are build-only, and the project rules prohibit starting the Spring Boot backend (AGENTS.md). Accent-insensitivity and LIKE/`immutable_unaccent` semantics are verified by code read of the double-normalization chain (input `toSearchLike` + column `immutable_unaccent`), not by a live query. If a runtime confirmation is required, it needs a separate dispatched run with a test DB.
- Unit test suites: not executed — no test runner declared (`frontend/package.json` has no `test` script; vitest/jest absent from devDependencies). The two candidate suites are stale (Finding F-2).

**Spot-check (per evidence contract):** the highest-risk negative claim — AC-16's "no `fullName` inside the `:search` branch" — was re-verified by a dedicated 15-match grep over `LOWER(u.email|u.username|u.fullName)` across the repository: all 10 email/username predicates bind to `:search`, all 5 fullName predicates bind to `:fullName`. Claim holds.

---

## 5. Findings

### F-1 (Info, pre-existing, outside this change's footprint)
`UsersPage.tsx:213` — `handleFilterApply` deps array omits `filterStatus`/`filterOrganizationId`-related pairs that eslint's react-hooks would flag (reported by the prior frontend-dev run as pre-existing at `UsersPage:215`; the line moved to 213 after this change). It is a lint-debt note, not a functional defect for this scope (applied values are read via state setters, and `refetch()` is called explicitly for the same-filter case). No eslint gate exists in the DoD.

### F-2 (Info, pre-existing, outside this change's footprint)
`frontend/src/hooks/useUsers.test.ts` and `frontend/src/services/userService.test.ts` are **stale suites**: they import `vitest`/`@testing-library/react` (not installed — no runner declared in `frontend/package.json`) and test an obsolete API surface — `getAllUsers`, `searchUsers` (with a `keyword` param), `bulkActivate`, `bulkDeactivate`, `selectedUser`, `totalItems`, `fetchUsers` — **none of which exist in the current implementation** (grep: `userService.ts` exports `list` at `:50-51` and `getById` at `:84`; `useUsers.ts:19` is the only hook export). They would fail immediately against the current code regardless of F-001 and are unrelated to this change (the react-query rewrite predates the search-split). Owned by: PMO/dev for cleanup or rewrite.

---

## 6. Artifacts

- This report: `docs/modules/M-001-quan-tri-he-thong/qa/07-qa-report-w2.md`
- Oracle inputs: `docs/intel/_intake/TRI-1786680781355-486b.json`, `docs/modules/M-001-quan-tri-he-thong/ba/00-lean-spec.md` (AC-001-15..19 / BR-001-07..11 / API §5)

No source files were modified by this seat (read-only verification).
