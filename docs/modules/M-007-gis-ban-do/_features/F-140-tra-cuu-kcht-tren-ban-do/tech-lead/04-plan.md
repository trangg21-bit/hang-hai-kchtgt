# Tech Lead Plan: F-140 — Tra cứu KCHT trên bản đồ

> **Feature:** F-140 — Tra cứu KCHT trên bản đồ
> **Module:** M-007 GIS / Bản đồ
> **Stage:** engineering-technical-lead
> **Date:** 2026-06-19

## 1. Feature Summary

Tra cứu thông tin kết cấu hạ tầng trên nền bản đồ GIS với 5 loại tìm kiếm:
- **TEXT:** Tìm kiếm theo tên/mã
- **LOCATION:** Tìm kiếm theo tọa độ point
- **RADIUS:** Tìm kiếm theo bán kính từ tâm
- **POLYGON:** Tìm kiếm trong vùng đa giác
- **COORDINATE:** Tìm kiếm chính xác tại tọa độ

Kết quả trả về bao gồm: PointObject, LineObject, PolygonObject với khoảng cách và highlight info.
Lịch sử tra cứu được lưu vào SearchQuery + SearchResult.

**Codebase:** 8 files
- `search/entity/`: SearchQuery, SearchResult (2 entities)
- `search/repository/`: SearchQueryRepository, SearchResultRepository (2 repos)
- `search/dto/`: SearchRequest, SearchResponse, SearchHistoryResponse (3 DTOs)
- `search/service/`: SearchService (1 service)
- `search/controller/`: SearchController (1 controller)

## 2. Wave Plan — F-140 Specific Tasks

### Wave 1 (Foundation) — Entity + Repository Verification

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 1.1 | F140-W1-01 | Verify SearchQuery entity — 6 fields: id, userId, queryType (ENUM), queryText, queryParams (TEXT JSON), resultCount, durationMs | 0.5 | — | Dev B |
| 1.2 | F140-W1-02 | Verify SearchResult entity — 8 fields: id, queryId, objectId, objectType (POINT/LINE/POLYGON), name, code, distance, highlighted | 0.5 | — | Dev B |
| 1.3 | F140-W1-03 | Review SearchQueryRepository — CRUD + findByUserId + findByUserIdAndQueryType + search by queryText | 1.5 | F140-W1-01 | Senior Dev |
| 1.4 | F140-W1-04 | Review SearchResultRepository — CRUD + findByQueryId + findByObjectId + findByObjectType | 1.5 | F140-W1-02 | Dev B |
| 1.5 | F140-W1-05 | Verify Flyway V5 migration — search_queries, search_results tables, FK queryId, indexes | 1 | F140-W1-03 | Dev C |
| 1.6 | F140-W1-06 | Verify BaseEntity inheritance — soft delete, createdAt, updatedAt | 0.5 | F140-W1-01 | Dev B |

**Wave 1 F-140 Total: ~5.5 hours**

---

### Wave 2 (Core) — Service + DTOs + Controller Review

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 2.1 | F140-W2-01 | Review SearchRequest DTO — queryType enum, queryText, queryParams (lon/lat/radius/polygon coordinates), limit, offset | 1 | F140-W1-01 | Dev B |
| 2.2 | F140-W2-02 | Review SearchResponse DTO — totalCount, results array (object id, type, name, code, distance, highlighted) | 0.5 | F140-W1-01 | Dev B |
| 2.3 | F140-W2-03 | Review SearchHistoryResponse DTO — paginated history entries with queryType, queryText, resultCount, durationMs, timestamp | 0.5 | F140-W1-01 | Dev B |
| 2.4 | F140-W2-04 | Review SearchService — 5 search methods: textSearch, locationSearch, radiusSearch, polygonSearch, coordinateSearch | 4 | F140-W1-03 | Dev B |
| 2.5 | F140-W2-05 | Verify SearchService — textSearch calls PointObject/LineObject/PolygonObject repository text search + union results | 1.5 | F140-W2-04 | Dev B |
| 2.6 | F140-W2-06 | Verify SearchService — radiusSearch uses ST_Distance, returns results within radius, calculates distance | 2 | F140-W2-04 | Dev B |
| 2.7 | F140-W2-07 | Verify SearchService — polygonSearch uses ST_Within/ST_Intersects, returns objects inside polygon | 1.5 | F140-W2-04 | Dev B |
| 2.8 | F140-W2-08 | Verify SearchService — coordinateSearch returns exact matches at given coordinates | 1 | F140-W2-04 | Dev B |
| 2.9 | F140-W2-09 | Verify SearchService — history logging: create SearchQuery + SearchResult records after each search | 1.5 | F140-W2-04 | Dev B |
| 2.10 | F140-W2-10 | Review SearchController — search POST, history GET, history type filters | 2 | F140-W2-04 | Dev B |

**Wave 2 F-140 Total: ~15.5 hours**

---

### Wave 3 (Advanced) — Integration with Other Features

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 3.1 | F140-W3-01 | Verify PointObject integration — SearchService uses PointObjectRepository for type=POINT results | 1 | F140-W2-09 | Dev C |
| 3.2 | F140-W3-02 | Verify LineObject integration — SearchService uses LineObjectRepository for type=LINE results | 1 | F140-W2-09 | Dev C |
| 3.3 | F140-W3-03 | Verify PolygonObject integration — SearchService uses PolygonObjectRepository for type=POLYGON results | 1 | F140-W2-09 | Dev C |
| 3.4 | F140-W3-04 | Verify SearchResult objectType field matches entity types across all 3 object features | 0.5 | F140-W3-01 | Dev C |
| 3.5 | F140-W3-05 | Pagination and sorting for search results — verify limit/offset in repository queries | 1 | F140-W2-04 | Dev B |

**Wave 3 F-140 Total: ~4.5 hours**

---

### Wave 4 (QA) — Unit Tests for F-140

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 4.1 | F140-W4-01 | Unit test SearchService — textSearch (finds in Point + Line + Polygon) | 2 | F140-W2-10 | QA A |
| 4.2 | F140-W4-02 | Unit test SearchService — locationSearch (point near given coordinates) | 1.5 | F140-W4-01 | QA A |
| 4.3 | F140-W4-03 | Unit test SearchService — radiusSearch (finds within radius, calculates distance) | 2 | F140-W4-01 | QA A |
| 4.4 | F140-W4-04 | Unit test SearchService — polygonSearch (finds objects inside polygon) | 2 | F140-W4-01 | QA A |
| 4.5 | F140-W4-05 | Unit test SearchService — coordinateSearch (exact match at coordinates) | 1.5 | F140-W4-01 | QA A |
| 4.6 | F140-W4-06 | Unit test SearchService — history logging (creates SearchQuery + SearchResult) | 1.5 | F140-W4-01 | QA A |
| 4.7 | F140-W4-07 | Unit test SearchController — search POST + history GET endpoints, ApiResponse wrapper | 2.5 | F140-W4-01 | QA A |
| 4.8 | F140-W4-08 | Integration test — Flyway migration, FK relations, search query → result link | 2 | F140-W4-01 | QA B |
| 4.9 | F140-W4-09 | Edge-case tests — empty search, invalid coordinates, very large radius, unicode query text | 2 | F140-W4-01 | QA A |
| 4.10 | F140-W4-10 | Performance test — verify search <500ms for 1000 objects across 3 types | 1.5 | F140-W4-01 | QA B |

**Wave 4 F-140 Total: ~17.5 hours**

---

### Wave 5 (Integration) — E2E + Security for F-140

| # | Task ID | Description | Est. Hours | Dependencies | Assignee |
|---|---------|-------------|------------|--------------|----------|
| 5.1 | F140-W5-01 | E2E: Full search flow — Create objects → Text search → Radius search → Polygon search → View results | 3 | F140-W4-09 | QA B |
| 5.2 | F140-W5-02 | E2E: Search history — Search multiple times → View history → Replay search | 2 | F140-W5-01 | QA B |
| 5.3 | F140-W5-03 | E2E: Search display — Results displayed on map with distance and highlight | 2.5 | F140-W5-01 | QA A |
| 5.4 | F140-W5-04 | Security: @PreAuthorize on search endpoints — auth required, no admin-only actions | 1 | Senior Dev |

**Wave 5 F-140 Total: ~8.5 hours**

---

## 3. Total Estimated Effort for F-140

| Wave | Description | Hours |
|------|-------------|-------|
| Wave 1 | Entity + Repository Verification | 5.5 |
| Wave 2 | Service + DTOs + Controller Review | 15.5 |
| Wave 3 | Integration with Other Features | 4.5 |
| Wave 4 | Unit Tests | 17.5 |
| Wave 5 | E2E + Security | 8.5 |
| **Total** | **F-140** | **51.5 hours** |

## 4. API Routes

| Method | Path | Handler | Auth |
|--------|------|---------|------|
| POST | `/api/gis-search` | `SearchController.search()` | auth |
| GET | `/api/gis-search/history` | `SearchController.getHistory()` | auth |
| GET | `/api/gis-search/history/type/{queryType}` | `SearchController.getHistoryByType()` | auth |
| GET | `/api/gis-search/history/user/{userId}` | `SearchController.getHistoryByUser()` | auth |
| DELETE | `/api/gis-search/history/{queryId}` | `SearchController.deleteHistory()` | auth |

## 5. Dependencies

| Feature | Dependency | Type |
|---------|------------|------|
| F-140 → M-001 | `BaseEntity` (common module) | Hard |
| F-140 → M-001 | `ApiResponse<T>` (common module) | Hard |
| F-140 → F-136 | Uses PointObjectRepository for POINT search results | Hard |
| F-140 → F-137 | Uses LineObjectRepository for LINE search results | Hard |
| F-140 → F-138 | Uses PolygonObjectRepository for POLYGON search results | Hard |

## 6. Business Rules

| Rule ID | Rule | Implementation |
|---------|------|----------------|
| BR-GIS-041 | 5 search types | SearchService routes queryType to appropriate search method |
| BR-GIS-042 | Distance calculation | radiusSearch uses ST_Distance, returns distance in meters |
| BR-GIS-043 | Polygon containment | polygonSearch uses ST_Within/ST_Intersects |
| BR-GIS-044 | Search history logging | Every search creates SearchQuery + SearchResult records |
| BR-GIS-045 | Result ranking | Results ranked by distance (closest first), then name match |
| BR-GIS-046 | Pagination | limit/offset supported, default limit=20 |

## 7. Open Items / TODOs

1. **Add pagination** to `findAll()` and `getHistory()` — currently returns all records
2. **Spring Security** — Add method-level security: auth required on all endpoints (Wave 5)
3. **Spatial index coverage** — Verify PostGIS GIST indexes on all point/line/polygon coordinates
4. **Search result caching** — Consider Redis cache for frequent search queries
5. **GeoJSON output format** — Add option to return results as GeoJSON for OpenLayers display
6. **Autocomplete** — Add `/api/gis-search/autocomplete` endpoint for quick text search
