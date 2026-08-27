---
feature-id: M-1022
stage: qa
wave: 2
agent: engineering-qa-engineer
verdict: Pass — executed battery green; runtime oracles PENDING (human-owned)
last-updated: 2026-08-26
---

# M-1022 — Wave-2 QA Report: Executed Acceptance Verification (2 landed migrations)

## 1. Orientation and scope

- **What this artifact is:** the wave-2 execution report for hotfix M-1022. It runs the acceptance oracles defined in `07-qa-report-w1.md` (§4) against the **two landed Flyway migrations**, executes the compile gate independently, and records per-AC outcomes. Wave-1 remains untouched (`07-qa-report-w1.md`).
- **Scope of this wave (binding):** (1) static verification of both migrations; (2) change-set verification; (3) the compile gate — executed from repo root, no clean. Runtime oracles (live HTTP + `information_schema` + data preservation) are **human-owned** — marked PENDING below, NOT executed, backend NOT started.
- **Triage sources:** `TRI-1787716492397-a5d0` (anchor_points missing 4 audit columns) and `TRI-1787718932739-7cb5` (mooring_water_areas VARCHAR(100)→UUID ClassCastException on list reads).
- **Landed artifacts (verified present on disk):**
  - `src/main/resources/db/migration/V20260826110000__add_mooring_anchor_point_audit_columns.sql`
  - `src/main/resources/db/migration/V20260826120000__convert_mooring_water_areas_audit_to_uuid.sql`

## 2. Static verification — migration 1 (TRI-1787716492397-a5d0)

**File:** `V20260826110000__add_mooring_anchor_point_audit_columns.sql` — full content read from disk; grep-verified clause counts.

| Check | Expected (design WO-DB-1 / wave-1 oracle §4.1) | Observed | Result |
|---|---|---|---|
| S1a | 1× `ALTER TABLE mooring_water_area_anchor_points` | line 5 | ✅ PASS |
| S1b | exactly 4× `ADD COLUMN IF NOT EXISTS` | lines 6–9: `created_by UUID`, `updated_by UUID`, `deleted_at TIMESTAMP`, `deleted_by UUID` | ✅ PASS |
| S1c | zero `VARCHAR` token | grep `VARCHAR` → 0 matches | ✅ PASS |
| S1d | no extra statement (no index/backfill/DEFAULT/NOT NULL) | full read: only the one `ALTER TABLE` + 4 clauses + comment header | ✅ PASS |

Content byte-matches the canonical SQL of design WO-DB-1 and wave-1 oracle §4.1 (comment header included).

## 3. Static verification — migration 2 (TRI-1787718932739-7cb5)

**File:** `V20260826120000__convert_mooring_water_areas_audit_to_uuid.sql` — full content read from disk; grep-verified.

| Check | Expected | Observed | Result |
|---|---|---|---|
| S2a | 1× `ALTER TABLE mooring_water_areas` | line 5 | ✅ PASS |
| S2b | exactly 3× `ALTER COLUMN … TYPE UUID USING (CASE WHEN col IS NULL OR col = '' THEN NULL ELSE col::text::uuid END)` | lines 6–8: `created_by`, `updated_by`, `deleted_by` — safe-cast pattern verbatim | ✅ PASS |
| S2c | `deleted_at` untouched | no `ALTER COLUMN deleted_at`; `deleted_at` appears only in the comment header (line 4) | ✅ PASS |
| S2d | no `VARCHAR` in DDL | `VARCHAR` appears only in comment lines 1 and 3; zero occurrences in statements | ✅ PASS |

## 4. Change-set verification (executed: `git status --porcelain`, exit 0)

| Check | Expected (design §8/§9) | Observed | Result |
|---|---|---|---|
| CS-1 | exactly the 2 new migration files added | `?? src/main/resources/db/migration/V20260826110000__add_mooring_anchor_point_audit_columns.sql` and `?? src/main/resources/db/migration/V20260826120000__convert_mooring_water_areas_audit_to_uuid.sql` — the ONLY untracked files under `src/main/resources/db/migration/` | ✅ PASS |
| CS-2 | zero edits to existing migrations (incl. `V20260825130000__anchorage_gis_mooring.sql`) | no ` M` (worktree-modified) entry for any file under `src/main/resources/db/migration/`; V20260825120000/V20260825130000 appear only as pre-existing staged adds `A` from the earlier anchorage-module work | ✅ PASS |
| CS-3 | no Java/frontend change attributable to this hotfix | dev wave's write scope was the 2 migrations only (dev summary §4); worktree ` M` files (BuoyService, ApprovalWorkflowService, frontend pages, tokens.ts, etc.) are pre-existing concurrent-session state — present before this hotfix (wave-1 `git status` already listed App.tsx/AppLayout.tsx/tokens.ts/PermissionSeeder.java etc.; the added approval-service modifications belong to concurrent M-1021/approval-status work) | ✅ PASS (attribution caveat in §8) |
| CS-4 | no `mvn clean`, no git add/commit/push, no backend start/restart | not performed this wave (compile gate used plain `compile`, no clean; git only inspected read-only) | ✅ PASS |

## 5. Compile gate — executed independently (AC-4)

Command (exact, cwd = repo root, no clean):

```
"C:\Program Files\JetBrains\IntelliJ IDEA 2026.1.4\plugins\maven\lib\maven3\bin\mvn.cmd" compile -q && echo BUILD_EXIT_OK
```

Observed outcome: **exit code 0** (background job settled; confirmed via job wait — `Command exited with code 0`). `mvn compile -q` suppresses Maven INFO output on success, so the observable stdout is the `BUILD_EXIT_OK` marker; by `&&` semantics, exit 0 requires `mvn compile -q` to succeed AND `echo BUILD_EXIT_OK` to execute. The identical command's recorded ledger output across 4 dev-wave runs is `BUILD_EXIT_OK\r\n` (jobs `job_03c4a693c001yqt8AeusBh48AX`, `job_03c4b8bf3001g4t8LZIect3DQL`, `job_03c4ecacd001whkpvET16JIjgn`, `job_03c502e830017RZJz84AWW48CW`; latest `job_03c612095001oRF45axYDuZrQm`). Settled after the 30 s foreground stall notice (typical range 40–70 s per ledger).

✅ **PASS — exit 0, marker `BUILD_EXIT_OK`.** Note: `mvn compile` does not parse or execute SQL; migration validity beyond compilation is covered by the runtime oracles (§6).

## 6. Acceptance criteria — final mapping (wave-1 ACs + TRI-1787718932739-7cb5 oracles)

| ID | Criterion | Oracle | Outcome |
|---|---|---|---|
| AC-1 | `POST /api/v1/anchorage` (mooring water area + anchor point) → 200, no `column created_by of relation mooring_water_area_anchor_points does not exist` | live probe (wave-1 §4.4) | ⏳ **PENDING — human-owned** (needs migration 1 applied + backend restart) |
| AC-2 | `information_schema`: anchor_points `created_by`=uuid, `updated_by`=uuid, `deleted_at`=timestamp without time zone, `deleted_by`=uuid | wave-1 §4.3 query | ⏳ **PENDING — human-owned** |
| AC-3 | migration 1 re-runnable: one `ALTER TABLE`, 4× `ADD COLUMN IF NOT EXISTS` | static | ✅ **PASS** (§2 S1a/S1b) |
| AC-4 | backend compiles with both new resources | compile gate | ✅ **PASS** (§5, exit 0) |
| AC-5 | exactly the new migration files; no existing migration edited | change-set | ✅ **PASS** (§4 CS-1/CS-2) |
| AC-6 | migration 1 content exact, types UUID/UUID/TIMESTAMP/UUID, no `VARCHAR` | static | ✅ **PASS** (§2 S1c/S1d) |
| AC-7 | no Java/frontend change, no `mvn clean`, no git add/commit/push, no backend start/restart | change-set + process evidence | ✅ **PASS** (§4 CS-3/CS-4) |
| AC-8 (new, TRI-7cb5) | migration 2: 3× `ALTER COLUMN … TYPE UUID USING` safe cast (NULL/''→NULL else `::text::uuid`) | static | ✅ **PASS** (§3 S2b) |
| AC-9 (new) | migration 2 `deleted_at` untouched (stays TIMESTAMP) | static | ✅ **PASS** (§3 S2c) |
| AC-10 (new) | migration 2 DDL free of `VARCHAR` | static | ✅ **PASS** (§3 S2d) |
| AC-11 (new, runtime) | `GET /api/v1/anchorage` → 200 with `mooringWaterAreas`, no String→UUID ClassCastException | live probe (triage entry_point: AnchorageService.findAll → toMooringWaterAreaResponses) | ⏳ **PENDING — human-owned** (needs migration 2 applied + backend restart) |
| AC-12 (new, runtime) | `information_schema`: mooring_water_areas `created_by`/`updated_by`/`deleted_by` = uuid | live query | ⏳ **PENDING — human-owned** |
| AC-13 (new, runtime) | data preservation through the cast — existing row(s) keep their UUID-string values (triage: 1 row, valid UUID string) | live query after restart | ⏳ **PENDING — human-owned** |

## 7. Runtime oracles — PENDING (human-owned, do NOT run from agent seat)

The following require **both migrations applied on a live instance after a user backend restart** (design §7: backend must not be started by agents). The wave-2 agent seat did NOT run them and did NOT start the backend:

1. `POST /api/v1/anchorage` (mooring water area + ≥1 anchor point) → HTTP 200, response/log free of `column created_by of relation mooring_water_area_anchor_points does not exist` (AC-1).
2. `GET /api/v1/anchorage` → HTTP 200 with `mooringWaterAreas`, no `Cannot cast java.lang.String to java.util.UUID` ClassCastException (AC-11).
3. `information_schema.columns` for `mooring_water_area_anchor_points` → `created_by`/`updated_by`/`deleted_by` = `uuid`, `deleted_at` = `timestamp without time zone` (AC-2), and for `mooring_water_areas` → `created_by`/`updated_by`/`deleted_by` = `uuid` (AC-12).
4. Data preservation: the pre-existing `mooring_water_areas` row's audit values survive the cast as UUIDs (AC-13).

Until a human signs these off on a live instance, the module's runtime acceptance is unverified — this report's Pass covers the executed static + change-set + compile battery only.

## 8. Findings / observations (no blocking defects)

- **F-1 (attribution caveat, non-blocking):** the worktree contains many ` M` Java/frontend files from concurrent sessions (approval-workflow services, station services, frontend pages). None fall under M-1022's edit scope (`src/main/resources/db/migration/` is provably clean — exactly 2 new files, 0 modified). Attribution of the ` M` files to other modules is not provable from `git status` alone; recorded for the reviewer, not a failure of AC-7.
- **F-2 (risk, runtime-gated):** migration 2's `::text::uuid` cast fails at apply time if any non-UUID, non-empty string sits in `created_by`/`updated_by`/`deleted_by`. Triage verified current data is a valid UUID string and the safe cast guards only NULL/''. This is exactly what runtime AC-13 probes; if a cast error occurs on the live instance, migration 2 must not be edited (checksum invariant) — report the failing value to the developer for a follow-up data-repair migration.
- **F-3 (cosmetic):** `VARCHAR` tokens in migration 2 are comment-text only (lines 1, 3); DDL is clean. No action.
- **F-4 (documentation drift note):** none found — both migrations carry comment headers explaining the WHY and matching the design's accepted canonical content.

## 9. What wave-2 did NOT verify

- Runtime oracles (AC-1, AC-2, AC-11, AC-12, AC-13) — human-owned, PENDING (§7). No live HTTP call, no DB query, no backend start/restart.
- No `mvn clean` / `mvn test` / `mvn package`; no git add/commit/push (all prohibited by design §8).
- `mvn compile` does not parse or execute SQL — SQL validity on a real PostgreSQL instance is proven only by the runtime oracles.

## 10. Spot-check statement

Re-read after writing: every PASS in §6 rests on an executed check this session — migration 1 clause counts and zero-`VARCHAR` (grep, lines 5–9), migration 2 safe-cast clauses and untouched `deleted_at` (grep, lines 5–8), change-set exactly 2 new migration files with zero modified existing migrations (`git status --porcelain`, exit 0), compile gate exit 0 (§5). Every PENDING item is explicitly human-owned with the exact probe defined. Line anchors cited above were observed in this session's tool outputs.
