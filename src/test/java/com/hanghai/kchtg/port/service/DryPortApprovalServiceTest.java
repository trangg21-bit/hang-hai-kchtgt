package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.port.entity.DryPort;
import com.hanghai.kchtg.port.repository.DryPortRepository;
import com.hanghai.kchtg.port.service.shared.PortNotificationService;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DryPortApprovalServiceTest {

    private static final UUID ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID USER_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID ORG_UNIT_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");

    @Mock
    private DryPortRepository dryPortRepository;

    @Mock
    private InfrastructureApprovalService infrastructureApprovalService;

    @Mock
    private InfrastructureHistoryRepository historyRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PortNotificationService notificationService;

    @InjectMocks
    private DryPortApprovalService service;

    private DryPort entity;

    @BeforeEach
    void setUp() {
        entity = DryPort.builder()
                .id(ID)
                .dryPortCode("CC-000001")
                .dryPortName("Cảng cạn Đình Vũ")
                .orgUnitId(ORG_UNIT_ID)
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();

        when(dryPortRepository.findById(ID)).thenReturn(Optional.of(entity));
    }

    @Test
    @DisplayName("getHistory filters approval workflow metadata and attaches orgUnitId")
    void getHistory_filtersApprovalWorkflowMetadata() {
        LocalDateTime now = LocalDateTime.now();

        InfrastructureHistory meta1 = InfrastructureHistory.builder()
                .id(UUID.randomUUID())
                .refId(ID)
                .refType(InfrastructureType.DRY_PORT)
                .status(InfrastructureHistoryStatus.UPDATED)
                .changedField("approvalStatus")
                .previousValue("PENDING_APPROVAL")
                .newValue("APPROVED")
                .approvedDate(now)
                .approvedBy(USER_ID)
                .build();

        InfrastructureHistory meta2 = InfrastructureHistory.builder()
                .id(UUID.randomUUID())
                .refId(ID)
                .refType(InfrastructureType.DRY_PORT)
                .status(InfrastructureHistoryStatus.UPDATED)
                .changedField("submittedForApprovalAt")
                .previousValue(null)
                .newValue("2026-03-01T10:00:00")
                .approvedDate(now)
                .approvedBy(USER_ID)
                .build();

        InfrastructureHistory meta3 = InfrastructureHistory.builder()
                .id(UUID.randomUUID())
                .refId(ID)
                .refType(InfrastructureType.DRY_PORT)
                .status(InfrastructureHistoryStatus.UPDATED)
                .changedField("rejectionReason")
                .previousValue(null)
                .newValue("Lý do từ chối")
                .approvedDate(now)
                .approvedBy(USER_ID)
                .build();

        InfrastructureHistory genuine = InfrastructureHistory.builder()
                .id(UUID.randomUUID())
                .refId(ID)
                .refType(InfrastructureType.DRY_PORT)
                .status(InfrastructureHistoryStatus.UPDATED)
                .changedField("dryPortName")
                .previousValue("Cảng cạn cũ")
                .newValue("Cảng cạn mới")
                .approvedDate(now)
                .approvedBy(USER_ID)
                .build();

        when(historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.DRY_PORT, ID))
                .thenReturn(List.of(meta1, meta2, meta3, genuine));

        User actor = new User();
        actor.setId(USER_ID);
        actor.setFullName("Cán bộ quản lý");
        when(userRepository.findAllById(Set.of(USER_ID))).thenReturn(List.of(actor));

        Map<String, Object> result = service.getHistory(ID);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> changeHistory = (List<Map<String, Object>>) result.get("changeHistory");

        assertThat(changeHistory).hasSize(1);
        assertThat(changeHistory.get(0).get("changedField")).isEqualTo("dryPortName");
        assertThat(changeHistory.get(0).get("oldValue")).isEqualTo("Cảng cạn cũ");
        assertThat(changeHistory.get(0).get("newValue")).isEqualTo("Cảng cạn mới");
        assertThat(changeHistory.get(0).get("changedBy")).isEqualTo("Cán bộ quản lý");
        assertThat(changeHistory.get(0).get("orgUnitId")).isEqualTo(ORG_UNIT_ID.toString());
    }

    @Test
    @DisplayName("getHistory deduplicates canonical fields in the same session")
    void getHistory_deduplicatesCanonicalFieldsInSameSession() {
        LocalDateTime timestamp = LocalDateTime.of(2026, 3, 1, 10, 30, 0);

        InfrastructureHistory englishField = InfrastructureHistory.builder()
                .id(UUID.randomUUID())
                .refId(ID)
                .refType(InfrastructureType.DRY_PORT)
                .status(InfrastructureHistoryStatus.UPDATED)
                .changedField("dryPortName")
                .previousValue("Cảng cạn cũ")
                .newValue("Cảng cạn mới")
                .approvedDate(timestamp)
                .approvedBy(USER_ID)
                .build();

        InfrastructureHistory vietnameseField = InfrastructureHistory.builder()
                .id(UUID.randomUUID())
                .refId(ID)
                .refType(InfrastructureType.DRY_PORT)
                .status(InfrastructureHistoryStatus.UPDATED)
                .changedField("Tên cảng cạn")
                .previousValue("Cảng cạn cũ")
                .newValue("Cảng cạn mới")
                .approvedDate(timestamp)
                .approvedBy(USER_ID)
                .build();

        when(historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.DRY_PORT, ID))
                .thenReturn(List.of(englishField, vietnameseField));

        User actor = new User();
        actor.setId(USER_ID);
        actor.setFullName("Cán bộ");
        when(userRepository.findAllById(Set.of(USER_ID))).thenReturn(List.of(actor));

        Map<String, Object> result = service.getHistory(ID);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> changeHistory = (List<Map<String, Object>>) result.get("changeHistory");

        assertThat(changeHistory).hasSize(1);
        assertThat(changeHistory.get(0).get("changedField")).isEqualTo("dryPortName");
    }

    @Test
    @DisplayName("getHistory falls back changedBy to Hệ thống when user cannot be resolved")
    void getHistory_fallbackUserNameToSystemWhenNull() {
        UUID unknownUserId = UUID.randomUUID();

        InfrastructureHistory hist = InfrastructureHistory.builder()
                .id(UUID.randomUUID())
                .refId(ID)
                .refType(InfrastructureType.DRY_PORT)
                .status(InfrastructureHistoryStatus.UPDATED)
                .changedField("remarks")
                .previousValue("Ghi chú cũ")
                .newValue("Ghi chú mới")
                .approvedDate(LocalDateTime.now())
                .approvedBy(unknownUserId)
                .build();

        when(historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.DRY_PORT, ID))
                .thenReturn(List.of(hist));
        when(userRepository.findAllById(any())).thenReturn(List.of());

        Map<String, Object> result = service.getHistory(ID);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> changeHistory = (List<Map<String, Object>>) result.get("changeHistory");

        assertThat(changeHistory).hasSize(1);
        assertThat(changeHistory.get(0).get("changedBy")).isEqualTo("Hệ thống");
        assertThat(changeHistory.get(0).get("approvedByName")).isEqualTo("Hệ thống");
    }

    @Test
    @DisplayName("getHistory filters out CREATED status and identical old/new values")
    void getHistory_filtersCreatedAndIdenticalValues() {
        LocalDateTime now = LocalDateTime.now();

        InfrastructureHistory createdHist = InfrastructureHistory.builder()
                .id(UUID.randomUUID())
                .refId(ID)
                .refType(InfrastructureType.DRY_PORT)
                .status(InfrastructureHistoryStatus.CREATED)
                .changedField("CREATE")
                .previousValue(null)
                .newValue("INITIAL")
                .approvedDate(now)
                .approvedBy(USER_ID)
                .build();

        InfrastructureHistory identicalVal = InfrastructureHistory.builder()
                .id(UUID.randomUUID())
                .refId(ID)
                .refType(InfrastructureType.DRY_PORT)
                .status(InfrastructureHistoryStatus.UPDATED)
                .changedField("dryPortCode")
                .previousValue("CC-000001")
                .newValue("CC-000001")
                .approvedDate(now)
                .approvedBy(USER_ID)
                .build();

        when(historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.DRY_PORT, ID))
                .thenReturn(List.of(createdHist, identicalVal));

        Map<String, Object> result = service.getHistory(ID);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> changeHistory = (List<Map<String, Object>>) result.get("changeHistory");

        assertThat(changeHistory).isEmpty();
    }

    @Test
    @DisplayName("approveC1 records approval event into InfrastructureHistory")
    void approveC1_recordsApprovalHistory() {
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);

        service.approveC1(ID, "Chi cục duyệt", USER_ID);

        ArgumentCaptor<InfrastructureHistory> captor = ArgumentCaptor.forClass(InfrastructureHistory.class);
        verify(historyRepository).save(captor.capture());

        InfrastructureHistory saved = captor.getValue();
        assertThat(saved.getRefId()).isEqualTo(ID);
        assertThat(saved.getRefType()).isEqualTo(InfrastructureType.DRY_PORT);
        assertThat(saved.getStatus()).isEqualTo(InfrastructureHistoryStatus.APPROVED);
        assertThat(saved.getApprovalLevel()).isEqualTo(ApprovalLevel.LEVEL_1);
    }

    @Test
    @DisplayName("approveC2 records approval event into InfrastructureHistory")
    void approveC2_recordsApprovalHistory() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);

        service.approveC2(ID, "Cục duyệt", USER_ID);

        ArgumentCaptor<InfrastructureHistory> captor = ArgumentCaptor.forClass(InfrastructureHistory.class);
        verify(historyRepository).save(captor.capture());

        InfrastructureHistory saved = captor.getValue();
        assertThat(saved.getRefId()).isEqualTo(ID);
        assertThat(saved.getRefType()).isEqualTo(InfrastructureType.DRY_PORT);
        assertThat(saved.getStatus()).isEqualTo(InfrastructureHistoryStatus.APPROVED);
        assertThat(saved.getApprovalLevel()).isEqualTo(ApprovalLevel.LEVEL_2);
    }

    @Test
    @DisplayName("reject records rejection event into InfrastructureHistory")
    void reject_recordsRejectionHistory() {
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);

        service.reject(ID, "Hồ sơ chưa đủ điều kiện", USER_ID);

        ArgumentCaptor<InfrastructureHistory> captor = ArgumentCaptor.forClass(InfrastructureHistory.class);
        verify(historyRepository).save(captor.capture());

        InfrastructureHistory saved = captor.getValue();
        assertThat(saved.getRefId()).isEqualTo(ID);
        assertThat(saved.getRefType()).isEqualTo(InfrastructureType.DRY_PORT);
        assertThat(saved.getStatus()).isEqualTo(InfrastructureHistoryStatus.REJECTED);
        assertThat(saved.getApprovalLevel()).isEqualTo(ApprovalLevel.LEVEL_1);
    }
}
