# Design Plan — Remove Org-Unit Approval Flow (F-003 scope shrink)

| Field | Value |
|---|---|
| Change request | TRI-1786950754582-5a51 (scope_shrink, C3 one-way door) |
| Module / Feature | M-001 (Quản trị hệ thống) / F-003 (Quản lý đơn vị) |
| Decision | C3 — full removal of the org-unit approval flow (status, approved_at, endpoints, permission, UI, tests, docs) |
| Author seat | engineering-solution-designer |
| Date | 2026-08-17 |
| Blast radius | 27 edit-target files (16 backend incl. 1 new migration + 1 test, 6 frontend, 5 docs) |

---

## 1. Objective

Completely remove the org-unit approval flow so that a unit's only state is the
**operational status (Sử dụng / Không sử dụng)** carried by `operational_status`.
Everything belonging to the approval flow — the `status` column + `approved_at` column,
`OrgUnitStatus` enum + converter, `submit/approve/reject` service methods and controller
endpoints, `orgunit:approve` permission, status filter, frontend approval actions and
badges, approval test cases, and all F-003 documentation — is deleted.

Implementation is a later stage; this plan is the file-by-file work order the dev wave
executes and the reviewer verifies against. No source code is modified by this seat.

---

## 2. Current state (seam) — verified anchors

The approval flow today, each anchor opened this session:

| Concern | Location | Anchor |
|---|---|---|
| `status` column + `idx_org_units_status` index | `src/main/java/com/hanghai/kchtg/orgunit/entity/OrgUnit.java` | `@Index(name = "idx_org_units_status", columnList = "status")` (~L42); `private OrgUnitStatus status;` (L97) |
| `approved_at` column | same file | `private LocalDateTime approvedAt;` (L132) |
| Create forces DRAFT | same file | `createRoot()` → `unit.status = OrgUnitStatus.DRAFT;` (~L147) |
| Enum + converter | `orgunit/entity/OrgUnitStatus.java`, `OrgUnitStatusConverter.java` | whole files |
| Status on create | `orgunit/service/OrganizationService.java` | `create()` L308 `.status(request.getStatus() != null ? request.getStatus() : OrgUnitStatus.DRAFT)` |
| Approval service methods | same file | `submitForApproval` ×2 (~L516–554), `approve` ×2 (~L556–585), `reject` ×2 (~L587–615) |
| Filter by status | same file | `filterUnits(OrgUnitStatus status, Integer level, Pageable)` L236 + scope overload L243 |
| Approval endpoints | `orgunit/controller/OrgUnitController.java` | `POST /{id}/submit` L236, `POST /{id}/approve` L252 (`@PreAuthorize orgunit:approve`), `POST /{id}/reject` L269 |
| Filter `status` request param | same file | `filter()` L173 `@RequestParam(required = false) OrgUnitStatus status` |
| Status repo queries | `orgunit/repository/OrgUnitRepository.java` | dead `findByStatusAndDeletedAtIsNull` L84–85; `findByFilters` L90–95; `findByFiltersAndIds` L98–104 |
| DTO status/approvedAt | `orgunit/dto/CreateOrgUnitRequest.java` (status field), `UpdateOrgUnitRequest.java` (status field), `OrgUnitResponse.java` (status + approvedAt + `from()` mapping) | — |
| Seeders force APPROVED | `orgunit/config/OrgUnitDataFixer.java` (`.status(OrgUnitStatus.APPROVED)` root + child helper), `seeder/DataSeeder.java` (L209/225/264), `seeder/M001DataSeeder.java` (L81/97/140) | — |
| Permission seed | `config/PermissionSeeder.java` | L45 `seedPermission(definitions, "orgunit", "approve");` |
| Frontend permission | `frontend/src/constants/permissions.ts` | L30 `APPROVE: 'orgunit:approve'` |
| Frontend status type + calls | `frontend/src/services/organizationService.ts` | `Organization.status` L27; `UpdateOrganizationPayload.status` L62; `OrgFilters.status` L68; normalizer mappings L146/263/285/324/414/467/546/615/766/803/840/874; create body `status: "DRAFT"` L593; update mocks L644/674; `submit()` L748, `approve()` L783, `reject()` L820 |
| Frontend approval UI | `frontend/src/pages/organizations/UnitList.tsx` | STATUS_COLORS/LABELS L21–22; submit/approve/reject handlers L198–219; row-action items L228–229; 3-state `getStatusKey` L283–284 (+L264/298); statusTabs L346–349; badge L370–372/L413–439 |
| Frontend form/status leftovers | `UnitForm.tsx` L50/L63 (`status: data.status`); `UnitTree.tsx` L10–16 STATUS_MAP + badge L35–36 | — |
| Mock data | `frontend/src/services/mockData.ts` | L22 mock permission `orgunit:approve`; `MOCK_ORGANIZATIONS` L210–225 carry `status: 'approved'/'pending'/'draft'/'rejected'` |
| Tests | `src/test/java/com/hanghai/kchtg/orgunit/service/OrganizationServiceTest.java` | import L8; `ApprovalWorkflowTests` L173–~254; `makeUnit` L404 `unit.setStatus(OrgUnitStatus.APPROVED)` |
| DB columns origin | `src/main/resources/db/migration/V102__convert_org_units_enums_to_smallint.sql` (status column), `V18__add_f003_materialized_path_fields.sql` (approved_at) | **historical — do NOT edit** |

**Compile-break sweep (whole repo, this session):** every remaining reference to
`OrgUnitStatus` / org-unit `status` / `approvedAt` lives in the files listed above.
`OrgUnitService.java`, `MaterializedPathService.java`, `OrgUnitScopeService.java`,
`UnitRepository.java`, `UnitHistoryRepository.java` do **not** reference the approval
status — no hidden compile break. `frontend/src/store/permissionStore.ts:24` and
`permissionStore.test.ts:91` contain the literal string `'orgunit:approve'` in a legacy
mapping/test — they stay valid TypeScript after the removal and are **out of footprint**
(kept untouched, harmless).

---

## 3. Target state (delta)

- `org_units` has no `status` and no `approved_at` column. The only state column is
  `operational_status` (`OperationalStatus` enum, `OPERATIONAL`/`SUSPENDED` →
  Sử dụng / Không sử dụng).
- Create/update/delete/tree/search of units work exactly as today; the unit is usable
  immediately upon creation (no PENDING gate).
- API surface: CRUD + `GET /tree` + `GET /search` + `GET /filter` (filter keeps
  `level`, drops `status`). No `submit`/`approve`/`reject`.
- Permission surface: `orgunit:read`, `orgunit:manage` remain; `orgunit:approve` gone.
- UI: status tabs/badges/filters derive from `operationalStatus` only; no
  Trình duyệt / Phê duyệt / Từ chối actions; no Chờ phê duyệt label.
- `unit_history` keeps the `CREATED` (and UPDATED/DELETED/MOVED) audit; APPROVED/
  REJECTED/SUBMITTED actions simply cease to be written. `UnitHistory` entity untouched.
- F-003 docs (feature-brief, lean spec, lean architecture, tech-lead plan, QA cases)
  contain no approval-flow content.

---

## 4. KEEP list (explicit — do NOT touch)

| Item | Why kept | Evidence |
|---|---|---|
| `operational_status` column + `OperationalStatus` enum + `OrgUnitSchemaMigrator` | The remaining unit state; migrator only adds `operational_status` + `rank` columns (no status/approved_at) | `orgunit/config/OrgUnitSchemaMigrator.java` (whole file, read) |
| `unit_history` + `CREATED` audit | Audit trail requirement survives; `create()` writes `saveHistory(saved, "CREATED", ...)` | `OrganizationService.java` create(); `orgunit/entity/UnitHistory.java` |
| Materialized path (`path`/`level`/`sortOrder`), rank (`OrgUnitRank` + converter), tree, search, soft-delete, org-unit cache | Core F-003 functionality, unrelated to approval | verified: no status references in `MaterializedPathService`/`OrgUnitRank`/`OrgUnitCacheService` |
| Historical migrations `V18__add_f003_materialized_path_fields.sql`, `V19__seed_root_org_unit.sql`, `V102__convert_org_units_enums_to_smallint.sql`, `V112__...` | Instructions: do not touch historical Flyway migrations; removal happens via a NEW migration | `src/main/resources/db/migration/` |
| `OrgUnitType` / `OrgUnitTypeConverter` (deprecated) | Explicitly out of scope (rank expansion brief) | BR-003-16 in `ba/00-lean-spec.md` |
| `frontend/src/store/permissionStore.ts:24` legacy `org.*` mapping + `permissionStore.test.ts:91` | Out of footprint; still type-checks (literal strings) | grep sweep |
| Other entities' approval flows (`ApprovalService`, `SharedData.approvedAt`, `assetmovement.*approvedAt`, port/berth approveC1/C2, WaterZone approval UI) | Out of scope — removal is org-unit only | grep sweep: all in other packages |

---

## 5. Work orders — Database (1 new file)

### DB-01 — CREATE `src/main/resources/db/migration/V20260817150000__drop_org_unit_approval.sql`

Follow the plain ANSI/MSSQL style of `V20260817100000__add_org_unit_rank.sql`,
with existence guards (`IF EXISTS`) added per deployment KB entry
`kb-88d69c6bf53080f3` (idempotent, retry-safe migrations); dev-local gets the same
change via `OrgUnitSchemaMigrator` if needed — **do not** add status/approved_at
handling to the migrator.

```sql
-- TRI-1786950754582-5a51: remove org-unit approval flow.
-- Drops the approval-status column, approved_at, and the status index from org_units.
-- operational_status (Sử dụng/Không sử dụng) is KEPT.
DROP INDEX IF EXISTS idx_org_units_status ON org_units;
ALTER TABLE org_units DROP COLUMN IF EXISTS status;
ALTER TABLE org_units DROP COLUMN IF EXISTS approved_at;
```

Notes:
- **Existence guards are mandatory (KB grounded):** per Knowledge Base entry
  `kb-88d69c6bf53080f3` (domain=deployment, "Migrations are forward-only and immutable
  once applied"), migrations must be idempotent and use `IF EXISTS`/`IF NOT EXISTS`
  guards so partial failures can be retried safely; once applied against any shared
  environment the file is immutable — the drop migration must never be edited
  afterwards; any revert happens via a NEW forward migration. Both MSSQL 2016+ and
  PostgreSQL accept `DROP COLUMN IF EXISTS` / `DROP INDEX IF EXISTS`.
- If the target DB is PostgreSQL, `DROP INDEX IF EXISTS idx_org_units_status;` is the
  portable form — the index name is schema-global there; keep the two `ALTER TABLE
  DROP COLUMN` statements identical (with guards).
- **No data backfill.** `operational_status` was always independent of approval status
  (`OrgUnit.java` field javadoc: "Whether the unit is available for use, independent
  from approval status"); seeders set `status=APPROVED` while `operational_status`
  defaulted to `OPERATIONAL`, so all seeded rows keep "Sử dụng". Any dev-local row with
  `status=PENDING`/`DRAFT`/`REJECTED` keeps its `operational_status` (default
  OPERATIONAL) — accepted consequence of the shrink, visible as "Sử dụng".
- Verification: migration applies cleanly on a DB that has `idx_org_units_status`,
  `status`, `approved_at` (idempotent-once: file runs once via Flyway checksum).

---

## 6. Work orders — Backend (13 modified, 2 deleted)

Order within wave: entity/enum first, then repo/service/controller/DTO, then seeders,
then permission seeder. Run `mvn -q clean compile -DskipTests` after the wave.

### BE-01 — MODIFY `orgunit/entity/OrgUnit.java`
1. Remove `@Index(name = "idx_org_units_status", columnList = "status")` from the
   `@Table` indexes (keep `idx_org_units_path`, `idx_org_units_parent`,
   `idx_org_units_level`).
2. Remove `import com.hanghai.kchtg.orgunit.entity.OrgUnitStatus;`.
3. Remove field `private OrgUnitStatus status;` (L97) and its javadoc comment.
4. Remove field `private LocalDateTime approvedAt;` (L132).
5. In `createRoot()` remove `unit.status = OrgUnitStatus.DRAFT;`.
6. **KEEP** `operationalStatus` field, `rank`, materialized-path fields, factory methods.

### BE-02 — DELETE `orgunit/entity/OrgUnitStatus.java`
Whole file (enum DRAFT/PENDING/APPROVED/REJECTED).

### BE-03 — DELETE `orgunit/entity/OrgUnitStatusConverter.java`
Whole file. This breaks the javadoc mirrors in `OrgUnitRank` (BE-04) and the lean-spec
BR mirror rows (docs WO-D2).

### BE-04 — MODIFY `orgunit/entity/OrgUnitRank.java`
Javadoc line "Serialized as enum NAME by Jackson (no `@JsonValue`), mirroring
`{@link OrgUnitStatus}`." — replace the `{@link OrgUnitStatus}` reference (deleted
class) with `{@link OrgUnitRankConverter}` or drop the mirror clause entirely.
No functional change; compile gate.

### BE-05 — MODIFY `orgunit/service/OrganizationService.java`
1. Remove `import ...OrgUnitStatus;` (L9).
2. Class javadoc: remove the `<li>BR-015: Admin-only approval</li>` bullet.
3. `filterUnits`: change both overloads (L236, L243) to drop the `OrgUnitStatus status`
   parameter — new signature `filterUnits(Integer level, Pageable pageable)` and
   `filterUnits(Integer level, Pageable pageable, OrgUnitScopeService.Scope scope)`;
   inner calls to `orgUnitRepo.findByFilters(status, level, pageable)` become
   `findByFilters(level, pageable)` (see BE-07).
4. `create()` (L308): delete the builder line
   `.status(request.getStatus() != null ? request.getStatus() : OrgUnitStatus.DRAFT)`.
5. Delete the whole `── Approval Workflow ──` section: `submitForApproval` ×2,
   `approve` ×2, `reject` ×2 (L516–615), including their `saveHistory(...)` calls with
   actions SUBMITTED/APPROVED/REJECTED.
6. **KEEP** `saveHistory` helper, `create()` CREATED audit, operational-status handling
   in `update()` and `validateParentEligibility()`, `orgUnitCacheService.evictAfterCommit()`
   calls in remaining mutations.

### BE-06 — MODIFY `orgunit/controller/OrgUnitController.java`
1. Remove `import ...OrgUnitStatus;` (L7).
2. `filter()` (L168–185): remove `@RequestParam(required = false) OrgUnitStatus status`
   (L173) and the `status` argument to `organizationService.filterUnits(...)` (L180).
   Keep `level`, `page`, `size`.
3. Delete the `── Approval workflow endpoints ──` block: `POST /{id}/submit` (L236),
   `POST /{id}/approve` (L252), `POST /{id}/reject` (L269) — methods, annotations,
   javadoc.
4. Controller javadoc: remove "approval workflow" from the endpoint list sentence.
5. **KEEP** all CRUD + tree + search endpoints and their `@PreAuthorize` values.

### BE-07 — MODIFY `orgunit/repository/OrgUnitRepository.java`
1. Remove `import ...OrgUnitStatus;` (L4).
2. Delete `findByStatusAndDeletedAtIsNull` (L84–85) — dead method (no callers).
3. `findByFilters` (L90–95): drop the `status` param and the
   `(:status IS NULL OR u.status = :status)` clause → `findByFilters(Integer level,
   Pageable pageable)`.
4. `findByFiltersAndIds` (L98–104): same — drop `status` param/clause.
5. Keep every other query (path/name/code/level/ids) unchanged.

### BE-08 — MODIFY `orgunit/dto/CreateOrgUnitRequest.java`
Remove `import ...OrgUnitStatus;` and the field
`/** Status — defaults to DRAFT on the service layer if not provided. */ private OrgUnitStatus status;`.
Keep `operationalStatus` (used by `create()`).

### BE-09 — MODIFY `orgunit/dto/UpdateOrgUnitRequest.java`
Remove `import ...OrgUnitStatus;` and the field
`/** Status — can be used to submit for approval (PENDING). */ private OrgUnitStatus status;`.
Keep `operationalStatus`.

### BE-10 — MODIFY `orgunit/dto/OrgUnitResponse.java`
Remove `import ...OrgUnitStatus;`, fields `private OrgUnitStatus status;` and
`private LocalDateTime approvedAt;`, and their mappings in `from()`
(`.status(entity.getStatus())`, `.approvedAt(entity.getApprovedAt())`).
Keep `operationalStatus` mapping. (Frontend defaults operational status on absence —
see FE-02.)

### BE-11 — MODIFY `orgunit/config/OrgUnitDataFixer.java`
1. Remove `import ...OrgUnitStatus;`.
2. Remove `.status(OrgUnitStatus.APPROVED)` in `seedDemoData()` (root unit) and in the
   `child(...)` helper. Demo units keep `operationalStatus` default (OPERATIONAL).
3. Keep orphan-fix logic and `rankForLevel`.

### BE-12 — MODIFY `seeder/DataSeeder.java`
Remove `import ...OrgUnitStatus;` (L29) and `.status(OrgUnitStatus.APPROVED)` at
L209, L225, L264 (org-unit blocks only — the many `MapIcon.Status`/other-entity
`status` references are unrelated and untouched).

### BE-13 — MODIFY `seeder/M001DataSeeder.java`
Remove `import ...OrgUnitStatus;` (L8) and `.status(OrgUnitStatus.APPROVED)` at
L81, L97, L140.

### BE-14 — MODIFY `config/PermissionSeeder.java`
Remove L45 `seedPermission(definitions, "orgunit", "approve");`. Keep
`orgunit:manage` (L43) and `orgunit:read` (L44). (File has a single seeding method —
no `upsertMissingPermissions` variant exists here; nothing else to mirror.)

### BE-15 — MODIFY `src/test/java/com/hanghai/kchtg/orgunit/service/OrganizationServiceTest.java`
1. Remove `import ...OrgUnitStatus;` (L8).
2. Delete the whole nested `class ApprovalWorkflowTests` (L173–~254): the
   submitForApproval/approve/reject happy + negative tests (approval state machine is
   gone; `service.submitForApproval/approve/reject` no longer exist → compile error
   until removed).
3. In `makeUnit` (L404) remove `unit.setStatus(OrgUnitStatus.APPROVED);`.
4. Verify no test asserts `response.getStatus()` or calls `filterUnits` with a status
   argument; add a regression assertion that `create()` returns a unit whose
   `operationalStatus` defaults to OPERATIONAL and that **no** status/approvedAt field
   exists on the response (compile-time guarantee).
5. Keep BR-013/014/016, rank, tree, delete tests intact.

---

## 7. Work orders — Frontend (6 files)

Order: types/service first, then pages, then mocks/permissions. Gate: `npm run build`
must exit 0 with **zero new** tsc errors vs. the pre-existing ~90-file red baseline
(see knowledge note `f-001-form-reshape-test-surface`/`frontend-tsc-baseline-red`).

### FE-01 — MODIFY `frontend/src/constants/permissions.ts`
Remove `APPROVE: 'orgunit:approve',` (L30) from the ORG_UNIT permission object. Keep
`READ: 'orgunit:read'` (L28), `MANAGE: 'orgunit:manage'` (L29). Other resources'
APPROVE/APPROVE_C1/C2 entries are unrelated — untouched.

### FE-02 — MODIFY `frontend/src/services/organizationService.ts`
1. `Organization` type: remove `status: "draft" | "pending" | "approved" | "rejected";`
   (L27). Keep `operationalStatus` (L28).
2. `UpdateOrganizationPayload`: remove `status?: ...` (L62).
3. `OrgFilters`: remove `status?: string;` (L68) and the mock filter line
   `filtered = filtered.filter(o => o.status === params.status);` (L372).
4. Remove every status mapping in the normalizers (`mapOrgUnit` and siblings):
   L146, L263, L285, L324, L414, L467, L546, L615, L766, L803, L840, L874 — i.e. all
   `status: (item.status?.toLowerCase() as Organization["status"]) ?? "draft",`
   and `status: item.status as Organization["status"],` lines.
5. `create()`: remove `status: "DRAFT",` from the API body (L593); keep
   `operationalStatus: toApiOperationalStatus(payload.operationalStatus)` (L594).
6. `update()`: remove mock fallback `status: 'draft',` (L644) and
   `status: payload.status?.toUpperCase(),` (L674); keep operationalStatus mapping.
7. Delete `submit(id)` (L748–781), `approve(id, comments?)` (L783–816),
   `reject(id, comments?)` (L820–853) — API calls + mock fallbacks (`status: 'pending'`
   L776, `'approved'` L813, `'rejected'` L850) and their javadoc.
8. **KEEP** `toApiOperationalStatus`, `RANK_OPTIONS`/`RANK_LABELS`, `mapOrgUnit`
   operationalStatus handling, `getById`/tree/subtree endpoints.

### FE-03 — MODIFY `frontend/src/pages/organizations/UnitList.tsx`
1. STATUS maps (L21–22) → operational-only:
   `STATUS_COLORS = { active: statusOperational, inactive: statusCritical }`,
   `STATUS_LABELS = { active: 'Sử dụng', inactive: 'Không sử dụng' }`.
2. Edit prefill: remove `status: org.status,` (L113, L130); keep `operationalStatus`.
3. Delete handlers `handleSubmitApproval` (L198–199), `handleApprove` (L201),
   `handleReject` (L203–219) and the `confirm(...)` modal code with
   Trình duyệt/Phê duyệt/Từ chối strings.
4. Row-action items (L228–229): delete the two `if` blocks pushing
   `submit`/`approve`/`reject` items; keep view/edit/delete items.
5. `getStatusKey` (L283–284) → `(org) => org.operationalStatus === 'inactive' ?
   'inactive' : 'active'`; update call sites L264–265 and L297–299 that fold
   `org.status === 'pending'` into the key.
6. `statusTabs` (L346–349) → tabs: Tất cả / Sử dụng (`active`) / Không sử dụng
   (`inactive`), counts via `getStatusKey`.
7. Badge render (L370–372, L413–439): render from `operationalStatus` only
   (statusKey = active/inactive).
8. Remove now-unused imports (e.g. `SendOutlined`, `CheckOutlined`, `CloseOutlined`,
   `ExclamationCircleOutlined`, `statusAttention`/`statusDraft` if unreferenced) —
   tsc `noUnusedLocals` is on, so the build gate will enumerate them.
9. **KEEP** the drawer form `Form.Item name="operationalStatus"` with options
   `[{value:'active',label:'Sử dụng'},{value:'inactive',label:'Không sử dụng'}]`
   (L556) and the `filterStatus` client state (now fed only by operational tabs).

### FE-04 — MODIFY `frontend/src/pages/organizations/UnitForm.tsx`
Remove `status: data.status,` from `initialData` (L50) and `form.setFieldsValue` (L63).
No other change; the form never had a status Form.Item (only `operationalStatus`).

### FE-05 — MODIFY `frontend/src/pages/organizations/UnitTree.tsx`
1. Delete `STATUS_MAP` (L13–16: draft/pending/approved/rejected badges) and the badge
   `<span>` render (L35–36).
2. Remove now-unused token imports from L10 (`statusAttention`, `statusCritical`,
   `statusDraft` if unreferenced after deletion).
3. Tree nodes keep name/code/level display; no status badge.

### FE-06 — MODIFY `frontend/src/services/mockData.ts`
1. Remove the mock permission entry `{ key: 'orgunit:approve', name: 'Phê duyệt đơn vị
   tổ chức', group: 'org_management', ... }` (L22).
2. `MOCK_ORGANIZATIONS` (L210–225): in every entry replace
   `status: 'approved'|'pending'|'draft'|'rejected'` with
   `operationalStatus: 'active' as const` — these units were all displayed as
   "Sử dụng" under the old UI. Do not invent 'inactive' rows; demo data semantics are
   unchanged.
3. Other mock entities (users/groups/map icons) untouched.

---

## 8. Work orders — F-003 docs (5 files)

Executed by this seat (design stage) in the same change:

### WO-D1 — `_features/F-003-quan-ly-don-vi/feature-brief.md`
Rewrite into the canonical **10-section template** (`docs/feature-brief-template.md`),
preserving kept content (CRUD, tree, rank scope-expansion TRI-1786936397148-3956,
soft-delete) and removing: approval in Description/Flow Summary, the approval AC,
"Duyệt/Chấp thuận đơn vị" in scope, Lanh dao Approve role row, `status`/`approvedAt`
in Entities (shown as removed columns), approve/reject endpoints, Approval Workflow
architecture note, BR-015, approval test strategy. Remaining state = `operational_status`
(Sử dụng / Không sử dụng) only. Exactly 10 sections in template order; empty sections
become "Không áp dụng".

### WO-D2 — `_features/F-003-quan-ly-don-vi/ba/00-lean-spec.md`
Remove: "phê duyệt" from Business Intent; In-Scope #5 "Phê duyệt đơn vị"; approval
from Actors & Permissions; **US-003-05**; "Chờ phê duyệt" from Entities/status table/
Form field #7; "Phê duyệt" screen actions (Screens Summary); TS-003-08 (approval test
scenario, renumber TS-003-09/10 → 08/09); BR-003-09/10 references to
`OrgUnitStatusConverter` (deleted class) — reword to reference `OrgUnitRankConverter`
only. Entities section rewritten to the actual `org_units` schema with English
identifiers (`status`/`approved_at` removed).

### WO-D3 — `_features/F-003-quan-ly-don-vi/sa/00-lean-architecture.md`
Remove: approval state machine from Summary; `approvedAt` row + status row (if present)
from the Unit entity table; APPROVE/REJECT from UnitHistory action list; "Approve/Reject"
row from Consistency Model; approve/reject rows from the Role-to-Endpoint Matrix and
their notes ("Lanh dao: approve only", "Can bo: submit for approval"); `UnitStatus
(DRAFT, PENDING, APPROVED, REJECTED)` from the enum list in Handoff; NFR-REL-001
"Atomic approval state"; "Approval states" row from Key Decisions; "Concurrent
approve/reject" risk; OQ-003-02 (approval initiator); "create → approve flow"
integration test in QA handoff.

### WO-D4 — `_features/F-003-quan-ly-don-vi/tech-lead/04-plan.md`
Remove: approval workflow from Change Overview + "Approval workflow endpoints" gap +
`OrgUnitStatus` enum-mismatch bullet; US-003-04/US-003-05 mapping rows; T1.2
OrgUnitStatus enum change (file now DELETED); `approvedAt` from T1.1/OrgUnitResponse
fields; `status (for approval submission)` from UpdateOrgUnitRequest; approve/reject
from T2.3/T3.1; "approve/reject state machine" test from T3.2; "Approval Workflow State
Machine" developer-guidance block; approval rows from QA Guidance (Wave 1 enum check,
Wave 2 workflow, Wave 3 Approve/Reject endpoints, `status=PENDING` filter example);
"Concurrent approve/reject" risk (reword to cover the enum-deletion compile risk);
migration references to `approved_at` in V18 steps (V18 is historical — the drop
migration V20260817150000 is the new step).

### WO-D5 — `_features/F-003-quan-ly-don-vi/qa/qa-test-cases.md`
Delete approval test cases TC-009, TC-010, TC-011, TC-012, TC-018 (filter by status),
TC-030 (audit on approval), TC-034 (re-submit), TC-043 (approval comments) — 8 cases.
Fix expectations referencing removed fields: TC-001 (drop `status "DRAFT"`), TC-037
(drop `status "APPROVED"`; assert operational status Sử dụng). Keep TC-029 (audit on
create — unit_history CREATED). Update Test Summary (remove Approval Workflow row,
recompute counts; total 45 → 37) and frontmatter `total-cases: 37`. TC IDs keep their
numbers (gaps are the catalog's index; the summary table is authoritative).

---

## 9. Execution order (dev wave)

1. **Wave 1 — schema + backend core:** DB-01, BE-01..BE-04 (entity/enum), BE-07
   (repo), BE-05 (service), BE-06 (controller), BE-08..BE-10 (DTOs) →
   `mvn -q clean compile -DskipTests` green.
2. **Wave 2 — seeders/permissions:** BE-11..BE-14 → re-run compile.
3. **Wave 3 — tests:** BE-15 → `mvn -q test -Dtest=OrganizationServiceTest` green.
4. **Wave 4 — frontend:** FE-01..FE-06 → `npm run build` (cwd `frontend`) exit 0, no
   new tsc errors in the 6 changed files.
5. **Wave 5 — docs:** WO-D1..WO-D5 (done by this design stage; dev wave only re-checks
   consistency).

---

## 10. Acceptance mapping (done_oracle → verification)

| done_oracle item | Check |
|---|---|
| Create/update/delete works; only Sử dụng/Không sử dụng remains | `mvn -q clean compile -DskipTests`; `mvn -q test -Dtest=OrganizationServiceTest`; `npm run build` |
| No UI/API/enum/column/permission of the approval flow remains | repo greps: `OrgUnitStatus`, `orgunit:approve`, `approvedAt` (org-unit only), `findByStatusAndDeletedAtIsNull`, `/submit`, `/{id}/approve`, `/{id}/reject` → 0 hits outside docs history; `status` column gone from migration DDL |
| Frontend builds with no new tsc errors | `npm run build` exit 0; diff of `npx tsc --noEmit -p tsconfig.app.json` errors vs baseline shows none in the 6 changed files |
| Docs clean | greps for BR-015, US-003-05, "Phê duyệt đơn vị", "Chờ phê duyệt", DRAFT/PENDING/APPROVED/REJECTED (as unit status), submit/approve/reject org-unit endpoints, approval state machine → 0 hits in the 5 F-003 docs; feature-brief has exactly 10 sections in template order |

---

## 11. Risks & mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Deleted enum breaks an unlisted file | Compile failure | Pre-sweep done (this plan §2): all references are in footprint. Compile gate catches any residual. |
| Frontend tsc baseline already red (~90 pre-existing files) | "Red build" misread as regression | Acceptance = zero NEW errors in the 6 changed files; baseline diff recorded in workspace memory. |
| Existing rows with status=PENDING become "Sử dụng" after drop | Data semantics shift | Accepted per scope-shrink; operational_status was always independent; no backfill (documented §5). |
| `orgunit:approve` already granted to a role in a live DB | Orphan permission row | Harmless: no endpoint references it after removal. `PermissionSeeder.run()` is insert-only — it loops over its definitions map and saves only codes that `findByCode` returns empty for (`PermissionSeeder.java:113`), never deleting or updating existing rows, so a pre-existing `orgunit:approve` row stays but is unreachable. Optional cleanup out of scope. |
| permissionStore legacy `org.approve` mapping | Dead mapping | Harmless string mapping; out of footprint; stays. |
| V18/V102 mention status/approved_at | Confusion during review | Historical migrations are read-only by instruction; new drop migration is the single source of schema truth. |

## 12. Rollback

- **Schema:** re-run is not needed for rollback of the code — restoring the previous
  revision restores the entity (ddl-auto path is not used for these columns; the drop
  migration is forward-only). If a full revert is required, recreate columns via a new
  forward migration (status SMALLINT + approved_at TIMESTAMP + index) — do not edit
  V20260817150000.
- **Code:** revert the commit; `OrgUnitStatus` etc. return with the previous revision.
- **Data:** `operational_status` values are untouched by the migration.

## 13. Alternatives considered

| Alternative | Rejected because |
|---|---|
| Keep `status` column but stop using it | Leaves dead schema + enum + permission contradicting "completely remove" (TRI request + C3 one-way-door rationale) |
| Backfill status→operational_status before drop | No semantic mapping exists (PENDING ≠ inactive); inventing one violates "no placeholder data" rule; operational_status is independent |
| Renumber TC/US/BR IDs after deletion | Churn without value; IDs are stable identifiers; only banned identifiers must disappear |
| Remove `OrgFilters` entirely | Level/parentId/search filters remain useful; only the `status` member is removed |
