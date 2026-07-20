# Tech Lead Plan: F-136 — Quản lý danh mục đối tượng điểm

> **Feature:** F-136 — Quản lý danh mục đối tượng điểm
> **Module:** M-007 GIS / Bản đồ
> **Stage:** engineering-technical-lead
> **Date:** 2026-06-19

## 1. Feature Summary

Quản lý đối tượng điểm GIS (cảng biển, đèn biển, phao tiêu, đài) với tọa độ WGS84, phân loại danh mục, attachments, và workflow phê duyệt đa cấp.

**Codebase:** 10 files
- `point/entity/`: PointObject, ObjectCategory, PointAttachment, PointHistory (4 entities)
- `point/repository/`: PointObjectRepository, ObjectCategoryRepository, PointHistoryRepository (3 repos)
- `point/dto/`: CreatePointObjectRequest, UpdatePointObjectRequest, PointObjectResponse (3 DTOs)
- `point/service/`: PointObjectService (1 service)
- `point/controller/`: PointObjectController (1 controller)

## 2. Wave Plan — F-136 Specific Tasks

### Wave 1 (Foundation) — Entity + Repository Verification

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 1.1 | F136-W1-01 | Verify PointObject entity — 13 fields: id, name, code, objectType, categoryId, iconId, longitude, latitude, description, status, unitId, approvalStatus, approvedBy/approvedDate | 1 | — | Dev A |
| 1.2 | F136-W1-02 | Verify ObjectCategory entity — 4 fields: name, code, description, sortOrder | 0.5 | — | Dev A |
| 1.3 | F136-W1-03 | Verify PointAttachment entity — file attachment linked to PointObject | 0.5 | — | Dev A |
| 1.4 | F136-W1-04 | Verify PointHistory entity — audit trail for PointObject changes | 0.5 | — | Dev A |
| 1.5 | F136-W1-05 | Review PointObjectRepository — CRUD + findByObjectType + findByStatus + search + ST_Distance spatial query | 2 | F136-W1-01 | Senior Dev |
| 1.6 | F136-W1-06 | Review ObjectCategoryRepository — CRUD + findByCode + existsByCode | 1 | F136-W1-02 | Dev A |
| 1.7 | F136-W1-07 | Verify Flyway V1 migration — point_objects, object_categories tables, GIST spatial index | 1.5 | F136-W1-05 | Dev C |
| 1.8 | F136-W1-08 | Verify BaseEntity inheritance — soft delete (@SQLRestriction), createdAt, updatedAt | 1 | F136-W1-01 | Senior Dev |

**Wave 1 F-136 Total: ~8 hours**

---

### Wave 2 (Core) — Service + DTOs + Controller Review

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 2.1 | F136-W2-01 | Review CreatePointObjectRequest — @NotBlank name/code, @NotNull objectType, coordinate validation | 1 | F136-W1-01 | Dev A |
| 2.2 | F136-W2-02 | Review UpdatePointObjectRequest — optional fields, partial update support | 0.5 | F136-W1-01 | Dev A |
| 2.3 | F136-W2-03 | Review PointObjectResponse — serialization, exclude internal fields | 0.5 | F136-W1-01 | Dev A |
| 2.4 | F136-W2-04 | Review PointObjectService — create, update, delete, findById, findByObjectType, findByStatus, search, submitForApproval | 3 | F136-W1-05 | Dev A |
| 2.5 | F136-W2-05 | Verify coordinate validation in Service — lon: -180~180, lat: -90~90, WGS84 | 1 | F136-W2-04 | Dev A |
| 2.6 | F136-W2-06 | Verify approval workflow in Service — DRAFT→PENDING_APPROVAL transition | 1.5 | F136-W2-04 | Dev A |
| 2.7 | F136-W2-07 | Review PointObjectController — 9 REST endpoints, ApiResponse<T> wrapper | 2 | F136-W2-04 | Dev A |
| 2.8 | F136-W2-08 | Verify unique code constraint — Service throws IllegalArgumentException on duplicate | 0.5 | F136-W2-04 | Dev A |

**Wave 2 F-136 Total: ~10.5 hours**

---

### Wave 3 (Advanced) — Integration with Other Features

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 3.1 | F136-W3-01 | Verify Point search integration — F-140 SearchService uses PointObjectRepository | 1 | F136-W2-07 | Dev B |
| 3.2 | F136-W3-02 | Verify Layer point type — F-139 MapLayer uses PointObject for layerType=POINT | 0.5 | F136-W2-07 | Dev C |
| 3.3 | F136-W3-03 | Add approveL1()/approveL2() methods — current gap in approval workflow | 2 | F136-W2-04 | Senior Dev |

**Wave 3 F-136 Total: ~3.5 hours**

---

### Wave 4 (QA) — Unit Tests for F-136

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 4.1 | F136-W4-01 | Unit test PointObjectService — create/update/delete/findById (4 tests) | 2 | F136-W2-07 | QA A |
| 4.2 | F136-W4-02 | Unit test PointObjectService — findByObjectType, findByStatus, search (3 tests) | 2 | F136-W4-01 | QA A |
| 4.3 | F136-W4-03 | Unit test PointObjectService — submitForApproval, coordinate validation (3 tests) | 2 | F136-W4-01 | QA A |
| 4.4 | F136-W4-04 | Unit test PointObjectController — all 9 REST endpoints with ApiResponse wrapper | 3 | F136-W4-01 | QA A |
| 4.5 | F136-W4-05 | Integration test — Flyway migration, unique constraint, check constraints | 2 | F136-W4-01 | QA B |
| 4.6 | F136-W4-06 | Edge-case tests — duplicate code rejection, invalid coordinates, null name | 1.5 | F136-W4-01 | QA A |

**Wave 4 F-136 Total: ~12.5 hours**

---

### Wave 5 (Integration) — E2E + Security for F-136

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 5.1 | F136-W5-01 | E2E: Full approval flow — Create Point → Submit → Approve L1 → Approve L2 → Publish | 2.5 | F136-W4-06 | QA B |
| 5.2 | F136-W5-02 | Security: @PreAuthorize on approve endpoints — ADMIN only | 1.5 | F136-W5-01 | Senior Dev |

**Wave 5 F-136 Total: ~4 hours**

---

## 3. Total Estimated Effort for F-136

| Wave | Description | Hours |
|------|-------------|-------|
| Wave 1 | Entity + Repository Verification | 8 |
| Wave 2 | Service + DTOs + Controller Review | 10.5 |
| Wave 3 | Integration with Other Features | 3.5 |
| Wave 4 | Unit Tests | 12.5 |
| Wave 5 | E2E + Security | 4 |
| **Total** | **F-136** | **38.5 hours** |

## 4. API Routes

| Method | Path | Handler | Auth |
|--------|------|---------|------|
| GET | `/api/point-objects` | `PointObjectController.findAll()` | auth |
| GET | `/api/point-objects/{id}` | `PointObjectController.findById()` | auth |
| GET | `/api/point-objects/type/{objectType}` | `PointObjectController.findByObjectType()` | auth |
| GET | `/api/point-objects/status/{status}` | `PointObjectController.findByStatus()` | auth |
| GET | `/api/point-objects/search` | `PointObjectController.search()` | auth |
| POST | `/api/point-objects` | `PointObjectController.create()` | auth |
| PUT | `/api/point-objects/{id}` | `PointObjectController.update()` | auth |
| DELETE | `/api/point-objects/{id}` | `PointObjectController.delete()` | auth |
| POST | `/api/point-objects/{id}/submit-approval` | `PointObjectController.submitForApproval()` | auth |

## 5. Dependencies

| Feature | Dependency | Type |
|---------|------------|------|
| F-136 → M-001 | `BaseEntity` (common module) | Hard |
| F-136 → M-001 | `ApiResponse<T>` (common module) | Hard |
| F-140 | Depends on F-136 for point search results | Soft |
| F-139 | Depends on F-136 for layer type=POINT | Soft |

## 6. Business Rules

| Rule ID | Rule | Implementation |
|---------|------|----------------|
| BR-GIS-001 | Unique code | `PointObjectRepository.existsByCode()` + Service throws `IllegalArgumentException` |
| BR-GIS-002 | WGS84 coordinate validation | `validateCoordinates()` — lon:-180~180, lat:-90~90 |
| BR-GIS-003 | Approval workflow | `submitForApproval()` — DRAFT→PENDING_APPROVAL, approvalStatus=PENDING |
| BR-GIS-004 | Soft delete | `delete()` — status=DELETED + `entity.softDelete()` (BaseEntity) |
| BR-GIS-005 | CRUD validation | `@Valid` on DTO fields, `@NotBlank`, `@Size` constraints |

## 7. Open Items / TODOs

1. **Approve L1/L2 endpoints** — Service has APPROVED_L1/APPROVED_L2 status but no methods to transition there (Wave 3)
2. **Add pagination** to `findAll()` and `search()` — currently returns all records
3. **Spring Security** — Add method-level security for approval actions (Wave 5)
