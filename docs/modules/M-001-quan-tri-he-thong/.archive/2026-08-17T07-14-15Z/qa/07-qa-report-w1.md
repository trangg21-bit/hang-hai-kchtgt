# QA Wave-1 Report — Acceptance Oracle (NOT executed) — TRI-1786936397148-3956 · "Cấp đơn vị" (`rank`) on F-003 org-unit

| Field | Value |
|---|---|
| Triage | `TRI-1786936397148-3956` (change_class `C3`; one-way door `src/main/resources/db/migration/V20260817100000__add_org_unit_rank.sql`) |
| Module / Feature | `M-001-quan-tri-he-thong` / `F-003-quan-ly-don-vi` |
| Stage | `engineering-qa-engineer` — wave 1 (pre-implementation) |
| Date | 2026-08-17 |
| Status | **ORACLE ONLY — NOT EXECUTED.** No tests/build were run: the implementation does not exist yet (wave 2 will implement, wave 2 QA + code-reviewer execute this oracle). |
| Inputs consumed | `ba/00-lean-spec.md` (AC-003-09..19, BR-003-09..16, AMBIGUITY-001), `design/00-design-plan.md` (D1..D7, WO-01..07, AMBIGUITY-003), `docs/intel/_intake/TRI-1786936397148-3956.json` (done_oracle, verification_commands, seam_claims, source_snapshot head `1f6e8b039d04002078b121487230e2e5e4aad156`) |
| Source of truth for wire format | Design plan §8 `AMBIGUITY-003` resolution (NAME serialization) — **supersedes** the "RANK_OPTIONS (3 giá trị 0/1/2)" wording of BA spec AC-003-16 and the ordinal wording of the BA AMBIGUITY-003 table. All TCs below assert the NAME contract. |

## 1. Verification commands (exact, from triage `verification_commands`)

| # | Command | Working directory | Timeout |
|---|---|---|---|
| VC-1 (backend) | `mvn clean compile -q` | `D:\project\hang-hai-kchtgt` (repo root) | 600000 ms |
| VC-2 (frontend) | `npx tsc --noEmit` | `D:\project\hang-hai-kchtgt\frontend` | 300000 ms |

Both commands must exit 0 for TC-AC-19 (and are the closing check of every backend/frontend TC). DB-level and API-level probes below are wave-2 live extensions and are listed per-TC; they do not replace VC-1/VC-2.

## 2. Key contract encoded in this oracle (from design D1..D7 / AMBIGUITY-003 / BR-003-09..16)

| Layer | Contract | Anchor in design |
|---|---|---|
| Enum | `OrgUnitRank` = exactly `CUC, CHI_CUC_CANG_VU_CONG_TY_BAO_DAM, DAI_DIEN` (ordinals 0/1/2 in that order). Plain enum, **no `@JsonValue`, no `@JsonCreator`** → Jackson serializes by NAME (mirror `OrgUnitStatus`). | D1, WO-01 |
| Converter | `OrgUnitRankConverter` `@Converter(autoApply = true)` `AttributeConverter<OrgUnitRank, Short>`: write `(short) attribute.ordinal()` (null-safe); read range-guard `[0..2]` else `null` (BR-003-10). | D2, WO-01 |
| DB | `org_units.rank SMALLINT NOT NULL`; ordinal 0/1/2; migration backfills `level<=1→0, level=2→1, else→2` then `DROP DEFAULT`; dev-local migrator `ADD COLUMN IF NOT EXISTS rank SMALLINT NOT NULL DEFAULT 0` (keeps default, idempotent). | D4, WO-03, BR-003-11 |
| Wire (JSON) | request & response `rank` = **exact uppercase NAME** `"CUC"` / `"CHI_CUC_CANG_VU_CONG_TY_BAO_DAM"` / `"DAI_DIEN"`. Jackson `valueOf`, not case-insensitive. Response omits `rank` when null (`default-property-inclusion: non_null`). | §4 flow table, §7 risk 3, AMBIGUITY-003 |
| Service | `create()`: `resolveRank(requested, parent)` — (a) requested non-null → as-is; (b) `parent==null` → `CUC`; (c) `parent.level==1` → `CHI_CUC_CANG_VU_CONG_TY_BAO_DAM`; (d) else → `DAI_DIEN`. `update()`: set rank only when `request.getRank() != null` (partial). | D5, WO-05, BR-003-12/13 |
| Entity/DTO | `OrgUnit.rank` `@Column(nullable = false, columnDefinition = "SMALLINT")` + class-level `@FieldNameConstants`; `rank` in `CreateOrgUnitRequest`, `UpdateOrgUnitRequest` (optional), `OrgUnitResponse` + `.rank(entity.getRank())` in `from()`. | D3/D5, WO-02/WO-04 |
| Frontend | `OrgUnitRankName`, `RANK_LABELS`, `RANK_OPTIONS` keyed by NAME; `rank?: OrgUnitRankName` on `Organization`/create/update payloads; passthrough `rank` in all 11 mapper sites (**no `.toLowerCase()`** on rank); body create/update sends `rank: payload.rank`; required Select on create/edit (drawer + routed form), label fallback `'—'` on detail view. | D6, WO-06/WO-07 |
| Exclusions | List column "Cấp đơn vị" keeps `Cấp {level}` (`UnitList.tsx:378/406`); `OrgUnitType`/`OrgUnitTypeConverter` untouched (BR-003-16); **no new permission seeded**; no index on `rank`; `RolePermissionSeeder` untouched. | D7, BR-003-15/16 |

## 3. Coverage map (AC → TC → surface → verify command)

| AC | TC | Surface | Verify command |
|---|---|---|---|
| AC-003-09 | TC-AC-09 | backend enum + converter | VC-1 |
| AC-003-10 | TC-AC-10 | Flyway migration + DB | VC-1 + DB SELECT (live) |
| AC-003-11 | TC-AC-11 | OrgUnitSchemaMigrator | VC-1 + idempotency run (live) |
| AC-003-12 | TC-AC-12 | OrganizationService.create | VC-1 + POST probes (live) |
| AC-003-13 | TC-AC-13 | OrganizationService.update | VC-1 + PUT probes (live) |
| AC-003-14 | TC-AC-14 | Entity + DTO + response | VC-1 |
| AC-003-15 | TC-AC-15 | UnitList drawer + UnitForm Select | VC-2 + browser probe (live) |
| AC-003-16 | TC-AC-16 | organizationService.ts constants/mappers/payload | VC-2 |
| AC-003-17 | TC-AC-17 | UnitList detail drawer row | VC-2 |
| AC-003-18 | TC-AC-18 | list column / OrgUnitType / permissions (exclusions) | VC-1 + VC-2 + `git diff` check |
| AC-003-19 | TC-AC-19 | whole change | VC-1 + VC-2 |
| (negatives) | TC-N-01, TC-N-02 | create fallback DB-level; null-rank response chain | live probes |

## 4. Test cases

> Executor note: every "assert file contains …" step is performed with a read/grep of the exact path; every "assert compiled" step with VC-1/VC-2; line anchors below are the design-plan anchors — if the implemented line differs, the assertion is on the symbol/string, not the line number. A TC passes only when **all** its steps pass; any failing step is a defect finding (never weaken/skip an assertion).

### TC-AC-09 — Enum `OrgUnitRank` (3 values, NAME-serialized) + `OrgUnitRankConverter` (ordinal, range-guarded)

- **Objective:** `OrgUnitRank` exists with exactly 3 constants in ordinal order and NO Jackson annotation (NAME wire contract, AMBIGUITY-003); `OrgUnitRankConverter` mirrors `OrgUnitStatusConverter`.
- **Preconditions:** backend wave implemented (WO-01).
- **Steps:**
  1. Read `src/main/java/com/hanghai/kchtg/orgunit/entity/OrgUnitRank.java`. Assert: enum declared `public enum OrgUnitRank`; exactly 3 constants in order `CUC, CHI_CUC_CANG_VU_CONG_TY_BAO_DAM, DAI_DIEN` (no other constants); **no** `@JsonValue` and **no** `@JsonCreator`/`@JsonFormat` anywhere in the file.
  2. Read `src/main/java/com/hanghai/kchtg/orgunit/entity/OrgUnitRankConverter.java`. Assert: `@Converter(autoApply = true)`; `implements AttributeConverter<OrgUnitRank, Short>`; `convertToDatabaseColumn` returns `null` for null input else `(short) attribute.ordinal()`; `convertToEntityAttribute` returns `null` for null `dbData`, and for `dbData < 0 || dbData >= OrgUnitRank.values().length` returns `null` (range-guard, BR-003-10), else `OrgUnitRank.values()[dbData]`.
  3. Compare against the pattern: `src/main/java/com/hanghai/kchtg/orgunit/entity/OrgUnitStatusConverter.java` — the new converter must follow the same structure (annotation + ordinal write + range-guard read).
  4. Run VC-1.
- **Expected result:** enum shape exact; converter annotation/signature/range-guard present; no `@JsonValue` (NAME serialization preserved); `mvn clean compile -q` exits 0.
- **Verify command:** VC-1.

### TC-AC-10 — Migration `V20260817100000__add_org_unit_rank.sql`: ADD → backfill → DROP DEFAULT; backfill correctness on existing rows

- **Objective:** Flyway migration file exists with the exact three-statement sequence; on a DB with pre-existing rows of mixed `level`, every row is backfilled per BR-003-11 and the column ends `SMALLINT NOT NULL` without default; no other data altered.
- **Preconditions:** migration file created (WO-03); a dev DB with existing `org_units` rows spanning `level` 0/1/2/3+ (wave-2 fixture: rows at level≤1, level=2, level>2, plus one control row whose name/code/status must be preserved).
- **Steps:**
  1. Read `src/main/resources/db/migration/V20260817100000__add_org_unit_rank.sql`. Assert exactly, in order: (a) `ALTER TABLE org_units ADD COLUMN rank SMALLINT NOT NULL DEFAULT 0;` (b) `UPDATE org_units SET rank = CASE WHEN level <= 1 THEN 0 WHEN level = 2 THEN 1 ELSE 2 END;` (c) `ALTER TABLE org_units ALTER COLUMN rank DROP DEFAULT;`. Assert no other DDL/DML in the file (one-way door — no extra logic).
  2. Live (wave-2): apply the migration to the dev DB (Flyway runs on app startup per spring-boot auto-config; or `mvn flyway:migrate` if configured in this repo). Then run:
     ```sql
     SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_name = 'org_units' AND column_name = 'rank';
     ```
     Assert: `data_type` = smallint; `is_nullable` = NO; `column_default` IS NULL (DROP DEFAULT took effect).
  3. Backfill correctness:
     ```sql
     SELECT level, rank, COUNT(*) FROM org_units GROUP BY level, rank ORDER BY level;
     ```
     Assert: no row has NULL `rank`; every `level <= 1` row has `rank = 0`; every `level = 2` row has `rank = 1`; every `level > 2` row has `rank = 2`.
  4. Data preservation: `SELECT COUNT(*) FROM org_units;` equals pre-migration count; the control row's `name`, `code`, `status`, `parent_id` are unchanged.
  5. Run VC-1 (compiles; does not itself run Flyway — the backfill oracle is steps 2–4).
- **Expected result:** file content exact; column `SMALLINT NOT NULL` with no default; backfill matrix exact; row count preserved.
- **Verify command:** VC-1 + DB SELECTs above (live wave-2).

### TC-AC-11 — `OrgUnitSchemaMigrator` dev-local: `ADD COLUMN IF NOT EXISTS` + idempotent

- **Objective:** dev-local schema migrator adds `rank` with `IF NOT EXISTS … DEFAULT 0` (mirrors `operational_status`), logs in Vietnamese, and is idempotent.
- **Preconditions:** WO-03 implemented.
- **Steps:**
  1. Read `src/main/java/com/hanghai/kchtg/orgunit/config/OrgUnitSchemaMigrator.java`. Assert in `run()` after the `operational_status` statement (design anchor `:21-24`): `jdbcTemplate.execute("ALTER TABLE org_units ADD COLUMN IF NOT EXISTS rank SMALLINT NOT NULL DEFAULT 0");` (exact string, `IF NOT EXISTS` present, `DEFAULT 0` kept) and a `log.info(...)` message in Vietnamese (e.g. "Đã kiểm tra cấu trúc cấp đơn vị.").
  2. Live (wave-2): start the app twice against a dev-local DB that does not run Flyway. Assert the second start completes without schema error (idempotency via `IF NOT EXISTS`) and the column exists: `SELECT column_name FROM information_schema.columns WHERE table_name='org_units' AND column_name='rank';` returns the row.
  3. Run VC-1.
- **Expected result:** statement present with `IF NOT EXISTS` + `DEFAULT 0`; Vietnamese log; double-start no error; column exists.
- **Verify command:** VC-1 + idempotency run (live wave-2).

### TC-AC-12 — `create()`: request-first, else infer from parent (4 branches)

- **Objective:** `OrganizationService.create()` stores `request.getRank()` when sent; otherwise falls back by parent: null → `CUC`, `parent.level == 1` → `CHI_CUC_CANG_VU_CONG_TY_BAO_DAM`, else → `DAI_DIEN` (BR-003-12).
- **Preconditions:** WO-05 implemented.
- **Steps:**
  1. Read `src/main/java/com/hanghai/kchtg/orgunit/service/OrganizationService.java`. Assert the builder block (design anchor after `.operationalStatus(...)`, `:307-310`) contains `.rank(resolveRank(request.getRank(), parent))`.
  2. Assert private helper `resolveRank` exists (near `validateParentEligibility`) with exactly the logic: `requested != null → requested`; `parent == null → OrgUnitRank.CUC`; `parent.getLevel() != null && parent.getLevel() == 1 → OrgUnitRank.CHI_CUC_CANG_VU_CONG_TY_BAO_DAM`; else → `OrgUnitRank.DAI_DIEN`.
  3. Static sanity: `parent` is loaded before the builder (design anchor `:283-292`) — the helper receives the already-loaded parent, not a fresh lookup.
  4. Run VC-1.
  5. Live (wave-2, running backend + DB): four `POST /api/org-units` probes (auth as user with `orgunit:manage`), each with a minimal valid body minus `rank`:
     - (a) body includes `"rank": "CHI_CUC_CANG_VU_CONG_TY_BAO_DAM"` (no parent) → response `"rank": "CHI_CUC_CANG_VU_CONG_TY_BAO_DAM"`; DB row rank = 1.
     - (b) body omits `rank`, `parentId` null → response `"rank": "CUC"`; DB row rank = 0.
     - (c) body omits `rank`, `parentId` = id of a unit with `level = 1` → response `"rank": "CHI_CUC_CANG_VU_CONG_TY_BAO_DAM"`; DB row rank = 1.
     - (d) body omits `rank`, `parentId` = id of a unit with `level = 2` → response `"rank": "DAI_DIEN"`; DB row rank = 2.
     Assert the response `rank` is the exact uppercase NAME (never a number).
- **Expected result:** helper 4-branch logic exact; builder call present; probes (a)–(d) store/return the values above; VC-1 exit 0.
- **Verify command:** VC-1 + POST probes (live wave-2).

### TC-AC-13 — `update()`: partial — set rank only when non-null

- **Objective:** `update()` leaves `rank` untouched when the request omits it; changes it when sent (BR-003-13).
- **Preconditions:** WO-05 implemented.
- **Steps:**
  1. Read `src/main/java/com/hanghai/kchtg/orgunit/service/OrganizationService.java` scalar block (design anchor `:400-418`). Assert `if (request.getRank() != null) unit.setRank(request.getRank());` (or equivalent null-checked set) present.
  2. Run VC-1.
  3. Live (wave-2, running backend): take an existing unit with `rank = "CUC"` (DB 0).
     - `PUT /api/org-units/{id}` body without `rank` (and without changing rank) → response keeps `"rank": "CUC"`; DB rank stays 0.
     - `PUT /api/org-units/{id}` body with `"rank": "DAI_DIEN"` → response `"rank": "DAI_DIEN"`; DB rank = 2.
     - `PUT /api/org-units/{id}` body with `"rank": null` → treated as absent (partial update semantics): rank unchanged.
- **Expected result:** null-checked set present; probes confirm keep-on-omit and change-on-send; VC-1 exit 0.
- **Verify command:** VC-1 + PUT probes (live wave-2).

### TC-AC-14 — Entity + DTOs + response mapping contain `rank`

- **Objective:** `OrgUnit.rank` declared `@Column(nullable = false, columnDefinition = "SMALLINT")` with class-level `@FieldNameConstants`; `rank` on `CreateOrgUnitRequest`/`UpdateOrgUnitRequest` (optional, no validation annotation); `OrgUnitResponse.rank` + `.rank(entity.getRank())` in `from()`.
- **Preconditions:** WO-02 + WO-04 implemented.
- **Steps:**
  1. Read `src/main/java/com/hanghai/kchtg/orgunit/entity/OrgUnit.java`. Assert field (after the `operationalStatus` block, design anchor `:99-101`): `@Column(nullable = false, columnDefinition = "SMALLINT") private OrgUnitRank rank;` (no `@Enumerated`; no explicit `@Column(name=...)` — column name defaults to `rank`); class carries `@FieldNameConstants`.
  2. Read `src/main/java/com/hanghai/kchtg/orgunit/dto/OrgUnitResponse.java`. Assert field `private OrgUnitRank rank;` (after `operationalStatus`) and `from()` maps `.rank(entity.getRank())` (after `.operationalStatus(...)`).
  3. Read `src/main/java/com/hanghai/kchtg/orgunit/dto/CreateOrgUnitRequest.java` and `UpdateOrgUnitRequest.java`. Assert `private OrgUnitRank rank;` present (after `operationalStatus`), imported via `import` (no fully-qualified name), and carrying **no** validation annotation (required-ness is a UI constraint per AC-003-15).
  4. Run VC-1.
- **Expected result:** field + annotation + `@FieldNameConstants` on entity; response field + `from()` mapping; DTO fields optional; VC-1 exit 0.
- **Verify command:** VC-1.

### TC-AC-15 — Required "Cấp đơn vị" Select on create/edit (drawer + routed form)

- **Objective:** both create/edit surfaces show a required rank Select fed by `RANK_OPTIONS`; missing selection blocks submit with "Vui lòng chọn cấp đơn vị" and no API call; payload carries `rank` when selected (AC-003-15, BR-003-14).
- **Preconditions:** WO-07 implemented.
- **Steps:**
  1. Read `frontend/src/pages/organizations/UnitList.tsx`. Assert in the drawer form (pattern of the `operationalStatus` Form.Item):
     - `<Form.Item name="rank"` with `{...labelProps('Cấp đơn vị')}`, `style={{ marginBottom: spaceFormField }}`, `rules={[{ required: true, message: 'Vui lòng chọn cấp đơn vị' }]}`;
     - `<Select ... options={RANK_OPTIONS}` with `borderRadius: radiusPill` and `height: 40` (token compliance — no hardcoded hex/space/radius outside the layout-property allowance);
     - `RANK_OPTIONS` imported from the service module.
  2. In the same file, assert `handleSubmit` adds `rank: values.rank,` to **both** the create and update payloads; `openEditModal`/`openViewModal` set `rank: org.rank,` into `setFieldsValue` (design anchor `:115-127`).
  3. Read `frontend/src/pages/organizations/UnitForm.tsx`. Assert `<FormField type="select" name="rank" label="Cấp đơn vị" required options={RANK_OPTIONS} />` placed after the `parentId` FormField and before `operationalStatus`; `handleSubmit` adds `rank: values.rank,` to both `CreateOrganizationPayload` and `UpdateOrganizationPayload`; edit-load sets `rank: data.rank` into initial data/`setFieldsValue` (design anchor `:20-45`).
  4. Run VC-2.
  5. Live (wave-2, browser): open create drawer, leave rank unselected, submit → message "Vui lòng chọn cấp đơn vị" shown, no POST request in network tab; select a value → POST body contains `"rank": "<selected NAME>"`.
- **Expected result:** required rule with exact Vietnamese message; payload includes `rank` on both surfaces; token compliance; VC-2 exit 0.
- **Verify command:** VC-2 (+ browser probe, live wave-2).

### TC-AC-16 — `RANK_OPTIONS`/`RANK_LABELS` keyed by NAME + all mapper sites + payload wiring

- **Objective:** `organizationService.ts` exports `OrgUnitRankName`, `RANK_LABELS`, `RANK_OPTIONS` keyed by the exact uppercase NAME; `rank?` on the 3 type declarations; all 11 mapper sites passthrough `rank`; create/update bodies send `rank`; rank is never lowercased or ordinal-mapped (AMBIGUITY-003 supersedes the "0/1/2" wording of AC-003-16).
- **Preconditions:** WO-06 implemented.
- **Steps:**
  1. Read `frontend/src/services/organizationService.ts`. Assert:
     - `export type OrgUnitRankName = "CUC" | "CHI_CUC_CANG_VU_CONG_TY_BAO_DAM" | "DAI_DIEN";`
     - `RANK_LABELS: Record<OrgUnitRankName, string>` with exactly `CUC: "Cục"`, `CHI_CUC_CANG_VU_CONG_TY_BAO_DAM: "Chi cục/ Cảng vụ/ Công ty bảo đảm"`, `DAI_DIEN: "Đại diện"`;
     - `RANK_OPTIONS` — 3 entries, each `{ value: <NAME>, label: <Vietnamese label> }` (value is the NAME, never the ordinal number);
     - `rank?: OrgUnitRankName;` on `Organization`, `CreateOrganizationPayload`, `UpdateOrganizationPayload`.
  2. Grep `rank` across the file and assert a passthrough mapping `rank: item.rank as OrgUnitRankName | undefined` (or equivalent direct assignment, **without** `.toLowerCase()` / `.toUpperCase()` / numeric index) appears in **all** 11 mapper sites: `mapOrgUnit` (~:85), `getList` (~:121-122), `getById` (~:237-238), `getTree` (~:379-380 and ~:430-431), `getChildren` (~:506), `create` (~:571-572), `update` (~:651-654), `approve` (~:713), `reject` (~:749), `submit` (~:785), `search` (~:818). Design anchors verified present in the pre-change file (`mapOrgUnit` :85, `submit` :697, `approve` :731, `reject` :767, `search` :800, `MOCK_ORGANIZATIONS` import :3).
  3. Assert create/update request bodies add `rank: payload.rank` (design anchor: body built field-by-field at ~:588 and ~:651-654).
  4. Negative grep: assert **no** occurrence of `rank` transformed through `.toLowerCase()`/`.toUpperCase()` and no `RANK_LABELS[<number>]`-style ordinal keying anywhere in `frontend/src` (would violate the NAME contract).
  5. Run VC-2.
- **Expected result:** NAME-keyed constants; 3 types carry `rank?`; 11 mapper sites; bodies send `rank`; no case-normalization of rank; VC-2 exit 0.
- **Verify command:** VC-2.

### TC-AC-17 — Detail view shows "Cấp đơn vị" = `RANK_LABELS[rank]`, null/undefined → "—"

- **Objective:** drawer "Chi tiết đơn vị" renders the rank label via `RANK_LABELS`; missing rank renders "—" (AC-003-17; covers the `non_null` omission chain: DB out-of-range → converter null → response omits `rank` → `undefined` → "—").
- **Preconditions:** WO-07 implemented.
- **Steps:**
  1. Read `frontend/src/pages/organizations/UnitList.tsx` detail-drawer region (design anchor `detailRowStyle` ~:466). Assert a detail row labeled "Cấp đơn vị" renders `RANK_LABELS[(org.rank as OrgUnitRankName)] ?? '—'` (or equivalent nullish fallback `'—'`); `RANK_LABELS` imported.
  2. Mock fallback check: `MOCK_ORGANIZATIONS` entries have no `rank` → `org.rank` is `undefined` → row shows "—" (assert the fallback covers `undefined`, not just `null`).
  3. Run VC-2.
  4. Live (wave-2, browser): open detail drawer for a unit whose response omits `rank` (or with `rank: null` forced at DB) → row shows "—", not a blank cell or a crash.
- **Expected result:** label lookup + `'—'` fallback; VC-2 exit 0.
- **Verify command:** VC-2 (+ browser probe, live wave-2).

### TC-AC-18 — Exclusions: list column unchanged, `OrgUnitType` untouched, no new permission

- **Objective:** the list column "Cấp đơn vị" still renders `Cấp {level}` from tree depth (BR-003-15); deprecated `OrgUnitType`/`OrgUnitTypeConverter` unchanged and rank never derived from `unitType` (BR-003-16); no new permission seeded (brief: "NO new permission seeding").
- **Preconditions:** whole change implemented (WO-01..07).
- **Steps:**
  1. Read `frontend/src/pages/organizations/UnitList.tsx` around :378 (header `<div ...>Cấp đơn vị</div>` — spot-verified present pre-change) and :406 (cell `` `Cấp ${org.level}` `` with `'—'` fallback — spot-verified pre-change). Assert the column header and cell still render tree depth — **no** `RANK_LABELS`/`RANK_OPTIONS`/`org.rank` inside the table body or columns definition.
  2. Exclusion via diff (baseline = triage source_snapshot head `1f6e8b039d04002078b121487230e2e5e4aad156`): run
     `git diff 1f6e8b039d04002078b121487230e2e5e4aad156 -- src/main/java/com/hanghai/kchtg/orgunit/entity/OrgUnitType.java src/main/java/com/hanghai/kchtg/orgunit/entity/OrgUnitTypeConverter.java src/main/java/com/hanghai/kchtg/config/RolePermissionSeeder.java`
     Assert: empty output for all three (read-only git command; if the working tree is dirty at baseline, compare against the last commit instead and note it).
  3. Negative grep: `orgunit:rank` and `:rank` permission patterns return **zero** matches in `src/main/java/com/hanghai/kchtg/config/RolePermissionSeeder.java`.
  4. Assert no `@Enumerated(EnumType.ORDINAL)`/enum column added for `unitType` and no `getUnitType()` reference inside `resolveRank` (rank inference is level-based only).
  5. Run VC-1 + VC-2.
- **Expected result:** `Cấp {level}` intact; OrgUnitType + converter + seeder unchanged; no rank permission; both builds exit 0.
- **Verify command:** VC-1 + VC-2 (+ optional `git diff` check above).

### TC-AC-19 — Build + typecheck pass (whole change)

- **Objective:** both verification commands from the triage pass after all waves.
- **Preconditions:** WO-01..07 implemented.
- **Steps:**
  1. Run VC-1 (`mvn clean compile -q` at repo root). Assert exit code 0 and no `ERROR`/`BUILD FAILURE` in output.
  2. Run VC-2 (`npx tsc --noEmit` in `frontend/`). Assert exit code 0 and no type errors in output.
- **Expected result:** both exit 0.
- **Verify command:** VC-1 + VC-2.

## 5. Negative & edge-case battery

### TC-N-01 — Missing `rank` on create → backend fallback (DB-level proof)

- **Objective:** prove the fallback persists the correct ordinal even when the client never sends `rank` (old-client safety net, BR-003-12/AMBIGUITY-001 — the UI requires the field; the fallback is not a UI replacement).
- **Steps (live wave-2):** repeat TC-AC-12 probes (b)/(c)/(d) (no `rank` in body) and additionally verify at DB level: `SELECT id, rank FROM org_units WHERE id IN (<created ids>);` → ranks `0`, `1`, `2` respectively.
- **Expected result:** rows persisted with ordinal 0/1/2 matching parent inference; response names `"CUC"`/`"CHI_CUC_CANG_VU_CONG_TY_BAO_DAM"`/`"DAI_DIEN"`.

### TC-N-02 — Out-of-range DB value → converter null → response omits `rank` → frontend "—"

- **Objective:** exercise the BR-003-10 range-guard end-to-end: a DB ordinal outside `[0..2]` must not crash the read path, must be omitted from JSON (`non_null` inclusion), and must render "—".
- **Steps (live wave-2):**
  1. `UPDATE org_units SET rank = 5 WHERE id = '<fixture>';`
  2. `GET /api/org-units/<fixture>` (or list containing it) → assert the JSON object has **no** `rank` property (omitted, not `"rank": null`).
  3. Browser: open detail drawer for that unit → "Cấp đơn vị" row shows "—".
  4. Restore the row: `UPDATE org_units SET rank = 0 WHERE id = '<fixture>';` (cleanup mandatory — never leave out-of-range fixture data).
- **Expected result:** no 500/deserialization error; `rank` absent from JSON; UI "—"; fixture restored.

## 6. AMBIGUITY-003 execution note (contract guard)

- The BA spec AC-003-16 wording ("RANK_OPTIONS (3 giá trị 0/1/2) + RANK_LABELS (0/1/2)") and the BA AMBIGUITY-003 table wording are **superseded** by the design resolution: wire format is NAME (`"CUC"` etc.), frontend keyed by NAME, ordinal 0/1/2 exists only in DB (`SMALLINT`) and `OrgUnitRank.ordinal()`.
- Per design §8: if wave-2 QA or the code-reviewer detects a backend/contract type mismatch (e.g. response emits ordinal, or frontend maps by index), **report to PMO before coding** — do not silently adapt the oracle.
- The triage `done_oracle` ("dropdown Cấp đơn vị … ở cả tạo mới, chỉnh sửa và xem chi tiết; giá trị lưu dưới DB là SMALLINT ở cột rank … enum Java OrgUnitRank + AttributeConverter; dữ liệu cũ được backfill theo cấp cây; mvn clean compile và tsc --noEmit đều pass") is fully covered by TC-AC-09/10/12/15/19.

## 7. Coverage statement & limitations

- **Covered:** every AC-003-09..19 (TC-AC-09..19); negatives: create fallback (TC-AC-12 + TC-N-01), null-rank response chain (TC-N-02), backfill on existing rows (TC-AC-10 steps 2–4), list column unchanged / OrgUnitType untouched / no new permission (TC-AC-18); NAME wire contract (TC-AC-09/16 + §6).
- **Not executed (by design):** no tests/build were run at wave 1 — the implementation does not exist. VC-1/VC-2 are the mechanical gates for wave-2; DB/API/browser probes require a running backend + dev DB and are flagged "(live wave-2)".
- **Known environment note:** this workspace has no runnable frontend test runner (no `test` script in `frontend/package.json`, vitest not installed — see `docs/intel/knowledge/gotcha/f-001-form-reshape-test-surface--070491.md`), so frontend verification is source-level + `tsc` + browser probe; do not rely on a frontend unit-test command that does not exist.
- **Pass/fail recording:** wave-2 QA records per-TC outcome (command, exit code, observed output) in the wave-2 QA report; a TC with any failed step is a defect finding with severity + reproduction, never a skipped assertion.
