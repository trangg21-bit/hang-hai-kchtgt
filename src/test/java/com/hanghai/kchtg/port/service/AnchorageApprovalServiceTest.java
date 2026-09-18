package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.port.entity.Anchorage;
import com.hanghai.kchtg.port.repository.AnchorageRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AnchorageApprovalServiceTest {

    private static final UUID ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID USER_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID ORG_UNIT_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");

    @Mock
    private AnchorageRepository anchorageRepository;

    @Mock
    private InfrastructureHistoryRepository historyRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AnchorageApprovalService service;

    private Anchorage entity;

    @BeforeEach
    void setUp() {
        entity = Anchorage.builder()
                .id(ID)
                .anchorageCode("ND-001")
                .anchorageName("Khu neo Vũng Tàu")
                .orgUnitId(ORG_UNIT_ID)
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();

        when(anchorageRepository.findById(ID)).thenReturn(Optional.of(entity));
    }

    @Test
    @DisplayName("getHistory filters approval workflow metadata and attaches orgUnitId")
    void getHistory_filtersApprovalWorkflowMetadata() {
        LocalDateTime now = LocalDateTime.now();

        InfrastructureHistory meta1 = InfrastructureHistory.builder()
                .id(UUID.randomUUID())
                .refId(ID)
                .refType(InfrastructureType.ANCHORAGE_AREA)
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
                .refType(InfrastructureType.ANCHORAGE_AREA)
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
                .refType(InfrastructureType.ANCHORAGE_AREA)
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
                .refType(InfrastructureType.ANCHORAGE_AREA)
                .status(InfrastructureHistoryStatus.UPDATED)
                .changedField("anchorageName")
                .previousValue("Khu neo cũ")
                .newValue("Khu neo mới")
                .approvedDate(now)
                .approvedBy(USER_ID)
                .build();

        when(historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.ANCHORAGE_AREA, ID))
                .thenReturn(List.of(meta1, meta2, meta3, genuine));

        User actor = new User();
        actor.setId(USER_ID);
        actor.setFullName("Cán bộ quản lý");
        when(userRepository.findAllById(Set.of(USER_ID))).thenReturn(List.of(actor));

        Map<String, Object> result = service.getHistory(ID);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> changeHistory = (List<Map<String, Object>>) result.get("changeHistory");

        assertThat(changeHistory).hasSize(1);
        assertThat(changeHistory.get(0).get("changedField")).isEqualTo("anchorageName");
        assertThat(changeHistory.get(0).get("oldValue")).isEqualTo("Khu neo cũ");
        assertThat(changeHistory.get(0).get("newValue")).isEqualTo("Khu neo mới");
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
                .refType(InfrastructureType.ANCHORAGE_AREA)
                .status(InfrastructureHistoryStatus.UPDATED)
                .changedField("anchorageName")
                .previousValue("Khu neo cũ")
                .newValue("Khu neo mới")
                .approvedDate(timestamp)
                .approvedBy(USER_ID)
                .build();

        InfrastructureHistory vietnameseField = InfrastructureHistory.builder()
                .id(UUID.randomUUID())
                .refId(ID)
                .refType(InfrastructureType.ANCHORAGE_AREA)
                .status(InfrastructureHistoryStatus.UPDATED)
                .changedField("Tên khu neo đậu")
                .previousValue("Khu neo cũ")
                .newValue("Khu neo mới")
                .approvedDate(timestamp)
                .approvedBy(USER_ID)
                .build();

        when(historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.ANCHORAGE_AREA, ID))
                .thenReturn(List.of(englishField, vietnameseField));

        User actor = new User();
        actor.setId(USER_ID);
        actor.setFullName("Cán bộ");
        when(userRepository.findAllById(Set.of(USER_ID))).thenReturn(List.of(actor));

        Map<String, Object> result = service.getHistory(ID);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> changeHistory = (List<Map<String, Object>>) result.get("changeHistory");

        assertThat(changeHistory).hasSize(1);
        assertThat(changeHistory.get(0).get("changedField")).isEqualTo("anchorageName");
    }

    @Test
    @DisplayName("getHistory falls back changedBy to Hệ thống when user cannot be resolved")
    void getHistory_fallbackUserNameToSystemWhenNull() {
        UUID unknownUserId = UUID.randomUUID();

        InfrastructureHistory hist = InfrastructureHistory.builder()
                .id(UUID.randomUUID())
                .refId(ID)
                .refType(InfrastructureType.ANCHORAGE_AREA)
                .status(InfrastructureHistoryStatus.UPDATED)
                .changedField("remarks")
                .previousValue("Ghi chú cũ")
                .newValue("Ghi chú mới")
                .approvedDate(LocalDateTime.now())
                .approvedBy(unknownUserId)
                .build();

        when(historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.ANCHORAGE_AREA, ID))
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
                .refType(InfrastructureType.ANCHORAGE_AREA)
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
                .refType(InfrastructureType.ANCHORAGE_AREA)
                .status(InfrastructureHistoryStatus.UPDATED)
                .changedField("anchorageCode")
                .previousValue("ND-001")
                .newValue("ND-001")
                .approvedDate(now)
                .approvedBy(USER_ID)
                .build();

        when(historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.ANCHORAGE_AREA, ID))
                .thenReturn(List.of(createdHist, identicalVal));

        Map<String, Object> result = service.getHistory(ID);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> changeHistory = (List<Map<String, Object>>) result.get("changeHistory");

        assertThat(changeHistory).isEmpty();
    }

    @Test
    @DisplayName("submit updates approval status to PENDING_APPROVAL")
    void submit_updatesApprovalStatus() {
        entity.setApprovalStatus(ApprovalStatus.DRAFT);
        when(anchorageRepository.save(any(Anchorage.class))).thenAnswer(i -> i.getArgument(0));

        service.submit(ID, "Nộp hồ sơ duyệt", USER_ID);

        assertThat(entity.getApprovalStatus()).isEqualTo(ApprovalStatus.PENDING_APPROVAL);
        assertThat(entity.getSubmittedForApprovalBy()).isEqualTo(USER_ID.toString());
        assertThat(entity.getSubmittedForApprovalAt()).isNotNull();
    }

    @Test
    @DisplayName("approve at level CANG_VU transitions PENDING_APPROVAL to APPROVED_LEVEL1")
    void approve_cangVu_transitionsToApprovedLevel1() {
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        when(anchorageRepository.save(any(Anchorage.class))).thenAnswer(i -> i.getArgument(0));

        service.approve(ID, USER_ID.toString(), "CANG_VU", "Duyệt cấp 1");

        assertThat(entity.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED_LEVEL1);
        assertThat(entity.getPortAuthorityApprovalContent()).isEqualTo("Duyệt cấp 1");
        assertThat(entity.getPortAuthorityApprovedBy()).isEqualTo(USER_ID.toString());
    }

    @Test
    @DisplayName("approve at level CUC transitions APPROVED_LEVEL1 to APPROVED")
    void approve_cuc_transitionsToApproved() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
        when(anchorageRepository.save(any(Anchorage.class))).thenAnswer(i -> i.getArgument(0));

        service.approve(ID, USER_ID.toString(), "CUC", "Duyệt cấp 2");

        assertThat(entity.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED);
        assertThat(entity.getDepartmentApprovalContent()).isEqualTo("Duyệt cấp 2");
        assertThat(entity.getDepartmentApprovedBy()).isEqualTo(USER_ID.toString());
    }

    @Test
    @DisplayName("reject transitions to REJECTED_LEVEL1 or REJECTED_LEVEL2")
    void reject_setsRejectionReasonAndStatus() {
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        when(anchorageRepository.save(any(Anchorage.class))).thenAnswer(i -> i.getArgument(0));

        service.reject(ID, USER_ID.toString(), "CANG_VU", "Thiếu tài liệu");

        assertThat(entity.getApprovalStatus()).isEqualTo(ApprovalStatus.REJECTED_LEVEL1);
        assertThat(entity.getRejectionReason()).isEqualTo("Thiếu tài liệu");
    }
}
