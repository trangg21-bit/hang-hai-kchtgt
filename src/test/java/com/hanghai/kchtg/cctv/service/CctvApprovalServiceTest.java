package com.hanghai.kchtg.cctv.service;

import com.hanghai.kchtg.cctv.dto.ApprovalRequest;
import com.hanghai.kchtg.cctv.dto.CctvResponse;
import com.hanghai.kchtg.cctv.entity.Cctv;
import com.hanghai.kchtg.cctv.repository.CctvRepository;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.port.repository.ChangeLogRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tests the 2-level approval flow (M-1006) on CCTV via the shared
 * InfrastructureApprovalService — mirrors VtsSystemServiceTest.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CctvApprovalServiceTest {

    private static final UUID ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID CREATOR = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID APPROVER_A = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private static final UUID APPROVER_B = UUID.fromString("44444444-4444-4444-4444-444444444444");

    @Mock
    private CctvRepository cctvRepository;
    @Mock
    private CctvService cctvService;
    @Mock
    private ChangeLogRepository changeLogRepository;
    @Mock
    private InfrastructureHistoryRepository historyRepository;
    @Mock
    private UserRepository userRepository;

    private CctvApprovalService service;

    private Cctv entity;

    @BeforeEach
    void setUp() {
        InfrastructureApprovalService approvalService =
                new InfrastructureApprovalService(historyRepository, userRepository);
        service = new CctvApprovalService(cctvRepository, approvalService, cctvService,
                historyRepository, changeLogRepository, userRepository);

        // Người gửi không thuộc cấp Cục → submit đi qua vòng 1 (Rule 14).
        when(userRepository.findById(any())).thenReturn(Optional.empty());
        when(cctvRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(cctvService.toResponse(any())).thenAnswer(inv -> CctvResponse.builder()
                .id(ID)
                .approvalStatus(((Cctv) inv.getArgument(0)).getApprovalStatus())
                .build());

        entity = Cctv.builder()
                .id(ID)
                .deviceCode("CCTV-001")
                .deviceName("Camera cảng Hải Phòng")
                .quantity(1)
                .approvalStatus(ApprovalStatus.DRAFT)
                .createdBy(CREATOR)
                .build();
    }

    private void givenStatus(ApprovalStatus status) {
        entity.setApprovalStatus(status);
        when(cctvRepository.findById(ID)).thenReturn(Optional.of(entity));
    }

    private ApprovalRequest request(String decision, String reason) {
        return ApprovalRequest.builder().decision(decision).reason(reason).build();
    }

    @Test
    void submitFromDraftGoesToPendingApproval() {
        givenStatus(ApprovalStatus.DRAFT);

        CctvResponse result = service.submit(ID, APPROVER_A);

        assertEquals(ApprovalStatus.PENDING_APPROVAL, result.getApprovalStatus());
        assertEquals(ApprovalStatus.PENDING_APPROVAL, entity.getApprovalStatus());
        // Thông tin gửi phê duyệt được ghi nhận để hiển thị tại drawer chi tiết
        assertEquals(APPROVER_A, entity.getSubmittedBy());
        assertNotNull(entity.getSubmittedDate());
    }

    @Test
    void submitFromApprovedIsRejected() {
        givenStatus(ApprovalStatus.APPROVED);

        assertThrows(IllegalStateException.class, () -> service.submit(ID, APPROVER_A));
    }

    @Test
    void approveC1MovesToApprovedLevel1() {
        givenStatus(ApprovalStatus.PENDING_APPROVAL);

        CctvResponse result = service.approveC1(ID, request("APPROVED", "Đồng ý"), APPROVER_A);

        assertEquals(ApprovalStatus.APPROVED_LEVEL1, result.getApprovalStatus());
        assertEquals(APPROVER_A, entity.getApproverLevel1());
        assertNotNull(entity.getApprovedDateLevel1());
        assertEquals("Đồng ý", entity.getApprovalContentLevel1());
    }

    @Test
    void approveC1ByCreatorIsBlocked() {
        givenStatus(ApprovalStatus.PENDING_APPROVAL);

        // Người tạo hồ sơ không được tự duyệt (BR-015 / 4-eyes).
        assertThrows(IllegalStateException.class,
                () -> service.approveC1(ID, request("APPROVED", "ok"), CREATOR));
    }

    @Test
    void rejectC1RequiresReason() {
        givenStatus(ApprovalStatus.PENDING_APPROVAL);

        assertThrows(IllegalArgumentException.class,
                () -> service.approveC1(ID, request("REJECTED", "  "), APPROVER_A));
    }

    @Test
    void rejectC1MovesToRejectedLevel1() {
        givenStatus(ApprovalStatus.PENDING_APPROVAL);

        CctvResponse result = service.approveC1(ID, request("REJECTED", "Sai số liệu kỹ thuật"), APPROVER_A);

        assertEquals(ApprovalStatus.REJECTED_LEVEL1, result.getApprovalStatus());
        assertEquals("Sai số liệu kỹ thuật", entity.getRejectionReason());
    }

    @Test
    void approveC2MovesToApproved() {
        givenStatus(ApprovalStatus.APPROVED_LEVEL1);
        entity.setApproverLevel1(APPROVER_A);

        CctvResponse result = service.approveC2(ID, request("APPROVED", "Đồng ý cấp Cục"), APPROVER_B);

        assertEquals(ApprovalStatus.APPROVED, result.getApprovalStatus());
        assertEquals(APPROVER_B, entity.getApproverLevel2());
        assertNotNull(entity.getApprovedDateLevel2());
        assertEquals("Đồng ý cấp Cục", entity.getApprovalContentLevel2());
    }

    @Test
    void approveC2ByLevel1ApproverIsBlockedFourEyes() {
        givenStatus(ApprovalStatus.APPROVED_LEVEL1);
        entity.setApproverLevel1(APPROVER_B);

        // Người duyệt C2 không được trùng người duyệt C1.
        assertThrows(IllegalStateException.class,
                () -> service.approveC2(ID, request("APPROVED", "ok"), APPROVER_B));
    }

    @Test
    void approveC2ByCreatorIsBlocked() {
        givenStatus(ApprovalStatus.APPROVED_LEVEL1);
        entity.setApproverLevel1(APPROVER_A);

        assertThrows(IllegalStateException.class,
                () -> service.approveC2(ID, request("APPROVED", "ok"), CREATOR));
    }

    @Test
    void rejectC2MovesToRejectedLevel2() {
        givenStatus(ApprovalStatus.APPROVED_LEVEL1);
        entity.setApproverLevel1(APPROVER_A);

        CctvResponse result = service.approveC2(ID, request("REJECTED", "Thiếu hồ sơ vận hành"), APPROVER_B);

        assertEquals(ApprovalStatus.REJECTED_LEVEL2, result.getApprovalStatus());
        assertEquals("Thiếu hồ sơ vận hành", entity.getRejectionReason());
    }

    @Test
    void invalidDecisionIsRejected() {
        givenStatus(ApprovalStatus.PENDING_APPROVAL);

        assertThrows(IllegalArgumentException.class,
                () -> service.approveC1(ID, request("MAYBE", null), APPROVER_A));
    }

    @Test
    void approveC1FromWrongStatusIsRejected() {
        givenStatus(ApprovalStatus.APPROVED);

        assertThrows(IllegalStateException.class,
                () -> service.approveC1(ID, request("APPROVED", "ok"), APPROVER_A));
    }
}
