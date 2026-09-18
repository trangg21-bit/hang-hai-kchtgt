package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.port.entity.TransferArea;
import com.hanghai.kchtg.port.repository.TransferAreaRepository;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;


@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TransferAreaApprovalServiceTest {

    private static final UUID ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID USER_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID ORG_UNIT_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");

    @Mock
    private TransferAreaRepository transferAreaRepository;

    @Mock
    private InfrastructureHistoryRepository historyRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TransferAreaApprovalService service;

    private TransferArea entity;

    @BeforeEach
    void setUp() {
        entity = TransferArea.builder()
                .id(ID)
                .transferAreaCode("KCT-001")
                .transferAreaName("Khu chuyển tải Hòn Gai")
                .orgUnitId(ORG_UNIT_ID)
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();

        when(transferAreaRepository.findById(ID)).thenReturn(Optional.of(entity));
    }

    @Test
    @DisplayName("getHistory returns change history with canonicalized field names")
    void getHistory_returnsChangeHistoryWithCanonicalizedFieldNames() {
        InfrastructureHistory h1 = InfrastructureHistory.builder()
                .id(UUID.randomUUID())
                .refId(ID)
                .refType(InfrastructureType.TRANSSHIPMENT_AREA)
                .changedField("Biểu tượng")
                .previousValue("SYM-OLD")
                .newValue("SYM-NEW")
                .approvedBy(USER_ID)
                .approvedDate(LocalDateTime.now())
                .status(InfrastructureHistoryStatus.APPROVED)
                .build();

        InfrastructureHistory h2 = InfrastructureHistory.builder()
                .id(UUID.randomUUID())
                .refId(ID)
                .refType(InfrastructureType.TRANSSHIPMENT_AREA)
                .changedField("Loại đối tượng")
                .previousValue("POINT")
                .newValue("POLYGON")
                .approvedBy(USER_ID)
                .approvedDate(LocalDateTime.now())
                .status(InfrastructureHistoryStatus.APPROVED)
                .build();

        when(historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.TRANSSHIPMENT_AREA, ID))
                .thenReturn(List.of(h1, h2));

        User user = new User();
        user.setId(USER_ID);
        user.setFullName("Nguyễn Văn A");
        when(userRepository.findAllById(any())).thenReturn(List.of(user));

        Map<String, Object> res = service.getHistory(ID);
        assertThat(res).isNotNull();
        assertThat(res.get("entityType")).isEqualTo("TransferArea");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> changeHistory = (List<Map<String, Object>>) res.get("changeHistory");
        assertThat(changeHistory).hasSize(2);
        assertThat(changeHistory.get(0).get("changedField")).isEqualTo("mapSymbolId");
        assertThat(changeHistory.get(1).get("changedField")).isEqualTo("geometryType");
    }

    @Test
    @DisplayName("submit sets status to PENDING_APPROVAL")
    void submit_setsPendingApproval() {
        entity.setApprovalStatus(ApprovalStatus.DRAFT);
        when(transferAreaRepository.save(any())).thenReturn(entity);

        service.submit(ID, null, USER_ID);

        assertThat(entity.getApprovalStatus()).isEqualTo(ApprovalStatus.PENDING_APPROVAL);
        assertThat(entity.getSubmittedForApprovalBy()).isEqualTo(USER_ID.toString());
        verify(transferAreaRepository).save(entity);
    }

    @Test
    @DisplayName("approve CANG_VU sets status to APPROVED_LEVEL1")
    void approve_cangVu_setsApprovedLevel1() {
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        when(transferAreaRepository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(null);

        service.approve(ID, USER_ID.toString(), "CANG_VU", "Nội dung duyệt");

        assertThat(entity.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED_LEVEL1);
        verify(transferAreaRepository).save(entity);
    }

    @Test
    @DisplayName("approve CUC sets status to APPROVED")
    void approve_cuc_setsApproved() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
        when(transferAreaRepository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(null);

        service.approve(ID, USER_ID.toString(), "CUC", "Nội dung duyệt Cục");

        assertThat(entity.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED);
        verify(transferAreaRepository).save(entity);
    }

    @Test
    @DisplayName("reject CANG_VU sets status to REJECTED_LEVEL1")
    void reject_cangVu_setsRejectedLevel1() {
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        when(transferAreaRepository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(null);

        service.reject(ID, USER_ID.toString(), "CANG_VU", "Lý do từ chối");

        assertThat(entity.getApprovalStatus()).isEqualTo(ApprovalStatus.REJECTED_LEVEL1);
        assertThat(entity.getRejectionReason()).isEqualTo("Lý do từ chối");
        verify(transferAreaRepository).save(entity);
    }
}
