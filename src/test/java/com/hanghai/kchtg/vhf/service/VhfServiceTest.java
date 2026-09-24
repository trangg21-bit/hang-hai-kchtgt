package com.hanghai.kchtg.vhf.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.repository.OperatingOrganizationRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
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
import org.springframework.data.domain.PageImpl;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

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
    private User principal;

    @BeforeEach
    void setUp() {
        InfrastructureApprovalService approvalService =
                new InfrastructureApprovalService(historyRepository, userRepository);
        ReflectionTestUtils.setField(service, "approvalService", approvalService);

        principal = mock(User.class);
        when(principal.getId()).thenReturn(USER_ID);
        when(principal.getAllPermissions()).thenReturn(java.util.Set.of("vhf:approvec2", "vhf:create", "vhf:update", "*"));
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(principal));
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.all());

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
    void create_WhenDeviceCodeIsNull_AutoGeneratesDeviceCode() {
        when(vhfRepository.findMaxDeviceCodeNumber()).thenReturn(8);
        when(vhfRepository.existsDeviceCodeAnyState("VHF-000009")).thenReturn(false);
        when(vhfRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CreateVhfRequest req = createRequest();
        req.setDeviceCode(null);

        VhfResponse result = service.create(req);

        assertEquals("VHF-000009", result.getDeviceCode());
        assertEquals(ApprovalStatus.DRAFT, result.getApprovalStatus());
    }

    @Test
    void createWithApproveActionDirectlyApprovesWithoutHistory() {
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
        com.hanghai.kchtg.orgunit.entity.OrgUnit subUnit = com.hanghai.kchtg.orgunit.entity.OrgUnit.builder()
                .parentId(UUID.randomUUID())
                .level(2)
                .rank(com.hanghai.kchtg.orgunit.entity.OrgUnitRank.BRANCH)
                .build();
        when(principal.getOrgUnit()).thenReturn(subUnit);

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
        req.setDeviceName(entity.getDeviceName());
        req.setQuantity(entity.getQuantity());
        req.setOrgUnitId(entity.getOrgUnitId());
        req.setOperationalStatus(entity.getOperationalStatus());
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
    void update_whenGeometryTypeCleared_shouldClearAllLocationFieldsAndSpatialObject() {
        UUID spatialId = UUID.randomUUID();
        UUID symbolId = UUID.randomUUID();

        entity.setSpatialId(spatialId);
        entity.setMapSymbolId(symbolId);
        entity.setCoordinateSystem(1);
        entity.setDisplayRule(1);
        entity.setObjectType(1);

        GisSpatialObject spatial = new GisSpatialObject();
        spatial.setId(spatialId);
        spatial.setGeometryType(GisGeometryType.POINT);
        spatial.setCoordinates("POINT (106.7 20.8)");

        when(vhfRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(vhfRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(gisSpatialObjectService.findById(spatialId)).thenReturn(Optional.of(spatial));

        UpdateVhfRequest req = new UpdateVhfRequest();
        req.setId(ID);
        req.setDeviceName(entity.getDeviceName());
        req.setGeometryType(null);
        req.setCoordinates(null);
        req.setMapSymbolId(null);
        req.setCoordinateSystem(null);
        req.setDisplayRule(null);

        VhfResponse result = service.update(req);

        assertNull(result.getGeometryType());
        assertNull(result.getCoordinates());
        assertNull(result.getMapSymbolId());
        assertNull(result.getCoordinateSystem());
        assertNull(result.getDisplayRule());
        assertNull(result.getSpatialId());

        assertNull(entity.getSpatialId());
        assertNull(entity.getMapSymbolId());
        assertNull(entity.getCoordinateSystem());
        assertNull(entity.getDisplayRule());
        assertNull(entity.getObjectType());

        verify(gisSpatialObjectService).delete(spatialId);
        verify(vhfRepository, atLeastOnce()).save(entity);
    }

    @Test
    void softDeleteDoesNotRecordHistory() {
        when(vhfRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(vhfRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.softDelete(ID);

        verify(historyRepository, never()).save(any());
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
    void findAll_whenApprovalStatusIsNull_passesIsDeletedNullAndNullApprovalStatus() {
        when(vhfRepository.searchVhf(
                any(), anyBoolean(), any(), anyBoolean(), any(),
                any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(java.util.List.of(entity)));

        service.findAll(0, 10, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);

        verify(vhfRepository).searchVhf(
                isNull(),
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
    void findAll_whenApprovalStatusIsAll_passesIsDeletedNullAndNullApprovalStatus() {
        when(vhfRepository.searchVhf(
                any(), anyBoolean(), any(), anyBoolean(), any(),
                any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(java.util.List.of(entity)));

        service.findAll(0, 10, null, null, null, null, null, null, "ALL", null, null, null, null, null, null, null, null, null);

        verify(vhfRepository).searchVhf(
                isNull(),
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
                isNull(),
                anyBoolean(), any(), anyBoolean(), any(),
                isNull(), eq("VHF-001"), eq("Trạm VHF Bạch Long Vĩ"), isNull(), isNull(),
                isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), eq("keyword"), any());
    }

    @Test
    void update_whenDetailedLocationCleared_setsDetailedLocationToNull() {
        entity.setDetailedLocation("Hải Phòng");
        when(vhfRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(vhfRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateVhfRequest req = new UpdateVhfRequest();
        req.setId(ID);
        req.setDeviceName("Hệ thống VHF Hòn Dấu");
        req.setDetailedLocation(null);

        VhfResponse result = service.update(req);

        assertNotNull(result);
        assertNull(entity.getDetailedLocation());
    }

    @Test
    void update_whenMultipleFieldsCleared_setsFieldsToNull() {
        entity.setDetailedLocation("Hòn Dấu");
        entity.setManufacturer("Motorola");
        entity.setModel("MTR3000");
        entity.setSpecifications("Specs info");
        entity.setMaintenanceInformation("Maintenance info");
        entity.setNote("Ghi chú cũ");
        entity.setUnitOfMeasure(1);
        entity.setYearOfUse(2022);
        entity.setAttachedInfrastructureType(1);
        entity.setAttachedInfrastructureId(UUID.randomUUID());
        entity.setProvinceName("Hải Phòng");
        entity.setApprovalStatus(ApprovalStatus.DRAFT);

        when(vhfRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(vhfRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateVhfRequest req = new UpdateVhfRequest();
        req.setId(ID);
        req.setDeviceName("Hệ thống VHF Hòn Dấu");
        req.setDetailedLocation(null);
        req.setManufacturer(null);
        req.setModel(null);
        req.setSpecifications(null);
        req.setMaintenanceInformation(null);
        req.setNote(null);
        req.setUnitOfMeasure(null);
        req.setYearOfUse(null);
        req.setAttachedInfrastructureType(null);
        req.setAttachedInfrastructureId(null);
        req.setProvinceName(null);

        VhfResponse result = service.update(req);

        assertNotNull(result);
        assertNull(entity.getDetailedLocation());
        assertNull(entity.getManufacturer());
        assertNull(entity.getModel());
        assertNull(entity.getSpecifications());
        assertNull(entity.getMaintenanceInformation());
        assertNull(entity.getNote());
        assertNull(entity.getUnitOfMeasure());
        assertNull(entity.getYearOfUse());
        assertNull(entity.getAttachedInfrastructureType());
        assertNull(entity.getAttachedInfrastructureId());
        assertNull(entity.getProvinceName());
    }

    @Test
    void findAll_withSortAttachedInfrastructureName_buildsCorrectSort() {
        org.mockito.ArgumentCaptor<org.springframework.data.domain.Pageable> pageableCaptor =
                org.mockito.ArgumentCaptor.forClass(org.springframework.data.domain.Pageable.class);

        when(vhfRepository.searchVhf(
                any(), anyBoolean(), any(), anyBoolean(), any(),
                any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(), any(),
                pageableCaptor.capture()
        )).thenReturn(new org.springframework.data.domain.PageImpl<>(java.util.List.of()));

        service.findAll(0, 20, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "attachedInfrastructureName", "asc");

        org.springframework.data.domain.Sort sort = pageableCaptor.getValue().getSort();
        org.junit.jupiter.api.Assertions.assertNotNull(sort);
        org.springframework.data.domain.Sort.Order primaryOrder = sort.iterator().next();
        assertEquals(org.springframework.data.domain.Sort.Direction.ASC, primaryOrder.getDirection());
        assertEquals("COALESCE(LOWER(voc.name), LOWER(rs.stationName), '')", primaryOrder.getProperty());
    }

    @Test
    void findAll_withSortOperatingUnitName_buildsCorrectSort() {
        org.mockito.ArgumentCaptor<org.springframework.data.domain.Pageable> pageableCaptor =
                org.mockito.ArgumentCaptor.forClass(org.springframework.data.domain.Pageable.class);

        when(vhfRepository.searchVhf(
                any(), anyBoolean(), any(), anyBoolean(), any(),
                any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(), any(),
                pageableCaptor.capture()
        )).thenReturn(new org.springframework.data.domain.PageImpl<>(java.util.List.of()));

        service.findAll(0, 20, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "operatingUnitName", "desc");

        org.springframework.data.domain.Sort sort = pageableCaptor.getValue().getSort();
        org.junit.jupiter.api.Assertions.assertNotNull(sort);
        org.springframework.data.domain.Sort.Order primaryOrder = sort.iterator().next();
        assertEquals(org.springframework.data.domain.Sort.Direction.DESC, primaryOrder.getDirection());
        assertEquals("COALESCE(LOWER(opo.name), LOWER(opu.name), '')", primaryOrder.getProperty());
    }

    @Test
    void findAll_withNullApprovalStatus_passesNullIsDeleted() {
        org.mockito.ArgumentCaptor<Boolean> isDeletedCaptor = org.mockito.ArgumentCaptor.forClass(Boolean.class);
        when(vhfRepository.searchVhf(
                isDeletedCaptor.capture(), anyBoolean(), any(), anyBoolean(), any(),
                any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(), any(),
                any(org.springframework.data.domain.Pageable.class)
        )).thenReturn(new org.springframework.data.domain.PageImpl<>(java.util.List.of()));

        service.findAll(0, 20, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "updatedAt", "desc");

        assertNull(isDeletedCaptor.getValue(), "Tab Tất cả (approvalStatus == null) bắt buộc isDeleted == null để bao gồm bản ghi đã xóa");
    }

    @Test
    void findAll_withArchivedStatus_passesTrueIsDeleted() {
        org.mockito.ArgumentCaptor<Boolean> isDeletedCaptor = org.mockito.ArgumentCaptor.forClass(Boolean.class);
        when(vhfRepository.searchVhf(
                isDeletedCaptor.capture(), anyBoolean(), any(), anyBoolean(), any(),
                any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(), any(),
                any(org.springframework.data.domain.Pageable.class)
        )).thenReturn(new org.springframework.data.domain.PageImpl<>(java.util.List.of()));

        service.findAll(0, 20, null, null, null, null, null, null, "ARCHIVED", null, null, null, null, null, null, null, "updatedAt", "desc");

        assertEquals(Boolean.TRUE, isDeletedCaptor.getValue(), "Tab Đã xóa bắt buộc isDeleted == true");
    }

    @Test
    void findAll_withDraftStatus_passesFalseIsDeleted() {
        org.mockito.ArgumentCaptor<Boolean> isDeletedCaptor = org.mockito.ArgumentCaptor.forClass(Boolean.class);
        when(vhfRepository.searchVhf(
                isDeletedCaptor.capture(), anyBoolean(), any(), anyBoolean(), any(),
                any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(), any(),
                any(org.springframework.data.domain.Pageable.class)
        )).thenReturn(new org.springframework.data.domain.PageImpl<>(java.util.List.of()));

        service.findAll(0, 20, null, null, null, null, null, null, "DRAFT", null, null, null, null, null, null, null, "updatedAt", "desc");

        assertEquals(Boolean.FALSE, isDeletedCaptor.getValue(), "Tab trạng thái cụ thể bắt buộc isDeleted == false");
    }

    @Test
    void toResponse_whenEntityIsDeleted_returnsArchivedApprovalStatus() {
        entity.setDeletedAt(java.time.LocalDateTime.now());
        entity.setApprovalStatus(ApprovalStatus.APPROVED);

        VhfResponse response = service.toResponse(entity);

        assertEquals(ApprovalStatus.ARCHIVED, response.getApprovalStatus(),
                "Bản ghi đã xóa mềm khi chuyển sang DTO bắt buộc có approvalStatus = ARCHIVED");
    }
}
