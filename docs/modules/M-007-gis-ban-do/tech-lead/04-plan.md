# Tech Lead Plan: M-007 — GIS / Bản đồ

> **Stage:** engineering-technical-lead
> **Date:** 2026-06-19
> **Module Status:** In Progress — BA complete → Tech Lead planning

## 1. Module Overview

Module M-007 GIS / Bản đồ provides spatial data management for the Hàng Hải project:
- **Point Objects:** Port, lighthouse, buoy, beacon management with WGS84 coordinates
- **Line Objects:** Route, coast, waterway management with coordinate strings
- **Polygon Objects:** Water zone, anchorage area, storm shelter management with area boundaries
- **Map Layers:** Layer, overlay, style, and view configuration
- **Search:** Text, location, radius, polygon, and coordinate-based GIS search with history

**Tech Stack:**
- Backend: Spring Boot 3.x + Spring Data JPA + Hibernate Spatial + JTS
- Frontend: React 18 + Vite + TypeScript + Ant Design + OpenLayers
- Database: PostgreSQL 15+ with PostGIS extension
- Build: Maven

**Total Codebase:** 60 Java files across 5 packages (point, line, polygon, layer, search)

## 2. Wave Plan — 5-Wave Breakdown

### Wave 1 (Foundation) — Day 1 — Entities + Repositories
**Goal:** All entities and repositories in place, DB schema ready.

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 1.1 | T001 | Review BaseEntity integration — verify `BaseEntity` fields (id, createdAt, updatedAt, deletedAt) shared across 18 entities | 2 | — | Senior Dev |
| 1.2 | T002 | Verify Point entities: PointObject, ObjectCategory, PointAttachment, PointHistory | 1.5 | T001 | Dev A |
| 1.3 | T003 | Verify Line entities: LineObject, LineCategory, LineAttachment, LineHistory | 1.5 | T001 | Dev B |
| 1.4 | T004 | Verify Polygon entities: PolygonObject, PolygonCategory, PolygonAttachment, PolygonHistory, PolygonOverlap | 2 | T001 | Dev A |
| 1.5 | T005 | Verify Layer entities: MapLayer, MapOverlay, MapStyle, MapView | 1.5 | T001 | Dev B |
| 1.6 | T006 | Verify Search entities: SearchQuery, SearchResult | 1 | T001 | Dev C |
| 1.7 | T007 | Review all repositories — JPA interfaces, custom JPQL queries, spatial methods | 3 | T002-T006 | Senior Dev |
| 1.8 | T008 | Validate Flyway migration SQL — all 18 tables, indexes, constraints, PostGIS spatial indices | 2 | T002-T006 | Dev C |

**Wave 1 Total: ~17 hours**

---

### Wave 2 (Core) — Day 2-3 — Services + DTOs + Controllers (Point, Line, Polygon)
**Goal:** Full CRUD REST APIs for point, line, and polygon object management with approval workflow.

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 2.1 | T009 | Review PointObjectService — CRUD + approval workflow + coordinate validation | 3 | T007 | Dev A |
| 2.2 | T010 | Review PointObjectController — 9 REST endpoints, ApiResponse wrapper, input validation | 2 | T009 | Dev A |
| 2.3 | T011 | Review DTOs for Point — CreatePointObjectRequest, UpdatePointObjectRequest, PointObjectResponse — @Valid annotations | 1 | T009 | Dev A |
| 2.4 | T012 | Review LineObjectService — CRUD + approval workflow + coordinate string validation | 3 | T007 | Dev B |
| 2.5 | T013 | Review LineObjectController — 9 REST endpoints, ApiResponse wrapper | 2 | T012 | Dev B |
| 2.6 | T014 | Review DTOs for Line — CreateLineObjectRequest, UpdateLineObjectRequest, LineObjectResponse | 1 | T012 | Dev B |
| 2.7 | T015 | Review PolygonObjectService — CRUD + overlap detection + area calculation | 3.5 | T007 | Dev A |
| 2.8 | T016 | Review PolygonObjectController — 9 REST endpoints + spatial overlap endpoint | 2.5 | T015 | Dev A |
| 2.9 | T017 | Review DTOs for Polygon — CreatePolygonObjectRequest, UpdatePolygonObjectRequest, PolygonObjectResponse | 1 | T015 | Dev A |

**Wave 2 Total: ~22.5 hours**

---

### Wave 3 (Advanced) — Day 3-4 — Layer Management + Search
**Goal:** Map layer management and GIS search APIs complete.

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 3.1 | T018 | Review MapLayerService — CRUD for MapLayer, MapOverlay, MapStyle, MapView | 3.5 | T007 | Dev C |
| 3.2 | T019 | Review MapLayerController — CRUD endpoints + layer/overlay/style/view sub-endpoints | 2.5 | T018 | Dev C |
| 3.3 | T020 | Review 8 Layer DTOs — Create/Update/Response for all 4 entities | 2 | T018 | Dev C |
| 3.4 | T021 | Review SearchService — text search, radius search, polygon intersection, coordinate lookup | 3 | T007 | Dev B |
| 3.5 | T022 | Review SearchController — search POST + history GET + search type endpoints | 2 | T021 | Dev B |
| 3.6 | T023 | Review Search DTOs — SearchRequest, SearchResponse, SearchHistoryResponse | 1 | T021 | Dev B |

**Wave 3 Total: ~14 hours**

---

### Wave 4 (QA) — Day 4-5 — Unit Tests for All Services & Controllers
**Goal:** Test coverage ≥80% for all service and controller logic.

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 4.1 | T024 | Write unit tests for PointObjectService — CRUD + approval + coord validation | 4 | T011 | QA A |
| 4.2 | T025 | Write unit tests for PointObjectController — all 9 endpoints | 3 | T024 | QA A |
| 4.3 | T026 | Write unit tests for LineObjectService — CRUD + approval + coord string | 4 | T014 | QA B |
| 4.4 | T027 | Write unit tests for LineObjectController — all 9 endpoints | 3 | T026 | QA B |
| 4.5 | T028 | Write unit tests for PolygonObjectService — CRUD + overlap detection + area | 4.5 | T017 | QA A |
| 4.6 | T029 | Write unit tests for PolygonObjectController — CRUD + overlap endpoint | 3 | T028 | QA A |
| 4.7 | T030 | Write unit tests for MapLayerService — CRUD for all 4 entity types | 4 | T020 | QA B |
| 4.8 | T031 | Write unit tests for MapLayerController — all layer endpoints | 3 | T030 | QA B |
| 4.9 | T032 | Write unit tests for SearchService — text/coord/radius/polygon search | 4 | T023 | QA A |
| 4.10 | T033 | Write unit tests for SearchController — search + history endpoints | 2.5 | T032 | QA A |
| 4.11 | T034 | Integration test: approval workflow full lifecycle (DRAFT→PUBLISHED) | 3 | T024,T026,T028 | QA A |
| 4.12 | T035 | Integration test: spatial queries — distance, overlap, bounding-box | 3.5 | T028,T032 | QA B |
| 4.13 | T036 | Edge-case tests: duplicate code rejection, invalid coordinates, null name, empty search | 3 | T024-T035 | QA A |

**Wave 4 Total: ~42.5 hours**

---

### Wave 5 (Integration) — Day 5-6 — E2E + Security + Performance
**Goal:** End-to-end flows verified, security applied, performance baseline.

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 5.1 | T037 | E2E: Create Point → Submit Approval → Approve L1 → Approve L2 → Publish full flow | 3 | T036 | QA B |
| 5.2 | T038 | E2E: Create Line → Approve → Search by name → Display on map | 2.5 | T036 | QA B |
| 5.3 | T039 | E2E: Create Polygon → Overlap check → Manage Layers → Search within polygon | 3.5 | T036 | QA B |
| 5.4 | T040 | E2E: Layer management full flow — create layer + overlay + style + mapview | 3 | T037 | QA A |
| 5.5 | T041 | E2E: Search history — search → view history → replay search | 2 | T037 | QA A |
| 5.6 | T042 | Security: Apply @PreAuthorize to approval endpoints — role-based access | 2.5 | T037 | Senior Dev |
| 5.7 | T043 | Security: CORS, CSRF, API rate limiting for search endpoints | 2 | T042 | Senior Dev |
| 5.8 | T044 | Performance: Load test 1000 concurrent search requests — target <500ms P95 | 3 | T042 | Dev C |
| 5.9 | T045 | Performance: Spatial query optimization — verify PostGIS index usage with EXPLAIN | 2.5 | T044 | Dev C |
| 5.10 | T046 | Final integration smoke test — all features end-to-end, no regression | 4 | T042-T045 | Senior Dev |

**Wave 5 Total: ~25.5 hours**

---

## 3. Total Estimated Effort

| Wave | Description | Hours |
|------|-------------|-------|
| Wave 1 | Entities + Repositories | 17 |
| Wave 2 | Services + DTOs + Controllers (Point/Line/Polygon) | 22.5 |
| Wave 3 | Layer + Search | 14 |
| Wave 4 | Unit Tests | 42.5 |
| Wave 5 | E2E + Security + Performance | 25.5 |
| **Total** | **All waves** | **121.5 hours** |

## 4. Feature-Level Plans

Detailed per-feature wave plans with task assignments:

1. [F-136 — Quản lý danh mục đối tượng điểm](../_features/F-136-quan-ly-danh-muc-doi-tuong-diem/04-plan.md)
2. [F-137 — Quản lý danh mục đối tượng đường](../_features/F-137-quan-ly-danh-muc-doi-tuong-duong/04-plan.md)
3. [F-138 — Quản lý danh mục đối tượng vùng](../_features/F-138-quan-ly-danh-muc-doi-tuong-vung/04-plan.md)
4. [F-139 — Quản lý thông tin KCHT trên bản đồ](../_features/F-139-quan-ly-thong-tin-kcht-tren-ban-do/04-plan.md)
5. [F-140 — Tra cứu KCHT trên bản đồ](../_features/F-140-tra-cuu-kcht-tren-ban-do/04-plan.md)

## 5. Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| PostGIS extension not available in dev DB | High | Medium | Use H2 + spatial mock for dev; PostGIS for staging/prod |
| Approval workflow incomplete (no L1/L2 endpoint) | Medium | High | Add approveL1()/approveL2() methods in Wave 2 |
| Pagination missing on list endpoints | Medium | Medium | Add Pageable support in all Repository findAll() |
| Security not integrated | Medium | Medium | Apply @PreAuthorize per role in Wave 5 |
| Spatial queries slow on large datasets | High | Low | Pre-create PostGIS GIST indexes in Wave 1 |

## 6. Open Items

1. **Approve L1/L2 endpoints** — Service has APPROVED_L1/APPROVED_L2 status but no methods to transition there
2. **Add pagination** — Currently all list endpoints return all records; add `Pageable`
3. **Spring Security** — Need `@PreAuthorize` annotations for approval actions
4. **PostGIS extension** — Verify spatial functions available in target DB
5. **Frontend OpenLayers integration** — Map rendering components not yet implemented
