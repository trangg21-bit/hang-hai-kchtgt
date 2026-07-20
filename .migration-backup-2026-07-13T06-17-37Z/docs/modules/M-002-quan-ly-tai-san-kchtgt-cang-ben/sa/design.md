---
feature-id: M-002
document: lean-architecture
output-mode: lean
last-updated: 2026-06-27
verdict: Ready for Technical Lead planning
---

# Architecture: Quản lý tài sản KCHTGT - Cảng & Bến (M-002)

## Summary

Module M-002 triển khai 5 entity tài sản (CangBien, BenCang, CauCang, CangCan, VungNuoc) theo một shared CRUD + approval-workflow pattern dùng chung, với mỗi entity có lifecycle state machine độc lập (cho_phe_duyet → hien_hanh / chinh_sua / da_xoa) và audit trail bất biến. Pattern này tái sử dụng BaseEntity UUID/soft-delete hiện có, FormApprovalHistory pattern từ module statistics, và RBAC 8-role hiện có, chỉ bổ sung permission resource mới (cangbien/bencang/caucang/cangcan/vungnuoc) với action set (create/read/update/delete/approve/history).

---

## System Boundaries

| Service / Module | Responsibility | Owns | Calls | Exposes |
|---|---|---|---|---|
| `com.hanghai.kchtg.cangben` (new package) | CRUD + approval workflow 5 entity tài sản | CangBien, BenCang, CauCang, CangCan, VungNuoc, LichSuThayDoi, PheDuyetLog entities | `common.AuditLog`, `user.Permission`, MinIO (file attach) | REST `/api/v1/cang-bien`, `/api/v1/ben-cang`, `/api/v1/cau-cang`, `/api/v1/cang-can`, `/api/v1/vung-nuoc` |
| `com.hanghai.kchtg.common` (existing) | BaseEntity, AuditLog, soft-delete | UUID PK, deletedAt, createdAt/updatedAt | — | BaseEntity, AuditLog |
| `com.hanghai.kchtg.user` (existing) | RBAC | Role, Permission, UserPermissionOverride | — | `@PreAuthorize("hasPermission(...)")` |
| MinIO (existing infra) | File attachment storage | Binary files (PDF/DOCX/JPEG) | — | S3-compatible presigned URL |
| `com.hanghai.kchtg.notification` (to be confirmed) | In-system notification kết quả phê duyệt | Notification records | — | Notification API (detail: open question Q-001) |

---

## Integration Model

| Integration | Type | Contract | Timeout | Retry | Idempotent |
|---|---|---|---|---|---|
| RBAC permission check | Sync (in-process Spring Security) | `@PreAuthorize("hasPermission(#resource, #action)")` via `PermissionAuthorizationManager` | N/A | N/A | Yes |
| AuditLog write | Sync (same transaction) | `AuditLogRepository.save(AuditLog)` per operation; actor, action, metadata JSON, ipAddress | N/A | N/A | Yes (transactional) |
| MinIO file upload | Sync HTTP (S3 API) | Multipart upload; MIME validation before send; max 10MB per file | 30s | 2 retries | Yes (object key = entity-id + filename hash) |
| Notification (approval result) | Async (to be decided — Q-001) | TBD — see open questions | TBD | TBD | TBD |
| LichSuThayDoi write | Sync (same transaction as entity update) | Insert per-field change record; no UPDATE/DELETE allowed | N/A | N/A | Yes (transactional) |
| PheDuyetLog write | Sync (same transaction as approval action) | Insert immutable log; no UPDATE/DELETE allowed | N/A | N/A | Yes (transactional) |

---

## Data Architecture

| Entity | Owner | Storage | Consistency | Migration needed |
|---|---|---|---|---|
| CangBien | cangben package | PostgreSQL table `cang_bien` | Strong (transactional CRUD + audit in 1 TX) | Yes — new Flyway migration V14+ |
| BenCang | cangben package | PostgreSQL table `ben_cang` | Strong; FK → `cang_bien.id` (NOT NULL) | Yes |
| CauCang | cangben package | PostgreSQL table `cau_cang` | Strong; FK → `ben_cang.id` (NOT NULL) | Yes |
| CangCan | cangben package | PostgreSQL table `cang_can` | Strong; independent (no FK to CangBien) | Yes |
| VungNuoc | cangben package | PostgreSQL table `vung_nuoc` | Strong; FK → `cang_bien.id` (NOT NULL) | Yes |
| LichSuThayDoi | cangben package | PostgreSQL table `lich_su_thay_doi` | Strong; FK → parent entity; INSERT-only | Yes |
| PheDuyetLog | cangben package | PostgreSQL table `phe_duyet_log` | Strong; FK → parent entity; INSERT-only | Yes |
| GiayTo (file attachment) | cangben package | PostgreSQL metadata table `giay_to` + MinIO binary | Eventual (file upload outside TX; link stored after success) | Yes |

### Entity hierarchy
```
CangBien (36 records, code VN-36)
├── BenCang (301 records, code VN-301) [many-to-one → CangBien]
│   └── CauCang (614 records, code VN-614) [many-to-one → BenCang]
├── VungNuoc (77 records, code VN-77) [many-to-one → CangBien]
CangCan (14 records, code VN-14) [independent]
```

### Approval state machine (shared across all 5 entity types)
```
[TaoMoi/CapNhat] → cho_phe_duyet
   cho_phe_duyet + APPROVE → hien_hanh
   cho_phe_duyet + REJECT  → chinh_sua
   hien_hanh / chinh_sua + CapNhat → cho_phe_duyet
   hien_hanh / chinh_sua + Xoa → da_xoa  (soft delete, deletedAt set)
   da_xoa: terminal — no further transitions allowed except admin restore (out of scope)
```

### Key schema decisions
- PK: UUID (consistent with `common.BaseEntity`)
- Soft delete: `deleted_at IS NULL` filter via `@SQLRestriction` (already on BaseEntity)
- Business code (maCang, maBenCang, etc.): separate `code` column, unique constraint, immutable after create
- `LichSuThayDoi`: columns — `entity_type` (ENUM), `entity_id` (UUID FK), `field_name`, `old_value`, `new_value`, `changed_by`, `changed_at`; no `deleted_at` (INSERT-only, not extends BaseEntity)
- `PheDuyetLog`: columns — `entity_type`, `entity_id`, `decision` (APPROVE/REJECT), `reason` (nullable for approve, NOT NULL for reject), `decided_by`, `decided_at`; INSERT-only
- `GiayTo`: columns — `entity_type`, `entity_id`, `file_name`, `mime_type`, `file_size`, `minio_key`, `uploaded_by`, `uploaded_at`

---

## Security

| Concern | Approach | Standard |
|---|---|---|
| Auth/authz | JWT bearer token already enforced by Spring Security filter chain; RBAC via `@PreAuthorize` per endpoint; permission codes: `cangbien:create`, `cangbien:read`, `cangbien:update`, `cangbien:delete`, `cangbien:approve`, `cangbien:history` (same pattern × 5 entities) | RBAC 3-tier, existing pattern |
| Role mapping | ROLE_SPECIALIST: create/read/update/history (own org-unit); ROLE_ADMIN: read/history; ROLE_LEADER: read/approve/history; ROLE_PORT_OPERATOR: read only; ROLE_SYSTEM_ADMIN: all actions, all org-units; ROLE_PUBLIC_USER: no access to M-002 | Seeder to be updated with new permissions |
| Org-unit filter | ROLE_SPECIALIST and ROLE_PORT_OPERATOR scoped to org-unit: service layer applies `WHERE org_unit_id IN (user.orgUnitIds)` for list/create; ROLE_SYSTEM_ADMIN and ROLE_LEADER bypass filter | Consistent with existing M-001 pattern |
| Immutable audit log | `PheDuyetLog` and `LichSuThayDoi` tables: no UPDATE or DELETE endpoints exposed; Spring Security `@PreAuthorize` blocks delete actions; DB-level: no ON DELETE CASCADE from parent to audit tables | BR-004, AC-010/F-011 |
| PII/secrets | No PII fields in M-002 entities; geographic coordinates and administrative data only | N/A |
| Trust boundary | Single trust boundary: Nginx → Spring Boot service; no external calls for core CRUD; MinIO upload within internal network | TLS enforced on Nginx |
| File attachment validation | MIME type validation via Apache Tika (content-based, not extension-based) before MinIO upload; allowed: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, image/jpeg; max 10MB | BA requirement F-032 BR-008 |
| Input sanitization | Bean Validation annotations (`@NotBlank`, `@Pattern`, `@Range`) on all DTOs; `GlobalExceptionHandler` strips stack traces from 4xx/5xx responses | OWASP Anti-injection |

---

## Deployment

| Concern | Approach |
|---|---|
| Env vars needed | `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET_GIAY_TO` — already expected in existing config; confirm bucket name for M-002 attachments |
| Migration | Flyway scripts V14–V20 (or next available): create tables `cang_bien`, `ben_cang`, `cau_cang`, `cang_can`, `vung_nuoc`, `lich_su_thay_doi`, `phe_duyet_log`, `giay_to`; add permissions to seeder |
| Rollback plan | Flyway undo scripts for V14–V20; no structural change to existing tables means rollback is isolated; MinIO bucket can be emptied independently |
| Feature flag | None required — new package with no changes to existing code paths |

---

## NFR Architecture

| NFR-ref | Solution | Target | Trade-off |
|---|---|---|---|
| Performance (all CRUD APIs) | Single-service, single-DB query path; eager load only immediate parent ID (not full hierarchy); pagination mandatory on list endpoints (default page=20) | ≤ 2s p95 per BA specs | Lazy-loading child counts via separate query to avoid N+1 |
| Reliability (audit atomicity) | `LichSuThayDoi` + `PheDuyetLog` writes in same `@Transactional` as entity mutation; if audit insert fails, full rollback | 100% consistency | Slightly higher TX latency; acceptable for operational frequency |
| Availability | Stateless Spring Boot service already HA via 2 App Servers + Nginx LB; no session state introduced by M-002 | ≥ 90% / year per NFR spec | — |
| Audit retention | `audit_log` and `lich_su_thay_doi` records: no `deleted_at` column, no soft-delete; `LogCleanupScheduler` must explicitly exclude these tables | 2 years per state regulation | Scheduler config change needed (open item) |
| OWASP compliance | Bean Validation + GlobalExceptionHandler + HTTPS already enforced; file MIME validation added for attachment endpoints | OWASP Top 10 | — |

---

## Key Decisions

| Decision | Chosen | Rejected | Rationale |
|---|---|---|---|
| Audit trail mechanism | Dedicated `LichSuThayDoi` table (per-field, per-change INSERT) | Event sourcing; Envers/Hibernate history | Event sourcing is over-engineered for 5 entities at this scale. Envers requires schema dependency. Dedicated table is explicit, queryable, and consistent with `FormApprovalHistory` pattern already in codebase. |
| Approval log immutability | Application-layer enforcement (no DELETE/UPDATE API + `@PreAuthorize`) + INSERT-only table (no BaseEntity inheritance) | DB-level trigger / row-level security | RLS requires PostgreSQL config change and adds ops complexity. App-layer enforcement is auditable via code review and simpler for the team. |
| Notification mechanism | Async via existing notification infrastructure (TBD — Q-001) | Synchronous inline during approval TX | Inline sync notification risks TX timeout if notification service is slow. Async decouples concerns; polling ≤ 30s from BA NFR is achievable with async. |
| Package structure | New `com.hanghai.kchtg.cangben` package with sub-packages per entity type | One class per entity at top-level | Consistent with existing package-per-domain pattern (statistics, tai, user, etc.); keeps M-002 bounded and independently refactorable. |
| File attachment storage | MinIO (existing infra) with metadata in PostgreSQL `giay_to` table | DB BLOB; direct filesystem | MinIO is already provisioned. DB BLOB creates backup complexity. Filesystem violates HA requirement (2 app servers). |
| Shared vs per-entity approval workflow | Single `PheDuyetLog` table with `entity_type` discriminator | Separate approval table per entity | 5 tables would be identical schema. Single table with discriminator is DRY, no migration overhead per new entity type; queryable across types. |
| Code generation strategy | Business code (maCang etc.) is user-provided OR system-generated with retry (max 3 attempts for uniqueness) | UUID as business code | Business codes follow national standards (VN-36, VN-77 etc.) and must be human-readable for regulatory reporting. |

---

## Open Technical Questions

| ID | Question | Why It Matters | Suggested Owner | Blocking? |
|---|---|---|---|---|
| Q-001 | Is there an existing notification service/table in the codebase? F-011/F-017/F-023/F-029/F-035 all require "thông báo kết quả phê duyệt đến người tạo". BA spec references "cơ chế notification nội bộ đã có sẵn". | Approval completion flow depends on this. Async vs sync design decision. | sdlc-tech-lead (search codebase for notification package) | Non-blocking (approval core works without notification; notification is additive) |
| Q-002 | VungNuoc BA spec (F-032/F-035) mentions "quy trình phê duyệt hai cấp (phòng → Cục)" — but F-011 (CangBien approval) specifies single-level approval (BR-003). Are approval levels consistent across all 5 entity types or does VungNuoc differ? | If VungNuoc requires 2-level approval, the state machine and `PheDuyetLog` schema must differ. | sdlc-ba (clarify with stakeholder) | Non-blocking (can implement single-level first; extend if confirmed) |
| Q-003 | `LogCleanupScheduler` in `common/scheduler` — does it currently target `audit_log` only, or would it accidentally purge `lich_su_thay_doi` / `phe_duyet_log` tables? BA requires 2-year retention. | Data loss risk if scheduler is configured generically. | sdlc-tech-lead | Non-blocking (add exclusion during implementation) |
| Q-004 | MSSQL vs PostgreSQL: `tech-brief.md` specifies MSSQL Server 2022, but `BaseEntity` uses Hibernate + JPA with `@SQLRestriction` (Hibernate 6 annotation) and `common.BaseEntity` uses `LocalDateTime` — code appears to be PostgreSQL-compatible. Confirm actual target DB. | Schema migration scripts (Flyway V14+) syntax differs between MSSQL and PostgreSQL. | sdlc-tech-lead (read `application.properties` for datasource URL) | Non-blocking (write Flyway scripts for whichever DB is active; note: existing migrations use SQL without MSSQL-specific syntax so likely PostgreSQL) |

---

## SA → Handoff Summary

**Verdict:** Ready for Technical Lead planning — 0 blocking open questions.

**Selected architecture approach:** New `cangben` package in the existing Spring Boot monolith, following the existing BaseEntity/soft-delete/RBAC/AuditLog patterns. Five entity types share a single approval workflow pattern (`PheDuyetLog` with `entity_type` discriminator) and per-field change history (`LichSuThayDoi`). File attachments stored in existing MinIO infra with PostgreSQL metadata table.

**Ownership boundaries:** `com.hanghai.kchtg.cangben` owns all 5 entity aggregates, their lifecycle state machines, and audit tables. `common` package owns BaseEntity (unchanged). `user` package owns RBAC (new permissions seeded, no structural change). MinIO bucket for GiayTo is M-002-specific.

**Integration model:** Synchronous REST CRUD with in-transaction audit writes. Approval state transition + PheDuyetLog in one atomic transaction. File upload to MinIO outside transaction (with rollback on failure). Notification to approval requester is async (mechanism TBD Q-001 — non-blocking).

**Security constraints for dev:** All endpoints require JWT; RBAC enforced via `@PreAuthorize` with new permission codes `{entity}:{action}`; org-unit filter for SPECIALIST and PORT_OPERATOR roles; no DELETE or UPDATE operations on PheDuyetLog or LichSuThayDoi tables; file MIME validation via content-based inspection (not extension).

**Migration/compatibility guardrails:** New tables only (V14+ Flyway); no changes to existing tables; `LogCleanupScheduler` must exclude new audit tables; `RolePermissionSeeder` extended with ~30 new permission codes (idempotent by existing logic).

**Open technical questions (non-blocking):** Q-001 notification mechanism; Q-002 VungNuoc approval levels; Q-003 log cleanup scheduler scope; Q-004 DB type confirmation.
