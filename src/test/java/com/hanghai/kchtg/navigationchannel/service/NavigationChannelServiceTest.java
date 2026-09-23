package com.hanghai.kchtg.navigationchannel.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.navigationchannel.dto.NavigationChannelCreateRequest;
import com.hanghai.kchtg.navigationchannel.dto.NavigationChannelResponse;
import com.hanghai.kchtg.navigationchannel.dto.NavigationChannelUpdateRequest;
import com.hanghai.kchtg.navigationchannel.entity.NavigationChannel;
import com.hanghai.kchtg.navigationchannel.dto.ApprovalRequest;
import com.hanghai.kchtg.navigationchannel.dto.NavigationChannelOptionResponse;
import com.hanghai.kchtg.navigationchannel.repository.NavigationChannelRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class NavigationChannelServiceTest {

    private static final UUID TEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID ORG_UNIT_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock private NavigationChannelRepository repo;
    @Mock private InfrastructureHistoryRepository approvalHistoryRepo;
    @Mock private InfrastructureApprovalService approvalService;
    @Mock private GisSpatialObjectService gisSpatialObjectService;
    @Mock private OrgUnitCacheService orgUnitCacheService;
    @Mock private OrgUnitScopeService orgUnitScopeService;
    @Mock private OrgUnitRepository orgUnitRepository;
    @Mock private InfrastructureAttachmentRepository attachmentRepository;
    @Mock private UserRepository userRepository;

    private NavigationChannelService service;
    private NavigationChannel testEntity;
    private NavigationChannelCreateRequest createReq;

    @BeforeEach
    void setUp() {
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.all());
        when(attachmentRepository.findByRefIdAndRefTypeOrderByUploadedDateDesc(any(), any())).thenReturn(Collections.emptyList());

        service = new NavigationChannelService(
                repo, approvalHistoryRepo, approvalService, gisSpatialObjectService,
                orgUnitRepository, orgUnitCacheService, orgUnitScopeService,
                attachmentRepository, userRepository);

        testEntity = NavigationChannel.builder()
                .id(TEST_ID)
                .channelName("Luong Hon Gai - Cai Lan")
                .channelCode("NC-000001")
                .approvalStatus(ApprovalStatus.DRAFT)
                .createdBy(UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .build();

        createReq = NavigationChannelCreateRequest.builder()
                .channelName("Luong Hon Gai - Cai Lan")
                .build();
    }

    @Test
    void create_shouldSaveEntity() {
        // BR-038-04: create() nay kiem tra don vi quan ly co ton tai va nam trong pham vi
        createReq.setOrgUnitId(ORG_UNIT_ID);
        when(orgUnitRepository.existsById(ORG_UNIT_ID)).thenReturn(true);
        when(repo.save(any())).thenReturn(testEntity);
        NavigationChannelResponse r = service.create(createReq, UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertThat(r).isNotNull();
        assertThat(r.getChannelName()).isEqualTo("Luong Hon Gai - Cai Lan");
        assertThat(r.getApprovalStatus()).isEqualTo(ApprovalStatus.DRAFT);
        // create() lưu 2 lần: lần đầu để lấy id, lần sau khi đã gắn các bảng con
        verify(repo, times(2)).save(any());
    }

    @Test
    void getById_shouldReturnResponse() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        NavigationChannelResponse r = service.getById(TEST_ID);
        assertThat(r).isNotNull();
        assertThat(r.getId()).isEqualTo(TEST_ID);
    }

    @Test
    void getById_notFound_shouldThrowException() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getById(TEST_ID))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void update_shouldUpdateFields() {
        NavigationChannelUpdateRequest updateReq = NavigationChannelUpdateRequest.builder()
                .channelName("Luong Cai Lan Moi")
                .build();

        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);

        NavigationChannelResponse r = service.update(TEST_ID, updateReq, UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertThat(r).isNotNull();
        verify(repo, times(1)).save(any());
    }

    @Test
    void update_whenProtectionScopeMetersCleared_shouldSetToNullAndRecordHistory() {
        testEntity.setProtectionScopeMeters(BigDecimal.valueOf(36));
        NavigationChannelUpdateRequest updateReq = NavigationChannelUpdateRequest.builder()
                .protectionScopeMeters(null)
                .build();

        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        NavigationChannelResponse r = service.update(TEST_ID, updateReq, UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertThat(r).isNotNull();
        assertThat(testEntity.getProtectionScopeMeters()).isNull();
        verify(repo).save(testEntity);

        ArgumentCaptor<InfrastructureHistory> historyCaptor = ArgumentCaptor.forClass(InfrastructureHistory.class);
        verify(approvalHistoryRepo).save(historyCaptor.capture());
        InfrastructureHistory savedHistory = historyCaptor.getValue();
        assertThat(savedHistory.getChangedField()).contains("protectionScopeMeters");
        assertThat(savedHistory.getPreviousValue()).contains("36");
    }

    @Test
    void update_approved_withoutC2Permission_shouldReject() {
        // Quy tắc 12 (approval-2-level-spec.md mục 3.9): Không có quyền approvec2 thì từ chối sửa hồ sơ Đã duyệt.
        testEntity.setApprovalStatus(ApprovalStatus.APPROVED);
        NavigationChannelUpdateRequest updateReq = NavigationChannelUpdateRequest.builder()
                .channelName("Luong Cai Lan Moi")
                .build();
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        doThrow(new org.springframework.security.access.AccessDeniedException("Bạn không có quyền phê duyệt cấp Cục"))
                .when(approvalService).requireApproveC2Permission(any(), eq("navigationchannel:approvec2"));

        assertThatThrownBy(() -> service.update(TEST_ID, updateReq, UUID.fromString("00000000-0000-0000-0000-000000000001")))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
                .hasMessage("Bạn không có quyền phê duyệt cấp Cục");
        assertThat(testEntity.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED);
        assertThat(testEntity.getChannelName()).isEqualTo("Luong Hon Gai - Cai Lan");
        verify(repo, never()).save(any());
        verify(approvalHistoryRepo, never()).save(any());
    }

    @Test
    void update_approved_withC2Permission_shouldSucceed() {
        // Quy tắc 12 (T12 - "Lưu và phê duyệt"): Có quyền approvec2 thì được sửa, giữ nguyên APPROVED và ghi history.
        testEntity.setApprovalStatus(ApprovalStatus.APPROVED);
        NavigationChannelUpdateRequest updateReq = NavigationChannelUpdateRequest.builder()
                .channelName("Luong Cai Lan Moi")
                .build();
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        NavigationChannelResponse res = service.update(TEST_ID, updateReq, UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertThat(res).isNotNull();
        assertThat(testEntity.getChannelName()).isEqualTo("Luong Cai Lan Moi");
        verify(approvalService).requireApproveC2Permission(any(), eq("navigationchannel:approvec2"));
        verify(approvalService).recordSaveAndApprove(eq(testEntity), eq(InfrastructureType.NAVIGATION_CHANNEL), any(), any());
        verify(approvalHistoryRepo).save(any());
        verify(repo).save(testEntity);
    }

    @Test
    void update_approvedLevel2_withoutC2Permission_shouldReject() {
        // Quy tắc 12: APPROVED_LEVEL2 cũng yêu cầu quyền approvec2.
        testEntity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL2);
        NavigationChannelUpdateRequest updateReq = NavigationChannelUpdateRequest.builder()
                .channelName("Luong Cai Lan Moi")
                .build();
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        doThrow(new org.springframework.security.access.AccessDeniedException("Bạn không có quyền phê duyệt cấp Cục"))
                .when(approvalService).requireApproveC2Permission(any(), eq("navigationchannel:approvec2"));

        assertThatThrownBy(() -> service.update(TEST_ID, updateReq, UUID.fromString("00000000-0000-0000-0000-000000000001")))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
                .hasMessage("Bạn không có quyền phê duyệt cấp Cục");
        assertThat(testEntity.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED_LEVEL2);
        assertThat(testEntity.getChannelName()).isEqualTo("Luong Hon Gai - Cai Lan");
        verify(repo, never()).save(any());
        verify(approvalHistoryRepo, never()).save(any());
    }

    

    @Test
    void update_rejectedWithRealChange_shouldResetToDraftAndClearWorkflow() {
        // BR-039-08: hồ sơ bị trả về (REJECTED) sửa thật → quay về Lưu tạm + xóa sạch 9 trường workflow.
        UUID updatedBy = UUID.fromString("00000000-0000-0000-0000-000000000001");
        UUID approver = UUID.fromString("00000000-0000-0000-0000-000000000009");
        testEntity.setApprovalStatus(ApprovalStatus.REJECTED);
        testEntity.setSubmittedAt(LocalDateTime.of(2026, 8, 1, 10, 0));
        testEntity.setSubmittedBy(approver);
        testEntity.setApproverLevel1(approver);
        testEntity.setApprovedDateLevel1(LocalDateTime.of(2026, 8, 2, 9, 0));
        testEntity.setApproverLevel2(approver);
        testEntity.setApprovedDateLevel2(LocalDateTime.of(2026, 8, 3, 9, 0));
        testEntity.setRejectionReason("Lý do từ chối cấp 1");
        testEntity.setLevel1ApprovalContent("Nội dung duyệt cấp 1");
        testEntity.setLevel2ApprovalContent("Nội dung duyệt cấp 2");

        NavigationChannelUpdateRequest updateReq = NavigationChannelUpdateRequest.builder()
                .channelName("Luong Cai Lan Moi")
                .build();
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);

        service.update(TEST_ID, updateReq, updatedBy);

        assertThat(testEntity.getApprovalStatus()).isEqualTo(ApprovalStatus.DRAFT);
        assertThat(testEntity.getSubmittedAt()).isNull();
        assertThat(testEntity.getSubmittedBy()).isNull();
        assertThat(testEntity.getApproverLevel1()).isNull();
        assertThat(testEntity.getApprovedDateLevel1()).isNull();
        assertThat(testEntity.getApproverLevel2()).isNull();
        assertThat(testEntity.getApprovedDateLevel2()).isNull();
        assertThat(testEntity.getRejectionReason()).isNull();
        assertThat(testEntity.getLevel1ApprovalContent()).isNull();
        assertThat(testEntity.getLevel2ApprovalContent()).isNull();
        assertThat(testEntity.getUpdatedBy()).isEqualTo(updatedBy);

        ArgumentCaptor<InfrastructureHistory> historyCaptor = ArgumentCaptor.forClass(InfrastructureHistory.class);
        verify(approvalHistoryRepo, times(1)).save(historyCaptor.capture());
        InfrastructureHistory history = historyCaptor.getValue();
        assertThat(history.getStatus()).isEqualTo(InfrastructureHistoryStatus.UPDATED);
        assertThat(history.getChangedField()).isNotBlank();
    }

    @Test
    void update_identicalPayload_shouldBeNoOp() {
        // BR-039-08: payload giống hệt giá trị đang lưu → giữ trạng thái, không history,
        // không đổi updatedAt (kể cả khi hồ sơ đang REJECTED — không reset về DRAFT).
        testEntity.setApprovalStatus(ApprovalStatus.REJECTED);
        testEntity.setUpdatedAt(LocalDateTime.of(2026, 8, 1, 10, 0));
        NavigationChannelUpdateRequest updateReq = NavigationChannelUpdateRequest.builder()
                .channelName("Luong Hon Gai - Cai Lan")
                .build();
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));

        service.update(TEST_ID, updateReq, UUID.fromString("00000000-0000-0000-0000-000000000001"));

        assertThat(testEntity.getApprovalStatus()).isEqualTo(ApprovalStatus.REJECTED);
        assertThat(testEntity.getUpdatedAt()).isEqualTo(LocalDateTime.of(2026, 8, 1, 10, 0));
        verify(repo, never()).save(any());
        verify(approvalHistoryRepo, never()).save(any());
    }

    @Test
    void update_whitespaceOnlyEdit_shouldBeNoOp() {
        // BR-039-08: payload chỉ khác khoảng trắng thừa (channelName bọc spaces) → sau trim
        // bằng giá trị đang lưu → no-op: giữ trạng thái, không history, không đổi updatedAt.
        testEntity.setApprovalStatus(ApprovalStatus.REJECTED);
        testEntity.setUpdatedAt(LocalDateTime.of(2026, 8, 1, 10, 0));
        NavigationChannelUpdateRequest updateReq = NavigationChannelUpdateRequest.builder()
                .channelName("   Luong Hon Gai - Cai Lan   ")
                .build();
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));

        service.update(TEST_ID, updateReq, UUID.fromString("00000000-0000-0000-0000-000000000001"));

        assertThat(testEntity.getApprovalStatus()).isEqualTo(ApprovalStatus.REJECTED);
        assertThat(testEntity.getChannelName()).isEqualTo("Luong Hon Gai - Cai Lan");
        assertThat(testEntity.getUpdatedAt()).isEqualTo(LocalDateTime.of(2026, 8, 1, 10, 0));
        verify(repo, never()).save(any());
        verify(approvalHistoryRepo, never()).save(any());
    }

    @Test
    void update_draftWithRealChange_shouldPartialUpdateAndSetUpdatedBy() {
        // Boundary (WO-3 case 6): DRAFT + thay đổi thật → partial update bình thường, updatedBy từ session.
        UUID updatedBy = UUID.fromString("00000000-0000-0000-0000-000000000001");
        testEntity.setApprovalStatus(ApprovalStatus.DRAFT);
        NavigationChannelUpdateRequest updateReq = NavigationChannelUpdateRequest.builder()
                .channelName("Luong Cai Lan Moi")
                .build();
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);

        service.update(TEST_ID, updateReq, updatedBy);

        assertThat(testEntity.getChannelName()).isEqualTo("Luong Cai Lan Moi");
        assertThat(testEntity.getUpdatedBy()).isEqualTo(updatedBy);
        verify(repo, times(1)).save(any());
        verify(approvalHistoryRepo, times(1)).save(any());
    }

    @Test
    void softDelete_shouldArchiveEntity() {
        // Quy tắc 11 (approval-2-level-spec.md mục 3.6): chỉ xóa được hồ sơ Lưu tạm
        testEntity.setApprovalStatus(ApprovalStatus.DRAFT);
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);

        service.softDelete(TEST_ID, UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertThat(testEntity.getDeletedAt()).isNotNull();
        assertThat(testEntity.getDeletedBy()).isNotNull();
    }

    @Test
    void softDelete_shouldDelegateGuardToSharedApprovalService() {
        // Quy tắc 11 (approval-2-level-spec.md mục 3.6): điều kiện trạng thái do
        // InfrastructureApprovalService.assertDeletable quyết định — CẤM service này tự
        // viết lại. Luật thật được kiểm ở InfrastructureApprovalServiceTest.
        // Trước đây F-040 tự kiểm và làm ngược (chỉ cho xóa `APPROVED`); đã đính chính 26/08/2026.
        testEntity.setApprovalStatus(ApprovalStatus.DRAFT);
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);

        service.softDelete(TEST_ID, UUID.fromString("00000000-0000-0000-0000-000000000001"));

        verify(approvalService, times(1)).assertDeletable(testEntity);
    }

    @Test
    void softDelete_shouldStopWhenSharedGuardRejects() {
        testEntity.setApprovalStatus(ApprovalStatus.APPROVED);
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        doThrow(new IllegalStateException("Chỉ có thể xóa hồ sơ ở trạng thái Lưu tạm"))
                .when(approvalService).assertDeletable(testEntity);

        assertThatThrownBy(() -> service.softDelete(TEST_ID, UUID.fromString("00000000-0000-0000-0000-000000000001")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Chỉ có thể xóa hồ sơ ở trạng thái Lưu tạm");
        verify(repo, never()).save(any());
        assertThat(testEntity.getDeletedAt()).isNull();
    }

    @Test
    void submitForApproval_shouldCallApprovalService() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);

        service.submit(TEST_ID, UUID.fromString("00000000-0000-0000-0000-000000000001"));
        verify(approvalService, times(1)).submit(eq(testEntity), eq(InfrastructureType.NAVIGATION_CHANNEL), any());
    }

    @Test
    void approveLevel1_shouldCallApprovalService() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);

        service.approveC1(TEST_ID,
                ApprovalRequest.builder().status("APPROVED").reason("OK").build(),
                UUID.fromString("00000000-0000-0000-0000-000000000002"));
        verify(approvalService, times(1)).approveC1(eq(testEntity), eq(InfrastructureType.NAVIGATION_CHANNEL), eq("APPROVED"), eq("OK"), any());
    }

    @Test
    void approveLevel2_shouldCallApprovalService() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);

        service.approveC2(TEST_ID,
                ApprovalRequest.builder().status("APPROVED").reason("OK C2").build(),
                UUID.fromString("00000000-0000-0000-0000-000000000003"));
        verify(approvalService, times(1)).approveC2(eq(testEntity), eq(InfrastructureType.NAVIGATION_CHANNEL), eq("APPROVED"), eq("OK C2"), any());
    }

    @Test
    void rejectLevel1_shouldCallApprovalService() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);

        service.rejectLevel1(TEST_ID,
                ApprovalRequest.builder().status("REJECTED").reason("Lý do từ chối 1").build(),
                UUID.fromString("00000000-0000-0000-0000-000000000002"));
        verify(approvalService, times(1)).approveC1(eq(testEntity), eq(InfrastructureType.NAVIGATION_CHANNEL), eq("REJECTED"), eq("Lý do từ chối 1"), any());
    }

    @Test
    void rejectLevel2_shouldCallApprovalService() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);

        service.rejectLevel2(TEST_ID,
                ApprovalRequest.builder().status("REJECTED").reason("Lý do từ chối 2").build(),
                UUID.fromString("00000000-0000-0000-0000-000000000003"));
        verify(approvalService, times(1)).approveC2(eq(testEntity), eq(InfrastructureType.NAVIGATION_CHANNEL), eq("REJECTED"), eq("Lý do từ chối 2"), any());
    }

    @Test
    void getOptions_shouldReturnAllOptions() {
        var opt = NavigationChannelOptionResponse.builder()
                .id(TEST_ID)
                .channelName("Luong Hon Gai - Cai Lan")
                .channelCode("NC-000001")
                .build();
        when(repo.findAllOptions()).thenReturn(java.util.List.of(opt));

        var result = service.getOptions();
        assertThat(result).containsExactly(opt);
        verify(repo).findAllOptions();
    }

    @Test
    void getOptions_withOrgUnitId_shouldFilterByOrgUnit() {
        var opt = NavigationChannelOptionResponse.builder()
                .id(TEST_ID)
                .channelName("Luong Hon Gai - Cai Lan")
                .channelCode("NC-000001")
                .orgUnitId(ORG_UNIT_ID)
                .build();
        when(repo.findOptionsByOrgUnitId(ORG_UNIT_ID)).thenReturn(java.util.List.of(opt));

        var result = service.getOptions(ORG_UNIT_ID);
        assertThat(result).containsExactly(opt);
        verify(repo).findOptionsByOrgUnitId(ORG_UNIT_ID);
    }
}
