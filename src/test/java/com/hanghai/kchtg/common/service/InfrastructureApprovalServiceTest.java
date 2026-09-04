package com.hanghai.kchtg.common.service;

import com.hanghai.kchtg.common.entity.ApprovableEntity;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.entity.OrgUnitRank;
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

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InfrastructureApprovalServiceTest {

    @Mock
    private InfrastructureHistoryRepository historyRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private InfrastructureApprovalService approvalService;

    private UUID userIdCuc;
    private UUID userIdCangVu;
    private UUID userIdC1;
    private UUID userIdC2;

    @BeforeEach
    void setUp() {
        userIdCuc = UUID.randomUUID();
        userIdCangVu = UUID.randomUUID();
        userIdC1 = UUID.randomUUID();
        userIdC2 = UUID.randomUUID();

        // Submitter Cục (level = 1)
        OrgUnit cucOrg = OrgUnit.builder()
                .name("Cục Hàng hải và Đường thủy Việt Nam")
                .level(1)
                .rank(OrgUnitRank.DEPARTMENT)
                .build();
        User cucUser = new User();
        cucUser.setId(userIdCuc);
        cucUser.setOrgUnit(cucOrg);

        // Submitter Cảng vụ (level = 2)
        OrgUnit cvOrg = OrgUnit.builder()
                .name("Cảng vụ Hàng hải Hải Phòng")
                .level(2)
                .parentId(UUID.randomUUID())
                .rank(OrgUnitRank.BRANCH)
                .build();
        User cvUser = new User();
        cvUser.setId(userIdCangVu);
        cvUser.setOrgUnit(cvOrg);

        lenient().when(userRepository.findById(userIdCuc)).thenReturn(Optional.of(cucUser));
        lenient().when(userRepository.findById(userIdCangVu)).thenReturn(Optional.of(cvUser));
    }

    private static class TestEntity implements ApprovableEntity {
        private UUID id = UUID.randomUUID();
        private ApprovalStatus status = ApprovalStatus.DRAFT;
        private String rejectionReason;
        private UUID approverL1;
        private LocalDateTime approvedDateL1;
        private UUID approverL2;
        private LocalDateTime approvedDateL2;
        private UUID createdBy;
        private UUID submittedBy;
        private LocalDateTime submittedAt;
        private String level1ApprovalContent;
        private String level2ApprovalContent;

        @Override public UUID getId() { return id; }
        @Override public ApprovalStatus getApprovalStatus() { return status; }
        @Override public void setApprovalStatus(ApprovalStatus s) { this.status = s; }
        @Override public String getRejectionReason() { return rejectionReason; }
        @Override public void setRejectionReason(String r) { this.rejectionReason = r; }
        @Override public UUID getApproverLevel1() { return approverL1; }
        @Override public void setApproverLevel1(UUID u) { this.approverL1 = u; }
        public LocalDateTime getApprovedDateLevel1() { return approvedDateL1; }
        @Override public void setApprovedDateLevel1(LocalDateTime d) { this.approvedDateL1 = d; }
        @Override public UUID getApproverLevel2() { return approverL2; }
        @Override public void setApproverLevel2(UUID u) { this.approverL2 = u; }
        public LocalDateTime getApprovedDateLevel2() { return approvedDateL2; }
        @Override public void setApprovedDateLevel2(LocalDateTime d) { this.approvedDateL2 = d; }
        @Override public UUID getCreatedBy() { return createdBy; }
        public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }
        @Override public void setSubmittedBy(UUID u) { this.submittedBy = u; }
        public UUID getSubmittedBy() { return submittedBy; }
        @Override public void setSubmittedAt(LocalDateTime d) { this.submittedAt = d; }
        public LocalDateTime getSubmittedAt() { return submittedAt; }
        @Override public void setLevel1ApprovalContent(String c) { this.level1ApprovalContent = c; }
        public String getLevel1ApprovalContent() { return level1ApprovalContent; }
        @Override public void setLevel2ApprovalContent(String c) { this.level2ApprovalContent = c; }
        public String getLevel2ApprovalContent() { return level2ApprovalContent; }
    }

    @Test
    @DisplayName("Submit từ Cảng vụ (level 2) -> Sang PENDING_APPROVAL")
    void testSubmitFromBranch() {
        TestEntity entity = new TestEntity();
        entity.setApprovalStatus(ApprovalStatus.DRAFT);

        approvalService.submit(entity, InfrastructureType.VTS_SYSTEM, userIdCangVu);

        assertThat(entity.getApprovalStatus()).isEqualTo(ApprovalStatus.PENDING_APPROVAL);
    }

    @Test
    @DisplayName("Submit từ Cục (level 1 - Rule 14) -> Bỏ qua vòng 1 sang APPROVED_LEVEL1")
    void testSubmitFromDepartment_Rule14() {
        TestEntity entity = new TestEntity();
        entity.setApprovalStatus(ApprovalStatus.DRAFT);

        approvalService.submit(entity, InfrastructureType.VTS_SYSTEM, userIdCuc);

        assertThat(entity.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED_LEVEL1);
        assertThat(entity.getApproverLevel1()).isEqualTo(userIdCuc);
        assertThat(entity.getApprovedDateLevel1()).isNotNull();
        assertThat(entity.getLevel1ApprovalContent()).isEqualTo("Cấp Cục gửi trực tiếp");
        assertThat(entity.getSubmittedBy()).isEqualTo(userIdCuc);
        assertThat(entity.getSubmittedAt()).isNotNull();
    }

    @Test
    @DisplayName("Submit lại khi bị trả về -> Đưa về vòng 1 PENDING_APPROVAL")
    void testSubmitAgainAfterReject() {
        TestEntity entity = new TestEntity();
        entity.setApprovalStatus(ApprovalStatus.REJECTED_LEVEL2);

        approvalService.submit(entity, InfrastructureType.VTS_SYSTEM, userIdCangVu);

        assertThat(entity.getApprovalStatus()).isEqualTo(ApprovalStatus.PENDING_APPROVAL);
    }

    @Test
    @DisplayName("Approve C1 thành công -> Sang APPROVED_LEVEL1")
    void testApproveC1_Success() {
        TestEntity entity = new TestEntity();
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);

        approvalService.approveC1(entity, InfrastructureType.VTS_SYSTEM, "APPROVED", "Duyệt hợp lệ", userIdC1);

        assertThat(entity.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED_LEVEL1);
        assertThat(entity.getApproverLevel1()).isEqualTo(userIdC1);
        assertThat(entity.getApprovedDateLevel1()).isNotNull();
    }

    @Test
    @DisplayName("Reject C1 thiếu lý do -> Ném ngoại lệ IllegalArgumentException")
    void testRejectC1_MissingReason() {
        TestEntity entity = new TestEntity();
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);

        assertThatThrownBy(() -> approvalService.approveC1(entity, InfrastructureType.VTS_SYSTEM, "REJECTED", "", userIdC1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Lý do từ chối là bắt buộc");
    }

    @Test
    @DisplayName("Reject C1 có lý do -> Sang REJECTED_LEVEL1")
    void testRejectC1_Success() {
        TestEntity entity = new TestEntity();
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);

        approvalService.approveC1(entity, InfrastructureType.VTS_SYSTEM, "REJECTED", "Thiếu hồ sơ thiết kế", userIdC1);

        assertThat(entity.getApprovalStatus()).isEqualTo(ApprovalStatus.REJECTED_LEVEL1);
        assertThat(entity.getRejectionReason()).isEqualTo("Thiếu hồ sơ thiết kế");
        assertThat(entity.getApproverLevel1()).isEqualTo(userIdC1);
        assertThat(entity.getApprovedDateLevel1()).isNotNull();
        assertThat(entity.getLevel1ApprovalContent()).isEqualTo("Thiếu hồ sơ thiết kế");
    }

    @Test
    @DisplayName("Approve C2 vi phạm chống tự duyệt (trùng người duyệt C1) -> Ném ngoại lệ IllegalStateException")
    void testApproveC2_ViolationFourEyes_SameApprover() {
        TestEntity entity = new TestEntity();
        entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
        entity.setApproverLevel1(userIdC1);

        assertThatThrownBy(() -> approvalService.approveC2(entity, InfrastructureType.VTS_SYSTEM, "APPROVED", "Duyệt C2", userIdC1))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Người phê duyệt cấp Cục không được trùng");
    }

    @Test
    @DisplayName("Approve C2 vi phạm chống tự duyệt (người tạo tự duyệt) -> Ném ngoại lệ IllegalStateException")
    void testApproveC2_ViolationFourEyes_CreatorSelfApprove() {
        TestEntity entity = new TestEntity();
        entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
        entity.setApproverLevel1(userIdC1);
        entity.setCreatedBy(userIdC2);

        assertThatThrownBy(() -> approvalService.approveC2(entity, InfrastructureType.VTS_SYSTEM, "APPROVED", "Duyệt C2", userIdC2))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Người tạo hồ sơ không được tự phê duyệt");
    }

    @Test
    @DisplayName("Approve C2 thành công -> Sang APPROVED")
    void testApproveC2_Success() {
        TestEntity entity = new TestEntity();
        entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
        entity.setApproverLevel1(userIdC1);

        approvalService.approveC2(entity, InfrastructureType.VTS_SYSTEM, "APPROVED", "Đã thẩm định xong", userIdC2);

        assertThat(entity.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED);
        assertThat(entity.getApproverLevel2()).isEqualTo(userIdC2);
        assertThat(entity.getApprovedDateLevel2()).isNotNull();
    }

    @Test
    @DisplayName("Reject C2 có lý do -> Sang REJECTED_LEVEL2")
    void testRejectC2_Success() {
        TestEntity entity = new TestEntity();
        entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
        entity.setApproverLevel1(userIdC1);

        approvalService.approveC2(entity, InfrastructureType.VTS_SYSTEM, "REJECTED", "Không đạt tiêu chuẩn Cục", userIdC2);

        assertThat(entity.getApprovalStatus()).isEqualTo(ApprovalStatus.REJECTED_LEVEL2);
        assertThat(entity.getRejectionReason()).isEqualTo("Không đạt tiêu chuẩn Cục");
        assertThat(entity.getApproverLevel2()).isEqualTo(userIdC2);
        assertThat(entity.getApprovedDateLevel2()).isNotNull();
        assertThat(entity.getLevel2ApprovalContent()).isEqualTo("Không đạt tiêu chuẩn Cục");
    }

    @Test
    @DisplayName("Cục gửi trực tiếp rồi phê duyệt cấp 2 thành công")
    void testCucSubmitAndApproveC2_Success() {
        TestEntity entity = new TestEntity();
        entity.setApprovalStatus(ApprovalStatus.DRAFT);

        approvalService.submit(entity, InfrastructureType.VTS_SYSTEM, userIdCuc);
        assertThat(entity.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED_LEVEL1);
        assertThat(entity.getApproverLevel1()).isEqualTo(userIdCuc);

        approvalService.approveC2(entity, InfrastructureType.VTS_SYSTEM, "APPROVED", "Duyệt cấp Cục", userIdC2);
        assertThat(entity.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED);
        assertThat(entity.getApproverLevel2()).isEqualTo(userIdC2);
        assertThat(entity.getLevel2ApprovalContent()).isEqualTo("Duyệt cấp Cục");
    }

    @Test
    @DisplayName("Xóa hồ sơ ở trạng thái DRAFT -> Sang ARCHIVED")
    void testDeleteDraft_Success() {
        TestEntity entity = new TestEntity();
        entity.setApprovalStatus(ApprovalStatus.DRAFT);

        approvalService.deleteDraft(entity, InfrastructureType.VTS_SYSTEM, userIdCangVu);

        assertThat(entity.getApprovalStatus()).isEqualTo(ApprovalStatus.ARCHIVED);
    }

    @Test
    @DisplayName("Approve C1 vi phạm chống tự duyệt (người tạo tự duyệt) -> Ném ngoại lệ IllegalStateException")
    void testApproveC1_ViolationFourEyes_CreatorSelfApprove() {
        TestEntity entity = new TestEntity();
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        entity.setCreatedBy(userIdC1);

        assertThatThrownBy(() -> approvalService.approveC1(entity, InfrastructureType.VTS_SYSTEM, "APPROVED", "Duyệt C1", userIdC1))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Bạn không thể tự phê duyệt");
    }

    @Test
    @DisplayName("Xóa hồ sơ không phải DRAFT -> Ném ngoại lệ IllegalStateException")
    void testDeleteDraft_InvalidStatus() {
        TestEntity entity = new TestEntity();
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);

        assertThatThrownBy(() -> approvalService.deleteDraft(entity, InfrastructureType.VTS_SYSTEM, userIdCangVu))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Chỉ có thể xóa hồ sơ ở trạng thái Lưu tạm");
    }

    // ── Quy tắc 11 — điều kiện xóa mềm (approval-2-level-spec.md mục 3.6) ────

    @Test
    @DisplayName("Quy tắc 11: cho xóa hồ sơ Lưu tạm")
    void testAssertDeletable_AllowsDraft() {
        TestEntity entity = new TestEntity();
        entity.setApprovalStatus(ApprovalStatus.DRAFT);

        approvalService.assertDeletable(entity);
    }

    @Test
    @DisplayName("Quy tắc 11: cấm xóa hồ sơ Đã duyệt — hồ sơ đang có hiệu lực")
    void testAssertDeletable_RejectsApproved() {
        TestEntity entity = new TestEntity();
        entity.setApprovalStatus(ApprovalStatus.APPROVED);

        assertThatThrownBy(() -> approvalService.assertDeletable(entity))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Chỉ có thể xóa hồ sơ ở trạng thái Lưu tạm");
    }

    @Test
    @DisplayName("Quy tắc 11: cấm xóa hồ sơ đang chờ Cảng vụ/Chi cục duyệt")
    void testAssertDeletable_RejectsPendingApproval() {
        TestEntity entity = new TestEntity();
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);

        assertThatThrownBy(() -> approvalService.assertDeletable(entity))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Chỉ có thể xóa hồ sơ ở trạng thái Lưu tạm");
    }

    @Test
    @DisplayName("Quy tắc 11: cấm xóa hồ sơ chờ Cục duyệt và hồ sơ bị trả về")
    void testAssertDeletable_RejectsOtherStates() {
        for (ApprovalStatus st : new ApprovalStatus[] {
                ApprovalStatus.APPROVED_LEVEL1, ApprovalStatus.REJECTED_LEVEL1,
                ApprovalStatus.REJECTED_LEVEL2, ApprovalStatus.ARCHIVED }) {
            TestEntity entity = new TestEntity();
            entity.setApprovalStatus(st);

            assertThatThrownBy(() -> approvalService.assertDeletable(entity))
                    .as("trạng thái %s phải bị từ chối xóa", st)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("Chỉ có thể xóa hồ sơ ở trạng thái Lưu tạm");
        }
    }

    @Test
    @DisplayName("Tích hợp hệ thống ngoài lưu thẳng Đã duyệt (T14)")
    void testDirectApprove_Success() {
        TestEntity entity = new TestEntity();
        entity.setApprovalStatus(ApprovalStatus.DRAFT);

        approvalService.directApprove(entity, InfrastructureType.VTS_SYSTEM, userIdCuc);

        assertThat(entity.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED);
        assertThat(entity.getApproverLevel2()).isEqualTo(userIdCuc);
        assertThat(entity.getApprovedDateLevel2()).isNotNull();
    }
}
