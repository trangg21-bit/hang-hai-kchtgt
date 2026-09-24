package com.hanghai.kchtg.scada.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.port.entity.Attachment;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import com.hanghai.kchtg.radarstation.repository.RadarStationRepository;
import com.hanghai.kchtg.scada.dto.CreateScadaRequest;
import com.hanghai.kchtg.scada.dto.ScadaResponse;
import com.hanghai.kchtg.scada.dto.UpdateScadaRequest;
import com.hanghai.kchtg.scada.entity.Scada;
import com.hanghai.kchtg.scada.repository.ScadaRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.vtsoperationcenter.repository.VtsOperationCenterRepository;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ScadaServiceTest {

    private static final UUID ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID USER_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID ORG_UNIT_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");

    @Mock
    private ScadaRepository scadaRepository;
    @Mock
    private OrgUnitCacheService orgUnitCacheService;
    @Mock
    private OrgUnitScopeService orgUnitScopeService;
    @Mock
    private ChangeHistoryService changeHistoryService;
    @Mock
    private UserResolverService userResolverService;
    @Mock
    private VtsOperationCenterRepository vtsOperationCenterRepository;
    @Mock
    private RadarStationRepository radarStationRepository;
    @Mock
    private AttachmentRepository attachmentRepository;
    @Mock
    private InfrastructureHistoryRepository historyRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private GisSpatialObjectService gisSpatialObjectService;

    @InjectMocks
    private ScadaService service;

    private Scada entity;
    private User principal;

    @BeforeEach
    void setUp() {
        InfrastructureApprovalService approvalService =
                new InfrastructureApprovalService(historyRepository, userRepository);
        ReflectionTestUtils.setField(service, "approvalService", approvalService);

        principal = mock(User.class);
        when(principal.getId()).thenReturn(USER_ID);
        when(principal.getAllPermissions()).thenReturn(java.util.Set.of("scada:approvec2", "scada:create", "scada:update", "*"));
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(principal));
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.all());

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, "pass",
                        java.util.List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN"))));

        entity = Scada.builder()
                .id(ID)
                .deviceCode("SCA-000001")
                .deviceName("Hệ thống SCADA Vũng Tàu")
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

    private CreateScadaRequest createRequest(String action) {
        CreateScadaRequest req = new CreateScadaRequest();
        req.setDeviceCode("SCA-000001");
        req.setDeviceName("Hệ thống SCADA Vũng Tàu");
        req.setQuantity(1);
        req.setOrgUnitId(ORG_UNIT_ID);
        req.setAction(action);
        return req;
    }

    @Test
    void createWithoutActionDefaultsToDraft() {
        when(scadaRepository.existsDeviceCodeAnyState("SCA-000001")).thenReturn(false);
        when(scadaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ScadaResponse result = service.create(createRequest(null));

        assertEquals(ApprovalStatus.DRAFT, result.getApprovalStatus());
    }

    @Test
    void createWithSubmitActionGoesToPending() {
        when(scadaRepository.existsDeviceCodeAnyState("SCA-000001")).thenReturn(false);
        when(scadaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        com.hanghai.kchtg.orgunit.entity.OrgUnit subUnit = mock(com.hanghai.kchtg.orgunit.entity.OrgUnit.class);
        when(subUnit.getRank()).thenReturn(com.hanghai.kchtg.orgunit.entity.OrgUnitRank.BRANCH);
        when(subUnit.getParentId()).thenReturn(UUID.randomUUID());
        when(subUnit.getLevel()).thenReturn(2);
        when(principal.getOrgUnit()).thenReturn(subUnit);

        ScadaResponse result = service.create(createRequest("submit"));

        assertEquals(ApprovalStatus.PENDING_APPROVAL, result.getApprovalStatus());
        assertNotNull(result.getSubmittedDate());
        assertEquals(USER_ID, result.getSubmittedBy());
    }

    @Test
    void createWithApproveAction_WithoutApproveC2Permission_ThrowsAccessDeniedException() {
        when(scadaRepository.existsDeviceCodeAnyState("SCA-000001")).thenReturn(false);
        when(scadaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        User regularUser = mock(User.class);
        when(regularUser.getId()).thenReturn(USER_ID);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(regularUser, "pass",
                        java.util.List.of(new SimpleGrantedAuthority("ROLE_USER"))));

        assertThrows(AccessDeniedException.class, () -> service.create(createRequest("approve")));
    }

    @Test
    void updateApprovedRecordForcesReApproval() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        when(scadaRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(scadaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateScadaRequest req = new UpdateScadaRequest();
        req.setId(ID);
        req.setDeviceName("SCADA đổi tên");

        ScadaResponse result = service.update(req);

        assertEquals(ApprovalStatus.PENDING_APPROVAL, result.getApprovalStatus());
    }

    @Test
    void updateApprovedRecordWithApproveActionRetainsApprovedAndRecordsHistory() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        when(scadaRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(scadaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateScadaRequest req = new UpdateScadaRequest();
        req.setId(ID);
        req.setDeviceName("SCADA đổi tên và duyệt");
        req.setApprovalStatus(ApprovalStatus.APPROVED);

        ScadaResponse result = service.update(req);

        assertEquals(ApprovalStatus.APPROVED, result.getApprovalStatus());
        verify(changeHistoryService, atLeastOnce()).recordChanges(any(), any(), any(), any(), any());
    }

    @Test
    void update_whenGeometryTypeCleared_shouldClearAllLocationFieldsAndSpatialObject() {
        UUID spatialId = UUID.randomUUID();
        UUID mapSymbolId = UUID.randomUUID();
        entity.setSpatialId(spatialId);
        entity.setMapSymbolId(mapSymbolId);
        entity.setCoordinateSystem(1);
        entity.setDisplayRule(1);
        entity.setObjectType(1);
        entity.setApprovalStatus(ApprovalStatus.DRAFT);

        GisSpatialObject mockSpatial = new GisSpatialObject();
        mockSpatial.setId(spatialId);
        mockSpatial.setGeometryType(GisGeometryType.POINT);
        mockSpatial.setCoordinates("105.123 20.456");

        when(gisSpatialObjectService.findById(spatialId)).thenReturn(Optional.of(mockSpatial));
        when(scadaRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(scadaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateScadaRequest req = new UpdateScadaRequest();
        req.setId(ID);
        req.setDeviceName("Hệ thống SCADA Vũng Tàu");
        req.setGeometryType(null);
        req.setCoordinates(null);
        req.setMapSymbolId(null);
        req.setCoordinateSystem(null);
        req.setDisplayRule(null);

        ScadaResponse result = service.update(req);

        assertNotNull(result);
        assertNull(entity.getSpatialId());
        assertNull(entity.getMapSymbolId());
        assertNull(entity.getCoordinateSystem());
        assertNull(entity.getDisplayRule());
        assertNull(entity.getObjectType());
        verify(gisSpatialObjectService).delete(spatialId);
        assertNull(result.getCoordinates());
        assertNull(result.getGeometryType());
        assertNull(result.getMapSymbolId());
    }

    @Test
    void softDeleteSetsArchivedAndDeletedAt() {
        when(scadaRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(scadaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.softDelete(ID);

        assertEquals(ApprovalStatus.ARCHIVED, entity.getApprovalStatus());
        assertNotNull(entity.getDeletedAt());
        assertEquals(USER_ID, entity.getDeletedBy());
        verify(scadaRepository).save(entity);
    }

    @Test
    void create_withNullOrgUnitId_throwsAccessDeniedException() {
        CreateScadaRequest req = createRequest(null);
        req.setOrgUnitId(null);
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> service.create(req));
    }

    @Test
    void create_withForbiddenOrgUnitId_throwsAccessDeniedException() {
        UUID forbiddenOrg = UUID.randomUUID();
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.restricted(java.util.List.of(ORG_UNIT_ID)));
        CreateScadaRequest req = createRequest(null);
        req.setOrgUnitId(forbiddenOrg);
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> service.create(req));
    }

    @Test
    void restore_withForbiddenOrgUnitId_throwsAccessDeniedException() {
        entity.setOrgUnitId(UUID.randomUUID());
        when(scadaRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.restricted(java.util.List.of(ORG_UNIT_ID)));
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> service.restore(ID));
        verify(scadaRepository, never()).restoreScadaById(any());
    }

    @Test
    void generateScadaCode_withExistingMax_incrementsCorrectly() {
        when(scadaRepository.findMaxDeviceCodeSequence()).thenReturn(Optional.of(46));
        when(scadaRepository.existsDeviceCodeAnyState("SCA-000047")).thenReturn(false);

        String code = service.generateScadaCode();
        assertEquals("SCA-000047", code);
    }

    @Test
    void generateScadaCode_withEmptyDatabase_generatesFirstCode() {
        when(scadaRepository.findMaxDeviceCodeSequence()).thenReturn(Optional.empty());
        when(scadaRepository.existsDeviceCodeAnyState("SCA-000001")).thenReturn(false);

        String code = service.generateScadaCode();
        assertEquals("SCA-000001", code);
    }

    @Test
    void generateScadaCode_whenQueryThrowsException_fallsBackGracefully() {
        when(scadaRepository.findMaxDeviceCodeSequence()).thenThrow(new RuntimeException("SQL syntax error"));
        when(scadaRepository.count()).thenReturn(10L);
        when(scadaRepository.existsDeviceCodeAnyState("SCA-000011")).thenReturn(false);

        String code = service.generateScadaCode();
        assertEquals("SCA-000011", code);
    }

    @Test
    void generateScadaCode_whenCodeExists_skipsToNextAvailable() {
        when(scadaRepository.findMaxDeviceCodeSequence()).thenReturn(Optional.of(5));
        when(scadaRepository.existsDeviceCodeAnyState("SCA-000006")).thenReturn(true);
        when(scadaRepository.existsDeviceCodeAnyState("SCA-000007")).thenReturn(false);

        String code = service.generateScadaCode();
        assertEquals("SCA-000007", code);
    }

    @Test
    void deleteAttachment_whenDraft_doesNotRecordHistory() {
        entity.setApprovalStatus(ApprovalStatus.DRAFT);
        when(scadaRepository.findById(ID)).thenReturn(Optional.of(entity));
        Attachment att = new Attachment();
        att.setId(UUID.randomUUID());
        att.setEntityId(ID);
        att.setFileName("test.pdf");
        att.setFilePath("test.pdf");
        when(attachmentRepository.findById(att.getId())).thenReturn(Optional.of(att));

        service.deleteAttachment(ID, att.getId(), USER_ID);

        verify(historyRepository, never()).save(any());
    }

    @Test
    void deleteAttachment_whenApproved_recordsHistory() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        when(scadaRepository.findById(ID)).thenReturn(Optional.of(entity));
        Attachment att = new Attachment();
        att.setId(UUID.randomUUID());
        att.setEntityId(ID);
        att.setFileName("test.pdf");
        att.setFilePath("test.pdf");
        when(attachmentRepository.findById(att.getId())).thenReturn(Optional.of(att));

        service.deleteAttachment(ID, att.getId(), USER_ID);

        verify(historyRepository, atLeastOnce()).save(any());
    }

    @Test
    void update_clearDetailedLocation_setsFieldToNullAndRecordsHistory() {
        entity.setDetailedLocation("Cảng Vũng Tàu khu A");
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        when(scadaRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(scadaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateScadaRequest req = new UpdateScadaRequest();
        req.setId(ID);
        req.setDeviceName("Hệ thống SCADA Vũng Tàu");
        req.setDetailedLocation(""); // cleared by user
        req.setApprovalStatus(ApprovalStatus.APPROVED);

        ScadaResponse result = service.update(req);

        assertNotNull(result);
        assertNull(entity.getDetailedLocation());
        verify(changeHistoryService).recordChanges(any(), any(), any(), any(), any());
    }

    @Test
    void update_clearMultipleOptionalFields_setsFieldsToNull() {
        entity.setDetailedLocation("Khu vực 1");
        entity.setManufacturer("Siemens");
        entity.setModel("S7-1200");
        entity.setSpecifications("Specs info");
        entity.setMaintenanceInformation("Maintenance info");
        entity.setNote("Ghi chú cũ");
        entity.setUnitOfMeasure(1);
        entity.setYearOfUse(2022);
        entity.setAttachedInfrastructureType(1);
        entity.setAttachedInfrastructureId(UUID.randomUUID());
        entity.setProvinceName("Bà Rịa - Vũng Tàu");
        entity.setApprovalStatus(ApprovalStatus.DRAFT);

        when(scadaRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(scadaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateScadaRequest req = new UpdateScadaRequest();
        req.setId(ID);
        req.setDeviceName("Hệ thống SCADA Vũng Tàu");
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

        ScadaResponse result = service.update(req);

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

        when(scadaRepository.searchScada(
                any(), any(Boolean.class), any(), any(Boolean.class), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(),
                pageableCaptor.capture()
        )).thenReturn(new org.springframework.data.domain.PageImpl<>(java.util.List.of()));

        service.findAll(0, 20, null, null, null, null, null, null, null, null, null, null, null, null, null, "attachedInfrastructureName", "asc");

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

        when(scadaRepository.searchScada(
                any(), any(Boolean.class), any(), any(Boolean.class), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(),
                pageableCaptor.capture()
        )).thenReturn(new org.springframework.data.domain.PageImpl<>(java.util.List.of()));

        service.findAll(0, 20, null, null, null, null, null, null, null, null, null, null, null, null, null, "operatingUnitName", "desc");

        org.springframework.data.domain.Sort sort = pageableCaptor.getValue().getSort();
        org.junit.jupiter.api.Assertions.assertNotNull(sort);
        org.springframework.data.domain.Sort.Order primaryOrder = sort.iterator().next();
        assertEquals(org.springframework.data.domain.Sort.Direction.DESC, primaryOrder.getDirection());
        assertEquals("COALESCE(LOWER(opo.name), LOWER(opu.name), '')", primaryOrder.getProperty());
    }

    @Test
    void findAll_withNullApprovalStatus_passesNullIsDeleted() {
        org.mockito.ArgumentCaptor<Boolean> isDeletedCaptor = org.mockito.ArgumentCaptor.forClass(Boolean.class);
        when(scadaRepository.searchScada(
                isDeletedCaptor.capture(), any(Boolean.class), any(), any(Boolean.class), any(),
                any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(),
                any(org.springframework.data.domain.Pageable.class)
        )).thenReturn(new org.springframework.data.domain.PageImpl<>(java.util.List.of()));

        service.findAll(0, 20, null, null, null, null, null, null, null, null, null, null, null, null, null, "updatedAt", "desc");

        assertNull(isDeletedCaptor.getValue(), "Tab Tất cả (approvalStatus == null) bắt buộc isDeleted == null để bao gồm bản ghi đã xóa");
    }

    @Test
    void findAll_withArchivedStatus_passesTrueIsDeleted() {
        org.mockito.ArgumentCaptor<Boolean> isDeletedCaptor = org.mockito.ArgumentCaptor.forClass(Boolean.class);
        when(scadaRepository.searchScada(
                isDeletedCaptor.capture(), any(Boolean.class), any(), any(Boolean.class), any(),
                any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(),
                any(org.springframework.data.domain.Pageable.class)
        )).thenReturn(new org.springframework.data.domain.PageImpl<>(java.util.List.of()));

        service.findAll(0, 20, null, null, null, null, null, "ARCHIVED", null, null, null, null, null, null, null, "updatedAt", "desc");

        assertEquals(Boolean.TRUE, isDeletedCaptor.getValue(), "Tab Đã xóa bắt buộc isDeleted == true");
    }

    @Test
    void findAll_withDraftStatus_passesFalseIsDeleted() {
        org.mockito.ArgumentCaptor<Boolean> isDeletedCaptor = org.mockito.ArgumentCaptor.forClass(Boolean.class);
        when(scadaRepository.searchScada(
                isDeletedCaptor.capture(), any(Boolean.class), any(), any(Boolean.class), any(),
                any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(),
                any(org.springframework.data.domain.Pageable.class)
        )).thenReturn(new org.springframework.data.domain.PageImpl<>(java.util.List.of()));

        service.findAll(0, 20, null, null, null, null, null, "DRAFT", null, null, null, null, null, null, null, "updatedAt", "desc");

        assertEquals(Boolean.FALSE, isDeletedCaptor.getValue(), "Tab trạng thái cụ thể bắt buộc isDeleted == false");
    }

    @Test
    void toResponse_whenEntityIsDeleted_returnsArchivedApprovalStatus() {
        entity.setDeletedAt(java.time.LocalDateTime.now());
        entity.setApprovalStatus(ApprovalStatus.APPROVED);

        ScadaResponse response = service.toResponse(entity);

        assertEquals(ApprovalStatus.ARCHIVED, response.getApprovalStatus(),
                "Bản ghi đã xóa mềm khi chuyển sang DTO bắt buộc có approvalStatus = ARCHIVED");
    }
}
