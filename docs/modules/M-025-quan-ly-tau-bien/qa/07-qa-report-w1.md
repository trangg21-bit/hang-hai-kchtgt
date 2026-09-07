# M-025 / F-300 QA Report — Wave 1: Acceptance Oracle Authoring (AC-025-01..05)

| Field | Value |
|---|---|
| Module | M-025 — Quản lý tàu biển (Sổ tàu biển ra, vào cảng biển) |
| Feature | F-300 — Tàu biển ra vào cảng biển |
| Stage / wave | engineering-qa-engineer — wave 1 (acceptance authoring) |
| Date | 2026-09-06 |
| Source of truth | `ba/00-lean-spec.md` §9 (AC-025-01..05, lines 171-175), §5-§7; `design/00-design-plan.md` §3-§10/§12 (SA-finalized contract); `_features/F-300-tau-bien-ra-vao-cang-bien/feature-brief.md` §2 (field matrix, lines 24-95), §4.4 (permissions) |
| Contract under test | Entity `ShipPortCall` / table `ship_port_call` / package `com.hanghai.kchtg.shipportcall`; `GET|POST /api/v1/ship-port-call`; permissions `shipportcall:read` \| `shipportcall:create`; migration `V20260906120000__create_ship_port_call.sql`; work orders WO-1 (backend) / WO-2 (frontend); UNRESOLVED disposition U-1..U-6 |
| Naming convention | EN for every technical identifier (entity, table, columns, DTO fields, API, package, FE keys); VI có dấu for every user-facing message/label |
| Battery executed this wave | **None — implementation does not exist yet. Wave 1 authors the oracle only; NO build/test command was executed (authoring seat per brief).** |

## 1. Status & scope

- The implementation (WO-1 backend, WO-2 frontend) does **not** exist in the workspace yet. This document is the executable acceptance oracle that QA wave 2 runs against the delivered code. Wave-1 Pass does not require a green implementation.
- SA-finalized contract that the oracle grades (deviations are defects): `design/00-design-plan.md` §1 naming, §4 field contract (rows 1-52 of the feature-brief §2 matrix), §5 migration, §6 API, §7 permissions, §8 FE design, §10 UNRESOLVED disposition, §12 WO-1/WO-2 done oracles.
- **Contract-consistency watch items** (BA-proposal vs SA-final drift that wave 2 must not confuse): feature-brief §6/§4.4 propose `/api/ship-port-call` and `ship-port-call:read|create` (kebab); SA finalized `/api/v1/ship-port-call` and `shipportcall:read|create`. The oracle grades the **SA-finalized** strings everywhere — implementation, `PermissionSeeder.java`, `@PreAuthorize`, FE permission store. Mixed resource strings between `read` and `create` (or kebab in one place, camel in another) = defect.

## 2. Coverage map (AC → oracle → seam)

| AC (lean-spec §9) | Oracle IDs | Oracle summary | Runnable where |
|---|---|---|---|
| AC-025-01 list within DataScope; Cục/Admin full; error → 403 or correctly-empty | S-01, S-02, B-01, B-02, P-R | Entity `@Filter(orgUnitFilter)` + controller `@DataScope` present; unit user sees own subtree only, sibling org never leaks; Cục (`orgunit:scope_all`/admin bypass) sees all; out-of-scope `orgUnitId` param → empty page, no leak | S-*: local static; B-*: staged env |
| AC-025-02 create persists row with `orgUnitId` = chosen unit, NOT NULL | S-03, S-04, B-03, B-04, P-C | Migration `org_unit_id UUID NOT NULL`; POST in-scope → 2xx + persisted non-null `org_unit_id`; missing `orgUnitId` → 400 VN msg, no row; hidden/UNRESOLVED fields not settable | S-*: local static; B-*: staged env |
| AC-025-03 filters (orgUnit tree, reportDate, arrivalDate, departureDate) | S-05, B-05, B-06 | GET params + service Specification; each single filter and combined filters return exactly the seeded matching rows; date `from=to` inclusive; out-of-scope org filter → empty | S-*: local static; B-*: staged env |
| AC-025-04 text inputs `.trim()` before submit/API | S-06, B-07 | FE submit trims every text field; service also trims (defense in depth); stored value has no leading/trailing whitespace; internal spaces preserved | S-*: local static; B-*: staged env |
| AC-025-05 out-of-scope orgUnit rejected (OrgUnitScopeService) | S-07, B-08 | POST with orgUnit outside caller scope → 403 VN message, row count unchanged | S-*: local static; B-*: staged env |
| Permission gating (brief §4.4 + lean-spec §7) | P-R, P-C, P-A, S-08 | No `shipportcall:read` → GET 403 + FE menu/leaf hidden; no `shipportcall:create` → POST 403 + «Thêm mới» hidden + submit gated; Admin Cục full scope + audit metadata | S-*: local static; B-*: staged env |
| Naming / quality gates (cross-cutting) | NG-01..NG-05, U-1..U-6 | EN identifiers; VI messages; enum ORDINAL only for island_route/dangerous_goods; open vocabularies VARCHAR; `@FieldNameConstants`; FE tokens/no hex; shared list-view components; no StatusTabs; no drawer | local static |
| UNRESOLVED disposition checkpoints | U-1..U-6 | passenger columns nullable + excluded from DTO/form; `status` excluded entity/table/DTO/form; open vocabularies VARCHAR; no invented report-code rule; no PUT/DELETE/detail; required-set minimal | local static |

Legend: **S** = static code/migration checks (pipeline-runnable at wave 2 via typed read/grep, no server); **B** = black-box HTTP+DB behavior checks (require a live backend — staged/UAT env only, per project rule "KHÔNG TỰ Ý CHẠY BACKEND"); **P** = permission behavior; **NG/U** = naming/quality/disposition gates.

## 3. Test cases

### 3.1 Static code oracles — pipeline-runnable at wave 2 (no server)

Implementation files expected from WO-1/WO-2 (paths per design plan §3.1, §8.1):
`src/main/java/com/hanghai/kchtg/shipportcall/entity/ShipPortCall.java`, `…/repository/ShipPortCallRepository.java`, `…/service/ShipPortCallService.java`, `…/controller/ShipPortCallController.java`, `…/dto/ShipPortCallCreateRequest.java`, `…/dto/ShipPortCallResponse.java`, `src/main/resources/db/migration/V20260906120000__create_ship_port_call.sql`, `src/main/java/com/hanghai/kchtg/config/PermissionSeeder.java` (edited), `frontend/src/pages/shipportcall/ShipPortCallPage.tsx`, `frontend/src/types/shipPortCall.ts`, `frontend/src/services/shipPortCallService.ts`, `frontend/src/config/navigation.tsx` or equivalent route config (edited).

| ID | AC | Given | When (wave-2 action) | Then (exact expected result) |
|---|---|---|---|---|
| S-01 | AC-025-01 | `ShipPortCall.java` exists | Read/grep the entity class declaration | Class-level annotation `@Filter(name = "orgUnitFilter", …)` present (org-unit data scoping per AGENTS.md Data Scope Convention); class `extends BaseEntity` (audit + `@SQLRestriction("deleted_at IS NULL")`); Lombok `@FieldNameConstants` present; no `@OneToMany`, no lifecycle callbacks beyond base |
| S-02 | AC-025-01 | `ShipPortCallController.java` exists | Read/grep the controller | Class-level `@DataScope` present (activates the orgUnit Hibernate filter — without it the filter is a no-op); repository extends `JpaRepository<ShipPortCall, UUID> + JpaSpecificationExecutor<ShipPortCall>` |
| S-03 | AC-025-02 | Migration file exists | Grep `V20260906120000__create_ship_port_call.sql` | `CREATE TABLE IF NOT EXISTS public.ship_port_call` with `id UUID PRIMARY KEY`, **`org_unit_id UUID NOT NULL`** (exact NOT NULL), audit columns `created_at/created_by/updated_at/updated_by/deleted_at/deleted_by`, indexes `idx_ship_port_call_org_unit`, `idx_ship_port_call_org_unit_created`, `idx_ship_port_call_report_date`; **no `status` column** (U-2) |
| S-04 | AC-025-02 | `ShipPortCallCreateRequest.java` exists | Read/grep DTO fields | Exactly the **45** feature-brief §2 rows marked Tạo mới ✓ (rows 1, 2, 7-34, 37-51): i.e. `orgUnitId` (`@NotNull`), `reportDate` (`@NotNull`), `shipName`, `callSign`, `imoNumber`, `nationality`, `shipType`, `length`, `draftArrivalDeparture`, `dwt`, `gt`, `airDraftActual`, `exportTons/exportTeus/exportEmptyTeus`, `importTons/importTeus/importEmptyTeus`, `domesticInTons/domesticInTeus/domesticInEmptyTeus`, `domesticOutTons/domesticOutTeus/domesticOutEmptyTeus`, `transshipmentTons/transshipmentTeus`, `transitHandlingTons/transitHandlingTeus`, `transitNoHandlingTons/transitNoHandlingTeus`, `cargoGroup/cargoType/cargoName`, `lastPortOfCall`, `arrivalPortName/arrivalPortCode`, `departurePortName/departurePortCode`, `destinationPort`, `arrivalDate/departureDate`, `islandRoute/dangerousGoods`, `shipAgent`, `enterpriseCode`; **absent**: `passengersArrival`, `passengersDeparture` (U-1), `reportCode/reportName/reportPeriod` (list-only), `status` (U-2) |
| S-05 | AC-025-03 | Controller + service exist | Read/grep GET signature + Specification | GET `/api/v1/ship-port-call` accepts `page` (0-based), `size`, optional `orgUnitId` (UUID), `reportDateFrom/reportDateTo`, `arrivalDateFrom/arrivalDateTo`, `departureDateFrom/departureDateTo` (ISO `yyyy-MM-dd`); service builds one Specification combining org-unit scope + each date range; default sort `created_at DESC` |
| S-06 | AC-025-04 | Service + FE page exist | Grep create path both layers | Backend `ShipPortCallService.create` trims every string field before persist; FE `ShipPortCallPage.tsx` create-submit applies `.trim()` to every text input (`shipName`, `callSign`, `imoNumber`, `cargoName`, port names, `shipAgent`, `enterpriseCode`, …) before sending |
| S-07 | AC-025-05 | Service exists | Grep create method | Out-of-scope validation calls `OrgUnitScopeService` (scope allow check) before persist; rejection raises 403 with VI diacritic message (design §3.2: «Đơn vị báo cáo ngoài phạm vi cho phép»); no fallback assignment to caller's own unit |
| S-08 | AC-025-05/P | Controller + PermissionSeeder exist | Grep annotations + seeder | `@PreAuthorize("@auth.check(authentication, 'shipportcall:read')")` on GET list method and `'shipportcall:create'` on POST method (same camel resource string both actions); `PermissionSeeder.java` `run()` contains `seedPermission(definitions, "shipportcall", "read")` and `seedPermission(definitions, "shipportcall", "create")` — without the seed, `@PreAuthorize` yields 403 for every non-admin user |
| P-R | AC-025-01 | FE config exists | Grep route/menu + permission store | Route leaf registered under the module's NAV group with `canAccessMenu`/`usePermissionStore` gated on `shipportcall:read`; page hidden when permission absent (no orphan route reachable by URL) |
| P-C | AC-025-02 | FE page exists | Grep the page's action area | «Thêm mới» (ScreenHeader primary action) rendered only when `shipportcall:create`; create-submit handler also gated (not only button-hiding) |
| P-A | AC-025-01/§4.4 | Response DTO exists | Grep `ShipPortCallResponse.java` | Response carries `orgUnitId` + `orgUnitName` (mapped via `OrgUnitCacheService`, never per-row queries and never frontend ID→name API calls) + audit metadata (`createdBy`, `createdAt`, `updatedBy`, `updatedAt`) for Admin Cục visibility |

### 3.2 Black-box behavior oracles — staged/UAT env only (live backend; DB assertions)

Every case below is **not** pipeline-runnable (project rule forbids starting the backend server). Each names its seeded precondition, the HTTP action, and the exact checkable expectation including a DB assertion — no status-code-only verdicts. Wave 2 executes these in a staged environment and records evidence per case, or reports the case as environment-blocked with its exact command so an operator can run it.

Test data precondition (shared): org units `A` (Cảng vụ), `A1` (child of A), `B` (sibling org). Accounts: `usrA` ∈ A with `shipportcall:read+create`; `usrA1` ∈ A1 with both; `usrNoRead` with other perms only; `usrNoCreate` with `shipportcall:read` only; `usrAdminCuc` = Admin Cục. Seeded rows: `r1` (org A, reportDate 2026-08-01, arrivalDate 2026-08-02, departureDate 2026-08-03), `r2` (org A1, reportDate 2026-08-15, arrivalDate 2026-08-16, departureDate 2026-08-17), `r3` (org B, reportDate 2026-09-01, arrivalDate 2026-09-02, departureDate 2026-09-03).

| ID | AC | Given | When | Then (exact expected result) |
|---|---|---|---|---|
| B-01 | AC-025-01 | r1(A), r2(A1), r3(B) seeded | `usrA` GETs `/api/v1/ship-port-call` (no filter params) | HTTP 200; `content` contains exactly r1 + r2 (A subtree incl. child A1); **r3 never appears**; assert by sweeping pages until `totalElements` exhausted — 0 rows of org B in every page; `totalElements == 2` |
| B-02 | AC-025-01 | same seed | `usrAdminCuc` GETs same endpoint | 200; sees r1 + r2 + r3 (full scope via `orgunit:scope_all`/admin bypass); response rows carry audit metadata (createdBy/createdAt visible) |
| B-02b | AC-025-01 | same seed | `usrA1` GETs with `orgUnitId=A` (ancestor, out of A1 scope) | 200 with **empty** `content` (correctly empty per scope, never org-A data leaked to a child-scope caller) — the «403 hoặc rỗng đúng phạm vi» clause of AC-025-01 |
| B-03 | AC-025-02 | `usrA` authenticated | POST `/api/v1/ship-port-call` full valid payload (45 fields), `orgUnitId=A`, `reportDate=2026-09-05`, text fields with normal values | 2xx success + VI message «Tạo mới bản ghi tàu biển thành công»; **DB assert**: exactly 1 new row in `ship_port_call` with `org_unit_id == A` (NOT NULL), `created_by == usrA.id`, timestamps populated; response body `orgUnitName == "A"` display name |
| B-04 | AC-025-02 | `usrA` authenticated | POST with `orgUnitId` **missing** (and/or `reportDate` missing) | HTTP 400 with VI diacritic validation message; **DB assert**: row count unchanged (0 new rows) |
| B-04b | AC-025-02 | `usrA` authenticated | POST body includes keys `passengersArrival`, `passengersDeparture`, or `status` | Request DTO does not declare these keys — they are ignored/not persisted (assert DB row has NULL passengers columns and **no status column exists**); no invented status value stored |
| B-05 | AC-025-03 | full seed | `usrA` GETs with `reportDateFrom=2026-08-01&reportDateTo=2026-08-31` | 200; content = r1 + r2 only; boundary case `reportDateFrom=2026-08-01&reportDateTo=2026-08-01` returns exactly r1 (inclusive both ends) |
| B-05b | AC-025-03 | full seed | `usrA` GETs with `arrivalDateFrom=2026-08-16&arrivalDateTo=2026-08-16` | 200; content = r2 only (arrival filter independent of departure — r1 arrival 08-02 excluded, r3 arrival 09-02 excluded) |
| B-05c | AC-025-03 | full seed | `usrA` GETs with `departureDateFrom=2026-09-01&departureDateTo=2026-09-30&orgUnitId=A1` | 200; content = **empty** (r3 is org B: out of A1 scope and never leakable via date filter combination); no cross-org row surfaces |
| B-06 | AC-025-03 | full seed | `usrA` GETs with `orgUnitId=A1` (in-scope child filter) | 200; content = r2 only (tree filter narrows to the selected subtree node) |
| B-07 | AC-025-04 | `usrA` authenticated | POST payload `shipName:"  Tàu  Hải Phòng "`, `callSign:"  XV-123  "`, `cargoName:" Hàng   rời "` | 2xx; **DB assert**: stored `ship_name == "Tàu  Hải Phòng"`, `call_sign == "XV-123"`, `cargo_name == "Hàng   rời"` — leading/trailing whitespace removed, **internal runs of spaces preserved** (trim is not collapse) |
| B-08 | AC-025-05 | `usrA` authenticated (scope = A subtree) | POST valid payload with `orgUnitId=B` (outside scope) | HTTP 403 with VI diacritic message («Đơn vị báo cáo ngoài phạm vi cho phép» or equivalent VN message); **DB assert**: row count unchanged; response body contains no row data |
| P-R-B | permission read | `usrNoRead` (no `shipportcall:read`) authenticated | GETs `/api/v1/ship-port-call` | HTTP 403; no list payload in response body (empty body/error envelope only) |
| P-C-B | permission create | `usrNoCreate` (read only) authenticated | POSTs valid in-scope payload | HTTP 403; **DB assert**: row count unchanged |

## 4. Naming / quality gates (pipeline-runnable static checks)

| ID | Gate | Exact checkable expectation |
|---|---|---|
| NG-01 | EN identifiers | Entity/table/columns/DTO/package/service keys all strict English snake/camel per design §1: `ShipPortCall`, `ship_port_call`, `org_unit_id`, `report_date`, `com.hanghai.kchtg.shipportcall`, `/api/v1/ship-port-call` (with `v1` — SA-final, NOT the BA-proposed `/api/ship-port-call`); FE route `/ship-port-call`; zero transliterated-Vietnamese identifiers (`phe-duyet`-style) anywhere in the new files |
| NG-02 | VI user-facing messages | All FE toasts/validation text and BE error messages in Vietnamese **with diacritics** («Tạo mới bản ghi tàu biển thành công», «Đơn vị báo cáo ngoài phạm vi cho phép»); no English or non-diacritic user text in the page/service |
| NG-03 | Enum storage | Only `island_route` and `dangerous_goods` are binary enums stored `@Enumerated(EnumType.ORDINAL)` → migration columns `SMALLINT`; `nationality`, `ship_type`, `cargo_group`, `cargo_type`, `enterprise_code` are **open vocabularies stored VARCHAR** (no invented Java enum for them — U-3) |
| NG-04 | `@FieldNameConstants` | Lombok `@FieldNameConstants` on `ShipPortCall` entity and DTOs; no hardcoded property-name strings (`"orgUnitId"`, `"reportDate"`) in service/specification code |
| NG-05 | FE conventions | Page imports shared components from `frontend/src/components/list-view/` (`ScreenHeader`, `FilterTableLayout`, `DataTable`, `Pagination`); **no `StatusTabs`** import/usage (module has no status flow); no detail drawer/edit — create is a modal on the list page; org-unit filter is a tree control (`OrgUnitTreeSelect`) keeping `orgUnitId` value; date filters use `getRangePickerProps` (`DD/MM/YYYY`, popup class `chk-range-datepicker-popup`); `hideFilterToggle=true`; list columns = `orgUnitName`, `reportDate`, `reportCode`, `reportName`, `reportPeriod`; no hardcoded hex colors, spacing, or font-size (all from `theme.ts`/`tokens.ts` presets: `spaceFormField`, `radiusPill`, `height: 40`, semantic tokens); empty/loading/error/data states handled; orgUnitName taken from response, never mapped client-side |
| NG-06 | Field parity | Migration/entity columns == matrix rows 1-51 (50 business columns + audit); `transshipment`/`transit` groups have exactly **2** fields (Tons, Teus) — no `*EmptyTeus` variants for them, while export/import/domestic groups have 3 (Tons, Teus, EmptyTeus); no extra invented columns |

## 5. UNRESOLVED disposition checkpoints (U-1..U-6 → implemented v1 default)

| U-ID | Disposition (design §10) | Checkable oracle at wave 2 |
|---|---|---|
| U-1 | `passengers_arrival` / `passengers_departure` — keep in entity+migration but **nullable** (`INTEGER NULL`), excluded from `ShipPortCallCreateRequest` and the create form (never settable in v1) | Static: present nullable in entity+migration; absent in DTO (S-04) and form |
| U-2 | `status` — **excluded entirely** (no column, no field, no enum, no form control) | Static: no `status` in migration (S-03), entity, DTOs, FE types/form; no invented status enum anywhere in the new files |
| U-3 | Open vocabularies (`nationality`, `ship_type`, `cargo_group`, `cargo_type`, `enterprise_code`) — VARCHAR columns, plain text/select over data, no enum-int | Static: migration column types VARCHAR (NG-03) |
| U-4 | `report_code` — nullable, list-only display, **no auto-generation rule invented** (lean-spec U-4: no invented report-code rule) | Static: `reportCode` nullable, absent from create DTO/form (S-04); no generator service/annotation in code |
| U-5 | No edit/delete/detail lifecycle in v1 | Static: controller exposes only GET + POST (no PUT/DELETE/`/{id}` detail endpoint); FE has no row-actions drawer/edit route; no soft-delete or history wiring |
| U-6 | Required set minimal — `orgUnitId` + `reportDate` `@NotNull` (recommended); DB `org_unit_id` NOT NULL | Static: `@NotNull` on both DTO fields (S-04) + migration NOT NULL (S-03) |

## 6. Wave-2 execution plan and exact verification commands

QA wave 2 runs, in order (implementation must exist first; **nothing here was executed in wave 1**):

1. **Backend compile gate** (workspace root `/Users/thuytrang/workspace/hang-hai-kchtgt`) — compile-only, no backend server started (project rule):
   ```
   mvn -q -DskipTests compile
   ```
   Exit 0 required. This is the backend typecheck/build surface of this Maven project (Java). Failure evidence → finding with the compiler anchor, never a self-fix of source.
2. **Frontend build gate** (in `frontend/`):
   ```
   npm run build
   ```
   Exit 0 required. Vite build also catches the re-export/token resolution class of errors that dev mode hides (AGENTS.md Vite note).
3. **Static oracle battery** — every S-*/P-*/NG-*/U-* row above executed via typed read/grep with the exact expected literal listed in the "Then" column; each check records file path + matched line (presence) or the searched pattern + zero-match (absence).
4. **Black-box oracles** (B-*, P-R-B, P-C-B) — staged/UAT environment only: live backend + seeded org units/roles per §3.2 precondition; evidence per case = HTTP status + response body + DB row-count/value assertion. If no staged env is available at wave 2, each such case is reported **environment-blocked with its exact command**, not silently marked satisfied.
5. Optional supplement (mirrors M-024 wave-2 pattern, only if pipeline allows): materialize a focused Mockito-only unit test of `ShipPortCallService` (trim + out-of-scope rejection with mocked repository/scope service) at `src/test/java/com/hanghai/kchtg/shipportcall/ShipPortCallServiceTest.java` and run `mvn -q -Dtest=ShipPortCallServiceTest test` — service logic only, no Spring context, no server. Do NOT weaken a failing assertion to reach green; record the failure as a finding.

## 7. Coverage notes and honesty record

- **Covered**: AC-025-01..05 each map to ≥1 pipeline-runnable static oracle **plus** ≥1 discriminating black-box oracle with DB-level assertions (no status-code-only verdicts); permission gating (read/create/Admin Cục), naming/quality gates, and all six UNRESOLVED dispositions have concrete checkable expectations.
- **Not executed this wave**: no build, no test, no static grep battery — implementation absent (wave-1 authoring scope). Every oracle above was written from the SA-finalized design contract + lean-spec §9 text, so wave-2 execution is non-tautological: it grades code that does not exist yet.
- **Environment gap (known, owned by operator)**: AC-025-01/02/03/05 behavior can only be proven against a live backend; the pipeline's wave-2 battery (compile + build + static) proves annotations, wiring, types, and message text but **cannot** prove row-scoping, persistence, or rejection behavior. Wave-2 Pass on local battery therefore cannot claim those ACs verified end-to-end without the staged B-* evidence — the wave-2 report must say which it actually ran.
- **Contract drift to enforce**: `/api/v1/ship-port-call` + `shipportcall:*` (SA-final) supersede the BA-proposed `/api/ship-port-call` + `ship-port-call:*`; a mixed implementation is a defect, not a style choice (NG-01/S-08).

## 8. Delivered artifacts

- `docs/modules/M-025-quan-ly-tau-bien/qa/07-qa-report-w1.md` (this report — wave-1 acceptance oracle; sole artifact of this wave)
