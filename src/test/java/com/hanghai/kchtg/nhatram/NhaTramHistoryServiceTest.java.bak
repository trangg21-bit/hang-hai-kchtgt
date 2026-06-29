package com.hanghai.kchtg.nhatram;

import com.hanghai.kchtg.nhatram.dto.history.NhaTramHistoryResponse;
import com.hanghai.kchtg.nhatram.entity.NhaTramHistory;
import com.hanghai.kchtg.nhatram.entity.NhaTramHistoryActionType;
import com.hanghai.kchtg.nhatram.entity.NhaTramType;
import com.hanghai.kchtg.nhatram.repository.NhaTramHistoryRepository;
import com.hanghai.kchtg.nhatram.service.NhaTramHistoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NhaTramHistoryServiceTest {

    @InjectMocks
    private NhaTramHistoryService service;

    @Mock
    private NhaTramHistoryRepository historyRepo;

    private UUID entityId;
    private NhaTramHistory testHistory;

    @BeforeEach
    void setUp() {
        entityId = UUID.randomUUID();
        testHistory = new NhaTramHistory();
        ReflectionTestUtils.setField(testHistory, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(testHistory, "entityId", entityId);
        ReflectionTestUtils.setField(testHistory, "tramType", NhaTramType.PHAO);
        ReflectionTestUtils.setField(testHistory, "actionType", NhaTramHistoryActionType.CREATE);
        ReflectionTestUtils.setField(testHistory, "previousValue", "{}");
        ReflectionTestUtils.setField(testHistory, "newValue", "{\"name\":\"Phao\"}");
        ReflectionTestUtils.setField(testHistory, "changedBy", 1L);
        ReflectionTestUtils.setField(testHistory, "changedAt", LocalDateTime.now());
    }

    @Test
    @DisplayName("F-084/F-090: Get history by entity — returns paginated records")
    void testGetHistoryByEntity() {
        Pageable pageable = PageRequest.of(0, 20);
        when(historyRepo.findByEntityIdAndTramType(entityId, NhaTramType.PHAO, pageable))
                .thenReturn(new PageImpl<>(List.of(testHistory)));

        Page<NhaTramHistoryResponse> result = service.getHistory(NhaTramType.PHAO, entityId, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals(NhaTramHistoryActionType.CREATE, result.getContent().get(0).getActionType());
        verify(historyRepo).findByEntityIdAndTramType(entityId, NhaTramType.PHAO, pageable);
    }

    @Test
    @DisplayName("F-090: Get history DEN — returns records for den type")
    void testGetHistoryDen() {
        NhaTramHistory denHistory = new NhaTramHistory();
        ReflectionTestUtils.setField(denHistory, "entityId", entityId);
        ReflectionTestUtils.setField(denHistory, "tramType", NhaTramType.DEN);
        Pageable pageable = PageRequest.of(0, 20);
        when(historyRepo.findByEntityIdAndTramType(entityId, NhaTramType.DEN, pageable))
                .thenReturn(new PageImpl<>(List.of(denHistory)));

        Page<NhaTramHistoryResponse> result = service.getHistory(NhaTramType.DEN, entityId, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals(NhaTramType.DEN, result.getContent().get(0).getTramType());
    }

    @Test
    @DisplayName("F-090: Get history — returns empty page when no records")
    void testGetHistoryEmpty() {
        Pageable pageable = PageRequest.of(0, 20);
        when(historyRepo.findByEntityIdAndTramType(entityId, NhaTramType.PHAO, pageable))
                .thenReturn(Page.empty());

        Page<NhaTramHistoryResponse> result = service.getHistory(NhaTramType.PHAO, entityId, pageable);

        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("F-090: Get history filtered — filters by entity + actionType + date range")
    void testGetHistoryFilteredEntityActionDate() {
        Pageable pageable = PageRequest.of(0, 20);
        LocalDateTime from = LocalDateTime.of(2025, 1, 1, 0, 0);
        LocalDateTime to = LocalDateTime.of(2025, 12, 31, 23, 59);
        when(historyRepo.findByEntityIdAndTramTypeAndActionType(entityId, NhaTramType.PHAO, NhaTramHistoryActionType.CREATE, pageable))
                .thenReturn(new PageImpl<>(List.of(testHistory)));

        Page<NhaTramHistoryResponse> result = service.getHistoryFiltered(
                NhaTramType.PHAO, entityId, NhaTramHistoryActionType.CREATE, null, from, to, pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    @DisplayName("F-090: Get history filtered — filters by entity + date range only")
    void testGetHistoryFilteredEntityDate() {
        Pageable pageable = PageRequest.of(0, 20);
        LocalDateTime from = LocalDateTime.of(2025, 1, 1, 0, 0);
        LocalDateTime to = LocalDateTime.of(2025, 12, 31, 23, 59);
        when(historyRepo.findByDateRange(entityId, NhaTramType.PHAO, from, to, pageable))
                .thenReturn(new PageImpl<>(List.of(testHistory)));

        Page<NhaTramHistoryResponse> result = service.getHistoryFiltered(
                NhaTramType.PHAO, entityId, null, null, from, to, pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    @DisplayName("F-090: Get history filtered — filters by entity + actionType only")
    void testGetHistoryFilteredEntityAction() {
        Pageable pageable = PageRequest.of(0, 20);
        when(historyRepo.findByEntityIdAndTramTypeAndActionType(entityId, NhaTramType.PHAO, NhaTramHistoryActionType.CREATE, pageable))
                .thenReturn(new PageImpl<>(List.of(testHistory)));

        Page<NhaTramHistoryResponse> result = service.getHistoryFiltered(
                NhaTramType.PHAO, entityId, NhaTramHistoryActionType.CREATE, null, null, null, pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    @DisplayName("F-090: Get history filtered — no entity, filters by type + actionType + date range")
    void testGetHistoryFilteredNoEntityActionDate() {
        Pageable pageable = PageRequest.of(0, 20);
        LocalDateTime from = LocalDateTime.of(2025, 1, 1, 0, 0);
        LocalDateTime to = LocalDateTime.of(2025, 12, 31, 23, 59);
        when(historyRepo.findByTramTypeAndActionType(NhaTramType.PHAO, NhaTramHistoryActionType.CREATE, pageable))
                .thenReturn(new PageImpl<>(List.of(testHistory)));

        Page<NhaTramHistoryResponse> result = service.getHistoryFiltered(
                NhaTramType.PHAO, null, NhaTramHistoryActionType.CREATE, null, from, to, pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    @DisplayName("F-090: Get history filtered — no entity, filters by type + date range only")
    void testGetHistoryFilteredNoEntityDate() {
        Pageable pageable = PageRequest.of(0, 20);
        LocalDateTime from = LocalDateTime.of(2025, 1, 1, 0, 0);
        LocalDateTime to = LocalDateTime.of(2025, 12, 31, 23, 59);
        when(historyRepo.findByTramTypeAndDateRange(NhaTramType.DEN, from, to, pageable))
                .thenReturn(new PageImpl<>(List.of(testHistory)));

        Page<NhaTramHistoryResponse> result = service.getHistoryFiltered(
                NhaTramType.DEN, null, null, null, from, to, pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    @DisplayName("F-090: Get history filtered — no entity, filters by type + actionType only")
    void testGetHistoryFilteredNoEntityAction() {
        Pageable pageable = PageRequest.of(0, 20);
        when(historyRepo.findByTramTypeAndActionType(NhaTramType.PHAO, NhaTramHistoryActionType.APPROVE_L2, pageable))
                .thenReturn(new PageImpl<>(List.of(testHistory)));

        Page<NhaTramHistoryResponse> result = service.getHistoryFiltered(
                NhaTramType.PHAO, null, NhaTramHistoryActionType.APPROVE_L2, null, null, null, pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    @DisplayName("F-090: Get history filtered — no entity, no filters, returns all for type")
    void testGetHistoryFilteredNoEntityNoFilters() {
        Pageable pageable = PageRequest.of(0, 20);
        when(historyRepo.findByTramType(NhaTramType.PHAO, pageable))
                .thenReturn(new PageImpl<>(List.of(testHistory)));

        Page<NhaTramHistoryResponse> result = service.getHistoryFiltered(
                NhaTramType.PHAO, null, null, null, null, null, pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    @DisplayName("F-084/F-090: toResponse — maps to response DTO")
    void testToResponseSuperAdmin() {
        Pageable pageable = PageRequest.of(0, 20);
        NhaTramHistory history = new NhaTramHistory();
        ReflectionTestUtils.setField(history, "changedBy", 1L);
        when(historyRepo.findByEntityIdAndTramType(entityId, NhaTramType.PHAO, pageable))
                .thenReturn(new PageImpl<>(List.of(history)));

        Page<NhaTramHistoryResponse> result = service.getHistory(NhaTramType.PHAO, entityId, pageable);

        assertEquals("Quan tri vien (Super Admin)", result.getContent().get(0).getChangedByName());
    }

    @Test
    @DisplayName("F-084/F-090: toResponse — custom user name")
    void testToResponseCustomUser() {
        Pageable pageable = PageRequest.of(0, 20);
        NhaTramHistory history = new NhaTramHistory();
        ReflectionTestUtils.setField(history, "changedBy", 99L);
        when(historyRepo.findByEntityIdAndTramType(entityId, NhaTramType.PHAO, pageable))
                .thenReturn(new PageImpl<>(List.of(history)));

        Page<NhaTramHistoryResponse> result = service.getHistory(NhaTramType.PHAO, entityId, pageable);

        assertEquals("Nguoi dung #99", result.getContent().get(0).getChangedByName());
    }
}
