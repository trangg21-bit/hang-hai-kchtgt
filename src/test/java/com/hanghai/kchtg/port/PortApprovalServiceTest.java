package com.hanghai.kchtg.port;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.port.entity.ApprovalLog;
import com.hanghai.kchtg.port.entity.ChangeLog;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.repository.ApprovalLogRepository;
import com.hanghai.kchtg.port.repository.ChangeLogRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.port.service.PortApprovalService;
import com.hanghai.kchtg.port.service.shared.ApprovalWorkflowService;
import com.hanghai.kchtg.port.service.shared.PortNotificationService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;

@ExtendWith(MockitoExtension.class)
@DisplayName("PortApprovalService unit tests — F-011/F-013")
class PortApprovalServiceTest {

    @InjectMocks
    private PortApprovalService approvalService;

    @Mock
    private PortRepository portRepository;

    @Mock
    private ApprovalWorkflowService approvalWorkflowService;

    @Mock
    private PortNotificationService notificationService;

    @Mock
    private ChangeLogRepository changeLogRepository;

    @Mock
    private ChangeHistoryService changeHistoryService;

    @Mock
    private ApprovalLogRepository approvalLogRepository;

    private UUID testId;
    private Port testEntity;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        testEntity = new Port();
        ReflectionTestUtils.setField(testEntity, "id", testId);
        testEntity.setPortCode("CB-001");
        testEntity.setPortName("Cảng Test");
        testEntity.setApprovalStatus(ApprovalStatus.PENDING);
    }

    // ── APPROVE (F-011) ────────────────────────────────────────────────────

    @Test
    @DisplayName("F-011: approve — sets status to APPROVED and persists ApprovalLog")
    void approve_setsApprovedStatus() {
        when(portRepository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(portRepository.save(any())).thenReturn(testEntity);

        approvalService.approve(testId, "user-1", null); // null reason = approve

        assertEquals(ApprovalStatus.APPROVED, testEntity.getApprovalStatus());
        verify(portRepository).save(testEntity);
        verify(approvalWorkflowService).approve(eq("PENDING"), eq("Port"), eq(testId.toString()), eq("user-1"));
        verify(notificationService).sendApprovalNotification(eq("Port"), eq(testId.toString()), eq("user-1"), eq(null));
    }

    @Test
    @DisplayName("F-011: approve — blank reason also treated as approve")
    void approve_blankReason_treatedAsApprove() {
        when(portRepository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(portRepository.save(any())).thenReturn(testEntity);

        approvalService.approve(testId, "user-1", "  "); // blank = approve

        assertEquals(ApprovalStatus.APPROVED, testEntity.getApprovalStatus());
        verify(approvalWorkflowService).approve(any(), any(), any(), any());
    }

    @Test
    @DisplayName("F-011: reject — sets status to REJECTED and persists ApprovalLog")
    void reject_setsTuChoiStatus() {
        when(portRepository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(portRepository.save(any())).thenReturn(testEntity);

        approvalService.approve(testId, "user-1", "Thiếu tài liệu"); // non-blank reason = reject

        assertEquals(ApprovalStatus.REJECTED, testEntity.getApprovalStatus());
        verify(portRepository).save(testEntity);
        verify(approvalWorkflowService).reject(eq("PENDING"), eq("Port"), eq(testId.toString()),
                eq("user-1"), eq("Thiếu tài liệu"));
    }

    @Test
    @DisplayName("F-011: approve — throws EntityNotFoundException when entity missing")
    void approve_entityNotFound_throws() {
        when(portRepository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> approvalService.approve(testId, "user-1", null));
    }

    @Test
    @DisplayName("F-011: approve — throws IllegalStateException when not in PENDING (via workflow)")
    void approve_wrongStatus_throwsViaWorkflow() {
        testEntity.setApprovalStatus(ApprovalStatus.APPROVED);
        when(portRepository.findById(testId)).thenReturn(Optional.of(testEntity));
        doThrow(new IllegalStateException("Cannot approve: already approved"))
                .when(approvalWorkflowService).approve(eq("APPROVED"), any(), any(), any());

        assertThrows(IllegalStateException.class, () -> approvalService.approve(testId, "user-1", null));
        verify(portRepository, never()).save(any());
    }

    // ── HISTORY (F-013) ────────────────────────────────────────────────────

    @Test
    @DisplayName("F-013: getHistory — returns map with changeHistory and approvalLog")
    void getHistory_returnsPersistedRows() {
        when(portRepository.findById(testId)).thenReturn(Optional.of(testEntity));

        ChangeLog changeRecord = ChangeLog.builder()
                .id(UUID.randomUUID())
                .entityType("Port")
                .entityId(testId.toString())
                .fieldName("portName")
                .oldValue("Cu")
                .newValue("Moi")
                .changedBy("user-1")
                .changedAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();
        ApprovalLog approvalLog = ApprovalLog.builder()
                .id(UUID.randomUUID())
                .entityType("Port")
                .entityId(testId.toString())
                .decision("APPROVED")
                .decidedBy("user-1")
                .decidedAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();

        when(changeLogRepository.findByEntityTypeAndEntityId("Port", testId.toString()))
                .thenReturn(List.of(changeRecord));
        when(approvalLogRepository.findByEntityTypeAndEntityId("Port", testId.toString()))
                .thenReturn(List.of(approvalLog));

        Map<String, Object> result = approvalService.getHistory(testId);

        assertNotNull(result);
        assertEquals(testId.toString(), result.get("entityId"));
        assertEquals("Port", result.get("entityType"));
        assertEquals(ApprovalStatus.PENDING, result.get("currentApprovalStatus"));

        @SuppressWarnings("unchecked")
        List<ChangeLog> history = (List<ChangeLog>) result.get("changeHistory");
        assertEquals(1, history.size());
        assertEquals("portName", history.get(0).getFieldName());

        @SuppressWarnings("unchecked")
        List<ApprovalLog> logs = (List<ApprovalLog>) result.get("approvalLog");
        assertEquals(1, logs.size());
        assertEquals("APPROVED", logs.get(0).getDecision());
    }

    @Test
    @DisplayName("F-013: getHistory — empty lists when no history exists")
    void getHistory_emptyWhenNoRecords() {
        when(portRepository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(changeLogRepository.findByEntityTypeAndEntityId(any(), any()))
                .thenReturn(List.of());
        when(approvalLogRepository.findByEntityTypeAndEntityId(any(), any()))
                .thenReturn(List.of());

        Map<String, Object> result = approvalService.getHistory(testId);

        @SuppressWarnings("unchecked")
        List<?> history = (List<?>) result.get("changeHistory");
        @SuppressWarnings("unchecked")
        List<?> logs = (List<?>) result.get("approvalLog");
        assertTrue(history.isEmpty());
        assertTrue(logs.isEmpty());
    }

    @Test
    @DisplayName("F-013: getHistory — throws EntityNotFoundException when entity missing")
    void getHistory_entityNotFound_throws() {
        when(portRepository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> approvalService.getHistory(testId));
    }
}
