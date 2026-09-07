# M-025 / F-300 QA Report — Wave 2: Oracle Execution (AC-025-01..05)

| Field | Value |
|---|---|
| Module | M-025 — Quản lý tàu biển (Sổ tàu biển ra, vào cảng biển) |
| Feature | F-300 — Tàu biển ra vào cảng biển |
| Stage / wave | engineering-qa-engineer — wave 2 (oracle execution vs wave-1 oracle `qa/07-qa-report-w1.md`) |
| Date | 2026-09-06 |
| Contract graded | SA-finalized: `ShipPortCall` / `ship_port_call` / `com.hanghai.kchtg.shipportcall` / `/api/v1/ship-port-call` / `shipportcall:read\|create` / `V20260906120000__create_ship_port_call.sql` |
| Verdict | **Pass** — all four mandated battery items green (BE-1 exit 0 via backend-dev seat, Tests run 3/0/0/0; BE-2 exit 0; FE-1 exit 0 5/5; FE-2 exit 0); all 25 static oracle items PASS; QA-BLK-001 closed. Staged B-* behavior oracles remain environment-owned per w1 §6/§7 |

## 1. Battery execution (exact commands, JDK17 pinned)

| # | Command (workdir) | Exit code | Outcome |
|---|---|---|---|
| BE-1 | `env JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home mvn -q -Dtest=ShipPortCallServiceTest verify` (repo root) | **0** | PASS — executed by **backend-dev seat** (task `ses_3c6edd865fe58065d2a661141152d8480bed7ad14f320d6b57a81f65c47cc19a`) this session. Leaf-seat runner channels refused Maven test selection (bash test-target gate: unscoped/opaque; test_runner whitelist bun/vitest/jest/pytest) — a seat-level restriction only, not a defect. Surefire report `target/surefire-reports/com.hanghai.kchtg.shipportcall.ShipPortCallServiceTest.txt` (read directly this session): **Tests run: 3, Failures: 0, Errors: 0, Skipped: 0** (0.662 s). Test class is Mockito-only (no Spring context, no server); asserts AC-025-02 (non-null orgUnitId persist), AC-025-04 (trim), AC-025-05 (out-of-scope `AccessDeniedException` «Đơn vị báo cáo ngoài phạm vi cho phép» + `never().save(...)`). |
| BE-2 | `env JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home mvn -q -DskipTests compile` (repo root) | **0** | PASS — `-q` clean compile, no output, no [ERROR]; backend compiles under JDK17 enforcer. |
| FE-1 | `npx vitest run src/services/shipPortCallService.test.ts` (frontend/) | **0** | PASS — 1 file, **5/5 tests passed** (4ms), v4.1.11. |
| FE-2 | `npm run build` (frontend/) | **0** | PASS — vite v8.2.2, 3529 modules transformed, built in 548ms. |

Backend server **not** launched (constraint honored). No git, no source edits, no `_state.md` touched.

## 2. Oracle item results (wave-1 oracle `07-qa-report-w1.md`)

Legend: PASS = direct evidence anchor (file:line read/grep this session). All static items verified against actual implementation files; no item failed.

### Static code oracles (S-01..S-08)

| ID | AC | Result | Evidence anchor |
|---|---|---|---|
| S-01 | AC-025-01 | PASS | `entity/ShipPortCall.java` — `@Entity @Table(name="ship_port_call")`, `extends BaseEntity`, Lombok `@FieldNameConstants`, class-level `@Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")`; `org_unit_id` `@Column(nullable = false)` (line 48-49) |
| S-02 | AC-025-01 | PASS | `controller/ShipPortCallController.java:33` class-level `@DataScope`; `repository/ShipPortCallRepository.java:15-16` `extends JpaRepository<ShipPortCall, UUID>, JpaSpecificationExecutor<ShipPortCall>` |
| S-03 | AC-025-02 | PASS | `db/migration/V20260906120000__create_ship_port_call.sql:7` `CREATE TABLE IF NOT EXISTS public.ship_port_call`; `:16` `org_unit_id UUID NOT NULL`; indexes `idx_ship_port_call_org_unit` (:69), `_org_unit_created` (:71), `_report_date` (:73); **no `status` column** (U-2) |
| S-04 | AC-025-02 | PASS | `dto/ShipPortCallCreateRequest.java` — exactly **45** fields (orgUnitId..enterpriseCode, lines 29-77), `@NotNull(message = "Đơn vị báo cáo không được để trống")` on `orgUnitId` (:28-29), `@NotNull(message = "Ngày báo cáo không được để trống")` on `reportDate` (:32-33); **absent**: `passengersArrival/passengersDeparture/reportCode/reportName/reportPeriod/status` |
| S-05 | AC-025-03 | PASS | Controller GET params (controller :45-53): `orgUnitId`, `reportDateFrom/To`, `arrivalDateFrom/To`, `departureDateFrom/To`, `page` (0-based, default 0), `size` (default 20); service Specification (service :122-147) + date-range predicate `greaterThanOrEqualTo(from)` / `lessThanOrEqualTo(to)` (:156-160) → inclusive bounds (matches oracle boundary from=to inclusive); sort `EntityFields.CREATED_AT` DESC (:128) |
| S-06 | AC-025-04 | PASS | Service `trimToNull(...)` applied to every string field on create (service :61-103, helper :223+); FE trims too — page `v.trim()` helper (:40), `keywordInput.trim()` (:114), `String(values.orgUnitId ?? '').trim()` (:182); service test covers trim-to-empty→null |
| S-07 | AC-025-05 | PASS | Service :54-55 — `if (!orgUnitScopeService.currentUserScope().allows(request.getOrgUnitId())) throw new AccessDeniedException("Đơn vị báo cáo ngoài phạm vi cho phép")` — scope validation BEFORE persist; `OrgUnitScopeService.Scope.allows` used as oracle specified |
| S-08 | AC-025-05/P | PASS | Controller `@PreAuthorize("@auth.check(authentication, 'shipportcall:read')")` on GET (:42), `'shipportcall:create'` on POST (:65), same camel resource string both actions; `config/PermissionSeeder.java:511,513` `seedPermission(definitions, "shipportcall", "read", "Xem sổ tàu biển ra vào cảng biển", …)` / `"create", "Thêm mới bản ghi tàu biển ra vào cảng biển"` |

### Permission oracles (P-R, P-C, P-A)

| ID | Result | Evidence anchor |
|---|---|---|
| P-R | PASS | Menu leaf registered + gated at 3 points: `config/navigation.tsx:190` leaf `{ key: '/ship-port-call', … }`; `components/AppLayout.tsx:96` permission map `'/ship-port-call': 'shipportcall:read'` and `:286` `canAccessMenu('/ship-port-call') ? …`; `App.tsx:292` `<Route path="/ship-port-call" element={<PermissionGuard permission="shipportcall:read"><ShipPortCallPage /></PermissionGuard>} />` |
| P-C | PASS | Page `const canCreate = hasPermission('shipportcall:create')` (:58) feeding the ScreenHeader action (:307 `canCreate`); create is a Modal on the list page (:381), submit handler behind the same gate |
| P-A | PASS | `ShipPortCallResponse.java` carries `orgUnitName` (:30) + audit `createdAt` (:80) / `createdBy` (:81); service :168 `response.setOrgUnitName(orgUnitCacheService.getName(entity.getOrgUnitId()))` — OrgUnitCacheService, no per-row query, no FE ID→name mapping |

### Naming / quality gates (NG-01..06)

| ID | Result | Evidence anchor |
|---|---|---|
| NG-01 | PASS | EN identifiers end-to-end: `ShipPortCall`, `ship_port_call`, `org_unit_id`, `com.hanghai.kchtg.shipportcall`, `/api/v1/ship-port-call` (controller :32 — SA-final, v1 present), FE `/ship-port-call`, camel DTO fields; zero transliterated-Vietnamese identifiers observed in new files |
| NG-02 | PASS | VI diacritic messages: controller «Lấy danh sách tàu biển ra vào cảng biển thành công» (:59), «Tạo mới bản ghi tàu biển thành công» (:72); service «Đơn vị báo cáo ngoài phạm vi cho phép» (:55); DTO `@NotNull` messages; FE toasts «Thêm mới thành công» / `toast.error` (:231, :237) + VN labels («Đơn vị quản lý», «Tìm kiếm từ khóa», «Ngày báo cáo», «Ngày đến cảng») |
| NG-03 | PASS | `@Enumerated(EnumType.ORDINAL)` only on `islandRoute` (:232-234) and `dangerousGoods` (:237-239); migration columns `island_route SMALLINT` (:62), `dangerous_goods SMALLINT` (:63); open vocabularies VARCHAR — `nationality VARCHAR(100)` (:24), `ship_type VARCHAR(255)` (:25), `cargo_group VARCHAR(255)` (:51), `enterprise_code VARCHAR(100)` (:65); no invented enums for them |
| NG-04 | PASS | `@FieldNameConstants` on entity + `ShipPortCall.Fields.orgUnitId/reportDate/arrivalDate/departureDate` (service :140-147) and `EntityFields.CREATED_AT` (:128) — no hardcoded property-name strings |
| NG-05 | PASS | Page imports `DataTable/FilterTableLayout/ScreenHeader` + `Pagination` from `components/list-view` (:9-11); **no StatusTabs** import/usage (page comment :52 «KHÔNG có StatusTabs, KHÔNG có detail drawer»; `hideStatusTabs` config :315); create = Modal on list page, no Drawer/no edit route; org-unit filters = `FilterOrgUnitTreeSelect`/`FormOrgUnitTreeSelect` from `components/org-unit` (:8); `getDatePickerProps`/`getRangePickerProps` from themetokenchk (:13); tokens `radiusPill`/`spaceFormField`/`spaceSm` (:17-19); cancel Button `borderRadius: radiusPill, height: 40` (:387); zero `#[0-9a-fA-F]{3,6}` hex hardcodes matched; list columns exactly `orgUnitName`(:133-138)/`reportDate`(:143)/`reportCode`(:149-154)/`reportName`(:157-162)/`reportPeriod`(:165-170), displaying `orgUnitName` from response |
| NG-06 | PASS | Entity carries all 50 business columns (incl. `passengers_arrival/departure` :180-185) with **no `status`**; transshipment/transit groups exactly 2 fields (Tons+Teus, no `*EmptyTeus` — service toResponse mapping); DTO/form exactly 45 create fields (S-04); FE types doc-comment mirrors the exclusion rule (types :8, :91) |

### UNRESOLVED disposition checkpoints (U-1..U-6)

| U-ID | Result | Evidence anchor |
|---|---|---|
| U-1 | PASS | `passengers_arrival`/`passengers_departure` nullable `INTEGER` in entity (:180-185) + migration (:49-50, no NOT NULL); absent from `ShipPortCallCreateRequest` (S-04) and from the create form/FE payload (types :91) |
| U-2 | PASS | `status` excluded everywhere: no column in migration, no entity field (`private .*status` = 0 matches), no DTO field, no FE type field (types :8/:91 mention it only in a doc-comment) — no invented status enum |
| U-3 | PASS | Open vocabularies VARCHAR (NG-03 anchors) — text/select over data, no enum-int |
| U-4 | PASS | `report_code` `VARCHAR(100)` nullable (entity :56-57, migration); list-only; no auto-generation rule/service anywhere (no generator code found in the new files) |
| U-5 | PASS | Controller exposes **only** GET+POST (`@GetMapping` :43, `@PostMapping` :66; no `@PutMapping`/`@DeleteMapping`/`{id}` detail — 0 matches); FE has no drawer/edit/delete UI |
| U-6 | PASS | DB `org_unit_id UUID NOT NULL` (migration :16) + `@NotNull` on `orgUnitId`/`reportDate` DTO fields with VN messages (S-04) |

### Black-box behavior oracles (B-01..B-08, P-R-B, P-C-B) — staged/UAT only

**NOT executed in this pipeline** — per wave-1 oracle §6 step 4 and the project constraint forbidding backend server launch. These require a live backend + seeded org units/roles (precondition in w1 §3.2). Each case's exact HTTP action + DB assertion is defined in `07-qa-report-w1.md` §3.2 and stands ready for a staged environment; static evidence supporting the underlying semantics was verified this session (scope filter wiring S-01/S-02, out-of-scope rejection S-07, inclusive date ranges S-05, trim S-06). Pipeline evidence cannot and does not claim row-scoping/persistence/rejection behavior proven end-to-end.

## 3. Findings & blockers

- **F-01 (no defect)**: zero implementation findings across S-/P-/NG-/U- items — every wave-1 static oracle passed with a direct source anchor. FE unit suite (5/5) and both compile/build gates green.
- **QA-BLK-001 (RESOLVED — closed by follow-up)**: the mandated backend-test exit code was produced by the **backend-dev seat** (task `ses_3c6edd865fe58065d2a661141152d8480bed7ad14f320d6b57a81f65c47cc19a`): `env JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home mvn -q -Dtest=ShipPortCallServiceTest verify` → exit 0; surefire report `target/surefire-reports/com.hanghai.kchtg.shipportcall.ShipPortCallServiceTest.txt` (verified on disk this session) — **Tests run: 3, Failures: 0, Errors: 0, Skipped: 0**. The prior Blocked was solely the leaf-seat Maven-runner restriction (bash test-target gate + test_runner whitelist bun/vitest/jest/pytest), never an implementation defect.
- **Environment gap (declared, not a defect)**: B-* staged behavior oracles remain for a live-backend environment (w1 §7 already recorded this gap as operator-owned).

## 4. What this wave verified vs did not

Verified (direct current evidence): backend compiles under JDK17 (exit 0); FE typecheck+bundle (exit 0); FE service test suite 5/5 (exit 0); all 25 static oracle items (S-01..08, P-R/C/A, NG-01..06, U-1..U-6) PASS with file:line anchors.
Not verified / no execution evidence: all B-*/P-*-B live-backend behavior cases (staged env required — operator-owned per w1 §6/§7). The backend unit-test exit code is now recorded — BE-1 exit 0, Tests 3/0/0/0, sourced from the backend-dev seat execution + on-disk surefire report.

## 5. Delivered artifacts

- `docs/modules/M-025-quan-ly-tau-bien/qa/07-qa-report-w2.md` (this report)
- Companion: `docs/modules/M-025-quan-ly-tau-bien/qa/07-qa-report-w1.md` (oracle executed against, unchanged)
