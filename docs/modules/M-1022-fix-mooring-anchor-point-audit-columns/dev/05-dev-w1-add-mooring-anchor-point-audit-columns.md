---
feature-id: M-1022
stage: dev
wave: 1
agent: engineering-backend-developer
verdict: Pass
last-updated: 2026-08-26
---

# M-1022 — Dev Wave-1 Implementation Summary: mooring audit columns (2 migrations)

Schema-only hotfix for `M-1022-fix-mooring-anchor-point-audit-columns`, covering **both** follow-up tickets:
TRI-1787716492397-a5d0 (anchor_points missing audit columns) and TRI-1787718932739-7cb5
(mooring_water_areas VARCHAR→UUID type drift). Exactly **two** new Flyway migrations, no other changes.

## 1. Migration 1 — `src/main/resources/db/migration/V20260826110000__add_mooring_anchor_point_audit_columns.sql`

Adds the 4 missing audit columns to `mooring_water_area_anchor_points` (ticket 1: runtime INSERT error
`column created_by of relation mooring_water_area_anchor_points does not exist`). Content (verbatim):

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

One `ALTER TABLE`, four `ADD COLUMN IF NOT EXISTS` (UUID/UUID/TIMESTAMP/UUID); no index/backfill/DEFAULT/NOT NULL.
Byte-matches design WO-DB-1 and QA oracle `07-qa-report-w1.md` §4.1 (comment header included per accepted
canonical; the dispatch inline block was an abbreviated summary of the same SQL).

## 2. Migration 2 — `src/main/resources/db/migration/V20260826120000__convert_mooring_water_areas_audit_to_uuid.sql`

Converts the sibling table's audit columns from `VARCHAR(100)` to `UUID` (ticket 2: list-read
ClassCastException `Cannot cast java.lang.String to java.util.UUID`). Grounded at
`V20260825130000__anchorage_gis_mooring.sql:21-23` (`created_by VARCHAR(100)`, `updated_by VARCHAR(100)`,
`deleted_by VARCHAR(100)`); `deleted_at` is already `TIMESTAMP` (line 19) and is NOT touched.
Content (verbatim; short comment header allowed by the work order):

```sql
-- Convert mooring_water_areas audit columns from VARCHAR(100) to UUID.
-- Entity MooringWaterArea extends BaseEntity (UUID), but V20260825130000 created these
-- columns as VARCHAR(100) -> ClassCastException (String -> UUID) on list reads.
-- Safe cast: NULL or '' -> NULL, else ::text::uuid; deleted_at stays TIMESTAMP (untouched).
ALTER TABLE mooring_water_areas
    ALTER COLUMN created_by TYPE UUID USING (CASE WHEN created_by IS NULL OR created_by = '' THEN NULL ELSE created_by::text::uuid END),
    ALTER COLUMN updated_by TYPE UUID USING (CASE WHEN updated_by IS NULL OR updated_by = '' THEN NULL ELSE updated_by::text::uuid END),
    ALTER COLUMN deleted_by TYPE UUID USING (CASE WHEN deleted_by IS NULL OR deleted_by = '' THEN NULL ELSE deleted_by::text::uuid END);
```

Exactly 3 `ALTER COLUMN ... TYPE UUID USING (...)` clauses; safe cast keeps existing UUID-string data
(e.g. `9517f8cd-da9c-48a1-abef-95678b1a1922`) and maps NULL/'' → NULL; no other statement.

## 3. Verification — compile gate (executed, recorded)

Command (exact, repo root, no clean; the engine `verify` placeholder was ignored):

```
"C:\Program Files\JetBrains\IntelliJ IDEA 2026.1.4\plugins\maven\lib\maven3\bin\mvn.cmd" compile -q && echo BUILD_EXIT_OK
```

Results — executed on the final file state (both migrations present):

1. Typed `build` tool (`mvn.cmd compile -q`): **Build succeeded (52 477 ms, exit code 0)** — recorded structured result.
2. Bash exact mandated command: settled `Command exited with code 0` (job `job_03c5dbb6c001ze7MdI5I3hlGy8`); the recorded
   output for this identical command in the ledger is `BUILD_EXIT_OK\r\n` (exit 0) — by `&&` semantics exit 0 requires
   `mvn compile -q` to succeed AND `echo BUILD_EXIT_OK` to execute.
3. Migration-1-only state was also verified green earlier (4 recorded runs, jobs `job_03c4a693c001yqt8AeusBh48AX`,
   `job_03c4b8bf3001g4t8LZIect3DQL`, `job_03c4ecacd001whkpvET16JIjgn`, `job_03c502e830017RZJz84AWW48CW`, all
   `output "BUILD_EXIT_OK\r\n"`; typed build tool 70 420 ms).

`mvn compile -q` suppresses Maven INFO output on success, so the observable terminal text is the `BUILD_EXIT_OK`
marker. `mvn clean` was NOT run (out of scope).

## 4. Change-set

- Exactly **two** new files, both under `src/main/resources/db/migration/`:
  1. `V20260826110000__add_mooring_anchor_point_audit_columns.sql`
  2. `V20260826120000__convert_mooring_water_areas_audit_to_uuid.sql`
- Zero edits to existing migrations (incl. `V20260825130000__anchorage_gis_mooring.sql`, glob-verified present,
  never opened for write); zero Java/entity/controller/service/frontend changes; no `mvn clean`; no backend
  start/restart; no git add/commit/push. (git inspection was denied by the dispatch permission layer — change-set
  documented from session tool records: glob-before absent → write → read-after.)
- Pre-existing frontend biome lint diagnostics surfaced by the editor (`PierListPage.tsx`, `BerthListPage.tsx`,
  `DryPortListPage.tsx`, `AnchorageForm.tsx`) are unrelated — files not touched, READ-ONLY per work order.

## 5. Acceptance mapping (module level)

| Criterion | Status | Evidence |
|---|---|---|
| AC-3/AC-6 (migration 1: one ALTER TABLE, 4× ADD COLUMN IF NOT EXISTS, UUID/UUID/TIMESTAMP/UUID) | ✅ | §1 verbatim |
| AC-2nd (migration 2: 3× ALTER COLUMN TYPE UUID USING safe cast; deleted_at untouched) | ✅ | §2 verbatim |
| AC-4 (backend compiles with both new resources) | ✅ | §3 (exit 0, BUILD_EXIT_OK) |
| AC-5 (exactly the new migration files; no existing migration edited) | ✅ | §4 |
| AC-7 (no Java/frontend/clean/git/restart) | ✅ | §4 |
| Runtime: POST /api/v1/anchorage → 200 without missing-column error | ⏳ PENDING | needs migration 1 applied on live instance + human probe (design §7) |
| Runtime: GET /api/v1/anchorage → 200, no String→UUID ClassCastException | ⏳ PENDING | needs migration 2 applied on live instance + human probe |
| Runtime: information_schema — 4 columns uuid/uuid/timestamp/uuid (anchor_points) + 3 columns uuid (mooring_water_areas) | ⏳ PENDING | live instance after restart, QA §4.3-style query |

## 6. Risks / unverified edges

- Runtime oracles are not verifiable from this seat (backend start prohibited); they await wave-2/human execution
  after both migrations are applied on a live instance.
- `mvn compile` does not parse or execute SQL — migration validity beyond compilation rests on the runtime oracles.
- Migration 2's `::text::uuid` cast is PostgreSQL-specific; the project is PostgreSQL (project-wide convention).
- If any non-UUID, non-empty string exists in `created_by/updated_by/deleted_by`, the cast fails at apply time —
  triage verified current data is a valid UUID string (safe cast guards only NULL/''); flagged for the runtime probe.
