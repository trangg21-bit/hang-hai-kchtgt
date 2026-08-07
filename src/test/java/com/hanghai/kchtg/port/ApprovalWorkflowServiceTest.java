package com.hanghai.kchtg.port;

import com.hanghai.kchtg.port.entity.ApprovalLog;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.port.repository.ApprovalLogRepository;
import com.hanghai.kchtg.port.service.shared.ApprovalWorkflowService;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * Unit tests for ApprovalWorkflowService — shared state-machine used by all
 * CangBen entity approval services (F-011/017/023/025/031).
 * Tests that ApprovalLog is persisted on each decision.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ApprovalWorkflowService — state-machine + ApprovalLog persistence")
class ApprovalWorkflowServiceTest {

    @InjectMocks
    private ApprovalWorkflowService workflowService;

    @Mock
    private ApprovalLogRepository approvalLogRepository;

    private final String entityType = "Port";
    private final String entityId = UUID.randomUUID().toString();
    private final String userId = "user-approver-1";

    // ── APPROVE ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("approve — PENDING → APPROVED + inserts ApprovalLog")
    void approve_fromChoPheduyet_transitionsAndPersistsLog() {
        ApprovalStatus result = workflowService.approve("PENDING_APPROVAL", entityType, entityId, userId);

        assertEquals(ApprovalStatus.APPROVED, result);

        ArgumentCaptor<ApprovalLog> captor = ArgumentCaptor.forClass(ApprovalLog.class);
        verify(approvalLogRepository).save(captor.capture());
        ApprovalLog log = captor.getValue();
        assertEquals(entityType, log.getEntityType());
        assertEquals(entityId, log.getEntityId());
        assertEquals("APPROVED", log.getDecision());
        assertNull(log.getReason());
        assertEquals(userId, log.getDecidedBy());
        assertNotNull(log.getDecidedAt());
    }

    @Test
    @DisplayName("approve — not PENDING throws IllegalStateException, no log inserted")
    void approve_wrongStatus_throwsWithoutLog() {
        assertThrows(IllegalStateException.class,
                () -> workflowService.approve("APPROVED", entityType, entityId, userId));
        verify(approvalLogRepository, never()).save(any());
    }

    @Test
    @DisplayName("approve — REJECTED status throws IllegalStateException")
    void approve_fromTuChoi_throws() {
        assertThrows(IllegalStateException.class,
                () -> workflowService.approve("REJECTED", entityType, entityId, userId));
    }

    // ── REJECT ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("reject — PENDING + reason → REJECTED + inserts ApprovalLog")
    void reject_fromChoPheduyet_transitionsAndPersistsLog() {
        String reason = "Tài liệu không đầy đủ";

        ApprovalStatus result = workflowService.reject("PENDING_APPROVAL", entityType, entityId, userId, reason);

        assertEquals(ApprovalStatus.REJECTED, result);

        ArgumentCaptor<ApprovalLog> captor = ArgumentCaptor.forClass(ApprovalLog.class);
        verify(approvalLogRepository).save(captor.capture());
        ApprovalLog log = captor.getValue();
        assertEquals("REJECTED", log.getDecision());
        assertEquals(reason, log.getReason());
        assertEquals(userId, log.getDecidedBy());
        assertNotNull(log.getDecidedAt());
    }

    @Test
    @DisplayName("reject — blank reason throws IllegalArgumentException, no transition")
    void reject_blankReason_throwsWithoutLog() {
        assertThrows(IllegalArgumentException.class,
                () -> workflowService.reject("PENDING_APPROVAL", entityType, entityId, userId, "  "));
        verify(approvalLogRepository, never()).save(any());
    }

    @Test
    @DisplayName("reject — null reason throws IllegalArgumentException")
    void reject_nullReason_throws() {
        assertThrows(IllegalArgumentException.class,
                () -> workflowService.reject("PENDING_APPROVAL", entityType, entityId, userId, null));
    }

    @Test
    @DisplayName("reject — not PENDING throws IllegalStateException")
    void reject_wrongStatus_throws() {
        assertThrows(IllegalStateException.class,
                () -> workflowService.reject("APPROVED", entityType, entityId, userId, "reason"));
    }

    // ── RESET ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("resetToPending — always returns PENDING")
    void resetToPending_returnsChoPheduyet() {
        assertEquals(ApprovalStatus.PENDING_APPROVAL,
                workflowService.resetToPending("APPROVED"));
        assertEquals(ApprovalStatus.PENDING_APPROVAL,
                workflowService.resetToPending("REJECTED"));
        assertEquals(ApprovalStatus.PENDING_APPROVAL,
                workflowService.resetToPending("PENDING_APPROVAL"));
    }

    @Test
    @DisplayName("resetToPending — invalid status throws IllegalArgumentException")
    void resetToPending_invalidStatus_throws() {
        assertThrows(IllegalArgumentException.class,
                () -> workflowService.resetToPending("INVALID_STATUS"));
    }
}

