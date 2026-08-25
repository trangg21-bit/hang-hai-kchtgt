package com.hanghai.kchtg.navigationchannel.service;

import com.hanghai.kchtg.common.entity.ApprovalHistory;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.repository.ApprovalHistoryRepository;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.navigationchannel.dto.NavigationChannelCreateRequest;
import com.hanghai.kchtg.navigationchannel.dto.NavigationChannelResponse;
import com.hanghai.kchtg.navigationchannel.dto.NavigationChannelUpdateRequest;
import com.hanghai.kchtg.navigationchannel.entity.NavigationChannel;
import com.hanghai.kchtg.navigationchannel.repository.NavigationChannelRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.port.service.PortCacheService;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
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

    @Mock private NavigationChannelRepository repo;
    @Mock private ApprovalHistoryRepository approvalHistoryRepo;
    @Mock private InfrastructureApprovalService approvalService;
    @Mock private GisSpatialObjectService gisSpatialObjectService;
    @Mock private OrgUnitCacheService orgUnitCacheService;
    @Mock private OrgUnitScopeService orgUnitScopeService;
    @Mock private PortCacheService portCacheService;
    @Mock private UserResolverService userResolverService;
    @Mock private InfrastructureAttachmentRepository attachmentRepository;

    private NavigationChannelService service;
    private NavigationChannel testEntity;
    private NavigationChannelCreateRequest createReq;

    @BeforeEach
    void setUp() {
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.all());
        when(attachmentRepository.findByRefIdAndRefTypeOrderByUploadedDateDesc(any(), any())).thenReturn(Collections.emptyList());

        service = new NavigationChannelService(
                repo, approvalHistoryRepo, approvalService, gisSpatialObjectService,
                orgUnitCacheService, orgUnitScopeService, portCacheService, userResolverService, attachmentRepository);

        testEntity = NavigationChannel.builder()
                .id(TEST_ID)
                .channelName("Luong Hon Gai - Cai Lan")
                .channelCode("NC-000001")
                .status(1)
                .approvalStatus(ApprovalStatus.DRAFT)
                .createdBy(UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .build();

        createReq = NavigationChannelCreateRequest.builder()
                .channelName("Luong Hon Gai - Cai Lan")
                .status(1)
                .build();
    }

    @Test
    void create_shouldSaveEntity() {
        when(repo.save(any())).thenReturn(testEntity);
        NavigationChannelResponse r = service.create(createReq, UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertThat(r).isNotNull();
        assertThat(r.getChannelName()).isEqualTo("Luong Hon Gai - Cai Lan");
        assertThat(r.getApprovalStatus()).isEqualTo(ApprovalStatus.DRAFT);
        verify(repo, times(1)).save(any());
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
    void delete_shouldArchiveEntity() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);

        service.delete(TEST_ID, UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertThat(testEntity.getDeletedAt()).isNotNull();
        assertThat(testEntity.getApprovalStatus()).isEqualTo(ApprovalStatus.ARCHIVED);
    }

    @Test
    void submitForApproval_shouldCallApprovalService() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);

        service.submitForApproval(TEST_ID, UUID.fromString("00000000-0000-0000-0000-000000000001"));
        verify(approvalService, times(1)).submit(eq(testEntity), eq(InfrastructureType.NAVIGATION_CHANNEL), any());
    }

    @Test
    void approveLevel1_shouldCallApprovalService() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);

        service.approveLevel1(TEST_ID, UUID.fromString("00000000-0000-0000-0000-000000000002"), "OK");
        verify(approvalService, times(1)).approveC1(eq(testEntity), eq(InfrastructureType.NAVIGATION_CHANNEL), eq("APPROVED"), eq("OK"), any());
    }

    @Test
    void approveLevel2_shouldCallApprovalService() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);

        service.approveLevel2(TEST_ID, UUID.fromString("00000000-0000-0000-0000-000000000003"), "OK C2");
        verify(approvalService, times(1)).approveC2(eq(testEntity), eq(InfrastructureType.NAVIGATION_CHANNEL), eq("APPROVED"), eq("OK C2"), any());
    }

    @Test
    void rejectLevel1_shouldCallApprovalService() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);

        service.rejectLevel1(TEST_ID, UUID.fromString("00000000-0000-0000-0000-000000000002"), "Lý do từ chối 1");
        verify(approvalService, times(1)).approveC1(eq(testEntity), eq(InfrastructureType.NAVIGATION_CHANNEL), eq("REJECTED"), eq("Lý do từ chối 1"), any());
    }

    @Test
    void rejectLevel2_shouldCallApprovalService() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);

        service.rejectLevel2(TEST_ID, UUID.fromString("00000000-0000-0000-0000-000000000003"), "Lý do từ chối 2");
        verify(approvalService, times(1)).approveC2(eq(testEntity), eq(InfrastructureType.NAVIGATION_CHANNEL), eq("REJECTED"), eq("Lý do từ chối 2"), any());
    }
}
