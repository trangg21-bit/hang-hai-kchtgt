# Design plan — M-025 / F-300 «Tàu biển ra vào cảng biển» (ShipPortCall register)

- **Module / Feature**: M-025 `quan-ly-tau-bien` / F-300 `tau-bien-ra-vao-cang-bien` — C3 full pipeline, risk M.
- **Triage**: `docs/intel/_intake/TRI-1788530594991-35ed.json` (change_class C3, scope_expansion; `edit_target_files` propose a `Vessel`/`vessel`/`/api/v1/vessels` contract; verification commands `mvn -DskipTests compile` + `npm run build` in `frontend/`).
- **Write boundary**: ONLY this design plan. All BA docs, triage, source code under `src/main/java/**` and `frontend/**` are read-only references for this seat (verified this session — no edits made). M-017 / M-028 / M-1025 / M-1038 docs untouched.
- **One-way door (schema)**: ONE new additive migration creating table `ship_port_call`. No edits to any existing migration. No backfill needed (brand-new entity, no legacy rows).

---

## 1. Naming decision — SA-finalized (reconciles triage `vessel` vs BA `ShipPortCall`)

Per AGENTS.md the lean-spec + feature-brief are the business source of truth; the triage `Vessel` shorthand is an intake guess that contradicts the settled domain (lean-spec §4.1: one row = **one port call**, not a vessel master). SA finalizes on the BA model:

| Concern | Value | Note |
|---|---|---|
| Entity class | `ShipPortCall` | `com.hanghai.kchtg.shipportcall.entity.ShipPortCall` |
| Table | `ship_port_call` | snake_case, singular |
| Java package | `com.hanghai.kchtg.shipportcall` (sub: `entity/ dto/ repository/ service/ controller/`) | mirrors `navigationchannel` package convention (entity `NavigationChannel` → package `navigationchannel`) |
| REST endpoint | `/api/v1/ship-port-call` | mirrors `/api/v1/navigation-channel` style (kebab) |
| Permission codes | `shipportcall:read`, `shipportcall:create` | **dashless resource token** — BA §4.4 wrote `ship-port-call:read` as the *domain label*; the executable permission code must match the existing seeder/@PreAuthorize convention where the resource token is a single lowercase word (`navigationchannel:create`, `PermissionSeeder.java:491-507`, `@auth.check(authentication, 'navigationchannel:history')` in `NavigationChannelController.java`). Documented reconciliation — BA label → technical code `shipportcall` |
| Migration file | `src/main/resources/db/migration/V20260906120000__create_ship_port_call.sql` | see §5 for version reasoning |
| Frontend route | `/ship-port-call` | leaf under menu group «Quản lý quy hoạch & vận hành» (`frontend/src/config/navigation.tsx`, group block around line 174-188) |
| Frontend files | `frontend/src/pages/shipportcall/ShipPortCallPage.tsx`, `frontend/src/types/shipPortCall.ts`, `frontend/src/services/shipPortCallService.ts` | mirrors `navigationchannel` page / `shipRepairFacilityService.ts` conventions |

All technical identifiers are standard English (AGENTS.md naming rules); all user-visible labels are Vietnamese with diacritics.

---

## 2. Verified current seam (anchors opened this session)

| Seam | Anchor | What it proves |
|---|---|---|
| Base audit entity | `common/entity/BaseEntity.java:29,34,42,49,56,61-69,76-85` | `@SQLRestriction("deleted_at IS NULL")`, abstract `BaseEntity`, `id` UUID, `createdAt/updatedAt` (`created_at/updated_at` via physical naming), explicit `deleted_at`, `deleted_by`, `created_by`, `updated_by`; `@FilterDef(name="orgUnitFilter")` lives here (AGENTS.md Data Scope Convention) |
| OrgUnit filter on entity | `navigationchannel/entity/NavigationChannel.java:28` | `@Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")` class-level — the pattern ShipPortCall must copy |
| Controller scope gate | `vtssystem/controller/VtsSystemController.java:37`; `document/controller/IncidentController.java:26-29` | class-level `@DataScope` activates the Hibernate orgUnitFilter |
| Permission check strings | `NavigationChannelController.java` (`@auth.check(authentication, 'navigationchannel:…')`); `config/PermissionSeeder.java:491-507` (resource blocks), `:1027` (`private void seedPermission(Map<String, Permission> definitions, String resource, String action, String name, …)`) | exact call shape for `seedPermission(definitions, "shipportcall", "read", "…", "…")` |
| Write-side scope validation | AGENTS.md Data Scope Convention + `orgunit/service/OrgUnitScopeService.java` (`Scope.allows(...)`; usage pattern `UserGroupService.java:78` style `requireOrganizationInScope`) | orgUnitId of a new record MUST be validated in the user's scope |
| OrgUnit display mapping | `orgunit/service/OrgUnitCacheService.java:25,62` (`evictAfterCommit`); directory cache loads full active `Map<UUID, String>` | response assembly uses cache; no per-row unit queries |
| DDL conventions | `src/main/resources/db/migration/V20260905110000__x_port_planning_update.sql:118-131` | `id UUID PRIMARY KEY`, `CREATE INDEX IF NOT EXISTS idx_<table>_org_unit(_created)` pattern |
| Newest applied migration | glob `V202609*.sql` → max `V20260905110000__x_port_planning_update.sql` | new migration version MUST sort after it (Flyway default rejects out-of-order) |
| Paged response envelope | `frontend/src/services/resilient.ts:8,37,52,80` | FE parser accepts Spring Page `{ content, totalElements }` (and direct arrays) |
| FE list-page pattern | `frontend/src/pages/document/OperationList.tsx:1-40` | imports `ScreenHeader/FilterTableLayout/DataTable` + `Pagination` from `components/list-view`, `FilterOrgUnitTreeSelect/FormOrgUnitTreeSelect` from `components/org-unit`, tokens from `tokens.ts`, `getDatePickerProps/DRAWER_TABLE_SCROLL_Y` from `themetokenchk.ts`, `toast`, `usePermissionStore` |
| FE service pattern | `frontend/src/services/shipRepairFacilityService.ts` | `<name>CRUD` object, `api.get('/v1/…')`, `resilient` helpers |
| Menu seam | `frontend/src/config/navigation.tsx:174-188`; `frontend/src/components/AppLayout.tsx:95,284` | «Quản lý quy hoạch & vận hành» group + permission-gated menu rendering (`canAccessMenu`) |
| Cargo-type precedent | `trade/entity/TradeFlow.java:39`, `report/entity/CargoTransaction.java:31` | existing project stores `cargoType` as free-text `String` — no cargo dictionary enum exists |
| Quantity-column precedent | `V20260803370000__repair_all_schema_types_and_columns.sql:5397` | `…_teus NUMERIC(19,4)` used for cargo aggregates |

---

## 3. Component design

### 3.1 Responsibility split

| Component | File (new unless noted) | Responsibility |
|---|---|---|
| Entity | `shipportcall/entity/ShipPortCall.java` | `@Entity @Table(name="ship_port_call")`, extends `BaseEntity` (`@Getter @Setter @SuperBuilder @NoArgsConstructor @AllArgsConstructor @FieldNameConstants`), class-level `@Filter(orgUnitFilter)`, `org_unit_id` NOT NULL, nested binary enums `IslandRoute`, `DangerousGoods` (`@Enumerated(EnumType.ORDINAL)`), no lifecycle callbacks beyond base |
| Repository | `shipportcall/repository/ShipPortCallRepository.java` | `JpaRepository<ShipPortCall, UUID> + JpaSpecificationExecutor<ShipPortCall>` (list filters via Specifications) |
| Service | `shipportcall/service/ShipPortCallService.java` | paged `list(filters)` (Specification: orgUnitId + date ranges, default `created_at DESC`); `create(request, userId)` — trim, scope-validate, persist; DTO↔entity mapping incl. `orgUnitName` via `OrgUnitCacheService` |
| Controller | `shipportcall/controller/ShipPortCallController.java` | `@RestController @RequestMapping("/api/v1/ship-port-call")`, class-level `@DataScope`, `@PreAuthorize` per action, `ApiResponse<T>` wrapper (`common/dto/ApiResponse`) |
| DTOs | `shipportcall/dto/ShipPortCallCreateRequest.java`, `ShipPortCallResponse.java` | Lombok `@Getter @Setter` (+ `@NoArgsConstructor/@AllArgsConstructor` as needed); `CreateRequest` excludes hidden/derived fields; `Response` includes `orgUnitId` + `orgUnitName` |
| Migration | `src/main/resources/db/migration/V20260906120000__create_ship_port_call.sql` | CREATE TABLE + indexes (§5) |
| Permission seed | `config/PermissionSeeder.java` (**edit**) | +2 `seedPermission(...)` lines in `run()` |
| Frontend page | `frontend/src/pages/shipportcall/ShipPortCallPage.tsx` (new) | list screen (§8) |
| Frontend type/service | `frontend/src/types/shipPortCall.ts`, `frontend/src/services/shipPortCallService.ts` (new) | typed API client |

### 3.2 Data flow (create)

1. FE popup form validates (orgUnitId required + in-scope tree, reportDate required) and `.trim()`s every text input before submit.
2. `POST /api/v1/ship-port-call` with `ShipPortCallCreateRequest` (JSON, English field names).
3. Controller `@PreAuthorize("@auth.check(authentication, 'shipportcall:create')")` → 403 if absent.
4. Service: trim strings → validate `orgUnitId` non-null and inside `OrgUnitScopeService` scope (`Scope.allows(...)` / `requireOrganizationInScope` pattern); reject out-of-scope unit (error 403/400 with Vietnamese message «Đơn vị báo cáo ngoài phạm vi cho phép»).
5. Persist with `createdBy = currentUserId` (audit via BaseEntity/AuditingEntityListener). No org-unit cache eviction needed (record create does not change the org-unit directory).
6. Respond with `ShipPortCallResponse` (includes `orgUnitName` from `OrgUnitCacheService`).

### 3.3 Data flow (list)

`GET /api/v1/ship-port-call?page=&size=&orgUnitId=&reportDateFrom=&reportDateTo=&arrivalDateFrom=&arrivalDateTo=&departureDateFrom=&departureDateTo=` → `@PreAuthorize("@auth.check(authentication, 'shipportcall:read')")`, class `@DataScope` narrows rows to the user's unit subtree (Cục/Admin full). Returns Spring `Page<ShipPortCallResponse>` serialization `{ content, totalElements, … }` inside `ApiResponse` (matches `resilient.ts`). `orgUnitId` param is an additional narrowing filter on top of scope (out-of-scope unit ⇒ empty page, never data leak).

### 3.4 Invariants / security

- `org_unit_id` is NEVER NULL (mandated); assigned from request and validated against the caller's scope.
- No update / delete / detail endpoints in v1 (Excel: Sửa/Xem chi tiết = false — feature-brief §5 row 8). Data correction path is out of scope; flagged (UNRESOLVED-5).
- Every action carries `@PreAuthorize`; no implicit endpoint. Two permissions total.
- Text inputs are trimmed server-side too (defense in depth), not only in FE.

---

## 4. Entity field contract (full mapping from feature-brief §2 = lean-spec §4.2 matrix, rows 1-52)

Naming: column = snake_case of the BA-proposed field name; Java field camelCase. DB types chosen for one-way-door safety (reversible) — see §10 for the fields that deviate from an enum reading.

**Audit columns (from `BaseEntity`, mapped, no extra code)**: `id UUID PK`, `created_at TIMESTAMP`, `created_by UUID`, `updated_at TIMESTAMP`, `updated_by UUID`, `deleted_at TIMESTAMP`, `deleted_by UUID`.

Business columns (50; matrix rows 1-51 except the `status` row — §10.3):

| # | Java field | Column | DB type | Required (DB) | Create form | Notes |
|---|---|---|---|---|---|---|
| 1 | `orgUnitId` | `org_unit_id` | UUID | **NOT NULL** | ✓ (TreeSelect, in-scope) | filter ✓; row identity |
| 2 | `reportDate` | `report_date` | DATE | nullable* | ✓ (DatePicker) | filter ✓; *recommended required at create (register identity), BA to confirm (§10.1) |
| 3 | `reportCode` | `report_code` | VARCHAR(100) | nullable | — | list-only, «tự sinh/đọc»; no generation rule exists → NULL until decided (§10.4) |
| 4 | `reportName` | `report_name` | VARCHAR(500) | nullable | — | list-only |
| 5 | `reportPeriod` | `report_period` | VARCHAR(50) | nullable | — | list-only |
| 7 | `shipName` | `ship_name` | VARCHAR(255) | nullable* | ✓ Input | *recommended required (§10.1) |
| 8 | `callSign` | `call_sign` | VARCHAR(50) | nullable | ✓ Input | |
| 9 | `imoNumber` | `imo_number` | VARCHAR(50) | nullable | ✓ Input | text (preserves leading zeros) |
| 10 | `nationality` | `nationality` | VARCHAR(100) | nullable | ✓ (§10.2) | Select per Excel; option list absent → VARCHAR v1 |
| 11 | `shipType` | `ship_type` | VARCHAR(255) | nullable | ✓ Input | Excel control = Input Text → VARCHAR (deviation note §10.2) |
| 12 | `length` | `length` | NUMERIC(19,4) | nullable | ✓ InputNumber | meters |
| 13 | `draftArrivalDeparture` | `draft_arrival_departure` | NUMERIC(19,4) | nullable | ✓ InputNumber | |
| 14 | `dwt` | `dwt` | NUMERIC(19,4) | nullable | ✓ InputNumber | |
| 15 | `gt` | `gt` | NUMERIC(19,4) | nullable | ✓ InputNumber | |
| 16 | `airDraftActual` | `air_draft_actual` | NUMERIC(19,4) | nullable | ✓ InputNumber | |
| 17 | `exportTons` | `export_tons` | NUMERIC(19,4) | nullable | ✓ | |
| 18 | `exportTeus` | `export_teus` | NUMERIC(19,4) | nullable | ✓ | |
| 19 | `exportEmptyTeus` | `export_empty_teus` | NUMERIC(19,4) | nullable | ✓ | |
| 20 | `importTons` | `import_tons` | NUMERIC(19,4) | nullable | ✓ | |
| 21 | `importTeus` | `import_teus` | NUMERIC(19,4) | nullable | ✓ | |
| 22 | `importEmptyTeus` | `import_empty_teus` | NUMERIC(19,4) | nullable | ✓ | |
| 23 | `domesticInTons` | `domestic_in_tons` | NUMERIC(19,4) | nullable | ✓ | |
| 24 | `domesticInTeus` | `domestic_in_teus` | NUMERIC(19,4) | nullable | ✓ | |
| 25 | `domesticInEmptyTeus` | `domestic_in_empty_teus` | NUMERIC(19,4) | nullable | ✓ | |
| 26 | `domesticOutTons` | `domestic_out_tons` | NUMERIC(19,4) | nullable | ✓ | |
| 27 | `domesticOutTeus` | `domestic_out_teus` | NUMERIC(19,4) | nullable | ✓ | |
| 28 | `domesticOutEmptyTeus` | `domestic_out_empty_teus` | NUMERIC(19,4) | nullable | ✓ | |
| 29 | `transshipmentTons` | `transshipment_tons` | NUMERIC(19,4) | nullable | ✓ | |
| 30 | `transshipmentTeus` | `transshipment_teus` | NUMERIC(19,4) | nullable | ✓ | no «Teus rỗng» per Excel |
| 31 | `transitHandlingTons` | `transit_handling_tons` | NUMERIC(19,4) | nullable | ✓ | |
| 32 | `transitHandlingTeus` | `transit_handling_teus` | NUMERIC(19,4) | nullable | ✓ | no «Teus rỗng» |
| 33 | `transitNoHandlingTons` | `transit_no_handling_tons` | NUMERIC(19,4) | nullable | ✓ | |
| 34 | `transitNoHandlingTeus` | `transit_no_handling_teus` | NUMERIC(19,4) | nullable | ✓ | |
| 35 | `passengersArrival` | `passengers_arrival` | INTEGER | nullable | **hidden** | 🔴 UNRESOLVED — column kept, form/DTO excluded (§10.1) |
| 36 | `passengersDeparture` | `passengers_departure` | INTEGER | nullable | **hidden** | 🔴 UNRESOLVED — same |
| 37 | `cargoGroup` | `cargo_group` | VARCHAR(255) | nullable | ✓ (§10.2) | Select per Excel; no dictionary → VARCHAR v1 |
| 38 | `cargoType` | `cargo_type` | VARCHAR(255) | nullable | ✓ (§10.2) | matches existing `String cargoType` precedent (`TradeFlow.java:39`) |
| 39 | `cargoName` | `cargo_name` | VARCHAR(500) | nullable | ✓ Input | |
| 40 | `lastPortOfCall` | `last_port_of_call` | VARCHAR(255) | nullable | ✓ Input | «Cảng rời cuối cùng» |
| 41 | `arrivalPortName` | `arrival_port_name` | VARCHAR(255) | nullable | ✓ Input | «Cảng đến (Cảng dỡ hàng)» |
| 42 | `arrivalPortCode` | `arrival_port_code` | VARCHAR(50) | nullable | ✓ Input | |
| 43 | `departurePortName` | `departure_port_name` | VARCHAR(255) | nullable | ✓ Input | «Cảng đi (Cảng xếp hàng)» |
| 44 | `departurePortCode` | `departure_port_code` | VARCHAR(50) | nullable | ✓ Input | |
| 45 | `destinationPort` | `destination_port` | VARCHAR(255) | nullable | ✓ Input | «Cảng đích» |
| 46 | `arrivalDate` | `arrival_date` | DATE | nullable | ✓ DatePicker | filter ✓ |
| 47 | `departureDate` | `departure_date` | DATE | nullable | ✓ DatePicker | filter ✓ |
| 48 | `islandRoute` | `island_route` | SMALLINT | nullable | ✓ Select | enum `IslandRoute { NO, YES }` @Enumerated(ORDINAL) |
| 49 | `dangerousGoods` | `dangerous_goods` | SMALLINT | nullable | ✓ Select | enum `DangerousGoods { NO, YES }` @Enumerated(ORDINAL) |
| 50 | `shipAgent` | `ship_agent` | VARCHAR(255) | nullable | ✓ Input | |
| 51 | `enterpriseCode` | `enterprise_code` | VARCHAR(100) | nullable | ✓ (§10.2) | Excel Select, no option source → text Input v1; Sửa="?" moot (no edit) |
| 52 | `status` | — | — | — | — | **EXCLUDED from v1** — all-false + Sửa="?" (§10.3) |

Entity class notes: `@FieldNameConstants` (Lombok) so code never hardcodes field-name strings; numeric fields `BigDecimal`; date fields `LocalDate`; nested enums declared inside `ShipPortCall` (precedent: nested `TransactionType` in `report/entity/CargoTransaction.java`). No `@OneToMany`, no attachments, no history table (no update/delete lifecycle to audit).

---

## 5. Flyway migration

**File**: `src/main/resources/db/migration/V20260906120000__create_ship_port_call.sql`

Version rationale: triage shorthand proposed `V20260904__create_vessel.sql`, but the repo already contains applied migrations `V20260904100000…` and `V20260905110000…` (verified by glob). Flyway's default out-of-order=false refuses a new migration whose version sorts below an already-applied one on any existing environment → the file version MUST be > `V20260905110000`. Chosen `20260906120000` (today). The name reflects the settled table (`ship_port_call`), not the triage `vessel`.

Contents (new table only; no backfill — brand-new entity):
- `CREATE TABLE IF NOT EXISTS public.ship_port_call ( … )` — columns exactly as §4 (50 business columns + audit), `id UUID PRIMARY KEY`, `org_unit_id UUID NOT NULL`.
- Indexes (mirror `V20260905110000__x_port_planning_update.sql:130-131` naming):
  - `idx_ship_port_call_org_unit ON public.ship_port_call (org_unit_id)`
  - `idx_ship_port_call_org_unit_created ON public.ship_port_call (org_unit_id, created_at DESC)`
  - `idx_ship_port_call_report_date ON public.ship_port_call (report_date)`
- No DB defaults on audit columns required (JPA `AuditingEntityListener` populates); keep style consistent with a recent BaseEntity-derived CREATE TABLE in the migration folder.

Rollback: the migration is additive and the C3 one-way door. Before release, dev rollback = drop table in a scratch DB only; do NOT ship a drop migration.

---

## 6. API contract

| Method | Path | Permission | Params / Body | Returns |
|---|---|---|---|---|
| GET | `/api/v1/ship-port-call` | `shipportcall:read` | `page` (0-based), `size`, `orgUnitId` (UUID, optional), `reportDateFrom/To`, `arrivalDateFrom/To`, `departureDateFrom/To` (ISO `yyyy-MM-dd`), implicit scope filter via `@DataScope` | `ApiResponse<Page<ShipPortCallResponse>>` (Spring Page serialization `{content, totalElements,…}`) |
| POST | `/api/v1/ship-port-call` | `shipportcall:create` | `ShipPortCallCreateRequest` | `ApiResponse<ShipPortCallResponse>` (201-style success, Vietnamese message «Tạo mới bản ghi tàu biển thành công») |

`ShipPortCallCreateRequest` fields = rows marked ✓ Create in §4 (45 fields: orgUnitId…enterpriseCode, minus passengers and status), all strings trimmable, `orgUnitId` `@NotNull`, `reportDate` `@NotNull` (recommended required set), numerics optional. Validation failure → 400 with Vietnamese field messages. Out-of-scope orgUnitId → 403 Vietnamese message. `ShipPortCallResponse` = created/list projection incl. `orgUnitId` + `orgUnitName` (+ audit `createdBy/createdAt` for Admin Cục visibility). Request/response JSON field names = camelCase English.

---

## 7. Permissions

In `config/PermissionSeeder.java` `run()`, add two lines following the block style at `:491-507`:

```java
seedPermission(definitions, "shipportcall", "read",   "Xem sổ tàu biển ra vào cảng biển",
        "Xem danh sách bản ghi tàu biển ra, vào cảng biển trong phạm vi đơn vị");
seedPermission(definitions, "shipportcall", "create", "Thêm mới bản ghi tàu biển ra vào cảng biển",
        "Tạo mới bản ghi tàu biển ra, vào cảng biển");
```

No role assignment (dynamic per-group/account model). Admin Cục (`ROLE_SYSTEM_ADMIN`/`admin:all`) passes all checks; sees audit metadata columns.

---

## 8. Frontend design

### 8.1 Page / files

- `frontend/src/pages/shipportcall/ShipPortCallPage.tsx` — routed at `/ship-port-call`; register/list screen + Tạo mới popup.
- `frontend/src/types/shipPortCall.ts` — `ShipPortCallResponse`, `CreateShipPortCallRequest`, `ListParams` interfaces (English field names).
- `frontend/src/services/shipPortCallService.ts` — `shipPortCallCRUD = { list(params), create(data) }` mirroring `shipRepairFacilityService.ts` (`api.get('/v1/ship-port-call')`, `resilient` helpers).
- Registration edits: `frontend/src/config/navigation.tsx` — add child `{ key: '/ship-port-call', route: '/ship-port-call', label: 'Tàu biển ra vào cảng biển' }` inside the «Quản lý quy hoạch & vận hành» NAV_GROUP children (block near line 181-188, after the `'/documents/operation'` sibling at line 188) + mirror the page-mounting/route registration and `AppLayout.tsx` permission-map/`canAccessMenu` gating used by `/documents/operation` (lines 95/284 pattern) with `shipportcall:read`.

### 8.2 List screen (per `docs/conventions/list-screen-ui-standard.md`)

- Components: `ScreenHeader` (breadcrumb «Quản lý quy hoạch & vận hành / Tàu biển ra vào cảng biển» + primary action «Thêm mới» rendered only when `shipportcall:create`), `FilterTableLayout` + `DataTable` + `Pagination` from `frontend/src/components/list-view/`; **no `StatusTabs`** (no status domain), **no row actions / no detail drawer / no edit** (Excel Sửa/Xem chi tiết = false; §5 row 8).
- Filter sidebar (`hideFilterToggle={true}`, 280px scroll column, bottom = «Reload» + «Tìm kiếm» buttons): `FilterOrgUnitTreeSelect` (org unit tree, value = `orgUnitId`, in-scope options) + three `RangePicker` filters «Ngày báo cáo», «Ngày đến cảng», «Ngày rời cảng» using `getRangePickerProps` from `themetokenchk.ts` (standard popup class, DD/MM/YYYY).
- Columns (List=✓ rows 1-5 only): `orgUnitName`, `reportDate`, `reportCode`, `reportName`, `reportPeriod` — full labels (`label` + generous `width`, no truncation of headers), record text ellipsis w/ tooltip per convention; `orgUnitName` straight from response (OrgUnitCacheService on BE; no client-side id→name calls).
- States: loading / error / empty / data; empty table keeps `--list-table-scroll-y` body height. Scroll restored to 0 after filter reset.
- Tạo mới popup (Modal, `drawerMode === 'create'` pattern, not a routed page): form sections grouped per Excel (Thông tin chung → Thông tin tàu → Hàng hóa Xuất khẩu/Nhập khẩu/Nội địa đến/Nội địa rời/Chuyển tải/Quá cảnh bốc dỡ/Quá cảnh không bốc dỡ → Phân loại hàng → Cảng đi/đến → Ngày tháng → Thông tin khác). Controls: `FormOrgUnitTreeSelect` (unit, required, in-scope), DatePicker `reportDate`, InputNumber for ton/teus groups, Input/Select per §4 create column; every text `.trim()` before submit; `spaceFormField`/`radiusPill`/`height: 40` rules; `selectStyle`/`inputStyle`/`primaryButtonStyle` presets from `tokens.ts`; **no hardcoded hex/spacing/font-size**; toast success/failure in Vietnamese.
- Permissions: list API gated `shipportcall:read`; create button + submit gated `shipportcall:create` (`usePermissionStore`, pattern of `OperationList.tsx`).

---

## 9. Acceptance mapping (lean-spec §9 → oracle)

| Criterion | Design element | Verification oracle |
|---|---|---|
| AC-025-01 list within DataScope; Cục/Admin full | §3.3 `@DataScope` + `shipportcall:read` | BE QA: unit user sees own subtree only; Cục sees full; out-of-scope filter → empty |
| AC-025-02 create stores row with non-null orgUnitId | §3.2 + migration NOT NULL | QA: POST succeeds → row has `org_unit_id` set = chosen unit |
| AC-025-03 filters orgUnit/reportDate/arrivalDate/departureDate correct | §6 GET params + Specification | QA: each filter narrows correctly (boundary: from=to inclusive) |
| AC-025-04 text inputs trimmed | §3.2 server trim + FE trim | QA: `"  Tên tàu  "` persisted as `"Tên tàu"` |
| AC-025-05 out-of-scope unit rejected | §3.2 OrgUnitScopeService | QA: POST with unit outside caller scope → 403, no row |

---

## 10. UNRESOLVED / NEEDS-SA-DECISION disposition

| ID | Field(s) | Excel state | SA decision (v1) | Next action |
|---|---|---|---|---|
| U-1 | `passengersArrival`, `passengersDeparture` | all-false (no list/filter/create) | columns kept nullable (INTEGER), entity fields present but **never settable**: excluded from `ShipPortCallCreateRequest` and the create form | BA/Excel confirm whether passengers belong to this register (M-017/M-020 may feed them later) |
| U-2 | `status` | all-false + Sửa="?" | **excluded from entity AND table v1** — no domain values exist to enumerate; an enum would fabricate values («không tự bịa trạng thái sổ» per BA note). Adding later is an additive migration | BA/SA define real status domain before any schema add |
| U-3 | `nationality`, `ship_type`, `cargo_group`, `cargo_type`, `enterprise_code` | Select ×4, Input Text ×1 (`ship_type`) | stored VARCHAR (reversible), create form renders text Input for v1 — Excel option lists are NOT shipped and no codebase dictionary exists (verified: no Nationality/CargoGroup enums; cargoType precedent is `String`, `TradeFlow.java:39`). This deviates from the §7 enum-int suggestion, which is qualified «(nếu có:)»; an ordinal INT chosen now with an unknown list would corrupt under reordering and is irreversible | BA/Excel supply the option lists (or M-020 F-254 dictionary); then an additive migration + enum conversion in a later change |
| U-4 | `reportCode` | «tự sinh/đọc» w/o format rule | nullable; never auto-generated (no rule to implement); list shows empty until defined | BA/SA define generation rule or drop the column from UI |
| U-5 | delete/correct-wrong-entry | Excel Sửa ✗; no delete row | no update/delete/detail endpoints in v1 (per §5 row 8 «Sửa/Xem chi tiết=false») | BA/SA decide the correction path for a wrong register entry |
| U-6 | required set | Excel «Bắt buộc» column blank | DB NOT NULL only on `org_unit_id` (mandated); recommended create-required: `orgUnitId`, `reportDate`, `shipName` | BA confirms the required set |

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| Parallel `PermissionSeeder.java` edits by other module tasks | backend dev adds only its 2 lines; conflicts resolved by re-merge, no other file overlap |
| Enum-int reversal hazard (U-3) | VARCHAR chosen for all open vocabularies; only closed binary `island_route`/`dangerous_goods` are SMALLINT enums |
| Column `length` (SQL function name in Postgres) | non-reserved, usable unquoted; implementer quotes only if H2 test dialect complains |
| Migration version ordering | `20260906120000` > newest applied `V20260905110000` |
| Large create form (45 fields) drift vs matrix | §4 table is the single checklist for form fields + types; QA oracle checks field parity |

---

## 12. Work orders (disjoint scopes)

### WO-1 — Backend (engineering-backend-developer, wave 1)

Create: `src/main/java/com/hanghai/kchtg/shipportcall/entity/ShipPortCall.java` (nested enums `IslandRoute`, `DangerousGoods`), `dto/ShipPortCallCreateRequest.java`, `dto/ShipPortCallResponse.java`, `repository/ShipPortCallRepository.java`, `service/ShipPortCallService.java`, `controller/ShipPortCallController.java`; migration `src/main/resources/db/migration/V20260906120000__create_ship_port_call.sql`.
Edit (only): `src/main/java/com/hanghai/kchtg/config/PermissionSeeder.java` (append the two `shipportcall` lines in `run()`).
Do NOT touch: any other file; do not run the backend server (compile only).
Verify: from workspace root `JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home mvn -q -DskipTests compile`.
Done oracle: compile passes; `org_unit_id UUID NOT NULL` present in migration; entity has class-level `@Filter(name="orgUnitFilter", …)` + `@FieldNameConstants` + BaseEntity audit; controller class-level `@DataScope` and per-action `@PreAuthorize("@auth.check(authentication, 'shipportcall:read'|'shipportcall:create')")`; create validates orgUnit scope; response carries `orgUnitName`.

### WO-2 — Frontend (engineering-frontend-developer, wave 1)

Create: `frontend/src/pages/shipportcall/ShipPortCallPage.tsx`, `frontend/src/types/shipPortCall.ts`, `frontend/src/services/shipPortCallService.ts`.
Edit (only): `frontend/src/config/navigation.tsx` (menu leaf under «Quản lý quy hoạch & vận hành») + the route/page-mount + permission gating files that currently wire `/documents/operation` (locate by following that route string — registration lives outside `navigation.tsx`; apply the same pattern for `/ship-port-call` with `shipportcall:read`).
Must read first: `frontend/src/theme.ts`, `frontend/src/tokens.ts`, `frontend/src/themetokenchk.ts`, `docs/conventions/list-screen-ui-standard.md`, `frontend/src/components/list-view/*`, `frontend/src/pages/document/OperationList.tsx` (reference), `frontend/src/services/shipRepairFacilityService.ts` (service shape). No hardcoded hex/spacing/font-size; no custom layout/table; no StatusTabs; no detail drawer/edit.
Verify: `cd frontend && npm run build`.
Done oracle: build passes; list loads with orgUnit+3 date-range filters; create popup posts a trimmed 45-field payload and refreshes the list; permission-gated button/menu.

QA (wave 1, separate stage) verifies §9 oracles against the built UI + compile backend — tests live in `src/test/java` and `frontend/src/**/*.test.ts(x)` per project conventions.

---

## 13. Alternatives considered (recorded because they affect future change)

1. **Triage `Vessel` naming** — rejected: domain is a call register (per-ship-row-per-call), not a vessel master; M-020 F-254 owns vessel-master integration. Adopting `Vessel` would mis-name the table and collide with the M-020 domain.
2. **Enum-int for all six §7-note columns** — rejected for open vocabularies (U-3): no option lists, ordinal irreversibility, contradicting Excel control for `ship_type` (Input Text); kept enum-int only for the two closed binary flags.
3. **Including `status` as nullable SMALLINT column** — rejected: a column whose Java enum would require invented constants (U-2); additive later.
4. **Frontend route as its own module folder** `pages/shipportcall/` vs kebab folder — entity-name folder matches the `navigationchannel` precedent.

## References (all opened this session)

lean-spec §4.1-§4.2/§9 (rows 1-52 matrix at `ba/00-lean-spec.md:58-122`); feature-brief §1-§7 (`_features/F-300-…/feature-brief.md`, header UNRESOLVED note); triage `docs/intel/_intake/TRI-1788530594991-35ed.json`; `BaseEntity.java:29-85`; `NavigationChannel.java:28`; `OperationPlan.java:29`; `VtsSystemController.java:37`; `PermissionSeeder.java:491-507,1027`; `V20260905110000__x_port_planning_update.sql:118-131`; `resilient.ts:8-84`; `OperationList.tsx:1-40`; `shipRepairFacilityService.ts`; `navigation.tsx:174-188`; `AppLayout.tsx:95,284`; `TradeFlow.java:39`; `CargoTransaction.java:31`; `V20260803370000__….sql:5397`.
