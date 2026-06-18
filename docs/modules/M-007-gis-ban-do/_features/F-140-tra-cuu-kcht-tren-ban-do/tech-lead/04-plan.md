# Tech Lead Plan: F-140 — Tra cứu KCHT trên bản đồ

## Context

Feature F-140 provides search and query capabilities across all GIS objects (points, lines, polygons) on the map.
Supports 5 query types: TEXT (keyword search), LOCATION (nearest object), RADIUS (within radius), POLYGON (within polygon), COORDINATE (exact coordinate).
Search history tracking via `SearchQuery` entity.
Code has a skeleton implementation with TODO stubs for actual search logic — this is the main area needing completion.

## Derived Entity Design

| Entity | Table | Purpose |
|---|---|---|
| `SearchQuery` | `search_queries` | Search history and query metadata |
| `SearchResult` | `search_results` | (Reference only — results are returned in response, not persisted) |

### SearchQuery Fields

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | Inherited from BaseEntity |
| `userId` | Long | NOT NULL | Nguoi dung thuc hien tim kiem |
| `queryType` | Enum | NOT NULL | TEXT, LOCATION, RADIUS, POLYGON, COORDINATE |
| `queryText` | String(1000) | NULL | Tu khoa tim kiem |
| `queryParams` | TEXT | NULL | JSON serialized search parameters |
| `resultCount` | Integer | NULL | So luong ket qua tra ve |
| `durationMs` | Long | NULL | Thoi gian tim kiem (ms) |

---

## 1. Implementation Tasks

### Backend Tasks (Estimated: 3–4 days)

Code skeleton exists. Core search logic and search history implementation need completion.

| # | Task | File Path | Complexity | Status |
|---|---|---|---|---|
| 1.1 | Entity: `SearchQuery.java` — query metadata | `src/main/java/com/hanghai/kchtg/gis/search/entity/SearchQuery.java` | Low | ✅ Written |
| 1.2 | Entity: `SearchResult.java` | `src/main/java/com/hanghai/kchtg/gis/search/entity/SearchResult.java` | Low | ✅ Written |
| 1.3 | Repository: `SearchQueryRepository.java` | `src/main/java/com/hanghai/kchtg/gis/search/repository/SearchQueryRepository.java` | Low | ✅ Written |
| 1.4 | DTO: `SearchRequest.java` — query params + pagination | `src/main/java/com/hanghai/kchtg/gis/search/dto/SearchRequest.java` | Low | ✅ Written |
| 1.5 | DTO: `SearchResponse.java` + `SearchResultItem` | `src/main/java/com/hanghai/kchtg/gis/search/dto/SearchResponse.java` | Low | ✅ Written |
| 1.6 | DTO: `SearchHistoryResponse.java` | `src/main/java/com/hanghai/kchtg/gis/search/dto/SearchHistoryResponse.java` | Low | ✅ Written |
| 1.7 | **Service: Implement `searchByText()`** — query Point/Line/Polygon by name/code | `src/main/java/com/hanghai/kchtg/gis/search/service/SearchService.java` | High | ⚠️ TODO |
| 1.8 | **Service: Implement `searchByLocation()`** — nearest object within 500m | `src/main/java/com/hanghai/kchtg/gis/search/service/SearchService.java` | High | ⚠️ TODO |
| 1.9 | **Service: Implement `searchByRadius()`** — search within radius | `src/main/java/com/hanghai/kchtg/gis/search/service/SearchService.java` | High | ⚠️ TODO |
| 1.10 | **Service: Implement `searchByPolygon()`** — search objects within polygon | `src/main/java/com/hanghai/kchtg/gis/search/service/SearchService.java` | High | ⚠️ TODO |
| 1.11 | **Service: Implement `searchByCoordinate()`** — nearest object to coordinate | `src/main/java/com/hanghai/kchtg/gis/search/service/SearchService.java` | High | ⚠️ TODO |
| 1.12 | **Service: Fix `saveSearchQuery()`** — wire repository + ObjectMapper | `src/main/java/com/hanghai/kchtg/gis/search/service/SearchService.java` | Medium | ⚠️ TODO |
| 1.13 | **Service: Fix `getSearchHistory()`** — use proper repository, remove dummy interface | `src/main/java/com/hanghai/kchtg/gis/search/service/SearchService.java` | Medium | ⚠️ TODO |
| 1.14 | **Service: Implement `clearSearchHistory()`** — delete by userId | `src/main/java/com/hanghai/kchtg/gis/search/service/SearchService.java` | Low | ⚠️ TODO |
| 1.15 | Repository: `SearchQueryRepositoryCustom` + `SearchQueryRepositoryCustomImpl` | `src/main/java/com/hanghai/kchtg/gis/search/repository/` | Medium | ⚠️ TODO |
| 1.16 | Controller: `SearchController.java` — 3 REST endpoints | `src/main/java/com/hanghai/kchtg/gis/search/controller/SearchController.java` | Medium | ✅ Skeleton |

---

## 2. API Routes

| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | `/api/search` | `SearchController.search()` | auth |
| GET | `/api/search/history` | `SearchController.getSearchHistory()` | auth |
| DELETE | `/api/search/history` | `SearchController.clearSearchHistory()` | auth |

---

## 3. Component Structure

```
src/main/java/com/hanghai/kchtg/gis/search/
├── entity/
│   ├── SearchQuery.java            ← Search history entity
│   └── SearchResult.java           ← Result metadata (reference)
├── repository/
│   ├── SearchQueryRepository.java  ← JpaRepository
│   └── SearchQueryRepositoryCustom.java ← Custom query interface
├── dto/
│   ├── SearchRequest.java          ← Query params (query, queryType, radius, coordinates)
│   ├── SearchResponse.java         ← Results + pagination + duration
│   └── SearchHistoryResponse.java  ← Search history entry
├── service/
│   └── SearchService.java          ← Search logic (5 query types) + history
└── controller/
    └── SearchController.java       ← POST search + GET/DELETE history
```

---

## 4. Database Schema (Flyway Migrations)

### V1__F-140_init_search_queries.sql

```sql
CREATE TABLE search_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,
    query_type VARCHAR(20) NOT NULL CHECK (query_type IN ('TEXT', 'LOCATION', 'RADIUS', 'POLYGON', 'COORDINATE')),
    query_text TEXT NULL,
    query_params TEXT NULL,            -- JSON serialized params
    result_count INT NULL,
    duration_ms BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_search_queries_user_id ON search_queries(user_id);
CREATE INDEX idx_search_queries_query_type ON search_queries(query_type);
CREATE INDEX idx_search_queries_created_at ON search_queries(created_at DESC);
CREATE INDEX idx_search_queries_user_created ON search_queries(user_id, created_at DESC);
```

---

## 5. Business Rules Implementation

| Rule | Implementation |
|---|---|
| BR-GIS-040: Search timeout | `MAX_SEARCH_DURATION_MS=10000` — throw RuntimeException if exceeded |
| BR-GIS-041: Max results | `MAX_RESULTS=100` — cap total results per search |
| BR-GIS-042: Radius constraints | `@DecimalMin(50.0)` to `@DecimalMax(10000.0)` — 50m to 10km |
| BR-GIS-043: Query type required | `@NotNull` on `queryType` in SearchRequest |
| BR-GIS-044: Search history | Persist each search with userId, queryType, params, resultCount, durationMs |
| BR-GIS-045: History pagination | `getSearchHistory(userId, limit)` — return most recent N queries |

---

## 6. Estimated Complexity

| Area | Complexity | Notes |
|---|---|---|
| Entity + DTOs | Low | Standard JPA + Lombok |
| Repository (search history) | Low | Standard CRUD |
| Service: Text search | High | Cross-entity search (Point + Line + Polygon) |
| Service: Location/Radius search | High | Requires spatial queries (ST_DWithin, ST_Contains) |
| Service: Polygon search | High | Requires geometry intersection (ST_Intersects) |
| Service: Coordinate search | High | Find nearest object using distance calculations |
| Service: History | Medium | Repository custom queries + ObjectMapper serialization |
| Controller | Low | Simple REST endpoints |
| **Overall** | **High** | 5 different search types, spatial queries, cross-entity aggregation |

---

## 7. Wave Plan

**Single wave** — code skeleton exists but search logic is not implemented. Wave focuses on implementing all search methods.

| Wave | Tasks | Deliverable |
|---|---|---|
| Wave 1 | Implement all 5 search methods, fix search history, wire repository | Feature ready for QA |

---

## 8. Dependencies

| Feature | Dependency | Type |
|---|---|---|
| F-140 → M-001 | `BaseEntity`, `ApiResponse<T>` | Hard |
| F-140 → F-136 | `PointObjectRepository.searchFiltered()`, `PointObjectRepository.findByDistance()` | Hard |
| F-140 → F-137 | `LineObjectRepository` — need cross-entity search | Hard |
| F-140 → F-138 | `PolygonObjectRepository` — need cross-entity search | Hard |
| F-140 → F-139 | Layer type filtering via `layerTypes` param | Soft |

---

## 9. QA Strategy

| Test Type | Scope |
|---|---|
| Unit: SearchService | Each search method (text, location, radius, polygon, coordinate) |
| Unit: SearchService | Search history CRUD, timeout enforcement, MAX_RESULTS cap |
| Integration: Controller | POST /api/search with all query types, GET/DELETE history |
| Integration: DB | Flyway migration, search history indexing, query params serialization |
| E2E: Text search | Search across Point + Line + Polygon objects by name/code |
| E2E: Spatial search | Verify distance-based searches return correct results |
| Edge: Timeout | Search exceeding 10s throws exception |
| Edge: Pagination | Verify page/size parameters work correctly |

---

## 10. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Search logic completely stubbed | **High** | **Critical** | All 5 search methods are TODO — must implement |
| Spatial queries require PostGIS | **High** | High | Verify PostGIS extension in target DB; mock for unit tests |
| Cross-entity search performance | **High** | Medium | Add composite indexes on name/code; use UNION queries |
| ObjectMapper in Service (circular?) | Medium | Medium | Inject ObjectMapper via constructor, not static |
| No userId from SecurityContext | Medium | Medium | TODO: Get userId from authentication |
| No pagination in search | Medium | Medium | Add Pageable for large result sets |

---

## 11. Open Items / TODOs (Critical)

1. **Implement all 5 search methods** — `searchByText`, `searchByLocation`, `searchByRadius`, `searchByPolygon`, `searchByCoordinate`
2. **Fix `saveSearchQuery()`** — Inject ObjectMapper, wire repository, serialize queryParams
3. **Fix `getSearchHistory()`** — Remove dummy `SearchQueryRepositoryCustom` interface, implement properly
4. **Implement `clearSearchHistory()`** — Delete all queries for userId
5. **Get userId from SecurityContext** — Replace hardcoded `0L` in Controller and Service
6. **Add spatial indexes** on point_objects, line_objects, polygon_objects for ST_DWithin/ST_Intersects
7. **Cross-entity search aggregation** — UNION queries across Point/Line/Polygon repositories
8. **Add pagination** for large search result sets
