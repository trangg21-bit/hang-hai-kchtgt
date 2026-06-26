package com.hanghai.kchtg.beacon;

import com.hanghai.kchtg.beacon.dto.history.BeaconHistoryResponse;
import com.hanghai.kchtg.beacon.entity.BeaconHistory;
import com.hanghai.kchtg.beacon.entity.BeaconHistoryActionType;
import com.hanghai.kchtg.beacon.entity.BeaconType;
import com.hanghai.kchtg.beacon.repository.BeaconHistoryRepository;
import com.hanghai.kchtg.beacon.service.BeaconHistoryService;
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
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BeaconHistoryServiceTest {

    @Mock
    private BeaconHistoryRepository historyRepo;

    @InjectMocks
    private BeaconHistoryService service;

    private BeaconHistory testHistory;
    private UUID testEntityId;

    @BeforeEach
    void setUp() {
        testEntityId = UUID.randomUUID();
        testHistory = BeaconHistory.builder()
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

    // ==================== BASIC HISTORY QUERY TESTS ====================

    @Nested
    @DisplayName("Basic History Query")
    class BasicQueryTests {

        @Test
        @DisplayName("Should get paginated history for entity")
        void getHistory_success() {
            Page<BeaconHistory> page = new PageImpl<>(List.of(testHistory));
            when(historyRepo.findByEntityIdAndBeaconType(
                    testEntityId, BeaconType.BEACON_LIGHT, PageRequest.of(0, 20)))
                    .thenReturn(page);

            Page<BeaconHistoryResponse> result = service.getHistory(
                    BeaconType.BEACON_LIGHT, testEntityId, PageRequest.of(0, 20));

            assertNotNull(result);
            assertEquals(1, result.getTotalElements());
            assertEquals(BeaconHistoryActionType.CREATE, result.getContent().get(0).getActionType());
            verify(historyRepo).findByEntityIdAndBeaconType(
                    testEntityId, BeaconType.BEACON_LIGHT, PageRequest.of(0, 20));
        }

        @Test
        @DisplayName("Should return empty page when no history")
        void getHistory_empty() {
            Page<BeaconHistory> page = Page.empty();
            when(historyRepo.findByEntityIdAndBeaconType(any(), any(), any()))
                    .thenReturn(page);

            Page<BeaconHistoryResponse> result = service.getHistory(
                    BeaconType.BUOY, UUID.randomUUID(), PageRequest.of(0, 10));

            assertNotNull(result);
            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("Should handle BUOY beacon type")
        void getHistory_buoyType() {
            Page<BeaconHistory> page = new PageImpl<>(List.of(testHistory));
            when(historyRepo.findByEntityIdAndBeaconType(
                    any(UUID.class), eq(BeaconType.BUOY), any()))
                    .thenReturn(page);

            Page<BeaconHistoryResponse> result = service.getHistory(
                    BeaconType.BUOY, UUID.randomUUID(), PageRequest.of(0, 10));

            assertEquals(1, result.getTotalElements());
        }
    }

    // ==================== FILTERED HISTORY QUERY TESTS ====================

    @Nested
    @DisplayName("Filtered History Query")
    class FilteredQueryTests {

        @Test
        @DisplayName("Should filter by actionType only")
        void filterByActionType() {
            Page<BeaconHistory> page = new PageImpl<>(List.of(testHistory));
            when(historyRepo.findByEntityIdAndBeaconTypeAndActionType(
                    any(UUID.class), any(BeaconType.class), eq(BeaconHistoryActionType.CREATE), any()))
                    .thenReturn(page);

            Page<BeaconHistoryResponse> result = service.getHistoryFiltered(
                    BeaconType.BEACON_LIGHT, testEntityId,
                    BeaconHistoryActionType.CREATE, null, null, null,
                    PageRequest.of(0, 20));

            assertEquals(1, result.getTotalElements());
            verify(historyRepo).findByEntityIdAndBeaconTypeAndActionType(
                    any(UUID.class), any(BeaconType.class), eq(BeaconHistoryActionType.CREATE), any());
        }

        @Test
        @DisplayName("Should filter by date range")
        void filterByDateRange() {
            LocalDateTime from = LocalDateTime.now().minusDays(7);
            LocalDateTime to = LocalDateTime.now();
            Page<BeaconHistory> page = new PageImpl<>(List.of(testHistory));
            when(historyRepo.findByDateRange(
                    any(UUID.class), any(BeaconType.class), eq(from), eq(to), any()))
                    .thenReturn(page);

            Page<BeaconHistoryResponse> result = service.getHistoryFiltered(
                    BeaconType.BEACON_LIGHT, testEntityId,
                    null, null, from, to, PageRequest.of(0, 20));

            assertEquals(1, result.getTotalElements());
            verify(historyRepo).findByDateRange(any(), any(), eq(from), eq(to), any());
        }

        @Test
        @DisplayName("Should filter by actionType + date range (actionType takes priority)")
        void filterByActionTypeAndDate() {
            LocalDateTime from = LocalDateTime.now().minusDays(7);
            LocalDateTime to = LocalDateTime.now();
            Page<BeaconHistory> page = new PageImpl<>(List.of(testHistory));
            when(historyRepo.findByEntityIdAndBeaconTypeAndActionType(
                    any(UUID.class), any(BeaconType.class), eq(BeaconHistoryActionType.UPDATE), any()))
                    .thenReturn(page);

            Page<BeaconHistoryResponse> result = service.getHistoryFiltered(
                    BeaconType.BEACON_LIGHT, testEntityId,
                    BeaconHistoryActionType.UPDATE, null, from, to, PageRequest.of(0, 20));

            assertEquals(1, result.getTotalElements());
            verify(historyRepo).findByEntityIdAndBeaconTypeAndActionType(
                    any(UUID.class), any(BeaconType.class), eq(BeaconHistoryActionType.UPDATE), any());
        }

        @Test
        @DisplayName("Should return all history when no filters")
        void noFilters_returnsAll() {
            Page<BeaconHistory> page = new PageImpl<>(List.of(testHistory));
            when(historyRepo.findByEntityIdAndBeaconType(
                    any(UUID.class), any(BeaconType.class), any()))
                    .thenReturn(page);

            Page<BeaconHistoryResponse> result = service.getHistoryFiltered(
                    BeaconType.BUOY, UUID.randomUUID(),
                    null, null, null, null, PageRequest.of(0, 20));

            assertEquals(1, result.getTotalElements());
            verify(historyRepo).findByEntityIdAndBeaconType(any(), any(), any());
        }
    }

    // ==================== RESPONSE MAPPING TESTS ====================

    @Nested
    @DisplayName("Response Mapping")
    class ResponseMappingTests {

        @Test
        @DisplayName("Should map history entity to response correctly")
        void toResponse_mapsCorrectly() {
            testHistory.setReason("Test reason");
            testHistory.setDiffData("{\"code\":\"old\",\"code\":\"new\"}");

            Page<BeaconHistory> page = new PageImpl<>(List.of(testHistory));
            when(historyRepo.findByEntityIdAndBeaconType(any(), any(), any())).thenReturn(page);

            Page<BeaconHistoryResponse> result = service.getHistory(
                    BeaconType.BEACON_LIGHT, testEntityId, PageRequest.of(0, 20));

            BeaconHistoryResponse response = result.getContent().get(0);
            assertEquals(testHistory.getId(), response.getId());
            assertEquals(testHistory.getBeaconType(), response.getBeaconType());
            assertEquals(testHistory.getEntityId(), response.getEntityId());
            assertEquals(testHistory.getActionType(), response.getActionType());
            assertEquals(testHistory.getChangedField(), response.getChangedField());
            assertEquals(testHistory.getPreviousValue(), response.getPreviousValue());
            assertEquals(testHistory.getNewValue(), response.getNewValue());
            assertEquals(testHistory.getChangedBy(), response.getChangedBy());
            assertEquals(testHistory.getReason(), response.getReason());
            assertEquals(testHistory.getDiffData(), response.getDiffData());
            assertNotNull(response.getChangedAt());
        }

        @Test
        @DisplayName("Should handle null diffData in response")
        void toResponse_nullDiffData() {
            testHistory.setDiffData(null);
            testHistory.setReason(null);

            Page<BeaconHistory> page = new PageImpl<>(List.of(testHistory));
            when(historyRepo.findByEntityIdAndBeaconType(any(), any(), any())).thenReturn(page);

            Page<BeaconHistoryResponse> result = service.getHistory(
                    BeaconType.BEACON_LIGHT, testEntityId, PageRequest.of(0, 20));

            assertNull(result.getContent().get(0).getDiffData());
            assertNull(result.getContent().get(0).getReason());
        }

        @Test
        @DisplayName("Should handle multiple history entries")
        void toResponse_multipleEntries() {
            BeaconHistory entry2 = BeaconHistory.builder()
                    .id(UUID.randomUUID())
                    .beaconType(BeaconType.BUOY)
                    .entityId(testEntityId)
                    .actionType(BeaconHistoryActionType.UPDATE)
                    .changedField("name")
                    .previousValue("Old Name")
                    .newValue("New Name")
                    .changedBy(2L)
                    .changedAt(LocalDateTime.now().minusHours(1))
                    .build();

            Page<BeaconHistory> page = new PageImpl<>(List.of(testHistory, entry2));
            when(historyRepo.findByEntityIdAndBeaconType(any(), any(), any())).thenReturn(page);

            Page<BeaconHistoryResponse> result = service.getHistory(
                    BeaconType.BEACON_LIGHT, testEntityId, PageRequest.of(0, 20));

            assertEquals(2, result.getTotalElements());
            assertEquals(BeaconHistoryActionType.CREATE, result.getContent().get(0).getActionType());
            assertEquals(BeaconHistoryActionType.UPDATE, result.getContent().get(1).getActionType());
        }
    }
}
