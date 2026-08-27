# Implementation record — HOTFIX TRI-1787825767692-3dab (M-003 Luồng hàng hải)

Backend implement seat · wave 1 · task slug `repair-migration-state-guard-tests`
Contract: `docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/design/00-design-plan.md` WO-1..WO-3.

## Files changed

| File | Change |
|---|---|
| `src/main/resources/db/migration/V20260827090000__fix_buoy_station_unaccent_search_index_and_backfill_route_code.sql` | NEW (WO-1) — idempotent repair migration, 3 guarded sections |
| `src/main/java/com/hanghai/kchtg/navigationchannel/service/NavigationChannelService.java` | (WO-2) — BR-039-08 update guard |
| `src/test/java/com/hanghai/kchtg/navigationchannel/service/NavigationChannelServiceTest.java` | (WO-3) — 6 new guard cases (suite: 12 → 18) |

One-way door respected: `V20260822130000` and `V20260825120000` untouched (byte-identical, not edited). No other source file modified. Duplicate test `src/test/java/com/hanghai/kchtg/navigationchannel/NavigationChannelServiceTest.java` is a **distinct FQCN** (different package) — it does NOT shadow the service-package class; both compiled and ran (6 + 18 tests). No third test class introduced, per brief.

## WO-1 — repair migration (before → after)

**Before**: real DBs recorded an older `V20260822130000` whose `buoy_station` lacks `code`/`name`, so `idx_buoy_station_active_code_unaccent_trgm` fails at boot (`V20260803370000` added `code` to `buoy` only); legacy `channel_route_detail.route_code` stays NULL after the `ma`→`route_code` rename (§9 of `V20260825120000`).

**After** (`V20260827090000`, version sorts after all existing migrations, latest `V20260826090000`):
1. `DO $$` + `to_regclass` guard: `ADD COLUMN IF NOT EXISTS code VARCHAR(50)` / `name VARCHAR(255)` on `buoy_station` **and** `buoy`.
2. `DO $$` + `to_regclass` guard: `CREATE INDEX IF NOT EXISTS` for the 4 unaccent trigram partial indexes (`idx_buoy_station_active_code_unaccent_trgm`, `idx_buoy_station_active_name_unaccent_trgm`, `idx_buoy_active_code_unaccent_trgm`, `idx_buoy_active_name_unaccent_trgm`) using `public.immutable_unaccent(LOWER(...)) gin_trgm_ops WHERE deleted_at IS NULL` — shape identical to the applied `V20260822130000:70-91` block.
3. `DO $$` + `to_regclass` guard on both tables: `UPDATE channel_route_detail SET route_code = (SELECT nc.channel_code FROM navigation_channel nc WHERE nc.id = channel_route_detail.navigation_channel_id) || '-' || LPAD(COALESCE(sequence_no, 1)::text, 2, '0') WHERE route_code IS NULL;` — format parity with `NavigationChannelService.toRouteDetail` (`channelCode + "-" + String.format("%02d", sequenceNo)`, service lines 817-822, verified this session).

Idempotent: every statement guarded by `IF NOT EXISTS` / `to_regclass`; re-run is a no-op. Enum columns untouched (SQL enums are INT by convention).

## WO-2 — BR-039-08 update guard (before → after)

Inserted immediately after `currentStatus` is computed (before orgUnitId scope check, before ANY mutation), per design plan §3.2 Change 1:

```java
if (currentStatus == ApprovalStatus.APPROVED || currentStatus == ApprovalStatus.APPROVED_LEVEL2) {
    throw new IllegalStateException("Không thể sửa hồ sơ đã duyệt");
}
```

- Enum references only (`ApprovalStatus.APPROVED` / `APPROVED_LEVEL2`), no string literals (enum stored INT, `@Enumerated(EnumType.ORDINAL)`).
- Message Vietnamese có dấu, mirroring `assertEditable` style.
- Fail-fast precedes every side effect (children/GIS/history) — a rejected request leaves zero traces.
- **Before**: APPROVED + real change → `approvalService.recordSaveAndApprove(...)` (edit ALLOWED, state kept, history UPDATED). **After**: that now-unreachable branch is DELETED; the reset branch is now `if (currentStatus != ApprovalStatus.DRAFT)` only — reachable solely for REJECTED / REJECTED_LEVEL1 / REJECTED_LEVEL2 / PROPOSED, which resets to `DRAFT` and clears the 9 workflow fields (`submittedAt`, `submittedBy`, `approverLevel1`, `approvedDateLevel1`, `approverLevel2`, `approvedDateLevel2`, `rejectionReason`, `level1ApprovalContent`, `level2ApprovalContent`). `InfrastructureApprovalService` untouched (assertEditable/recordSaveAndApprove remain for other modules).
- **Whitespace-only → true no-op**: new `trimRequestStrings(req)` runs the 9-field `trimToNull` normalization on the REQUEST before `copyPropertiesIfPresent` (design plan §3.2 Change 2; post-copy normalization kept as idempotent belt-and-braces). A whitespace-only payload now compares equal to stored values → no `previousValues` entry → existing no-op early return keeps state, records NO history, does not touch `updatedBy`/`updatedAt`.
- Unchanged and verified in place: `assertEditable` call, orgUnitId write-scope check (`orgUnitScopeService.currentUserScope().allows(...)`), no-op early return, `updatedBy` from session + `repo.save` + history `UPDATED`, `FieldWriteGuard.validateObject`. Field names via `NavigationChannelUpdateRequest.Fields.*` (no hardcoded strings).

## WO-3 — tests (before → after)

Added 6 cases to `.../navigationchannel/service/NavigationChannelServiceTest.java` (all through the real `NavigationChannelService.update` public seam, mocked repositories only):

1. `update_approved_shouldReject` — APPROVED + real change → `IllegalStateException("Không thể sửa hồ sơ đã duyệt")`, entity unchanged, `repo.save`/`approvalHistoryRepo.save` never called.
2. `update_approvedLevel2_shouldReject` — same for APPROVED_LEVEL2.
3. `update_rejectedWithRealChange_shouldResetToDraftAndClearWorkflow` — REJECTED + real change → `approvalStatus == DRAFT`, all 9 workflow fields NULL, exactly one `UPDATED` history row with `changedField` non-blank (captured via `ArgumentCaptor`), `updatedBy` set.
4. `update_identicalPayload_shouldBeNoOp` — identical payload on a REJECTED record → state kept, `updatedAt` unchanged, no save, no history.
5. `update_whitespaceOnlyEdit_shouldBeNoOp` — `"   " + channelName + "   "` → no-op (state kept, no history, `updatedAt` unchanged).
6. `update_draftWithRealChange_shouldPartialUpdateAndSetUpdatedBy` (boundary) — DRAFT + real change → partial update, `updatedBy` from session, one save + one history.

## Verification (real executed output)

Command 1 (from repo root, full-path Maven):
`C:\Users\trangtt1\scoop\apps\maven\current\bin\mvn.cmd test "-Dtest=FlywayMigrationTest,NavigationChannelServiceTest,NavigationChannelControllerTest"`

Surefire reports (regenerated on the re-run, authoritative):

| Test class | Tests run | Failures | Errors |
|---|---|---|---|
| `com.hanghai.kchtg.migration.FlywayMigrationTest` | 2 | 0 | **2** |
| `com.hanghai.kchtg.navigationchannel.service.NavigationChannelServiceTest` | **18** | 0 | 0 |
| `com.hanghai.kchtg.navigationchannel.NavigationChannelServiceTest` (duplicate class) | 6 | 0 | 0 |
| `com.hanghai.kchtg.navigationchannel.controller.NavigationChannelControllerTest` | 8 | 0 | 0 |

**Result: BUILD FAILURE** — all 32 non-migration tests pass (18 service incl. the 6 new guard cases, 8 controller, 6 duplicate-class); `FlywayMigrationTest` errors on a migration that is NOT part of this hotfix:
`Migration V20260825113000__add_planning_gis_replica_identity.sql failed … ERROR: schema "qhcb_all" does not exist` (line 6, `ALTER TABLE qhcb_all.area …`). pom.xml surefire config has no `testFailureIgnore` and no `.mvn/maven.config` exists, so test errors ⇒ non-zero exit.

**Pre-existence proof (not caused by this change)**:
1. `V20260825113000` (2026-08-25) sorts BEFORE `V20260827090000` (2026-08-27) — Flyway aborts at the earlier migration, so the repair migration never executed in this suite.
2. The failing file was not edited this session (session writes: exactly the 3 files above).
3. `src/test/resources/uat-schema-fixture.sql` (committed, untouched) contains no `qhcb_all` (grep: 0 hits) — `V20260825113000` can never pass on this fixture, independent of this change.
4. Note: the supervisor's background-job exit code reported 0 for the mvn.cmd run — a PowerShell wrapper artifact; the surefire `<<< FAILURE!` reports + standard surefire config are the ground truth (recorded as a workspace gotcha).

Command 2:
`C:\Users\trangtt1\scoop\apps\maven\current\bin\mvn.cmd compile -DskipTests` → main sources compile cleanly (BUILD SUCCESS); the `mvn test` run also compiled main + test sources (tests executed).

## Blocker

`FlywayMigrationTest` cannot pass until the `qhcb_all` fixture gap is closed — this is outside this seat's edit boundary (migration `V20260825113000` is committed/applied; the fixture and "all other source files" are read-only per the brief). My migration `V20260827090000` therefore did not execute in the harness (chain aborts before it); its SQL patterns are byte-identical in shape to the applied `V20260822130000:70-91` block which DID execute successfully in the same chain, so syntax/pattern confidence is high, but runtime execution evidence is pending the blocker fix.

**Next action (owner: PMO / migration-chain author)**: add the `qhcb_all` schema + `area`/`line` tables to `src/test/resources/uat-schema-fixture.sql` (or, if the schema is genuinely absent on real DBs, a guarded new repair migration) — then re-run the two acceptance commands; `V20260827090000` will then execute and can be verified end-to-end.

## Durable knowledge recorded (this session)

- `flyway-fixture-qhcb-all-blocker` (gotcha, ~0.7) — FlywayMigrationTest fails at V20260825113000 (schema qhcb_all missing from uat-schema-fixture.sql) — pre-existing, blocks full-chain acceptance; repair migration V20260827090000 never runs in the suite until fixed.
- `mvn-cmd-background-exit-code-wrapper` (gotcha, ~0.6) — on this workspace, supervisor-reported exit code for background `mvn.cmd` jobs is unreliable (reported 0 despite surefire errors); trust target/surefire-reports/*.txt.
