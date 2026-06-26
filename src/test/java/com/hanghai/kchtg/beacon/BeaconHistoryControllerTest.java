package com.hanghai.kchtg.beacon;

import com.hanghai.kchtg.beacon.controller.BeaconHistoryController;
import com.hanghai.kchtg.beacon.dto.history.BeaconHistoryResponse;
import com.hanghai.kchtg.beacon.entity.BeaconHistoryActionType;
import com.hanghai.kchtg.beacon.entity.BeaconType;
import com.hanghai.kchtg.beacon.service.BeaconHistoryService;
import com.hanghai.kchtg.common.dto.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BeaconHistoryControllerTest {

    @Mock
    private BeaconHistoryService historyService;

    @InjectMocks
    private BeaconHistoryController controller;

    private BeaconHistoryResponse sampleResponse;
    private UUID testEntityId;

    @BeforeEach
    void setUp() {
        testEntityId = UUID.randomUUID();
        sampleResponse = BeaconHistoryResponse.builder()
                .id(UUID.randomUUID())
                .beaconType(BeaconType.BEACON_LIGHT)
                .entityId(testEntityId)
                .actionType(BeaconHistoryActionType.CREATE)
                .changedField("code")
                .previousValue(null)
                .newValue("DB-NEW-001")
                .changedBy(1L)
                .changedAt(LocalDateTime.now())
                .reason(null)
                .diffData(null)
                .build();
    }

    // ==================== GET ENDPOINT TESTS ====================

    @Nested
    @DisplayName("GET /api/beacon-history")
    class GetEndpoint {

        @Test
        @DisplayName("Should return paginated history with required params only")
        void getHistory_basicParams() {
            Page<BeaconHistoryResponse> page = new PageImpl<>(List.of(sampleResponse));
            when(historyService.getHistoryFiltered(
                    eq(BeaconType.BEACON_LIGHT), eq(testEntityId),
                    eq(null), eq(null), eq(null), eq(null), any()))
                    .thenReturn(page);

            ResponseEntity<ApiResponse<Page<BeaconHistoryResponse>>> response =
                    controller.getHistory(BeaconType.BEACON_LIGHT, testEntityId,
                            null, null, null, null, 0, 20);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            assertEquals(1, response.getBody().getData().getTotalElements());
            verify(historyService).getHistoryFiltered(
                    eq(BeaconType.BEACON_LIGHT), eq(testEntityId),
                    eq(null), eq(null), eq(null), eq(null), any());
        }

        @Test
        @DisplayName("Should filter by actionType")
        void getHistory_withActionType() {
            Page<BeaconHistoryResponse> page = new PageImpl<>(List.of(sampleResponse));
            when(historyService.getHistoryFiltered(
                    any(), any(), eq(BeaconHistoryActionType.UPDATE), any(), any(), any(), any()))
                    .thenReturn(page);

            ResponseEntity<ApiResponse<Page<BeaconHistoryResponse>>> response =
                    controller.getHistory(BeaconType.BUOY, testEntityId,
                            BeaconHistoryActionType.UPDATE, null, null, null, 0, 10);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            verify(historyService).getHistoryFiltered(
                    any(), any(), eq(BeaconHistoryActionType.UPDATE), any(), any(), any(), any());
        }

        @Test
        @DisplayName("Should filter by date range")
        void getHistory_withDateRange() {
            LocalDateTime from = LocalDateTime.now().minusDays(7);
            LocalDateTime to = LocalDateTime.now();
            Page<BeaconHistoryResponse> page = new PageImpl<>(List.of(sampleResponse));
            when(historyService.getHistoryFiltered(
                    any(), any(), eq(null), eq(null), eq(from), eq(to), any()))
                    .thenReturn(page);

            ResponseEntity<ApiResponse<Page<BeaconHistoryResponse>>> response =
                    controller.getHistory(BeaconType.BEACON_LIGHT, testEntityId,
                            null, null, from, to, 0, 20);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            verify(historyService).getHistoryFiltered(
                    any(), any(), eq(null), eq(null), eq(from), eq(to), any());
        }

        @Test
        @DisplayName("Should handle all filter params")
        void getHistory_withAllFilters() {
            LocalDateTime from = LocalDateTime.now().minusDays(30);
            LocalDateTime to = LocalDateTime.now();
            Page<BeaconHistoryResponse> page = new PageImpl<>(List.of(sampleResponse));
            when(historyService.getHistoryFiltered(
                    any(), any(), any(), eq(42L), any(), any(), any()))
                    .thenReturn(page);

            ResponseEntity<ApiResponse<Page<BeaconHistoryResponse>>> response =
                    controller.getHistory(BeaconType.BUOY, testEntityId,
                            BeaconHistoryActionType.APPROVE_L1, 42L, from, to, 1, 50);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            verify(historyService).getHistoryFiltered(
                    any(), any(), any(), eq(42L), any(), any(), any());
        }

        @Test
        @DisplayName("Should use default pagination (page=0, size=20)")
        void getHistory_defaultPagination() {
            Page<BeaconHistoryResponse> page = new PageImpl<>(Collections.emptyList());
            when(historyService.getHistoryFiltered(
                    eq(BeaconType.BEACON_LIGHT), eq(testEntityId),
                    eq(null), eq(null), eq(null), eq(null), any()))
                    .thenReturn(page);

            controller.getHistory(BeaconType.BEACON_LIGHT, testEntityId,
                    null, null, null, null, 0, 20);

            verify(historyService).getHistoryFiltered(
                    eq(BeaconType.BEACON_LIGHT), eq(testEntityId),
                    eq(null), eq(null), eq(null), eq(null), any());
        }
    }

    // ==================== PAGINATION TESTS ====================

    @Nested
    @DisplayName("Pagination")
    class PaginationTests {

        @Test
        @DisplayName("Should return empty page for non-existent entity")
        void getHistory_emptyEntity() {
            Page<BeaconHistoryResponse> page = Page.empty();
            when(historyService.getHistoryFiltered(any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(page);

            ResponseEntity<ApiResponse<Page<BeaconHistoryResponse>>> response =
                    controller.getHistory(BeaconType.BUOY, UUID.randomUUID(),
                            null, null, null, null, 0, 20);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().getData().isEmpty());
        }

        @Test
        @DisplayName("Should support custom page and size")
        void getHistory_customPagination() {
            List<BeaconHistoryResponse> items = Arrays.asList(
                    BeaconHistoryResponse.builder().id(UUID.randomUUID()).build(),
                    BeaconHistoryResponse.builder().id(UUID.randomUUID()).build()
            );
            Page<BeaconHistoryResponse> page = new PageImpl<>(items);
            when(historyService.getHistoryFiltered(any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(page);

            ResponseEntity<ApiResponse<Page<BeaconHistoryResponse>>> response =
                    controller.getHistory(BeaconType.BEACON_LIGHT, UUID.randomUUID(),
                            null, null, null, null, 2, 10);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals(2, response.getBody().getData().getTotalElements());
        }
    }
}
