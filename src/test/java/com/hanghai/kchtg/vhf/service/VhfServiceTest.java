package com.hanghai.kchtg.vhf.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.common.repository.OperatingOrganizationRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.radarstation.repository.RadarStationRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.vhf.dto.CreateVhfRequest;
import com.hanghai.kchtg.vhf.dto.UpdateVhfRequest;
import com.hanghai.kchtg.vhf.dto.VhfResponse;
import com.hanghai.kchtg.vhf.entity.Vhf;
import com.hanghai.kchtg.vhf.repository.VhfRepository;
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
import org.springframework.data.domain.PageImpl;

import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class VhfServiceTest {

    private static final UUID ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID USER_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID ORG_UNIT_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");

    @Mock
    private VhfRepository vhfRepository;
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
    private PortRepository portRepository;

    @InjectMocks
    private VhfService service;

    private Vhf entity;

    @BeforeEach
    void setUp() {
        InfrastructureApprovalService approvalService =
                new InfrastructureApprovalService(historyRepository, userRepository);
        ReflectionTestUtils.setField(service, "approvalService", approvalService);

        when(userRepository.findById(any())).thenReturn(Optional.empty());
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.all());

        User principal = mock(User.class);
        when(principal.getId()).thenReturn(USER_ID);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, "pass",
                        java.util.List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN"))));

        entity = Vhf.builder()
                .id(ID)
                .deviceCode("VHF-000001")
                .deviceName("Hệ thống VHF Hòn Dấu")
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

    private CreateVhfRequest createRequest() {
        CreateVhfRequest req = new CreateVhfRequest();
        req.setDeviceCode("VHF-000001");
        req.setDeviceName("Hệ thống VHF Hòn Dấu");
        req.setQuantity(1);
        req.setOrgUnitId(ORG_UNIT_ID);
        return req;
    }

    @Test
    void createDefaultsToDraft() {
        when(vhfRepository.existsDeviceCodeAnyState("VHF-000001")).thenReturn(false);
        when(vhfRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        VhfResponse result = service.create(createRequest());

        assertEquals(ApprovalStatus.DRAFT, result.getApprovalStatus());
    }

    @Test
    void createWithApproveActionDirectlyApprovesWithoutHistory() {
        User principal = mock(User.class);
        when(principal.getId()).thenReturn(USER_ID);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, "pass",
                        java.util.List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN"))));

        when(vhfRepository.existsDeviceCodeAnyState("VHF-000001")).thenReturn(false);
        when(vhfRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CreateVhfRequest req = createRequest();
        req.setAction("approve");

        VhfResponse result = service.create(req);

        assertEquals(ApprovalStatus.APPROVED, result.getApprovalStatus());
        assertNotNull(result.getSubmittedDate());
        assertEquals(USER_ID, result.getSubmittedBy());
        assertNotNull(result.getApprovedDateLevel2());
        assertEquals(USER_ID, result.getApproverLevel2());
        assertEquals("Lưu và phê duyệt", result.getApprovalContentLevel2());
        // Tạo mới chọn "Lưu và phê duyệt" tuyệt đối KHÔNG ghi lịch sử thay đổi hay approvalStatus ảo
        verify(historyRepository, never()).save(any());
        verify(changeHistoryService, never()).recordChanges(any(), any(), any(), any(), any());
    }

    @Test
    void createWithApproveAction_WithoutApproveC2Permission_ThrowsAccessDeniedException() {
        when(vhfRepository.existsDeviceCodeAnyState("VHF-000001")).thenReturn(false);
        when(vhfRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        User regularUser = mock(User.class);
        when(regularUser.getId()).thenReturn(USER_ID);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(regularUser, "pass",
                        java.util.List.of(new SimpleGrantedAuthority("ROLE_USER"))));

        CreateVhfRequest req = createRequest();
        req.setAction("approve");

        assertThrows(org.springframework.security.access.AccessDeniedException.class, () -> service.create(req));
    }

    @Test
    void createWithSubmitAction_AppliesRule14ViaApprovalService() {
        when(vhfRepository.existsDeviceCodeAnyState("VHF-000001")).thenReturn(false);
        when(vhfRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CreateVhfRequest req = createRequest();
        req.setAction("submit");

        VhfResponse result = service.create(req);

        // Sub-level user submit -> PENDING_APPROVAL
        assertEquals(ApprovalStatus.PENDING_APPROVAL, result.getApprovalStatus());
        assertNotNull(result.getSubmittedDate());
        assertEquals(USER_ID, result.getSubmittedBy());
    }

    @Test
    void updateApprovedRecordForcesReApproval() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        when(vhfRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(vhfRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateVhfRequest req = new UpdateVhfRequest();
        req.setId(ID);
        req.setDeviceName("VHF đổi tên");

        VhfResponse result = service.update(req);

        assertEquals(ApprovalStatus.PENDING_APPROVAL, result.getApprovalStatus());
    }

    @Test
    void updateApprovedRecordWithApproveActionRetainsApprovedAndRecordsHistory() {
        User principal = mock(User.class);
        when(principal.getId()).thenReturn(USER_ID);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, "pass",
                        java.util.List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN"))));

        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        when(vhfRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(vhfRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateVhfRequest req = new UpdateVhfRequest();
        req.setId(ID);
        req.setDeviceName("VHF đổi tên và duyệt");
        req.setApprovalStatus(ApprovalStatus.APPROVED);

        VhfResponse result = service.update(req);

        assertEquals(ApprovalStatus.APPROVED, result.getApprovalStatus());
        verify(historyRepository, atLeastOnce()).save(any());
    }

    @Test
    void updateApprovedRecord_withoutChanges_doesNotCreateEmptyFallbackHistory() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        when(vhfRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(vhfRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateVhfRequest req = new UpdateVhfRequest();
        req.setId(ID);
        req.setApprovalStatus(ApprovalStatus.APPROVED);

        VhfResponse result = service.update(req);

        assertEquals(ApprovalStatus.APPROVED, result.getApprovalStatus());
        verify(historyRepository, never()).save(any());
    }

    @Test
    void updateApprovedRecord_withSameStringWhitespaceDifference_doesNotCreateFieldHistory() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        when(vhfRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(vhfRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateVhfRequest req = new UpdateVhfRequest();
        req.setId(ID);
        req.setDeviceName("  Hệ thống VHF Hòn Dấu  ");
        req.setQuantity(1);
        req.setApprovalStatus(ApprovalStatus.APPROVED);

        VhfResponse result = service.update(req);

        assertEquals(ApprovalStatus.APPROVED, result.getApprovalStatus());
        verify(historyRepository, never()).save(argThat(h -> h != null && "Tên thiết bị".equals(h.getChangedField())));
        verify(historyRepository, never()).save(argThat(h -> h != null && h.getChangedField() == null));
    }

    @Test
    void softDeleteRecordsHistory() {
        when(vhfRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(vhfRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.softDelete(ID);

        verify(historyRepository).save(any());
    }

    @Test
    void create_withNullOrgUnitId_throwsAccessDeniedException() {
        CreateVhfRequest req = createRequest();
        req.setOrgUnitId(null);
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> service.create(req));
    }

    @Test
    void create_withForbiddenOrgUnitId_throwsAccessDeniedException() {
        UUID forbiddenOrg = UUID.randomUUID();
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.restricted(java.util.List.of(ORG_UNIT_ID)));
        CreateVhfRequest req = createRequest();
        req.setOrgUnitId(forbiddenOrg);
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> service.create(req));
    }

    @Test
    void restore_withForbiddenOrgUnitId_throwsAccessDeniedException() {
        entity.setOrgUnitId(UUID.randomUUID());
        when(vhfRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.restricted(java.util.List.of(ORG_UNIT_ID)));
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> service.restore(ID));
        verify(vhfRepository, never()).restoreVhfById(any());
    }

    @Test
    void generateDeviceCode_withExistingMax_incrementsCorrectly() {
        when(vhfRepository.findMaxDeviceCodeNumber()).thenReturn(2);
        when(vhfRepository.existsDeviceCodeAnyState("VHF-000003")).thenReturn(false);

        String code = service.generateDeviceCode();
        assertEquals("VHF-000003", code);
    }

    @Test
    void generateDeviceCode_withEmptyDatabase_generatesFirstCode() {
        when(vhfRepository.findMaxDeviceCodeNumber()).thenReturn(0);
        when(vhfRepository.existsDeviceCodeAnyState("VHF-000001")).thenReturn(false);

        String code = service.generateDeviceCode();
        assertEquals("VHF-000001", code);
    }

    @Test
    void generateDeviceCode_whenQueryThrowsException_fallsBackGracefully() {
        when(vhfRepository.findMaxDeviceCodeNumber()).thenThrow(new RuntimeException("SQL syntax error"));
        when(vhfRepository.count()).thenReturn(10L);
        when(vhfRepository.existsDeviceCodeAnyState("VHF-000011")).thenReturn(false);

        String code = service.generateDeviceCode();
        assertEquals("VHF-000011", code);
    }

    @Test
    void generateDeviceCode_whenCodeExists_skipsToNextAvailable() {
        when(vhfRepository.findMaxDeviceCodeNumber()).thenReturn(5);
        when(vhfRepository.existsDeviceCodeAnyState("VHF-000006")).thenReturn(true);
        when(vhfRepository.existsDeviceCodeAnyState("VHF-000007")).thenReturn(false);

        String code = service.generateDeviceCode();
        assertEquals("VHF-000007", code);
    }

    @Test
    void findAll_whenApprovalStatusIsNull_passesIsDeletedFalseAndNullApprovalStatus() {
        when(vhfRepository.searchVhf(
                any(), anyBoolean(), any(), anyBoolean(), any(),
                any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(java.util.List.of(entity)));

        service.findAll(0, 10, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);

        verify(vhfRepository).searchVhf(
                eq(Boolean.FALSE),
                anyBoolean(), any(), anyBoolean(), any(),
                isNull(), isNull(), isNull(), isNull(), isNull(),
                isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), any());
    }

    @Test
    void findAll_whenApprovalStatusIsArchived_passesIsDeletedTrueAndNullApprovalStatus() {
        when(vhfRepository.searchVhf(
                any(), anyBoolean(), any(), anyBoolean(), any(),
                any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(java.util.List.of(entity)));

        service.findAll(0, 10, null, null, null, null, null, null, "ARCHIVED", null, null, null, null, null, null, null, null, null);

        verify(vhfRepository).searchVhf(
                eq(Boolean.TRUE),
                anyBoolean(), any(), anyBoolean(), any(),
                isNull(), isNull(), isNull(), isNull(), isNull(),
                isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), any());
    }

    @Test
    void findAll_whenApprovalStatusIsDraft_passesIsDeletedFalseAndDraftApprovalStatus() {
        when(vhfRepository.searchVhf(
                any(), anyBoolean(), any(), anyBoolean(), any(),
                any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(java.util.List.of(entity)));

        service.findAll(0, 10, null, null, null, null, null, null, "DRAFT", null, null, null, null, null, null, null, null, null);

        verify(vhfRepository).searchVhf(
                eq(Boolean.FALSE),
                anyBoolean(), any(), anyBoolean(), any(),
                isNull(), isNull(), isNull(), isNull(), eq(ApprovalStatus.DRAFT),
                isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), any());
    }

    @Test
    void findAll_whenApprovalStatusIsAll_passesIsDeletedFalseAndNullApprovalStatus() {
        when(vhfRepository.searchVhf(
                any(), anyBoolean(), any(), anyBoolean(), any(),
                any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(java.util.List.of(entity)));

        service.findAll(0, 10, null, null, null, null, null, null, "ALL", null, null, null, null, null, null, null, null, null);

        verify(vhfRepository).searchVhf(
                eq(Boolean.FALSE),
                anyBoolean(), any(), anyBoolean(), any(),
                isNull(), isNull(), isNull(), isNull(), isNull(),
                isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), any());
    }

    @Test
    void findAll_whenDeviceCodeAndDeviceNameHaveWhitespace_trimsWhitespaceBeforeCallingRepository() {
        when(vhfRepository.searchVhf(
                any(), anyBoolean(), any(), anyBoolean(), any(),
                any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(java.util.List.of(entity)));

        service.findAll(0, 10, null, null, "  VHF-001  ", "  Trạm VHF Bạch Long Vĩ  ", null, null, null, null, null, null, null, null, null, "  keyword  ", null, null);

        verify(vhfRepository).searchVhf(
                eq(Boolean.FALSE),
                anyBoolean(), any(), anyBoolean(), any(),
                isNull(), eq("VHF-001"), eq("Trạm VHF Bạch Long Vĩ"), isNull(), isNull(),
                isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), eq("keyword"), any());
    }
}
