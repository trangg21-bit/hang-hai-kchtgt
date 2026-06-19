# Tech Lead Plan: F-138 — Quản lý danh mục đối tượng vùng

## Context

Feature F-138 covers the management of GIS polygon objects (water zones, anchorage areas, storm shelters, restricted areas, limited zones).
Code has been implemented following the standard pattern: Entity extends BaseEntity → Repository extends JpaRepository → Service with CRUD + approval workflow → REST Controller.
Additional entities: `PolygonCategory`, `PolygonAttachment`, `PolygonOverlap`.

## Derived Entity Design

| Entity | Table | Purpose |
|---|---|---|
| `PolygonObject` | `polygon_objects` | Core polygon object (water zone, anchorage, storm shelter, restricted, limited zone) |
| `PolygonCategory` | `polygon_categories` | Category master data for polygon classification |
| `PolygonAttachment` | `polygon_attachments` | Attached files/metadata for polygon objects |
| `PolygonOverlap` | `polygon_overlaps` | Overlap detection between polygons |

### PolygonObject Fields

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | Inherited from BaseEntity |
| `name` | String(200) | NOT NULL | Ten doi tuong |
| `code` | String(50) | NOT NULL, UNIQUE | Ma doi tuong |
| `objectType` | Enum | NOT NULL | WATER_ZONE, ANCHORAGE, STORM_SHELTER, RESTRICTED_AREA, LIMITED_ZONE, OTHER |
| `categoryId` | Long | NULL | Category reference |
| `fillSymbolId` | Long | NULL | Map fill symbol reference |
| `coordinates` | TEXT | NOT NULL | WKT (POLYGON) or GeoJSON |
| `description` | String(1000) | NULL | Mo ta |
| `status` | Enum | NOT NULL, default DRAFT | Approval workflow state |
| `unitId` | Long | NULL | Thuoc don vi |
| `area` | Double | NULL | Dien tich |
| `purpose` | String(500) | NULL | Muc dich su dung |
| `restrictionLevel` | String(50) | NULL | Cap do han che |
| `approvalStatus` | Enum | PENDING/APPROVED/REJECTED | Approval status |
| `approvedBy` | Long | NULL | Nguoi duyiet |
| `approvedDate` | LocalDateTime | NULL | Ngay duyiet |

---

## 1. Implementation Tasks

### Backend Tasks (Estimated: 1.5–2 days)

Code has already been written. Task breakdown reflects verification and integration work.

| # | Task | File Path | Complexity | Status |
|---|---|---|---|---|
| 1.1 | Entity: `PolygonObject.java` — validation, enum types, WKT POLYGON format | `src/main/java/com/hanghai/kchtg/gis/polygon/entity/PolygonObject.java` | Medium | ✅ Written |
| 1.2 | Entity: `PolygonCategory.java` | `src/main/java/com/hanghai/kchtg/gis/polygon/entity/PolygonCategory.java` | Low | ✅ Written |
| 1.3 | Entity: `PolygonAttachment.java` | `src/main/java/com/hanghai/kchtg/gis/polygon/entity/PolygonAttachment.java` | Low | ✅ Written |
| 1.4 | Entity: `PolygonOverlap.java` | `src/main/java/com/hanghai/kchtg/gis/polygon/entity/PolygonOverlap.java` | Low | ✅ Written |
| 1.5 | Repository: `PolygonObjectRepository.java` — CRUD + search | `src/main/java/com/hanghai/kchtg/gis/polygon/repository/PolygonObjectRepository.java` | Medium | ✅ Written |
| 1.6 | DTOs: `CreatePolygonObjectRequest`, `UpdatePolygonObjectRequest`, `PolygonObjectResponse` | `src/main/java/com/hanghai/kchtg/gis/polygon/dto/` | Low | ✅ Written |
| 1.7 | Service: `PolygonObjectService.java` — CRUD + approval + POLYGON validation | `src/main/java/com/hanghai/kchtg/gis/polygon/service/PolygonObjectService.java` | Medium | ✅ Written |
| 1.8 | Controller: `PolygonObjectController.java` — 9 REST endpoints | `src/main/java/com/hanghai/kchtg/gis/polygon/controller/PolygonObjectController.java` | Medium | ✅ Written |

### Verification Tasks

| # | Task | Complexity |
|---|---|---|
| 1.9 | Verify POLYGON WKT coordinate format validation | Low |
| 1.10 | Verify approval workflow state transitions | Medium |
| 1.11 | Verify PolygonCategory relationship | Low |
| 1.12 | Verify unique code constraint | Low |
| 1.13 | Verify soft delete pattern | Low |

---

## 2. API Routes

| Method | Path | Handler | Auth |
|---|---|---|---|
| GET | `/api/polygon-objects` | `PolygonObjectController.findAll()` | auth |
| GET | `/api/polygon-objects/{id}` | `PolygonObjectController.findById()` | auth |
| GET | `/api/polygon-objects/type/{objectType}` | `PolygonObjectController.findByObjectType()` | auth |
| GET | `/api/polygon-objects/status/{status}` | `PolygonObjectController.findByStatus()` | auth |
| GET | `/api/polygon-objects/search` | `PolygonObjectController.search()` | auth |
| POST | `/api/polygon-objects` | `PolygonObjectController.create()` | auth |
| PUT | `/api/polygon-objects/{id}` | `PolygonObjectController.update()` | auth |
| DELETE | `/api/polygon-objects/{id}` | `PolygonObjectController.delete()` | auth |
| POST | `/api/polygon-objects/{id}/submit-approval` | `PolygonObjectController.submitForApproval()` | auth |

---

## 3. Component Structure

```
src/main/java/com/hanghai/kchtg/gis/polygon/
├── entity/
│   ├── PolygonObject.java            ← Core entity (POLYGON coordinates)
│   ├── PolygonCategory.java          ← Category master data
│   ├── PolygonAttachment.java        ← Attachment metadata
│   └── PolygonOverlap.java           ← Overlap detection
├── repository/
│   └── PolygonObjectRepository.java  ← JpaRepository + search
├── dto/
│   ├── CreatePolygonObjectRequest.java
│   ├── UpdatePolygonObjectRequest.java
│   └── PolygonObjectResponse.java
├── service/
│   └── PolygonObjectService.java     ← CRUD + approval + POLYGON validation
└── controller/
    └── PolygonObjectController.java  ← 9 REST endpoints
```

---

## 4. Database Schema (Flyway Migrations)

### V1__F-138_init_polygon_objects.sql

```sql
CREATE TABLE polygon_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name NVARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    object_type VARCHAR(30) NOT NULL CHECK (object_type IN ('WATER_ZONE', 'ANCHORAGE', 'STORM_SHELTER', 'RESTRICTED_AREA', 'LIMITED_ZONE', 'OTHER')),
    category_id BIGINT NULL,
    fill_symbol_id BIGINT NULL,
    coordinates TEXT NOT NULL,
    description TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED_L1', 'APPROVED_L2', 'PUBLISHED', 'REJECTED', 'DELETED')),
    unit_id BIGINT NULL,
    area DOUBLE PRECISION NULL,
    purpose TEXT NULL,
    restriction_level VARCHAR(50) NULL,
    approval_status VARCHAR(20) DEFAULT 'PENDING',
    approved_by BIGINT NULL,
    approved_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_polygon_objects_object_type ON polygon_objects(object_type);
CREATE INDEX idx_polygon_objects_status ON polygon_objects(status);
CREATE INDEX idx_polygon_objects_unit_id ON polygon_objects(unit_id);
CREATE INDEX idx_polygon_objects_name ON polygon_objects(name);

CREATE TABLE polygon_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name NVARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);
```

---

## 5. Business Rules Implementation

| Rule | Implementation |
|---|---|
| BR-GIS-020: POLYGON WKT format | `validateCoordinates()` — accepts POLYGON/GEOMETRYCOLLECTION/GeoJSON |
| BR-GIS-021: Unique code | `existsByCode()` + Service validation |
| BR-GIS-022: Approval workflow | `submitForApproval()` — DRAFT→PENDING_APPROVAL |
| BR-GIS-023: Soft delete | `delete()` — status=DELETED + softDelete() |
| BR-GIS-024: Area calculation | `area` field optional, can be calculated from coordinates |

---

## 6. Estimated Complexity

| Area | Complexity | Notes |
|---|---|---|
| Entity + DTOs | Low | Standard JPA + Lombok |
| Repository (CRUD + search) | Medium | Standard JPQL queries |
| Service (CRUD + approval + POLYGON) | Medium | POLYGON format validation |
| Controller | Low | Standard REST |
| **Overall** | **Medium** | Coordinate format + 6 object types |

---

## 7. Wave Plan

**Single wave** — code is complete. Wave focuses on verification and QA handoff.

| Wave | Tasks | Deliverable |
|---|---|---|
| Wave 1 | Verify entities, DTOs, Service, Controller + DB migration + integration test | Feature ready for QA |

---

## 8. Dependencies

| Feature | Dependency | Type |
|---|---|---|
| F-138 → M-001 | `BaseEntity`, `ApiResponse<T>` | Hard |
| F-140 | Depends on F-138 for polygon search results | Soft |
| F-139 | Depends on F-138 for layer type="POLYGON" | Soft |
| F-139 → F-136/137/138 | MapLayer needs references to all 3 object types | Hard |

---

## 9. QA Strategy

| Test Type | Scope |
|---|---|
| Unit: Service | CRUD, approval workflow, POLYGON WKT validation, area field |
| Unit: Repository | JPQL search, unique code check |
| Integration: Controller | All 9 endpoints, request validation |
| Integration: DB | Flyway migration, check constraints |
| E2E: Full flow | Create → Submit Approval → Published |
| Edge: POLYGON validation | Invalid format rejected (not POLYGON/GeoJSON) |

---

## 10. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| No polygon overlap detection service | High | High | PolygonOverlap entity exists but no service — TODO |
| POLYGON WKT validation too loose | Medium | Medium | Validate ring closure and coordinate order |
| Missing Pagination | Medium | Medium | Add Pageable support |
| Missing Spring Security | Medium | Medium | Add `@PreAuthorize` annotations |

---

## 11. Open Items / TODOs

1. **PolygonOverlap service** — Entity exists but no service for overlap detection (ST_Intersects?)
2. **Add pagination** to `findAll()` and `search()`
3. **Spring Security** — Add method-level security for approval
4. **POLYGON validation** — Consider JTS library for geometry validation
