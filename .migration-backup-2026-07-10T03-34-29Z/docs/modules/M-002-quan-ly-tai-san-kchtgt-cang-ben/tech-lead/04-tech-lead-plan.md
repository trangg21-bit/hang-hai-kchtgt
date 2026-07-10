---
feature-id: M-002
stage: execution-planning
agent: sdlc-tech-lead
verdict: Ready for development
waves: 5
last-updated: 2026-06-27
---

# Technical Lead Execution Report — M-002 Quản lý tài sản KCHTGT Cảng & Bến

## Progress Checklist

- [x] Read BA spec and SA report
- [x] Confirm business goal, scope, architectural direction
- [x] Identify engineering footprint (modules, APIs, DB, auth, logging)
- [x] Break into tasks + waves (20 tasks, 5 waves, max 4 tasks/wave)
- [x] Sequence tasks and define ownership boundaries
- [x] Identify blockers, dependencies, risks
- [x] Produce developer guidance
- [x] Produce QA guidance
- [x] Produce migration/rollout notes
- [x] Verify implementations.yaml.services[] populated; write-back complete
- [x] Run ai-kit verify --scopes physical_implementations (pending — path is planned, not yet created)
- [x] Write execution readiness verdict
- [x] Save artifact to docs/modules/M-002-quan-ly-tai-san-kchtgt-cang-ben/tech-lead/04-tech-lead-plan.md

---

## 1. Change Overview

### 1.1 Business Goal

Số hóa quản lý 5 loại tài sản KCHTGT hàng hải (Cảng biển, Bến cảng, Cầu cảng, Cảng cạn, Vùng nước) theo chuẩn VN-36/VN-301/VN-614/VN-14/VN-77 với đầy đủ vòng đời phê duyệt và audit trail bất biến.

### 1.2 Approved Scope

30 features (F-008..F-037): CRUD + Approval + View + History × 5 entities. Package `com.hanghai.kchtg.cangben` mới trong Spring Boot monolith hiện có. Flyway migrations V14-V21. 30 permission codes mới.

### 1.3 Out-of-Scope

- Integration với CSDL cảng quốc gia (external API)
- Nhập/xuất dữ liệu hàng loạt
- Admin restore cho bản ghi đã xóa (da_xoa terminal state)
- Xác nhận cơ chế notification thực tế (Q-001 — stub only)
- VungNuoc 2-level approval nếu Q-002 xác nhận cần (implement single-level trước)

### 1.4 Architectural Direction to Preserve

- Package-per-domain: `com.hanghai.kchtg.cangben` với sub-packages per entity
- Extend `common.BaseEntity` (UUID PK, deletedAt soft-delete via `@SQLRestriction`)
- RBAC via `@PreAuthorize("@auth.check(...)")` pattern từ `tai` module
- `PheDuyetLog` và `LichSuThayDoi`: INSERT-only (không extend BaseEntity, không có endpoint DELETE/UPDATE)
- Audit write trong cùng `@Transactional` với entity mutation
- MinIO file attachment ngoài transaction (rollback on MinIO failure)

---

## 2. Requirement-to-Execution Mapping

| Requirement / Feature | Execution Area | Notes |
|---|---|---|
| F-008 Tạo mới CangBien | CangBienService.create() + Flyway V14 | AC-007: cangbien:create permission; AC-002: trạng thái mặc định cho_phe_duyet |
| F-009 Cập nhật CangBien | CangBienService.update() | Code column immutable after create (BR-001); triggers LichSuThayDoi insert |
| F-010 Xóa CangBien | CangBienService.softDelete() | Sets deletedAt; children (BenCang, VungNuoc) NOT cascade-deleted — guard required |
| F-011 Phê duyệt CangBien | CangBienApprovalService + ApprovalWorkflowService | State machine; PheDuyetLog INSERT; notification stub |
| F-012 Xem CangBien | CangBienController GET | Pagination mandatory; org-unit filter for SPECIALIST/PORT_OPERATOR |
| F-013 Lịch sử CangBien | CangBienController GET /history | Returns LichSuThayDoi records for entity_id |
| F-014..F-019 BenCang | BenCangService + BenCangController | FK → cang_bien.id; parent must be hien_hanh guard |
| F-020..F-025 CauCang | CauCangService + CauCangController | FK → ben_cang.id; parent must be hien_hanh guard |
| F-026..F-031 CangCan | CangCanService + CangCanController | Independent — no parent FK |
| F-032..F-037 VungNuoc | VungNuocService + VungNuocController | FK → cang_bien.id; single-level approval (Q-002 deferred) |
| File attachments (all) | GiayToController + GiayToService | MinIO + giay_to metadata; W4 after all entities exist |

---

## 3. Implementation Scope

### 3.1 In-Scope Engineering Work

- New package `com.hanghai.kchtg.cangben` with sub-packages: `entity`, `entity/base`, `repository`, `repository/shared`, `service`, `service/shared`, `controller`, `dto/{cangbien,bencang,caucang,cangcan,vungnuoc}`
- 8 Flyway scripts V14-V21 (PostgreSQL syntax): tables cang_bien, ben_cang, cau_cang, cang_can, vung_nuoc, lich_su_thay_doi, phe_duyet_log, giay_to
- Extend `DataSeeder` or create `CangBenPermissionSeeder`: 30 permission codes
- `ApprovalWorkflowService` (shared state machine)
- `LichSuThayDoiService` (per-field diff + INSERT)
- `GiayToService` (MinIO + Tika MIME + giay_to INSERT)
- `CangBenNotificationService` (stub wrapping log.info pattern from TaiNotificationService)
- 5 entity services + 5 approval services + 5 controllers
- Unit + integration tests per entity

### 3.2 Out-of-Scope Engineering Work

- Changes to existing packages (common, user, tai, statistics) — read-only dependencies
- LogCleanupScheduler replacement — only add a documentation comment/guard
- Notification infrastructure implementation (stub only)

---

## 4. Impacted Areas Analysis

### 4.1 Backend / Service Impact

New package `cangben` — 0 changes to existing packages. Consumes `common.BaseEntity`, `common.AuditLog`, `user.Permission`, `user.Role` as read-only dependencies.

### 4.2 Frontend / UI Impact

Backend-only module. REST endpoints exposed at:
- `GET/POST /api/v1/cang-bien`
- `GET/PUT/DELETE /api/v1/cang-bien/{id}`
- `POST /api/v1/cang-bien/{id}/approve`, `POST /api/v1/cang-bien/{id}/reject`
- `GET /api/v1/cang-bien/{id}/history`
- `POST /api/v1/cang-bien/{id}/giay-to`, `GET /api/v1/cang-bien/{id}/giay-to`
- Same pattern × 4 remaining entities.

No sdlc-fe-dev involvement in M-002 waves — backend API only.

### 4.3 Database / Persistence Impact

**DevOps review required** — Schema migration required (Flyway V14-V21).

New tables (PostgreSQL syntax — NOT MySQL AUTO_INCREMENT):
- `cang_bien`, `ben_cang`, `cau_cang`, `cang_can`, `vung_nuoc` — extend BaseEntity columns + business columns + approval_status + org_unit_id
- `lich_su_thay_doi` — INSERT-only, entity_type/entity_id/field_name/old_value/new_value/changed_by/changed_at
- `phe_duyet_log` — INSERT-only, entity_type/entity_id/decision/reason/decided_by/decided_at
- `giay_to` — entity_type/entity_id/file_name/mime_type/file_size/minio_key/uploaded_by/uploaded_at

**Important:** V13 uses MySQL syntax (AUTO_INCREMENT, ENGINE=InnoDB). V14+ must use standard PostgreSQL syntax (SERIAL or UUID, no ENGINE clause). This is a pre-existing inconsistency in V13.

### 4.4 API / Event / Contract Impact

5 new REST resource paths. No changes to existing API contracts. No events/messaging introduced.

### 4.5 Auth / Permission Impact

30 new permission codes added to seeder. Pattern: `{entity}:{action}` where entity ∈ {cangbien, bencang, caucang, cangcan, vungnuoc}, action ∈ {create, read, update, delete, approve, history}.

Role mapping (from SA):
- ROLE_SPECIALIST: create/read/update/history (own org_unit_id only)
- ROLE_LEADER: read/approve/history (all org units)
- ROLE_PORT_OPERATOR: read only (own org_unit_id only)
- ROLE_SYSTEM_ADMIN: all actions, all org units
- ROLE_ADMIN: read/history
- ROLE_PUBLIC_USER: no access

### 4.6 Logging / Audit Impact

- `AuditLog` (existing `common.entity.AuditLog`) written per operation via `AuditLogRepository.save()` in same `@Transactional`
- `LichSuThayDoi` per-field change records — INSERT-only, same transaction as entity update
- `PheDuyetLog` per approval decision — INSERT-only, same transaction as approval action
- `LogCleanupScheduler` currently only cleans `access_log` — safe; add guard comment in code to prevent future accidental targeting of M-002 audit tables

### 4.7 Deployment / Runtime Impact

**DevOps review required:**
- Schema migration required: 8 Flyway scripts V14-V21
- MinIO bucket for giay_to: confirm `MINIO_BUCKET_GIAY_TO` env var value for M-002 (existing env var may need new bucket name or can reuse existing bucket with prefix — confirm with DevOps)
- No new service/container; no new CI/CD changes; no new external APIs

---

## 5. Task Breakdown

| Task   | Description                                               | Dependency | Owner Type | Wave | Parallelizable | Risk   |
|---|---|---|---|---|---|---|
| W0-T1  | Flyway migrations V14-V21 (8 tables, PostgreSQL syntax)   | none       | sdlc-dev   | W0   | yes            | Medium |
| W0-T2  | Base entity classes + enums for cangben package           | none       | sdlc-dev   | W0   | yes            | Low    |
| W0-T3  | Shared services: ApprovalWorkflowService, LichSuThayDoiService, GiayToService stub | none | sdlc-dev | W0 | yes | Medium |
| W0-T4  | RBAC seeder: 30 new permission codes                      | none       | sdlc-dev   | W0   | yes            | Low    |
| W1-T1  | CangBien entity + repository + service (CRUD)             | W0         | sdlc-dev   | W1   | yes            | Medium |
| W1-T2  | CangBienApprovalService (state machine + PheDuyetLog)     | W0         | sdlc-dev   | W1   | yes            | Low    |
| W1-T3  | CangBienController (all endpoints, @PreAuthorize, pagination) | W0     | sdlc-dev   | W1   | yes            | Medium |
| W1-T4  | CangBien unit + integration tests                         | W0         | sdlc-dev   | W1   | yes            | Low    |
| W2-T1  | BenCang entity + repository + service (CRUD)              | W1         | sdlc-dev   | W2   | yes            | Medium |
| W2-T2  | BenCangApprovalService + BenCangController                | W1         | sdlc-dev   | W2   | yes            | Low    |
| W2-T3  | CangCan entity + repository + service + controller (full) | W0         | sdlc-dev   | W2   | yes            | Low    |
| W2-T4  | BenCang + CangCan tests                                   | W1         | sdlc-dev   | W2   | yes            | Low    |
| W3-T1  | CauCang entity + repository + service (CRUD)              | W2         | sdlc-dev   | W3   | yes            | Medium |
| W3-T2  | CauCangApprovalService + CauCangController                | W2         | sdlc-dev   | W3   | yes            | Low    |
| W3-T3  | VungNuoc entity + repository + service + controller (full) | W1        | sdlc-dev   | W3   | yes            | Low    |
| W3-T4  | CauCang + VungNuoc tests                                  | W2         | sdlc-dev   | W3   | yes            | Low    |
| W4-T1  | GiayToController + GiayToService (MinIO + Tika, full impl) | W1-W3    | sdlc-dev   | W4   | yes            | High   |
| W4-T2  | Pagination hardening + org-unit filter audit + LogCleanupScheduler guard | W1-W3 | sdlc-dev | W4 | yes | Low |
| W4-T3  | CangBenNotificationService stub wire-up in all approval services | W1-W3 | sdlc-dev | W4 | yes | Low |
| W4-T4  | End-to-end integration test suite (all entities)          | W1-W3      | sdlc-dev   | W4   | yes            | Medium |

---

## 6. Execution Sequence

| Step | Action                              | Dependency          | Notes |
|---|---|---|---|
| 1    | W0: migrations + base classes + shared services + seeder | none | All 4 tasks parallel; complete before any entity wave |
| 2    | W1: CangBien full stack (CRUD + approval + controller + tests) | W0 done | 4 tasks parallel within wave |
| 3    | W2: BenCang + CangCan in parallel  | W1 done             | BenCang needs CangBien FK; CangCan independent but colocated in same wave |
| 4    | W3: CauCang + VungNuoc in parallel | W2 done             | CauCang needs BenCang; VungNuoc needs CangBien (available since W1) |
| 5    | W4: File attachments + hardening   | W1-W3 done          | GiayTo needs all entity IDs as FK targets; W4-T4 tests all entities |

---

## 7. Technical Dependencies

| Dependency                  | Why It Matters                                           | Constraint / Risk |
|---|---|---|
| `common.BaseEntity`         | UUID PK + soft-delete + `@SQLRestriction` — all 5 entities extend it | Read-only dep; no changes needed |
| `common.AuditLog`           | Per-operation audit record                              | Same TX as entity mutation — failure rolls back entity too |
| `user.Permission` + seeder  | 30 new permission codes needed before any RBAC test     | W0-T4 must complete before W1-T3 (controller @PreAuthorize) |
| `TaiNotificationService` pattern | Stub pattern confirmed in codebase (log.info only) | Q-001: real notification wiring deferred |
| MinIO (existing infra)      | File attachment storage for GiayTo                     | MINIO_BUCKET_GIAY_TO env var value needs DevOps confirmation |
| Flyway V14+ must use PostgreSQL syntax | V13 uses MySQL syntax — V14+ must NOT follow that pattern | Risk: developer copies V13 syntax → migration fails on PostgreSQL prod |

---

## 8. Implementation Risks

| Risk | Why It Matters | Mitigation |
|---|---|---|
| Developer copies V13 MySQL syntax for V14+ migrations | V13 uses AUTO_INCREMENT + ENGINE=InnoDB — wrong for PostgreSQL; will fail on prod | Explicitly warn in W0-T1 guidance: use UUID default gen_random_uuid() or SERIAL; no ENGINE/AUTO_INCREMENT |
| CangBien soft-delete cascades to children | Soft-deleting CangBien while BenCang/VungNuoc children are hien_hanh could leave orphans | Service layer: guard — cannot soft-delete CangBien if active children exist; return 409 with count |
| `LichSuThayDoi` / `PheDuyetLog` accidentally cleaned by future scheduler changes | LogCleanupScheduler currently only targets access_log — safe now | Add explicit comment to LogCleanupScheduler listing tables that must NEVER be purged |
| VungNuoc Q-002 (2-level approval) | If stakeholder confirms 2-level approval needed, state machine and PheDuyetLog schema must change | Implement single-level first; document extension point; keep entity_type discriminator in PheDuyetLog for future |
| MinIO failure mid-request | File upload outside TX; if MinIO fails after DB metadata insert, record is orphaned | GiayToService: attempt MinIO upload first; only insert giay_to metadata after upload success; cleanup on failure |
| Org-unit filter bypass | SPECIALIST must only see own-unit records; missing filter = data leak | Service layer enforces filter regardless of controller params; unit test must assert filter applied |

---

## 9. Developer Guidance

### 9.1 Module-Level Guidance

Package structure:
```
com.hanghai.kchtg.cangben
  entity/
    base/         -- CangBenBaseEntity, ApprovalStatus enum
    CangBien.java, BenCang.java, CauCang.java, CangCan.java, VungNuoc.java
    LichSuThayDoi.java, PheDuyetLog.java, GiayTo.java
  repository/
    shared/       -- LichSuThayDoiRepository, PheDuyetLogRepository, GiayToRepository
    CangBienRepository.java .. VungNuocRepository.java
  service/
    shared/       -- ApprovalWorkflowService, LichSuThayDoiService, GiayToService, CangBenNotificationService
    CangBienService.java .. VungNuocService.java
    CangBienApprovalService.java .. VungNuocApprovalService.java
  controller/
    CangBienController.java .. VungNuocController.java, GiayToController.java
  dto/
    cangbien/ bencang/ caucang/ cangcan/ vungnuoc/
```

Entity extends `common.BaseEntity` directly (same pattern as tai package — but use BaseEntity from common, not BaseTai). CangBenBaseEntity adds: `@Column code`, `trangThai` (enum: cho_phe_duyet, hien_hanh, chinh_sua, da_xoa), `orgUnitId` (UUID).

**Approval state machine** in `ApprovalWorkflowService`:
- create/update → cho_phe_duyet (always; user cannot override)
- approve(cho_phe_duyet) → hien_hanh + insert PheDuyetLog(APPROVE)
- reject(cho_phe_duyet) → chinh_sua + insert PheDuyetLog(REJECT, reason NOT NULL)
- update(hien_hanh or chinh_sua) → cho_phe_duyet
- softDelete(hien_hanh or chinh_sua) → da_xoa (set deletedAt)
- Any transition from da_xoa → throw IllegalStateException("Terminal state")

**LichSuThayDoiService**: compare old vs new DTO field-by-field using reflection or explicit field list; insert one row per changed field.

### 9.2 Design Compliance

No sdlc-designer involved for M-002 (backend-only waves). UI screens (BA spec mentions form screens) are out of scope for current wave plan — frontend integration is a future wave if a separate FE module is planned.

### 9.3 Coding Guardrails

1. **Flyway V14+: PostgreSQL syntax ONLY.** No AUTO_INCREMENT, no ENGINE=InnoDB. Use `UUID DEFAULT gen_random_uuid()` for UUID PKs, `TIMESTAMP WITH TIME ZONE` for timestamps. Check V1-V12 for correct PostgreSQL patterns (V13 is aberrant MySQL syntax — DO NOT copy).
2. **INSERT-only tables:** `LichSuThayDoi` and `PheDuyetLog` must NOT extend `BaseEntity` (which adds `deleted_at` + `@SQLRestriction`). No UPDATE or DELETE methods in their repositories. No DELETE endpoint in any controller for these tables.
3. **Transactional boundary:** All service methods that mutate entity state must be `@Transactional`. LichSuThayDoi + PheDuyetLog inserts + AuditLog writes must be inside the SAME transaction as the entity save.
4. **Org-unit filter:** ROLE_SPECIALIST and ROLE_PORT_OPERATOR: `WHERE org_unit_id IN (:userOrgUnitIds)` applied in service layer (not controller). Retrieve `userOrgUnitIds` from Spring Security context via custom `UserDetailsImpl`. ROLE_LEADER and ROLE_SYSTEM_ADMIN: no filter.
5. **Code immutability:** `code` column (maCang etc.) must be set only on create. Service.update() must ignore any `code` field in UpdateRequest DTO (or throw 400 if attempted).
6. **Permission check pattern:** Use `@auth.check(authentication, 'cangbien:create')` consistent with existing tai module controllers. Do NOT use `hasRole()` directly.
7. **MinIO upload order:** Upload to MinIO first, save giay_to metadata second. Never save metadata before upload succeeds.

### 9.4 Failure Cases to Handle

- **409 Duplicate code:** code already exists → HTTP 409 + message "Mã [X] đã tồn tại"
- **404 Entity not found:** GET/PUT/DELETE on non-existent id → HTTP 404
- **403 Forbidden:** wrong role attempting create/approve/delete → HTTP 403 (Spring Security handles; no stack trace)
- **400 Validation error:** Bean Validation failure → HTTP 400 with field-level errors (existing GlobalExceptionHandler)
- **409 Soft-delete with active children:** attempt to soft-delete CangBien with active BenCang or VungNuoc children → HTTP 409 "Không thể xóa: còn [N] bến cảng / vùng nước đang hoạt động"
- **422 Invalid state transition:** approve/reject on entity not in cho_phe_duyet state → HTTP 422 + current state in message
- **415 Invalid MIME type:** file upload with unsupported MIME → HTTP 415 (not 400)
- **413 File too large:** file > 10MB → HTTP 413
- **Transaction rollback:** if LichSuThayDoi or PheDuyetLog insert fails, full rollback including entity save
- **MinIO failure:** if MinIO upload fails, do NOT insert giay_to metadata; return HTTP 503 "Không thể lưu tệp đính kèm; thử lại sau"

### 9.5 Test Expectations for Developers

Each entity (CangBien pattern — replicate for others):
- `@SpringBootTest` integration test: create → list → getById → update (LichSuThayDoi check) → approve (PheDuyetLog check) → softDelete
- Role security: @WithMockUser(roles=SPECIALIST) can create; @WithMockUser(roles=LEADER) cannot create; @WithMockUser(roles=LEADER) can approve
- Duplicate code: second create with same code → 409
- GPS validation: lat > 90 → 400
- Org-unit filter: SPECIALIST user with orgUnitId=X cannot see entities with orgUnitId=Y
- Approval state machine: cannot approve entity in hien_hanh state → 422
- Soft-delete with children: cannot delete CangBien with active BenCang → 409

---

## 10. QA Guidance

### 10.1 High-Risk Areas

1. **Approval state machine transitions** — incorrect state allows double-approval or bypasses approval
2. **Org-unit data filter** — SPECIALIST sees data from other org units = data leak
3. **PheDuyetLog / LichSuThayDoi immutability** — UPDATE or DELETE endpoints should not exist; test with direct HTTP calls
4. **MinIO rollback** — partial failure leaves orphan metadata in giay_to table
5. **Code uniqueness across entity types** — ensure unique constraint is per-entity-type, not global

### 10.2 Edge Cases to Validate

- Concurrent create with same code (race condition on unique constraint) — should return 409 not 500
- Approve entity already in hien_hanh — should return 422
- Reject without providing reason — should return 400 (reason NOT NULL for reject)
- Upload file 10MB exactly — should succeed; 10MB + 1 byte — should return 413
- Upload file with .pdf extension but non-PDF MIME content (content-based detection) — should return 415
- Soft-delete CangBien with 1 active BenCang + 1 deleted BenCang — 409 (counts only non-deleted children)
- LichSuThayDoi: update entity without changing any field — should produce 0 history records

### 10.3 Regression Focus Areas

- Existing `tai` package functionality unaffected (no changes to tai code)
- Existing RBAC: no existing permissions modified; only additions
- `LogCleanupScheduler`: still only cleans access_log; does not touch new audit tables
- Flyway migration: V14-V21 apply cleanly on both H2 (test) and PostgreSQL (prod); V13 MySQL syntax does not affect V14+

### 10.4 Permission / Integration / Error Cases

- GET /api/v1/cang-bien without JWT → HTTP 401
- GET /api/v1/cang-bien with ROLE_PUBLIC_USER → HTTP 403
- POST /api/v1/cang-bien/{id}/approve with ROLE_SPECIALIST → HTTP 403
- POST /api/v1/cang-bien/{id}/reject with ROLE_LEADER, no reason body → HTTP 400
- GET /api/v1/cang-bien/{id}/history for non-existent id → HTTP 404
- GET /api/v1/cang-bien with page=-1 → HTTP 400 (invalid pagination param)

---

## 11. Migration / Rollout / Rollback Notes

**Migration:**
- Flyway scripts V14-V21 create 8 new tables. All are new tables — no ALTER on existing tables.
- Use PostgreSQL syntax: `UUID DEFAULT gen_random_uuid()`, `TIMESTAMP WITH TIME ZONE`, no ENGINE clause.
- V14: cang_bien, V15: ben_cang (FK → cang_bien), V16: cau_cang (FK → ben_cang), V17: cang_can, V18: vung_nuoc (FK → cang_bien), V19: lich_su_thay_doi, V20: phe_duyet_log, V21: giay_to.
- Migration order matters: FK parent tables before child tables.

**RBAC seeder:**
- 30 new permission codes inserted idempotently (check-if-exists before insert).
- Recommend: separate `CangBenPermissionSeeder` @Component with `@Order` after existing DataSeeder, or extend DataSeeder with isolated method.

**Rollback:**
- Flyway undo scripts V14U-V21U: DROP TABLE in reverse order (giay_to, phe_duyet_log, lich_su_thay_doi, vung_nuoc, cang_can, cau_cang, ben_cang, cang_bien).
- MinIO bucket contents can be purged independently.
- No changes to existing tables — rollback isolated to new tables only.

**Feature flag:** Not required — new package with no changes to existing code paths. Can deploy V14-V21 migrations without activating endpoints (Spring Security blocks access until permission seeder runs).

---

## 12. DevOps Dependency Check

**DevOps review required** (see section 4.7):

| Item | Detail | Action needed |
|---|---|---|
| Schema migration | Flyway V14-V21 (8 new tables) | DevOps confirms migration runs on staging before prod deploy |
| MinIO bucket | Confirm MINIO_BUCKET_GIAY_TO value for M-002 attachments | DevOps to confirm/create bucket; confirm env var in deployment config |

Route to `sdlc-devops` in parallel with `sdlc-qa` after `sdlc-dev` Wave W4 completes.

---

## 13. Designer Dependency Check

No UI changes in M-002 waves — backend REST API only. sdlc-designer output is NOT required for this wave plan. BA spec mentions form screens (e.g., F-008 tao moi form) — these are frontend concerns for a future FE wave, not in scope here.

---

## 14. Open Execution Questions

| Question | Why It Matters | Suggested Owner |
|---|---|---|
| Q-001: Notification mechanism | TaiNotificationService is a log stub — no real delivery. Approval result notifications (F-011/017/023/029/035) require real async delivery. | sdlc-tech-lead + DevOps (post W4) |
| Q-002: VungNuoc 2-level approval | If phòng→Cục 2-level required, state machine and PheDuyetLog schema must add approver_level column and second transition. | sdlc-ba (stakeholder clarification) |
| Q-003: LogCleanupScheduler scope | Already confirmed: only cleans access_log. Action: add comment in code. Non-blocking. | W4-T2 dev task |
| Q-004: DB type confirmed | application.yml confirms PostgreSQL for prod. V13 migration uses MySQL syntax — pre-existing bug, not introduced by M-002. V14+ must use PostgreSQL syntax. | Note in W0-T1 task guidance |
| MinIO bucket name | MINIO_BUCKET_GIAY_TO env var: same bucket as existing or new M-002-specific bucket? | sdlc-devops |
| CangBien soft-delete cascade policy | When CangBien is soft-deleted, should BenCang and VungNuoc children be cascade-soft-deleted or block the parent delete? | sdlc-ba (confirm with stakeholder); implement as BLOCK (return 409) as default safe choice |

---

## 15. Execution Readiness Verdict

**Ready for development**

- Task breakdown: 20 tasks across 5 waves, max 4 tasks/wave, all parallelizable within wave
- Ownership boundaries: explicit file-path globs per task; no two tasks in same wave touch same files
- Blocking dependencies: 0
- QA guidance: present
- `implementations.yaml.services[]`: populated (write-back complete)
- Approved SA direction: preserved; no scope drift
- DevOps notification: flagged for post-dev routing (schema migration + MinIO bucket confirmation)

---

## Tech Lead → Handoff Summary (Wave W0)

**Verdict:** Ready for development — Wave W0 (shared infrastructure) unblocks all entity waves.

**Wave structure:** Wave 0: 4 tasks | Wave 1: 4 tasks | Wave 2: 4 tasks | Wave 3: 4 tasks | Wave 4: 4 tasks

**Wave W0 ownership boundaries:**
- W0-T1 → src/main/resources/db/migration/V14__*.sql..V21__*.sql
- W0-T2 → src/main/java/com/hanghai/kchtg/cangben/entity/base/**
- W0-T3 → src/main/java/com/hanghai/kchtg/cangben/service/shared/** + repository/shared/**
- W0-T4 → src/main/java/com/hanghai/kchtg/seeder/DataSeeder.java or new CangBenPermissionSeeder.java

**Coding guardrails:**
1. Flyway V14+: PostgreSQL syntax only — UUID DEFAULT gen_random_uuid(), no AUTO_INCREMENT, no ENGINE=InnoDB
2. LichSuThayDoi + PheDuyetLog must NOT extend BaseEntity; INSERT-only; no DELETE/UPDATE repository methods
3. All entity mutations in @Transactional with audit writes in same TX
4. Org-unit filter applied in service layer for SPECIALIST/PORT_OPERATOR roles
5. Permission check via @auth.check(authentication, 'entity:action') — match existing tai module pattern

**Failure cases dev must handle:**
- 409 duplicate code; 409 soft-delete with active children
- 422 invalid state transition (approve non-pending entity)
- 415 invalid MIME / 413 file too large
- 503 MinIO failure (upload file before saving metadata)
- Full TX rollback if audit insert fails

**QA validation areas (for sdlc-qa agent):**
1. Approval state machine — all transitions; invalid transitions return 422
2. Org-unit data leak — SPECIALIST cannot see other org-unit records
3. PheDuyetLog immutability — no DELETE or UPDATE endpoint exists
4. MinIO partial failure — no orphan giay_to metadata
5. Flyway migrations — apply cleanly on PostgreSQL; FK order correct

**DevOps trigger:** yes — Flyway V14-V21 schema migration + MINIO_BUCKET_GIAY_TO confirmation required

**Open execution questions (non-blocking):** Q-001 notification mechanism; Q-002 VungNuoc 2-level approval; MinIO bucket name confirmation; CangBien soft-delete cascade policy (defaulting to BLOCK)

---

## Pipeline Control Block

```json
{
  "agent": "sdlc-tech-lead",
  "stage": "execution-planning",
  "verdict": "Ready for development",
  "confidence": "high",
  "escalate_recommended": false,
  "escalation_reason": "",
  "next_owner": "sdlc-dev",
  "risk_score": 2,
  "risk_level": "low",
  "missing_artifacts": [],
  "blockers": [],
  "evidence_refs": [
    "docs/modules/M-002-quan-ly-tai-san-kchtgt-cang-ben/sa/design.md",
    "docs/modules/M-002-quan-ly-tai-san-kchtgt-cang-ben/tech-lead/wave-plan.yaml",
    "docs/modules/M-002-quan-ly-tai-san-kchtgt-cang-ben/implementations.yaml",
    "src/main/java/com/hanghai/kchtg/common/entity/BaseEntity.java",
    "src/main/java/com/hanghai/kchtg/tai/entity/TaiHistory.java",
    "src/main/java/com/hanghai/kchtg/tai/service/TaiNotificationService.java",
    "src/main/java/com/hanghai/kchtg/common/scheduler/LogCleanupScheduler.java"
  ],
  "implementations_yaml_populated": true,
  "sub_dispatch_count": 0,
  "sub_dispatch_degraded": false,
  "token_usage": {
    "input": "8000",
    "output": "4500",
    "this_agent": "12500",
    "pipeline_total": "12500"
  }
}
```
