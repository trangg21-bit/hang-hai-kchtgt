# Design plan — HOTFIX TRI-1787825767692-3dab (Luồng hàng hải M-003)

- **Triage**: `docs/intel/_intake/TRI-1787825767692-3dab.json` (C3, full_pipeline, backend footprint, one-way-door: 2 migration files)
- **Scope**: 3 defects — (1) Flyway `V20260822130000` index failure on `buoy_station.code`; (2) `route_code` backfill for legacy data; (3) BR-039-08 state guard on update (reject APPROVED / APPROVED_LEVEL2, reset DRAFT, no-op keeps state).
- **Write boundary**: ONLY this design plan. Source files, migration SQL, lean-spec/brief docs are read-only (verified this session; no edits made).
- **One-way door (inviolable)**: `V20260822130000__add_unaccent_port_buoy_search_indexes.sql` and `V20260825120000__navigation_channel_excel_71_fields.sql` are already-applied migrations (triage `one_way_door_hits`). They are NOT edited. All schema/data convergence ships in ONE new repair migration (WO-1).

---

## 0. Verified current seam (anchors opened this session)

| Referent | Verified fact | Anchor |
|---|---|---|
| `V20260822130000` buoy_station block | `ADD COLUMN IF NOT EXISTS code VARCHAR(50)` (line 80), `name` (line 81), then `CREATE INDEX IF NOT EXISTS idx_buoy_station_active_code_unaccent_trgm ... LOWER(code) ... WHERE deleted_at IS NULL` (line 83) — i.e. the CURRENT file adds the column before the index | `src/main/resources/db/migration/V20260822130000__add_unaccent_port_buoy_search_indexes.sql:78-91` |
| `V20260822130000` piers/berths blocks | reference `pier_code`/`berth_code` (lines 25-26, 38-39) | same file `:24-42` |
| `V20260803370000` (repair-all migration, version > test baseline 81 → runs in FlywayMigrationTest) | adds `code` to `buoy` (line 2034) but has NO `buoy_station ... code` statement anywhere (grep: 0 hits) — the pre-existing asymmetry that makes only the buoy_station index fail | `V20260803370000__repair_all_schema_types_and_columns.sql:2034`; grep `buoy_station ADD COLUMN IF NOT EXISTS code` → no match |
| UAT-shaped fixture (test DB) | `buoy_station` created WITHOUT `code`/`name` (has `deleted_at` line 17); `buoy` also without `code` (line 144); `ports` has `port_code`/`port_name`; `piers`/`berths` have `code`/`name` | `src/test/resources/uat-schema-fixture.sql:9-21,144,434-482` |
| Flyway config | prod: `flyway: enabled: true, out-of-order: true, baseline-on-migrate: true, validate-on-migrate: false`; local.properties identical | `src/main/resources/application.yml:160-164`; `application-local.properties:41-44` |
| `immutable_unaccent` | created by an EARLIER-versioned migration → ordering is not the cause | `V20260812170000__add_unaccent_vts_search_indexes.sql:1-15` |
| `V20260825120000` §6 | `channel_code` backfilled `'LHH' || LPAD(rn::text, 6, '0')` — column exists on `navigation_channel` | `V20260825120000__navigation_channel_excel_71_fields.sql:128-137` |
| `V20260825120000` §9 | `ma → route_code` rename (line 186), `sequenceno → sequence_no`; NUMERIC(19,4) cast applies ONLY to `vertical_clearance_meters`/`current_depth_meters`/`design_slope` (NOT `sequence_no`); `navigation_channel_id SET NOT NULL` | same file `:163-187,240-270,288-294` |
| `NavigationChannelService.update` | signature line 220; `assertEditable(nc)` line 231; `currentStatus` line 232; orgUnitId write-scope check lines 236-240; `EntityUpdateUtils.copyPropertiesIfPresent` line 243 (uses `NavigationChannelUpdateRequest.Fields.*`); post-copy trim lines 270-283; no-op early return lines 395-398; APPROVED→`recordSaveAndApprove` branch lines 406-408; DRAFT-reset branch lines 409-417; history `UPDATED` lines 420-437 | `src/main/java/com/hanghai/kchtg/navigationchannel/service/NavigationChannelService.java:219-437` |
| `toRouteDetail` | new-row `routeCode = channelCode + "-" + %02d(sequenceNo)` — the format the backfill must reproduce | same file `:817-835` |
| `assertEditable` | throws only for `PENDING_APPROVAL`, `APPROVED_LEVEL1`, `ARCHIVED`; does NOT block `APPROVED`/`APPROVED_LEVEL2` | `common/service/InfrastructureApprovalService.java:224-241` |
| `recordSaveAndApprove` | T12 "Lưu và phê duyệt" — keeps APPROVED, rewrites approverLevel2/approvedDateLevel2, records history | same file `:308-320` |
| Entity | `@Filter(name = "orgUnitFilter", ...)` at line 28 (stale anchor claimed :22); `@FieldNameConstants` line 34 | `navigationchannel/entity/NavigationChannel.java:27-34` |
| Enum | `ApprovalStatus` values incl. `DRAFT(0)`, `APPROVED_LEVEL2(4)`, `APPROVED(5)`, `REJECTED(6)` — stored INT via ORDINAL mapping | `common/entity/ApprovalStatus.java:8-18` |
| History helper | real class is `InfrastructureHistoryUtils` (recordSoftDelete); there is no `ApprovalHistoryUtils` in the codebase | `common/util/InfrastructureHistoryUtils.java:1-58`; grep `class ApprovalHistoryUtils` → no match |

---

## 1. Defect 1 — Flyway `V20260822130000`: `column "code" does not exist` on buoy_station

### 1.1 Root cause (confirmed)

**Post-apply edit / checksum drift of the buoy/buoy_station block, invisible to Flyway because `validate-on-migrate: false`.**

Evidence chain:

1. `V20260803370000` (applied 2026-08-03, and RUNS in the migration test because its version is > baseline 81) added `code` to **`buoy`** (`V20260803370000...sql:2034`) but **never to `buoy_station`** (grep for a `buoy_station ... code` statement: 0 hits). So on any environment shaped like UAT — fixture lines 9-21 included — `buoy.code` exists but `buoy_station.code` does NOT.
2. The version of `V20260822130000` that the failing environments executed created `idx_buoy_station_active_code_unaccent_trgm` (`V20260822130000__add_unaccent_port_buoy_search_indexes.sql:83`) against a `buoy_station` without `code` — the `ADD COLUMN IF NOT EXISTS code/name` lines (`V20260822130000__add_unaccent_port_buoy_search_indexes.sql:80-81`) now present in the file were added to the file AFTER that version was applied (checksum drift; triage seam claim captured the file in its current, edited state, and QA battery B4 recorded the error at exactly this index).
3. `spring.flyway.validate-on-migrate=false` (`application.yml:164`, `application-local.properties:44`) means Flyway never compares the file checksum against `flyway_schema_history`: a migration already recorded is skipped forever, even when its file changed. The drifted file is therefore never re-executed on those DBs, `buoy_station.code` stays absent, and any execution of the index statement fails with `column "code" does not exist` — exactly the QA B4 signature, and exactly reproducible on the UAT-shaped fixture with a pre-edit file (buoy block passes because V20260803370000 supplied `buoy.code`; the buoy_station block fails).

**Hypotheses excluded by evidence:**

| Hypothesis | Verdict | Evidence |
|---|---|---|
| Column-name case | Excluded | `ADD COLUMN` and the index both use the same unquoted identifier `code`; PostgreSQL folds both to lowercase. A case mismatch cannot exist between two statements in the same DO block. |
| `deleted_at` missing | Excluded | Hibernate-shaped tables (fixture `:17`) and the entity base carry `deleted_at`; and the reported error is `code`, not `deleted_at`. |
| Migration ordering | Excluded | `immutable_unaccent` is created by `V20260812170000` (version 2026-08-12 < 2026-08-22) → runs before; `V20260803370000` (2026-08-03) also runs before. |
| File edited post-apply | **Confirmed as the mechanism** | Current file lines 80-81 vs applied-version behavior; validate-on-migrate=false everywhere; fixture reproduces the failing shape. |

**Residual uncertainty (stated plainly):** the exact pre-edit content of the applied version cannot be recovered from the workspace (no git history access this session — version control is user-owned — and no DB snapshot). The root cause is established from the error signature + current file structure + `V20260803370000` asymmetry + flyway config; it is not a guess about a symbol location.

### 1.2 Fix decision

**A new repair migration IS REQUIRED.** Name:

```
V20260827090000__fix_buoy_station_unaccent_search_index_and_backfill_route_code.sql
```

- Version `20260827090000` sorts after every existing migration (latest is `V20260826090000`) and after both one-way-door files, so it runs after the §9 renames (needed by defect 2).
- Decided (NEW — one-way door): the applied migration file `V20260822130000__add_unaccent_port_buoy_search_indexes.sql` is NOT edited. It is already correct for FRESH databases — the `ADD COLUMN IF NOT EXISTS code/name` statements at `V20260822130000__add_unaccent_port_buoy_search_indexes.sql:80-81` precede the index creation at `:83`. DBs that recorded an older version converge via the repair migration only.
- Flyway transactional semantics mean a failed `CREATE INDEX` leaves no partial index behind, so the repair needs no DROP — only idempotent `ADD COLUMN IF NOT EXISTS` + `CREATE INDEX IF NOT EXISTS`.

### 1.3 Repair SQL (spec, exact)

```sql
-- Section 1: converge code/name columns on buoy_station AND buoy (idempotent)
DO $$
BEGIN
    IF to_regclass('public.buoy_station') IS NOT NULL THEN
        ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS code VARCHAR(50);
        ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS name VARCHAR(255);
    END IF;
    IF to_regclass('public.buoy') IS NOT NULL THEN
        ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS code VARCHAR(50);
        ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS name VARCHAR(255);
    END IF;
END $$;

-- Section 2: recreate the four unaccent partial search indexes (idempotent)
DO $$
BEGIN
    IF to_regclass('public.buoy_station') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_buoy_station_active_code_unaccent_trgm
            ON public.buoy_station USING gin (public.immutable_unaccent(LOWER(code)) gin_trgm_ops)
            WHERE deleted_at IS NULL;
        CREATE INDEX IF NOT EXISTS idx_buoy_station_active_name_unaccent_trgm
            ON public.buoy_station USING gin (public.immutable_unaccent(LOWER(name)) gin_trgm_ops)
            WHERE deleted_at IS NULL;
    END IF;
    IF to_regclass('public.buoy') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_buoy_active_code_unaccent_trgm
            ON public.buoy USING gin (public.immutable_unaccent(LOWER(code)) gin_trgm_ops)
            WHERE deleted_at IS NULL;
        CREATE INDEX IF NOT EXISTS idx_buoy_active_name_unaccent_trgm
            ON public.buoy USING gin (public.immutable_unaccent(LOWER(name)) gin_trgm_ops)
            WHERE deleted_at IS NULL;
    END IF;
END $$;
```

Both buoy and buoy_station are covered (decided — identical block shape, idempotent `ADD COLUMN IF NOT EXISTS`); pre-repair, only `buoy_station` lacks `code`/`name` — the fixture shapes it without either (`uat-schema-fixture.sql:9-21`), while `buoy` received both from `V20260803370000__repair_all_schema_types_and_columns.sql:2034,2041`. Section 2 is a no-op on fresh DBs (indexes already exist) — the `migrationsAreIdempotent` re-run test (`FlywayMigrationTest.java:188`) must stay green.

---

## 2. Defect 2 — `route_code` backfill for legacy data

### 2.1 Confirmed defect

`V20260825120000` §9 only renames the legacy `ma` column to `route_code` (`V20260825120000__navigation_channel_excel_71_fields.sql:186`); legacy rows keep `route_code IS NULL`. New rows get `routeCode` server-side in `toRouteDetail` (`NavigationChannelService.java:817-835`): `channelCode + "-" + String.format("%02d", sequenceNo)`.

### 2.2 Fix decision

**Backfill in the SAME repair migration (WO-1, Section 3), NOT an edit to `V20260825120000`.** The triage `done_oracle` phrases defect 2 as "migration V20260825120000 bổ sung UPDATE backfill"; that literal wording violates the one-way door (the file is already applied), so the identical net effect is delivered by a new migration that runs AFTER it. This is the only way to satisfy both the done_oracle and the one-way-door constraint.

Placement preconditions, all verified: `route_code` exists (rename, §9), `navigation_channel_id` is NOT NULL (`V20260825120000__navigation_channel_excel_71_fields.sql:288-294`) so the parent subquery always resolves, `channel_code` is backfilled for legacy parents (§6, `V20260825120000__navigation_channel_excel_71_fields.sql:128-137`), and `sequence_no` is NOT one of the columns cast to NUMERIC(19,4) (cast block covers only `vertical_clearance_meters`/`current_depth_meters`/`design_slope`), so `COALESCE(sequence_no, 1)::text` yields a plain integer string.

### 2.3 Backfill SQL (exact — target SQL from the triage, wrapped in the table-existence guard)

```sql
-- Section 3: backfill route_code for legacy channel_route_detail rows
DO $$
BEGIN
    IF to_regclass('public.channel_route_detail') IS NOT NULL
       AND to_regclass('public.navigation_channel') IS NOT NULL THEN
        UPDATE public.channel_route_detail SET route_code =
            (SELECT nc.channel_code FROM public.navigation_channel nc
              WHERE nc.id = channel_route_detail.navigation_channel_id)
            || '-' || LPAD(COALESCE(sequence_no, 1)::text, 2, '0')
        WHERE route_code IS NULL;
    END IF;
END $$;
```

Format parity check against `toRouteDetail` (`NavigationChannelService.java:817-835`): `channelCode` + `-` + zero-padded 2-digit `sequenceNo` — identical. The `to_regclass` guard keeps the fixture green (the fixture has no `channel_route_detail`).

---

## 3. Defect 3 — BR-039-08 state guard on update

### 3.1 Confirmed current behavior (all anchors in section 0)

`NavigationChannelService.update` — `NavigationChannelService.java:220` — today:
1. `assertEditable(nc)` (`NavigationChannelService.java:231`) blocks only `PENDING_APPROVAL` / `APPROVED_LEVEL1` / `ARCHIVED` (`InfrastructureApprovalService.java:224-241`).
2. `currentStatus` computed (`NavigationChannelService.java:232`); orgUnitId write-scope validated (`NavigationChannelService.java:235-240` — DataScope write validation already present, KEEP).
3. `copyPropertiesIfPresent` (`NavigationChannelService.java:243`) records `previousValues` on non-null diffs; the 9 text fields are trimmed AFTER the copy (`NavigationChannelService.java:270-283`) — so a whitespace-only edit is recorded as a real change (the "F-039 whitespace-only edit reset DRAFT" finding).
4. No-op early return (`NavigationChannelService.java:395-398`): `hasFieldChanges == false` → return, no reset/history — already correct.
5. **APPROVED / APPROVED_LEVEL2 + real change → `recordSaveAndApprove` (`NavigationChannelService.java:406-408`): the edit is ALLOWED, state stays APPROVED, history UPDATED.** This is the opposite of the triage decision.
6. Other non-DRAFT → reset `DRAFT` + clear 9 workflow fields (`NavigationChannelService.java:409-417`) — only reachable for `REJECTED`/`REJECTED_LEVEL1`/`REJECTED_LEVEL2`/`PROPOSED`.

The F-039 lean-spec `BR-039-08` row (`00-lean-spec.md:66`) records "guard chưa implement — chờ PMO chốt"; the triage request_summary + this brief ARE the PMO decision: **update must reject APPROVED / APPROVED_LEVEL2; real changes reset to DRAFT + clear workflow fields; no-op keeps state and records no history.**

### 3.2 Fix decision — exact guard

**Change 1 — fail-fast rejection (before ANY mutation).** Insert immediately after `currentStatus` is computed (after `NavigationChannelService.java:232`, before the orgUnitId block / copy):

```java
// BR-039-08 (chốt TRI-1787825767692-3dab): hồ sơ đã duyệt là bất biến cho tới khi đi qua quy trình phê duyệt mới.
if (currentStatus == ApprovalStatus.APPROVED || currentStatus == ApprovalStatus.APPROVED_LEVEL2) {
    throw new IllegalStateException("Không thể sửa hồ sơ đã duyệt");
}
```

- Enum references only (`ApprovalStatus.APPROVED`, `ApprovalStatus.APPROVED_LEVEL2`) — NEVER string literals (enum stored INT via `@Enumerated(EnumType.ORDINAL)`; `ApprovalStatus.java:8-18`).
- Message Vietnamese có dấu, mirroring `assertEditable`'s style ("Không thể sửa hồ sơ đang trong quy trình phê duyệt" / "Không thể sửa hồ sơ đã xóa").
- Fail-fast position is load-bearing: the current code mutates children/GIS/history BEFORE the status branch; the rejection must precede every side effect so a rejected request leaves zero traces.
- DELETE the now-unreachable branch at `NavigationChannelService.java:406-408` (`recordSaveAndApprove`). The T12 flow itself stays available to other modules via `InfrastructureApprovalService.recordSaveAndApprove` (`InfrastructureApprovalService.java:308-320`) — the change is scoped to `NavigationChannelService.update` only. (Decision note: this supersedes the T12 "Lưu và phê duyệt" path for this module's update endpoint, per the triage decision; `assertEditable` + T12 remain for the approve endpoints.)

**Change 2 (NEW) — whitespace-only edits become true no-ops.** Move the 9-field `trimToNull` normalization (currently `NavigationChannelService.java:270-283`) to run on the REQUEST **before** `copyPropertiesIfPresent` (`NavigationChannelService.java:243`): normalize `req` (via its existing getters `getChannelName`, `getDetailedLocation`, `getManagementStation`, `getNotes`, `getAnnouncementDecisionNumber`, `getAnnouncementDecisionIssuer`, `getProtectionNotes`, `getCoordinateReferenceSystem`, `getDisplayRule` — set trimmed values back on the DTO), then copy. Result: a whitespace-only payload compares equal to stored values → no `previousValues` entry → `hasFieldChanges == false` → the existing no-op early return (lines 395-398) keeps state, records no history, and does not touch `updatedBy`/`updatedAt`. The current post-copy normalization lines may stay as harmless idempotent belt-and-braces or be removed; the minimal diff is to keep them.

**Unchanged (verified correct):**
- No-op identical payload → early return, no reset, no history (`NavigationChannelService.java:395-398`).
- `else if (currentStatus != ApprovalStatus.DRAFT)` → `DRAFT` + clear `submittedAt`, `submittedBy`, `approverLevel1`, `approvedDateLevel1`, `approverLevel2`, `approvedDateLevel2`, `rejectionReason`, `level1ApprovalContent`, `level2ApprovalContent` (`NavigationChannelService.java:409-417`) — now reachable only for `REJECTED`/`REJECTED_LEVEL1`/`REJECTED_LEVEL2`/`PROPOSED`, which is the intended reset scope.
- Real changes → `updatedBy` from session, `repo.save`, history `UPDATED` with `changedField`/`previousValue`/`newValue` (`NavigationChannelService.java:419-437`).
- orgUnitId write-scope validation (`NavigationChannelService.java:235-240`) and `FieldWriteGuard.validateObject` (`NavigationChannelService.java:221`).

**Behavior matrix (before → after):**

| Record state | Payload | Before | After |
|---|---|---|---|
| APPROVED / APPROVED_LEVEL2 | any real change | edit allowed, state kept, history UPDATED (recordSaveAndApprove) | **rejected `IllegalStateException` "Không thể sửa hồ sơ đã duyệt", zero side effects** |
| APPROVED / APPROVED_LEVEL2 | no-op | history UPDATED recorded | **rejected (guard fires before no-op detection — approved records are immutable via update)** |
| REJECTED / REJECTED_LEVEL1/2 / PROPOSED | real change | DRAFT + clear fields + history UPDATED | unchanged |
| REJECTED / … | no-op | state kept, no history | unchanged |
| DRAFT | any | partial update | unchanged |
| PENDING_APPROVAL / APPROVED_LEVEL1 / ARCHIVED | any | rejected by assertEditable | unchanged |

---

## 4. Decisions & trade-offs

| # | Decision | Why | Rejected alternative |
|---|---|---|---|
| D1 | New repair migration `V20260827090000__fix_buoy_station_unaccent_search_index_and_backfill_route_code.sql` (defects 1+2 in one file) | One-way door forbids editing the two applied migrations; one new timestamped file converges all environments idempotently; single dev work order, single Flyway run | Editing `V20260822130000`/`V20260825120000` (forbidden); two separate repair migrations (unnecessary split — independent sections, same runner) |
| D2 | Backfill lives in the repair migration, not an edit to `V20260825120000` | Done-oracle phrasing "V20260825120000 bổ sung UPDATE backfill" conflicts with the one-way door; a new migration produces the identical net effect and is the only satisfiable reading | Literal edit of the applied migration (one-way-door violation) |
| D3 | `CREATE INDEX IF NOT EXISTS` without DROP in the repair | PostgreSQL index creation is transactional — a failed create leaves no partial object; existing indexes are skipped by `IF NOT EXISTS` | `DROP INDEX IF EXISTS` + recreate (noisy, riskier on live DB, unnecessary) |
| D4 | Reject APPROVED/APPROVED_LEVEL2 at the TOP of `update` (fail-fast) | Triage decision (supersedes the module's T12 recordSaveAndApprove path for update); fail-fast guarantees zero side effects on rejected requests; guards approved records even for no-op payloads | Keeping recordSaveAndApprove (contradicts the triage); rejecting after mutation (would leave GIS/history side effects) |
| D5 | Pre-copy trim normalization for no-op detection | Fixes the whitespace-only-edit reset finding with the smallest change; reuses the existing `hasFieldChanges` mechanism | Comparing trimmed values inside `copyPropertiesIfPresent` (touches a shared util used by other modules — larger blast radius) |
| D6 | Coverage limited to buoy/buoy_station + route_code | QA B4 reported only buoy_station; piers/berths/ports/dry_ports columns are supplied by `V20260803370000__repair_all_schema_types_and_columns.sql:1755,8170` (berth_code/pier_code) and the fixture (`uat-schema-fixture.sql:434-482`) and pass; scope creep on an already-applied chain is the failure mode this hotfix exists to avoid | Adding pier_code/berth_code repair (unverified defect, no evidence of failure) |

---

## 5. Acceptance mapping (triage done_oracle → design element → oracle)

| done_oracle item | Design element | Verification oracle |
|---|---|---|
| (1) Flyway V20260822130000 passes on a real DB; buoy_station index no longer fails on `code` | WO-1 Sections 1-2 (repair migration) | `mvn test -Dtest=FlywayMigrationTest` green incl. `migrationsAreIdempotent`; migration applies on a DB where `buoy_station` lacks `code` |
| (2) Legacy `route_code` backfilled from channelCode + sequence_no | WO-1 Section 3 | Post-migrate query: `SELECT count(*) FROM channel_route_detail WHERE route_code IS NULL` = 0 for rows with a parent; format equals `channelCode || '-' || %02d(sequenceNo)` |
| (3) BR-039-08 guard: reject APPROVED/APPROVED_LEVEL2, real change → DRAFT + clear workflow fields, no-op → keep state + no history | WO-2 + WO-3 | `NavigationChannelServiceTest` cases in section 6 |
| `mvn test pass` + `mvn compile -DskipTests pass` | All WOs | commands in section 6 |

---

## 6. Work orders (backend dev, independently executable)

### WO-1 — New Flyway repair migration (defects 1 + 2)

**File**: `src/main/resources/db/migration/V20260827090000__fix_buoy_station_unaccent_search_index_and_backfill_route_code.sql` (exact name as decided).

**Steps**:
1. Write Section 1 + Section 2 exactly as spec'd in §1.3 (guarded `ADD COLUMN IF NOT EXISTS code/name` on `buoy_station` and `buoy`; guarded `CREATE INDEX IF NOT EXISTS` for the 4 indexes).
2. Write Section 3 exactly as spec'd in §2.3 (guarded `UPDATE ... SET route_code = (SELECT nc.channel_code ...) || '-' || LPAD(COALESCE(sequence_no, 1)::text, 2, '0') WHERE route_code IS NULL;`).
3. **DO NOT touch** `V20260822130000` or `V20260825120000` (one-way door; any diff to those files is a blocker).
4. Idempotency is mandatory: running the file twice must be a no-op (statement guards + `IF NOT EXISTS`).
5. Constraints: English identifiers only (tables/columns as spec'd); no Vietnamese identifiers; no string enum values (SQL-level enums are INT by convention — this migration does not touch enum columns).

**Verification (dev must run)**: `mvn test -Dtest=FlywayMigrationTest` → all green (incl. idempotent re-run test); `mvn compile -DskipTests` → BUILD SUCCESS.

### WO-2 — BR-039-08 update guard in `NavigationChannelService`

**File**: `src/main/java/com/hanghai/kchtg/navigationchannel/service/NavigationChannelService.java` (update method, lines 219-437).

**Steps**:
1. NEW — After `NavigationChannelService.java:232` (`currentStatus`), insert the fail-fast rejection from §3.2 Change 1 (enum refs `ApprovalStatus.APPROVED` / `ApprovalStatus.APPROVED_LEVEL2`; message `"Không thể sửa hồ sơ đã duyệt"`).
2. NEW — Delete the now-unreachable branch at `NavigationChannelService.java:406-408` (`approvalService.recordSaveAndApprove(...)`).
3. NEW — Move the 9-field `trimToNull` normalization (currently `NavigationChannelService.java:270-283`) to run on `req` BEFORE `copyPropertiesIfPresent` (`NavigationChannelService.java:243`) per §3.2 Change 2 (whitespace-only payloads must reach the no-op early return).
4. Keep unchanged: `assertEditable` call (`NavigationChannelService.java:231`), orgUnitId write-scope check (`NavigationChannelService.java:235-240`), no-op early return (`NavigationChannelService.java:395-398`), DRAFT-reset branch (`NavigationChannelService.java:409-417`) with its 9 cleared workflow fields, `updatedBy` from session + `repo.save` + history `UPDATED` (`NavigationChannelService.java:419-437`).
5. Constraints: enum refs, never string literals; field names via `@FieldNameConstants` (`NavigationChannelUpdateRequest.Fields.*`, already in use at `NavigationChannelService.java:244-246`); user-facing message Vietnamese có dấu; technical identifiers English; DataScope write validation already present — the runtime check `orgUnitScopeService.currentUserScope().allows(...)` runs at `NavigationChannelService.java:235`, and `Fields.orgUnitId` sits in the copy ignore list at `NavigationChannelService.java:244` — keep both, do not remove.
6. Do NOT modify `InfrastructureApprovalService` (assertEditable/recordSaveAndApprove stay for other modules/flows).

**Verification (dev must run)**: `mvn compile -DskipTests` → BUILD SUCCESS; the new test cases in WO-3 pass.

### WO-3 — Tests (same dev turn)

**File**: extend `src/test/java/.../navigationchannel/.../NavigationChannelServiceTest.java` (existing suite — 6 tests per prior run; keep the runner/DB isolation conventions).

Cases (oracle: thrown exception / persisted state / history row count):
1. APPROVED record + real change → `IllegalStateException`, entity fields unchanged, `InfrastructureHistory` count unchanged.
2. APPROVED_LEVEL2 record + real change → `IllegalStateException`, unchanged.
3. REJECTED record + real change → `approvalStatus == DRAFT`, the 9 workflow fields NULL, one `UPDATED` history row with `changedField` non-empty.
4. No-op identical payload → state unchanged, no history row, `updatedAt` unchanged.
5. Whitespace-only edit (e.g. `channelName` with surrounding spaces, identical after trim) → treated as no-op: state kept, no history, `updatedAt` unchanged.
6. (Boundary, if cheap) DRAFT record + real change → normal partial update, `updatedBy` set from session.

**Verification (dev must run)**: `mvn test -Dtest=FlywayMigrationTest,NavigationChannelServiceTest,NavigationChannelControllerTest` → all green; `mvn compile -DskipTests` → BUILD SUCCESS.

### WO-4 — Documentation sync (orchestrator follow-up, NOT a dev task)

- NEW (follow-up, NOT a dev task) — BA updates the F-039 lean-spec `BR-039-08` row (`00-lean-spec.md:66` — currently "guard chưa implement — chờ PMO chốt"), `Summary`, `Scope`, and the F-039 feature-brief section 3 to reflect the TRI-1787825767692-3dab decision (reject APPROVED/APPROVED_LEVEL2; reset DRAFT + clear workflow fields; no-op keeps state, no history). Code-vs-doc drift is a release gate in this workspace.

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| A DB recorded the old `V20260822130000` in a state where `buoy_station` is missing other columns the entity expects | Out of reported scope; the repair covers `code`/`name` only — if `mvn test` or a real boot surfaces another missing column, file a new triage rather than expanding this migration |
| Backfill writes `route_code` longer than the column type (legacy `ma` VARCHAR length) | Format is `channelCode(9) + '-' + 2` ≈ 12 chars — fits any VARCHAR(≥12); no cast/length change needed |
| Rejecting APPROVED breaks an existing UI flow that relied on "Lưu và phê duyệt" via update | This is the triage decision (D4); the T12 flow remains on the approve endpoints. Frontend impact is out of scope — flag to PMO if the UI offers edit on approved records |
| `FlywayMigrationTest` fixture lacks `channel_route_detail` | Guarded by `to_regclass` (Section 3) — test stays green; real DBs exercise the backfill |
| Whitespace normalization mutates the request DTO before copy | Intended; the DTO is request-scoped, and validation (`FieldWriteGuard.validateObject`) already ran at `NavigationChannelService.java:221` |

---

## 8. Evidence index (all anchors opened/verified this session)

Listed in section 0. Every `file:line` above was read or grepped this session; no anchor is asserted from memory or from another document's claim. The three stale anchors named in the dispatch brief are removed by this rewrite; where the same facts are referenced here, they cite the verified locations in section 0 (`NavigationChannel.java:28` for the entity filter, `application.yml:160-164` for the prod flyway block).
