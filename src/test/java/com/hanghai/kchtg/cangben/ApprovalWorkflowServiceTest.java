package com.hanghai.kchtg.cangben;

import com.hanghai.kchtg.cangben.entity.PheDuyetLog;
import com.hanghai.kchtg.cangben.entity.base.ApprovalStatus;
import com.hanghai.kchtg.cangben.repository.PheDuyetLogRepository;
import com.hanghai.kchtg.cangben.service.shared.ApprovalWorkflowService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ApprovalWorkflowService — shared state-machine used by all
 * CangBen entity approval services (F-011/017/023/025/031).
 * Tests that PheDuyetLog is persisted on each decision.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ApprovalWorkflowService — state-machine + PheDuyetLog persistence")
class ApprovalWorkflowServiceTest {

    @InjectMocks
    private ApprovalWorkflowService workflowService;

    @Mock
    private PheDuyetLogRepository pheDuyetLogRepository;

    private final String entityType = "CangBien";
    private final String entityId = UUID.randomUUID().toString();
    private final String userId = "user-approver-1";

    // ── APPROVE ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("approve — CHO_PHE_DUYET → DUOC_PHE_DUYET + inserts PheDuyetLog")
    void approve_fromChoPheduyet_transitionsAndPersistsLog() {
        ApprovalStatus result = workflowService.approve("CHO_PHE_DUYET", entityType, entityId, userId);

        assertEquals(ApprovalStatus.DUOC_PHE_DUYET, result);

        ArgumentCaptor<PheDuyetLog> captor = ArgumentCaptor.forClass(PheDuyetLog.class);
        verify(pheDuyetLogRepository).save(captor.capture());
        PheDuyetLog log = captor.getValue();
        assertEquals(entityType, log.getEntityType());
        assertEquals(entityId, log.getEntityId());
        assertEquals("APPROVED", log.getDecision());
        assertNull(log.getReason());
        assertEquals(userId, log.getDecidedBy());
        assertNotNull(log.getDecidedAt());
    }

    @Test
    @DisplayName("approve — not CHO_PHE_DUYET throws IllegalStateException, no log inserted")
    void approve_wrongStatus_throwsWithoutLog() {
        assertThrows(IllegalStateException.class,
                () -> workflowService.approve("DUOC_PHE_DUYET", entityType, entityId, userId));
        verify(pheDuyetLogRepository, never()).save(any());
    }

    @Test
    @DisplayName("approve — TU_CHOI status throws IllegalStateException")
    void approve_fromTuChoi_throws() {
        assertThrows(IllegalStateException.class,
                () -> workflowService.approve("TU_CHOI", entityType, entityId, userId));
    }

    // ── REJECT ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("reject — CHO_PHE_DUYET + reason → TU_CHOI + inserts PheDuyetLog")
    void reject_fromChoPheduyet_transitionsAndPersistsLog() {
        String reason = "Tài liệu không đầy đủ";

        ApprovalStatus result = workflowService.reject("CHO_PHE_DUYET", entityType, entityId, userId, reason);

        assertEquals(ApprovalStatus.TU_CHOI, result);

        ArgumentCaptor<PheDuyetLog> captor = ArgumentCaptor.forClass(PheDuyetLog.class);
        verify(pheDuyetLogRepository).save(captor.capture());
        PheDuyetLog log = captor.getValue();
        assertEquals("REJECTED", log.getDecision());
        assertEquals(reason, log.getReason());
        assertEquals(userId, log.getDecidedBy());
        assertNotNull(log.getDecidedAt());
    }

    @Test
    @DisplayName("reject — blank reason throws IllegalArgumentException, no transition")
    void reject_blankReason_throwsWithoutLog() {
        assertThrows(IllegalArgumentException.class,
                () -> workflowService.reject("CHO_PHE_DUYET", entityType, entityId, userId, "  "));
        verify(pheDuyetLogRepository, never()).save(any());
    }

    @Test
    @DisplayName("reject — null reason throws IllegalArgumentException")
    void reject_nullReason_throws() {
        assertThrows(IllegalArgumentException.class,
                () -> workflowService.reject("CHO_PHE_DUYET", entityType, entityId, userId, null));
    }

    @Test
    @DisplayName("reject — not CHO_PHE_DUYET throws IllegalStateException")
    void reject_wrongStatus_throws() {
        assertThrows(IllegalStateException.class,
                () -> workflowService.reject("DUOC_PHE_DUYET", entityType, entityId, userId, "reason"));
    }

    // ── RESET ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("resetToPending — always returns CHO_PHE_DUYET")
    void resetToPending_returnsChoPheduyet() {
        assertEquals(ApprovalStatus.CHO_PHE_DUYET,
                workflowService.resetToPending("DUOC_PHE_DUYET"));
        assertEquals(ApprovalStatus.CHO_PHE_DUYET,
                workflowService.resetToPending("TU_CHOI"));
        assertEquals(ApprovalStatus.CHO_PHE_DUYET,
                workflowService.resetToPending("CHO_PHE_DUYET"));
    }

    @Test
    @DisplayName("resetToPending — invalid status throws IllegalArgumentException")
    void resetToPending_invalidStatus_throws() {
        assertThrows(IllegalArgumentException.class,
                () -> workflowService.resetToPending("INVALID_STATUS"));
    }
}
