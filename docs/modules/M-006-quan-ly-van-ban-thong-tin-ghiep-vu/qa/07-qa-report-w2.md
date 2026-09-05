# Wave-2 QA Report — M-006 · TRI-1788601279142-ccd9 (F-128 / F-131 / F-132)

- **Stage:** engineering-qa-engineer (wave 2 — independent validation)
- **Module:** M-006-quan-ly-van-ban-thong-tin-ghiep-vu
- **Triage:** TRI-1788601279142-ccd9 (C3, full_pipeline — field-matrix sync Excel 2.9 sheets 30-43, clusters #31/#37/#38)
- **Scope under test:** F-128 Quản lý văn bản pháp lý (confirm-only, D14) · F-131 Quản lý thông tin sự cố · F-132 Tạo mới quy hoạch bến cảng (tạo mới/tra cứu/cập nhật flow)
- **Date:** 2026-09-06 (run started 2026-09-05, surefire rerun completed 2026-09-06 00:00+07:00)
- **Acceptance oracle source:** pre-change triage record + Passed feature briefs (§2 field-matrix, approval/status rules, §7 columns) + design plan `design/00-design-plan.md` (D1–D14) + lean spec. Companion artifact: `qa/acceptance-map.json` (same triage).

## 1. Executed verification evidence (this seat)

| # | Command / check | Result | Evidence |
|---|---|---|---|
| V1 | `JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home mvn -q -DskipTests test-compile` | exit 0 (36.8 s, no compiler output) | session bash job_07280e602001Be37svpziSTrQa → `MVN_EXIT_CODE=0` |
| V2 | `mvn -q -Dtest=LegalDocumentControllerTest,PortPlanningControllerTest surefire:test` (direct goal, exact selectors, JDK17 class files) | exit 0 (41.9 s) | session bash job_07282331000125silUgRyhBHPv; run log shows DataScopeAspect orgUnitFilter activation per request |
| V3 | Surefire report re-read after V2 | **LegalDocumentControllerTest: Tests run: 16, Failures: 0, Errors: 0, Skipped: 0** (1.363 s) | `target/surefire-reports/com.hanghai.kchtg.document.LegalDocumentControllerTest.txt` |
| V4 | Surefire report re-read after V2 | **PortPlanningControllerTest: Tests run: 9, Failures: 0, Errors: 0, Skipped: 0** (36.05 s) | `target/surefire-reports/com.hanghai.kchtg.document.PortPlanningControllerTest.txt` |
| V5 | grep hardcoded hex `#[0-9a-fA-F]{3,8}` in `frontend/src/pages/document/*.tsx` | No files found | — |
| V6 | grep `\bTag\b` (antd Tag) in `frontend/src/pages/document/*.tsx` | No files found | — |
| V7 | Static greps: entity annotations/fields, controller `@DataScope`/`@PreAuthorize`/routes, migration backfill/ORDINAL-conversion lines, `PermissionSeeder` seed lines, FE permission gates + `radiusPill` usage | anchors below | file:line anchors in §2 |

> Scope-parser note (why V2 differs from upstream form): an `env JAVA_HOME=…` prefix and a trailing `; echo` wrapper are refused by the runtime test scope parser; the plain direct goal `mvn -q -Dtest=<exact classes> surefire:test` is accepted. JDK-17-bound test-tree compile (V1) was done with the env prefix per the upstream record; the surefire run uses the sandbox JVM but executes the JDK17-compiled classes (identical behaviour — matches upstream dev record risk note).

## 2. Coverage map — criterion → oracle → evidence → verdict

### F-128 Quản lý văn bản pháp lý (confirm-only per D14)

| ID | Criterion (oracle) | Evidence anchors | Verdict |
|---|---|---|---|
| AC-128-01 | Backend surface intact & matches brief §2/§7; route + per-action `document:*` gates compile green | `LegalDocumentController.java:55-56` (`@RequestMapping("/api/v1/legal-documents")`), `:68-263` (`@PreAuthorize document:read/create/update/delete`); V1 exit 0 | Pass |
| AC-128-02 | F-128 suite **genuinely executes production** (INC-039: mock-only shell removed); 16/16 green | rewrite record `dev/05-dev-w1-rewrite-legal-document-controller-test.md`; V2+V3 (`Tests run: 16, Failures: 0, Errors: 0, Skipped: 0`) | Pass |
| AC-128-03 | `document:*` seeded → gates resolvable; FE gates per action | `config/PermissionSeeder.java:132-140` (document manage/read/create/update/delete/approve); `LegalDocumentList.tsx:431-445,538` gates (per w1 anchors, unchanged per D14) | Pass |

### F-131 Quản lý thông tin sự cố

| ID | Criterion (oracle) | Evidence anchors | Verdict |
|---|---|---|---|
| AC-131-01 | Incident entity carries matrix #37 fields + orgUnitId + audit + soft delete + 3 child collections; migration adds columns + child tables | `entity/Incident.java:24` (@Table), `:29` (@FieldNameConstants), `:30` (@Filter orgUnitFilter), `:31` (@SQLRestriction deleted_at IS NULL), `:36-51+` (id/code/incidentType/discoveryTime/occurredTo/location/…), `:61,66,71,76` (@OneToMany); migration `:13-24` (ADD COLUMN IF NOT EXISTS …), `:135,143,154` (CREATE TABLE incident_evolution/handling/file) | Pass |
| AC-131-02 | Org-unit data scope: class-level @DataScope; org_unit_id backfill fail-closed, non-null on write | `IncidentController.java:32` (@DataScope), `:30` (route); migration `:101-106` (backfill from created_by join), `:110-113` (RAISE EXCEPTION fail-closed), `:116` (SET NOT NULL), `:168,170` (indexes) | Pass |
| AC-131-03 | Legacy string values → ORDINAL int migration, no Vietnamese string literals persisted | migration `:61-65` (`processing_status VARCHAR→INTEGER USING CASE`), `:11` (legacy-literal doc), `:122-125` (per-org code backfill ROW_NUMBER) | Pass |
| AC-131-04 | `incident:*` seeded for each controller action; FE gates mirror actions | `config/PermissionSeeder.java:856-863`; `IncidentController.java:38,57,71,80,87,95,101,109,117,126`; `IncidentList.tsx:176-179` (incident:* OR document:*) | Pass |
| AC-131-05 | UI token-based (pill, radiusPill), Vietnamese labels; no hex, no antd Tag; typecheck green | `IncidentList.tsx:35,162,903,963,1053,1100,1105` (radiusPill); V5 (hex 0 hits); V6 (Tag 0 hits); FE dev record `05-fe-dev-w1-field-matrix-sync.md` (tsc exit 0) | Pass |

### F-132 Tạo mới quy hoạch bến cảng (tạo mới/tra cứu/cập nhật)

| ID | Criterion (oracle) | Evidence anchors | Verdict |
|---|---|---|---|
| AC-132-01 | PortPlanning entity carries matrix #38 fields + children (cargo forecast/planning detail/file), enum status; migration converts/adds | `entity/PortPlanning.java:48` (`PlanningStatus status`), `@OneToMany` ×3 (mappedBy portPlanning); migration `:33-42` (status VARCHAR→INT ORDINAL: `'HIEN_HANH'→1` …), `:139-143` (indexes incl. cargo_forecast) | Pass |
| AC-132-02 | Org-unit data scope incl. fail-closed org_unit_id backfill | `PortPlanningController.java:28` (@DataScope), `:26` (route); migration `:80` (backfill), `:83` (RAISE EXCEPTION), `:86` (SET NOT NULL) | Pass |
| AC-132-03 | Real-code controller test for port-planning flow; 9/9 green | V2+V4 (`Tests run: 9, Failures: 0, Errors: 0, Skipped: 0`); rewrite record Part 2 (9/9 after DataScopeAspect user-principal fix) | Pass |
| AC-132-04 | `portplanning:*` seeded; FE gates mirror | `config/PermissionSeeder.java:143-155`; `PortPlanningController.java:34,43,51,57,66,73,81,91,99`; `PortPlanningList.tsx:208-211` (portplanning:* OR document:*) | Pass |
| AC-132-05 | F-132 create/F-133 view/F-134 edit drawers (cargo min≤max + auto-total, group tabs), token-based, Vietnamese, no hex/Tag | `PortPlanningList.tsx:38,122` (radiusPill); V5/V6 0 hits; FE dev record (bind/display/filter/edit per design plan) | Pass |

## 3. Per-feature and overall verdicts

| Feature | Verdict | Basis |
|---|---|---|
| F-128-quan-ly-van-ban-phap-ly | **Pass** | 16/16 real-code controller tests executed this seat (V2/V3); confirm-only FE surface unchanged per D14 with document:* gates/seeds intact; compile green. |
| F-131-quan-ly-thong-tin-su-co | **Pass** | Entity/children/migration/scope/permission/UI anchors all present (AC-131-01..05); compile green; no material contradiction. |
| F-132-tao-moi-quy-hoach-ben-cang | **Pass** | 9/9 real-code controller tests executed this seat (V2/V4); entity/children/ORDINAL conversion/fail-closed backfill/permissions/UI anchors present. |
| **Overall** | **Pass** | Every in-scope criterion green on current revision; only non-executable items are runtime-browser/DB surfaces, stated truthfully as limits. |

## 4. Non-blocking observations (no criterion fails)

1. **Legacy duplicate `portplanning` seeds** at `PermissionSeeder.java:472-478` ("Tìm kiếm quy hoạch cảng" etc.) duplicate resource:action codes already seeded at `:143-155`. Harmless only because the seeder inserts when `findByCode` misses (AGENTS.md Permission Registration §3); runtime idempotency not executed. Owning role for cleanup decision: engineering-backend-developer (deferred, non-blocking).
2. Incident has no dedicated controller-test suite in scope for F-131 (upstream BE run covered only LegalDocument + PortPlanning suites); F-131 production code is exercised by compile + DataScopeAspect-active runs inside PortPlanningControllerTest's context and static anchors. This matches the stated BE scope; no fake-coverage defect observed for F-131.
3. `docs/inputs/*.csv` attached to this dispatch (QL bến phao / Khu tránh trú bão / Khu chuyển tải) are OTHER modules' field matrices — they do not govern M-006 acceptance, which rests on the Passed briefs (Excel 2.9 sheets 30-43, clusters #31/#37/#38).

## 5. Coverage limits (stated truthfully)

- **No runtime browser CRUD:** backend boot is forbidden (AGENTS.md) and this seat has no browser tool; drawer flows/empty-state/status-tab invariants (Tất cả = sum of sub-tabs, scroll standstill, drawer pagination Y, drawer child-table proportions) verified statically only.
- **No live Flyway run:** migrations (backfill join, RAISE EXCEPTION fail-closed, `SET NOT NULL`, ORDINAL `USING CASE` conversions) verified by SQL inspection anchors, not executed against PostgreSQL.
- **No git operations:** "only intended files changed" rests on the upstream dev record (`git status --short -- src/test/java` → only the two test files) and observed state.
- **F-128 UI identity (D14 no-change):** asserted via upstream FE record + w1-era anchors, not a fresh diff.
- Prior-stage claims (BA/SA/FE/BE Pass) were **not** re-litigated; this report only adds wave-2 execution evidence on the current revision.
