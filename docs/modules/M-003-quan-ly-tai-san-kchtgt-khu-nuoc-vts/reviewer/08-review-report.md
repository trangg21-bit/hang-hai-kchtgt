# Code Review Report — HOTFIX TRI-1787825767692-3dab (Luồng hàng hải M-003)

- **Reviewer seat:** engineering-code-reviewer
- **Work item:** HOTFIX TRI-1787825767692-3dab — buoy_station unaccent index repair + route_code backfill + BR-039-08 update guard
- **Contract:** `docs/intel/_intake/TRI-1787825767692-3dab.json` (done_oracle), `design/00-design-plan.md` (WO-1/WO-2/WO-3), `qa/07-qa-report-w1.md` (QA battery)
- **Date:** 2026-08-27
- **Supersedes:** the 2026-08-25 F-038 wave report that previously occupied this canonical path (same filename, different work item; that wave's findings were closed in its own sign-off addendum).

## Verdict

**Pass** — all 4 changed files conform to the accepted design plan (WO-1/WO-2/WO-3) and the triage done_oracle. The migration is idempotent; the backfill SQL matches `toRouteDetail`'s format; the guard rejects APPROVED / APPROVED_LEVEL2 fail-fast with enum refs and a Vietnamese message and resets REJECTED-family real changes to DRAFT with the 9 workflow fields cleared; no applied migration was edited (one-way door holds). Reproduced the QA battery this session: **34 tests / 0 failures / 0 errors / 0 skipped, BUILD SUCCESS**.

## Scope reviewed (all 4 changed files + one-way-door check)

| # | File | Change | Reviewed |
|---|---|---|---|
| 1 | `src/main/resources/db/migration/V20260827090000__fix_buoy_station_unaccent_search_index_and_backfill_route_code.sql` | NEW (untracked), 3 sections | §1 |
| 2 | `src/main/java/com/hanghai/kchtg/navigationchannel/service/NavigationChannelService.java` | +39/−9 (diff vs HEAD) | §2 |
| 3 | `src/test/java/com/hanghai/kchtg/navigationchannel/service/NavigationChannelServiceTest.java` | +141 (6 new guard cases) | §3 |
| 4 | `src/test/resources/uat-schema-fixture.sql` | +24 (qhcb_all test-only block) | §4 |

## Verification executed (this session)

| Check | Evidence | Result |
|---|---|---|
| Battery reproduction: `C:\Users\trangtt1\scoop\apps\maven\current\bin\mvn.cmd test "-Dtest=FlywayMigrationTest,NavigationChannelServiceTest,NavigationChannelControllerTest"` | Fresh surefire reports: FlywayMigrationTest 2/0/0 (27.25 s), `navigationchannel.service.NavigationChannelServiceTest` 18/0/0, `navigationchannel.controller.NavigationChannelControllerTest` 8/0/0, `navigationchannel.NavigationChannelServiceTest` (legacy) 6/0/0 → **34/0/0/0**; javac test-compile succeeded in the same run | PASS |
| One-way door: `git status --porcelain src/main/resources/db/migration/` | Output is exactly `?? V20260827090000__fix_buoy_station_unaccent_search_index_and_backfill_route_code.sql` — the ONLY migration change is the new untracked file | PASS |
| One-way door: `git diff HEAD --name-only -- src/main/resources/db/migration/` | Empty — zero tracked-migration diffs; `V20260822130000__add_unaccent_port_buoy_search_indexes.sql` and `V20260825120000__navigation_channel_excel_71_fields.sql` are byte-identical to HEAD | PASS |
| Carried independent evidence (not re-derived) | QA battery executed 5× exit 0; Flyway log `Successfully applied 244 migrations ... now at version v20260827090000` (QA report §3); dev ledger `job_04340f2cf001...` 34/0/0/0 | PASS |

## 1. Migration `V20260827090000` — idempotent, converges columns/indexes/backfill

**Idempotency — PASS.** Every statement block is wrapped in a `DO $$ ... $$` with `to_regclass('public.<table>')` existence guards (Section 1 buoy_station/buoy, Section 2 same, Section 3 channel_route_detail + navigation_channel); columns use `ADD COLUMN IF NOT EXISTS`, indexes use `CREATE INDEX IF NOT EXISTS`, and the backfill is scoped `WHERE route_code IS NULL`. Running the file twice is a no-op — the migration executes and re-executes cleanly inside `FlywayMigrationTest` (baseline 81, out-of-order), where `migrationsAreIdempotent` asserts the second `flyway.migrate()` executes 0 migrations (both FlywayMigrationTest tests green in my run).

**buoy_station + buoy code/name columns — PASS.** Section 1 adds `code VARCHAR(50)` and `name VARCHAR(255)` to BOTH `buoy_station` and `buoy`, matching the column types the drifted `V20260822130000` block declared (`V20260822130000__add_unaccent_port_buoy_search_indexes.sql:80-81`, per design plan §0) and closing the pre-existing asymmetry where only `buoy` got `code` (`V20260803370000__repair_all_schema_types_and_columns.sql:2034`).

**4 unaccent trigram indexes — PASS.** Section 2 creates exactly the 4 expected partial indexes (`WHERE deleted_at IS NULL`): `idx_buoy_station_active_code_unaccent_trgm`, `idx_buoy_station_active_name_unaccent_trgm`, `idx_buoy_active_code_unaccent_trgm`, `idx_buoy_active_name_unaccent_trgm` — `USING gin (public.immutable_unaccent(LOWER(col)) gin_trgm_ops)`, the same shape as the original buoy_station index that failed (`V20260822130000:81` seam). `immutable_unaccent` exists on any DB that reached the failing index (same function used by the original migration) and in the test chain (`V20260812170000` runs above baseline 81) — executed green.

**route_code backfill parity with `toRouteDetail` — PASS.**
- SQL (Section 3): `(SELECT nc.channel_code FROM public.navigation_channel nc WHERE nc.id = channel_route_detail.navigation_channel_id) || '-' || LPAD(COALESCE(sequence_no, 1)::text, 2, '0') WHERE route_code IS NULL`.
- Java (`NavigationChannelService.java:821-831`): `nc.getChannelCode() + "-" + String.format("%02d", sequenceNo)` (null `sequenceNo` falls back to `index + 1`).
- `LPAD(x::text, 2, '0')` ≡ `String.format("%02d", x)` for all non-negative integers; the SQL matches the design-plan §2.3 spec verbatim. Parent subquery always resolves: `channel_route_detail.navigation_channel_id` is `SET NOT NULL` (`V20260825120000:282`). No constraint risk: `route_code` has no unique index (only `idx_channel_route_detail_nc` on navigation_channel_id, `V20260825120000:284`), and the entity maps it nullable `length = 50` (`ChannelRouteDetail.java:40-41`) — the ~12-char format fits. Executed: the migration ran to completion inside the Flyway chain in my battery (and QA's, 5×).

## 2. Service guard BR-039-08 — correct placement, enum refs, workflow reset

**Fail-fast rejection before ANY mutation — PASS.** Guard at `NavigationChannelService.java:234-240`, immediately after `currentStatus` derivation (:232) and BEFORE the orgUnitId scope check, `trimRequestStrings` request mutation, copy, child/GIS handling, and history — a rejected request leaves zero side effects (design §3.2 "fail-fast position is load-bearing"). It is reachable, not dead: `assertEditable` (:231) blocks only `PENDING_APPROVAL`/`APPROVED_LEVEL1`/`ARCHIVED` (`InfrastructureApprovalService.java:224-241`), so APPROVED/APPROVED_LEVEL2 pass through to the new guard.

**Enum refs + Vietnamese message — PASS.** `if (currentStatus == ApprovalStatus.APPROVED || currentStatus == ApprovalStatus.APPROVED_LEVEL2) { throw new IllegalStateException("Không thể sửa hồ sơ đã duyệt"); }` — enum references only (constants verified in `ApprovalStatus.java:11-12`), no string literals; user-facing message Vietnamese có dấu, mirroring `assertEditable`'s style.

**`recordSaveAndApprove` branch removed — PASS.** The old APPROVED edit-allowed branch (`NavigationChannelService.java:406-408` pre-change) is deleted by the diff; the T12 flow remains available to other modules via `InfrastructureApprovalService.recordSaveAndApprove` (unchanged, per design WO-2 point 6). Guard fires before no-op detection, so even a no-op payload on an approved record is rejected (design behavior matrix).

**Whitespace-only → no-op — PASS.** `trimRequestStrings(req)` (:246-248, impl :890-899) normalizes all 9 text fields on the REQUEST before `copyPropertiesIfPresent` (:250-261) — a whitespace-only payload compares equal to stored values, produces no `previousValues` entry, and the `hasFieldChanges` early return (:395-405) keeps state, records no history, and leaves `updatedBy`/`updatedAt` untouched.

**REJECTED-family real change → DRAFT + clear workflow — PASS.** `if (currentStatus != ApprovalStatus.DRAFT)` (:414-424) sets `ApprovalStatus.DRAFT` and nulls exactly the 9 workflow fields: `submittedAt`, `submittedBy`, `approverLevel1`, `approvedDateLevel1`, `approverLevel2`, `approvedDateLevel2`, `rejectionReason`, `level1ApprovalContent`, `level2ApprovalContent`. Real changes then set `updatedBy` from session, `repo.save`, and history `UPDATED` with `changedField`/`previousValue`/`newValue` (:430-437).

**FieldNameConstants / no hardcoded strings — PASS.** Copy-ignore list and diff maps use `NavigationChannelUpdateRequest.Fields.*` (Lombok `@FieldNameConstants`, `NavigationChannelUpdateRequest.java:25`) — no hardcoded property-name strings. `FieldWriteGuard.validateObject(req)` (:220) and the orgUnitId write-scope check (:242-244) are retained untouched.

## 3. Guard tests — the 6 WO-3 cases, asserting real side effects

All 6 new tests in `NavigationChannelServiceTest.java` exercise the REAL `NavigationChannelService.update()` with mocked collaborators (repo/history/GIS), asserting thrown exception + persisted state + repo/history interaction — not tautological mocks:

1. `update_approved_shouldReject` — APPROVED + real change → `IllegalStateException` "Không thể sửa hồ sơ đã duyệt"; entity unchanged; `repo.save` never; `approvalHistoryRepo.save` never.
2. `update_approvedLevel2_shouldReject` — APPROVED_LEVEL2 → same rejection, zero side effects.
3. `update_rejectedWithRealChange_shouldResetToDraftAndClearWorkflow` — REJECTED + real change → status DRAFT; all 9 workflow fields asserted NULL; exactly 1 `UPDATED` history row via `ArgumentCaptor` with `changedField` non-blank; `updatedBy` from session.
4. `update_identicalPayload_shouldBeNoOp` — identical payload on REJECTED → state stays REJECTED (proves no-op precedes reset), no history, `updatedAt` unchanged.
5. `update_whitespaceOnlyEdit_shouldBeNoOp` — `"   Luong Hon Gai - Cai Lan   "` → after pre-copy trim equals stored value → no-op: state kept, no history, `updatedAt` unchanged.
6. `update_draftWithRealChange_shouldPartialUpdateAndSetUpdatedBy` — DRAFT boundary → normal partial update, `updatedBy` from session (WO-3 case 6).

Setup is sound: `testEntity` defaults to DRAFT with `channelName "Luong Hon Gai - Cai Lan"` (`setUp`, :62-84); each case overrides status/fields deliberately. New imports (`InfrastructureHistoryStatus`, `ArgumentCaptor`, `LocalDateTime`) are present; `assertThatThrownBy` was already imported. All 18 tests of the service class executed green in my battery.

## 4. `uat-schema-fixture.sql` — test-only qhcb_all shape, no production semantics touched

The +24-line block (:545-571) creates `CREATE SCHEMA IF NOT EXISTS qhcb_all` and `CREATE TABLE IF NOT EXISTS qhcb_all.area/line/point` with nullable `schema_name VARCHAR(255)`, `table_name VARCHAR(255)`, `fid BIGINT`. This exactly satisfies `V20260825113000__add_planning_gis_replica_identity.sql` (unguarded `ALTER COLUMN ... SET NOT NULL` + `CREATE UNIQUE INDEX IF NOT EXISTS` + `REPLICA IDENTITY USING INDEX` on the three tables) — on the empty tables the `SET NOT NULL` succeeds. The comment's claim that V72's column renames never run is correct: `FlywayMigrationTest` baselines at version 81 (`FlywayMigrationTest.java`), V72 < 81. The file lives under `src/test/resources` (test classpath only) — no production schema semantics are affected.

## Non-blocking observations (no action required from this wave)

- **N1** Backfill `COALESCE(sequence_no, 1)` gives `-01` to every NULL-`sequence_no` legacy row of a channel (Java's new-data fallback would use `index + 1`). No unique constraint exists on `route_code`, so no failure risk; cosmetic only, and the SQL matches design §2.3 verbatim.
- **N2** The backfill UPDATE executes with zero seeded legacy rows in the test fixture — format correctness rests on the static parity review (QA report §6). Recommended UAT follow-up: `SELECT count(*) FROM channel_route_detail WHERE route_code IS NULL AND navigation_channel_id IS NOT NULL` after migration = 0.
- **N3** WO-4 (docs sync: F-039 lean-spec `BR-039-08` row, `00-lean-spec.md:66`) is an orchestrator-owned follow-up by design plan §6; flagged for the BA seat, not a defect in these 4 files.
- **N4** `assertEditable`'s javadoc still documents APPROVED as editable via T12 for the general rule; the module's `update()` now intentionally diverges (triage decision D4, design §3.2). Shared service left unchanged per WO-2 point 6 — documented decision, not drift.

## Inspected scope / not inspected

- Inspected: full contents of the new migration; `NavigationChannelService.java:218-455` (update flow) and `:815-905` (toRouteDetail / trimRequestStrings); all 6 new tests + test setup; fixture tail; `InfrastructureApprovalService.assertEditable`; `ApprovalStatus` enum; `NavigationChannelUpdateRequest` annotations; `V20260825113000`; `FlywayMigrationTest`; `ChannelRouteDetail` entity.
- Not inspected by execution: runtime/UI behavior (backend-only hotfix); E2E; the approve endpoints' own tests (unchanged code, 8 controller tests green).
- Knowledge audit (reviewer duty): this run's memory contribution `update-trim-before-copy-noop` (AM-a0a8db0be2d20681, kind pattern, importance 0.7) records the trim-before-copy ordering lesson with the hotfix as its example — accurate, attributed to this diff, non-duplicative. No junk contributions observed.
