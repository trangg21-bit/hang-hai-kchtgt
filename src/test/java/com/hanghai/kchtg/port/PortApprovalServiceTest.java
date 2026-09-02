package com.hanghai.kchtg.port;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.port.entity.ApprovalLog;
import com.hanghai.kchtg.port.entity.ChangeLog;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.repository.ApprovalLogRepository;
import com.hanghai.kchtg.port.repository.ChangeLogRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.port.service.PortApprovalService;
import com.hanghai.kchtg.vtssystem.dto.HistoryEntry;
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
import com.hanghai.kchtg.port.service.PortCacheService;

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

    @Mock
    private PortCacheService portCacheService;

    // Hai phụ thuộc dưới đây được thêm khi nhật ký cảng biển chuyển sang bảng
    // dùng chung `infrastructure_history`; thiếu @Mock thì @InjectMocks để null.
    @Mock
    private InfrastructureHistoryRepository historyRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private InfrastructureApprovalService infrastructureApprovalService;

    private UUID testId;
    private Port testEntity;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        testEntity = new Port();
        ReflectionTestUtils.setField(testEntity, "id", testId);
        testEntity.setPortCode("CB-001");
        testEntity.setPortName("Cảng Test");
        testEntity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
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
        verify(approvalWorkflowService).approve(eq("PENDING_APPROVAL"), eq("Port"), eq(testId.toString()), eq("user-1"));
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
        verify(approvalWorkflowService).reject(eq("PENDING_APPROVAL"), eq("Port"), eq(testId.toString()),
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
        testEntity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        when(portRepository.findById(testId)).thenReturn(Optional.of(testEntity));
        doThrow(new IllegalStateException("Cannot approve: already approved"))
                .when(approvalWorkflowService).approve(eq(ApprovalStatus.PENDING_APPROVAL.name()), any(), any(), any());

        assertThrows(IllegalStateException.class, () -> approvalService.approve(testId, "user-1", null));
        verify(portRepository, never()).save(any());
    }

    // ── HISTORY (F-013) ────────────────────────────────────────────────────

    @Test
    @DisplayName("F-013: getHistory — trả về changeHistory và approvalLog từ infrastructure_history")
    void getHistory_returnsPersistedRows() {
        when(portRepository.findById(testId)).thenReturn(Optional.of(testEntity));

        // Dòng có changedField => nhật ký thay đổi
        InfrastructureHistory changeRow = new InfrastructureHistory();
        ReflectionTestUtils.setField(changeRow, "id", UUID.randomUUID());
        changeRow.setRefType(InfrastructureType.SEAPORT);
        changeRow.setRefId(testId);
        changeRow.setChangedField("portName");
        changeRow.setPreviousValue("Cũ");
        changeRow.setNewValue("Mới");
        changeRow.setApprovedDate(LocalDateTime.now());

        // Dòng không có changedField nhưng có status => vết phê duyệt
        InfrastructureHistory approvalRow = new InfrastructureHistory();
        ReflectionTestUtils.setField(approvalRow, "id", UUID.randomUUID());
        approvalRow.setRefType(InfrastructureType.SEAPORT);
        approvalRow.setRefId(testId);
        approvalRow.setStatus(InfrastructureHistoryStatus.APPROVED);
        approvalRow.setApprovalLevel(ApprovalLevel.LEVEL_2);
        approvalRow.setApprovedDate(LocalDateTime.now());

        when(historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.SEAPORT, testId))
                .thenReturn(List.of(changeRow, approvalRow));

        List<HistoryEntry> result = approvalService.getHistory(testId);

        assertNotNull(result);
        assertEquals(2, result.size());
        HistoryEntry change = result.stream().filter(e -> "portName".equals(e.getChangedField())).findFirst().orElse(null);
        assertNotNull(change);
        assertEquals("Cũ", change.getPreviousValue());
        assertEquals("Mới", change.getNewValue());
        HistoryEntry approve = result.stream().filter(e -> e.getChangedField() == null).findFirst().orElse(null);
        assertNotNull(approve);
        assertEquals(InfrastructureHistoryStatus.APPROVED.name(), approve.getStatus());
        assertEquals(ApprovalLevel.LEVEL_2, approve.getApprovalLevel());
    }

    @Test
    @DisplayName("F-013: getHistory — danh sách rỗng khi chưa có nhật ký")
    void getHistory_emptyWhenNoRecords() {
        when(portRepository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.SEAPORT, testId))
                .thenReturn(List.of());

        List<HistoryEntry> result = approvalService.getHistory(testId);
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("F-013: getHistory — throws EntityNotFoundException when entity missing")
    void getHistory_entityNotFound_throws() {
        when(portRepository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> approvalService.getHistory(testId));
    }
}
