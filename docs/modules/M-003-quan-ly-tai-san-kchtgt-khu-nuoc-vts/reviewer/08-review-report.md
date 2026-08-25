# Code Review Report — F-038 Tạo mới Luồng hàng hải (M-003)

- **Reviewer seat:** engineering-code-reviewer
- **Reviewed commit:** `ec962a22` (HEAD) — M-003/F-038 71-field navigation channel implementation
- **Contract:** `design/00-design-plan.md` (WO-BE-1..10, WO-FE-1..4), `_features/F-038.../feature-brief.md`, `_features/F-038.../ba/00-lean-spec.md`
- **Date:** 2026-08-25

## Verdict

**Changes-requested** — 1 medium functional defect (approval-status list filter silently no-ops, F1) + 4 minor convention/gap findings (F2–F6). Backend compiles, the touched report test passes, and the frontend typecheck introduces **no new errors** in the F-038 files; the failure is a wired-through filter that does not work end-to-end, plus enforced-convention violations.

## Verification executed (this session)

| Check | Command | Result |
|---|---|---|
| Backend compile | `mvn -DskipTests compile` (MAVEN_HOME `C:\my-tools\apache-maven-3.9.16`) | **PASS** (exit 0) |
| Touched test | `mvn -Dtest=F151ReportHandlerTest test` | **PASS** (exit 0) |
| Frontend typecheck | `npx tsc --noEmit -p tsconfig.app.json` (frontend/) | Baseline RED (~90 pre-existing error files, per knowledge `frontend-tsc-baseline-red--63404d`); **zero matches** for the F-038 touched files (`pages/navigationchannel/*`, `types/navigationChannel.ts`, `services/navigationChannelService.ts`) in the full output → no new errors |
| Review area anchors | all cited below | opened + read this session |

## Findings (anchored)

### F1 — MEDIUM (functional defect): approval-status list filter broken end-to-end (param-name case mismatch)
The list page filters by approval status through `search()`:

- FE sends the query param **`approvalStatus`** — `navigationChannelService.ts` (search params object, `approvalStatus: params?.approvalStatus`), used at `NavigationChannelList.tsx:145` (main list load) and `NavigationChannelList.tsx:172` (per-tab counts, `search({ approvalStatus: s, page: 0, size: 1 })`).
- BE binds the param as **`ApprovalStatus`** — `NavigationChannelController.java:146` `@RequestParam(name = "ApprovalStatus", required = false)`.

Spring MVC binds `@RequestParam(name=...)` case-sensitively against the request parameter map; the value is therefore always `null`, the repository predicate `(:ApprovalStatus IS NULL OR ...)` (`NavigationChannelRepository.java:39`) always matches, and the StatusTabs filter + tab counts silently return ALL records. Violates design §9 AC-038-01 (DS/Lọc trên #47) and WO-BE-10 oracle ("Test filter DS/Lọc").
**Fix:** align one side — either FE param `ApprovalStatus` or BE `@RequestParam(name = "approvalStatus")`.

### F2 — MINOR (enforced convention): non-diacritic Vietnamese error message
`ApprovalRequest.java:21` — `@NotBlank(message = "Trang thai khong duoc de trong")`. Mandates in AGENTS.md ("message/error text PHẢI tiếng Việt có dấu") and design §13 are violated. Fix to `"Trạng thái không được để trống"`.

### F3 — MINOR (enforced convention): hardcoded font-size outside token scale
`NavigationChannelForm.tsx:1027` — `fontSize: 12`. Token scale is 11/13/15/20/28 (AGENTS.md semantic-token rules; design §13). Use a token (`fontSizeSm`/`fontSizeMd`).

### F4 — MINOR (functional gap): `routeCode` (#23) is never populated, and F151 report column depends on it
`ChannelRouteDetailRequest.java` correctly excludes `routeCode` (client write blocked, BR-038-03), but `NavigationChannelService.toRouteDetail` (`NavigationChannelService.java:696-716`) never generates or assigns it either → column stays `NULL` for every new row. Consequence: `F151ReportHandler.java:213` `childItem.put("maTuyenLuong", child.getRouteCode() ...)` always renders empty in the F-151 report. Design §4.2 marks #23 "tự sinh/disabled" — the "tự sinh" half is missing.
**Fix (with BA/SA):** generate `routeCode` per route detail (e.g. `TL.` + seq) in `toRouteDetail`, or explicitly accept NULL and remove the "tự sinh" wording.

### F5 — LOW-MEDIUM (report regression from approved schema drop): F-151 loses Công cộng/Chuyên dùng classification
Child rows no longer emit `congCong`/`chuyenDung` (`F151ReportHandler.java:205-231`); the parent row hardcodes them empty (`F151ReportHandler.java:197`). The old handler derived per-child `congCong` from `publicAccess`/`dedicated` (old assertions removed in `F151ReportHandlerTest.java`). Direct consequence of the design-approved drop of `cong_cong`/`chuyen_dung` (`00-design-plan.md` §4.2 DROP) — but the design's risk table (§12) never named this report, so the dev only fixed compilation. `routeType` (#25, 1 = Công cộng, 2 = Chuyên dùng) could preserve the classification but is not mapped.
**Action:** BA/SA confirm whether F-151 must keep the classification; if yes, map `routeType` → `congCong`/`chuyenDung` in the handler.

### F6 — MINOR (enforced convention): hardcoded enum string
`NavigationChannelService.java:389` and `:399` pass literal `"REJECTED"` into `approvalService.approveC1/C2`. Explicit rule (AGENTS.md, design §13): use `ApprovalStatus.REJECTED.name()`.

### F7 — INFO (deviation, accepted): response omits #58-#71
`NavigationChannelResponse.java` has no `relatedInfrastructure*/operationPlan*/maintenancePlan*/incident*` fields; AC-038-08 oracle says "response trả null có kiểm soát". FE type (`types/navigationChannel.ts`) declares them optional → detail UI renders controlled-empty. Acceptable only because no data source exists yet; document in FE detail blocks rather than inventing placeholders.

### F8 — INFO (design-accepted risk): codegen count includes soft-deleted rows
`NavigationChannelRepository.java:20` `countByOrgUnitId` counts all rows including soft-deleted; the unique partial index is `WHERE deleted_at IS NULL`; the retry-once on `DataIntegrityViolationException` (`NavigationChannelService.java:137-141`) covers the collision. Note: the catch is broader than the code collision (any `DataIntegrityViolationException`, incl. child FK violations, is swallowed and retried in a possibly inconsistent persistence context) — matches the design risk table, low exposure.

## Area-by-area pass/evidence (review dimensions requested)

| Area | Verdict | Anchors |
|---|---|---|
| (a) Data scope | **PASS** | `@DataScope` class-level `NavigationChannelController.java:21`; `@Filter(orgUnitFilter)` `NavigationChannel.java:22`; write-scope `orgUnitScopeService.currentUserScope().allows(...)` on create `NavigationChannelService.java:85-86` and on orgUnit change `:212-213`; `Scope.allows(null)` null-safe `OrgUnitScopeService.java:74-76`; orgUnitId never NULL: `@NotNull` `NavigationChannelCreateRequest.java:31` + migration fail-closed backfill + `SET NOT NULL` (V20260825120000 step 3); `orgUnitName` via `OrgUnitCacheService` `NavigationChannelService.java:553,667` |
| (b) Approval 4-eyes + state machine + session-sourced | **PASS** | `submit()` writes `submittedAt/By` from session `InfrastructureApprovalService.java:139-141`; `approveC1/C2` write `level1/2ApprovalContent` from decision/reason `:121-122,130-131,178-180,188-189` (never from payload); 4-eyes C1≠creator `:166-171`, C2≠C1 `:163-166`, C2≠creator `:168-171`; Rule 14 `:98-109`; state machine DRAFT→PENDING_APPROVAL→APPROVED_LEVEL1→APPROVED + REJECTED_LEVEL1/2 matches design §6.3; create sets DRAFT explicitly `NavigationChannelService.java:126` (overrides `BaseApprovableEntity.java:87-90` PROPOSED default); new endpoints `NavigationChannelController.java:110-141`; history guard `navigationchannel:history` `:148-151` |
| (c) Enums ORDINAL SMALLINT + @FieldNameConstants + no hardcoded strings | **PASS** (except F6) | `ConditionStatus` ORDINAL SMALLINT `NavigationChannel.java:44-46`; `GisGeometryType` `:92-94`; `ApprovalStatus`/`RecordSecurityLevel` ORDINAL SMALLINT `BaseApprovableEntity.java:28-31,44-46`; `@FieldNameConstants` on all new/changed entities+DTOs; `EntityFields.CREATED_AT` used `NavigationChannelService.java:172`; F6 is the single literal-enum-string violation |
| (d) English identifiers / Vietnamese UI text | **PASS** (except F2) | All column/field/param identifiers English (checked entity, DTO, repository, service, `types/navigationChannel.ts`, service layer); UI/messages diacritic Vietnamese (controller toasts, service exceptions, FE labels); F2 is the single offender; `lyDo` at `NavigationChannelForm.tsx:553` is the shared `ApprovalActionBar.tsx:73,78` pre-existing contract, not introduced here |
| (e) Trim inputs + audit operatorId | **PASS** | `trimToNull` on every string field `NavigationChannelService.java:98-127,258-296`; search params trimmed `:486-493`; attachment file names/paths trimmed `:732-752`; `setUpdatedBy(updatedBy)` `:273`; `softDelete(operatorId)` `:336-344`; `uploadedBy(userId)` `:744`; `createdBy` via `@CreatedBy` auditing `BaseEntity.java:104-107` |
| (f) Migration renames/backfill | **PASS** | 9 guarded renames (V20260825120000 step 1); ADD 10 Excel fields + `condition_status SMALLINT NOT NULL DEFAULT 0` + 4 approval columns (step 2); org_unit_id backfill from `users.org_unit_id` with `RAISE EXCEPTION` fail-closed + `SET NOT NULL` (step 3); `channel_code` backfill `'LHH' || LPAD(...,6,'0')` per org unit (step 6); 10 DROPs (step 7); `ux_navigation_channel_org_code UNIQUE (org_unit_id, channel_code) WHERE deleted_at IS NULL` + dashboard index rebuilt + `idx_navigation_channel_org_unit` (step 8); `chi_tiet_tuyen_luong`→`channel_route_detail` guarded rename + 16 column renames + 3 guarded String→NUMERIC casts with regex validation (step 9); `navigation_channel_coordinate` + FK CASCADE + index (step 10); 4 approval columns on the other 4 `BaseApprovableEntity` tables (step 11) |
| (g) DTO excludes #47-#71 | **PASS** | Create/Update requests carry #1-#46 only (no `channelCode`, no workflow/audit/read-only fields) — `NavigationChannelCreateRequest.java`, `NavigationChannelUpdateRequest.java`; 3 required fields `@NotNull` with diacritic messages; child DTOs match §4.2/4.3; response carries #47-#57 read-only (F7 caveat) |

## Caller ripple-fixes — in-scope judgement

**In scope, correctly scoped.** Both were mandatory compile fixes caused by the F-038 entity renames:

- `KchtGis155Service.java:661` — `getNote()` → `getNotes()` (rename `note`→`notes`); 1 line, no behavior change.
- `F151ReportHandler.java` — field renames only (`getLength`→`getChannelLengthKilometers`, `getDredgingVolume`→`getRouteLatestDredgingVolumeCubicMeters`, `getChannelManagementStation`→`getManagementStation`, `getStationAmountt`→`getStationCount`, `getStationArea`→`getStationAreaSquareMeters`, `getLatestStationRepairDate`→`getLatestStationRepairMonth`) + test rewritten to the new model. No unrelated logic touched. The only behavioral consequence is F5 (classification data loss from the approved column drop) — flagged for BA/SA.

## Inspected scope / not covered

- Read this session: design plan (full, 291 lines), migration SQL (full, 333 lines), `NavigationChannel.java`, `ChannelRouteDetail.java`, `NavigationChannelCoordinate.java` + repository, `NavigationChannelRepository.java`, `BaseEntity.java`, `BaseApprovableEntity.java`, `ApprovableEntity.java`, `InfrastructureApprovalService.java`, `NavigationChannelService.java` (full, 755 lines), `NavigationChannelController.java`, all 8 DTOs, `OrgUnitScopeService.java`, `FieldWriteGuard.java` (partial), `KchtGis155Service.java` + `F151ReportHandler.java` diffs + test, `types/navigationChannel.ts`, `services/navigationChannelService.ts`, list/form pages (spot-checked via grep + targeted reads).
- NOT executed: full `mvn test` suite (only the touched test), Flyway migration against a live PostgreSQL (no DB available), runtime/UI behavior (no server run — prohibited), full visual review of the 1078-line form. The status-filter defect (F1) and report regression (F5) are code-read conclusions, not runtime reproductions.

---

# Re-check — 2026-08-25 (post-fix wave)

## Verdict (re-check)

**Pass** — every actionable finding of the original review is closed with current file:line anchors; the one remaining item (F-151 `congCong`/`chuyenDung` classification, original F5) is unchanged and stays an **open, un-decided BA/SA sign-off** — the fix wave introduced **no silent behavior change** to F-151 classification. Backend compiles (`mvn -DskipTests compile` → BUILD SUCCESS) and the new regression suite passes (6/6). Fix wave is present as uncommitted working-tree changes (HEAD `802ee5f4`, M-024 scope) — not yet committed; the review below covers the working tree.

## Verification executed (re-check)

| Check | Command / method | Result |
|---|---|---|
| Backend compile | `C:\my-tools\apache-maven-3.9.16\bin\mvn.cmd -DskipTests compile` | **BUILD SUCCESS** (exit 0; classes up-to-date — matches the fresh compile recorded by the backend-dev stage) |
| Regression suite | `C:\my-tools\apache-maven-3.9.16\bin\mvn.cmd -Dtest=NavigationChannelServiceTest test` | **PASS** — Tests run: 6, Failures: 0, Errors: 0, Skipped: 0 |
| F1 binding chain | grep `RequestParam` / `approvalStatus` / `:ApprovalStatus` across controller, repository, FE service | 0 remaining capital-A param/JPQL binding; full chain lowercase end-to-end |
| F2 / F3 / F6 anchors | grep `NotBlank` / `fontSize:\s*12` / `REJECTED` | each verified at exact lines below |
| BR-038-03 block | read `NavigationChannelService.java:690-719` + `ChannelRouteDetailRequest.java` | routeCode generated server-side; client write still blocked |
| F-151 state | read `F151ReportHandler.java:185-240` + grep `congCong\|chuyenDung\|maTuyenLuong` | unchanged — parent hardcodes empties (`:197-198`), children emit neither (`:205-235`), no `routeType` mapping; child `maTuyenLuong` at `:218` (pre-fix anchor `:213` in original F4 text refers to the ec962a22-era tree, shifted by the field-rename fix wave) |

## Per-finding closure

| Finding | Original anchor | Re-check anchor (current working tree) | Verdict |
|---|---|---|---|
| **F1** approvalStatus camelCase binding (BLOCKING) | `NavigationChannelController.java:146` `name="ApprovalStatus"`; repo predicate `:ApprovalStatus` (`NavigationChannelRepository.java:39`) | `NavigationChannelController.java:146` `@RequestParam(name = "approvalStatus", ...) String approvalStatus` → forwarded `:151`; `NavigationChannelService.java:184-196` converts String → `ApprovalStatus.valueOf()` (guarded try/catch; invalid value → `log.debug` + filter skipped, no exception); `NavigationChannelRepository.java:36` `(:approvalStatus IS NULL OR l.approvalStatus = :approvalStatus)` + `:43` `@Param("approvalStatus") ApprovalStatus approvalStatus`; FE `frontend/src/services/navigationChannelService.ts:36` sends `approvalStatus`. Remaining capital-A occurrences are enum type / derived method name `findByApprovalStatusAndDeletedAtIsNull` only. Regression test `NavigationChannelServiceTest.java:85-89` MockMvc `?approvalStatus=PROPOSED` → **PASS** | **CLOSED** |
| **F2** non-diacritic message | `ApprovalRequest.java:21` `"Trang thai khong duoc de trong"` | `ApprovalRequest.java:21` `@NotBlank(message = "Trạng thái không được để trống")` | **CLOSED** |
| **F3** hardcoded `fontSize: 12` | `NavigationChannelForm.tsx:1027` | grep `fontSize:\s*12\|fontSize:\s*1[0-9]` in `NavigationChannelForm.tsx` → **0 matches**; token `fontSizeSm` imported `:61`, used `:1028` | **CLOSED** |
| **F4 / BR-038-03** routeCode never populated | `NavigationChannelService.java:696-716` no assignment | `NavigationChannelService.java:700-709` — `toRouteDetail`: `sequenceNo == null → index + 1` (`:704-706`), `routeCode = channelCode + "-" + String.format("%02d", sequenceNo)` (`:709`); client write still blocked — `ChannelRouteDetailRequest.java:15,22` has no `routeCode` field. Side benefit: `F151ReportHandler.java:218` (current tree; child `childItem.put("maTuyenLuong", child.getRouteCode() ...)`) now renders real codes. Regression tests `NavigationChannelServiceTest.java:135,147-148` (generation + index fallback) → **PASS** | **CLOSED** |
| **F5** F-151 `congCong`/`chuyenDung` classification (UN-DECIDED) | `F151ReportHandler.java:197,205-231` — parent hardcodes empties, children emit neither | **Unchanged**: `F151ReportHandler.java:197-198` parent `congCong`/`chuyenDung` = `""`; child loop `:205-235` emits neither key and maps no `routeType` (#25). Fix wave touched only the documented field renames. No silent behavior change | **STILL OPEN — un-decided; BA/SA sign-off required** (keep as open finding; do not close without a product decision) |
| **F6** hardcoded `"REJECTED"` | `NavigationChannelService.java:389,399` | `NavigationChannelService.java:390` + `:400` — `approvalService.approveC1/C2(..., ApprovalStatus.REJECTED.name(), ...)`; grep `REJECTED` → exactly 2 matches, both enum-based | **CLOSED** |
| **F7** INFO — response omits #58-#71 | accepted deviation | unchanged, still accepted (no data source exists) | unchanged (INFO) |
| **F8** INFO — codegen count includes soft-deleted | design-accepted risk | unchanged, retry-once still covers collision | unchanged (INFO) |

## Open items / handoff

- **F-151 classification (original F5, brief "F6")** — open product decision, owner **BA/SA**: either accept the loss per the design-approved drop of `cong_cong`/`chuyen_dung` (00-design-plan §4.2) or map `routeType` (#25, 1 = Công cộng, 2 = Chuyên dùng) → `congCong`/`chuyenDung` in `F151ReportHandler`. Code must not be changed on this point until the sign-off lands; verified unchanged in this re-check.
- Not re-executed in this re-check: full `mvn test` suite, Flyway migration against a live PostgreSQL, runtime/UI behavior. F1 is now additionally backed by an executed MockMvc binding test (not merely a code-read conclusion).

---

# Sign-off addendum — 2026-08-25 (BA/SA decision on F-151 classification)

## Finding F5 → CLOSED-BY-SIGNOFF

**Decision (user / BA/SA, chốt 2026-08-25):** **ACCEPT** the loss of `congCong`/`chuyenDung` in the F-151 report — per `design/00-design-plan.md` §4.2 (`docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/design/00-design-plan.md:134` — **DROP:** `cong_cong`, `chuyen_dung`, `pham_vi_bao_ve_luong`; corroborated at `:51` table `a4` and `:173` migration step 9). **Do NOT map** `routeType` (#25) to these two columns. Route classification now lives in `route_classification` (#22) and `route_type` (#25).

- **Finding F5** (original review; "F6" in the dispatch brief — F-151 `congCong`/`chuyenDung` classification loss) → **CLOSED-BY-SIGNOFF**, 2026-08-25. No further review action required.
- **`F151ReportHandler.java` stays as-is — NO code change.** Parent row keeps emitting empty `congCong`/`chuyenDung` keys (`:197-198`) for old-template compatibility; child rows emit neither key. This is now a decided, accepted loss, not an open defect.
- Behavior was verified unchanged in the 2026-08-25 re-check (no silent behavior change); the sign-off resolves the previously un-decided item.
- Remaining non-blocking items from the original review (F7/F8, both INFO) are unaffected by this decision.
