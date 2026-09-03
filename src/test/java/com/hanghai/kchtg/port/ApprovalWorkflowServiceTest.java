package com.hanghai.kchtg.port;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
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
 *
 * Nhật ký quyết định duyệt đã chuyển từ bảng riêng `approval_log` sang bảng dùng chung
 * `infrastructure_history` (xem approval-2-level-spec.md mục 3.5), nên test kiểm tra
 * `InfrastructureHistoryRepository.save(...)`.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ApprovalWorkflowService — state-machine + ghi nhật ký infrastructure_history")
class ApprovalWorkflowServiceTest {

    @InjectMocks
    private ApprovalWorkflowService workflowService;

    @Mock
    private InfrastructureHistoryRepository historyRepository;

    private final String entityType = "Port";
    private final String entityId = UUID.randomUUID().toString();
    private final String userId = UUID.randomUUID().toString();

    // ── APPROVE ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("approve — PENDING → APPROVED")
    void approve_fromChoPheduyet_transitionsAndPersistsLog() {
        ApprovalStatus result = workflowService.approve("PENDING_APPROVAL", entityType, entityId, userId);

        assertEquals(ApprovalStatus.APPROVED, result);
    }

    @Test
    @DisplayName("approve — not PENDING throws IllegalStateException, no log inserted")
    void approve_wrongStatus_throwsWithoutLog() {
        assertThrows(IllegalStateException.class,
                () -> workflowService.approve("APPROVED", entityType, entityId, userId));
        verify(historyRepository, never()).save(any());
    }

    @Test
    @DisplayName("approve — REJECTED status throws IllegalStateException")
    void approve_fromTuChoi_throws() {
        assertThrows(IllegalStateException.class,
                () -> workflowService.approve("REJECTED", entityType, entityId, userId));
    }

    // ── REJECT ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("reject — PENDING + reason → REJECTED")
    void reject_fromChoPheduyet_transitionsAndPersistsLog() {
        String reason = "Tài liệu không đầy đủ";

        ApprovalStatus result = workflowService.reject("PENDING_APPROVAL", entityType, entityId, userId, reason);

        assertEquals(ApprovalStatus.REJECTED, result);
    }

    @Test
    @DisplayName("reject — blank reason throws IllegalArgumentException, no transition")
    void reject_blankReason_throwsWithoutLog() {
        assertThrows(IllegalArgumentException.class,
                () -> workflowService.reject("PENDING_APPROVAL", entityType, entityId, userId, "  "));
        verify(historyRepository, never()).save(any());
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

