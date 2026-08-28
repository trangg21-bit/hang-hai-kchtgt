# QA Report — Wave 1 · HOTFIX TRI-1787825767692-3dab (Luồng hàng hải M-003)

- **Triage**: `docs/intel/_intake/TRI-1787825767692-3dab.json` (C3, full_pipeline, backend footprint, one-way door: `V20260822130000` + `V20260825120000`)
- **Verified by**: engineering-qa-engineer (independent run — no reliance on the backend dev's report)
- **Date**: 2026-08-27
- **Verdict**: **PASS** (all acceptance criteria executed; both Maven commands exit 0; no defects found)

---

## 1. Scope and acceptance mapping

| Acceptance criterion (triage done_oracle) | Oracle | Result |
|---|---|---|
| (1) Repair migration `V20260827090000` converges `buoy_station`/`buoy` code+name and the 4 unaccent trigram indexes; idempotent | `FlywayMigrationTest` green incl. `migrationsAreIdempotent`; migration log shows the version applied; static review of guards | PASS |
| (2) Legacy `route_code` backfilled as `channelCode || '-' || %02d(sequenceNo)` | Static review: migration Section 3 vs `NavigationChannelService.toRouteDetail` format parity (design plan §2.3 spec) | PASS |
| (3) BR-039-08 guard: reject APPROVED/APPROVED_LEVEL2; real change → DRAFT + clear workflow; no-op keeps state + no history | 6 WO-3 guard cases in `NavigationChannelServiceTest` (all executed green) | PASS |
| `mvn test -Dtest=FlywayMigrationTest,NavigationChannelServiceTest,NavigationChannelControllerTest` exits 0 | Executed 2026-08-27 (below) | PASS |
| `mvn compile -DskipTests` exits 0 | Executed 2026-08-27 (below) | PASS |
| No applied migration edited (one-way door) | `git status` / `git diff HEAD` (below) | PASS |

## 2. Executed battery — REAL verbatim output

### 2.1 `mvn test -Dtest=FlywayMigrationTest,NavigationChannelServiceTest,NavigationChannelControllerTest`

Command: `C:\Users\trangtt1\scoop\apps\maven\current\bin\mvn.cmd test "-Dtest=FlywayMigrationTest,NavigationChannelServiceTest,NavigationChannelControllerTest"` (cwd: repo root)

**Result: `Build succeeded (88576ms, exit code 0)`**

```
[INFO] --- compiler:3.13.0:testCompile (default-testCompile) @ kchtg ---
[INFO] Recompiling the module because of changed dependency.
[INFO] Compiling 118 source files with javac [debug parameters release 17] to target\test-classes
[INFO] --- surefire:3.2.5:test (default-test) @ kchtg ---
[INFO] Using auto detected provider org.apache.maven.surefire.junitplatform.JUnitPlatformProvider
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 25.61 s -- in com.hanghai.kchtg.migration.FlywayMigrationTest
[INFO] Running com.hanghai.kchtg.navigationchannel.controller.NavigationChannelControllerTest
[INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 2.089 s -- in com.hanghai.kchtg.navigationchannel.controller.NavigationChannelControllerTest
[INFO] Running com.hanghai.kchtg.navigationchannel.NavigationChannelServiceTest
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 3.669 s -- in com.hanghai.kchtg.navigationchannel.NavigationChannelServiceTest
[INFO] Running com.hanghai.kchtg.navigationchannel.service.NavigationChannelServiceTest
[INFO] Tests run: 18, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.214 s -- in com.hanghai.kchtg.navigationchannel.service.NavigationChannelServiceTest
[INFO]
[INFO] Results:
[INFO]
[INFO] Tests run: 34, Failures: 0, Errors: 0, Skipped: 0
[INFO]
[INFO] --- jacoco:0.8.12:report (report) @ kchtg ---
[INFO] Loading execution data file C:\Users\trangtt1\hang-hai-kchtgt\target\jacoco.exec
[INFO] Analyzed bundle 'HH.KCHT :: M-001 Qu?n tr? h? th?ng' with 658 classes
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  01:25 min
[INFO] Finished at: 2026-08-27T20:00:09+07:00
[INFO] ------------------------------------------------------------------------
```

Surefire report files (same executed run, persisted): `target/surefire-reports/com.hanghai.kchtg.migration.FlywayMigrationTest.txt` (Tests run: 2, Failures: 0, Errors: 0, Skipped: 0), `com.hanghai.kchtg.navigationchannel.service.NavigationChannelServiceTest.txt` (Tests run: 18, Failures: 0, Errors: 0, Skipped: 0), `com.hanghai.kchtg.navigationchannel.controller.NavigationChannelControllerTest.txt` (Tests run: 8, Failures: 0, Errors: 0, Skipped: 0), `com.hanghai.kchtg.navigationchannel.NavigationChannelServiceTest.txt` (Tests run: 6, Failures: 0, Errors: 0, Skipped: 0).

Note: `-Dtest=NavigationChannelServiceTest` (simple-name match) executes BOTH `com.hanghai.kchtg.navigationchannel.NavigationChannelServiceTest` (legacy class, 6 MockMvc tests) AND `com.hanghai.kchtg.navigationchannel.service.NavigationChannelServiceTest` (18 tests incl. the 6 WO-3 guard cases) — hence 6 + 18. Both green.

### 2.2 `mvn compile -DskipTests`

Command: `C:\Users\trangtt1\scoop\apps\maven\current\bin\mvn.cmd compile -DskipTests` (cwd: repo root)

**Result: `Build succeeded (45610ms, exit code 0)`**

```
[INFO] --- compiler:3.13.0:compile (default-compile) @ kchtg ---
[INFO] Recompiling the module because of changed source code.
[INFO] Compiling 1148 source files with javac [debug parameters release 17] to target\classes
[INFO] /C:/Users/trangtt1/hang-hai-kchtgt/src/main/java/com/hanghai/kchtg/accesslog/service/LogService.java: Some input files use or override a deprecated API.
[INFO] /C:/Users/trangtt1/hang-hai-kchtgt/src/main/java/com/hanghai/kchtg/accesslog/service/LogService.java: Recompile with -Xlint:deprecation for details.
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  42.196 s
[INFO] Finished at: 2026-08-27T19:58:18+07:00
[INFO] ------------------------------------------------------------------------
```

## 3. Flyway chain — V20260827090000 executed (verbatim from `target/surefire-reports/TEST-com.hanghai.kchtg.migration.FlywayMigrationTest.xml` system-out, run at 19:59)

```
19:59:54.842 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "public" to version "20260827090000 - fix buoy station unaccent search index and backfill route code"
19:59:54.857 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Successfully applied 244 migrations to schema "public", now at version v20260827090000 (execution time 00:11.099s)
19:59:55.332 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Current version of schema "public": 20260827090000
```

The repair migration **executes in the chain** on a UAT-shaped embedded PostgreSQL (baseline 81, out-of-order). The second Flyway run inside `migrationsAreIdempotent` re-reports the same current version and the test asserts `migrationsExecuted == 0` — i.e. re-running the chain is a no-op.

## 4. Static review vs design plan `00-design-plan.md` (WO-1/WO-2) + BR-039-08

### 4.1 Migration idempotency (WO-1, §1.3 spec) — PASS

| Guard | Evidence |
|---|---|
| `to_regclass('public.buoy_station')` / `to_regclass('public.buoy')` / `to_regclass('public.channel_route_detail')` + `navigation_channel` before every statement block | Section 1, 2, 3 of `V20260827090000` — table-missing environments skip cleanly |
| `ADD COLUMN IF NOT EXISTS code/name` on `buoy_station` AND `buoy` (VARCHAR(50) / VARCHAR(255)) | Section 1 — second run no-op |
| 4 × `CREATE INDEX IF NOT EXISTS` unaccent trigram partial indexes (`WHERE deleted_at IS NULL`): `idx_buoy_station_active_code_unaccent_trgm`, `idx_buoy_station_active_name_unaccent_trgm`, `idx_buoy_active_code_unaccent_trgm`, `idx_buoy_active_name_unaccent_trgm` | Section 2 — second run no-op |
| `UPDATE ... WHERE route_code IS NULL` | Section 3 — second run has no NULL rows left, no-op |

Executed confirmation: `migrationsAreIdempotent` (2nd `flyway.migrate()` → `migrationsExecuted` asserted 0) — PASS, part of the 2-test FlywayMigrationTest run.

### 4.2 route_code backfill format parity (WO-1, §2.3 spec) — PASS

- Migration Section 3: `(SELECT nc.channel_code FROM public.navigation_channel nc WHERE nc.id = channel_route_detail.navigation_channel_id) || '-' || LPAD(COALESCE(sequence_no, 1)::text, 2, '0')`
- `NavigationChannelService.toRouteDetail` (line 831): `nc.getChannelCode() + "-" + String.format("%02d", sequenceNo)` (fallback `sequenceNo = index + 1` when null)
- `LPAD(x::text, 2, '0')` ≡ `String.format("%02d", x)` for x in 0..99, identical for x ≥ 100; `COALESCE(sequence_no, 1)` mirrors the Java never-NULL fallback. Format parity holds; SQL matches the design-plan §2.3 spec verbatim.

### 4.3 BR-039-08 guard (WO-2) — PASS

| Rule | Evidence (NavigationChannelService.update) |
|---|---|
| Reject APPROVED / APPROVED_LEVEL2 fail-fast BEFORE any mutation | `if (currentStatus == ApprovalStatus.APPROVED || currentStatus == ApprovalStatus.APPROVED_LEVEL2) { throw new IllegalStateException("Không thể sửa hồ sơ đã duyệt"); }` — placed right after `assertEditable` + `currentStatus` derivation, before scope check / trim / copy / GIS / history (lines 234-240) |
| Enum refs, no string literals | `ApprovalStatus.APPROVED`, `ApprovalStatus.APPROVED_LEVEL2` (import line 16); zero string-literal statuses in the guard |
| Vietnamese có dấu message | `"Không thể sửa hồ sơ đã duyệt"` |
| Whitespace-only payload → no-op | `trimRequestStrings(req)` (9 fields) runs BEFORE `copyPropertiesIfPresent`; `hasFieldChanges = !previousValues.isEmpty()` early-returns — state kept, no history, `updatedAt` untouched (lines 246, 395-405) |
| REJECTED-family real change → DRAFT + clear 9 workflow fields | `if (currentStatus != ApprovalStatus.DRAFT)` resets: `submittedAt`, `submittedBy`, `approverLevel1`, `approvedDateLevel1`, `approverLevel2`, `approvedDateLevel2`, `rejectionReason`, `level1ApprovalContent`, `level2ApprovalContent` (lines 414-424) |
| `recordSaveAndApprove` path removed | grep `recordSaveAndApprove` in `NavigationChannelService.java` → 0 hits; `assertEditable` retained (line 231) |
| DataScope write-scope + FieldWriteGuard retained | `orgUnitScopeService.currentUserScope().allows(...)` + `FieldWriteGuard.validateObject(req)` intact |

### 4.4 One-way door — no applied migration edited — PASS

`git status --short` + `git diff --stat HEAD -- src/main/resources/db/migration/ src/main/java/com/hanghai/kchtg/navigationchannel/service/ src/test/`:

- Changed vs HEAD: `NavigationChannelService.java` (39 insertions/9 deletions), `NavigationChannelServiceTest.java` (+141), `uat-schema-fixture.sql` (+24), and the NEW untracked `V20260827090000__fix_buoy_station_unaccent_search_index_and_backfill_route_code.sql`.
- `V20260822130000__add_unaccent_port_buoy_search_indexes.sql` and `V20260825120000__navigation_channel_excel_71_fields.sql` do NOT appear as modified — the one-way door holds.
- Fixture diff (`git diff HEAD -- src/test/resources/uat-schema-fixture.sql`) is exactly the `qhcb_all` schema + `area`/`line`/`point` tables block (+24 lines, `CREATE SCHEMA IF NOT EXISTS qhcb_all` + 3 `CREATE TABLE IF NOT EXISTS` with nullable `schema_name`/`table_name`/`fid`), matching the WO-3 test-only fixture fix.

## 5. WO-3 guard test cases — executed and green (in the 18-test `com.hanghai.kchtg.navigationchannel.service.NavigationChannelServiceTest`)

1. `update_approved_shouldReject` — APPROVED + real change → `IllegalStateException` "Không thể sửa hồ sơ đã duyệt", fields unchanged, `repo.save` never, history never
2. `update_approvedLevel2_shouldReject` — APPROVED_LEVEL2 + real change → same rejection, zero side effects
3. `update_rejectedWithRealChange_shouldResetToDraftAndClearWorkflow` — REJECTED + real change → `approvalStatus == DRAFT`, all 9 workflow fields NULL, exactly 1 `UPDATED` history row with `changedField` non-blank
4. `update_identicalPayload_shouldBeNoOp` — identical payload (record REJECTED) → state kept (still REJECTED), no history, `updatedAt` unchanged
5. `update_whitespaceOnlyEdit_shouldBeNoOp` — `"   Luong Hon Gai - Cai Lan   "` → after trim equals stored value → no-op: state kept, no history, `updatedAt` unchanged
6. `update_draftWithRealChange_shouldPartialUpdateAndSetUpdatedBy` — DRAFT boundary → partial update, `updatedBy` from session

## 6. Coverage notes / limitations

- The backfill Section 3 executes against the real `channel_route_detail` table (created earlier in the chain by `V20260825120000`) but with **zero seeded rows** in the test fixture — the UPDATE runs cleanly but no legacy row is exercised. Format correctness rests on static parity review (4.2), as anticipated by design plan §7 ("Fixture lacks channel_route_detail — guarded by to_regclass"). A real-DB/UAT post-migrate check (`SELECT count(*) FROM channel_route_detail WHERE route_code IS NULL` for rows with a parent) is recommended as follow-up.
- Two `NavigationChannelServiceTest` classes coexist (`com.hanghai.kchtg.navigationchannel` legacy, `com.hanghai.kchtg.navigationchannel.service` new); the `-Dtest` simple-name filter runs both (6 + 18 = 24 service tests). Not a defect, but future `-Dtest` invocations should expect 34 total for this filter.
- WO-4 (docs sync: F-039 lean-spec `BR-039-08` row, `00-lean-spec.md:66`, still reads "chờ PMO chốt") is an orchestrator follow-up by design; flagging here so the BA sync is dispatched — not a blocker for this wave.
- Out of scope (per brief): source inputs `docs/inputs/photo_2026-07-09_15-47-20.jpg` and `docs/inputs/logo-vinamarine_1_1.png` were read; they are UI asset files unrelated to this backend hotfix verification.

## 7. Evidence index

- Executed: `mvn test ...` → exit 0, BUILD SUCCESS, Tests run: 34 / Failures: 0 / Errors: 0 / Skipped: 0 (2026-08-27T20:00:09+07:00)
- Executed: `mvn compile -DskipTests` → exit 0, BUILD SUCCESS, 1148 files (2026-08-27T19:58:18+07:00)
- Flyway chain: `target/surefire-reports/TEST-com.hanghai.kchtg.migration.FlywayMigrationTest.xml` system-out lines 1152/1161/1163 (V20260827090000 applied; 244 migrations; current version 20260827090000; idempotent re-run)
- Read: `V20260827090000__fix_buoy_station_unaccent_search_index_and_backfill_route_code.sql` (65 lines, 3 sections)
- Read: `NavigationChannelService.java` lines 220-260, 390-470, 815-905; grep `recordSaveAndApprove` → 0 hits
- Read: `NavigationChannelServiceTest.java` (18 tests incl. 6 WO-3 cases), `NavigationChannelControllerTest.java` (8 tests), `FlywayMigrationTest.java` (2 tests)
- Read: `docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/design/00-design-plan.md` (§1.3/§2.3/§3.2/§5/§6/§7)
- Read: `docs/intel/_intake/TRI-1787825767692-3dab.json`
- Executed: `git status --short`; `git diff --stat HEAD` (migration/service/test paths); `git diff HEAD -- src/test/resources/uat-schema-fixture.sql`
