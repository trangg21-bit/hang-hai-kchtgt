# QA Wave-2 Report — Execution of the Wave-1 Oracle — TRI-1786936397148-3956 · "Cấp đơn vị" (`rank`) on F-003 org-unit

| Field | Value |
|---|---|
| Triage | `TRI-1786936397148-3956` (change_class `C3`; one-way door `src/main/resources/db/migration/V20260817100000__add_org_unit_rank.sql`) |
| Module / Feature | `M-001-quan-tri-he-thong` / `F-003-quan-ly-don-vi` |
| Stage | `engineering-qa-engineer` — wave 2 (post-implementation execution of `qa/07-qa-report-w1.md`) |
| Date | 2026-08-17 |
| Oracle | `qa/07-qa-report-w1.md` (TC-AC-09..19, TC-N-01/02) — executed mechanically, not re-derived |
| Baseline commit for diffs | `1f6e8b039d04002078b121487230e2e5e4aad156` (triage source_snapshot head) |

## 1. Execution record (real commands, observed exit codes)

| # | Command | cwd | Exit | Key output |
|---|---|---|---|---|
| 1 | `mvn clean compile` | repo root | **0** | `BUILD SUCCESS`; 1086 source files compiled; Total time 21.772 s; only pre-existing warnings (deprecation, `@EqualsAndHashCode` Lombok notes) |
| 2 | `mvn test -Dtest=OrganizationServiceTest,OrgUnitRankConverterTest` | repo root | **0** | `BUILD SUCCESS`; **Tests run: 23, Failures: 0, Errors: 0, Skipped: 0** — OrgUnitRankConverterTest 5, RankResolutionTests 5, HierarchyTests 2, ApprovalWorkflowTests 5, DeleteGuardTests 3, UniqueCodeTests 3 |
| 3 | `npm run build` | `frontend/` | **0** | vite v8.1.5, 4033 modules transformed, `✓ built in 797ms`; only chunk-size advisory warning (non-fatal) |
| 4 | `npx tsc --noEmit` | `frontend/` | **0** | no output — **VACUOUS: see §2** (root `tsconfig.json` is a solution stub with `files: []`) |
| 4b | `npx tsc --noEmit -p tsconfig.app.json` | `frontend/` | **2** | 977 violations project-wide = **documented pre-existing baseline** (workspace memory: ~90 red files, e.g. App.tsx, BerthListPage, PortListPage, theme.ts); touched files carry **0 NEW** violations (see §2) |

No backend server was started; no DB migration executed; no git commit/push performed (per brief).

### 1a. Post-report re-verification (verification-gate re-run, same session, current tree)

The tree grew after the first battery (1096 vs 1086 main sources; 89 vs 88 test sources) — the full battery was re-run against the current tree and outcomes are unchanged:

| # | Command | cwd | Exit (re-run) | Key output (re-run) |
|---|---|---|---|---|
| 1 | `mvn clean compile` | repo root | **0** | `BUILD SUCCESS`; 1096 source files compiled; Total time 24.364 s |
| 2 | `mvn test -Dtest=OrganizationServiceTest,OrgUnitRankConverterTest` | repo root | **0** | `BUILD SUCCESS`; **Tests run: 23, Failures: 0, Errors: 0, Skipped: 0** — identical sub-suite results (Converter 5, Rank 5, Hierarchy 2, Approval 5, DeleteGuard 3, UniqueCode 3) |
| 3 | `npm run build` | `frontend/` | **0** | vite, 4033 modules, `✓ built in 835ms`, advisory chunk warning only |
| 4b | `npx tsc --noEmit -p tsconfig.app.json` filtered to `organizations/` | `frontend/` | 2 (baseline) | **Byte-identical** touched-file violations to §2: UnitForm 2×TS6133, UnitList 1×TS7006, plus pre-existing UnitTree/DikeRevetment/NavigationChannel/RadarStation/ShipRepair — **0 new errors** |

Stability spot-check of rank markers on the current tree (identical to the verified reads): migration SQL lines 2–8 exact; `OrgUnitRank` 3 constants without `@JsonValue`; `OrganizationService.java:312/421/443` unchanged; `organizationService.ts:72/80` unchanged.

## 2. Typecheck analysis: NEW vs pre-existing errors in the 3 touched files

Root `frontend/tsconfig.json` is `{"files": [], "references": [app, node]}` — a solution-style stub. `npx tsc --noEmit` therefore checks **zero files** and its exit 0 is vacuous. The substantive check is `tsconfig.app.json` (`noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `noFallthroughCasesInSwitch`; **no `strict`**), which is red at baseline (977 violations).

Filtered to the touched files (real error text, extracted from the app-config run):

| File:line | Error | Classification evidence |
|---|---|---|
| `UnitForm.tsx(2,49)` | TS6133 `'Input' is declared but its value is never read` | Line 2 is **unchanged** by the diff (rank change touched only line 5 + additions); additive change cannot create unused imports → **pre-existing** |
| `UnitForm.tsx(2,56)` | TS6133 `'Select' is declared but its value is never read` | Same line 2, unchanged → **pre-existing** |
| `UnitList.tsx(39,39)` | TS7006 `Parameter 's' implicitly has an 'any' type` | `hasPerm = usePermissionStore((s) => s.hasPermission)` — identical line content at baseline (`git show` of the declaration) → **pre-existing** |
| `organizationService.ts(6,5)` | TS2322 `[...MOCK_ORGANIZATIONS]` not assignable to `Organization[]` | Line 6 **unchanged** (diff starts at line 28); `rank` is optional so it cannot cause this → **pre-existing** |
| `organizationService.ts(102,10)` | TS6133 `'mapOrgUnit' is declared but its value is never read` | Function pre-existed (diff hunk modifies it, does not add it); diff is purely additive (zero `-` lines) → no usage removed → **pre-existing** |
| `organizationService.ts(518,15)` / `(731,7)` / `(768,7)` / `(805,7)` | TS2741 `Property 'operationalStatus' is missing … but required in type 'Organization'` | `operationalStatus` requiredness is untouched by the diff (only `rank?:` added); the object literals lacked it at baseline → **pre-existing** |
| `organizationService.ts(838,7)` | TS2322 mapper result not assignable to `Organization[]` | Same class as (6,5) — pre-existing mapper shape → **pre-existing** |

**Conclusion: zero NEW tsc errors in the 3 touched files.** Every violation the change could have caused was excluded by construction: no enums added (no TS1294), all new imports (`RANK_OPTIONS`, `RANK_LABELS`, `userService`, `modal`, `OrgUnitRankName`) verified used, added object-literal members (`rank: …`) cannot trigger `noUnusedLocals`, and `rank` is optional everywhere so it cannot cause missing-property errors.

## 3. Per-TC verdicts (oracle TC → outcome)

### TC-AC-09 — Enum `OrgUnitRank` + converter — **PASS**
- `src/main/java/com/hanghai/kchtg/orgunit/entity/OrgUnitRank.java` (read): exactly 3 constants in order `CUC, CHI_CUC_CANG_VU_CONG_TY_BAO_DAM, DAI_DIEN`; **no** `@JsonValue`/`@JsonCreator` → NAME serialization (AMBIGUITY-003 contract).
- `OrgUnitRankConverter.java` (read): `@Converter(autoApply = true)`, `AttributeConverter<OrgUnitRank, Short>`; `convertToDatabaseColumn` null-safe `(short) attribute.ordinal()`; `convertToEntityAttribute` null-safe + range-guard `[0..2]` else `null` (BR-003-10).
- Executed: `mvn test` — `OrgUnitRankConverterTest`: **5 run / 0 failures** (ordinal write 0/1/2, null write, ordinal read, out-of-range −1/3 → null, null read).
- Command evidence: `mvn clean compile` exit 0; `mvn test` exit 0.

### TC-AC-10 — Migration `V20260817100000__add_org_unit_rank.sql` — **PASS (static)** / DB backfill NOT EXECUTED
- File (read, exact order): `ALTER TABLE org_units ADD COLUMN rank SMALLINT NOT NULL DEFAULT 0;` → `UPDATE … CASE WHEN level <= 1 THEN 0 WHEN level = 2 THEN 1 ELSE 2 END;` → `ALTER TABLE org_units ALTER COLUMN rank DROP DEFAULT;`. No extra DDL/DML.
- DB-level steps (column metadata, backfill matrix, data preservation) **not executable** — no server/DB start allowed; must run in the deployment/UAT environment before release. The SQL is verified byte-exact against the contract; backfill correctness on a live DB remains an open live check (see §6).

### TC-AC-11 — `OrgUnitSchemaMigrator` dev-local — **PASS (static)** / idempotency run NOT EXECUTED
- `OrgUnitSchemaMigrator.java` (read): `jdbcTemplate.execute("ALTER TABLE org_units ADD COLUMN IF NOT EXISTS rank SMALLINT NOT NULL DEFAULT 0");` after the `operational_status` statement, plus Vietnamese log `log.info("Đã kiểm tra cấu trúc cấp đơn vị.")`.
- Idempotent by construction (`IF NOT EXISTS`); double-start live check not executable (no server start).
- Command evidence: `mvn clean compile` exit 0.

### TC-AC-12 — `create()` request-first / parent inference — **PASS**
- `OrganizationService.java:312` (read): builder contains `.rank(resolveRank(request.getRank(), parent))`.
- `:443-449` (read): `resolveRank` exact 4-branch logic — `requested != null → requested`; `parent == null → CUC`; `parent.getLevel() == 1 → CHI_CUC_CANG_VU_CONG_TY_BAO_DAM`; else → `DAI_DIEN`.
- Executed: `RankResolutionTests` **5 run / 0 failures** — `shouldUseExplicitRankOnCreate` (explicit → DAI_DIEN), `shouldDefaultRankToCucForRootUnit` (root → CUC), `shouldInferRankFromLevelOneParent` (→ CHI_CUC_CANG_VU_CONG_TY_BAO_DAM), `shouldInferRankFromLevelTwoParent` (→ DAI_DIEN) — exactly AC-003-12 (a/b/c/d).
- Live `POST /api/org-units` probes not executable (no server); covered by unit tests + static evidence.

### TC-AC-13 — `update()` partial — **PASS**
- `OrganizationService.java:421-422` (read): `if (request.getRank() != null) unit.setRank(request.getRank());` inside the scalar block.
- Executed: `shouldSetRankOnUpdate` passed (RankResolutionTests, 0 failures). Live PUT probes (keep-on-omit) not executable; the null-guard is verified statically.

### TC-AC-14 — Entity + DTO + response — **PASS**
- `OrgUnit.java:99-101` (read): Javadoc + `@Column(nullable = false, columnDefinition = "SMALLINT") private OrgUnitRank rank;`; class-level `@FieldNameConstants` present.
- `CreateOrgUnitRequest.java` / `UpdateOrgUnitRequest.java` (read): `private OrgUnitRank rank;` optional, no validation annotation, `import` used.
- `OrgUnitResponse.java` (read): field `private OrgUnitRank rank;` + `from()` maps `.rank(entity.getRank())`; class-level `@JsonInclude(Include.NON_EMPTY)` (null rank omitted — satisfies the non_null omission expectation for TC-N-02).
- Command evidence: `mvn clean compile` exit 0.

### TC-AC-15 — Required "Cấp đơn vị" Select on create/edit — **PASS**
- `UnitList.tsx:497-498` (read, inside the drawer create/edit form, after `parentId`): `<Form.Item name="rank" {...labelProps('Cấp đơn vị')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng chọn cấp đơn vị' }]}>` + `<Select placeholder="Chọn cấp đơn vị" style={{ borderRadius: radiusPill, height: 40 }} options={RANK_OPTIONS} />` — exact required rule, token-compliant.
- `UnitList.tsx:112/128` setFieldsValue `rank: org.rank` (edit/view); `:145/155` payload `rank: values.rank` (create + update).
- `UnitForm.tsx:179-186` (read): `<FormField type="select" name="rank" label="Cấp đơn vị" required options={RANK_OPTIONS} />` placed after `parentId`, before `description`; `:50/62` edit-load `rank: data.rank`; `:111/126` payload `rank: values.rank`.
- Browser submit-block probe not executable; the required-rule and payload wiring are verified statically and the added lines typecheck clean.

### TC-AC-16 — `RANK_OPTIONS`/`RANK_LABELS` NAME-keyed + mappers + payload — **PASS**
- `organizationService.ts:72` `OrgUnitRankName = "CUC" | "CHI_CUC_CANG_VU_CONG_TY_BAO_DAM" | "DAI_DIEN"`; `:74-78` `RANK_LABELS` keyed by NAME with exact Vietnamese labels; `:80-86` `RANK_OPTIONS` 3 entries `value = NAME`.
- `rank?: OrgUnitRankName` on `Organization` (:31), `CreateOrganizationPayload` (:46), `UpdateOrganizationPayload` (:62).
- Passthrough `rank: item.rank as OrgUnitRankName | undefined` at **13 mapper sites** (grep: 140, 257, 277, 314, 402, 454, 530, 598, 684, 743, 780, 817, 851) — design required 11; all present, **no** `.toLowerCase()` on rank, no numeric keying.
- Payload bodies send `rank: payload.rank` at :578 (create), :626 (create fallback), :656 (update body).
- Wire contract (AMBIGUITY-003): NAME in, NAME out — consistent end-to-end (enum NAME → Jackson `valueOf`; response NAME → passthrough → `RANK_LABELS`).

### TC-AC-17 — Detail view label + `'—'` fallback — **PASS**
- `UnitList.tsx:458` (read): detail row `['Cấp đơn vị', RANK_LABELS[editingOrg.rank as OrgUnitRankName] ?? '—']` — nullish fallback covers both `null` and `undefined` (mock data has no `rank` → `undefined` → `'—'`).
- Browser probe not executable; fallback verified statically.

### TC-AC-18 — Exclusions (list column, OrgUnitType, permissions) — **PASS**
- `UnitList.tsx:382` header `Cấp đơn vị` and `:410` cell `` `Cấp ${org.level}` `` with `'—'` fallback — **unchanged** (read; identical to pre-change spot-check). No `RANK_LABELS`/`RANK_OPTIONS`/`org.rank` in the table body.
- `git diff 1f6e8b03 -- src/main/java/com/hanghai/kchtg/orgunit/entity/OrgUnitType.java src/main/java/com/hanghai/kchtg/orgunit/entity/OrgUnitTypeConverter.java src/main/java/com/hanghai/kchtg/config/RolePermissionSeeder.java` → **empty output, exit 0** (all three untouched).
- Grep `orgunit:rank`/rank-permission patterns across `src/main/java`: **zero matches** (only `rankForLevel` seed helpers, which map level→rank per BR-003-11 and are data-seeding utilities, not permissions).
- `resolveRank` never references `unitType` (read: level-based only).
- Command evidence: `mvn clean compile` exit 0; `npx tsc --noEmit` exit 0 (vacuous, see §2).

### TC-AC-19 — Build + typecheck — **PASS (with §2 caveat)**
- `mvn clean compile` exit 0; `npm run build` exit 0; `npx tsc --noEmit` exit 0.
- Honest caveat: the plain tsc command is vacuous in this repo (solution-style root tsconfig). The real typecheck (`-p tsconfig.app.json`) remains at baseline red with **0 NEW errors in the touched files** (proven in §2). The `npm run build` green does not imply typecheck green (vite does not typecheck).

### TC-N-01 — Missing `rank` on create → backend fallback — **PASS (unit-level)**
- Executed: `RankResolutionTests` 5/5 — all four fallback branches + explicit rank exercised and green (TC-AC-12 evidence).
- DB-persistence probes (ordinal stored as 0/1/2) not executable; converter ordinal write covered by `OrgUnitRankConverterTest` (0/1/2).

### TC-N-02 — Out-of-range DB ordinal → converter null → response omits `rank` → UI `'—'` — **PARTIAL PASS (chain verified at every executable link)**
- Range-guard: executed `OrgUnitRankConverterTest.shouldReturnNullForOutOfRangeOrdinal` (`-1`, `3` → null) — **passed**.
- Response omission: `OrgUnitResponse` `@JsonInclude(NON_EMPTY)` — null rank omitted (static).
- UI fallback: `RANK_LABELS[…] ?? '—'` at `UnitList.tsx:458` (static).
- Live chain (DB `rank=5` → GET → browser `'—'`) not executable; each link verified at unit/static level.

## 4. Defect findings

**None** — no acceptance-criterion violation found in the implementation. Every executable oracle step passed; every non-executable step has unit-test or static substitution and is listed in §6.

## 5. Observations (pre-existing, not caused by this change)

| ID | Severity | Observation |
|---|---|---|
| OBS-1 | Info | Triage verification command `npx tsc --noEmit` is **vacuous** in this repo (root `tsconfig.json` = `files: []` solution stub). The substantive check is `npx tsc --noEmit -p tsconfig.app.json`, red at baseline (977 violations / ~90 files). The 3 touched files carry 10 pre-existing violations (2+1+7) — all proven pre-existing (§2). Owner: PMO/triage for the recorded verification command. |
| OBS-2 | Info | `UnitForm.tsx` imports `Input`/`Select` unused (TS6133) — pre-existing; `UnitList.tsx:39` TS7006 (`hasPerm` selector) — pre-existing; `organizationService.ts` 7 violations (mock/mapper shape, `mapOrgUnit` unused) — pre-existing. Baseline debt, out of this change's scope. |
| OBS-3 | Info | Seeders (`M001DataSeeder`, `DataSeeder`, `OrgUnitDataFixer`) implement `rankForLevel` identical to the migration backfill mapping (level≤1→CUC, =2→CHI_CUC_CANG_VU_CONG_TY_BAO_DAM, else→DAI_DIEN) — consistent, verified in all three files. |

## 6. Not-executed live checks (environmental — no server start / no DB per brief)

| Check | Reason | Substitution |
|---|---|---|
| Flyway migration execution on a DB with existing rows (backfill matrix, column metadata, DROP DEFAULT) | No DB / no server start | SQL verified byte-exact; must run in deployment/UAT before release |
| `OrgUnitSchemaMigrator` double-start idempotency | No server start | `IF NOT EXISTS` verified |
| `POST /api/org-units` 4 probes (explicit/null-root/level-1/level-2) | No backend server | `RankResolutionTests` 5/5 green |
| `PUT /api/org-units/{id}` keep-on-omit / change-on-send | No backend server | Null-guard verified statically + `shouldSetRankOnUpdate` green |
| Browser: required-select submit block / detail `'—'` rendering | No UI runtime | Rule + fallback verified statically |
| TC-N-02 live chain (DB `rank=5` → GET omits → UI `'—'`) | No DB/server | Range-guard test green + `NON_EMPTY` + `?? '—'` verified |

## 7. Coverage statement & verdict

- **Covered with executed evidence:** all 11 AC TCs evaluated against real source (file/symbol-level reads), `mvn clean compile` (exit 0), `mvn test` (23/23 green, including the rank-specific suites), `npm run build` (exit 0), and the app-config typecheck with NEW-vs-baseline classification (0 new).
- **Verdict:** PASS — every executable criterion green; no defect in the implementation; the only red surface (`tsconfig.app.json`) is the documented pre-existing baseline with zero new errors from this change.
- **Next run must still execute (release/UAT):** the §6 live checks, especially the C3 one-way-door migration backfill on a real DB.
