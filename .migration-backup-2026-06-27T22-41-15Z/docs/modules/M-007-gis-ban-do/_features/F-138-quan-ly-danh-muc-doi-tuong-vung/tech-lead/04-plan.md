# Tech Lead Plan: F-138 — Quản lý danh mục đối tượng vùng

> **Feature:** F-138 — Quản lý danh mục đối tượng vùng
> **Module:** M-007 GIS / Bản đồ
> **Stage:** engineering-technical-lead
> **Date:** 2026-06-19

## 1. Feature Summary

Quản lý đối tượng vùng GIS (vùng nước, khu neo đậu, khu trú bão, khu hạn chế) với tọa độ polygon, tính diện tích, kiểm tra chồng lấn, phân loại danh mục, attachments, và workflow phê duyệt đa cấp.

**Codebase:** 12 files
- `polygon/entity/`: PolygonObject, PolygonCategory, PolygonAttachment, PolygonHistory, PolygonOverlap (5 entities)
- `polygon/repository/`: PolygonObjectRepository, PolygonCategoryRepository, PolygonHistoryRepository, PolygonOverlapRepository (4 repos)
- `polygon/dto/`: CreatePolygonObjectRequest, UpdatePolygonObjectRequest, PolygonObjectResponse (3 DTOs)
- `polygon/service/`: PolygonObjectService (1 service)
- `polygon/controller/`: PolygonObjectController (1 controller)

## 2. Wave Plan — F-138 Specific Tasks

### Wave 1 (Foundation) — Entity + Repository Verification

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 1.1 | F138-W1-01 | Verify PolygonObject entity — 16 fields: id, name, code, objectType, categoryId, fillSymbolId, coordinates (TEXT), description, status, unitId, area, purpose, restrictionLevel, approvalStatus, approvedBy/approvedDate | 1.5 | — | Dev A |
| 1.2 | F138-W1-02 | Verify PolygonCategory entity — 4 fields: name, code, description, sortOrder | 0.5 | — | Dev A |
| 1.3 | F138-W1-03 | Verify PolygonAttachment entity — file attachment linked to PolygonObject | 0.5 | — | Dev A |
| 1.4 | F138-W1-04 | Verify PolygonHistory entity — audit trail for PolygonObject changes | 0.5 | — | Dev A |
| 1.5 | F138-W1-05 | Verify PolygonOverlap entity — tracking overlaps between polygons | 0.5 | — | Dev A |
| 1.6 | F138-W1-06 | Review PolygonObjectRepository — CRUD + findByObjectType + findByStatus + search + area calculation + ST_Intersects | 2.5 | F138-W1-01 | Senior Dev |
| 1.7 | F138-W1-07 | Review PolygonCategoryRepository — CRUD + findByCode + existsByCode | 1 | F138-W1-02 | Dev A |
| 1.8 | F138-W1-08 | Verify Flyway V3 migration — polygon_objects, polygon_categories, polygon_overlaps tables, GIST spatial index | 2 | F138-W1-06 | Dev C |
| 1.9 | F138-W1-09 | Verify BaseEntity inheritance — soft delete (@SQLRestriction), createdAt, updatedAt | 1 | F138-W1-01 | Senior Dev |

**Wave 1 F-138 Total: ~10 hours**

---

### Wave 2 (Core) — Service + DTOs + Controller Review

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 2.1 | F138-W2-01 | Review CreatePolygonObjectRequest — @NotBlank name/code, @NotNull objectType, coordinates TEXT, area optional | 1 | F138-W1-01 | Dev A |
| 2.2 | F138-W2-02 | Review UpdatePolygonObjectRequest — optional fields, partial update support | 0.5 | F138-W1-01 | Dev A |
| 2.3 | F138-W2-03 | Review PolygonObjectResponse — serialization, exclude internal fields, include area | 0.5 | F138-W1-01 | Dev A |
| 2.4 | F138-W2-04 | Review PolygonObjectService — CRUD + overlap detection + area calculation + approval workflow | 3.5 | F138-W1-06 | Dev A |
| 2.5 | F138-W2-05 | Verify overlap detection in Service — ST_Intersects check, return overlap list | 1.5 | F138-W2-04 | Dev A |
| 2.6 | F138-W2-06 | Verify area calculation in Service — ST_Area from coordinates TEXT | 1 | F138-W2-04 | Dev A |
| 2.7 | F138-W2-07 | Verify approval workflow in Service — DRAFT→PENDING_APPROVAL transition | 1.5 | F138-W2-04 | Dev A |
| 2.8 | F138-W2-08 | Review PolygonObjectController — 9 REST endpoints + overlap check endpoint, ApiResponse<T> wrapper | 2.5 | F138-W2-04 | Dev A |
| 2.9 | F138-W2-09 | Verify unique code constraint — Service throws IllegalArgumentException on duplicate | 0.5 | F138-W2-04 | Dev A |

**Wave 2 F-138 Total: ~13 hours**

---

### Wave 3 (Advanced) — Integration with Other Features

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 3.1 | F138-W3-01 | Verify Polygon search integration — F-140 SearchService uses PolygonObjectRepository for polygon intersection queries | 1 | F138-W2-08 | Dev B |
| 3.2 | F138-W3-02 | Verify Layer polygon type — F-139 MapLayer uses PolygonObject for layerType=POLYGON | 0.5 | F138-W2-08 | Dev C |
| 3.3 | F138-W3-03 | Add approveL1()/approveL2() methods — current gap in approval workflow | 2 | F138-W2-04 | Senior Dev |
| 3.4 | F138-W3-04 | PolygonOverlap entity — verify lifecycle management after overlap detection | 1 | F138-W2-04 | Dev A |

**Wave 3 F-138 Total: ~4.5 hours**

---

### Wave 4 (QA) — Unit Tests for F-138

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 4.1 | F138-W4-01 | Unit test PolygonObjectService — create/update/delete/findById (4 tests) | 2 | F138-W2-08 | QA A |
| 4.2 | F138-W4-02 | Unit test PolygonObjectService — findByObjectType, findByStatus, search (3 tests) | 2 | F138-W4-01 | QA A |
| 4.3 | F138-W4-03 | Unit test PolygonObjectService — overlap detection, area calculation (3 tests) | 2.5 | F138-W4-01 | QA A |
| 4.4 | F138-W4-04 | Unit test PolygonObjectService — submitForApproval, approval workflow (3 tests) | 2 | F138-W4-01 | QA A |
| 4.5 | F138-W4-05 | Unit test PolygonObjectController — CRUD + overlap endpoint, ApiResponse wrapper | 3.5 | F138-W4-01 | QA A |
| 4.6 | F138-W4-06 | Integration test — Flyway migration, unique constraint, spatial index | 2 | F138-W4-01 | QA B |
| 4.7 | F138-W4-07 | Edge-case tests — duplicate code rejection, invalid coordinates, overlapping polygon creation | 2 | F138-W4-01 | QA A |

**Wave 4 F-138 Total: ~16.5 hours**

---

### Wave 5 (Integration) — E2E + Security for F-138

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 5.1 | F138-W5-01 | E2E: Full approval flow — Create Polygon → Overlap check → Submit → Approve L1 → Approve L2 → Publish | 3 | F138-W4-07 | QA A |
| 5.2 | F138-W5-02 | E2E: Overlap detection → Manage overlapping layers → Display on map | 2 | F138-W5-01 | QA B |
| 5.3 | F138-W5-03 | Security: @PreAuthorize on approve endpoints — ADMIN only | 1.5 | F138-W5-01 | Senior Dev |

**Wave 5 F-138 Total: ~6.5 hours**

---

## 3. Total Estimated Effort for F-138

| Wave | Description | Hours |
|------|-------------|-------|
| Wave 1 | Entity + Repository Verification | 10 |
| Wave 2 | Service + DTOs + Controller Review | 13 |
| Wave 3 | Integration with Other Features | 4.5 |
| Wave 4 | Unit Tests | 16.5 |
| Wave 5 | E2E + Security | 6.5 |
| **Total** | **F-138** | **50.5 hours** |

## 4. API Routes

| Method | Path | Handler | Auth |
|--------|------|---------|------|
| GET | `/api/polygon-objects` | `PolygonObjectController.findAll()` | auth |
| GET | `/api/polygon-objects/{id}` | `PolygonObjectController.findById()` | auth |
| GET | `/api/polygon-objects/type/{objectType}` | `PolygonObjectController.findByObjectType()` | auth |
| GET | `/api/polygon-objects/status/{status}` | `PolygonObjectController.findByStatus()` | auth |
| GET | `/api/polygon-objects/search` | `PolygonObjectController.search()` | auth |
| POST | `/api/polygon-objects` | `PolygonObjectController.create()` | auth |
| PUT | `/api/polygon-objects/{id}` | `PolygonObjectController.update()` | auth |
| DELETE | `/api/polygon-objects/{id}` | `PolygonObjectController.delete()` | auth |
| POST | `/api/polygon-objects/{id}/submit-approval` | `PolygonObjectController.submitForApproval()` | auth |
| GET | `/api/polygon-objects/{id}/overlaps` | `PolygonObjectController.findOverlaps()` | auth |

## 5. Dependencies

| Feature | Dependency | Type |
|---------|------------|------|
| F-138 → M-001 | `BaseEntity` (common module) | Hard |
| F-138 → M-001 | `ApiResponse<T>` (common module) | Hard |
| F-140 | Depends on F-138 for polygon search results + intersection queries | Soft |
| F-139 | Depends on F-138 for layer type=POLYGON | Soft |

## 6. Business Rules

| Rule ID | Rule | Implementation |
|---------|------|----------------|
| BR-GIS-021 | Unique code | `PolygonObjectRepository.existsByCode()` + Service throws `IllegalArgumentException` |
| BR-GIS-022 | Polygon overlap detection | `checkOverlaps()` — ST_Intersects, returns list of overlapping polygons |
| BR-GIS-023 | Area calculation | `calculateArea()` — ST_Area from coordinates TEXT |
| BR-GIS-024 | Approval workflow | `submitForApproval()` — DRAFT→PENDING_APPROVAL, approvalStatus=PENDING |
| BR-GIS-025 | Soft delete | `delete()` — status=DELETED + `entity.softDelete()` (BaseEntity) |
| BR-GIS-026 | CRUD validation | `@Valid` on DTO fields, `@NotBlank`, `@Size` constraints |

## 7. Open Items / TODOs

1. **Approve L1/L2 endpoints** — Service has APPROVED_L1/APPROVED_L2 status but no methods to transition there (Wave 3)
2. **Add pagination** to `findAll()` and `search()` — currently returns all records
3. **Spring Security** — Add method-level security for approval actions (Wave 5)
4. **PostGIS ST_Intersects** — Verify spatial overlap function available in target DB
5. **PolygonOverlap lifecycle** — Determine when to auto-create/delete overlap records
