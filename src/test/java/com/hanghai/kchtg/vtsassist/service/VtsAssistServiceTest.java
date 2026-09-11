package com.hanghai.kchtg.vtsassist.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.common.repository.OperatingOrganizationRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.radarstation.repository.RadarStationRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.vtsassist.dto.CreateVtsAssistRequest;
import com.hanghai.kchtg.vtsassist.dto.UpdateVtsAssistRequest;
import com.hanghai.kchtg.vtsassist.dto.VtsAssistResponse;
import com.hanghai.kchtg.vtsassist.entity.VtsAssist;
import com.hanghai.kchtg.vtsassist.repository.VtsAssistRepository;
import com.hanghai.kchtg.vtsoperationcenter.repository.VtsOperationCenterRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class VtsAssistServiceTest {

    private static final UUID ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID USER_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID ORG_UNIT_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");

    @Mock
    private VtsAssistRepository vtsAssistRepository;
    @Mock
    private OrgUnitScopeService orgUnitScopeService;
    @Mock
    private OrgUnitCacheService orgUnitCacheService;
    @Mock
    private OperatingOrganizationRepository operatingOrganizationRepository;
    @Mock
    private GisSpatialObjectService gisSpatialObjectService;
    @Mock
    private AttachmentRepository attachmentRepository;
    @Mock
    private InfrastructureHistoryRepository historyRepository;
    @Mock
    private ChangeHistoryService changeHistoryService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private VtsOperationCenterRepository vtsOperationCenterRepository;
    @Mock
    private RadarStationRepository radarStationRepository;
    @Mock
    private com.hanghai.kchtg.port.service.shared.UserResolverService userResolverService;

    @InjectMocks
    private VtsAssistService service;

    private VtsAssist entity;

    @BeforeEach
    void setUp() {
        InfrastructureApprovalService approvalService =
                new InfrastructureApprovalService(historyRepository, userRepository);
        ReflectionTestUtils.setField(service, "approvalService", approvalService);

        when(userRepository.findById(any())).thenReturn(Optional.empty());
        when(userResolverService.resolveName(any())).thenReturn("Cán bộ");
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.all());

        User principal = mock(User.class);
        when(principal.getId()).thenReturn(USER_ID);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, "pass",
                        java.util.List.of(new SimpleGrantedAuthority("ROLE_USER"))));

        entity = VtsAssist.builder()
                .id(ID)
                .deviceCode("PTVTS-000001")
                .deviceName("Hệ thống phụ trợ VTS Vũng Tàu")
                .quantity(1)
                .orgUnitId(ORG_UNIT_ID)
                .approvalStatus(ApprovalStatus.DRAFT)
                .createdBy(USER_ID)
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private CreateVtsAssistRequest createRequest() {
        CreateVtsAssistRequest req = new CreateVtsAssistRequest();
        req.setDeviceCode("PTVTS-000001");
        req.setDeviceName("Hệ thống phụ trợ VTS Vũng Tàu");
        req.setQuantity(1);
        req.setOrgUnitId(ORG_UNIT_ID);
        return req;
    }

    @Test
    void createDefaultsToDraft() {
        when(vtsAssistRepository.existsDeviceCodeAnyState("PTVTS-000001")).thenReturn(false);
        when(vtsAssistRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        VtsAssistResponse result = service.create(createRequest());

        assertEquals(ApprovalStatus.DRAFT, result.getApprovalStatus());
    }

    @Test
    void updateApprovedRecordForcesReApproval() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        when(vtsAssistRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(vtsAssistRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateVtsAssistRequest req = new UpdateVtsAssistRequest();
        req.setId(ID);
        req.setDeviceName("Phụ trợ VTS đổi tên");

        VtsAssistResponse result = service.update(req);

        assertEquals(ApprovalStatus.PENDING_APPROVAL, result.getApprovalStatus());
    }

    @Test
    void updateApprovedRecordWithApproveActionRetainsApprovedAndRecordsHistory() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        when(vtsAssistRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(vtsAssistRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateVtsAssistRequest req = new UpdateVtsAssistRequest();
        req.setId(ID);
        req.setDeviceName("Phụ trợ VTS đổi tên và duyệt");
        req.setApprovalStatus(ApprovalStatus.APPROVED);

        VtsAssistResponse result = service.update(req);

        assertEquals(ApprovalStatus.APPROVED, result.getApprovalStatus());
        verify(historyRepository, atLeastOnce()).save(any());
    }

    @Test
    void softDeleteRecordsHistory() {
        when(vtsAssistRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(vtsAssistRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.softDelete(ID);

        verify(historyRepository).save(any());
        assertNotNull(entity.getDeletedAt());
        assertEquals(USER_ID, entity.getDeletedBy());
    }

    @Test
    void getByIdDeletedEntityReturnsAudit() {
        entity.softDelete(USER_ID);
        when(vtsAssistRepository.findById(ID)).thenReturn(Optional.of(entity));

        VtsAssistResponse res = service.getById(ID);

        assertNotNull(res.getDeletedAt());
        assertEquals(USER_ID, res.getDeletedBy());
    }

    @Test
    void create_withNullOrgUnitId_throwsAccessDeniedException() {
        CreateVtsAssistRequest req = createRequest();
        req.setOrgUnitId(null);
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> service.create(req));
    }

    @Test
    void create_withForbiddenOrgUnitId_throwsAccessDeniedException() {
        UUID forbiddenOrg = UUID.randomUUID();
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.restricted(java.util.List.of(ORG_UNIT_ID)));
        CreateVtsAssistRequest req = createRequest();
        req.setOrgUnitId(forbiddenOrg);
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> service.create(req));
    }

    @Test
    void restore_withForbiddenOrgUnitId_throwsAccessDeniedException() {
        entity.setOrgUnitId(UUID.randomUUID());
        when(vtsAssistRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.restricted(java.util.List.of(ORG_UNIT_ID)));
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> service.restore(ID));
        verify(vtsAssistRepository, never()).restoreVtsAssistById(any());
    }
}