---
module-id: M-002
module-name: "Quan ly tai san KCHTGT - Cang & Ben"
final-verdict: "Changes requested"
confidence: high
features-reviewed: 30
shard-verdict-distribution:
  Pass: 0
  Pass-with-followups: 1
  Changes-requested: 4
  Blocked: 0
cross-feature-integration:
  contract-violations:
    - "orgUnitId declared as String in ALL 5 entities but DB schema (V14–V22) types org_unit_id as UUID — runtime PSQLException on any filtered-list call across module"
    - "userId sourced from @RequestParam in ALL 5 approval controllers — single shared impersonation vector that bypasses BUG-RBAC-001 fix"
    - "ChangeHistoryService.insertChangeRecord() is a log-only stub (no INSERT) — all getHistory endpoints return empty for entities that call it rather than LichSuThayDoiService"
  shared-entity-conflicts:
    - "BaseEntity.createdBy/updatedBy typed String(VARCHAR 36) but primary key is UUID — type inconsistency across entire module"
    - "CangBienService, CauCangService, VungNuocService: zero calls to LichSuThayDoiService.recordChanges(); BenCangService and CangCanService call it but the double-findById pattern means no old-snapshot so diff is always empty"
  unflagged-cross-impacts:
    - "VungNuocService.findAll() accepts orgUnitId param but NOT cangBienId — parent-filter drop is a repository signature mismatch not just a controller oversight; fix requires VungNuocRepository.findAllActive() extension"
    - "CauCangService has no grandparent guard: CauCang.create() sets benCangId from request without verifying BenCang exists and is HIEN_HANH — orphan CauCang records can be created for non-existent or inactive BenCang"
    - "F-017 reject() dispatches to approve() via null reason-check — while functionally equivalent now, the approve path state-machine logic could diverge in future patches creating silent regression"
    - "update() unconditionally resetting approval to CHO_PHE_DUYET (CauCang) is an undocumented business rule change; not verified against BA requirements — could permit low-privilege user to trigger re-approval loop"
reviewed-at: "2026-06-29T05:00:00Z"
---

## Module-Level Findings (integrator value-add)

### Cross-Feature Integration Issues

These issues span ALL entities and cannot be fixed per-shard; each requires a single shared-code change.

**INT-001 — orgUnitId String-vs-UUID (severity: HIGH, scope: shared)**
All 5 entity Java classes declare `private String orgUnitId` (confirmed in source). All 5 migration scripts (V14–V22) define `org_unit_id UUID`. Any repository query filtering by org unit will throw `PSQLException: column is of type uuid but expression is of type character varying` at runtime. This is a single-point fix: change entity field type to UUID across all entities + update any DTO/mapper that serialises the field.
Affected features: F-008 through F-037 (all list/filter endpoints).

**INT-002 — userId impersonation via @RequestParam (severity: CRITICAL, scope: shared)**
All 6 approval/rejection controllers (CangBien, BenCang, CauCang, CangCan, VungNuoc, GiayTo) accept `@RequestParam String userId`. The BUG-RBAC-001 fix applied to RBAC enforcement but did not close this impersonation vector. Fix: extract userId from `Authentication principal` (Spring Security context) in a shared approval utility, remove the @RequestParam from all approval endpoints.
Affected features: F-011, F-017, F-023, F-029, F-035, F-036.

**INT-003 — Change-history not persisted (severity: HIGH, scope: shared)**
Two distinct sub-bugs interact:
1. `ChangeHistoryService.insertChangeRecord()` contains only a `log.debug()` + return stub (confirmed in source, line 43-49 of ChangeHistoryService.java). No DB INSERT happens.
2. `CangBienService`, `CauCangService`, `VungNuocService` do not call `LichSuThayDoiService.recordChanges()` at all; `BenCangService` and `CangCanService` call it but via double-findById update pattern which yields oldEntity == newEntity, so diff is always empty.
All getHistory endpoints (F-013, F-019, F-025, F-031, F-037) return empty lists in production.
Fix path: (a) wire `LichSuThayDoiService.recordChanges()` into the three missing services; (b) fix update() methods to snapshot entity before mutation; (c) retire or fix `ChangeHistoryService` stub.

**INT-004 — VungNuoc parent-filter silently dropped (severity: HIGH, scope: VungNuoc)**
`VungNuocController.findAll()` accepts `@RequestParam(required=false) UUID cangBienId` but passes only `orgUnitId` to `VungNuocService.findAll(int, int, String)`. The service calls `vungNuocRepository.findAllActive(orgUnitId, pageable)` — no cangBienId parameter. F-036 filter is non-functional; users see all VungNuoc regardless of parent CangBien selection.
Fix: add `Optional<UUID> cangBienId` to service + repository query.

**INT-005 — CauCang grandparent guard absent (severity: HIGH, scope: CauCang)**
`CauCangService.create()` sets `benCangId` from request DTO without verifying that BenCang exists and has `trangThai = HIEN_HANH`. Any caller can create CauCang under a deleted or unapproved BenCang, violating hierarchical integrity of the asset tree. Fix: load BenCang by id, assert HIEN_HANH before persist.

### Shard Majority Vote Decisions

All 5 shards returned "Changes requested" or "Approved with follow-ups". VungNuoc+GiayTo shard returned "Approved with follow-ups" — however, INT-001, INT-002, INT-003, and INT-004 apply to VungNuoc features as well. The integrator-level promotion to "Changes requested" for the module applies; VungNuoc follow-up items remain follow-ups after mandatory fixes are applied.

No shard disagreement requiring row-35 auto-pass vote was observed.

### Release Readiness

- documentation: partial — Javadoc stale (V18 references on V22 schema); YeuCauPheDuyet entity referenced in spec but absent from codebase
- qa: partial — CangBien and BenCang have direct tests (77 total); CauCang, CangCan, VungNuoc, GiayTo have zero entity-level tests; RBAC deny-path tested only for cangbien:approve/delete
- release: blocked — INT-001 through INT-005 are runtime-breaking or security-critical before any deployment

---

## Per-Feature Summary (rolled up from shards)

| Feature Cluster | Entity | Shard Verdict | Must-Fix Count | Cross-Impact Resolved? |
|---|---|---|---|---|
| F-008 to F-013 | CangBien | Changes requested | 2 shard + INT-001/002/003 | Requires shared fixes |
| F-014 to F-019 | BenCang | Changes requested | 3 shard + INT-001/002/003 | Requires shared fixes |
| F-020 to F-025 | CauCang | Changes requested | 4 shard + INT-001/002/003/005 | Requires shared fixes + INT-005 |
| F-026 to F-031 | CangCan | Changes requested | 4 shard + INT-001/002/003 | Requires shared fixes |
| F-032 to F-037 | VungNuoc+GiayTo | Approved w/followups | 2 shard + INT-001/002/003/004 | Requires shared fixes + INT-004 |

---

## Must-Fix (module-level, integrator-added)

The items below are not attributable to any single shard and must be tracked at module level:

1. **[INT-001] orgUnitId String-vs-UUID** — change field type to UUID in all 5 entity classes; update mappers and DTOs. Scope: shared, single-point fix. Affected: F-008–F-037.

2. **[INT-002] userId @RequestParam impersonation** — replace with `Authentication` principal extraction in all 6 approval/reject controller methods (CangBienController, BenCangController, CauCangController, CangCanController, VungNuocController, GiayToController). Scope: shared, security-critical.

3. **[INT-003a] ChangeHistoryService stub** — implement actual INSERT in `ChangeHistoryService.insertChangeRecord()` or remove it and route all callers to `LichSuThayDoiService`. Scope: shared service.

4. **[INT-003b] History not wired: CangBienService, CauCangService, VungNuocService** — inject `LichSuThayDoiService` and call `recordChanges()` in create/update/delete. Scope: 3 services.

5. **[INT-003c] Double-findById no-snapshot bug** — all update() methods that do `findById()` → mutate → save without storing a snapshot of the pre-mutation entity produce empty history diffs. Fix in BenCangService and CangCanService (and any others when INT-003b is applied). Scope: shared pattern, per-service fix.

6. **[INT-004] VungNuoc cangBienId filter dropped** — propagate `cangBienId` through service + repository; add `findAllActive(orgUnitId, cangBienId, pageable)` overload. Scope: VungNuoc bounded context.

7. **[INT-005] CauCang grandparent guard** — add BenCang existence + HIEN_HANH check in `CauCangService.create()`. Scope: CauCang bounded context.

---

## Shard Must-Fix Items (carried forward for dev-wave)

These are per-shard findings that dev-wave must also resolve alongside the integrator items above:

**CangBien (F-013/F-011):**
- F-011: approver userId @RequestParam — covered by INT-002
- F-013: history not written — covered by INT-003b/c

**BenCang (F-017/F-018/F-015):**
- F-017: reject() dispatches through approve() — refactor reject path to own method
- F-018: orgUnitId String-vs-UUID — covered by INT-001
- F-017: userId impersonation — covered by INT-002

**CauCang (F-023/F-020/F-024/zero tests):**
- F-023: userId impersonation — covered by INT-002
- F-020: grandparent guard — covered by INT-005
- F-024: orgUnitId mismatch — covered by INT-001
- Zero CauCang tests — must add before wave closes

**CangCan (F-027/F-030/F-029/zero tests):**
- F-027: double-findById no-snapshot — covered by INT-003c
- F-030: userId impersonation — covered by INT-002
- F-029: reject reason missing @Size(min=10) — add validation annotation (BR-003)
- Zero CangCan tests — must add before wave closes

**VungNuoc+GiayTo (F-036/F-032-F-033):**
- F-036: cangBienId filter dropped — covered by INT-004
- F-032/F-033: orgUnitId mismatch — covered by INT-001
- Zero VungNuoc/GiayTo tests — follow-up (not blocking if INT items resolved)
- MinIO upload stub — follow-up item

---

## Follow-up Path

Verdict = "Changes requested" → skill body dispatches dev-wave-3 for `rework_features` set only. All other features (no new must-fix items) hold at current state.

After dev-wave-3, re-run reviewer shards on the rework set before re-integration.

Cross-module: BUG-RBAC-001 app-wide regression recommended before release (29 controllers across M-001/M-007/M-009); tracked separately by sdlc-security. Not a blocker for M-002 dev-wave-3 start.
