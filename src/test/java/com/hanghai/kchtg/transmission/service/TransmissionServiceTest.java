package com.hanghai.kchtg.transmission.service;

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
import com.hanghai.kchtg.transmission.dto.CreateTransmissionRequest;
import com.hanghai.kchtg.transmission.dto.TransmissionResponse;
import com.hanghai.kchtg.transmission.dto.UpdateTransmissionRequest;
import com.hanghai.kchtg.transmission.entity.Transmission;
import com.hanghai.kchtg.transmission.repository.TransmissionRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
class TransmissionServiceTest {

    private static final UUID ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID USER_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID ORG_UNIT_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");

    @Mock
    private TransmissionRepository transmissionRepository;
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
    private TransmissionService service;

    private Transmission entity;

    @BeforeEach
    void setUp() {
        InfrastructureApprovalService approvalService =
                new InfrastructureApprovalService(historyRepository, userRepository);
        ReflectionTestUtils.setField(service, "approvalService", approvalService);

        User principal = mock(User.class);
        when(principal.getId()).thenReturn(USER_ID);
        when(principal.getAllPermissions()).thenReturn(java.util.Set.of("transmission:approvec2", "transmission:create", "transmission:update", "*"));
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(principal));
        when(userResolverService.resolveName(any())).thenReturn("Cán bộ");
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.all());

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, "pass",
                        java.util.List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN"))));

        entity = Transmission.builder()
                .id(ID)
                .deviceCode("TRD-000001")
                .deviceName("Hệ thống truyền dẫn Vũng Tàu")
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

    private CreateTransmissionRequest createRequest() {
        CreateTransmissionRequest req = new CreateTransmissionRequest();
        req.setDeviceCode("TRD-000001");
        req.setDeviceName("Hệ thống truyền dẫn Vũng Tàu");
        req.setQuantity(1);
        req.setOrgUnitId(ORG_UNIT_ID);
        return req;
    }

    @Test
    void createDefaultsToDraft() {
        when(transmissionRepository.existsDeviceCodeAnyState("TRD-000001")).thenReturn(false);
        when(transmissionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        TransmissionResponse result = service.create(createRequest());

        assertEquals(ApprovalStatus.DRAFT, result.getApprovalStatus());
    }

    @Test
    void createWithApproveAction_WithoutApproveC2Permission_ThrowsAccessDeniedException() {
        when(transmissionRepository.existsDeviceCodeAnyState("TRD-000001")).thenReturn(false);
        when(transmissionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        User regularUser = mock(User.class);
        when(regularUser.getId()).thenReturn(USER_ID);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(regularUser, "pass",
                        java.util.List.of(new SimpleGrantedAuthority("ROLE_USER"))));

        CreateTransmissionRequest req = createRequest();
        req.setAction("approve");
        assertThrows(AccessDeniedException.class, () -> service.create(req));
    }

    @Test
    void updateApprovedRecordForcesReApproval() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        when(transmissionRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(transmissionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateTransmissionRequest req = new UpdateTransmissionRequest();
        req.setId(ID);
        req.setDeviceName("Truyền dẫn đổi tên");

        TransmissionResponse result = service.update(req);

        assertEquals(ApprovalStatus.PENDING_APPROVAL, result.getApprovalStatus());
    }

    @Test
    void updateApprovedRecordWithApproveActionRetainsApprovedAndRecordsHistory() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        when(transmissionRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(transmissionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateTransmissionRequest req = new UpdateTransmissionRequest();
        req.setId(ID);
        req.setDeviceName("Truyền dẫn đổi tên và duyệt");
        req.setApprovalStatus(ApprovalStatus.APPROVED);

        TransmissionResponse result = service.update(req);

        assertEquals(ApprovalStatus.APPROVED, result.getApprovalStatus());
        verify(changeHistoryService, atLeastOnce()).recordChanges(any(), any(), any(), any(), any());
    }

    @Test
    void softDeleteRecordsHistory() {
        when(transmissionRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(transmissionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.softDelete(ID);

        verify(historyRepository).save(any());
    }

    @Test
    void create_withNullOrgUnitId_throwsAccessDeniedException() {
        CreateTransmissionRequest req = createRequest();
        req.setOrgUnitId(null);
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> service.create(req));
    }

    @Test
    void create_withForbiddenOrgUnitId_throwsAccessDeniedException() {
        UUID forbiddenOrg = UUID.randomUUID();
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.restricted(java.util.List.of(ORG_UNIT_ID)));
        CreateTransmissionRequest req = createRequest();
        req.setOrgUnitId(forbiddenOrg);
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> service.create(req));
    }

    @Test
    void restore_withForbiddenOrgUnitId_throwsAccessDeniedException() {
        entity.setOrgUnitId(UUID.randomUUID());
        when(transmissionRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.restricted(java.util.List.of(ORG_UNIT_ID)));
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> service.restore(ID));
        verify(transmissionRepository, never()).restoreTransmissionById(any());
    }

    @Test
    void generateTransmissionCode_withExistingMax_incrementsCorrectly() {
        when(transmissionRepository.findMaxDeviceCodeSequence()).thenReturn(Optional.of(58));
        when(transmissionRepository.existsDeviceCodeAnyState("TRD-000059")).thenReturn(false);

        String code = service.generateTransmissionCode();
        assertEquals("TRD-000059", code);
    }

    @Test
    void generateTransmissionCode_withEmptyDatabase_generatesFirstCode() {
        when(transmissionRepository.findMaxDeviceCodeSequence()).thenReturn(Optional.empty());
        when(transmissionRepository.existsDeviceCodeAnyState("TRD-000001")).thenReturn(false);

        String code = service.generateTransmissionCode();
        assertEquals("TRD-000001", code);
    }

    @Test
    void generateTransmissionCode_whenQueryThrowsException_fallsBackGracefully() {
        when(transmissionRepository.findMaxDeviceCodeSequence()).thenThrow(new RuntimeException("SQL syntax error"));
        when(transmissionRepository.count()).thenReturn(10L);
        when(transmissionRepository.existsDeviceCodeAnyState("TRD-000011")).thenReturn(false);

        String code = service.generateTransmissionCode();
        assertEquals("TRD-000011", code);
    }

    @Test
    void generateTransmissionCode_whenCodeExists_skipsToNextAvailable() {
        when(transmissionRepository.findMaxDeviceCodeSequence()).thenReturn(Optional.of(5));
        when(transmissionRepository.existsDeviceCodeAnyState("TRD-000006")).thenReturn(true);
        when(transmissionRepository.existsDeviceCodeAnyState("TRD-000007")).thenReturn(false);

        String code = service.generateTransmissionCode();
        assertEquals("TRD-000007", code);
    }

    @Test
    void updateApproved_withoutChanges_shouldNotRecordHistory() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        entity.setDeviceName("Hệ thống truyền dẫn Vũng Tàu");
        entity.setQuantity(1);
        when(transmissionRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(transmissionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateTransmissionRequest req = new UpdateTransmissionRequest();
        req.setId(ID);
        req.setDeviceName("Hệ thống truyền dẫn Vũng Tàu");
        req.setQuantity(1);
        req.setApprovalStatus(ApprovalStatus.APPROVED);

        TransmissionResponse result = service.update(req);

        assertEquals(ApprovalStatus.APPROVED, result.getApprovalStatus());
        verify(historyRepository, never()).save(any());
    }

    @Test
    void updateApproved_withWhitespaceOnlyDifference_shouldNotRecordHistory() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        entity.setDeviceName("Hệ thống truyền dẫn Vũng Tàu");
        when(transmissionRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(transmissionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateTransmissionRequest req = new UpdateTransmissionRequest();
        req.setId(ID);
        req.setDeviceName("  Hệ thống truyền dẫn Vũng Tàu  ");
        req.setApprovalStatus(ApprovalStatus.APPROVED);

        TransmissionResponse result = service.update(req);

        assertEquals(ApprovalStatus.APPROVED, result.getApprovalStatus());
        verify(historyRepository, never()).save(any());
    }

    @Test
    void deleteAttachment_onDraftEntity_shouldNotRecordHistory() {
        entity.setApprovalStatus(ApprovalStatus.DRAFT);
        when(transmissionRepository.findById(ID)).thenReturn(Optional.of(entity));
        UUID attId = UUID.randomUUID();
        com.hanghai.kchtg.port.entity.Attachment att = new com.hanghai.kchtg.port.entity.Attachment();
        att.setId(attId);
        att.setEntityType("TRANSMISSION");
        att.setEntityId(ID);
        att.setFileName("doc.pdf");
        att.setFilePath("target/test.pdf");
        when(attachmentRepository.findById(attId)).thenReturn(Optional.of(att));

        service.deleteAttachment(ID, attId, USER_ID);

        verify(attachmentRepository).delete(att);
        verify(historyRepository, never()).save(any());
    }

    @Test
    void deleteAttachment_onApprovedEntity_shouldRecordHistory() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        when(transmissionRepository.findById(ID)).thenReturn(Optional.of(entity));
        UUID attId = UUID.randomUUID();
        com.hanghai.kchtg.port.entity.Attachment att = new com.hanghai.kchtg.port.entity.Attachment();
        att.setId(attId);
        att.setEntityType("TRANSMISSION");
        att.setEntityId(ID);
        att.setFileName("doc.pdf");
        att.setFilePath("target/test.pdf");
        when(attachmentRepository.findById(attId)).thenReturn(Optional.of(att));

        service.deleteAttachment(ID, attId, USER_ID);

        verify(attachmentRepository).delete(att);
        verify(historyRepository).save(any());
    }

    @Test
    void updateDraft_clearGeometryType_clearsLocationAndSpatialObject() {
        UUID spatialId = UUID.randomUUID();
        UUID symbolId = UUID.randomUUID();
        entity.setSpatialId(spatialId);
        entity.setMapSymbolId(symbolId);
        entity.setCoordinateSystem(1);
        entity.setDisplayRule(1);
        entity.setObjectType(1);
        entity.setApprovalStatus(ApprovalStatus.DRAFT);

        when(transmissionRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(transmissionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateTransmissionRequest req = new UpdateTransmissionRequest();
        req.setId(ID);
        req.setGeometryType(null);
        req.setCoordinates(null);

        TransmissionResponse result = service.update(req);

        assertNull(result.getSpatialId());
        assertNull(result.getCoordinates());
        assertNull(result.getGeometryType());
        assertNull(result.getMapSymbolId());
        assertNull(result.getCoordinateSystem());
        assertNull(result.getDisplayRule());
        assertNull(entity.getSpatialId());
        assertNull(entity.getMapSymbolId());
        assertNull(entity.getCoordinateSystem());
        assertNull(entity.getDisplayRule());
        assertNull(entity.getObjectType());
        verify(gisSpatialObjectService).delete(spatialId);
    }

    @Test
    void updateApproved_clearGeometryType_withSaveAndApprove_clearsLocationAndRecordsHistory() {
        UUID spatialId = UUID.randomUUID();
        UUID symbolId = UUID.randomUUID();
        entity.setSpatialId(spatialId);
        entity.setMapSymbolId(symbolId);
        entity.setCoordinateSystem(1);
        entity.setDisplayRule(1);
        entity.setObjectType(1);
        entity.setApprovalStatus(ApprovalStatus.APPROVED);

        com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject oldSpatial =
                new com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject();
        oldSpatial.setId(spatialId);
        oldSpatial.setCoordinates("POINT(106.68 20.86)");
        oldSpatial.setGeometryType(com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT);

        when(transmissionRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(transmissionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(gisSpatialObjectService.findById(spatialId)).thenReturn(Optional.of(oldSpatial));

        UpdateTransmissionRequest req = new UpdateTransmissionRequest();
        req.setId(ID);
        req.setGeometryType(null);
        req.setCoordinates(null);
        req.setApprovalStatus(ApprovalStatus.APPROVED);

        TransmissionResponse result = service.update(req);

        assertEquals(ApprovalStatus.APPROVED, result.getApprovalStatus());
        assertNull(result.getSpatialId());
        assertNull(result.getCoordinates());
        assertNull(result.getGeometryType());
        assertNull(result.getMapSymbolId());
        verify(gisSpatialObjectService).delete(spatialId);
        verify(changeHistoryService).insertChangeRecord(
                org.mockito.ArgumentMatchers.eq("TRANSMISSION"),
                org.mockito.ArgumentMatchers.eq(ID),
                org.mockito.ArgumentMatchers.eq("coordinates"),
                org.mockito.ArgumentMatchers.eq("POINT(106.68 20.86)"),
                org.mockito.ArgumentMatchers.eq("Chưa có"),
                org.mockito.ArgumentMatchers.anyString());
        verify(changeHistoryService).insertChangeRecord(
                org.mockito.ArgumentMatchers.eq("TRANSMISSION"),
                org.mockito.ArgumentMatchers.eq(ID),
                org.mockito.ArgumentMatchers.eq("geometryType"),
                org.mockito.ArgumentMatchers.eq("POINT"),
                org.mockito.ArgumentMatchers.eq("Chưa có"),
                org.mockito.ArgumentMatchers.anyString());
        verify(changeHistoryService).recordChanges(any(), any(), any(), any(), any());
    }

    @Test
    void update_whenDetailedLocationCleared_setsDetailedLocationToNull() {
        entity.setDetailedLocation("Hải Phòng");
        when(transmissionRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(transmissionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateTransmissionRequest req = new UpdateTransmissionRequest();
        req.setId(ID);
        req.setDeviceName("Hệ thống truyền dẫn Vũng Tàu");
        req.setDetailedLocation(null);

        TransmissionResponse result = service.update(req);

        org.junit.jupiter.api.Assertions.assertNotNull(result);
        assertNull(entity.getDetailedLocation());
    }

    @Test
    void update_whenMultipleFieldsCleared_setsFieldsToNull() {
        entity.setDetailedLocation("Hải Phòng");
        entity.setManufacturer("Cisco");
        entity.setModel("Catalyst 9300");
        entity.setSpecifications("Specs info");
        entity.setMaintenanceInformation("Maintenance info");
        entity.setNote("Ghi chú cũ");
        entity.setUnitOfMeasure(1);
        entity.setYearOfUse(2022);
        entity.setAttachedInfrastructureType(1);
        entity.setAttachedInfrastructureId(UUID.randomUUID());
        entity.setProvinceName("Hải Phòng");
        entity.setApprovalStatus(ApprovalStatus.DRAFT);

        when(transmissionRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(transmissionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateTransmissionRequest req = new UpdateTransmissionRequest();
        req.setId(ID);
        req.setDeviceName("Hệ thống truyền dẫn Vũng Tàu");
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

        TransmissionResponse result = service.update(req);

        org.junit.jupiter.api.Assertions.assertNotNull(result);
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
}
