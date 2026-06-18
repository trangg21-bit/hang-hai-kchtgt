package com.hanghai.kchtg.gis.search;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.gis.search.controller.SearchController;
import com.hanghai.kchtg.gis.search.dto.SearchHistoryResponse;
import com.hanghai.kchtg.gis.search.dto.SearchRequest;
import com.hanghai.kchtg.gis.search.dto.SearchResponse;
import com.hanghai.kchtg.gis.search.entity.SearchQuery.QueryType;
import com.hanghai.kchtg.gis.search.service.SearchService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SearchControllerTest {

    @Mock
    private SearchService searchService;

    @InjectMocks
    private SearchController controller;

    private SearchResponse sampleSearchResponse;
    private SearchHistoryResponse sampleHistory;

    @BeforeEach
    void setUp() {
        sampleSearchResponse = SearchResponse.builder()
                .results(List.of(SearchResponse.SearchResultItem.builder()
                        .objectId("abc-123")
                        .objectType("POINT")
                        .name("Cai Mep Port")
                        .code("PORT-CM")
                        .distance(150.0)
                        .layerType("POINT")
                        .build()))
                .totalResults(1)
                .page(0)
                .size(20)
                .durationMs(45)
                .build();

        sampleHistory = SearchHistoryResponse.builder()
                .id(UUID.randomUUID())
                .userId(0L)
                .queryType(QueryType.TEXT)
                .queryText("Port")
                .resultCount(5)
                .durationMs(100)
                .executedAt(LocalDateTime.now().minusHours(1))
                .build();
    }

    // ==================== SEARCH ENDPOINT ====================

    @Nested
    @DisplayName("POST /api/search")
    class SearchEndpoint {

        @Test
        @DisplayName("POST search returns 200 with results")
        void search_returns200() {
            SearchRequest request = SearchRequest.builder()
                    .query("Cai Mep")
                    .queryType(QueryType.TEXT)
                    .page(0)
                    .size(20)
                    .build();

            when(searchService.search(any(SearchRequest.class))).thenReturn(sampleSearchResponse);

            ResponseEntity<ApiResponse<SearchResponse>> response = controller.search(request);

            assertEquals(200, response.getStatusCode().value());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            assertNotNull(response.getBody().getData());
            assertEquals(1, response.getBody().getData().getTotalResults());
            verify(searchService).search(any(SearchRequest.class));
        }

        @Test
        @DisplayName("POST search with LOCATION query type")
        void search_locationType_returns200() {
            SearchRequest request = SearchRequest.builder()
                    .queryType(QueryType.LOCATION)
                    .centerLon(107.0)
                    .centerLat(10.5)
                    .page(0)
                    .size(20)
                    .build();

            when(searchService.search(any(SearchRequest.class))).thenReturn(sampleSearchResponse);

            ResponseEntity<ApiResponse<SearchResponse>> response = controller.search(request);

            assertEquals(200, response.getStatusCode().value());
            assertNotNull(response.getBody());
            verify(searchService).search(any(SearchRequest.class));
        }

        @Test
        @DisplayName("POST search with RADIUS query type")
        void search_radiusType_returns200() {
            SearchRequest request = SearchRequest.builder()
                    .queryType(QueryType.RADIUS)
                    .centerLon(107.0)
                    .centerLat(10.5)
                    .radius(5000.0)
                    .page(0)
                    .size(20)
                    .build();

            when(searchService.search(any(SearchRequest.class))).thenReturn(sampleSearchResponse);

            ResponseEntity<ApiResponse<SearchResponse>> response = controller.search(request);

            assertEquals(200, response.getStatusCode().value());
            assertNotNull(response.getBody());
        }

        @Test
        @DisplayName("POST search with POLYGON query type")
        void search_polygonType_returns200() {
            SearchRequest request = SearchRequest.builder()
                    .queryType(QueryType.POLYGON)
                    .coordinates("POLYGON ((0 0, 1 0, 1 1, 0 1, 0 0))")
                    .page(0)
                    .size(20)
                    .build();

            when(searchService.search(any(SearchRequest.class))).thenReturn(sampleSearchResponse);

            ResponseEntity<ApiResponse<SearchResponse>> response = controller.search(request);

            assertEquals(200, response.getStatusCode().value());
            assertNotNull(response.getBody());
        }

        @Test
        @DisplayName("POST search with COORDINATE query type")
        void search_coordinateType_returns200() {
            SearchRequest request = SearchRequest.builder()
                    .queryType(QueryType.COORDINATE)
                    .centerLon(107.0)
                    .centerLat(10.5)
                    .page(0)
                    .size(20)
                    .build();

            when(searchService.search(any(SearchRequest.class))).thenReturn(sampleSearchResponse);

            ResponseEntity<ApiResponse<SearchResponse>> response = controller.search(request);

            assertEquals(200, response.getStatusCode().value());
            assertNotNull(response.getBody());
        }

        @Test
        @DisplayName("POST search propagates service exceptions")
        void search_propagatesExceptions() {
            SearchRequest request = SearchRequest.builder()
                    .query("test")
                    .queryType(QueryType.TEXT)
                    .page(0)
                    .size(20)
                    .build();

            when(searchService.search(any(SearchRequest.class)))
                    .thenThrow(new RuntimeException("Search failed"));

            assertThrows(RuntimeException.class, () -> controller.search(request));
        }
    }

    // ==================== SEARCH HISTORY ENDPOINTS ====================

    @Nested
    @DisplayName("Search History Endpoints")
    class HistoryEndpoints {

        @Test
        @DisplayName("GET /api/search/history returns 200 with history list")
        void getHistory_returns200() {
            when(searchService.getSearchHistory(eq(0L), eq(20)))
                    .thenReturn(List.of(sampleHistory));

            ResponseEntity<ApiResponse<List<SearchHistoryResponse>>> response =
                    controller.getSearchHistory(20);

            assertEquals(200, response.getStatusCode().value());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            assertEquals(1, response.getBody().getData().size());
            verify(searchService).getSearchHistory(eq(0L), eq(20));
        }

        @Test
        @DisplayName("GET /api/search/history with custom limit returns 200")
        void getHistory_customLimit_returns200() {
            when(searchService.getSearchHistory(eq(0L), eq(5)))
                    .thenReturn(List.of(sampleHistory));

            ResponseEntity<ApiResponse<List<SearchHistoryResponse>>> response =
                    controller.getSearchHistory(5);

            assertEquals(200, response.getStatusCode().value());
            assertNotNull(response.getBody());
            verify(searchService).getSearchHistory(eq(0L), eq(5));
        }

        @Test
        @DisplayName("GET /api/search/history with empty results returns 200")
        void getHistory_empty_returns200() {
            when(searchService.getSearchHistory(eq(0L), eq(20)))
                    .thenReturn(Collections.emptyList());

            ResponseEntity<ApiResponse<List<SearchHistoryResponse>>> response =
                    controller.getSearchHistory(20);

            assertEquals(200, response.getStatusCode().value());
            assertNotNull(response.getBody());
            assertNotNull(response.getBody().getData());
            assertTrue(response.getBody().getData().isEmpty());
        }

        @Test
        @DisplayName("DELETE /api/search/history clears history with 200")
        void clearHistory_returns200() {
            when(searchService.clearSearchHistory(0L)).thenReturn(null);

            ResponseEntity<ApiResponse<Void>> response = controller.clearSearchHistory();

            assertEquals(200, response.getStatusCode().value());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            assertEquals("Search history cleared", response.getBody().getMessage());
            verify(searchService).clearSearchHistory(0L);
        }

        @Test
        @DisplayName("DELETE /api/search/history propagates service exceptions")
        void clearHistory_propagatesExceptions() {
            when(searchService.clearSearchHistory(0L))
                    .thenThrow(new RuntimeException("Clear failed"));

            assertThrows(RuntimeException.class, () -> controller.clearSearchHistory());
        }
    }
}
