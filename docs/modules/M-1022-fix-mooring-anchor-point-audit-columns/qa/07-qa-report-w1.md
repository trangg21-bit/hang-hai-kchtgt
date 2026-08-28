---
feature-id: M-1022
stage: qa
wave: 1
agent: engineering-qa-engineer
verdict: Pending — wave-2 execution
last-updated: 2026-08-26
---

# M-1022 — Wave-1 QA Report: Acceptance Oracle (mooring_water_area_anchor_points audit columns)

## 1. Orientation and scope

- **What this artifact is:** the wave-1 acceptance oracle for hotfix M-1022. It converts the triage `done_oracle` (TRI-1787716492397-a5d0) and the accepted design (`00-design-plan.md` §3–§8) into checkable AC-* criteria plus the exact commands and probes wave-2 QA will execute against the implementation. The migration does NOT exist yet — this wave-1 artifact writes no product code, runs no build, and performs no DB probe.
- **Module shape (from triage):** schema-only hotfix, change_class C3, 1 edit-target file, blast_radius 1, dev_footprint backend.
- **Implementation target (design WO-DB-1):** exactly one new Flyway migration `src/main/resources/db/migration/V20260826110000__add_mooring_anchor_point_audit_columns.sql` adding the 4 missing audit columns to `mooring_water_area_anchor_points`.
- **Confirmed at authoring time:** `glob src/main/resources/db/migration/V20260826110000*` → no files found (developer has not yet landed the migration — expected; wave-2 executes after it lands).

### 1.1 Sources read this session

| Source | Role |
|---|---|
| `docs/modules/M-1022-fix-mooring-anchor-point-audit-columns/design/00-design-plan.md` (§3–§9, full) | Canonical acceptance source: WO-DB-1, §5 mapping, §7 verification, §8 out-of-scope |
| `docs/intel/_intake/TRI-1787716492397-a5d0.json` (full) | `done_oracle` + `verification_commands` (compile gate) |
| `src/main/resources/db/migration/V20260825130000__anchorage_gis_mooring.sql` (full, 39 lines) | Buggy table `mooring_water_area_anchor_points` (:29-37); sibling `mooring_water_areas` VARCHAR(100) audit types (:21-23) |
| `src/main/resources/db/migration/V20260825120000__create_anchorages.sql` (:1-9) | Type standard: `created_by UUID`, `updated_by UUID`, `deleted_at TIMESTAMP`, `deleted_by UUID` (:6-9) |
| `src/main/java/com/hanghai/kchtg/port/entity/MooringWaterAreaAnchorPoint.java:29` + `BaseEntity.java:55-72` (triage seam_claims + design root cause) | Entity `extends BaseEntity` → inherits UUID audit contract |
| `docs/inputs/photo_2026-07-09_15-47-20.jpg`, `docs/inputs/logo-vinamarine_1_1.png` | Read; no bearing on this schema-only hotfix — no AC references them, no revision required |

## 2. Load-bearing facts (carried from design/triage — do NOT re-derive)

| # | Fact | Anchor |
|---|---|---|
| F1 | `mooring_water_area_anchor_points` created WITHOUT the 4 audit columns — only `id`, `mooring_water_area_id`, `name`, `latitude`, `longitude`, `created_at`, `updated_at` | `V20260825130000__anchorage_gis_mooring.sql:29-37` |
| F2 | Type standard for this entity family: `created_by UUID`, `updated_by UUID`, `deleted_at TIMESTAMP`, `deleted_by UUID` (all nullable) | `V20260825120000__create_anchorages.sql:6-9` |
| F3 | Entity inherits full audit contract from `BaseEntity` (`createdBy`/`updatedBy`/`deletedBy` UUID via `@JdbcTypeCode(SqlTypes.UUID)`, `deletedAt` LocalDateTime) | `MooringWaterAreaAnchorPoint.java:29`; `BaseEntity.java:55-72` |
| F4 | Sibling `mooring_water_areas` declares VARCHAR(100) audit types — OUT OF SCOPE for this hotfix, do NOT copy | `V20260825130000__anchorage_gis_mooring.sql:21-23` |
| F5 | Exact new filename + canonical SQL | design WO-DB-1 (reproduced in §4.1) |
| F6 | No migration named `V20260826110000` exists at authoring time | `glob src/main/resources/db/migration/V20260826110000*` → none |

## 3. Acceptance criteria — mapped 1:1 from design §5 + WO-DB-1

| ID | Acceptance criterion | Design element | Oracle | Method/kind | Owner |
|---|---|---|---|---|---|
| AC-1 | `POST /api/v1/anchorage` with a mooring water area + anchor point returns HTTP 200 with NO `column created_by of relation mooring_water_area_anchor_points does not exist` error | §5 row 1 + §7 runtime step 1 | live probe (§4.4) | RUNTIME | human on live instance (agents must not start backend) |
| AC-2 | Table has all 4 audit columns with correct types: `created_by`=uuid, `updated_by`=uuid, `deleted_at`=timestamp without time zone, `deleted_by`=uuid | §5 row 2 + §7 runtime step 2 | `information_schema` query (§4.3) | RUNTIME | human on live instance |
| AC-3 | Migration is re-runnable / environment-safe — exactly one `ALTER TABLE` with four `ADD COLUMN IF NOT EXISTS` clauses | §5 row 3 + WO-DB-1 | static content check (§4.1) | STATIC | wave-2 QA |
| AC-4 | Backend still compiles with the new resource present | §5 row 4 + §7 compile gate | exact compile command, exit 0, output ends `BUILD_EXIT_OK` (§4.2) | BUILD | wave-2 QA |
| AC-5 | Exactly one file added: `src/main/resources/db/migration/V20260826110000__add_mooring_anchor_point_audit_columns.sql`; no existing migration edited | WO-DB-1 + §9 | change-set check, read-only git (§4.1 S5) | STATIC | wave-2 QA |
| AC-6 | New file content = exactly the four `ADD COLUMN IF NOT EXISTS` clauses, types UUID/UUID/TIMESTAMP/UUID (NOT VARCHAR(100)); no extra statement/index/backfill | WO-DB-1 + §6 risk 1 | content match vs canonical SQL (§4.1 S2–S4) | STATIC | wave-2 QA |
| AC-7 | No Java change, no frontend change, no `mvn clean`, no git add/commit/push, no backend start/restart | §8 | change-set + process evidence (§4.1 S5, §4.2 note) | STATIC | wave-2 QA |

## 4. Executable oracles (wave-2 executes; wave-1 authors only)

### 4.1 Static oracles — migration content (AC-3, AC-5, AC-6)

Canonical file + SQL, verbatim from design WO-DB-1:

```sql
-- Add missing audit columns to mooring_water_area_anchor_points.
-- Entity MooringWaterAreaAnchorPoint extends BaseEntity; V20260825130000 created the
-- table without created_by/updated_by/deleted_at/deleted_by, so the INSERT fails at runtime.
-- Types follow the V20260825120000__create_anchorages.sql standard (UUID/UUID/TIMESTAMP/UUID).
ALTER TABLE mooring_water_area_anchor_points
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS updated_by UUID,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS deleted_by UUID;
```

Checks:

- **S1 (AC-5):** file exists at the exact path `src/main/resources/db/migration/V20260826110000__add_mooring_anchor_point_audit_columns.sql`; filename byte-exact.
- **S2 (AC-3/AC-6):** content matches the canonical SQL above up to leading/trailing whitespace and line endings; all four `ADD COLUMN IF NOT EXISTS` lines present with types `UUID`, `UUID`, `TIMESTAMP`, `UUID`, in one `ALTER TABLE` statement.
- **S3 (AC-6, type-drift guard — design §6 risk 1):** assert NO `VARCHAR` token anywhere in the file.
- **S4 (AC-6):** assert no other statement — no `CREATE INDEX`, no `INSERT`/`UPDATE`/`DELETE`, no backfill, no `DEFAULT`/`NOT NULL`.
- **S5 (AC-5/AC-7):** read-only change-set check — `git status --porcelain` shows exactly ONE new file under `src/main/resources/db/migration/` and ZERO modified files anywhere (in particular `V20260825130000__anchorage_gis_mooring.sql` must be untouched); `git diff --stat` (read-only) shows no Java/TSX/frontend hunk. Read-only git inspection only — never `git add/commit/push` (design §8).

### 4.2 Compile gate (AC-4) — exact command, cwd = repo root, timeout 180 s

```
"C:\Program Files\JetBrains\IntelliJ IDEA 2026.1.4\plugins\maven\lib\maven3\bin\mvn.cmd" compile -q && echo BUILD_EXIT_OK
```

Expected: exit code **0** AND final output line **`BUILD_EXIT_OK`**. Note (design §7): `mvn compile` does not parse or execute SQL — a green compile proves the backend still builds with the new resource; migration validity is proven by the runtime oracles (§4.3–§4.4). Do NOT run `mvn clean`, `mvn test`, or `mvn package` (design §8, AC-7).

### 4.3 Runtime oracle — information_schema (AC-2)

On a live instance where the migration has been applied (backend started once after the migration landed — agents must not start/restart the backend), run exactly:

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'mooring_water_area_anchor_points'
  AND column_name IN ('created_by','updated_by','deleted_at','deleted_by');
```

Expected result set (4 rows):

| column_name | data_type |
|---|---|
| created_by | uuid |
| updated_by | uuid |
| deleted_at | timestamp without time zone |
| deleted_by | uuid |

Assert `data_type`, not just column presence (design §6 risk 1). If the migration has NOT been applied yet (0 rows), the AC is **PENDING**, not failed — record that the runtime gate awaits a backend restart.

### 4.4 Functional oracle — POST /api/v1/anchorage (AC-1)

Per triage `entry_point`: "Thêm mới Khu neo đậu — tab Khu nước neo buộc tàu → thêm điểm neo → Lưu (POST /api/v1/anchorage)".

- **Steps:** authenticate as a user holding `anchorage:create`; `POST /api/v1/anchorage` with a payload that includes a mooring water area containing **at least one anchor point** (field names per the existing anchorage-create contract — do not fabricate); capture HTTP status, response body, and backend log excerpt.
- **Pass:** HTTP status **200** AND neither the response nor the log contains the exact string `column created_by of relation mooring_water_area_anchor_points does not exist`.
- **Non-vacuity guard:** the payload MUST contain a mooring water area with ≥1 anchor point — a 200 on an anchorage-only or empty payload proves nothing. Pre-fix failing evidence is already recorded in the triage (the missing-column error), so a post-fix 200 with the anchor point present is a genuine inversion.

## 5. Out-of-scope assertions — MUST NOT be enforced as failures

- **OOS-1:** `mooring_water_areas` audit columns are `VARCHAR(100)` (`created_by`/`updated_by`/`deleted_by` at `V20260825130000__anchorage_gis_mooring.sql:21-23`) — documented observation, separate concern (design §6, §8). Do NOT fail the run on them, and the new migration MUST NOT touch `mooring_water_areas`.
- **OOS-2:** no Java change required — a zero-Java diff is a PASS condition for AC-7, not a coverage gap (entity/controller/service/repository untouched).
- **OOS-3:** no frontend change required.
- **OOS-4:** no backfill/DML — existing rows keep NULL audit values (valid; the anchorages standard columns are nullable, design WO-DB-1).
- **OOS-5:** no new index required or expected.
- **OOS-6:** agents must not run `mvn clean` / full `mvn test` / `mvn package`, must not run git add/commit/push, must not start or restart the backend (design §8; intake done_oracle's "sau khi restart" is a human/deployment step).
- **OOS-7:** at wave-1 authoring time the migration file does not exist yet (glob-confirmed) — expected; wave-2 runs after the developer lands it.

## 6. What wave-1 did NOT verify

- No product code was written or executed; no build was run; no DB probe; no live HTTP call (authoring-only wave).
- **AC-1** and **AC-2** are RUNTIME oracles: they require the migration to be applied on a live instance and are assigned to a human (agents must not start the backend, design §7). Until applied and observed, they are pending — the module cannot be Passed on static/compile evidence alone.
- The two new `docs/inputs` files (photo, logo) were read; they carry no acceptance relevance for this schema-only hotfix and impose no revision.

## 7. Spot-check statement

Re-read after writing: the AC set covers all five mandated content requirements — (1) criteria mapped 1:1 from design §5 + WO-DB-1, including the exact filename `V20260826110000__add_mooring_anchor_point_audit_columns.sql` and the four idempotent `ADD COLUMN IF NOT EXISTS` clauses (UUID/UUID/TIMESTAMP/UUID), plus no-existing-migration-edit, no Java/frontend change, no `mvn clean`/git/restart as AC-5/AC-7; (2) the exact compile gate command with exit-0 and `BUILD_EXIT_OK` expectations (§4.2); (3) the `information_schema` oracle asserting `data_type` uuid/uuid/timestamp without time zone/uuid (§4.3); (4) the functional `POST /api/v1/anchorage` oracle with the exact missing-column error string and a non-vacuity guard (§4.4); (5) explicit out-of-scope assertions incl. `mooring_water_areas` VARCHAR(100) types (§5). Every factual claim carries a backtick-quoted `path:line` anchor read this session.
