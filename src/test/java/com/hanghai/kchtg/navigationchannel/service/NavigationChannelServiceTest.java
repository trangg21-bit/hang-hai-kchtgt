package com.hanghai.kchtg.navigationchannel.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
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
import com.hanghai.kchtg.navigationchannel.repository.NavigationChannelRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

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
}
