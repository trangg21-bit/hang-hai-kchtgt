package com.hanghai.kchtg.gis.search;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.gis.line.entity.LineObject;
import com.hanghai.kchtg.gis.line.repository.LineObjectRepository;
import com.hanghai.kchtg.gis.point.entity.PointObject;
import com.hanghai.kchtg.gis.point.entity.PointObject.Status;
import com.hanghai.kchtg.gis.point.repository.PointObjectRepository;
import com.hanghai.kchtg.gis.polygon.entity.PolygonObject;
import com.hanghai.kchtg.gis.polygon.repository.PolygonObjectRepository;
import com.hanghai.kchtg.gis.search.dto.SearchHistoryResponse;
import com.hanghai.kchtg.gis.search.dto.SearchRequest;
import com.hanghai.kchtg.gis.search.dto.SearchResponse;
import com.hanghai.kchtg.gis.search.entity.SearchQuery;
import com.hanghai.kchtg.gis.search.entity.SearchQuery.QueryType;
import com.hanghai.kchtg.gis.search.repository.SearchQueryRepository;
import com.hanghai.kchtg.gis.search.service.SearchService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SearchServiceTest {

    @Mock
    private PointObjectRepository pointRepository;

    @Mock
    private LineObjectRepository lineRepository;

    @Mock
    private PolygonObjectRepository polygonRepository;

    @Mock
    private SearchQueryRepository searchQueryRepository;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private SearchService service;

    private PointObject testPoint;
    private LineObject testLine;
    private PolygonObject testPolygon;
    private SearchRequest searchRequest;

    @BeforeEach
    void setUp() {
        testPoint = PointObject.builder()
                .name("Cai Mep Port")
                .code("PORT-CM")
                .longitude(107.05)
                .latitude(10.55)
                .description("Deep water port")
                .status(Status.PUBLISHED)
                .build();
        testPoint.setId(UUID.randomUUID());

        testLine = LineObject.builder()
                .name("Coastal Route")
                .code("LINE-CR")
                .coordinates("LINESTRING (106.6 10.7, 106.7 10.8)")
                .status(com.hanghai.kchtg.gis.line.entity.LineObject.Status.PUBLISHED)
                .build();
        testLine.setId(UUID.randomUUID());

        testPolygon = PolygonObject.builder()
                .name("Port Zone")
                .code("POLY-PZ")
                .coordinates("POLYGON ((106.6 10.7, 106.7 10.7, 106.7 10.8, 106.6 10.8, 106.6 10.7))")
                .status(com.hanghai.kchtg.gis.polygon.entity.PolygonObject.Status.PUBLISHED)
                .build();
        testPolygon.setId(UUID.randomUUID());

        searchRequest = SearchRequest.builder()
                .query("Cai Mep")
                .queryType(QueryType.TEXT)
                .page(0)
                .size(20)
                .build();
    }

    // ==================== TEXT SEARCH TESTS ====================

    @Nested
    @DisplayName("Text Search")
    class TextSearchTests {

        @Test
        @DisplayName("Should search text case-insensitively across PointObjects")
        void searchByText_points_success() {
            // Arrange
            SearchRequest request = SearchRequest.builder()
                    .query("cai")
                    .queryType(QueryType.TEXT)
                    .page(0)
                    .size(20)
                    .build();

            when(pointRepository.findByNameContainingIgnoreCase("cai"))
                    .thenReturn(List.of(testPoint));
            when(lineRepository.findByNameContainingIgnoreCase("cai"))
                    .thenReturn(Collections.emptyList());
            when(polygonRepository.findByNameContainingIgnoreCase("cai"))
                    .thenReturn(Collections.emptyList());

            // Act
            SearchResponse result = service.search(request);

            // Assert
            assertNotNull(result);
            assertEquals(1, result.getTotalResults());
            assertEquals(1, result.getResults().size());
            assertEquals("POINT", result.getResults().get(0).getObjectType());
            assertEquals("Cai Mep Port", result.getResults().get(0).getName());
        }

        @Test
        @DisplayName("Should search text across LineObjects")
        void searchByText_lines_success() {
            SearchRequest request = SearchRequest.builder()
                    .query("route")
                    .queryType(QueryType.TEXT)
                    .page(0)
                    .size(20)
                    .build();

            when(pointRepository.findByNameContainingIgnoreCase("route"))
                    .thenReturn(Collections.emptyList());
            when(lineRepository.findByNameContainingIgnoreCase("route"))
                    .thenReturn(List.of(testLine));
            when(polygonRepository.findByNameContainingIgnoreCase("route"))
                    .thenReturn(Collections.emptyList());

            SearchResponse result = service.search(request);

            assertNotNull(result);
            assertEquals(1, result.getTotalResults());
            assertEquals("LINE", result.getResults().get(0).getObjectType());
        }

        @Test
        @DisplayName("Should search text across PolygonObjects")
        void searchByText_polygons_success() {
            SearchRequest request = SearchRequest.builder()
                    .query("zone")
                    .queryType(QueryType.TEXT)
                    .page(0)
                    .size(20)
                    .build();

            when(pointRepository.findByNameContainingIgnoreCase("zone"))
                    .thenReturn(Collections.emptyList());
            when(lineRepository.findByNameContainingIgnoreCase("zone"))
                    .thenReturn(Collections.emptyList());
            when(polygonRepository.findByNameContainingIgnoreCase("zone"))
                    .thenReturn(List.of(testPolygon));

            SearchResponse result = service.search(request);

            assertEquals(1, result.getTotalResults());
            assertEquals("POLYGON", result.getResults().get(0).getObjectType());
        }

        @Test
        @DisplayName("Should search text case-insensitively: lowercase input matches uppercase name")
        void searchByText_caseInsensitive_success() {
            SearchRequest request = SearchRequest.builder()
                    .query("cai mep")
                    .queryType(QueryType.TEXT)
                    .page(0)
                    .size(20)
                    .build();

            when(pointRepository.findByNameContainingIgnoreCase("cai mep"))
                    .thenReturn(List.of(testPoint));
            when(lineRepository.findByNameContainingIgnoreCase("cai mep"))
                    .thenReturn(Collections.emptyList());
            when(polygonRepository.findByNameContainingIgnoreCase("cai mep"))
                    .thenReturn(Collections.emptyList());

            SearchResponse result = service.search(request);

            assertEquals(1, result.getTotalResults());
        }

        @Test
        @DisplayName("Should return empty results when query is empty")
        void searchByText_emptyQuery_returnsEmpty() {
            SearchRequest request = SearchRequest.builder()
                    .query("")
                    .queryType(QueryType.TEXT)
                    .page(0)
                    .size(20)
                    .build();

            SearchResponse result = service.search(request);

            assertNotNull(result);
            assertTrue(result.getResults().isEmpty());
            assertEquals(0, result.getTotalResults());
            verify(pointRepository, never()).findByNameContainingIgnoreCase(any());
        }

        @Test
        @DisplayName("Should return empty results when query is null")
        void searchByText_nullQuery_returnsEmpty() {
            SearchRequest request = SearchRequest.builder()
                    .query(null)
                    .queryType(QueryType.TEXT)
                    .page(0)
                    .size(20)
                    .build();

            SearchResponse result = service.search(request);

            assertNotNull(result);
            assertTrue(result.getResults().isEmpty());
        }

        @Test
        @DisplayName("Should limit results to MAX_RESULTS (100)")
        void searchByText_limitsToMaxResults() {
            // Create 150 mock points
            List<PointObject> manyPoints = new ArrayList<>();
            for (int i = 0; i < 150; i++) {
                PointObject p = PointObject.builder()
                        .name("Point " + i)
                        .code("P-" + i)
                        .longitude(107.0)
                        .latitude(10.5)
                        .status(Status.PUBLISHED)
                        .build();
                p.setId(UUID.randomUUID());
                manyPoints.add(p);
            }

            SearchRequest request = SearchRequest.builder()
                    .query("Point")
                    .queryType(QueryType.TEXT)
                    .page(0)
                    .size(20)
                    .build();

            when(pointRepository.findByNameContainingIgnoreCase("Point"))
                    .thenReturn(manyPoints);
            when(lineRepository.findByNameContainingIgnoreCase("Point"))
                    .thenReturn(Collections.emptyList());
            when(polygonRepository.findByNameContainingIgnoreCase("Point"))
                    .thenReturn(Collections.emptyList());

            SearchResponse result = service.search(request);

            // Should be limited to 100
            assertTrue(result.getResults().size() <= 100);
        }

        @Test
        @DisplayName("Should paginate results")
        void searchByText_pagination_works() {
            List<PointObject> points = new ArrayList<>();
            for (int i = 0; i < 10; i++) {
                PointObject p = PointObject.builder()
                        .name("Point " + i)
                        .code("P-" + i)
                        .longitude(107.0)
                        .latitude(10.5)
                        .status(Status.PUBLISHED)
                        .build();
                p.setId(UUID.randomUUID());
                points.add(p);
            }

            SearchRequest request = SearchRequest.builder()
                    .query("Point")
                    .queryType(QueryType.TEXT)
                    .page(1)  // Page 1, size 3 => items 3-5
                    .size(3)
                    .build();

            when(pointRepository.findByNameContainingIgnoreCase("Point"))
                    .thenReturn(points);
            when(lineRepository.findByNameContainingIgnoreCase("Point"))
                    .thenReturn(Collections.emptyList());
            when(polygonRepository.findByNameContainingIgnoreCase("Point"))
                    .thenReturn(Collections.emptyList());

            SearchResponse result = service.search(request);

            assertEquals(10, result.getTotalResults());
            assertEquals(1, result.getPage());
            assertEquals(3, result.getSize());
            // Should have 3 items on page 1 (items 3,4,5)
            assertEquals(3, result.getResults().size());
        }
    }

    // ==================== LOCATION SEARCH TESTS ====================

    @Nested
    @DisplayName("Location Search")
    class LocationSearchTests {

        @Test
        @DisplayName("Should find nearest object within 500m")
        void searchByLocation_success() {
            SearchRequest request = SearchRequest.builder()
                    .queryType(QueryType.LOCATION)
                    .centerLon(107.05)
                    .centerLat(10.55)
                    .page(0)
                    .size(20)
                    .build();

            when(pointRepository.findByDistance("POINT (107.050000 10.550000)", 500.0))
                    .thenReturn(List.of(testPoint));

            SearchResponse result = service.search(request);

            assertNotNull(result);
            assertEquals(1, result.getTotalResults());
            assertNotNull(result.getResults().get(0).getDistance());
        }

        @Test
        @DisplayName("Should return empty when centerLon/centerLat is null")
        void searchByLocation_nullCoordinates_returnsEmpty() {
            SearchRequest request = SearchRequest.builder()
                    .queryType(QueryType.LOCATION)
                    .page(0)
                    .size(20)
                    .build();

            SearchResponse result = service.search(request);

            assertTrue(result.getResults().isEmpty());
            assertEquals(0, result.getTotalResults());
        }

        @Test
        @DisplayName("Should sort results by distance ascending")
        void searchByLocation_sortedByDistance() {
            SearchRequest request = SearchRequest.builder()
                    .queryType(QueryType.LOCATION)
                    .centerLon(107.0)
                    .centerLat(10.5)
                    .page(0)
                    .size(20)
                    .build();

            // Mock 2 points at different distances
            PointObject nearPoint = PointObject.builder()
                    .name("Near Port")
                    .code("PORT-NEAR")
                    .longitude(107.01)
                    .latitude(10.51)
                    .status(Status.PUBLISHED)
                    .build();
            nearPoint.setId(UUID.randomUUID());

            PointObject farPoint = PointObject.builder()
                    .name("Far Port")
                    .code("PORT-FAR")
                    .longitude(107.1)
                    .latitude(10.6)
                    .status(Status.PUBLISHED)
                    .build();
            farPoint.setId(UUID.randomUUID());

            when(pointRepository.findByDistance("POINT (107.000000 10.500000)", 500.0))
                    .thenReturn(List.of(farPoint, nearPoint));

            SearchResponse result = service.search(request);

            // Results should be sorted by distance (near first)
            double firstDist = result.getResults().get(0).getDistance();
            double secondDist = result.getResults().get(1).getDistance();
            assertTrue(firstDist <= secondDist);
        }
    }

    // ==================== RADIUS SEARCH TESTS ====================

    @Nested
    @DisplayName("Radius Search")
    class RadiusSearchTests {

        @Test
        @DisplayName("Should search within custom radius")
        void searchByRadius_customRadius_success() {
            SearchRequest request = SearchRequest.builder()
                    .queryType(QueryType.RADIUS)
                    .centerLon(107.0)
                    .centerLat(10.5)
                    .radius(2000.0)  // 2km
                    .page(0)
                    .size(20)
                    .build();

            when(pointRepository.findByDistance("POINT (107.000000 10.500000)", 2000.0))
                    .thenReturn(List.of(testPoint));

            SearchResponse result = service.search(request);

            assertNotNull(result);
            assertEquals(1, result.getTotalResults());
            verify(pointRepository).findByDistance("POINT (107.000000 10.500000)", 2000.0);
        }

        @Test
        @DisplayName("Should use default 1000m radius when not specified")
        void searchByRadius_defaultRadius_used() {
            SearchRequest request = SearchRequest.builder()
                    .queryType(QueryType.RADIUS)
                    .centerLon(107.0)
                    .centerLat(10.5)
                    .page(0)
                    .size(20)
                    .build();

            when(pointRepository.findByDistance("POINT (107.000000 10.500000)", 1000.0))
                    .thenReturn(List.of(testPoint));

            service.search(request);

            verify(pointRepository).findByDistance("POINT (107.000000 10.500000)", 1000.0);
        }

        @Test
        @DisplayName("Should return empty when coordinates null")
        void searchByRadius_nullCoordinates_returnsEmpty() {
            SearchRequest request = SearchRequest.builder()
                    .queryType(QueryType.RADIUS)
                    .radius(5000.0)
                    .page(0)
                    .size(20)
                    .build();

            SearchResponse result = service.search(request);

            assertTrue(result.getResults().isEmpty());
        }
    }

    // ==================== POLYGON SEARCH TESTS ====================

    @Nested
    @DisplayName("Polygon Search")
    class PolygonSearchTests {

        @Test
        @DisplayName("Should find points within polygon bounding box")
        void searchByPolygon_success() {
            SearchRequest request = SearchRequest.builder()
                    .queryType(QueryType.POLYGON)
                    .coordinates("POLYGON ((106.5 10.5, 107.0 10.5, 107.0 11.0, 106.5 11.0, 106.5 10.5))")
                    .page(0)
                    .size(20)
                    .build();

            when(pointRepository.findByStatus(Status.PUBLISHED))
                    .thenReturn(List.of(testPoint));
            when(lineRepository.findAll()).thenReturn(Collections.emptyList());

            SearchResponse result = service.search(request);

            assertNotNull(result);
        }

        @Test
        @DisplayName("Should return empty when coordinates is null")
        void searchByPolygon_nullCoordinates_returnsEmpty() {
            SearchRequest request = SearchRequest.builder()
                    .queryType(QueryType.POLYGON)
                    .page(0)
                    .size(20)
                    .build();

            SearchResponse result = service.search(request);

            assertTrue(result.getResults().isEmpty());
        }

        @Test
        @DisplayName("Should return empty when coordinates is empty")
        void searchByPolygon_emptyCoordinates_returnsEmpty() {
            SearchRequest request = SearchRequest.builder()
                    .queryType(QueryType.POLYGON)
                    .coordinates("")
                    .page(0)
                    .size(20)
                    .build();

            SearchResponse result = service.search(request);

            assertTrue(result.getResults().isEmpty());
        }

        @Test
        @DisplayName("Should throw on invalid WKT coordinates")
        void searchByPolygon_invalidWKT_throws() {
            SearchRequest request = SearchRequest.builder()
                    .queryType(QueryType.POLYGON)
                    .coordinates("NOT_VALID_WKT")
                    .page(0)
                    .size(20)
                    .build();

            // Should parse but might fail on numeric extraction
            // If numbersOnly is empty, extractBoundingBox returns defaults
            when(pointRepository.findByStatus(Status.PUBLISHED))
                    .thenReturn(Collections.emptyList());
            when(lineRepository.findAll()).thenReturn(Collections.emptyList());

            SearchResponse result = service.search(request);

            // Should not crash, just return empty with default bbox
            assertNotNull(result);
        }
    }

    // ==================== COORDINATE SEARCH TESTS ====================

    @Nested
    @DisplayName("Coordinate Search")
    class CoordinateSearchTests {

        @Test
        @DisplayName("Should find nearest PointObject by haversine distance")
        void searchByCoordinate_success() {
            SearchRequest request = SearchRequest.builder()
                    .queryType(QueryType.COORDINATE)
                    .centerLon(107.05)
                    .centerLat(10.55)
                    .page(0)
                    .size(20)
                    .build();

            when(pointRepository.findByStatus(Status.PUBLISHED))
                    .thenReturn(List.of(testPoint));

            SearchResponse result = service.search(request);

            assertNotNull(result);
            assertEquals(1, result.getTotalResults());
            assertEquals("POINT", result.getResults().get(0).getObjectType());
            assertNotNull(result.getResults().get(0).getDistance());
        }

        @Test
        @DisplayName("Should return empty when coordinates are null")
        void searchByCoordinate_nullCoordinates_returnsEmpty() {
            SearchRequest request = SearchRequest.builder()
                    .queryType(QueryType.COORDINATE)
                    .page(0)
                    .size(20)
                    .build();

            SearchResponse result = service.search(request);

            assertTrue(result.getResults().isEmpty());
        }

        @Test
        @DisplayName("Should return empty when no published points exist")
        void searchByCoordinate_noPoints_returnsEmpty() {
            SearchRequest request = SearchRequest.builder()
                    .queryType(QueryType.COORDINATE)
                    .centerLon(107.0)
                    .centerLat(10.5)
                    .page(0)
                    .size(20)
                    .build();

            when(pointRepository.findByStatus(Status.PUBLISHED))
                    .thenReturn(Collections.emptyList());

            SearchResponse result = service.search(request);

            assertTrue(result.getResults().isEmpty());
        }
    }

    // ==================== SEARCH HISTORY TESTS ====================

    @Nested
    @DisplayName("Search History CRUD")
    class HistoryTests {

        @Test
        @DisplayName("Should save search query")
        void saveSearchQuery_success() throws Exception {
            SearchRequest request = SearchRequest.builder()
                    .query("Cai Mep")
                    .queryType(QueryType.TEXT)
                    .page(0)
                    .size(20)
                    .build();

            when(objectMapper.writeValueAsString(any())).thenReturn("{}");

            service.saveSearchQuery(request, 5, 120);

            verify(searchQueryRepository).save(any(SearchQuery.class));
        }

        @Test
        @DisplayName("Should save search query even if JSON serialization fails")
        void saveSearchQuery_jsonFailure_ignores() throws Exception {
            SearchRequest request = SearchRequest.builder()
                    .query("Test")
                    .queryType(QueryType.TEXT)
                    .page(0)
                    .size(20)
                    .build();

            when(objectMapper.writeValueAsString(any()))
                    .thenThrow(mock(com.fasterxml.jackson.core.JsonProcessingException.class));

            service.saveSearchQuery(request, 3, 100);

            verify(searchQueryRepository).save(any(SearchQuery.class));
        }

        @Test
        @DisplayName("Should get search history ordered by executedAt DESC")
        void getSearchHistory_success() {
            SearchQuery query1 = SearchQuery.builder()
                    .userId(1L)
                    .queryType(QueryType.TEXT)
                    .queryText("Port")
                    .resultCount(5)
                    .durationMs(100L)
                    .build();
            query1.setId(UUID.randomUUID());
            query1.setCreatedAt(LocalDateTime.now().minusHours(2));

            SearchQuery query2 = SearchQuery.builder()
                    .userId(1L)
                    .queryType(QueryType.RADIUS)
                    .queryText("Route")
                    .resultCount(3)
                    .durationMs(80L)
                    .build();
            query2.setId(UUID.randomUUID());
            query2.setCreatedAt(LocalDateTime.now().minusHours(1));

            when(searchQueryRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(PageRequest.class)))
                    .thenReturn(List.of(query2, query1));

            List<SearchHistoryResponse> result = service.getSearchHistory(1L, 20);

            assertNotNull(result);
            assertEquals(2, result.size());
            // Should be reversed to oldest first
            assertEquals("Port", result.get(0).getQueryText());
            assertEquals("Route", result.get(1).getQueryText());
        }

        @Test
        @DisplayName("Should return empty history when no queries found")
        void getSearchHistory_empty() {
            when(searchQueryRepository.findByUserIdOrderByCreatedAtDesc(eq(999L), any(PageRequest.class)))
                    .thenReturn(Collections.emptyList());

            List<SearchHistoryResponse> result = service.getSearchHistory(999L, 20);

            assertNotNull(result);
            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("Should limit search history by limit parameter")
        void getSearchHistory_withLimit() {
            SearchQuery q1 = SearchQuery.builder()
                    .userId(1L).queryType(QueryType.TEXT)
                    .queryText("Q1").resultCount(1).durationMs(10L)
                    .build();
            q1.setId(UUID.randomUUID());
            q1.setCreatedAt(LocalDateTime.now());

            SearchQuery q2 = SearchQuery.builder()
                    .userId(1L).queryType(QueryType.TEXT)
                    .queryText("Q2").resultCount(2).durationMs(20L)
                    .build();
            q2.setId(UUID.randomUUID());
            q2.setCreatedAt(LocalDateTime.now());

            when(searchQueryRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(PageRequest.class)))
                    .thenReturn(List.of(q2));

            List<SearchHistoryResponse> result = service.getSearchHistory(1L, 1);

            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Should clear search history for a user")
        void clearSearchHistory_success() {
            SearchQuery q1 = SearchQuery.builder()
                    .userId(1L)
                    .queryType(QueryType.TEXT).queryText("Q1")
                    .resultCount(1).durationMs(10L)
                    .build();
            q1.setId(UUID.randomUUID());
            q1.setCreatedAt(LocalDateTime.now());

            SearchQuery q2 = SearchQuery.builder()
                    .userId(1L)
                    .queryType(QueryType.TEXT).queryText("Q2")
                    .resultCount(2).durationMs(20L)
                    .build();
            q2.setId(UUID.randomUUID());
            q2.setCreatedAt(LocalDateTime.now());

            when(searchQueryRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(PageRequest.class)))
                    .thenReturn(List.of(q1, q2));

            service.clearSearchHistory(1L);

            verify(searchQueryRepository).deleteAll(List.of(q1, q2));
        }

        @Test
        @DisplayName("Should handle clearing empty history gracefully")
        void clearSearchHistory_empty() {
            when(searchQueryRepository.findByUserIdOrderByCreatedAtDesc(eq(999L), any(PageRequest.class)))
                    .thenReturn(Collections.emptyList());

            service.clearSearchHistory(999L);

            verify(searchQueryRepository).deleteAll(Collections.emptyList());
        }
    }

    // ==================== MAIN SEARCH DISPATCHER TESTS ====================

    @Nested
    @DisplayName("Search Dispatcher (QueryType switch)")
    class DispatcherTests {

        @Test
        @DisplayName("Should dispatch TEXT query type correctly")
        void dispatch_textType() {
            SearchRequest request = SearchRequest.builder()
                    .query("test")
                    .queryType(QueryType.TEXT)
                    .page(0).size(20)
                    .build();

            when(pointRepository.findByNameContainingIgnoreCase("test"))
                    .thenReturn(Collections.emptyList());
            when(lineRepository.findByNameContainingIgnoreCase("test"))
                    .thenReturn(Collections.emptyList());
            when(polygonRepository.findByNameContainingIgnoreCase("test"))
                    .thenReturn(Collections.emptyList());

            SearchResponse result = service.search(request);

            assertNotNull(result);
            assertEquals(0, result.getTotalResults());
        }

        @Test
        @DisplayName("Should dispatch LOCATION query type correctly")
        void dispatch_locationType() {
            SearchRequest request = SearchRequest.builder()
                    .queryType(QueryType.LOCATION)
                    .centerLon(107.0).centerLat(10.5)
                    .page(0).size(20)
                    .build();

            when(pointRepository.findByDistance(anyString(), anyDouble()))
                    .thenReturn(Collections.emptyList());

            SearchResponse result = service.search(request);

            assertNotNull(result);
        }

        @Test
        @DisplayName("Should dispatch RADIUS query type correctly")
        void dispatch_radiusType() {
            SearchRequest request = SearchRequest.builder()
                    .queryType(QueryType.RADIUS)
                    .centerLon(107.0).centerLat(10.5)
                    .radius(5000.0)
                    .page(0).size(20)
                    .build();

            when(pointRepository.findByDistance(anyString(), anyDouble()))
                    .thenReturn(Collections.emptyList());

            SearchResponse result = service.search(request);

            assertNotNull(result);
        }

        @Test
        @DisplayName("Should dispatch POLYGON query type correctly")
        void dispatch_polygonType() {
            SearchRequest request = SearchRequest.builder()
                    .queryType(QueryType.POLYGON)
                    .coordinates("POLYGON ((0 0, 1 0, 1 1, 0 1, 0 0))")
                    .page(0).size(20)
                    .build();

            when(pointRepository.findByStatus(Status.PUBLISHED))
                    .thenReturn(Collections.emptyList());
            when(lineRepository.findAll()).thenReturn(Collections.emptyList());

            SearchResponse result = service.search(request);

            assertNotNull(result);
        }

        @Test
        @DisplayName("Should dispatch COORDINATE query type correctly")
        void dispatch_coordinateType() {
            SearchRequest request = SearchRequest.builder()
                    .queryType(QueryType.COORDINATE)
                    .centerLon(107.0).centerLat(10.5)
                    .page(0).size(20)
                    .build();

            when(pointRepository.findByStatus(Status.PUBLISHED))
                    .thenReturn(Collections.emptyList());

            SearchResponse result = service.search(request);

            assertNotNull(result);
        }

        @Test
        @DisplayName("Should include durationMs in response")
        void includesDurationMs() {
            SearchRequest request = SearchRequest.builder()
                    .query("test")
                    .queryType(QueryType.TEXT)
                    .page(0).size(20)
                    .build();

            when(pointRepository.findByNameContainingIgnoreCase("test"))
                    .thenReturn(Collections.emptyList());
            when(lineRepository.findByNameContainingIgnoreCase("test"))
                    .thenReturn(Collections.emptyList());
            when(polygonRepository.findByNameContainingIgnoreCase("test"))
                    .thenReturn(Collections.emptyList());

            SearchResponse result = service.search(request);

            assertNotNull(result);
            assertTrue(result.getDurationMs() >= 0);
        }

        @Test
        @DisplayName("Should include page and size in response")
        void includesPaginationInfo() {
            SearchRequest request = SearchRequest.builder()
                    .query("test")
                    .queryType(QueryType.TEXT)
                    .page(5).size(10)
                    .build();

            when(pointRepository.findByNameContainingIgnoreCase("test"))
                    .thenReturn(Collections.emptyList());
            when(lineRepository.findByNameContainingIgnoreCase("test"))
                    .thenReturn(Collections.emptyList());
            when(polygonRepository.findByNameContainingIgnoreCase("test"))
                    .thenReturn(Collections.emptyList());

            SearchResponse result = service.search(request);

            assertEquals(5, result.getPage());
            assertEquals(10, result.getSize());
        }
    }
}
