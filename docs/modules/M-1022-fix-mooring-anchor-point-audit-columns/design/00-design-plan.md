# Design Plan — Fix missing audit columns on mooring_water_area_anchor_points (M-1022)

- Module: `M-1022-fix-mooring-anchor-point-audit-columns`
- Triage: `TRI-1787716492397-a5d0` (C3, 1 edit-target file, blast_radius 1, dev_footprint backend)
- Stage: engineering-solution-designer
- Type: schema-only hotfix — ONE new Flyway migration. No Java, no frontend, no existing-file edit.

## 1. Objective

Eliminate the runtime INSERT error on creating an anchorage with a mooring water area and anchor
points (`POST /api/v1/anchorage`):

```
column created_by of relation mooring_water_area_anchor_points does not exist
```

by adding the four missing audit columns to `mooring_water_area_anchor_points` through one new,
idempotent Flyway migration, with types matching the anchorage standard
`V20260825120000__create_anchorages.sql`.

## 2. Root cause (verified this session, file-grounded)

| # | Anchor | Evidence |
|---|--------|----------|
| 1 | `src/main/resources/db/migration/V20260825130000__anchorage_gis_mooring.sql:29-37` | `CREATE TABLE IF NOT EXISTS mooring_water_area_anchor_points` declares only `id`, `mooring_water_area_id`, `name`, `latitude`, `longitude`, `created_at`, `updated_at` — **`created_by`, `updated_by`, `deleted_at`, `deleted_by` are missing**. |
| 2 | `src/main/java/com/hanghai/kchtg/port/entity/MooringWaterAreaAnchorPoint.java:29` | `public class MooringWaterAreaAnchorPoint extends BaseEntity` — the entity inherits the full audit contract from `BaseEntity`. |
| 3 | `src/main/java/com/hanghai/kchtg/common/entity/BaseEntity.java:55-72` | `createdBy`, `updatedBy`, `deletedBy` are `UUID` (with `@JdbcTypeCode(SqlTypes.UUID)`), `deletedAt` is `LocalDateTime`; populated by JPA auditing (`@CreatedBy`/`@LastModifiedBy`). |
| 4 | `src/main/resources/db/migration/V20260825120000__create_anchorages.sql:6-9` | Type standard for this entity family: `created_by UUID`, `updated_by UUID`, `deleted_at TIMESTAMP`, `deleted_by UUID` (all nullable). |
| 5 | `grep mooring_water_area_anchor_points` across `src/main/resources/db/migration/` | Only match is `V20260825130000` (CREATE at :29, INDEX at :39). No migration has ever added the audit columns; `V20260826110000` does not exist yet and sorts after the newest migration (`V20260826090000`). |

**Mechanism:** Hibernate includes `created_by`/`updated_by`/`deleted_at`/`deleted_by` in the INSERT
(bound as UUID values from `BaseEntity`), but the table lacks those columns → PostgreSQL rejects the
statement. The sibling table `mooring_water_areas`
(`src/main/resources/db/migration/V20260825130000__anchorage_gis_mooring.sql:10-24`) already declares
all seven audit columns, which is why only the anchor-points INSERT fails.

## 3. Decision

**D1 — One new idempotent migration `V20260826110000__add_mooring_anchor_point_audit_columns.sql`**
is the chosen approach.

| Option | Verdict | Why |
|--------|---------|-----|
| New migration `V20260826110000` with `ADD COLUMN IF NOT EXISTS` | **Chosen** | Flyway applies each migration once and verifies checksums; the buggy `CREATE TABLE` lives in a migration that may already be applied on other environments, so it is immutable. |
| Edit `V20260825130000__anchorage_gis_mooring.sql` in place | Rejected | Changes the migration's checksum → Flyway checksum mismatch causes startup failure on any DB where V30 already ran. |
| Copy the sibling types (`created_by VARCHAR(100)`, …) from `mooring_water_areas` (V20260825130000:16-18) | Rejected | `BaseEntity` binds these columns as UUID; the accepted type standard is the anchorages table (D1 row 4). UUID is the project-wide standard for base-entity user columns (see the `fix_all_base_entity_tables_to_uuid` migration family). |
| `NOT NULL` / `DEFAULT` on the new columns | Rejected | The anchorages standard declares these columns nullable; `BaseEntity` maps them nullable. `NOT NULL` would break existing rows. |

The migration is written in the same house style as `V20260825130000:2-8` (one `ALTER TABLE` with
comma-separated `ADD COLUMN IF NOT EXISTS` clauses).

## 4. Work order

### WO-DB-1 — Add Flyway migration `src/main/resources/db/migration/V20260826110000__add_mooring_anchor_point_audit_columns.sql`

Create **exactly one file**, with **exactly this content** (no other statements, no index, no backfill):

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

Constraints:

- File name **exact**: `src/main/resources/db/migration/V20260826110000__add_mooring_anchor_point_audit_columns.sql`
- Four idempotent `ADD COLUMN IF NOT EXISTS` clauses in one `ALTER TABLE`; types `UUID`, `UUID`, `TIMESTAMP`, `UUID` — **do not** copy the `VARCHAR(100)` audit types from the sibling `mooring_water_areas` table.
- Do not edit any existing migration file (checksum invariant).
- Do not touch `mooring_water_areas`, `anchorages`, or any Java/TSX file.
- No backfill: existing rows keep `NULL` audit values (valid — the anchorages standard columns are nullable).

Verification: see §7. The compile gate proves the project still builds with the new resource; the SQL
itself is validated by Flyway at app startup, so the functional oracle is the QA runtime probe in §7.

## 5. Acceptance mapping

| Acceptance criterion | Design element | Oracle |
|----------------------|----------------|--------|
| No `column created_by … does not exist` error on anchorage create | WO-DB-1 adds the 4 columns | QA live probe: `POST /api/v1/anchorage` with a mooring water area + anchor point → HTTP 200 |
| Table has all 4 audit columns with correct types | WO-DB-1 column types (UUID/UUID/TIMESTAMP/UUID) | QA `information_schema.columns` query (see §7) |
| Migration is re-runnable / environment-safe | `ADD COLUMN IF NOT EXISTS` | Flyway applies once; IF NOT EXISTS guards partial/rerun |
| Backend still compiles | New file is a resource only | §7 compile command exits 0 |

## 6. Risks

- **Type drift by copy-paste** (medium): a developer may copy the `VARCHAR(100)` audit types from the
  sibling table `mooring_water_areas` (V20260825130000:16-18) instead of the UUID standard. Mitigated
  by the exact SQL in WO-DB-1; QA must assert `data_type` in the `information_schema` check, not just
  column presence.
- **Observation (out of scope, do not act on in this hotfix):** the sibling table `mooring_water_areas`
  declares `deleted_by VARCHAR(100)` (`created_by`/`updated_by` likewise) at
  `src/main/resources/db/migration/V20260825130000__anchorage_gis_mooring.sql:23`, while
  `MooringWaterArea.java:28` (`extends BaseEntity`) inherits the UUID audit contract. No runtime
  failure on that table has been observed for this hotfix; it is recorded for a future, separate
  verification.

## 7. Verification (canonical)

- **Compile gate** (exact command, cwd = repo root, timeout 180 s):

  ```
  "C:\Program Files\JetBrains\IntelliJ IDEA 2026.1.4\plugins\maven\lib\maven3\bin\mvn.cmd" compile -q && echo BUILD_EXIT_OK
  ```

  Expected: output ends with `BUILD_EXIT_OK`. Note: `mvn compile` does not parse or execute SQL — it
  proves the backend still compiles with the new migration resource present. Backend must **not** be
  started by agents.
- **Runtime done_oracle** (QA wave, on a live instance):
  1. Create an anchorage with a mooring water area + anchor point → HTTP 200, no missing-column error.
  2. `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'mooring_water_area_anchor_points' AND column_name IN ('created_by','updated_by','deleted_at','deleted_by');`
     → expect `created_by` = uuid, `updated_by` = uuid, `deleted_at` = timestamp without time zone, `deleted_by` = uuid.

## 8. Out of scope (do not implement)

- No change to any Java file — entity, controller, service, or repository (incl. `MooringWaterAreaAnchorPoint.java`, `MooringWaterArea.java`, anchorage services).
- No frontend change.
- No edit to any existing migration (incl. `V20260825130000__anchorage_gis_mooring.sql`) — Flyway checksum invariant.
- No change to `mooring_water_areas` (its audit-column types are a separate, unverified concern).
- No backfill/DML on existing rows; no new index.
- No `mvn clean`, no full `mvn test`, no `mvn package`.
- No git operations (add/commit/push).
- No backend start or restart.

## 9. Reviewer checklist

- Exactly **one file added** and nothing else changed: `src/main/resources/db/migration/V20260826110000__add_mooring_anchor_point_audit_columns.sql`.
- Content is exactly the four `ADD COLUMN IF NOT EXISTS` clauses (UUID/UUID/TIMESTAMP/UUID) in one `ALTER TABLE`.
- No existing migration edited; no Java/frontend diff; no git/build/restart actions performed.
