# QA Wave-2 Report — EXECUTED — TRI-1786936397148-3956 · `rank` rename correction #2 (CUC → DEPARTMENT)

| Field | Value |
|---|---|
| Triage | `TRI-1786936397148-3956` (change_class `C3`; one-way door `src/main/resources/db/migration/V20260817100000__add_org_unit_rank.sql`) |
| Module / Feature | `M-001-quan-tri-he-thong` / `F-003-quan-ly-don-vi` |
| Stage | `engineering-qa-engineer` — wave 2 (post-implementation re-validation) |
| Date | 2026-08-17 |
| Status | **EXECUTED** — real source validated (read/grep) + all 3 mandated commands run with real exit codes. |
| Inputs consumed | oracle `qa/07-qa-report-w1.md`, `design/00-design-plan.md`, prior-stage results (BA Pass, SA Pass) |
| Rename mandate | `OrgUnitRank` constants `CUC / CHI_CUC_CANG_VU_CONG_TY_BAO_DAM / DAI_DIEN` → `DEPARTMENT(0) / BRANCH(1) / REPRESENTATIVE(2)`. Ordinals unchanged; Vietnamese display labels unchanged; Flyway migration byte-identical. |

## 1. Verification commands (executed, real exit codes)

| # | Command | cwd | Exit code | Observed result |
|---|---|---|---|---|
| VC-B1 | `mvn clean compile` | repo root | **0** | `BUILD SUCCESS` (enforcer Java 17 passed; 559 resources copied; compiler 3.13.0) |
| VC-B2 | `mvn test -Dtest=OrganizationServiceTest,OrgUnitRankConverterTest` | repo root | **0** | `Tests run: 23, Failures: 0, Errors: 0, Skipped: 0` |
| VC-F1 | `npm run build` | `frontend/` | **0** | `vite v8.1.5` → `✓ built in 1.15s` (4034 modules transformed) |

Notes: VC-B2 resolved both simple class names via surefire `-Dtest`. `OrganizationServiceTest` carries 5 `@Nested` groups (`RankResolutionTests` 5, `HierarchyTests` 2, `ApprovalWorkflowTests` 5, `DeleteGuardTests` 3, `UniqueCodeTests` 3) + `OrgUnitRankConverterTest` 5 = 23. The work order specified `npm run build` (not `tsc --noEmit`); `vite build` does **not** typecheck — see §7 limitation.

## 2. Backend validation (read/grep of real source)

| Check | Expected (mandate) | Observed | Evidence anchor |
|---|---|---|---|
| Enum constants + order | `DEPARTMENT(0), BRANCH(1), REPRESENTATIVE(2)`, no `@JsonValue`/`@JsonCreator` | ✅ exact; javadoc keeps `"Cục"`, `"Chi cục/ Cảng vụ/ Công ty bảo đảm"`, `"Đại diện"` | `src/main/java/com/hanghai/kchtg/orgunit/entity/OrgUnitRank.java` |
| Converter | `@Converter(autoApply=true)` `AttributeConverter<OrgUnitRank, Short>`; ordinal write (null-safe); range-guard read `[0..values.length)` else null | ✅ exact | `OrgUnitRankConverter.java:6-27` |
| `resolveRank` (create inference) | null-parent→`DEPARTMENT`, level 1→`BRANCH`, deeper→`REPRESENTATIVE` | ✅ exact | `OrganizationService.java:443-448`; consumed at create `:312` |
| `update()` partial | set rank only when non-null | ✅ exact | `OrganizationService.java:421-422` |
| `rankForLevel` (×3 helpers) | new names, level<=1→0, =2→1, else→2 | ✅ all three | `OrgUnitDataFixer.java:90-93`, `seeder/M001DataSeeder.java:149-152`, `seeder/DataSeeder.java:273-276` |
| `OrgUnitType` untouched | no `BRANCH`/`REPRESENTATIVE` added | ✅ unchanged (`DEPARTMENT, SUB_DEPARTMENT, …, GENERAL_DEPARTMENT`) | `OrgUnitType.java:10-13` |
| Entity field | `rank` `SMALLINT NOT NULL`, `@FieldNameConstants` present | ✅ | `OrgUnit.java:46` (`@FieldNameConstants`), `:99-101` (field) |
| DTOs | create/update `rank` optional; response `.rank(entity.getRank())` | ✅ | `CreateOrgUnitRequest.java:52-53`, `UpdateOrgUnitRequest.java:48-49`, `OrgUnitResponse.java:31,61` |
| Dev-local migrator | `ADD COLUMN IF NOT EXISTS rank SMALLINT NOT NULL DEFAULT 0` | ✅ | `OrgUnitSchemaMigrator.java:30` |
| No stale enum refs | zero `OrgUnitRank.(CUC|CHI_CUC_…|DAI_DIEN)` in `src/main/java` | ✅ 0 matches | grep across `src/main/java` |

## 3. Frontend validation (read/grep of real source)

| Check | Expected | Observed | Evidence anchor |
|---|---|---|---|
| Wire type | `OrgUnitRankName = "DEPARTMENT" \| "BRANCH" \| "REPRESENTATIVE"` | ✅ | `organizationService.ts:72` |
| `RANK_LABELS` / `RANK_OPTIONS` | keyed by NEW names; Vietnamese labels unchanged | ✅ `DEPARTMENT:"Cục"`, `BRANCH:"Chi cục/ Cảng vụ/ Công ty bảo đảm"`, `REPRESENTATIVE:"Đại diện"` | `organizationService.ts:74-84` |
| Model + payloads | `rank?: OrgUnitRankName` in `Organization`, `CreateOrganizationPayload`, `UpdateOrganizationPayload` | ✅ | `organizationService.ts:31,46,62` |
| Mapper sites | all map `rank: item.rank as OrgUnitRankName \| undefined` | ✅ 13 sites | `organizationService.ts:140,257,277,314,402,454,530,598,684,743,780,817,851` |
| Payload wiring | `rank: payload.rank` on create/update | ✅ | `organizationService.ts:578,626,656` |
| List column | `RANK_LABELS[org.rank as OrgUnitRankName] ?? '—'` | ✅ | `UnitList.tsx:410` (header `"Cấp đơn vị"` at `:382`) |
| Detail row | `RANK_LABELS[editingOrg.rank …] ?? '—'` | ✅ | `UnitList.tsx:458` |
| Required Select (drawer) | `<Form.Item name="rank" required …><Select options={RANK_OPTIONS}/>` | ✅ | `UnitList.tsx:497-498` |
| Routed form | rank set + `RANK_OPTIONS` on `name="rank"` | ✅ | `UnitForm.tsx:50,62,111,126,182-185` |
| Parent-select label unchanged | still level-based `(Cấp ${org.level})`, not rank | ✅ | `UnitList.tsx:185` |

## 4. Migration + exclusions

- **Migration unchanged (byte-identical):** `V20260817100000__add_org_unit_rank.sql` still `ADD COLUMN rank SMALLINT NOT NULL DEFAULT 0 → UPDATE backfill (level<=1→0, =2→1, else→2) → ALTER COLUMN DROP DEFAULT`. Logic is ordinal/level-based, so the enum rename requires no change. ✅
- **`OrgUnitType` untouched** — no new constants. ✅
- **No new permission seeding** — no `RolePermissionSeeder` change for this correction. ✅

## 5. Findings

| # | Severity | Finding | Disposition |
|---|---|---|---|
| F-1 | **Low / informational** | The migration header comment still reads `-- Cấp đơn vị: 0=CUC, 1=CHI_CUC_CANG_VU_CONG_TY_BAO_DAM, 2=DAI_DIEN` — the pre-rename enum names, now stale. | **Do not fix.** The mandate says "migration unchanged"; editing an already-applied Flyway migration changes its checksum and breaks validation on deployed environments. The ordinal backfill itself is correct. Flagged for code-reviewer/PMO awareness only. |
| F-2 | None | List column behavior differs from the w1 oracle's TC-AC-18 "list column unchanged" exclusion: the column now renders `RANK_LABELS` (line 410) instead of the former `Cấp {level}`. | **Not a defect** — this is exactly the state the wave-2 work order specifies (`UnitList.tsx:410 … RANK_LABELS[org.rank as OrgUnitRankName] ?? '—'`). Supersedes the w1 design exclusion. |

No failing assertion; no skipped gate.

## 6. Coverage vs oracle TCs (wave-1 oracle → wave-2 outcome)

| TC | Outcome | Basis |
|---|---|---|
| TC-AC-09 (enum + converter) | ✅ PASS | §2 rows 1-2 + `OrgUnitRankConverterTest` (5 tests, incl. range guard) |
| TC-AC-10 (migration) | ✅ PASS (unchanged) | §4 + file read; backfill logic intact |
| TC-AC-11 (dev migrator) | ✅ PASS | `OrgUnitSchemaMigrator.java:30` |
| TC-AC-12 (create resolveRank 4 branches) | ✅ PASS | §2 row 3 + `RankResolutionTests` (5 tests) |
| TC-AC-13 (update partial) | ✅ PASS | §2 row 4 |
| TC-AC-14 (entity + DTOs) | ✅ PASS | §2 rows 6-7 |
| TC-AC-15 (required Select) | ✅ PASS | §3 rows 8-9 |
| TC-AC-16 (frontend type/options/mappers/payload) | ✅ PASS | §3 rows 1-6 |
| TC-AC-17 (detail view label) | ✅ PASS | §3 row 7 |
| TC-AC-18 (exclusions) | ✅ PASS* | §4; *list-column assertion superseded by wave-2 mandate (F-2) |
| TC-AC-19 (build/typecheck) | ✅ PASS | §1 — `mvn clean compile` 0 + `npm run build` 0 |
| TC-N-01 (create fallback) | ✅ PASS (unit level) | `RankResolutionTests` exercises fallback branches; DB-level `SELECT` probe out of scope (no server) |
| TC-N-02 (out-of-range → null → "—") | ✅ PASS (unit level) | `OrgUnitRankConverterTest` range guard; live DB/API probe out of scope (no server) |

## 7. Limitations (stated, not hidden)

1. **No live DB / API / browser probes** — the work order mandates "No git; no server". TC-AC-10 steps 2-4, TC-N-01 DB `SELECT`, and TC-N-02 live probes remain unexecuted by design; their DB-independent halves are covered by unit tests + source inspection.
2. **Frontend typecheck is not exercised by `npm run build`** (`vite build` transpiles via rolldown/esbuild without type-checking). Per workspace memory the `tsc --noEmit` baseline is RED (~90 pre-existing files, unrelated to this change), so a full `tsc` run is not a meaningful green/red gate for this delta. The changed TS files (`organizationService.ts`, `UnitList.tsx`, `UnitForm.tsx`) were read directly and use the new names consistently; a NO-NEW-ERRORS `tsc` diff remains available to the code-reviewer if the operator wants that extra signal.
3. **Ordinal-stability claim** verified by the unchanged constant *order* (0/1/2) in `OrgUnitRank.java` plus the unchanged ordinal-based converter/tests; no DB was opened to re-run the backfill.

## 8. Verdict

**PASS** — the user-mandated rename + correction #2 is present and consistent across backend enum/converter/service/seeders/migration and frontend type/options/mappers/list column; ordinals and Vietnamese display labels are preserved; `OrgUnitType` and the Flyway migration are untouched; all three mandated commands exit 0 (compile 0 · 23 tests 0/0/0 · build 0). The single informational finding (stale migration comment) is intentional under the "migration unchanged" mandate and must NOT be edited.
