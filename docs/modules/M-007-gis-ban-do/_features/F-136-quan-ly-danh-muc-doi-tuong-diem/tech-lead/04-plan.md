# Tech Lead Plan: F-136 — Quản lý danh mục đối tượng điểm

## Context

Feature F-136 covers the management of GIS point objects (ports, lighthouses, buoys, information beacons, other).
Code has been implemented following the standard pattern: Entity extends BaseEntity → Repository extends JpaRepository → Service with CRUD + approval workflow → REST Controller.

## Derived Entity Design

| Entity | Table | Purpose |
|---|---|---|
| `PointObject` | `point_objects` | Core point object (port, lighthouse, buoy, beacon) |

### PointObject Fields

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | Inherited from BaseEntity |
| `name` | String(200) | NOT NULL, unique | Ten doi tuong |
| `code` | String(50) | NOT NULL, UNIQUE | Ma doi tuong |
| `objectType` | Enum | NOT NULL | PORT, LIGHTHOUSE, BUOY, BEACON, OTHER |
| `categoryId` | Long | NULL | Category reference |
| `iconId` | Long | NULL | Map icon reference |
| `longitude` | Double | NOT NULL, precision 10,6 | Kinh do WGS84 |
| `latitude` | Double | NOT NULL, precision 10,6 | Vi do WGS84 |
| `description` | String(1000) | NULL | Mo ta |
| `status` | Enum | NOT NULL, default DRAFT | DRAFT → PENDING_APPROVAL → APPROVED_L1 → APPROVED_L2 → PUBLISHED |
| `unitId` | Long | NULL | Thuoc don vi |
| `approvalStatus` | Enum | PENDING/APPROVED/REJECTED | Approval workflow status |
| `approvedBy` | Long | NULL | Nguoi duyiet |
| `approvedDate` | LocalDateTime | NULL | Ngay duyiet |

---

## 1. Implementation Tasks

### Backend Tasks (Estimated: 1.5–2 days)

Code has already been written. Task breakdown reflects verification and integration work.

| # | Task | File Path | Complexity | Status |
|---|---|---|---|---|
| 1.1 | Entity: `PointObject.java` — validation, enum types, WGS84 coord constraints | `src/main/java/com/hanghai/kchtg/gis/point/entity/PointObject.java` | Medium | ✅ Written |
| 1.2 | Repository: `PointObjectRepository.java` — CRUD + search + distance query | `src/main/java/com/hanghai/kchtg/gis/point/repository/PointObjectRepository.java` | Medium | ✅ Written |
| 1.3 | DTO: `CreatePointObjectRequest.java` | `src/main/java/com/hanghai/kchtg/gis/point/dto/CreatePointObjectRequest.java` | Low | ✅ Written |
| 1.4 | DTO: `UpdatePointObjectRequest.java` | `src/main/java/com/hanghai/kchtg/gis/point/dto/UpdatePointObjectRequest.java` | Low | ✅ Written |
| 1.5 | DTO: `PointObjectResponse.java` | `src/main/java/com/hanghai/kchtg/gis/point/dto/PointObjectResponse.java` | Low | ✅ Written |
| 1.6 | Service: `PointObjectService.java` — CRUD + approval workflow + coord validation | `src/main/java/com/hanghai/kchtg/gis/point/service/PointObjectService.java` | Medium | ✅ Written |
| 1.7 | Controller: `PointObjectController.java` — 9 REST endpoints | `src/main/java/com/hanghai/kchtg/gis/point/controller/PointObjectController.java` | Medium | ✅ Written |

### Verification Tasks

| # | Task | Complexity |
|---|---|---|
| 1.8 | Verify all endpoints return `ApiResponse<T>` wrapper | Low |
| 1.9 | Verify approval workflow state transitions (DRAFT→PENDING→APPROVED_L1→APPROVED_L2→PUBLISHED) | Medium |
| 1.10 | Verify coordinate validation (-180~180 lon, -90~90 lat, WGS84) | Low |
| 1.11 | Verify unique code constraint enforcement | Low |
| 1.12 | Verify soft delete pattern (status=DELETED + BaseEntity softDelete()) | Low |
| 1.13 | Review repository JPQL queries for injection safety | Low |

---

## 2. API Routes

| Method | Path | Handler | Auth |
|---|---|---|---|
| GET | `/api/point-objects` | `PointObjectController.findAll()` | auth |
| GET | `/api/point-objects/{id}` | `PointObjectController.findById()` | auth |
| GET | `/api/point-objects/type/{objectType}` | `PointObjectController.findByObjectType()` | auth |
| GET | `/api/point-objects/status/{status}` | `PointObjectController.findByStatus()` | auth |
| GET | `/api/point-objects/search` | `PointObjectController.search()` | auth |
| POST | `/api/point-objects` | `PointObjectController.create()` | auth |
| PUT | `/api/point-objects/{id}` | `PointObjectController.update()` | auth |
| DELETE | `/api/point-objects/{id}` | `PointObjectController.delete()` | auth |
| POST | `/api/point-objects/{id}/submit-approval` | `PointObjectController.submitForApproval()` | auth |

---

## 3. Component Structure

```
src/main/java/com/hanghai/kchtg/gis/point/
├── entity/
│   └── PointObject.java          ← Entity (extends BaseEntity, enum ObjectType/Status/ApprovalStatus)
├── repository/
│   └── PointObjectRepository.java ← JpaRepository + JPQL queries + ST_Distance spatial
├── dto/
│   ├── CreatePointObjectRequest.java
│   ├── UpdatePointObjectRequest.java
│   └── PointObjectResponse.java
├── service/
│   └── PointObjectService.java   ← CRUD + approval workflow + coordinate validation
└── controller/
    └── PointObjectController.java ← 9 REST endpoints with ApiResponse wrapper
```

---

## 4. Database Schema (Flyway Migrations)

### V1__F-136_init_point_objects.sql

```sql
CREATE TABLE point_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name NVARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    object_type VARCHAR(30) NOT NULL CHECK (object_type IN ('PORT', 'LIGHTHOUSE', 'BUOY', 'BEACON', 'OTHER')),
    category_id BIGINT NULL,
    icon_id BIGINT NULL,
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    description TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED_L1', 'APPROVED_L2', 'PUBLISHED', 'REJECTED', 'DELETED')),
    unit_id BIGINT NULL,
    approval_status VARCHAR(20) DEFAULT 'PENDING',
    approved_by BIGINT NULL,
    approved_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_point_objects_object_type ON point_objects(object_type);
CREATE INDEX idx_point_objects_status ON point_objects(status);
CREATE INDEX idx_point_objects_unit_id ON point_objects(unit_id);
CREATE INDEX idx_point_objects_name ON point_objects(name);

-- Spatial index for distance queries
CREATE INDEX idx_point_objects_location ON point_objects USING gist (
    ST_Point(longitude, latitude)
);
```

---

## 5. Business Rules Implementation

| Rule | Implementation |
|---|---|
| BR-GIS-001: Unique code | `PointObjectRepository.existsByCode()` + Service throws `IllegalArgumentException` |
| BR-GIS-002: WGS84 coordinate validation | `validateCoordinates()` — lon:-180~180, lat:-90~90 |
| BR-GIS-003: Approval workflow | `submitForApproval()` — DRAFT→PENDING_APPROVAL, approvalStatus=PENDING |
| BR-GIS-004: Soft delete | `delete()` — status=DELETED + `entity.softDelete()` (BaseEntity) |
| BR-GIS-005: CRUD validation | `@Valid` on DTO fields, `@NotBlank`, `@Size` constraints |

---

## 6. Estimated Complexity

| Area | Complexity | Notes |
|---|---|---|
| Entity + DTOs | Low | Standard JPA + Lombok Builder |
| Repository (CRUD + JPQL) | Medium | Spatial query with ST_Distance |
| Service (CRUD + approval) | Medium | State machine for approval workflow |
| Controller | Low | Standard REST with ApiResponse |
| Coordinate validation | Low | Simple range check |
| **Overall** | **Medium** | Approval workflow + spatial query |

---

## 7. Wave Plan

**Single wave** — code is complete. Wave focuses on verification, integration testing, and handoff to QA.

| Wave | Tasks | Deliverable |
|---|---|---|
| Wave 1 | Verify entities, DTOs, Service, Controller + integration test coverage + DB migration | Feature ready for QA review |

---

## 8. Dependencies

| Feature | Dependency | Type |
|---|---|---|
| F-136 → M-001 | `BaseEntity` (common module) | Hard |
| F-136 → M-001 | `ApiResponse<T>` (common module) | Hard |
| F-140 | Depends on F-136 for point search results | Soft |
| F-139 | Depends on F-136 for layer type="POINT" | Soft |

---

## 9. QA Strategy

| Test Type | Scope |
|---|---|
| Unit: Service | CRUD operations, approval workflow state transitions, coordinate validation |
| Unit: Repository | JPQL search queries, spatial distance query |
| Integration: Controller | All 9 endpoints, request validation, error responses |
| Integration: DB | Flyway migration, unique constraint, check constraints |
| E2E: Full flow | Create → Submit Approval → Approve L1 → Approve L2 → Published |
| Edge: Validation | Duplicate code rejection, invalid coordinate range, null name |

---

## 10. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Spatial query not supported by DB | High | Medium | Use H2 for dev, PostGIS for prod — verify compatibility |
| Approval workflow incomplete (no L1/L2 endpoint) | Medium | High | **TODO**: Add approveL1() and approveL2() methods in Service + endpoints |
| No pagination on list endpoints | Medium | Medium | Add Pageable support in Repository + Controller |
| Missing Spring Security integration | Medium | Medium | Add `@PreAuthorize` annotations per role |

---

## 11. Open Items / TODOs

1. **Approve L1/L2 endpoints** — Service has status enum values APPROVED_L1/APPROVED_L2 but no methods to transition there
2. **Add pagination** to `findAll()` and `search()` — currently returns all records
3. **Spring Security** — Add method-level security for approval actions
4. **PostGIS extension** — Verify spatial functions available in target DB
