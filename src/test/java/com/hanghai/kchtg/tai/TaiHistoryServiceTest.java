package com.hanghai.kchtg.tai;

import com.hanghai.kchtg.tai.dto.history.TaiHistoryResponse;
import com.hanghai.kchtg.tai.entity.TaiHistory;
import com.hanghai.kchtg.tai.entity.TaiHistoryActionType;
import com.hanghai.kchtg.tai.entity.TaiType;
import com.hanghai.kchtg.tai.repository.TaiHistoryRepository;
import com.hanghai.kchtg.tai.service.TaiHistoryService;
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

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaiHistoryServiceTest {

    @InjectMocks
    private TaiHistoryService service;

    @Mock
    private TaiHistoryRepository historyRepo;

    private UUID entityId;
    private TaiHistory testHistory;

    @BeforeEach
    void setUp() {
        entityId = UUID.randomUUID();
        testHistory = TaiHistory.builder()
                .id(UUID.randomUUID())
                .entityName("TaiThongTinHangHaiHN")
                .taiType(TaiType.HANOI_HAI)
                .entityId(entityId)
                .actionType(TaiHistoryActionType.CREATE)
                .changedField("action=CREATE")
                .previousValue(null)
                .newValue(null)
                .changedBy(UUID.randomUUID())
                .changedAt(Instant.now())
                .reason(null)
                .build();
    }

    @Test
    @DisplayName("F-106: findAllHistory — returns paginated records")
    void testFindAllHistoryPageable() {
        Pageable pageable = PageRequest.of(0, 20);
        when(historyRepo.findAll(pageable)).thenReturn(new PageImpl<>(List.of(testHistory)));

        Page<TaiHistoryResponse> result = service.findAllHistory(pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals(TaiType.HANOI_HAI, result.getContent().get(0).getTaiType());
        verify(historyRepo).findAll(pageable);
    }

    @Test
    @DisplayName("F-106: findHistoryByType — filters by TaiType")
    void testFindByTypeFilter() {
        Pageable pageable = PageRequest.of(0, 20);
        when(historyRepo.findByTaiType(TaiType.HANOI_HAI, pageable))
                .thenReturn(new PageImpl<>(List.of(testHistory)));

        Page<TaiHistoryResponse> result = service.findHistoryByType(TaiType.HANOI_HAI, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals(TaiType.HANOI_HAI, result.getContent().get(0).getTaiType());
        verify(historyRepo).findByTaiType(TaiType.HANOI_HAI, pageable);
    }

    @Test
    @DisplayName("F-106: findHistoryByAction — filters by actionType")
    void testFindByActionFilter() {
        Pageable pageable = PageRequest.of(0, 20);
        when(historyRepo.findAll()).thenReturn(List.of(
                TaiHistory.builder().id(UUID.randomUUID()).actionType(TaiHistoryActionType.CREATE).changedAt(Instant.now()).build(),
                TaiHistory.builder().id(UUID.randomUUID()).actionType(TaiHistoryActionType.APPROVE).changedAt(Instant.now().plusSeconds(10)).build()
        ));

        Page<TaiHistoryResponse> result = service.findHistoryByAction(TaiHistoryActionType.APPROVE, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals(TaiHistoryActionType.APPROVE, result.getContent().get(0).getActionType());
    }

    @Test
    @DisplayName("F-106: history created on approve — saved history entry")
    void testHistoryCreatedOnApprove() {
        UUID thnId = UUID.randomUUID();
        TaiHistory approveHistory = TaiHistory.builder()
                .id(UUID.randomUUID())
                .entityName("TaiThongTinHangHaiHN")
                .entityId(thnId)
                .taiType(TaiType.HANOI_HAI)
                .actionType(TaiHistoryActionType.APPROVE)
                .changedAt(Instant.now())
                .reason("Phe duyet OK")
                .changedBy(UUID.randomUUID())
                .build();

        Pageable pageable = PageRequest.of(0, 20);
        when(historyRepo.findByEntityIdAndTaiType(thnId, TaiType.HANOI_HAI, pageable))
                .thenReturn(new PageImpl<>(List.of(testHistory, approveHistory)));

        Page<TaiHistoryResponse> result = service.getHistory(thnId, TaiType.HANOI_HAI, pageable);

        assertEquals(2, result.getTotalElements());
        assertTrue(result.getContent().stream()
                .anyMatch(r -> r.getActionType() == TaiHistoryActionType.APPROVE));
    }
}
