# Backend Implementation Summary — WO-01..05: OrgUnit "Cấp đơn vị" rank field (TRI-1786936397148-3956)

## Scope

Implemented the backend half of the F-003 rank ("Cấp đơn vị") change per
`design/00-design-plan.md` §D4/D5 + §3 WO-01..05 and `ba/00-lean-spec.md` (BR-003-09/10/12/13).
This run additionally applied the user-mandated enum-constant rename (English identifiers):
`CUC → DEPARTMENT`, `CHI_CUC_CANG_VU_CONG_TY_BAO_DAM → BRANCH`, `DAI_DIEN → REPRESENTATIVE`.
**Ordinals are unchanged (0/1/2)**; DB ordinal mapping, converter, and migration behavior are identical.

## Files created

| File | Content |
|---|---|
| `src/main/java/com/hanghai/kchtg/orgunit/entity/OrgUnitRank.java` | Enum `DEPARTMENT(0)`, `BRANCH(1)`, `REPRESENTATIVE(2)`; NO `@JsonValue` → Jackson NAME serialization (mirrors `OrgUnitStatus`); Javadoc labels stay Vietnamese ("Cục", "Chi cục/ Cảng vụ/ Công ty bảo đảm", "Đại diện") |
| `src/main/java/com/hanghai/kchtg/orgunit/entity/OrgUnitRankConverter.java` | `@Converter(autoApply = true)` `AttributeConverter<OrgUnitRank, Short>`; write `(short) attribute.ordinal()` null-safe; read range-guarded `[0..values.length)` else `null` (BR-003-10). Ordinal-based → **untouched by rename** |
| `src/main/resources/db/migration/V20260817100000__add_org_unit_rank.sql` | `ADD COLUMN rank SMALLINT NOT NULL DEFAULT 0` → backfill `CASE WHEN level<=1 THEN 0 WHEN level=2 THEN 1 ELSE 2 END` → `DROP DEFAULT` (exact per design; **not modified** by rename) |
| `src/test/java/com/hanghai/kchtg/orgunit/entity/OrgUnitRankConverterTest.java` | 5 unit tests: ordinal write 0/1/2, null write, ordinal read, out-of-range guard (−1, 3 → null), null read |

## Files modified

| File | Change |
|---|---|
| `src/main/java/com/hanghai/kchtg/orgunit/entity/OrgUnit.java` | Added `@FieldNameConstants` (class-level, additive) + field `private OrgUnitRank rank;` with `@Column(nullable = false, columnDefinition = "SMALLINT")`, no `@Column(name)` (field name = column name); field Javadoc updated to new constant names |
| `src/main/java/com/hanghai/kchtg/orgunit/dto/CreateOrgUnitRequest.java` | Added `private OrgUnitRank rank;` (after `operationalStatus`, optional, BR-003-12); `@Data` Lombok retained; import added |
| `src/main/java/com/hanghai/kchtg/orgunit/dto/UpdateOrgUnitRequest.java` | Added `private OrgUnitRank rank;` (after `operationalStatus`, optional, BR-003-13); `@Data` retained; import added |
| `src/main/java/com/hanghai/kchtg/orgunit/dto/OrgUnitResponse.java` | Added `private OrgUnitRank rank;` + `.rank(entity.getRank())` in `from()`; Lombok retained |
| `src/main/java/com/hanghai/kchtg/orgunit/service/OrganizationService.java` | `create()` builder `.rank(resolveRank(request.getRank(), parent))` after `.operationalStatus(...)`; `update()` scalar block `if (request.getRank() != null) unit.setRank(request.getRank());` after operationalStatus set; `resolveRank(requested, parent)`: explicit wins → `parent == null → DEPARTMENT` → `parent.level == 1 → BRANCH` → `REPRESENTATIVE`; constants + Javadoc renamed |
| `src/main/java/com/hanghai/kchtg/orgunit/config/OrgUnitSchemaMigrator.java` | In `run()` after operational_status statements: `ALTER TABLE org_units ADD COLUMN IF NOT EXISTS rank SMALLINT NOT NULL DEFAULT 0` (keeps DEFAULT 0, no DROP) + Vietnamese log `Đã kiểm tra cấu trúc cấp đơn vị.` |
| `src/main/java/com/hanghai/kchtg/orgunit/config/OrgUnitDataFixer.java` | `rankForLevel(level)`: `<=1 → DEPARTMENT`, `==2 → BRANCH`, else `REPRESENTATIVE`; used at seed root / child builders |
| `src/main/java/com/hanghai/kchtg/seeder/DataSeeder.java` | Same `rankForLevel` mapping (root L1, children L2, grandchildren L3) |
| `src/main/java/com/hanghai/kchtg/seeder/M001DataSeeder.java` | Same `rankForLevel` mapping |
| `src/test/java/com/hanghai/kchtg/orgunit/service/OrganizationServiceTest.java` | `RankResolutionTests` (5): explicit rank on create, default DEPARTMENT for root, infer BRANCH from level-1 parent, infer REPRESENTATIVE from level-2 parent, set rank on update — constants renamed |

## Explicitly NOT touched

- `OrgUnitType.java` / `OrgUnitTypeConverter.java` (deprecated enum; its `CUC`/`CHI_CUC` constants are a different enum)
- `RolePermissionSeeder.java` (no new permission seeding per design)
- Migration SQL body (`V20260817100000__add_org_unit_rank.sql`) and `OrgUnitRankConverter.java` — ordinal-based; behavior identical under rename (their comment still names the old constants; ordinals 0/1/2 unchanged)
- Frontend (`frontend/**`) — separate wave; NOTE: wire NAME format changed to `DEPARTMENT`/`BRANCH`/`REPRESENTATIVE`, so frontend `RANK_OPTIONS`/`RANK_LABELS` must be keyed by the NEW names
- List `level` column logic (UnitList) — untouched per design exclusion

## Verification (real executed output)

1. `mvn clean compile` @ `D:\project\hang-hai-kchtgt`
   → `BUILD SUCCESS`, **exit code 0** (37.434 s; 1096 source files compiled, Java 17). Only pre-existing warnings (Lombok `equals/hashCode` on unrelated station entities, `javax.annotation.meta.When`).
2. `mvn test -Dtest=OrganizationServiceTest,OrgUnitRankConverterTest`
   → `BUILD SUCCESS`, **exit code 0**; `Tests run: 23, Failures: 0, Errors: 0, Skipped: 0`
   - `OrgUnitRankConverterTest`: 5/5 (ordinal write/read + null + range guard)
   - `OrganizationServiceTest$RankResolutionTests`: 5/5
   - Remaining `OrganizationServiceTest` nested suites (Hierarchy 2, ApprovalWorkflow 5, DeleteGuard 3, UniqueCode 3) + top-level: 13/13 — existing behavior unbroken

No git operations performed; backend server not started (compile/test only).
