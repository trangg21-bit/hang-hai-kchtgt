---
feature-id: M-003
features: F-038..F-067
document: lean-architecture
output-mode: sa-design
last-updated: "2026-07-01"
verdict: Ready for Technical Lead planning
tier: pro
pipeline-path: L
risk-score: 3
security-extended-role: true
---

# Lean Architecture Design (AS-BUILT) — M-003 Quản lý tài sản KCHTGT - Khu nước & VTS

Module: **M-003**
Features: **F-038..F-067** (30 features across 5 asset domains)
Stack: Spring Boot 3 / Java 17, MSSQL Server 2022, Flyway, MinIO, Nginx, ReactJS 18

---

## Section 1 — Change Overview

### 1.1 Business Problem

Quản lý toàn bộ vòng đời (tạo mới, cập nhật, phê duyệt 2 cấp, xóa, lịch sử) cho 5 nhóm tài sản kết cấu hạ tầng giao thông thủy:

1. Lượng hàng hải (F-038..F-043)
2. Đê/Kè (F-044..F-049)
3. Cơ sở sửa chữa & đóng tàu (F-050..F-055)
4. Trạm radar (F-056..F-061)
5. Hệ thống VTS (F-062..F-067)

### 1.2 Goal

Cung cấp registry số hoá cho 5 loại tài sản, với workflow phê duyệt 2 cấp bắt buộc và audit trail đầy đủ trước khi dữ liệu được chính thức ghi nhận.

### 1.3 Scope

**In Scope (AS-BUILT):**
- 5 bounded contexts (packages): luonghanghai, deke, cosuachua, tramradar, vts
- CRUD + soft-delete + 2-level approval workflow trên mỗi domain
- Attachment management qua MinIO (đường dẫn lưu trong DB)
- Approval history (PheDuyetLichSu) per domain
- RBAC via Spring Security @PreAuthorize + custom `@auth.check`

**Out of Scope (Phase 1 exclusion):**
- GeoServer / GIS map integration (referenced in DESIGN docs; NOT implemented in code)
- Notification (email/SMS) on approval events
- Redis caching
- Kafka/event messaging

---

## Section 2 — Business-to-Solution Mapping

| Business Requirement | Technical Solution | Location |
|---|---|---|
| Phê duyệt 2 cấp bắt buộc (trưởng phòng → cục trưởng) | Separate `/approve/c1` and `/approve/c2` endpoints with state-machine enforcement | Service layer per domain |
| Soft delete + audit trail | `isDeleted` flag + `PheDuyetLichSu` entry on every mutation | Entity + per-domain PheDuyetLichSu |
| RBAC qua permission code | `@PreAuthorize("@auth.check(authentication, 'domain:action')")` | Controller layer |
| Tài liệu đính kèm (MinIO) | `*Attachment` entity stores MinIO path; service generates presigned URL on read | Per-domain attachment entity |
| Tra cứu + lịch sử | GET /search, GET /status-phe-duyet/{trangThai}, GET /{id}/history | Per-domain controller |
| Audit timestamps | `@PrePersist` / `@PreUpdate` lifecycle hooks | Per-domain entity |

---

## Section 3 — Architectural Scope and Boundaries

### 3.1 Bounded Contexts (5 decoupled domains)

| Domain | Java Package | DB Tables (main) | Controller |
|---|---|---|---|
| Lượng hàng hải | `com.hanghai.kchtg.luonghanghai` | `luong_hang_hai`, `luong_hang_hai_attachment`, `phe_duyet_lich_su` | `LuongHangHaiController` |
| Đê/Kè | `com.hanghai.kchtg.deke` | `de_ke`, `de_ke_attachment`, `phe_duyet_lich_su` | `DeKeController` |
| Cơ sở sửa chữa & đóng tàu | `com.hanghai.kchtg.cosuachua` | `co_sua_chua_dong_tau`, `co_sua_chua_dong_tau_attachment`, `phe_duyet_lich_su` | `CoSuaChuaDongTauController` |
| Trạm radar | `com.hanghai.kchtg.tramradar` | `tram_radar`, `tram_radar_attachment`, `phe_duyet_lich_su` | `TramRadarController` |
| Hệ thống VTS | `com.hanghai.kchtg.vts` | `he_thong_vts`, `he_thong_vts_attachment`, `phe_duyet_lich_su` | `HeThongVTSController` |

### 3.2 Cross-Domain Decoupling Assessment

**Design decision: NO cross-domain foreign keys.** Each of the 5 domains maintains its own `phe_duyet_lich_su` table instance (separate table per domain with domain-specific FK). This means:

- `luonghanghai.phe_duyet_lich_su.luong_hang_hai_id` → `luong_hang_hai.id`
- `deke.phe_duyet_lich_su.de_ke_id` → `de_ke.id`
- (same pattern for cosuachua, tramradar, vts)

**Assessment: SOUND.** The 5 asset types are independent registries. No business requirement mandates cross-domain aggregation at the DB level. DESIGN docs noted PheDuyetLichSu as "shared" conceptually but implementation correctly scoped it per-domain. This avoids write contention and simplifies schema migration.

**Risk note:** The enum `TrangThaiPheDuyet` / `LuongHangHaiApprovalStatus` / `DeKeApprovalStatus` are duplicated across packages (same values: PROPOSED/UNDER_REVIEW/APPROVED/REJECTED) rather than shared. This is a code duplication smell but is architecturally safe — no shared DB constraint requires a single enum type.

### 3.3 External Interfaces

| Interface | Direction | Protocol | Status |
|---|---|---|---|
| MinIO (file storage) | OUT | MinIO Java SDK (presigned URL) | Implemented |
| ReactJS frontend | IN | REST/HTTP via Nginx | Implemented |
| GeoServer (GIS) | OUT | WMS/WFS | Phase-1 EXCLUDED (not in code) |
| LGSP/NGSP (data sharing) | OUT | API | Not in scope for M-003 |

---

## Section 4 — Solution Options and Trade-offs

### Option A (Chosen): 5 Decoupled Packages, Domain-Local PheDuyetLichSu

| Aspect | Detail |
|---|---|
| Structure | 5 independent Spring packages, each with entity/repo/service/controller/dto |
| PheDuyetLichSu | Per-domain table with domain FK |
| Enum | Per-domain enum (same values, duplicated) |
| Pros | Clean domain isolation; independent deploy/migrate per domain; no shared-table write contention |
| Cons | Code duplication (~5x for shared patterns); different enum class types for same conceptual state |
| Risk | Developer must keep 5 enums synchronized manually |

### Option B (Rejected): Shared PheDuyetLichSu Table with discriminator

| Aspect | Detail |
|---|---|
| Structure | Single `phe_duyet_lich_su` table with `domain_type` discriminator column |
| Pros | Single query across domains for reporting; no enum duplication |
| Cons | Nullable FKs (only one FK column populated per row); harder to add domain-specific columns |
| Risk | Cross-domain query joins become complex; migration is breaking change from current code |

### Option C (Rejected): Shared Abstract Base Entity with inheritance

| Aspect | Detail |
|---|---|
| Structure | `AbstractAsset` base entity, 5 subclasses via JPA JOINED inheritance |
| Pros | DRY — single approval workflow code |
| Cons | JPA inheritance adds joins on every query; complex to retrofit existing code |
| Risk | High migration blast radius; incompatible with current independent table structure |

**Recommendation: Option A is the as-built architecture and is architecturally sound for Phase 1. A future refactor could extract a shared approval workflow library without changing the DB schema.**

---

## Section 5 — Recommended Solution (AS-BUILT)

### 5.1 High-Level Shape

All 5 domains follow an identical layered pattern:

```
Nginx → Controller (@RestController, @PreAuthorize)
     → Service (@Service, @Transactional)
     → Repository (JpaRepository)
     → MSSQL 2022 (Flyway-managed schema)
               ↕ MinIO (attachment upload/download)
```

### 5.2 Approval State Machine (uniform across all 5 domains)

```
[NEW] → PROPOSED → UNDER_REVIEW → APPROVED → (isDeleted=true)
              ↓            ↓
           REJECTED ← ← ← ┘
              ↓
           PROPOSED (re-submitted via update)
```

State transitions are enforced in each domain's Service layer, not at the DB level.

### 5.3 REST API Surface (AS-BUILT — per controller inspection)

#### Domain 1: Lượng hàng hải (`/api/v1/luong-hang-hai`)

| Method | Path | Permission | @PreAuthorize |
|---|---|---|---|
| POST | `/api/v1/luong-hang-hai` | `luonghanghai:create` | YES |
| GET | `/api/v1/luong-hang-hai` | `luonghanghai:read` | YES |
| GET | `/api/v1/luong-hang-hai/{id}` | `luonghanghai:read` | YES |
| PUT | `/api/v1/luong-hang-hai/{id}` | `luonghanghai:update` | YES |
| DELETE | `/api/v1/luong-hang-hai/{id}` | `luonghanghai:delete` | YES |
| POST | `/api/v1/luong-hang-hai/{id}/approve/c1` | `luonghanghai:approve-c1` | YES |
| POST | `/api/v1/luong-hang-hai/{id}/approve/c2` | `luonghanghai:approve-c2` | YES |
| GET | `/api/v1/luong-hang-hai/{id}/history` | `luonghanghai:read` | YES |
| GET | `/api/v1/luong-hang-hai/status-phe-duyet/{trangThai}` | `luonghanghai:read` | YES |
| GET | `/api/v1/luong-hang-hai/search` | `luonghanghai:read` | YES |

**Note:** Implemented approve permission codes are `luonghanghai:approve-c1` and `luonghanghai:approve-c2` (hyphen, not colon). DESIGN doc specified `luonghanghai:approve:c1` (colon). As-built wins.

#### Domain 2: Đê/Kè (`/api/v1/de-ke`)

| Method | Path | Permission | @PreAuthorize |
|---|---|---|---|
| POST | `/api/v1/de-ke` | `deke:create` | YES |
| GET | `/api/v1/de-ke` | `deke:read` | YES |
| GET | `/api/v1/de-ke/{id}` | `deke:read` | YES |
| PUT | `/api/v1/de-ke/{id}` | `deke:update` | YES |
| DELETE | `/api/v1/de-ke/{id}` | `deke:delete` | YES |
| POST | `/api/v1/de-ke/{id}/approve/c1` | `deke:approve-c1` | YES |
| POST | `/api/v1/de-ke/{id}/approve/c2` | `deke:approve-c2` | YES |
| GET | `/api/v1/de-ke/{id}/history` | `deke:read` | YES |
| GET | `/api/v1/de-ke/status-phe-duyet/{trangThai}` | `deke:read` | YES |
| GET | `/api/v1/de-ke/search` | `deke:read` | YES |

#### Domain 3: Cơ sở sửa chữa & đóng tàu (`/api/v1/co-so-sua-chua`)

| Method | Path | Permission | @PreAuthorize |
|---|---|---|---|
| POST | `/api/v1/co-so-sua-chua` | `cosuachua:create` | **NO — MISSING** |
| GET | `/api/v1/co-so-sua-chua` | `cosuachua:read` | **NO — MISSING** |
| GET | `/api/v1/co-so-sua-chua/{id}` | `cosuachua:read` | **NO — MISSING** |
| PUT | `/api/v1/co-so-sua-chua/{id}` | `cosuachua:update` | **NO — MISSING** |
| DELETE | `/api/v1/co-so-sua-chua/{id}` | `cosuachua:delete` | **NO — MISSING** |
| POST | `/api/v1/co-so-sua-chua/{id}/approve/c1` | `cosuachua:approve:c1` | **NO — MISSING** |
| POST | `/api/v1/co-so-sua-chua/{id}/approve/c2` | `cosuachua:approve:c2` | **NO — MISSING** |
| GET | `/api/v1/co-so-sua-chua/{id}/history` | `cosuachua:history` | **NO — MISSING** |
| GET | `/api/v1/co-so-sua-chua/search` | `cosuachua:read` | **NO — MISSING** |

**SECURITY FINDING SF-002:** All 9 endpoints on CoSuaChuaDongTauController have ZERO @PreAuthorize annotations.

#### Domain 4: Trạm radar (`/api/v1/tram-radar`)

| Method | Path | Permission | @PreAuthorize |
|---|---|---|---|
| POST | `/api/v1/tram-radar` | `tramradar:create` | **NO — MISSING** |
| GET | `/api/v1/tram-radar` | `tramradar:read` | **NO — MISSING** |
| GET | `/api/v1/tram-radar/{id}` | `tramradar:read` | **NO — MISSING** |
| PUT | `/api/v1/tram-radar/{id}` | `tramradar:update` | **NO — MISSING** |
| DELETE | `/api/v1/tram-radar/{id}` | `tramradar:delete` | **NO — MISSING** |
| POST | `/api/v1/tram-radar/{id}/approve/c1` | `tramradar:approve:c1` | **NO — MISSING** |
| POST | `/api/v1/tram-radar/{id}/approve/c2` | `tramradar:approve:c2` | **NO — MISSING** |
| GET | `/api/v1/tram-radar/{id}/history` | `tramradar:history` | **NO — MISSING** |
| GET | `/api/v1/tram-radar/search` | `tramradar:read` | **NO — MISSING** |

**SECURITY FINDING SF-001 (CRITICAL):** All 9 endpoints on TramRadarController have ZERO @PreAuthorize annotations. Any authenticated (or unauthenticated if global security permits) user can read, write, delete, and approve/reject radar station records.

#### Domain 5: Hệ thống VTS (`/api/v1/he-thong-vts`)

| Method | Path | Permission | @PreAuthorize |
|---|---|---|---|
| POST | `/api/v1/he-thong-vts` | `vts:create` | YES |
| GET | `/api/v1/he-thong-vts` | `vts:read` | YES |
| GET | `/api/v1/he-thong-vts/{id}` | `vts:read` | YES |
| PUT | `/api/v1/he-thong-vts/{id}` | `vts:update` | YES |
| DELETE | `/api/v1/he-thong-vts/{id}` | `vts:delete` | YES |
| POST | `/api/v1/he-thong-vts/{id}/approve/c1` | `vts:approve:c1` | YES |
| POST | `/api/v1/he-thong-vts/{id}/approve/c2` | `vts:approve:c2` | YES |
| GET | `/api/v1/he-thong-vts/search` | `vts:read` | YES |
| GET | `/api/v1/he-thong-vts/{id}/history` | `vts:history` | YES |

### 5.4 Data Model (AS-BUILT Entities per Domain)

#### Domain 1: Lượng hàng hải

| Entity | Table | Key Fields |
|---|---|---|
| `LuongHangHai` | `luong_hang_hai` | id, loaiTau, soLuong, ngayGhiNhan, trangThai (enum), pheDuyetC1/C2, isDeleted |
| `LuongHangHaiAttachment` | `luong_hang_hai_attachment` | id, luongHangHaiId (FK), tenTaiLieu, duongDan (MinIO path) |
| `PheDuyetLichSu` | `phe_duyet_lich_su` (domain-local) | id, luongHangHaiId (FK), capPheDuyet, trangThai, nguoiPheDuyet, lyDo |
| `LuongHangHaiApprovalStatus` | — (enum) | PROPOSED, UNDER_REVIEW, APPROVED, REJECTED |

#### Domain 2: Đê/Kè

| Entity | Table | Key Fields |
|---|---|---|
| `DeKe` | `de_ke` | id, loaiDe, viTri, chieuDai/Rong/Cao, trangThai (enum), pheDuyetC1/C2, isDeleted |
| `DeKeAttachment` | `de_ke_attachment` | id, deKeId (FK), tenTaiLieu, duongDan |
| `PheDuyetLichSu` | `phe_duyet_lich_su` (domain-local) | id, deKeId (FK), capPheDuyet, trangThai, nguoiPheDuyet, lyDo |
| `DeKeApprovalStatus` | — (enum) | PROPOSED, UNDER_REVIEW, APPROVED, REJECTED |

#### Domain 3: Cơ sở sửa chữa & đóng tàu

| Entity | Table | Key Fields |
|---|---|---|
| `CoSuaChuaDongTau` | `co_sua_chua_dong_tau` | id, tenCoSo, diaChi, tinhThanh, loaiCoSo, trangThai (enum), pheDuyetC1/C2, isDeleted |
| `CoSuaChuaDongTauAttachment` | `co_sua_chua_dong_tau_attachment` | id, coSuaChuaId (FK), tenTaiLieu, duongDan |
| `PheDuyetLichSu` | `phe_duyet_lich_su` (domain-local) | id, coSuaChuaId (FK), capPheDuyet, trangThai, nguoiPheDuyet, lyDo |
| `TrangThaiPheDuyet` | — (enum) | PROPOSED, UNDER_REVIEW, APPROVED, REJECTED |

#### Domain 4: Trạm radar

| Entity | Table | Key Fields |
|---|---|---|
| `TramRadar` | `tram_radar` | id, tenTram, viTri, kinhDo/viDo (GPS), loaiTram, trangThai (enum), pheDuyetC1/C2, isDeleted |
| `TramRadarAttachment` | `tram_radar_attachment` | id, tramRadarId (FK), tenTaiLieu, duongDan |
| `PheDuyetLichSu` | `phe_duyet_lich_su` (domain-local) | id, tramRadarId (FK), capPheDuyet, trangThai, nguoiPheDuyet, lyDo |
| `TrangThaiPheDuyet` | — (enum) | PROPOSED, UNDER_REVIEW, APPROVED, REJECTED |

#### Domain 5: Hệ thống VTS

| Entity | Table | Key Fields |
|---|---|---|
| `HeThongVTS` | `he_thong_vts` | id, tenHeThong, viTri, tinhTrang, mucDoPhuTrach, nguonGoc, doiTac, trangThai (enum), pheDuyetC1/C2, isDeleted |
| `HeThongVTSAttachment` | `he_thong_vts_attachment` | id, heThongVTSId (FK), tenTaiLieu, duongDan |
| `PheDuyetLichSu` | `phe_duyet_lich_su` (domain-local) | id, heThongVTSId (FK), capPheDuyet, trangThai, nguoiPheDuyet, lyDo |
| `TrangThaiPheDuyet` | — (enum) | PROPOSED, UNDER_REVIEW, APPROVED, REJECTED |

### 5.5 Security Model

**Authentication:** JWT token, validated globally by Spring Security filter chain.

**Authorization:** `@PreAuthorize("@auth.check(authentication, 'domain:action')")` at controller method level.

**Permission code pattern (AS-BUILT):**

| Domain | Create | Read | Update | Delete | Approve C1 | Approve C2 | History |
|---|---|---|---|---|---|---|---|
| luonghanghai | `luonghanghai:create` | `luonghanghai:read` | `luonghanghai:update` | `luonghanghai:delete` | `luonghanghai:approve-c1` | `luonghanghai:approve-c2` | `luonghanghai:read` |
| deke | `deke:create` | `deke:read` | `deke:update` | `deke:delete` | `deke:approve-c1` | `deke:approve-c2` | `deke:read` |
| cosuachua | `cosuachua:create` | `cosuachua:read` | `cosuachua:update` | `cosuachua:delete` | `cosuachua:approve:c1` | `cosuachua:approve:c2` | `cosuachua:history` |
| tramradar | `tramradar:create` | `tramradar:read` | `tramradar:update` | `tramradar:delete` | `tramradar:approve:c1` | `tramradar:approve:c2` | `tramradar:history` |
| vts | `vts:create` | `vts:read` | `vts:update` | `vts:delete` | `vts:approve:c1` | `vts:approve:c2` | `vts:history` |

**Note on approve permission code inconsistency:** luonghanghai and deke use `approve-c1`/`approve-c2` (hyphen). cosuachua, tramradar, and vts use `approve:c1`/`approve:c2` (colon). This must be normalized before permission-matrix seeding. Recommend standardizing to colon format (`domain:approve:c1`) to match BA spec.

**Role-Permission mapping (BA-specified):**

| Actor | Role | Key Permissions |
|---|---|---|
| A-003 Chuyên viên | Specialist | `:create`, `:update`, `:delete`, `:history` on all 5 domains |
| A-002 Lãnh đạo (Trưởng phòng) | Leader-C1 | `:approve:c1` on all 5 domains |
| A-002 Lãnh đạo (Cục trưởng) | Leader-C2 | `:approve:c2` on all 5 domains |
| A-001 Admin | Admin | All permissions on all 5 domains |
| A-002, A-003, A-004, A-001 | All internal | `:read` on all 5 domains |

**AMBIGUITY (non-blocking):** A-002 covers both Trưởng phòng (C1) and Cục trưởng (C2). The distinction must be enforced via separate role assignments within actor A-002 — either via group/department or role hierarchy. Current BA spec does not define the mechanism. The service-layer role check enforcement needs to be verified with actual Spring Security role configuration.

### 5.6 Reliability and Observability

| Concern | Implementation |
|---|---|
| Transaction integrity | `@Transactional` on all write operations in Service layer |
| Soft delete | `isDeleted` flag; all list/search queries include `WHERE isDeleted = false` |
| Audit timestamps | `@PrePersist` / `@PreUpdate` auto-set `ngayTao`, `ngaySuaDoi` |
| Audit trail | PheDuyetLichSu entry on every create/update/approve/reject/delete |
| Logging | SLF4J + @Slf4j — all controllers log errors; note: TramRadar/CoSuaChua use raw `log.error`, LuongHangHai/DeKe/VTS use structured `ApiResponse` |
| Error response consistency | LuongHangHai/DeKe/VTS: `ApiResponse<T>` wrapper. TramRadar/CoSuaChua: plain String body — INCONSISTENCY |

### 5.7 NFR Summary

| NFR | Target | Implementation |
|---|---|---|
| API response time (read) | ≤ 3s / 10,000 records | Pageable + Spring Data JPA |
| Concurrent users | 50 | Default Spring Boot embedded Tomcat thread pool |
| Uptime | 99.5% (≤ 4h/year downtime) | Managed at deployment level |
| API versioning | `/api/v1/` prefix | All 5 controllers use `/api/v1/` |
| Data retention | Soft delete, no physical purge in Phase 1 | `isDeleted` flag |

---

## Section 6 — Migration / Compatibility / Rollback

- All tables are created via Flyway migrations (versioned scripts). No retroactive migration needed for Phase 1 since M-003 tables are new.
- GeoServer columns (`kinhDo`, `viDo` on TramRadar entity) are nullable — Phase-2 GIS integration can populate without schema change.
- **Rollback path:** Drop M-003 tables via Flyway repair + drop migration scripts. No FK dependencies from other modules.

---

## Section 7 — Key Architectural Risks

| Risk | Why | Mitigation |
|---|---|---|
| SF-001 CRITICAL: TramRadarController — 0 @PreAuthorize | All 9 endpoints unprotected at controller level | Add @PreAuthorize to all TramRadar endpoints before production deploy |
| SF-002 HIGH: CoSuaChuaDongTauController — 0 @PreAuthorize | All 9 endpoints unprotected at controller level | Add @PreAuthorize to all CoSuaChua endpoints before production deploy |
| Permission code inconsistency (hyphen vs colon in approve) | luonghanghai/deke use `approve-c1`; others use `approve:c1` — auth.check will fail if permission seeded incorrectly | Standardize all to `domain:approve:c1` format and re-seed permission matrix |
| A-002 role ambiguity for C1 vs C2 | Actor A-002 maps to both Trưởng phòng and Cục trưởng; service-layer enforcement not visible in controller | Verify Spring Security role assignment for C1/C2 distinction; document in tech-lead plan |
| Response body inconsistency (TramRadar/CoSuaChua) | Raw String responses vs ApiResponse<T> — frontend parsing differences | Refactor both controllers to use ApiResponse<T> wrapper |
| Enum duplication (5 domain-local enums) | Same PROPOSED/UNDER_REVIEW/APPROVED/REJECTED values replicated 5x | Non-critical for Phase 1; consider shared enum module in Phase 2 |
| GeoServer exclusion undocumented in code | DESIGN docs mention GeoServer; no code or comment marks it excluded | Add inline comment in entity / migration noting Phase-2 GeoServer integration point |

---

## Section 8 — Assumptions and Constraints

| Item | Type | Impact |
|---|---|---|
| MSSQL Server 2022 is the target DB | Constraint | Hibernate dialect must be SQL Server; DATETIME2 used for timestamps |
| MinIO bucket pre-provisioned | Assumption | Attachment upload/download depends on MinIO availability |
| `@auth.check` bean is registered globally in Spring context | Assumption | All @PreAuthorize expressions rely on this custom bean from M-001 |
| GeoServer excluded in Phase 1 | Decision | `kinhDo`/`viDo` fields on TramRadar stored but not served to GIS layer |
| Soft delete retention policy not defined | Open item | No physical purge scheduled; data grows indefinitely |
| A-002 dual-role (C1 vs C2) resolution delegated to runtime config | Assumption | Role assignment must be handled outside M-003 code (M-001 user/group management) |

---

## Section 9 — Open Technical Questions

| Question | Why | Suggested Owner |
|---|---|---|
| How does `@auth.check` distinguish Trưởng phòng (C1) vs Cục trưởng (C2) within A-002? | Both are A-002; service-layer approve must enforce role level | sdlc-security + sdlc-tech-lead |
| Should permission codes be normalized to `domain:approve:c1` (colon) across all 5 domains? | Currently luonghanghai/deke use hyphen (`approve-c1`) while others use colon (`approve:c1`) | sdlc-dev (fix) before permission seeding |
| Is there a global Spring Security config that prevents unauthenticated access as fallback for TramRadar/CoSuaChua? | If yes, SF-001/SF-002 risk is lower; if no, APIs are fully open | sdlc-security |
| What is the soft delete retention / purge schedule? | Affects DB growth and GDPR/retention compliance | sdlc-data-governance |

---

## Section 10 — Handoff Guidance

### sdlc-tech-lead
- 5 domain packages are structurally complete and can be tasked independently or in parallel waves
- Priority fix required before production: add @PreAuthorize to all TramRadar (9 endpoints) and CoSuaChua (9 endpoints) controller methods
- Normalize permission code format (hyphen→colon for luonghanghai/deke approve)
- Verify `@auth.check` role distinction for C1 vs C2 approval
- Refactor TramRadar/CoSuaChua response to use ApiResponse<T> wrapper

### sdlc-dev
- Pattern reference: `LuongHangHaiController` and `DeKeController` are the correct pattern (proper @PreAuthorize + ApiResponse)
- `TramRadarController` and `CoSuaChuaDongTauController` are the anti-pattern that needs fixing
- Permission code format: use `domain:approve:c1` (colon-separated) as canonical
- MinIO integration: follow existing pattern in LuongHangHaiService for presigned URL generation

### sdlc-qa
- Test RBAC enforcement: confirm 401/403 returned for unauthenticated/unauthorized callers on all 50 endpoints
- Critical: TramRadar and CoSuaChua must return 403 after fix — currently would return 200 to any caller
- Test approval state machine: cannot skip C1→C2, cannot approve wrong level
- Test soft delete: deleted records must not appear in list/search results

### sdlc-reviewer
- Security: verify @PreAuthorize coverage is 100% after dev fixes
- Consistency: verify ApiResponse<T> wrapper on all endpoints after dev fixes
- Architecture: cross-domain FK isolation is correct — no FK across the 5 domain schemas
- GeoServer exclusion: confirm no partial implementation exists in code

---

## Section 11 — Architecture Readiness Verdict

| Gate | Status | Notes |
|---|---|---|
| Ownership boundaries explicit | PASS | 5 bounded contexts clearly defined |
| Data flow and key contracts defined | PASS | 50 REST endpoints documented with AS-BUILT verification |
| Blocking open technical questions | 0 blocking | Security finding is a dev fix, not an architectural blocker |
| Security concerns documented | PASS — 2 CRITICAL findings | TramRadar + CoSuaChua: 18 unprotected endpoints |
| ADR assigned | NOT ASSIGNED | No ADR required for this module |
| Intel enrichments written | PASS | sitemap, permission-matrix, catalog updated |

**Verdict: Ready for Technical Lead planning**

**Security constraint:** Dev must add @PreAuthorize to 18 endpoints (TramRadar × 9 + CoSuaChua × 9) before QA testing of RBAC.
