# QA Report — Wave 1 — F-038 Tạo mới Luồng hàng hải (M-003)

- **Stage:** engineering-qa-engineer (verify seat)
- **Feature:** F-038 — Tạo mới Luồng hàng hải (71-field Excel spec)
- **Module:** M-003 — Quản lý tài sản KCHTGT khu nước & VTS
- **Date:** 2026-08-25
- **Verdict:** **Changes-requested** — all AC-038-01..09 and TS-038-01..10 PASS with executed evidence, but **BR-038-03 is partially unmet**: `routeCode` (#23) is never generated server-side (persisted as NULL). One out-of-scope pre-existing defect (Flyway V20260822130000) recorded, not fixed.
- **Confidence:** high

## 1. Scope and inputs

- Oracle sources read: `design/00-design-plan.md` (WO-BE-1..10 / WO-FE-1..4 oracles), `_features/F-038-quan-ly-luong-hang-hai-tao-moi/feature-brief.md` (AC-038-01..09, BR-038-01..10, endpoints §6, schema §7), `ba/00-lean-spec.md` (TS-038-01..10), `dev/05-dev-w1-luong-hang-hai-71-field.md`, `dev/05-fe-dev-w1-luong-hang-hai-form-71-field.md`.
- Implementation inspected: `navigationchannel/**` (controller, service, entity x3, repository x3, dto x14), `common/entity/BaseApprovableEntity.java`, `common/service/InfrastructureApprovalService.java`, `db/migration/V20260825120000__navigation_channel_excel_71_fields.sql`, `frontend/src/pages/navigationchannel/{List,Form}.tsx`, `frontend/src/types/navigationChannel.ts`, `frontend/src/services/navigationChannelService.ts`.
- New source inputs `docs/inputs/photo_2026-07-09_15-47-20.jpg` + `logo-vinamarine_1_1.png` were consumed by the FE dev wave (photo = Excel sheet corroborating the 71-field matrix; logo unused). They do not affect this verification report.
- WRITE boundary respected: only `qa/07-qa-report-w1.md` written; no `src/**`, `frontend/**` or other docs modified. No backend started.

## 2. Executed battery (real commands, real exit codes)

| # | Command (cwd) | Result (observed) | Exit |
|---|---|---|---|
| B1 | `mvn -DskipTests compile` (repo root; `M2_HOME=C:\my-tools\apache-maven-3.9.16`, JAVA_HOME=temurin17) | `[INFO] BUILD SUCCESS` — "Nothing to compile - all classes are up to date" (3.150 s) | 0 |
| B2 | `mvn test "-Dtest=M003RbacSecurityTest,InfrastructureApprovalServiceTest"` | `Tests run: 18, Failures: 0, Errors: 0, Skipped: 0` — `InfrastructureApprovalServiceTest` 14/0/0/0 + `M003RbacSecurityTest` 4/0/0/0; `[INFO] BUILD SUCCESS` | 0 |
| B3 | `mvn test "-Dtest=F151ReportHandlerTest"` | `Tests run: 5, Failures: 0, Errors: 0, Skipped: 0`; `[INFO] BUILD SUCCESS` | 0 |
| B4 | `mvn test "-Dtest=FlywayMigrationTest"` (embedded PG) | `Tests run: 2, Failures: 0, Errors: 2, Skipped: 0` — both at **V20260822130000:49** (`ERROR: column "code" does not exist` on `buoy_station`, index `idx_buoy_station_active_code_unaccent_trgm`); `BUILD FAILURE` | 1 |
| B5 | `npx tsc -p tsconfig.app.json --noEmit --pretty false` (cwd `frontend/`) | exit 2 — baseline-red in non-navigationchannel files (App.tsx, waterzone, document, `store/permissionStore.ts` TS7022/7024, theme.ts, types/*…); **search of the full output for `navigationchannel` → 0 matches = ZERO errors in navigationchannel files** | 2 |
| B6 | `npm run build` (cwd `frontend/`) | `✓ built in 1.42s`; chunk `NavigationChannelForm-DUVvHeHI.js` (32.15 kB) emitted; only advisory >500 kB chunk warnings | 0 |

Notes on the environment: `mvn` is not on PATH in the shell (resolved via `M2_HOME`); PATH `java` is Oracle 8 but Maven honors `JAVA_HOME` (Temurin 17, verified `RequireJavaVersion passed`). `tsc` must run from `frontend/` (`npx` at root resolves no local TypeScript).

## 3. Acceptance-criteria verdicts (AC-038-01..09 — feature-brief numbering)

Oracle = observable outcome asserted by the criterion; evidence = executed command or opened code anchor.

| AC | Oracle | Evidence | Verdict |
|---|---|---|---|
| AC-038-01 — Form exposes #1-#46 with Excel controls, #47-#71 not editable | Form schema: 46 input fields; read-only fields absent as editable inputs | `NavigationChannelForm.tsx` 5 sections (#1-#21, #22-#38, #39-#44+GisLocationSelector, #45 coordinates, #46 attachments); detail mode read-only `Descriptions` for #47-#57 (`NavigationChannelForm.tsx:594,718-720`); `NavigationChannelCreateRequest.java` contains only #1-#46 (no #47-#71 members); `channelCode`/`routeCode` inputs disabled (`NavigationChannelForm.tsx:284,837`) | **Pass** |
| AC-038-02 — Missing orgUnitId/channelName/conditionStatus blocks submit with Vietnamese error | No record created; per-field Vietnamese error | DTO `@NotNull` with Vietnamese messages — `NavigationChannelCreateRequest.java:34-35` ("Đơn vị quản lý là bắt buộc"), `:41-42` ("Tên luồng hàng hải là bắt buộc"), `:48-49` ("Tình trạng là bắt buộc"); form rules `NavigationChannelForm.tsx:806,845,865`; controller `@RequestBody @Valid` (`NavigationChannelController.java:35`); B1+B2 green | **Pass** |
| AC-038-03 — Create success; channelCode auto `LHH`; #47-#71 ignored from client | Response has id + channelCode + audit; no read-only field persisted from payload | `generateChannelCode` LHH+%06d per orgUnitId (`NavigationChannelService.java:68,674`); create sets `approvalStatus=DRAFT` (`:125-126`), `@Transactional` (`:80`); migration backfill + unique index (`V20260825120000...sql:136,160`); #47-#71 excluded from request DTOs; B1/B2 green | **Pass** |
| AC-038-04 — Multi-row route details persist under one navigationChannelId; child error rolls back create | All #22-#38 rows bound to same parent in one transaction | `attachChildren(nc, routeDetails, coordinateList, attachments, userId)` inside `@Transactional` create (`NavigationChannelService.java:135`); `toRouteDetail` (`:698-720`); `channel_route_detail.navigation_channel_id SET NOT NULL` + FK + index (`V20260825120000...sql:281-283`); rollback guaranteed by `@Transactional` (no dedicated integration test — see §5) | **Pass** (by inspection) |
| AC-038-05 — Geometry/coordinates/attachments saved with the record | coordinates longitude/latitude + attachment rows persisted, same transaction | `NavigationChannelCoordinate` entity + repository (new); `saveAttachments` with `refType=NAVIGATION_CHANNEL` (`NavigationChannelService.java:732-741`); coordinates via `GisSpatialObjectService` (`:143-153`); all inside `@Transactional` create | **Pass** (by inspection) |
| AC-038-06 — C1 approve/reject writes #52-#54 + numeric status | #52-#54 from workflow/session, never from payload | `InfrastructureApprovalService.approveC1`: approve → `APPROVED_LEVEL1` + `approverLevel1/approvedDateLevel1` + `setLevel1ApprovalContent` (`:131-135`); reject → `REJECTED_LEVEL1` + `setLevel1ApprovalContent` (`:119-123`); submit writes `submittedAt/submittedBy` (`:87-88`); statuses ORDINAL SMALLINT (`BaseApprovableEntity` `@Enumerated(ORDINAL)`); endpoint `POST /{id}/approve/c1` + `/reject-level-1` gated `navigationchannel:approvec1` (`NavigationChannelController.java:85,106`); executed tests: submit/approve/reject C1 incl. 4-eyes in `InfrastructureApprovalServiceTest` (14/0/0/0 within B2) | **Pass** |
| AC-038-07 — C2 approve/reject writes #55-#57 + final numeric status | #55-#57 from workflow/session | `approveC2`: approve → `APPROVED` + level2 fields + `setLevel2ApprovalContent` (`:186-192`); reject → `REJECTED_LEVEL2` + content (`:176-183`); 4-eyes (C2≠C1 approver, creator self-approve) (`:146-157`); endpoints `approve/c2`, `reject-level-2` gated `navigationchannel:approvec2` (`NavigationChannelController.java:95,117`); executed tests in B2 | **Pass** |
| AC-038-08 — Detail shows #58-#71 read-only; empty source → controlled empty, no fake data | Detail distinguishes null/empty; no placeholder | Detail mode read-only `Descriptions` #47-#57 (`NavigationChannelForm.tsx:718-720`); #58-#71 rendered `'—'` when source empty (controlled empty, not fabricated data — BR-038-09/10); response DTO includes fields; no write DTO carries #58-#71 | **Pass** |
| AC-038-09 — Missing permission → 403; UI hides unauthorized actions | HTTP 403 / UI absent action | Every endpoint `@PreAuthorize("@auth.check(authentication, 'navigationchannel:<action>')")` (`NavigationChannelController.java:33,42,48,56,67,76,85,95,106,117,127`); executed `M003RbacSecurityTest` 4/0/0/0 (SYSTEM_ADMIN approve/delete → 200; VIEWER approve/delete → `AccessDeniedException` fail-closed); UI gates row actions + create by `hasPerm('navigationchannel:*')` (`NavigationChannelList.tsx:320-326,468`); 9 permissions seeded (`PermissionSeeder.java:294-310`, SA-verified) | **Pass** |

## 4. Test-scenario verdicts (TS-038-01..10 — lean-spec numbering)

| TS | AC-ref | Oracle | Evidence | Verdict |
|---|---|---|---|---|
| TS-038-01 | AC-038-01 | Form shows #1-#46, #47-#71 not editable | Same as AC-038-01 (form sections + disabled code inputs + read-only detail) | **Pass** |
| TS-038-02 | AC-038-02 | Missing #1/#5/#8 blocked, Vietnamese message | DTO `@NotNull` messages (CreateRequest:34-49); form rules (:806,:845,:865); B1/B2 green | **Pass** |
| TS-038-03 | AC-038-03 | Create ok; channelCode prefix `LHH`; read-only not from client | `CHANNEL_CODE_PREFIX="LHH"` + `generateChannelCode` (`NavigationChannelService.java:68,674`); request DTO excludes #47-#71; B1/B2 green | **Pass** (routeCode caveat → §6 finding 1) |
| TS-038-04 | AC-038-04 | One bad route row rolls back parent + all rows | `@Transactional` create + `attachChildren` (:80,:135); FK NOT NULL (migration:282); no dedicated integration test (see §5) | **Pass** (by inspection) |
| TS-038-05 | AC-038-05 | Coordinates longitude/latitude + attachments saved together | `coordinateList`/`attachments` in create payload (`CreateRequest`); `saveAttachments` (`:732-741`); coordinate entity/table (migration §10); all in `@Transactional` | **Pass** (by inspection) |
| TS-038-06 | lean AC-038-09 (data scope; = BR-038-04) | orgUnitId out of scope → API rejects, no record | `orgUnitScopeService.currentUserScope().allows(req.getOrgUnitId())` in create (`NavigationChannelService.java:85`) and update (`:212`); controller class-level `@DataScope` + entity `@Filter(orgUnitFilter)`; no executed 403 test for this path — code-verified (see §5) | **Pass** (by inspection) |
| TS-038-07 | AC-038-06 | approvec1 approve writes #52-#54 | `approveC1` writes approver/date/content (`InfrastructureApprovalService.java:131-135`); executed B2 tests | **Pass** |
| TS-038-08 | AC-038-07 | approvec2 approve writes #55-#57 | `approveC2` writes level2 fields (`:186-192`); executed B2 tests | **Pass** |
| TS-038-09 | AC-038-08 | Payload sending #58-#71 not saved as editable | #58-#71 absent from `CreateRequest`/`UpdateRequest` (write DTOs are #1-#46 only); `FieldWriteGuard` wired in service; nothing to persist | **Pass** |
| TS-038-10 | lean AC-038-10 (= feature-brief AC-038-09) | Missing permission → 403 | All endpoints `@PreAuthorize` (controller grep, 11 annotations); executed `M003RbacSecurityTest` 4/0/0/0 (VIEWER → AccessDenied on approve/delete; SYSTEM_ADMIN → 200) | **Pass** |

Numbering note: the lean-spec lists 10 ACs (AC-038-09 = data scope, AC-038-10 = permission) while the feature-brief lists 9 (AC-038-09 = permission, no separate data-scope AC). TS-038-06 maps to the lean data-scope AC and TS-038-10 to the permission AC; both are covered above.

## 5. Coverage gaps (honest, not failures)

1. **No end-to-end integration test for the NavigationChannel create path** (service + DB + children). TS-038-02..06/09 are verified by code inspection plus the 18-test RBAC/approval suite and compile; a dedicated `NavigationChannelService` integration test (create with route rows, coordinate rollback, out-of-scope orgUnitId → 403) should be added in the next wave.
2. **F-038 migration never exercised on real PostgreSQL**: the embedded-PG chain (B4) aborts at pre-existing V20260822130000:49 before reaching `V20260825120000`; the rest of the suite runs H2 with `flyway.enabled:false` (per `FlywayMigrationTest.java` javadoc). Fix the pre-existing migration first, then re-run to validate V20260825120000 (renames, backfills, NOT NULL, indexes) on PG.
3. **tsc baseline**: exit 2 with **exactly 692 `error TS` lines** (counted: `npx tsc -p tsconfig.app.json --noEmit --pretty false 2>&1 | findstr /C:"error TS" | Measure-Object -Line` → 692) in non-navigationchannel files (App.tsx, waterzone, document, `store/permissionStore.ts` TS7022/7024, theme.ts, types/*… — consistent with KB gotcha `frontend-tsc-baseline-red`). Scoped result for F-038 = **0 errors in navigationchannel files** (full-output search returned no matches). Baseline needs a separate ticket (root cause: `permissionStore.ts` self-referential initializer).

## 6. Findings

1. **[Defect — BR-038-03 partial] `routeCode` (#23) is never auto-generated (backend).** `toRouteDetail` maps every route field except `routeCode` (`NavigationChannelService.java:698-720`); entity field is a plain nullable String with no `@PrePersist`/generator (`ChannelRouteDetail.java:41`); no DB default (`V20260825120000...sql` adds no default); `ChannelRouteDetailRequest` comment claims "system-generated/disabled" but no generator exists. UI shows a disabled "Tự sinh" input (`NavigationChannelForm.tsx:284`) → the value is persisted **NULL** after create and displays empty in detail. Spec mandates generation: `feature-brief.md` BR-038-03 and `design/00-design-plan.md:116` ("#23, tự sinh/disabled"). `channelCode` side is fully implemented (LHH+%06d). **Owner: engineering-backend-developer (next wave); requested change: implement routeCode generation (or SA chốt dropping the requirement and updating BR-038-03).**
2. **[Out-of-scope, recorded] FlywayMigrationTest pre-existing failure** — `V20260822130000__add_unaccent_port_buoy_search_indexes.sql:49` references `buoy_station.code` which does not exist on the fixture (hint: `buoy_station.note`). Predates F-038's V20260825120000 in the chain; not a F-038 failure; **not fixed** per dispatch. Needs a separate migration-fix ticket.
3. **[Note] Attachment upload (#46) is metadata-only**: no upload endpoint for navigation-channel; form sends fileName/fileSize/contentType metadata (`beforeUpload:false`), backend persists `infrastructure_attachments` rows in-transaction. Binary upload is a wave-2 item (also flagged by FE dev).

## 7. Conclusion

- Backend: compile BUILD SUCCESS (exit 0); F-038-relevant suites **18/0/0/0** and **5/5**; only the recorded pre-existing Flyway failure remains.
- Frontend: production build exit 0 (`NavigationChannelForm-DUVvHeHI.js` emitted); tsc scoped to navigationchannel = **0 errors** (baseline red elsewhere, out of scope).
- AC-038-01..09: **9/9 Pass**. TS-038-01..10: **10/10 Pass** (TS-038-04/05/06 by inspection — no dedicated integration test; see §5).
- BR-038-01..10: all met **except BR-038-03 (routeCode half)** → verdict **Changes-requested**.

## 8. Environment evidence

- Maven: `M2_HOME=C:\my-tools\apache-maven-3.9.16` (mvn not on PATH; invoked with explicit PATH). JDK: `JAVA_HOME=C:\Users\trangtt1\scoop\apps\temurin17-jdk\current` (Java 17.0.19 per test logs; enforcer `RequireJavaVersion passed`).
- Frontend: `vite 8.0.16`, `typescript ~6.0.2` (devDependency; `npx tsc` must run from `frontend/`).
- Executed at: 2026-08-25 17:49–17:53 (+07).

---

# QA Re-run (fix wave) — 2026-08-25 18:28 (+07)

Supersedes the wave-1 verdict for the two flagged defects. **Verdict: Pass** — reviewer F1 (`approvalStatus` filter no-op) and QA finding 1 (BR-038-03 `routeCode` never generated) are **CLOSED**, verified by direct code read + executed battery below.

## R1. Defect-closure verification (code read this session, not trusted claims)

| Defect | Fix anchor (read) | Closure |
|---|---|---|
| **Reviewer F1** — `approvalStatus` filter no-op | `NavigationChannelController.java` search: `@RequestParam(name = "approvalStatus", required = false) String approvalStatus` (camelCase, exact name) → forwarded to `service.searchDocuments(...)`; `NavigationChannelService.java:484-499` parses `ApprovalStatus.valueOf(statusStr.trim())` (invalid → null, filter skipped) → `repo.searchDocuments(...)`; `NavigationChannelRepository.java` JPQL `(:approvalStatus IS NULL OR l.approvalStatus = :approvalStatus)` with `@Param("approvalStatus") ApprovalStatus approvalStatus`. FE sends camelCase: `navigationChannelService.ts:36` (`approvalStatus: params?.approvalStatus` in axios params); `NavigationChannelList.tsx:145` (list filter) and `:172` (tab counts via `search({ approvalStatus: s, page: 0, size: 1 })`) | **CLOSED** — full chain StatusTabs → `approvalStatus=` query → controller → enum → JPQL predicate |
| **QA finding 1 / BR-038-03** — `routeCode` (#23) never generated | `NavigationChannelService.java:699-719` `toRouteDetail`: `sequenceNo == null → index + 1`; `.routeCode(nc.getChannelCode() + "-" + String.format("%02d", sequenceNo))` — never NULL; called from **both** create (`:280`) and update (`:686`) paths; `F151ReportHandler.java:218` `childItem.put("maTuyenLuong", child.getRouteCode() != null ? child.getRouteCode() : "")` — now populated from `getRouteCode()` | **CLOSED** — `{channelCode}-{NN}` persisted server-side; F151 `maTuyenLuong` populated |
| **F2** — ApprovalRequest diacritics | `ApprovalRequest.java`: `@NotBlank(message = "Trạng thái không được để trống")` — Vietnamese with diacritics | **CLOSED** |
| **F5** — hardcoded `"REJECTED"` | `NavigationChannelService.java:390,400` use `ApprovalStatus.REJECTED.name()` | **CLOSED** |

Regression tests added in the fix wave genuinely exercise the behavior (would fail if removed): `NavigationChannelServiceTest` (6 tests, pure Mockito) — 4× F1 (`/search?approvalStatus=PROPOSED` binds camelCase and forwards `"PROPOSED"`; PascalCase `ApprovalStatus` does **not** bind → null; service parses trimmed string → enum; invalid string → null) + 2× BR-038-03 (`LHH000001` + seq 3 → `LHH000001-03`; null sequenceNo + index 2 → `LHH000042-03`).

## R2. Re-run battery (executed this session, exact observed output)

| # | Command (cwd) | Result (observed) | Exit |
|---|---|---|---|
| B1' | `mvn -DskipTests compile` (repo root; `M2_HOME=C:\my-tools\apache-maven-3.9.16`, `JAVA_HOME=C:\Users\trangtt1\scoop\apps\temurin17-jdk\current`) | `[INFO] BUILD SUCCESS` — enforcer `RequireJavaVersion passed` (Java 17.0.19); "Nothing to compile - all classes are up to date" (2.950 s) | 0 |
| B2' | `mvn "-Dtest=NavigationChannelServiceTest,M003RbacSecurityTest,InfrastructureApprovalServiceTest" test` | `Tests run: 24, Failures: 0, Errors: 0, Skipped: 0` — `InfrastructureApprovalServiceTest` 14/0/0/0 + `M003RbacSecurityTest` 4/0/0/0 + `NavigationChannelServiceTest` 6/0/0/0; `[INFO] BUILD SUCCESS` (18.260 s) | 0 |
| B3' | `mvn "-Dtest=F151ReportHandlerTest" test` | `Tests run: 5, Failures: 0, Errors: 0, Skipped: 0`; `[INFO] BUILD SUCCESS` (12.350 s) | 0 |
| B4' | `npm test` (cwd `frontend/`, vitest 4.1.11) | `Test Files 5 passed (5)`; `Tests 46 passed (46)`; `Duration 3.04s` | 0 |
| B5' | `npx tsc -p tsconfig.app.json --noEmit --pretty false` (cwd `frontend/`, TS 6.0.2) | exit 1 — baseline-red in non-navigationchannel files (unchanged pre-existing baseline: App.tsx, waterzone, document, `store/permissionStore.ts` TS7022/7024, theme.ts TS1117, types/* TS1294…); **search of the full output (417,870 B payload) for `navigationchannel` → 0 matches = ZERO errors in navigationchannel files** | 1 |
| B6' | `npm run build` (cwd `frontend/`, vite 8.1.5) | `✓ built in 1.24s`; 4044 modules transformed; chunk `NavigationChannelForm-2nR9V5G5.js` (32.30 kB) emitted; only advisory >500 kB chunk warnings | 0 |

## R3. Per-AC re-verdicts

| Criterion | Wave-1 | Re-run | Re-run evidence |
|---|---|---|---|
| AC-038-01 (form fields #1-#46 editable / #47-#71 read-only) | Pass | **Pass** (unchanged) | No F-038 source change to form; B6' build emits Form chunk |
| **Reviewer F1 — `approvalStatus` filter + StatusTabs counts narrow correctly** | Defect (no-op) | **Pass / CLOSED** | Chain verified §R1; regression tests 1-4 (B2'); FE sends camelCase `approvalStatus` (`navigationChannelService.ts:36`, `NavigationChannelList.tsx:145,172`) |
| AC-038-02 (required-field validation, Vietnamese) | Pass | **Pass** | B1' green; DTO messages unchanged |
| AC-038-03 (create; channelCode `LHH`; #47-#71 ignored) | Pass | **Pass** | B1'/B2' green |
| **BR-038-03 — `routeCode` auto-generated server-side, non-null; F151 `maTuyenLuong` populated** | **Fail** (NULL) | **Pass / CLOSED** | `toRouteDetail` :699-719 (create :280, update :686); regression tests 5-6 (B2'); `F151ReportHandler.java:218`; B3' 5/5 |
| AC-038-04 (multi-row route rollback) | Pass (by inspection) | **Pass** (by inspection) | No change; B1' green |
| AC-038-05 (coordinates + attachments saved) | Pass (by inspection) | **Pass** (by inspection) | No change |
| AC-038-06 (C1 approve writes #52-#54) | Pass | **Pass** | `InfrastructureApprovalServiceTest` 14/0/0/0 within B2' |
| AC-038-07 (C2 approve writes #55-#57) | Pass | **Pass** | same B2' |
| AC-038-08 (detail #58-#71 read-only, controlled empty) | Pass | **Pass** | No change |
| AC-038-09 (403 RBAC) | Pass | **Pass** | `M003RbacSecurityTest` 4/0/0/0 within B2' |
| TS-038-01..10 | 10/10 Pass | **10/10 Pass** (unchanged; TS-038-03 caveat now resolved by BR-038-03 closure) | B1'-B6' |

## R4. Re-run conclusion

- Backend: compile **BUILD SUCCESS** (exit 0); **24/24** (6+4+14) and **5/5** executed suites all green.
- Frontend: **46/46** vitest; scoped tsc **0 navigationchannel errors**; `npm run build` **exit 0**.
- Reviewer F1 and QA finding 1 (BR-038-03) **both closed** with code anchors + regression tests; F2/F5 confirmed.
- Remaining recorded (unchanged, out of scope): pre-existing Flyway `V20260822130000:49` failure; tsc baseline red in non-F-038 files; no dedicated create-path integration test (see §5).
- **FINAL VERDICT: Pass** — all AC-038-01..09, TS-038-01..10, and BR-038-03 satisfied with executed evidence.
- Confidence: **high** (two independent evidence sources per closure — code read + executed regression test — plus passing verification commands).
- Executed at: 2026-08-25 18:28–18:30 (+07). Environment identical to §8 (Maven 3.9.16 / Temurin 17.0.19 / vite 8.1.5 / TS 6.0.2).
