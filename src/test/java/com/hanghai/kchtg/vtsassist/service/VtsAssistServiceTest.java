package com.hanghai.kchtg.vtsassist.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.common.repository.OperatingOrganizationRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.port.entity.Attachment;
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

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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

        User principal = mock(User.class);
        when(principal.getId()).thenReturn(USER_ID);
        when(principal.getAllPermissions()).thenReturn(java.util.Set.of("vtsassist:approvec2", "vtsassist:create", "vtsassist:update", "*"));
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(principal));
        when(userResolverService.resolveName(any())).thenReturn("Cán bộ");
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.all());

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, "pass",
                        java.util.List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN"))));

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
        verify(changeHistoryService, atLeastOnce()).recordChanges(eq("VTS_ASSIST"), eq(ID.toString()), any(), any(), any());
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
        when(vtsAssistRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(vtsAssistRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateVtsAssistRequest req = new UpdateVtsAssistRequest();
        req.setId(ID);
        req.setDeviceName("Hệ thống phụ trợ VTS");
        req.setGeometryType(null);
        req.setCoordinates(null);
        req.setMapSymbolId(null);
        req.setCoordinateSystem(null);
        req.setDisplayRule(null);

        VtsAssistResponse result = service.update(req);

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
    void softDeleteDoesNotRecordHistory() {
        when(vtsAssistRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(vtsAssistRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.softDelete(ID);

        verify(historyRepository, never()).save(any());
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

    @Test
    void generateVtsAssistCode_withExistingMax_incrementsCorrectly() {
        when(vtsAssistRepository.findMaxDeviceCodeSequence()).thenReturn(Optional.of(163));
        when(vtsAssistRepository.existsDeviceCodeAnyState("PTVTS-000164")).thenReturn(false);

        String code = service.generateVtsAssistCode();
        assertEquals("PTVTS-000164", code);
    }

    @Test
    void generateVtsAssistCode_withEmptyDatabase_generatesFirstCode() {
        when(vtsAssistRepository.findMaxDeviceCodeSequence()).thenReturn(Optional.empty());
        when(vtsAssistRepository.existsDeviceCodeAnyState("PTVTS-000001")).thenReturn(false);

        String code = service.generateVtsAssistCode();
        assertEquals("PTVTS-000001", code);
    }

    @Test
    void generateVtsAssistCode_whenQueryThrowsException_fallsBackGracefully() {
        when(vtsAssistRepository.findMaxDeviceCodeSequence()).thenThrow(new RuntimeException("SQL syntax error"));
        when(vtsAssistRepository.count()).thenReturn(10L);
        when(vtsAssistRepository.existsDeviceCodeAnyState("PTVTS-000011")).thenReturn(false);

        String code = service.generateVtsAssistCode();
        assertEquals("PTVTS-000011", code);
    }

    @Test
    void generateVtsAssistCode_whenCodeExists_skipsToNextAvailable() {
        when(vtsAssistRepository.findMaxDeviceCodeSequence()).thenReturn(Optional.of(5));
        when(vtsAssistRepository.existsDeviceCodeAnyState("PTVTS-000006")).thenReturn(true);
        when(vtsAssistRepository.existsDeviceCodeAnyState("PTVTS-000007")).thenReturn(false);

        String code = service.generateVtsAssistCode();
        assertEquals("PTVTS-000007", code);
    }

    @Test
    void deleteAttachment_whenDraft_doesNotRecordHistory() {
        entity.setApprovalStatus(ApprovalStatus.DRAFT);
        when(vtsAssistRepository.findById(ID)).thenReturn(Optional.of(entity));
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
        when(vtsAssistRepository.findById(ID)).thenReturn(Optional.of(entity));
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
    void update_whenDetailedLocationCleared_setsDetailedLocationToNull() {
        entity.setDetailedLocation("Hải Phòng");
        when(vtsAssistRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(vtsAssistRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateVtsAssistRequest req = new UpdateVtsAssistRequest();
        req.setId(ID);
        req.setDeviceName("Hệ thống phụ trợ VTS Hải Phòng");
        req.setOperatingUnitId(UUID.randomUUID());
        req.setDetailedLocation(null);

        VtsAssistResponse result = service.update(req);

        org.junit.jupiter.api.Assertions.assertNotNull(result);
        assertNull(entity.getDetailedLocation());
    }

    @Test
    void update_whenMultipleFieldsCleared_setsFieldsToNull() {
        entity.setDetailedLocation("Hải Phòng");
        entity.setManufacturer("Schneider");
        entity.setModel("UPS Galaxy");
        entity.setSpecifications("Specs info");
        entity.setMaintenanceInformation("Maintenance info");
        entity.setNote("Ghi chú cũ");
        entity.setUnitOfMeasure(1);
        entity.setYearOfUse(2022);
        entity.setAttachedInfrastructureType(1);
        entity.setAttachedInfrastructureId(UUID.randomUUID());
        entity.setProvinceName("Hải Phòng");
        entity.setApprovalStatus(ApprovalStatus.DRAFT);

        when(vtsAssistRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(vtsAssistRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateVtsAssistRequest req = new UpdateVtsAssistRequest();
        req.setId(ID);
        req.setDeviceName("Hệ thống phụ trợ VTS Hải Phòng");
        req.setOperatingUnitId(UUID.randomUUID());
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

        VtsAssistResponse result = service.update(req);

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

    @Test
    void findAll_SortByAttachedInfrastructureName_BuildsCoalesceSort() {
        org.mockito.ArgumentCaptor<org.springframework.data.domain.Pageable> captor =
                org.mockito.ArgumentCaptor.forClass(org.springframework.data.domain.Pageable.class);
        when(vtsAssistRepository.searchVtsAssist(
                any(), any(Boolean.class), any(), any(Boolean.class), any(),
                any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), captor.capture()))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(java.util.List.of(entity)));

        service.findAll(0, 20, null, null, null, null, null, null, null, null, null, null, null, null, null, "attachedInfrastructureName", "asc");

        org.springframework.data.domain.Pageable pageable = captor.getValue();
        assertNotNull(pageable);
        org.springframework.data.domain.Sort.Order order = pageable.getSort().getOrderFor("COALESCE(LOWER(voc.name), LOWER(rs.stationName), '')");
        assertNotNull(order);
        assertEquals(org.springframework.data.domain.Sort.Direction.ASC, order.getDirection());
    }

    @Test
    void findAll_SortByOperatingUnitName_BuildsCoalesceSort() {
        org.mockito.ArgumentCaptor<org.springframework.data.domain.Pageable> captor =
                org.mockito.ArgumentCaptor.forClass(org.springframework.data.domain.Pageable.class);
        when(vtsAssistRepository.searchVtsAssist(
                any(), any(Boolean.class), any(), any(Boolean.class), any(),
                any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), captor.capture()))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(java.util.List.of(entity)));

        service.findAll(0, 20, null, null, null, null, null, null, null, null, null, null, null, null, null, "operatingUnitName", "desc");

        org.springframework.data.domain.Pageable pageable = captor.getValue();
        assertNotNull(pageable);
        org.springframework.data.domain.Sort.Order order = pageable.getSort().getOrderFor("COALESCE(LOWER(opo.name), LOWER(opu.name), '')");
        assertNotNull(order);
        assertEquals(org.springframework.data.domain.Sort.Direction.DESC, order.getDirection());
    }

    @Test
    void findAll_SortByVtsSystemName_BuildsCoalesceSort() {
        org.mockito.ArgumentCaptor<org.springframework.data.domain.Pageable> captor =
                org.mockito.ArgumentCaptor.forClass(org.springframework.data.domain.Pageable.class);
        when(vtsAssistRepository.searchVtsAssist(
                any(), any(Boolean.class), any(), any(Boolean.class), any(),
                any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), captor.capture()))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(java.util.List.of(entity)));

        service.findAll(0, 20, null, null, null, null, null, null, null, null, null, null, null, null, null, "vtsSystemName", "asc");

        org.springframework.data.domain.Pageable pageable = captor.getValue();
        assertNotNull(pageable);
        org.springframework.data.domain.Sort.Order order = pageable.getSort().getOrderFor("COALESCE(LOWER(voc.name), LOWER(rs.stationName), '')");
        assertNotNull(order);
        assertEquals(org.springframework.data.domain.Sort.Direction.ASC, order.getDirection());
    }

    @Test
    void findAll_withNullApprovalStatus_passesNullIsDeleted() {
        org.mockito.ArgumentCaptor<Boolean> isDeletedCaptor = org.mockito.ArgumentCaptor.forClass(Boolean.class);
        when(vtsAssistRepository.searchVtsAssist(
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
        when(vtsAssistRepository.searchVtsAssist(
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
        when(vtsAssistRepository.searchVtsAssist(
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

        VtsAssistResponse response = service.toResponse(entity);

        assertEquals(ApprovalStatus.ARCHIVED, response.getApprovalStatus(),
                "Bản ghi đã xóa mềm khi chuyển sang DTO bắt buộc có approvalStatus = ARCHIVED");
    }
}