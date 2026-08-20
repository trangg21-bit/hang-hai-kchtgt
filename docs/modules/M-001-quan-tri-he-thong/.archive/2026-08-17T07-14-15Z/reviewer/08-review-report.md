# Code Review — TRI-1786936397148-3956 · user-mandated rename + correction #2 (F-003 / M-001)

## 1. Verdict

**PASS** — the rename (`OrgUnitRank` → `DEPARTMENT(0)` / `BRANCH(1)` / `REPRESENTATIVE(2)`) and correction #2 (list column now shows rank) are implemented consistently across backend, seeders, tests, and frontend. Ordinals and Vietnamese display labels are preserved; `OrgUnitType` and the Flyway migration logic are untouched. No blocking finding survives my own reproduction attempt (rank-scoped backend tests exit 0; frontend `vite build` exit 0).

Confidence: **high** — direct source inspection of every changed seam + two independent executed verification commands, corroborated by the QA W2 report.

## 2. Scope inspected

| Area | Files / anchors |
|---|---|
| Enum + converter | `orgunit/entity/OrgUnitRank.java`, `OrgUnitRankConverter.java` |
| Entity | `orgunit/entity/OrgUnit.java` (`rank` field ~L96-98, `@FieldNameConstants` ~L45) |
| DTOs | `CreateOrgUnitRequest.java`, `UpdateOrgUnitRequest.java`, `OrgUnitResponse.java` |
| Service | `OrganizationService.java` (create L309-311, update L418-421, `resolveRank` L438-445) |
| Seeders (3× `rankForLevel`) | `orgunit/config/OrgUnitDataFixer.java`, `seeder/DataSeeder.java`, `seeder/M001DataSeeder.java` |
| Dev migrator + Flyway | `OrgUnitSchemaMigrator.java` L30, `V20260817100000__add_org_unit_rank.sql` |
| Untouched (verified) | `OrgUnitType.java`, `OrgUnitTypeConverter.java` — `git diff` empty |
| Frontend | `services/organizationService.ts`, `pages/organizations/UnitList.tsx`, `UnitForm.tsx` |
| Tests | `orgunit/entity/OrgUnitRankConverterTest.java`, `orgunit/service/OrganizationServiceTest.java` |

## 3. Verification results (all reproduced this session)

| Check | Result | Evidence |
|---|---|---|
| Enum constants renamed, ordinals preserved | ✅ | `OrgUnitRank.java` declares `DEPARTMENT, BRANCH, REPRESENTATIVE` in that order → ordinals 0/1/2; no `@JsonValue` (NAME serialization, mirrors `OrgUnitStatus`) |
| Converter ordinal + range guard | ✅ | `OrgUnitRankConverter.java`: `(short) ordinal()` → DB; `dbData in [0..2]` else `null` |
| Entity `rank` + `@FieldNameConstants` | ✅ | `OrgUnit.java` L96-98 `@Column(nullable=false, columnDefinition="SMALLINT") private OrgUnitRank rank;` |
| DTO rank fields | ✅ | create/update `private OrgUnitRank rank;` (optional); response `private OrgUnitRank rank;` + `.rank(entity.getRank())` |
| `resolveRank` matches BR-003-12 | ✅ | `null → DEPARTMENT`; `parent.level==1 → BRANCH`; else `REPRESENTATIVE`. Consistent with migration backfill (own level 1→0, 2→1, ≥3→2) |
| update partial (BR-003-13) | ✅ | `if (request.getRank() != null) unit.setRank(...)` |
| 3 seeders `rankForLevel` | ✅ | all use `DEPARTMENT/BRANCH/REPRESENTATIVE` (own-level based) |
| `OrgUnitType` untouched | ✅ | `git diff` on both files empty |
| Flyway migration logic unchanged | ✅ | `ADD COLUMN … DEFAULT 0` → backfill by level → `DROP DEFAULT` (ordinal-based, name-agnostic) |
| Frontend keyed by new names | ✅ | `organizationService.ts:72` `OrgUnitRankName = "DEPARTMENT" | "BRANCH" | "REPRESENTATIVE"`; `RANK_LABELS` L74-78 (labels unchanged); `RANK_OPTIONS` L80-83; `rank?: OrgUnitRankName` in `Organization` + both payloads; 16 mapper/payload sites map `rank` |
| Correction #2 — list column shows rank | ✅ | `UnitList.tsx:410` `RANK_LABELS[org.rank as OrgUnitRankName] ?? '—'`; header L382 still "Cấp đơn vị"; detail row L458 same pattern |
| Parent-select label unchanged | ✅ | `UnitList.tsx:~185` still `` `${org.name}${org.level ? ` (Cấp ${org.level})` : ''}` `` |
| Required dropdown (create/edit + routed form) | ✅ | `UnitList.tsx:507-508` `Form.Item name="rank" required … options={RANK_OPTIONS}`; `UnitForm.tsx` `FormField name="rank" required options={RANK_OPTIONS}` |
| Backend rank tests pass | ✅ | `mvn -Dtest=OrgUnitRankConverterTest,OrganizationServiceTest -DfailIfNoTests=false test` → **`Tests run: 23, Failures: 0, Errors: 0, Skipped: 0`**, exit 0 (compiles all main+test sources; converter 5 + service 18 incl. RankResolution·Hierarchy·ApprovalWorkflow·DeleteGuard·UniqueCode) |
| Frontend build passes | ✅ | `npm run build` (frontend) → **exit 0** (vite v8.1.5, 4034 modules) |

## 4. Findings (none blocking)

| # | Severity | Anchor | Finding | Required correction |
|---|---|---|---|---|
| 1 | Minor / informational | `V20260817100000__add_org_unit_rank.sql:1` | Comment still reads `0=CUC, 1=CHI_CUC_CANG_VU_CONG_TY_BAO_DAM, 2=DAI_DIEN`. SQL is ordinal-based, so it is **functionally correct** regardless of enum names. | None — the mandate says "migration unchanged"; leave as-is. Flagged only so the next reader doesn't misread it as an unmigrated rename. |
| 2 | Minor / cosmetic | `OrganizationServiceTest.java:320` | `@DisplayName("shouldDefaultRankToCucForRootUnit")` retains the pre-rename token "Cuc"; the assertion is already `OrgUnitRank.DEPARTMENT`. | Rename the display string to `shouldDefaultRankToDepartmentForRootUnit` (author, non-blocking). |
| 3 | Minor / coverage gap | `OrganizationServiceTest.java` `RankResolutionTests` | No test asserts the negative branch of AC-003-13(b): "update without `rank` keeps the previous value". The code null-guards correctly, but the discriminating test is absent. | Add one test: `update()` with `request.getRank() == null` leaves `unit.getRank()` unchanged. |
| 4 | Low / latent | `OrgUnit.java:142` `createRoot(...)` | Dead static factory (0 callers) does **not** set `rank`; if ever resurrected it would insert `null` rank against `NOT NULL` (converter maps null→null). Pre-existing factory, no runtime impact today. | Optional: add `.rank = OrgUnitRank.DEPARTMENT` to the factory, or leave with a comment. |
| 5 | Observation (out-of-scope) | repo-root `src/*.tsx` scratch files | `src/UnitList.tsx`, `src/UnitForm.tsx`, `src/pages/organizations/UnitList.tsx`, `src/tokens.ts` etc. still contain old `'CUC'`/`'CHI_CUC'` strings. They are **dead code outside both build systems** (frontend is `frontend/`, Java is `src/main/java`); not part of this diff. | None for this ticket; cleanup is a separate housekeeping task. |

## 5. Cross-seat note — spec/design lag the mandate (not a code defect)

The **code** correctly implements the user mandate. However, two upstream documents still record the pre-rename state and the pre-correction exclusion:

- `design/00-design-plan.md` — D1/D3/D6 enumerate `CUC` / `CHI_CUC_CANG_VU_CONG_TY_BAO_DAM` / `DAI_DIEN`; D7 lists "list column keeps `Cấp {level}`" as an exclusion.
- `ba/00-lean-spec.md` — `AC-003-16`/`BR-003-09`/`BR-003-12` use the old enum names; `AC-003-18`/`BR-003-15` still say the list column must keep `Cấp {level}` (superseded by correction #2).

These are documentation-sync items owned by the BA/SA seats, not defects in the reviewed code. Recommend the orchestrator dispatch a doc-sync pass so the spec, design, and QA oracle (already aligned to the mandate in `07-qa-report-w2.md`) agree.

## 6. Full-suite result — unrelated cross-module red (honest disclosure)

`mvn -q test` (full suite, executed this session) → **`Tests run: 814, Failures: 0, Errors: 186, Skipped: 0`, exit code 1 (BUILD FAILURE)**. All 186 errors are `@SpringBootTest` context-load failures caused by the in-flight **M-1004 field-visibility feature** (untracked `src/main/java/com/hanghai/kchtg/fieldvisibility/**`): `WebConfig` registers `fieldVisibilityInterceptor`, which cannot autowire its dependency — `No qualifying bean of type 'com.hanghai.kchtg.fieldvisibility.service.FieldVisibilityService'` (surefire-reports confirm this single root cause across `BeaconLightControllerTest`, `M003RbacSecurityTest`, `BerthRbacSecurityTest`, etc.). **Zero surefire error reports reference `OrgUnitRank`** — the rename is not implicated.

This red is **outside this review's scope** and does not block the rename verdict; it is a real, currently-broken condition in the shared working tree owned by M-1004 (the `FieldVisibilityService` bean is not component-scanned while its interceptor is wired into `WebConfig`). The QA W2 "23 tests 0/0/0" figure corresponds exactly to the rank-scoped unit tests, which still pass (see §3).

Untested edges: no live DB probe of the backfill (`SELECT` on a populated `org_units`), no API/browser probe of the NAME round-trip — same stated limitations as QA W2 §7.
