# Review Report — Remove Org-Unit Approval Flow (TRI-1786950754582-5a51)

| Field | Value |
|---|---|
| Change request | TRI-1786950754582-5a51 (scope_shrink, C3 one-way door) |
| Module / Feature | M-001 (Quản trị hệ thống) / F-003 (Quản lý đơn vị) |
| Work order | `design/00-design-plan.md` §5 (DB), §6 (backend), §7 (frontend), §8 (docs) |
| Reviewer seat | engineering-code-reviewer |
| Date | 2026-08-17 |
| Verdict | **Pass** — no blocking finding survives reproduction |

## 1. Verdict

**Pass / high confidence.** The org-unit approval flow is fully removed with no residual
markers; the explicit KEEP list is intact; other entities' approval flows are untouched;
and no approval-flow scope creep exists inside the declared footprint. All three
done_oracle verification commands reproduce green in this session.

## 2. Scope inspected

- Backend `orgunit` package (entity, service, controller, repository, DTO, config),
  seeders, `PermissionSeeder`, migration, and the org-unit service test.
- Frontend `frontend/src/pages/organizations/*`,
  `frontend/src/services/organizationService.ts`, `mockData.ts`,
  `frontend/src/constants/permissions.ts`.
- F-003 docs (feature-brief, lean spec, lean architecture, tech-lead plan, QA cases).
- Blast radius: whole-repo grep sweeps for every approval marker.
- Verification commands (reproduced): `mvn -q clean compile -DskipTests`,
  `mvn -q test -Dtest=OrganizationServiceTest`, `npm run build` (frontend).

---

## 3. Verification — (1) every removal target actually removed

### 3.1 Enum + converter (deleted)

- `src/main/java/com/hanghai/kchtg/orgunit/entity/OrgUnitStatus.java` — **deleted**
  (glob `OrgUnitStatus*.java` → 0 files; `git status` shows `D`).
- `src/main/java/com/hanghai/kchtg/orgunit/entity/OrgUnitStatusConverter.java` — **deleted**.
- Whole-`src/main/java` grep `OrgUnitStatus` → **0 hits** (no dangling import/`{@link}`).
  `OrgUnitRank.java:6` now javadoc-links `{@link OrgUnitRankConverter}` (BE-04 done).

### 3.2 Entity `OrgUnit.java`

- `@Table` indexes are only `idx_org_units_path`, `idx_org_units_parent`,
  `idx_org_units_level` — `idx_org_units_status` gone (`OrgUnit.java:36-38`).
- No `private OrgUnitStatus status;`, no `private LocalDateTime approvedAt;`
  (grep `approvedAt` in `orgunit` package → 0 hits; `OrgUnitStatus` → 0 hits).
- `createRoot()` sets `unit.operationalStatus = OperationalStatus.OPERATIONAL`
  (`OrgUnit.java:140`) — the `unit.status = OrgUnitStatus.DRAFT;` line is gone.
- `rank` field (`OrgUnit.java:95`) and `operationalStatus`
  (`OrgUnit.java:97-101`) remain.

### 3.3 Service `OrganizationService.java`

- `filterUnits(Integer level, Pageable pageable)` (`OrganizationService.java:234`) and
  the scope overload (`OrganizationService.java:240`) — **no `status` param**.
- No `submitForApproval` / `approve` / `reject` (grep → 0 hits).
- `saveHistory(saved, "CREATED", "Tạo mới đơn vị", ...)` kept (`OrganizationService.java:327`).
- `orgUnitCacheService.evictAfterCommit()` kept at `:328`, `:431`, `:508`.

### 3.4 Controller `OrgUnitController.java`

- Javadoc `Endpoints: CRUD, tree traversal, search/filter` (`OrgUnitController.java:32`) —
  no "approval workflow".
- No `/{id}/submit|approve|reject` endpoints (grep → 0 hits; the only `@PostMapping` is
  plain create at `:187`).
- `filter()` (`:169-177`) passes no `status` argument.
- `@PreAuthorize` surface is `isAuthenticated()` / `orgunit:read` / `orgunit:manage` only.

### 3.5 Repository `OrgUnitRepository.java`

- `findByStatusAndDeletedAtIsNull` deleted (whole-repo grep → 0 hits outside docs).
- `findByFilters(@Param("level") Integer level, Pageable pageable)` and
  `findByFiltersAndIds(level, ids, pageable)` — no `status` clause.

### 3.6 DTOs

- `CreateOrgUnitRequest.java:51`, `UpdateOrgUnitRequest.java:46`,
  `OrgUnitResponse.java:28` expose only `OperationalStatus operationalStatus`.
- `OrgUnitResponse.java:57` maps `.operationalStatus(entity.getOperationalStatus())`; no
  `status`/`approvedAt` field or mapping.

### 3.7 DataFixer + seeders

- `OrgUnitDataFixer.java` — only `.rank(rankForLevel(...))` (`:55`, `:80`); no
  `.status(OrgUnitStatus.APPROVED)`.
- `seeder/DataSeeder.java` + `seeder/M001DataSeeder.java` — grep `OrgUnitStatus` →
  0 hits.

### 3.8 PermissionSeeder

- `PermissionSeeder.java:43-44` keep `orgunit:manage` + `orgunit:read`; the
  `seedPermission(definitions, "orgunit", "approve")` line is removed (diff shows a
  single `-` hunk, nothing else in the file).

### 3.9 Migration (DB-01)

`src/main/resources/db/migration/V20260817150000__drop_org_unit_approval.sql`:

```sql
DROP INDEX IF EXISTS idx_org_units_status;
ALTER TABLE org_units DROP COLUMN IF EXISTS status;
ALTER TABLE org_units DROP COLUMN IF EXISTS approved_at;
```

- All three statements guarded with `IF EXISTS` (idempotent/retry-safe, KB-grounded).
- `DROP INDEX IF EXISTS` without `ON org_units` — the PostgreSQL-portable form the design
  §5 note explicitly permits. `operational_status` untouched.

### 3.10 Test `OrganizationServiceTest.java`

- No `OrgUnitStatus` import; no nested `ApprovalWorkflowTests`; no `setStatus`/`getStatus`
  (grep → 0 hits).
- Regression assertion present:
  `assertEquals(OperationalStatus.OPERATIONAL, response.getOperationalStatus());`
  (in `shouldAllowUniqueCodeOnCreate`, ~`:120`).

### 3.11 Frontend

- `frontend/src/constants/permissions.ts` — `ORGUNIT` object is
  `{ READ: 'orgunit:read', MANAGE: 'orgunit:manage' }` (no `APPROVE` key).
- `frontend/src/services/organizationService.ts` — `Organization` type has only
  `operationalStatus: "active" | "inactive"` (`:28`); `toApiOperationalStatus`
  (`:95-96`); no `status` approval field, no `submit/approve/reject` methods, no
  `status: "DRAFT"` in `create()` (create body uses `operationalStatus` at `:579`).
- `frontend/src/pages/organizations/UnitList.tsx` — `STATUS_COLORS = { active, inactive }`
  (`:21`), `statusTabs` = Tất cả / Sử dụng / Không sử dụng (`:319-322`); no
  submit/approve/reject handlers; no "Trình duyệt"/"Phê duyệt"/"Từ chối"/"Chờ phê duyệt"
  strings.
- `frontend/src/pages/organizations/UnitForm.tsx` — `operationalStatus` only.
- `frontend/src/pages/organizations/UnitTree.tsx` — grep `STATUS_MAP|status|badge|...` →
  **0 hits** (no badge, no status map).
- `frontend/src/services/mockData.ts` — mock permissions are `orgunit:read` + `orgunit:manage`
  (`:20-21`), no `orgunit:approve`; `MOCK_ORGANIZATIONS` entries use
  `operationalStatus: 'active' as const` (`:220-223`).

### 3.12 F-003 docs (§8, WO-D1..D5)

Grep over `_features/F-003-quan-ly-don-vi/` for approval markers:
- `feature-brief.md`, `ba/00-lean-spec.md`, `sa/00-lean-architecture.md`,
  `qa/qa-test-cases.md` → **0 hits**.
- `tech-lead/04-plan.md` → only *removal descriptions* ("`OrgUnitStatus` … is removed per
  TRI-1786950754582-5a51", "DELETE", "DROP COLUMN status, approved_at") — no residual
  approval-flow feature content.

---

## 4. Verification — (2) KEEP list intact

| KEEP item | Evidence |
|---|---|
| `operational_status` + `OperationalStatus` enum | `OrgUnit.java:97-101` (`@Column(name="operational_status", ...)`, default `OPERATIONAL`) |
| `unit_history` + `CREATED` audit + `saveHistory` | `OrganizationService.java:327` (`saveHistory(saved, "CREATED", ...)`), helper at `:524` |
| `OrgUnitSchemaMigrator` | keeps `CREATE INDEX IF NOT EXISTS idx_org_units_operational_status`; **no** status/approved_at handling added (diff adds only the `rank` column from the concurrent rank TRI) |
| `rank` (`OrgUnitRank` + converter) | `OrgUnit.java:95`; `OrgUnitRank.java` + `OrgUnitRankConverter.java` present |
| CRUD / tree / search / filter | `OrgUnitController.java` — GET, GET `/tree`, `/search`, `/filter`, POST, PUT, DELETE all present with `orgunit:read`/`orgunit:manage` |
| scope + cache | `OrganizationService.java` `orgUnitCacheService.evictAfterCommit()` at `:328`, `:431`, `:508` |

---

## 5. Verification — (3) other entities' approval flows untouched

Whole-`src/main/java` grep for `@PostMapping("/{id}/(approve|reject|submit...)")` confirms
the org-unit removal did not touch any other approval flow:

- `port/controller/PortController.java:111,122` (approve/reject) — intact
- `port/controller/PierController.java:101,112` — intact
- `port/controller/BerthController.java:111,122` — intact
- `port/controller/WaterZoneController.java:83,94` — intact
- `port/controller/DryPortController.java:114,125` — intact
- `user/service/ApprovalService.java:42` — intact
- Also intact: navigationchannel (`/approve/c1`, `/approve/c2`), vtssystem, shiprepairfacility,
  radarstation, station (lighthouse/buoy/coastal*), beacon, assetmovement (inventory/report/plan),
  datasharing, gis, statistics `FormApprovalController`.
- `PermissionSeeder` still seeds `approvec1`/`approvec2` for shiprepair/radarstation/vts.

---

## 6. Verification — (4) no scope creep within the footprint

- Whole-repo grep `orgunit:approve` → source hits only in
  `frontend/src/store/permissionStore.ts:24` (legacy `org.*` → `orgunit:*` string mapping)
  and `permissionStore.test.ts:91` (test fixture string). Both are **explicitly out of
  footprint** per design §4 KEEP list ("permissionStore legacy `org.approve` mapping …
  stays"). No hits in `src/main/java`, no hits in `constants/permissions.ts`.
- Whole-repo grep `OrgUnitStatus`, `findByStatusAndDeletedAtIsNull`, `approvedAt`
  (org-unit scope) → **0 source hits**. No approval marker leaked outside the footprint.
- **Context (not a defect):** the working tree is uncommitted and mixes several concurrent
  work items (rank TRI-1786936397148-3956, province→id conversion, `@FieldNameConstants`
  adoption, field-level-authorization M-1004, antd static-message M-1003). `git diff HEAD`
  is therefore a *combined* diff; e.g. `OrgUnit.java` also carries the `province →
  provinceId` rename and the `status`→`rank` replacement from the rank work item, and
  `OrgUnitSchemaMigrator.java` gains a `rank` column line. This interleaving matches the
  recorded gotcha `m001-f003-orgunit-province-rank-conflict`. None of these co-changes
  reintroduce any approval-flow marker, and the approval-removal portion of each file is
  exactly scoped.

---

## 7. Reproduced verification (this session)

| Command | Result |
|---|---|
| `mvn -q clean compile -DskipTests` (backend) | **exit 0** — no broken `OrgUnitStatus` references |
| `mvn -q test -Dtest=OrganizationServiceTest` | **exit 0** — passes after `ApprovalWorkflowTests` removal |
| `npm run build` (`vite build`, frontend) | **exit 0** — `✓ built in 904ms`; only a pre-existing chunk-size warning |

---

## 8. Non-blocking observations

1. **Stale `UnitHistory` javadoc** — `UnitHistory.java:13` and `:36` still list
   `APPROVE/REJECT` / `APPROVED/REJECTED` in the action documentation. The design (§3/§4)
   explicitly kept `UnitHistory` *untouched* and no code writes those actions anymore
   (`action` is a free-form `String`). Cosmetic only; consistent with the work order's
   "entity untouched" instruction.
2. **Historical reviewer artifact** — `_features/F-003-quan-ly-don-vi/code-review/01-review-report.md`
   still contains approval-era content (BR-015, `orgunit:approve`, `OrgUnitStatus`). It is
   not in the §8 doc footprint (WO-D1..D5) and predates this TRI; out of scope.
3. **Working-tree attribution ambiguity** — because nothing is committed and multiple TRIs
   share the same files, per-TRI line attribution via git is not cleanly separable. The end
   state (no approval markers, KEEP items present) is what this review certifies.

None of these block the removal.

---

## 9. Conclusion

All four acceptance criteria are met with anchored evidence and reproduced gates:
full removal (no residual markers), KEEP list intact, other entities' approval flows
untouched, and no scope creep attributable to this change. No blocking finding survives
reproduction.

**Verdict: Pass (high confidence).**
