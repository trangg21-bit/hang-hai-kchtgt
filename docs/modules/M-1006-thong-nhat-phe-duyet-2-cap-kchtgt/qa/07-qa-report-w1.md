---
feature-id: M-1006
stage: qa
agent: engineering-qa-engineer
verdict: Ready
wave: 1
last-updated: 2026-08-21
source-of-truth: docs/modules/M-1006-thong-nhat-phe-duyet-2-cap-kchtgt/ba/00-lean-spec.md
---

# QA Report W1 — Acceptance Oracle: Thống nhất quy trình phê duyệt 2 cấp KCHT (M-1006)

## 1. Purpose and method (AUTHORING wave)

This document is the **WAVE-1 acceptance oracle** for M-1006 (unify all 28 KCHT approval functions onto
one 2-level flow: round 1 = Cảng vụ/Chi cục, round 2 = Cục). Wave-2 will **run** the cases below against
the implemented engine and report pass/fail. This wave only authors the oracle — no implementation code
was touched and no tests were executed (document-only).

**Oracle vocabulary (canonical, per design DP-1 "level-completed semantics", SA-chốt):**

| Business state (QUY-TRINH §1) | `ApprovalStatus` (enum value) | Discriminator |
|---|---|---|
| Lưu tạm (Draft) | `DRAFT` (0) | — |
| Chờ Cảng vụ / Chi cục duyệt (waiting round 1) | `PENDING_APPROVAL` (2) | — |
| Chờ Cục duyệt (waiting round 2) | `APPROVED_LEVEL1` (3) | — |
| Bị Cảng vụ / Chi cục trả về (rejected round 1) | `REJECTED_LEVEL1` (user-confirmed — thay `REJECTED` đơn; ordinal chốt khi implement, không xung đột `ARCHIVED(7)`) | log `decision=REJECTED` + `cap=CANG_VU`; entity state tự mang vòng (không cần cột discriminator) |
| Bị Cục trả về (rejected round 2) | `REJECTED_LEVEL2` (user-confirmed — thay `REJECTED` đơn; ordinal chốt khi implement, không xung đột `ARCHIVED(7)`) | log `decision=REJECTED` + `cap=CUC`; entity state tự mang vòng (không cần cột discriminator) |
| Đã duyệt (approved) | `APPROVED` (5) | — |
| Đã xóa (lịch sử) (soft-deleted) | `ARCHIVED` (7) — **new value, added at end of enum, no ordinal change** | `deletedAt`/`deletedBy` set |

`PROPOSED` (1) and `APPROVED_LEVEL2` (4) are **legacy, NOT used** by the unified flow (user-confirmed; DP-1/DP-9).
The single `REJECTED` value is **replaced** by `REJECTED_LEVEL1`/`REJECTED_LEVEL2` as entity states — migration maps existing
`REJECTED` rows via the latest `approval_logs.cap` (`CANG_VU` → `REJECTED_LEVEL1`, `CUC` → `REJECTED_LEVEL2`, no REJECTED log
→ `REJECTED_LEVEL1` default; design §8 item 3).
Round determination is **server-side from entity state only**: `PENDING_APPROVAL` → round 1,
`APPROVED_LEVEL1` → round 2. No `cap` parameter is accepted from any request (MF-02).

**Engine API under test** (design §4.1 — public seam for unit tests):
`submit(currentStatus, entityType, entityId, submittedBy, senderOrgUnitLevel)` ·
`approveLevel1(currentStatus, entityType, entityId, decidedBy, submittedBy)` ·
`rejectLevel1(..., reason)` · `approveLevel2(...)` · `rejectLevel2(..., reason)` ·
`saveAndSubmit(currentStatus, entityType, entityId, operatorId, senderOrgUnitLevel)` ·
`saveAndApprove(currentStatus, entityType, entityId, operatorId)` ·
`softDelete(currentStatus, entityType, entityId, deletedBy)` ·
`directApprove(entityType, entityId, systemActor)`.
All transition methods take **no `cap`** parameter. Every log row asserts
`entityType`, `entityId`, `decision` (`APPROVED`|`REJECTED`|`SUBMIT`), `reason`, `decidedBy`, `decidedAt`,
`cap` (`CANG_VU`|`CUC`) — INSERT-only.

**Permission set (design §7, seeded in `PermissionSeeder.run()`):** `kcht:create`, `kcht:update`,
`kcht:delete`, `kcht:submit`, `kcht:approve_level1`, `kcht:approve_level2`, `kcht:reject`, `kcht:view`,
`kcht:view_sensitive`.

---

## 2. Acceptance-criteria matrix — AC-01..AC-25 (source: lean-spec §11, design §6)

Each row is a Given/When/Then oracle. "4xx" means a client error response; exact code asserted where the
design pins one (`422` for engine `IllegalStateException`, `403` for authorization, `400` for validation).
Vietnamese messages are asserted **verbatim, có dấu** (VR-011).

| ID | Precondition (Given) | Action (When) | Expected observable outcome (Then) | Sources |
|---|---|---|---|---|
| AC-01 | User has `kcht:create` at org unit X; creates KCHT record with `type` + `orgUnitId`, chooses "Lưu tạm" | POST create (or `create` path) | Entity exists with status **`DRAFT`**; **no** `approval_logs` row; record visible only within X's scope (AC-24) | T01, BR-001, VR-001 |
| AC-02 | Entity `DRAFT`; sender belongs to Cảng vụ/Chi cục level (`senderOrgUnitLevel != 1`); all required fields complete | `submit(...)` / "Gửi duyệt" | Status = **`PENDING_APPROVAL`**; exactly **1 `approval_logs` row** with `decision=SUBMIT`, actor + time set, `cap=CANG_VU` | T02/T04, BR-003/007, VR-002 |
| AC-03 | Entity `DRAFT`; **sender belongs to Cục** (`senderOrgUnitLevel == 1`) | `submit(...)` / "Gửi duyệt" | Status = **`APPROVED_LEVEL1`** directly (skips round 1); **never** passes through `PENDING_APPROVAL`; SUBMIT log `cap=CUC` | T03/T05, BR-014, MF-06 |
| AC-04 | Entity `DRAFT`; missing required field(s) | `submit` | **4xx** (400), message **"Chưa điền đủ thông tin bắt buộc"**, status unchanged, **no** SUBMIT log | N03/TC-17, VR-002 |
| AC-05 | Entity `PENDING_APPROVAL`; actor = Cảng vụ/Chi cục leader with `kcht:approve_level1`, **≠ submitter** | `approveLevel1(...)` / "Đồng ý" | Status = **`APPROVED_LEVEL1`**; log row `decision=APPROVED`, `cap=CANG_VU`, actor + time | T06/TC-06, BR-004/008 |
| AC-06 | Entity `PENDING_APPROVAL` | `rejectLevel1(reason)` with `reason.trim().length() >= 10` | Status = **`REJECTED_LEVEL1`** (vòng 1 trả về); `rejectionReason` persisted verbatim; log `decision=REJECTED`, `cap=CANG_VU` | T07/TC-07, BR-005/016 |
| AC-07 | Entity `APPROVED_LEVEL1`; actor = Cục leader with `kcht:approve_level2`, **≠ submitter** | `approveLevel2(...)` / "Đồng ý" | Status = **`APPROVED`**; log `decision=APPROVED`, `cap=CUC` | T08/TC-08, BR-004/008 |
| AC-08 | Entity `APPROVED_LEVEL1` | `rejectLevel2(reason)` | Status = **`REJECTED_LEVEL2`** (vòng 2 trả về); log `decision=REJECTED`, `cap=CUC` | T09/TC-09, BR-005/016 |
| AC-09 | Entity waiting (any round) | `rejectLevel1/2` with reason empty or whitespace-only | **4xx** (422), message **"Lý do từ chối là bắt buộc"** (empty) or **"Lý do từ chối phải có ít nhất 10 ký tự"** (<10 after trim); status unchanged; **no** log | N07/N08/TC-21/22, BR-016, VR-003, MF-09 |
| AC-10 | Entity `PENDING_APPROVAL`; **decider == submitter/creator** (self-approve round 1) | `approveLevel1(...)` | **4xx** (403 or 422; design pins 422 `IllegalStateException`), message **"Bạn không thể phê duyệt bản do chính mình gửi"**; status unchanged; **no** log row | N05/TC-19, BR-015, MF-05 |
| AC-11 | Entity `APPROVED_LEVEL1`; **decider == submitter/creator** (self-approve round 2) | `approveLevel2(...)` | Same as AC-10 (message, status unchanged, no log) | N06/TC-20, BR-015, MF-05 |
| AC-12 | Entity `PENDING_APPROVAL`; actor has `kcht:approve_level2` | `approveLevel2(...)` (skip round — jump straight to APPROVED) | **Blocked** — engine gate N01: message **"Hồ sơ chưa qua duyệt cấp Cảng vụ/Chi cục"**; status unchanged | N01/TC-15, BR-004, MF-04 |
| AC-13 | Entity `APPROVED_LEVEL1` | `approveLevel1` / `rejectLevel1` (reverse round) | **Blocked** — engine gate N02: message **"Hồ sơ đã qua vòng 1, không thể duyệt ngược"**; status unchanged | N02/TC-16, BR-004, MF-04 |
| AC-14 | Entity `REJECTED_LEVEL1` or `REJECTED_LEVEL2` (rejected round 1 or 2) | "Sửa và gửi duyệt lại" → `saveAndSubmit(...)` (caller saves edit + change-log first) | Status = **`PENDING_APPROVAL`** — **always back to round 1** (user-confirmed, kể cả sau khi bị Cục trả về); `change_logs` row contains the edited version | T10/T11/TC-10/11, BR-006, DP-7 |
| AC-15 | Entity `APPROVED`; actor has approval permission | "Lưu và phê duyệt" → `saveAndApprove(...)` | Entity updated; status **stays `APPROVED`** (no re-approval, BR-018); **before-image** recorded in `change_logs` | T12/TC-12, BR-018 |
| AC-16 | Entity `DRAFT` | "Xóa" → `softDelete(...)` | Status = **`ARCHIVED`**, `deletedAt`/`deletedBy` set; row **still in DB**; excluded from normal list queries; cannot submit/approve/edit; DELETE entry in change log | T13/TC-13, BR-017, VR-009 |
| AC-17 | Entity **not** `DRAFT` (waiting/approved/rejected/archived) | "Xóa" → `softDelete(...)` | **Blocked**, message **"Chỉ có thể xóa hồ sơ ở trạng thái Lưu tạm"**; status unchanged | N04/TC-18, BR-017 |
| AC-18 | Valid external integration channel (service-credential/mTLS, not a user endpoint) | `directApprove(...)` pushes record | Status = **`APPROVED`** directly, no 2 rounds, **no user approval log** (system actor only); **not reproducible** via any normal UI/controller path | T14/TC-14, BR-009, R-10 |
| AC-19 | 28 KCHT types | Run AC-01..AC-17 against **each type** (Port, Berth, Pier, DryPort, WaterZone, BeaconLight, Buoy, CoastalStation×5, NavigationChannel, VtsSystem, GIS Point/Line/Polygon, …) | State/transition/validation/history behavior **identical** across types; approval flow has **no per-type branch** | BR-010 |
| AC-20 | Any transition occurs (submit/approve/reject/edit/delete) | Inspect audit tables | `approval_logs` + `change_logs` contain actor + time + (from/to or before-image); `approval_logs` is **INSERT-only**: direct `UPDATE`/`DELETE` on the table fails at DB layer (trigger/REVOKE, MF-07) | BR-007/011/020, MF-07, T-09 |
| AC-21 | User **without** `kcht:approve_level1`/`approve_level2`/`reject` | Call approve/reject endpoint | **403 Forbidden**; no state change | BR-008, MF-03 |
| AC-22 | Admin Cục has `kcht:view_sensitive` | Open record detail (and history/log endpoints) | Extra sensitive fields visible (creator, last-editor, created/updated timestamps); normal user **does not** see them — not even via history | MF (R-12), T-15 |
| AC-23 | User at unit X creates record with `orgUnitId` = unit Y out of scope (or NULL) | Save/submit | **Blocked** (validate scope, `OrgUnitScopeService.allows`); no out-of-scope record persisted; message "Đơn vị quản lý nằm ngoài phạm vi của bạn" | VR-005, MF-06, T-06/T-08 |
| AC-24 | User at unit X opens list | Query list | Sees only records of X + subtree (`orgUnitFilter`/`@DataScope`); Cục with scope_all sees full set | MF-06, T-08 |
| AC-25 | Any record | Inspect current status | Status is always exactly one of the 7 business states (closed set) — enum contains `DRAFT, PENDING_APPROVAL, APPROVED_LEVEL1, APPROVED, REJECTED_LEVEL1, REJECTED_LEVEL2, ARCHIVED` + legacy `PROPOSED`/`APPROVED_LEVEL2` (không dùng); no other value possible | BR-002, DP-2 |

---

## 3. Security requirements matrix — MF-01..MF-09 (source: design §9 + threat-model §6)

| MF | Requirement | Test action (wave-2) | Expected observable outcome | Threat / AC link |
|---|---|---|---|---|
| MF-01 | Remove hardcoded `userId = 1L` from 5 CoastalStation controllers (VTS/LRIT/Inmarsat/Haiphong/CospasSarsat); actor from SecurityContext/JWT | grep repo for `userId = 1L` / `= 1L` in station controllers (expect **0 matches**); run approve/reject with 2 distinct accounts | `approval_logs.decidedBy` = the real JWT principal, never user-1; AC-10/11 pass with the two accounts | T-01 (Critical) |
| MF-02 | Round determined server-side from entity state; no `cap` accepted from request | Send `cap=CUC` in request body against a `PENDING_APPROVAL` entity; also call `approveLevel2` on `PENDING_APPROVAL` | Client `cap` is **ignored**; round follows state → `approveLevel2` on `PENDING_APPROVAL` **blocked** (N01); Berth `submit` → `PENDING_APPROVAL` (never straight `APPROVED_LEVEL1` without round-1 decision) | T-02 (High), AC-03/12 |
| MF-03 | Seed 9 `kcht:*` permissions in `PermissionSeeder.java` + `@PreAuthorize` on every approval endpoint of the 21 files | Run `PermissionSeederTest`/`PermissionSeeder.run()`; assert 9 rows exist in permission tree; call approve endpoint without permission | Missing permission → **403**, status unchanged; permission tree displays all 9 `kcht:*` nodes | T-03 (High), AC-21 |
| MF-04 | Engine gates N01/N02 (no skip / no reverse); reject round 2 requires `kcht:approve_level2` | AC-12/AC-13 tests; additionally: user with **only** `kcht:reject` calls `rejectLevel2` on `APPROVED_LEVEL1` | Skip/reverse blocked (messages AC-12/13); reject round 2 by non-Cục-authority → **403**, no log | T-04 + T-12 (High), AC-12/13 |
| MF-05 | 4-eyes inside engine for both rounds (`decidedBy != submittedBy`/`createdBy`, canonical UUID compare); Berth delegates through engine | Berth self-approve test (creator approves own submission, round 1 and round 2); plus AC-10/11 across port family | **422**, message "Bạn không thể phê duyệt bản do chính mình gửi", **no** log row; comparison on canonical id (no String/int mismatch) | T-05 (High), AC-10/11 |
| MF-06 | `senderOrgUnitLevel` from **principal's** org unit at submit time (never from request/record); write-scope `OrgUnitScopeService.allows`; scope-check `entity.orgUnitId ∈ scope(actor)` before **every** transition | Negative test: subordinate user sets record `orgUnitId` = Cục unit → create/submit **blocked** (AC-23); IDOR test: user at X approves/views record at Y → **blocked**; SUBMIT log `cap` matches principal's level | No round-1 skip via forged orgUnitId (T-06); no cross-unit transition/history read (T-08); AC-02/03/23/24 pass | T-06 + T-08 (High), AC-03/23/24 |
| MF-07 | `approval_logs` INSERT-only enforced at DB layer (trigger `BEFORE UPDATE/DELETE` → exception, or REVOKE); repository exposes read+insert only | Direct `UPDATE`/`DELETE` on `approval_logs` (SQL test / integration) | DB **rejects** UPDATE/DELETE (exception/constraint violation); no `save(existing)`/`delete` path in code | T-09 (High), AC-20 |
| MF-08 | `@Version` optimistic lock on migrated KCHT entity; gate + update in ONE transaction | Concurrency test: 2 parallel approve requests on same `PENDING_APPROVAL` record | Exactly **1** succeeds, the other gets `OptimisticLockException`/conflict; **1** state transition + **1** log row (no double-approve / last-write-wins) | T-10 (High) |
| MF-09 | Engine enforces reject-reason trim ≥ 10 chars in **both** rounds — per-level rejected states `REJECTED_LEVEL1`/`REJECTED_LEVEL2`; delete legacy `approve/reject/resetToPending` callers at wave end | AC-09 test on both rounds; grep repo for remaining callers of legacy `approve`/`reject`/`resetToPending` (expect **0** after closure) | Reject with short/blank reason blocked in both rounds; each reject lands on its round-specific `REJECTED_LEVELn`; no legacy call path bypassing the guard | T-11 (High), AC-09, N07/N08 |

**Additional threat-driven negative cases (design §4.1, threat-model R-07/R-11/R-12):**
- **TOCTOU/replay (R-07):** gate + update share one transaction (covered by MF-08).
- **Input closure (R-11):** `entityType` outside the 28-type whitelist → rejected; `entityId` not a valid UUID → rejected; `reason` > 2000 chars → rejected.
- **T-14 (R-10):** `directApprove` reachable only via integration channel — a user-controller call must never map to it (grep: no user-facing controller endpoint invokes `directApprove`).

---

## 4. Transition-table matrix — T01..T14 (valid) and N01..N11 (forbidden)

Each row = 1 executable case (QUY-TRINH §7 + design §5; statuses are the enum values of §1 above).

### 4.1 Valid transitions

| ID | From | Action (engine method) | To | Guard / expected side effects |
|---|---|---|---|---|
| T01 | (new) | create → `DRAFT` | `DRAFT` | requires `kcht:create`; `orgUnitId` assigned (VR-001/005); no log |
| T02 | (new) | `submit(senderLevel != 1)` | `PENDING_APPROVAL` | SUBMIT log `cap=CANG_VU` |
| T03 | (new) | `submit(senderLevel == 1)` | `APPROVED_LEVEL1` | SUBMIT log `cap=CUC` (rule 14 skip round 1) |
| T04 | `DRAFT` | `submit(senderLevel != 1)` | `PENDING_APPROVAL` | as T02 |
| T05 | `DRAFT` | `submit(senderLevel == 1)` | `APPROVED_LEVEL1` | as T03 |
| T06 | `PENDING_APPROVAL` | `approveLevel1` | `APPROVED_LEVEL1` | gate `PENDING_APPROVAL`; log APPROVED `cap=CANG_VU`; 4-eyes |
| T07 | `PENDING_APPROVAL` | `rejectLevel1(reason)` | `REJECTED_LEVEL1` | reason ≥ 10; log REJECTED `cap=CANG_VU`; `rejectionReason` saved |
| T08 | `APPROVED_LEVEL1` | `approveLevel2` | `APPROVED` | gate `APPROVED_LEVEL1`; log APPROVED `cap=CUC`; 4-eyes |
| T09 | `APPROVED_LEVEL1` | `rejectLevel2(reason)` | `REJECTED_LEVEL2` | log REJECTED `cap=CUC` |
| T10 | `REJECTED_LEVEL1` | `saveAndSubmit(senderLevel != 1)` | `PENDING_APPROVAL` | change log mandatory (DP-7); log SUBMIT |
| T11 | `REJECTED_LEVEL2` | `saveAndSubmit(senderLevel != 1)` | `PENDING_APPROVAL` | **always back to round 1** (AC-14, user-confirmed); change log mandatory |
| T12 | `APPROVED` | `saveAndApprove` | `APPROVED` | before-image into `change_logs`; no re-approval (BR-018) |
| T13 | `DRAFT` | `softDelete` | `ARCHIVED` | `deletedAt`/`deletedBy` set; DELETE change-log entry |
| T14 | (any) | `directApprove` | `APPROVED` | integration channel only (BR-009); no user log |

### 4.2 Forbidden transitions (negative — each MUST be blocked with status unchanged and no spurious log)

| ID | From | Forbidden action | Guard location | Expected message (Vietnamese, verbatim) |
|---|---|---|---|---|
| N01 | `PENDING_APPROVAL` | `approveLevel2` (skip round) | engine `approveLevel2` gate | "Hồ sơ chưa qua duyệt cấp Cảng vụ/Chi cục" |
| N02 | `APPROVED_LEVEL1` | `approveLevel1`/`rejectLevel1` (reverse) | engine `approveLevel1`/`rejectLevel1` gate | "Hồ sơ đã qua vòng 1, không thể duyệt ngược" |
| N03 | `DRAFT` | submit with missing required fields | per-type DTO validation (VR-002) | "Chưa điền đủ thông tin bắt buộc" |
| N04 | ≠ `DRAFT` | `softDelete` | engine `softDelete` gate | "Chỉ có thể xóa hồ sơ ở trạng thái Lưu tạm" |
| N05/N06 | waiting (both rounds) | self-approve (4-eyes) | engine (`decidedBy == submittedBy`) | "Bạn không thể phê duyệt bản do chính mình gửi" |
| N07/N08 | waiting (both rounds) | reject with missing reason | engine reject-reason guard | "Lý do từ chối là bắt buộc" / "Lý do từ chối phải có ít nhất 10 ký tự" |
| N09 | `PENDING_APPROVAL` / `APPROVED_LEVEL1` | edit content (locked while waiting) | per-type update guard (BR-019) | "Hồ sơ đang chờ phê duyệt, không thể sửa" |
| N10 | `APPROVED` | plain `submit` again | `submit` gate (only `saveAndApprove` allowed) | "Hồ sơ đã duyệt, chỉ được sửa bằng 'Lưu và phê duyệt'" |
| N11 | `REJECTED_LEVEL1` / `REJECTED_LEVEL2` | plain `submit` without editing | `submit` gate (only `saveAndSubmit` allowed) | "Hồ sơ bị trả về phải sửa rồi gửi lại" |

---

## 5. Verification commands (wave-2 — exact, package-declared runner)

Run from workspace root `C:\Users\trangtt1\hang-hai-kchtgt` (project is Java/Maven, `pom.xml`; tests live in `src/test/java`):

| # | Command | Purpose | Required result |
|---|---|---|---|
| 1 | `mvn -DskipTests compile` | Compile gate (typecheck) | **exit 0**, BUILD SUCCESS |
| 2 | `mvn test` | Full suite (all existing + new wave-2 tests) | **exit 0**; report `Tests run: N, Failures: 0, Errors: 0` |
| 3 | `mvn -DskipTests package` | Build gate | **exit 0** |
| 4 | `mvn test -Dtest=ApprovalWorkflowServiceTest` | Engine unit tests (T01-T14, N01-N11, 4-eyes, reject-reason, logs) | **exit 0**; focused counts reported |
| 5 | `mvn test -Dtest=PortApprovalServiceTest,BerthRbacSecurityTest,PortRbacSecurityTest` | Port family delegation + RBAC (AC-21) | **exit 0** |
| 6 | `mvn test -Dtest=CoastalStationVTSControllerTest,CoastalStationLRITControllerTest,CoastalStationInmarsatControllerTest,CoastalStationHaiphongControllerTest,CoastalStationCospasSarsatControllerTest` | MF-01 actor-from-context on 5 station controllers | **exit 0**; assert no `1L` literals remain |
| 7 | `mvn test -Dtest=PermissionSeederTest` | MF-03: 9 `kcht:*` seeds | **exit 0**; assert 9 permission rows |
| 8 | `mvn test -Dtest=DataScopeAspectTest,DataScopeCrossUnitContractTest` | AC-23/24 + MF-06 scope | **exit 0** |
| 9 | `mvn test -Dtest=FlywayMigrationTest` | Migration validity (ARCHIVED enum-safe, Berth backfill V121) | **exit 0** |
| 10 | Grep gate: `grep -rn "userId = 1L\|= 1L" src/main/java/com/hanghai/kchtg/station` and grep legacy callers `grep -rn "\.approve(\|\.reject(\|resetToPending" src/main/java` (wave-end closure, MF-01/MF-09) | Static closure criteria | **0 matches** for station `1L`; legacy method callers removed per MF-09 |

> Wave-2 MUST report the exact command, exit code, and focused counts per case class; a passing full suite does not substitute for the focused security/negative runs, and vice versa.

---

## 6. Existing test files to extend + new files required

### Extend (existing files in `src/test/java/com/hanghai/kchtg/`)

| File | Extend for |
|---|---|
| `port/ApprovalWorkflowServiceTest.java` | **Primary engine suite**: T01-T14, N01-N11 guards, 4-eyes (both rounds), reject-reason ≥10 both rounds, log-row assertions (decision/reason/decidedBy/decidedAt/cap), INSERT-only repository surface |
| `port/PortApprovalServiceTest.java` | Delegation of submit/approveLevel1/rejectLevel1/approveLevel2/rejectLevel2 to engine (AC-02..09 on Port) |
| `port/PortRbacSecurityTest.java`, `port/BerthRbacSecurityTest.java` | AC-21 403 without permission; AC-10/11 self-approve on Berth via engine (MF-05) |
| `port/BerthServiceTest.java` | `submit` replaces direct `setApprovalStatus(APPROVED_LEVEL1)` at `:388/:593` (A8) — sender-level round outcome |
| `station/CoastalStation{VTS,LRIT,Inmarsat,Haiphong,CospasSarsat}ControllerTest.java` | MF-01 actor from SecurityContext; split `/approve-l1` `/approve-l2` `/reject` endpoints; 403 without `kcht:*` |
| `config/PermissionSeederTest.java` | MF-03: 9 `kcht:*` permissions seeded, idempotent re-run |
| `security/DataScopeAspectTest.java`, `security/DataScopeCrossUnitContractTest.java` | AC-23/24 + MF-06 scope checks on approval transitions and history reads |
| `migration/FlywayMigrationTest.java` | ARCHIVED enum (no ordinal change), `V121__normalize_berth_approval_status.sql` backfill correctness |
| `beacon/BuoyServiceTest.java`, `beacon/BeaconLightServiceTest.java` | B1/B2: String status → `ApprovalStatus`, approveL1/L2 via engine, no jump straight to APPROVED |
| `port/WaterZoneServiceTest.java`, `port/PierServiceTest.java`, `port/DryPortServiceTest.java` | Delegation parity (AC-19 sample types) |

### New files REQUIRED (no existing coverage — hard gaps)

| New file (suggested location `src/test/java/com/hanghai/kchtg/...`) | Covers |
|---|---|
| `gis/point/PointObjectServiceTest.java`, `gis/line/LineObjectServiceTest.java`, `gis/polygon/PolygonObjectServiceTest.java` | **GIS cluster (B8-B10) has ZERO tests today** — AC-19 requires per-type parity for the 3 GIS types; internal enums removed, approveL1/L2 via engine, GIS sync after L2 |
| `engine/ApprovalEngineConcurrencyTest.java` | MF-08: 2 parallel approvals on same record → exactly 1 transition + 1 log, other fails with optimistic-lock/conflict |
| `engine/ApprovalLogDbIntegrityTest.java` | MF-07/AC-20: direct UPDATE/DELETE on `approval_logs` fails at DB layer (trigger/REVOKE) |
| `engine/DirectApproveChannelTest.java` | AC-18/T-14/R-10: `directApprove` via integration channel only; no user controller path maps to it |
| `security/ViewSensitiveResponseTest.java` | AC-22/T-15: sensitive fields visible to Admin Cục (`kcht:view_sensitive`) only, incl. history/log endpoints |

---

## 7. Gap list — criteria WITHOUT an executable oracle yet (wave-2 must resolve)

| ID | Gap | Why / what is missing | Wave-2 action |
|---|---|---|---|
| AC-19 (28-type parity) | **No executable oracle for the full 28-type set** | Only a subset of types has tests (port family, station, beacon); **GIS Point/Line/Polygon have zero test files**; NavigationChannel/VtsSystem/other types have no approval tests either | Create the 3 GIS test files (above) + a parametrized per-type harness or extend existing per-type suites to cover all 28; the oracle "identical behavior" is only checkable per type |
| AC-22 (view_sensitive) | Oracle defined but **no response-mapper test exists** | Sensitive-field filtering must be asserted at the shared mapper + history endpoints | New `ViewSensitiveResponseTest` (above) |
| AC-18 (directApprove) | Oracle defined but **no integration-channel harness exists** | Requires a service-credential/mTLS test seam | New `DirectApproveChannelTest` (above) |
| AC-20 (INSERT-only, DB layer) | Oracle defined but **no DB-level trigger test exists** | Requires SQL-level UPDATE/DELETE attempt against `approval_logs` | New `ApprovalLogDbIntegrityTest` (above) + confirm trigger/REVOKE in migration |
| AC-25 (closed 7-state set) | Oracle defined but **`ARCHIVED(7)` + `REJECTED_LEVEL1`/`REJECTED_LEVEL2` do not exist in the enum yet** (Cluster A work order A1 + migration design §8 item 3) | Wave-2 runs against post-implementation code; until A1 + reject-split migration land, AC-25, AC-06/08, T07/T09, T13/N04 cannot pass | Gate wave-2 on A1 + migration landing; assert enum closed set via reflection/integration test |
| MF-08 (@Version) | **Dependency outside the 21-file write scope** — design §9 MF-08 notes adding `@Version` is an entity change requiring orchestrator assignment | Concurrency test will fail if the entity has no version column | Confirm orchestrator assigned the entity/migration work before wave-2 runs the concurrency case; otherwise report Blocked on this criterion |
| AC-19/NFR | No existing suite runs `mvn test` in the exact CI environment; all counts must be re-measured | — | Wave-2 records focused + full counts as evidence |

**Note on T-07/T-11 (resolved — user-confirmed):** re-submit after rejection **always re-enters round 1** (`saveAndSubmit` → `PENDING_APPROVAL`), regardless of which round rejected the record and regardless of sender level (design §5 T10/T11 + AC-14, user-confirmed). The former "senderLevel == 1 unpinned" ambiguity is **decided** and removed from the gap list; wave-2 asserts `PENDING_APPROVAL` for both `REJECTED_LEVEL1` and `REJECTED_LEVEL2` re-submits.

---

## 8. Coverage summary (traceability)

| Oracle group | Cases | Source anchors |
|---|---|---|
| Acceptance criteria | AC-01..AC-25 (25) | lean-spec §11 (Given/When/Then), design §6 |
| Security must-fix | MF-01..MF-09 (9) | design §9 MF table, threat-model §6 closure criteria |
| Valid transitions | T01..T14 (14) | QUY-TRINH §7 + lean-spec §4.1 + design §5 |
| Forbidden transitions | N01..N11 (11) | lean-spec §4.2 + design §5 negative table |
| Threats mapped to tests | T-01..T-16 | threat-model §3 + R-01..R-12 |
| Total cases | 25 + 9 + 14 + 11 = **59** (plus threat-driven negatives) | — |

Every AC, every MF, and every T/N row has a concrete input/action/expected-observable-outcome in this
document. The hard gaps (AC-19 full parity, AC-22, AC-18, AC-20 DB-layer, MF-08 dependency) are listed
in §7 and require either new test files (wave-2) or an orchestrator assignment (MF-08 @Version).
