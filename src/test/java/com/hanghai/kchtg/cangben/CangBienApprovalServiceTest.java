package com.hanghai.kchtg.cangben;

import com.hanghai.kchtg.cangben.entity.CangBien;
import com.hanghai.kchtg.cangben.entity.LichSuThayDoi;
import com.hanghai.kchtg.cangben.entity.PheDuyetLog;
import com.hanghai.kchtg.cangben.repository.CangBienRepository;
import com.hanghai.kchtg.cangben.repository.LichSuThayDoiRepository;
import com.hanghai.kchtg.cangben.repository.PheDuyetLogRepository;
import com.hanghai.kchtg.cangben.service.CangBienApprovalService;
import com.hanghai.kchtg.cangben.service.shared.ApprovalWorkflowService;
import com.hanghai.kchtg.cangben.service.shared.CangBenNotificationService;
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

@ExtendWith(MockitoExtension.class)
@DisplayName("CangBienApprovalService unit tests — F-011/F-013")
class CangBienApprovalServiceTest {

    @InjectMocks
    private CangBienApprovalService approvalService;

    @Mock
    private CangBienRepository cangBienRepository;

    @Mock
    private ApprovalWorkflowService approvalWorkflowService;

    @Mock
    private CangBenNotificationService notificationService;

    @Mock
    private LichSuThayDoiRepository lichSuThayDoiRepository;

    @Mock
    private PheDuyetLogRepository pheDuyetLogRepository;

    private UUID testId;
    private CangBien testEntity;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        testEntity = new CangBien();
        ReflectionTestUtils.setField(testEntity, "id", testId);
        testEntity.setMaCang("CB-001");
        testEntity.setTenCang("Cảng Test");
        testEntity.setTrangThaiPheDuyet("CHO_PHE_DUYET");
    }

    // ── APPROVE (F-011) ────────────────────────────────────────────────────

    @Test
    @DisplayName("F-011: approve — sets status to DUOC_PHE_DUYET and persists PheDuyetLog")
    void approve_setsApprovedStatus() {
        when(cangBienRepository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(cangBienRepository.save(any())).thenReturn(testEntity);

        approvalService.approve(testId, "user-1", null); // null reason = approve

        assertEquals("DUOC_PHE_DUYET", testEntity.getTrangThaiPheDuyet());
        verify(cangBienRepository).save(testEntity);
        verify(approvalWorkflowService).approve(eq("CHO_PHE_DUYET"), eq("CangBien"), eq(testId.toString()), eq("user-1"));
        verify(notificationService).sendApprovalNotification(eq("CangBien"), eq(testId.toString()), eq("user-1"), eq(null));
    }

    @Test
    @DisplayName("F-011: approve — blank reason also treated as approve")
    void approve_blankReason_treatedAsApprove() {
        when(cangBienRepository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(cangBienRepository.save(any())).thenReturn(testEntity);

        approvalService.approve(testId, "user-1", "  "); // blank = approve

        assertEquals("DUOC_PHE_DUYET", testEntity.getTrangThaiPheDuyet());
        verify(approvalWorkflowService).approve(any(), any(), any(), any());
    }

    @Test
    @DisplayName("F-011: reject — sets status to TU_CHOI and persists PheDuyetLog")
    void reject_setsTuChoiStatus() {
        when(cangBienRepository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(cangBienRepository.save(any())).thenReturn(testEntity);

        approvalService.approve(testId, "user-1", "Thiếu tài liệu"); // non-blank reason = reject

        assertEquals("TU_CHOI", testEntity.getTrangThaiPheDuyet());
        verify(cangBienRepository).save(testEntity);
        verify(approvalWorkflowService).reject(eq("CHO_PHE_DUYET"), eq("CangBien"), eq(testId.toString()),
                eq("user-1"), eq("Thiếu tài liệu"));
    }

    @Test
    @DisplayName("F-011: approve — throws EntityNotFoundException when entity missing")
    void approve_entityNotFound_throws() {
        when(cangBienRepository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> approvalService.approve(testId, "user-1", null));
    }

    @Test
    @DisplayName("F-011: approve — throws IllegalStateException when not in CHO_PHE_DUYET (via workflow)")
    void approve_wrongStatus_throwsViaWorkflow() {
        testEntity.setTrangThaiPheDuyet("DUOC_PHE_DUYET");
        when(cangBienRepository.findById(testId)).thenReturn(Optional.of(testEntity));
        doThrow(new IllegalStateException("Cannot approve: already approved"))
                .when(approvalWorkflowService).approve(eq("DUOC_PHE_DUYET"), any(), any(), any());

        assertThrows(IllegalStateException.class, () -> approvalService.approve(testId, "user-1", null));
        verify(cangBienRepository, never()).save(any());
    }

    // ── HISTORY (F-013) ────────────────────────────────────────────────────

    @Test
    @DisplayName("F-013: getHistory — returns map with changeHistory and approvalLog")
    void getHistory_returnsPersistedRows() {
        when(cangBienRepository.findById(testId)).thenReturn(Optional.of(testEntity));

        LichSuThayDoi changeRecord = LichSuThayDoi.builder()
                .id(UUID.randomUUID())
                .entityType("CangBien")
                .entityId(testId.toString())
                .fieldName("tenCang")
                .oldValue("Cu")
                .newValue("Moi")
                .changedBy("user-1")
                .changedAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();
        PheDuyetLog pheDuyetLog = PheDuyetLog.builder()
                .id(UUID.randomUUID())
                .entityType("CangBien")
                .entityId(testId.toString())
                .decision("APPROVED")
                .decidedBy("user-1")
                .decidedAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();

        when(lichSuThayDoiRepository.findByEntityTypeAndEntityId("CangBien", testId.toString()))
                .thenReturn(List.of(changeRecord));
        when(pheDuyetLogRepository.findByEntityTypeAndEntityId("CangBien", testId.toString()))
                .thenReturn(List.of(pheDuyetLog));

        Map<String, Object> result = approvalService.getHistory(testId);

        assertNotNull(result);
        assertEquals(testId.toString(), result.get("entityId"));
        assertEquals("CangBien", result.get("entityType"));
        assertEquals("CHO_PHE_DUYET", result.get("currentApprovalStatus"));

        @SuppressWarnings("unchecked")
        List<LichSuThayDoi> history = (List<LichSuThayDoi>) result.get("changeHistory");
        assertEquals(1, history.size());
        assertEquals("tenCang", history.get(0).getFieldName());

        @SuppressWarnings("unchecked")
        List<PheDuyetLog> logs = (List<PheDuyetLog>) result.get("approvalLog");
        assertEquals(1, logs.size());
        assertEquals("APPROVED", logs.get(0).getDecision());
    }

    @Test
    @DisplayName("F-013: getHistory — empty lists when no history exists")
    void getHistory_emptyWhenNoRecords() {
        when(cangBienRepository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(lichSuThayDoiRepository.findByEntityTypeAndEntityId(any(), any()))
                .thenReturn(List.of());
        when(pheDuyetLogRepository.findByEntityTypeAndEntityId(any(), any()))
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
        when(cangBienRepository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> approvalService.getHistory(testId));
    }
}
