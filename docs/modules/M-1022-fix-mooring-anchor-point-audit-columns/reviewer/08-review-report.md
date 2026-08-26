---
feature-id: M-1022
stage: reviewer
agent: engineering-code-reviewer
verdict: Pass — schema-only hotfix correct, scope-compliant, no blocking findings
last-updated: 2026-08-26
---

# M-1022 — Review Report: Two Flyway migrations (audit columns + UUID conversion)

## 1. Scope reviewed

- **Change-set under review:** exactly two new Flyway migrations —
  `src/main/resources/db/migration/V20260826110000__add_mooring_anchor_point_audit_columns.sql`
  and
  `src/main/resources/db/migration/V20260826120000__convert_mooring_water_areas_audit_to_uuid.sql`.
- **Contract:** design plan `docs/modules/M-1022-fix-mooring-anchor-point-audit-columns/design/00-design-plan.md`
  §4 WO-DB-1 + §8 out-of-scope + §9 reviewer checklist; triage
  `docs/intel/_intake/TRI-1787718932739-7cb5.json` (mooring_water_areas VARCHAR→UUID);
  wave-2 QA report `docs/modules/M-1022-fix-mooring-anchor-point-audit-columns/qa/07-qa-report-w2.md`.
- **Method:** read-only. Full reads of both migrations, both parent migrations
  (`V20260825120000`, `V20260825130000`), the design plan, the QA wave-2 report, and the triage
  record; directory enumeration of `src/main/resources/db/migration/` for version ordering and
  change-set inventory; grep verification of the `BaseEntity` audit-type contract; the mandated
  compile gate executed in THIS review session (§5). No SQL executed — runtime oracles remain
  human-owned (design §7).

## 2. Finding F-1 — Migration 1: column types and idempotency correct (PASS)

Anchors (all observed this session):

| Check | Anchor | Evidence |
|---|---|---|
| One `ALTER TABLE mooring_water_area_anchor_points` | `V20260826110000__add_mooring_anchor_point_audit_columns.sql:5` | single statement, no extra DDL |
| `created_by UUID` | `V20260826110000__add_mooring_anchor_point_audit_columns.sql:6` | matches `BaseEntity.java:90` (`private UUID createdBy`) |
| `updated_by UUID` | `V20260826110000__add_mooring_anchor_point_audit_columns.sql:7` | matches `BaseEntity.java:98` (`private UUID updatedBy`) |
| `deleted_at TIMESTAMP` | `V20260826110000__add_mooring_anchor_point_audit_columns.sql:8` | matches `BaseEntity.java:70` (`private LocalDateTime deletedAt`) |
| `deleted_by UUID` | `V20260826110000__add_mooring_anchor_point_audit_columns.sql:9` | matches `BaseEntity.java:82` (`private UUID deletedBy`, `@JdbcTypeCode(SqlTypes.UUID)`) |
| Idempotency | `V20260826110000__add_mooring_anchor_point_audit_columns.sql:6-9` | 4× `ADD COLUMN IF NOT EXISTS` — re-run-safe |
| Anchorage-standard parity | `V20260825120000__create_anchorages.sql:6-9` | same types in same order: `created_by UUID, updated_by UUID, deleted_at TIMESTAMP, deleted_by UUID` (all nullable) |
| Root cause consistent | `V20260825130000__anchorage_gis_mooring.sql:29-37` | `mooring_water_area_anchor_points` created with only `created_at`/`updated_at` — the four audit columns were genuinely missing; entity `MooringWaterAreaAnchorPoint extends BaseEntity` (design §2 row 2) |

No `VARCHAR`, no `NOT NULL`, no `DEFAULT`, no index, no backfill — the four columns are nullable,
consistent with the anchorages standard and `BaseEntity` nullable mapping. Content is byte-identical
to the canonical SQL in design §4 WO-DB-1.

## 3. Finding F-2 — Migration 2: safe cast is correct and data-preserving (PASS)

Anchors (all observed this session):

| Check | Anchor | Evidence |
|---|---|---|
| One `ALTER TABLE mooring_water_areas` | `V20260826120000__convert_mooring_water_areas_audit_to_uuid.sql:5` | single statement, 3 ALTER COLUMN clauses |
| `created_by` safe cast | `V20260826120000__convert_mooring_water_areas_audit_to_uuid.sql:6` | `CASE WHEN created_by IS NULL OR created_by = '' THEN NULL ELSE created_by::text::uuid END` |
| `updated_by` safe cast | `V20260826120000__convert_mooring_water_areas_audit_to_uuid.sql:7` | identical pattern |
| `deleted_by` safe cast | `V20260826120000__convert_mooring_water_areas_audit_to_uuid.sql:8` | identical pattern |
| `deleted_at` untouched | `V20260826120000__convert_mooring_water_areas_audit_to_uuid.sql:4` (comment only) | `deleted_at` appears nowhere in DDL; source column already `TIMESTAMP` (`V20260825130000__anchorage_gis_mooring.sql:19`) and correctly left as-is |
| Source types | `V20260825130000__anchorage_gis_mooring.sql:21-23` | `created_by VARCHAR(100)`, `updated_by VARCHAR(100)`, `deleted_by VARCHAR(100)` — conversion target is real |

**Cast semantics (re-derived, not trusted):**
1. `NULL → NULL` — first branch, no cast attempted, no error. ✔
2. `'' → NULL` — empty string is not a valid UUID input, so guarding it prevents an avoidable
   apply-time failure; converts the empty value to the NULL the entity contract expects. ✔
3. else `col::text::uuid` — `varchar → text` is a binary-coercible no-op in PostgreSQL (no character
   loss); `text → uuid` parses a valid UUID string to the identical logical UUID value. For the
   triage-confirmed current data (1 row, valid UUID string, per
   `TRI-1787718932739-7cb5.json` request_summary), values are preserved. ✔

**PostgreSQL nuance (observation, not a defect):** `::uuid` stores in canonical lowercase form, so an
uppercase UUID string would be normalized (e.g. `ABCD…` → `abcd…`). UUID comparison is
case-insensitive and JPA binds the logical value, so this is not data corruption. No action required.

**CASE type:** branches `NULL` (unknown) and `uuid` coerce to `uuid`, assignable to the `USING`
target — valid PostgreSQL `ALTER COLUMN … TYPE … USING` syntax.

## 4. Finding F-3 — Flyway version ordering correct (PASS)

Directory enumeration of `src/main/resources/db/migration/V2026082*.sql` (this session) confirms:

- `V20260826090000__standardize_coastal_vts_cospas_2level_approval.sql` — the prior newest migration
  (matches design §2 row 5 claim).
- `V20260826110000__add_mooring_anchor_point_audit_columns.sql` — new, sorts after 26090000.
- `V20260826120000__convert_mooring_water_areas_audit_to_uuid.sql` — new, sorts after 26110000.

Numeric version order `20260826090000 < 20260826110000 < 20260826120000` holds; no migration exists
between the two new files and no `20260826` migration sorts after `26120000`. Migration 1 before
migration 2 is also the correct chronology (26110000 was already applied when the second triage was
filed — `TRI-1787718932739-7cb5.json` request_summary). Both are new files, so there is no Flyway
checksum risk to existing applied migrations.

## 5. Finding F-4 — Change-set scope compliance (PASS)

- Exactly the 2 new migration files exist in the migration directory (glob `V2026082*.sql` this
  session returned the 2 files plus pre-existing migrations; no `V2026082613*` or later).
- QA wave-2 executed `git status --porcelain` (exit 0): exactly 2 untracked files under
  `src/main/resources/db/migration/`, **zero** modified existing migrations (incl.
  `V20260825130000`), no Java/frontend change attributable to this hotfix (`07-qa-report-w2.md` §4
  CS-1/CS-2/CS-3; pre-existing concurrent-session worktree modifications noted as F-1, non-blocking).
- No `mvn clean` / `mvn test` / `mvn package`, no git add/commit/push, no backend start/restart
  (`07-qa-report-w2.md` §4 CS-4).
- Compile gate — executed in THIS review session: exact mandated command
  `"…\mvn.cmd" compile -q && echo BUILD_EXIT_OK` (cwd repo root), run twice —
  `job_03c692a2b001RIWLPjiBxG5jL5` (exit_code 0, output `BUILD_EXIT_OK\r\n`, 30553 ms) and, after
  the final report edit, `job_03c6a35fa001XD2FWi6EnV38Xw` (settled exit 0 — the run postdates every
  file change in this session). By `&&` semantics `mvn compile -q` succeeded and the `BUILD_EXIT_OK`
  marker echoed on both runs. Independent confirmation: QA wave-2 ledger
  `job_03c612095001oRF45axYDuZrQm` exit 0 (`07-qa-report-w2.md` §5). `mvn compile` does not parse
  SQL, so SQL validity on a live PostgreSQL instance remains the human-owned runtime oracle (see §6).

## 6. Residual risks (non-blocking, runtime-gated)

- **R-1 (cast failure if data is not a valid UUID string):** migration 2's `::text::uuid` fails at
  apply time if any non-UUID, non-empty value sits in the three columns. Triage confirms current
  data is a single valid UUID string. If a live-instance cast error occurs, migration 2 must not be
  edited (Flyway checksum invariant) — the failing value must be reported for a follow-up data-repair
  migration. Mirrors QA F-2.
- **R-2 (runtime oracles PENDING, human-owned):** AC-1/AC-2 (POST /api/v1/anchorage 200, no
  missing-column error), AC-11/AC-12/AC-13 (GET list no ClassCastException, `information_schema`
  uuid types, data preservation through the cast) require both migrations applied on a live instance
  after a user backend restart — per design §7 backend must not be started by agents. This review
  Pass covers static correctness, version ordering, and scope compliance only.

## 7. Spot-check statement

Re-derived this session: both migration file contents (full reads — byte-match the design's canonical
SQL), the `BaseEntity` audit contract (grep: `BaseEntity.java:70` LocalDateTime, `:82/:90/:98`
UUID), the parent-table source truth (`V20260825130000:19,21-23,29-37`), the anchorages type
standard (`V20260825120000:6-9`), version ordering and change-set inventory (directory glob). Carried
evidence relied upon (not re-derived): QA wave-2's executed `git status --porcelain` (exit 0,
`07-qa-report-w2.md` §4) and QA compile-gate ledger `job_03c612095001oRF45axYDuZrQm` — the latter
independently corroborated by my own executed compile-gate run this session (job
`job_03c692a2b001RIWLPjiBxG5jL5`, exit 0).

## 8. Verdict

**PASS** — both migrations are correct against the design contract and the `BaseEntity` type
contract; the safe cast preserves valid UUID strings (NULL/''→NULL, else lossless
varchar→text→uuid); `deleted_at` untouched; version ordering correct; change-set is exactly the two
new migration files with no existing-migration/Java/frontend edit and no prohibited process actions.
No blocking findings. Runtime oracles remain human-owned per design §7 and do not block this review.
