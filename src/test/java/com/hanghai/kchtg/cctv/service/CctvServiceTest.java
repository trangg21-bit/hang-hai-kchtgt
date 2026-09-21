package com.hanghai.kchtg.cctv.service;

import com.hanghai.kchtg.cctv.dto.CreateCctvRequest;
import com.hanghai.kchtg.cctv.dto.CctvResponse;
import com.hanghai.kchtg.cctv.dto.UpdateCctvRequest;
import com.hanghai.kchtg.cctv.entity.Cctv;
import com.hanghai.kchtg.cctv.repository.CctvRepository;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import com.hanghai.kchtg.radarstation.repository.RadarStationRepository;
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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Business-rule tests of CctvService around the 2-level approval flow:
 * create default DRAFT, edit-lock while awaiting approval (N09/BR-019),
 * re-approval after editing APPROVED records, DRAFT-only delete (T13).
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CctvServiceTest {

    private static final UUID ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID USER_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID ORG_UNIT_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");

    @Mock
    private CctvRepository cctvRepository;
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
    private com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService gisSpatialObjectService;

    @InjectMocks
    private CctvService service;

    private Cctv entity;
    private User principal;

    @BeforeEach
    void setUp() {
        InfrastructureApprovalService approvalService =
                new InfrastructureApprovalService(historyRepository, userRepository);
        ReflectionTestUtils.setField(service, "approvalService", approvalService);

        principal = mock(User.class);
        when(principal.getId()).thenReturn(USER_ID);
        when(principal.getAllPermissions()).thenReturn(java.util.Set.of("cctv:approvec2", "cctv:create", "cctv:update", "*"));
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(principal));
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.all());

        // Constructor 3 tham số → authenticated=true để SecurityUtils.getCurrentUserId() trả USER_ID.
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, "pass",
                        java.util.List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN"))));

        entity = Cctv.builder()
                .id(ID)
                .deviceCode("CCTV-001")
                .deviceName("Camera cảng Hải Phòng")
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

    private CreateCctvRequest createRequest(String action) {
        CreateCctvRequest req = new CreateCctvRequest();
        req.setDeviceCode("CCTV-001");
        req.setDeviceName("Camera cảng Hải Phòng");
        req.setQuantity(1);
        req.setOrgUnitId(ORG_UNIT_ID);
        req.setAction(action);
        return req;
    }

    @Test
    void createWithoutActionDefaultsToDraft() {
        when(cctvRepository.existsDeviceCodeAnyState("CCTV-001")).thenReturn(false);
        when(cctvRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CctvResponse result = service.create(createRequest(null));

        assertEquals(ApprovalStatus.DRAFT, result.getApprovalStatus());
    }

    @Test
    void createWithSubmitActionGoesToPending() {
        when(cctvRepository.existsDeviceCodeAnyState("CCTV-001")).thenReturn(false);
        when(cctvRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        com.hanghai.kchtg.orgunit.entity.OrgUnit subUnit = mock(com.hanghai.kchtg.orgunit.entity.OrgUnit.class);
        when(subUnit.getRank()).thenReturn(com.hanghai.kchtg.orgunit.entity.OrgUnitRank.BRANCH);
        when(subUnit.getParentId()).thenReturn(UUID.randomUUID());
        when(subUnit.getLevel()).thenReturn(2);
        when(principal.getOrgUnit()).thenReturn(subUnit);

        CctvResponse result = service.create(createRequest("submit"));

        assertEquals(ApprovalStatus.PENDING_APPROVAL, result.getApprovalStatus());
        // "Lưu và gửi phê duyệt" khi tạo mới phải ghi nhận thông tin gửi duyệt
        assertNotNull(result.getSubmittedDate());
        assertEquals(USER_ID, result.getSubmittedBy());
    }

    @Test
    void createWithSubmitAction_DepartmentLevel_GoesToApprovedLevel1() {
        when(cctvRepository.existsDeviceCodeAnyState("CCTV-001")).thenReturn(false);
        when(cctvRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CctvResponse result = service.create(createRequest("submit"));

        assertEquals(ApprovalStatus.APPROVED_LEVEL1, result.getApprovalStatus());
        assertNotNull(result.getSubmittedDate());
        assertEquals(USER_ID, result.getSubmittedBy());
    }

    @Test
    void createWithApproveActionDirectlyApprovesWithoutHistory() {
        when(cctvRepository.existsDeviceCodeAnyState("CCTV-001")).thenReturn(false);
        when(cctvRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CctvResponse result = service.create(createRequest("approve"));

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
        when(cctvRepository.existsDeviceCodeAnyState("CCTV-001")).thenReturn(false);
        when(cctvRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

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
        when(cctvRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(cctvRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateCctvRequest req = new UpdateCctvRequest();
        req.setId(ID);
        req.setDeviceName("Camera cảng Hải Phòng (nâng cấp)");

        CctvResponse result = service.update(req);

        assertEquals(ApprovalStatus.PENDING_APPROVAL, result.getApprovalStatus());
        assertEquals(ApprovalStatus.PENDING_APPROVAL, entity.getApprovalStatus());
        // Sửa hồ sơ Đã duyệt mà KHÔNG "Lưu và phê duyệt" → về Chờ duyệt, KHÔNG ghi lịch sử
        verify(changeHistoryService, never()).recordChanges(any(), any(), any(), any(), any());
    }

    @Test
    void updatePendingRecordKeepsStatus() {
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        when(cctvRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(cctvRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateCctvRequest req = new UpdateCctvRequest();
        req.setId(ID);
        req.setDeviceName("Camera cảng Hải Phòng (sửa giữa lúc chờ duyệt)");

        CctvResponse result = service.update(req);

        // Cho phép cập nhật bất kể trạng thái: hồ sơ đang chờ duyệt giữ nguyên trạng thái.
        assertEquals(ApprovalStatus.PENDING_APPROVAL, result.getApprovalStatus());
        // Hồ sơ chưa duyệt → KHÔNG ghi nhật ký thay đổi (chỉ ghi khi đã duyệt + Lưu và phê duyệt)
        verify(changeHistoryService, never()).recordChanges(any(), any(), any(), any(), any());
    }

    @Test
    void updateApprovedLevel1RecordKeepsStatus() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
        when(cctvRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(cctvRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateCctvRequest req = new UpdateCctvRequest();
        req.setId(ID);
        req.setDeviceName("X");

        CctvResponse result = service.update(req);

        assertEquals(ApprovalStatus.APPROVED_LEVEL1, result.getApprovalStatus());
    }

    @Test
    void softDeleteOnlyFromDraft() {
        when(cctvRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(cctvRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.softDelete(ID);

        // deleteDraft chuyển sang ARCHIVED (T13) rồi soft delete.
        assertEquals(ApprovalStatus.ARCHIVED, entity.getApprovalStatus());
        verify(cctvRepository).save(entity);
    }

    @Test
    void softDeleteApprovedRecordIsBlocked() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        when(cctvRepository.findById(ID)).thenReturn(Optional.of(entity));

        assertThrows(IllegalStateException.class, () -> service.softDelete(ID));
    }

    @Test
    void updateApprovedWithSaveAndApproveKeepsApproved() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        when(cctvRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(cctvRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateCctvRequest req = new UpdateCctvRequest();
        req.setId(ID);
        req.setDeviceName("Camera cảng Hải Phòng (nâng cấp)");
        req.setApprovalStatus(ApprovalStatus.APPROVED);

        CctvResponse result = service.update(req);

        // T12 — "Lưu và phê duyệt": hồ sơ đã duyệt được sửa, giữ trạng thái Đã duyệt
        // và ghi nhận người duyệt/ngày duyệt.
        assertEquals(ApprovalStatus.APPROVED, result.getApprovalStatus());
        assertEquals(USER_ID, entity.getApproverLevel2());
        assertNotNull(entity.getApprovedDateLevel2());
        // UC-8: chỉnh sửa hồ sơ ĐÃ DUYỆT thành công → ghi nhật ký thay đổi
        verify(changeHistoryService).recordChanges(any(), any(), any(), any(), any());
    }

    @Test
    void createWithApproveActionIsApprovedWithAudit() {
        when(cctvRepository.existsDeviceCodeAnyState("CCTV-001")).thenReturn(false);
        when(cctvRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CctvResponse result = service.create(createRequest("approve"));

        // "Lưu và phê duyệt" khi tạo mới: APPROVED + ghi nhận người duyệt/ngày duyệt (T12)
        assertEquals(ApprovalStatus.APPROVED, result.getApprovalStatus());
        assertEquals(USER_ID, result.getApproverLevel2());
        assertNotNull(result.getApprovedDateLevel2());
    }

    @Test
    void updateDraftWithApprovedStatusDoesNotSelfApprove() {
        // Request approvalStatus=APPROVED trên hồ sơ Lưu tạm KHÔNG được tự phê duyệt.
        when(cctvRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(cctvRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateCctvRequest req = new UpdateCctvRequest();
        req.setId(ID);
        req.setDeviceName("X");
        req.setApprovalStatus(ApprovalStatus.APPROVED);

        CctvResponse result = service.update(req);

        assertEquals(ApprovalStatus.DRAFT, result.getApprovalStatus());
    }

    @Test
    void getById_DeletedRecordReturnsDeletedDetails() {
        UUID deleterId = UUID.fromString("33333333-3333-3333-3333-333333333333");
        java.time.LocalDateTime deletedTime = java.time.LocalDateTime.now();
        entity.setDeletedAt(deletedTime);
        entity.setDeletedBy(deleterId);

        when(cctvRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(userResolverService.resolveName(deleterId)).thenReturn("Người Xóa Test");

        CctvResponse response = service.getById(ID);

        assertNotNull(response);
        assertEquals(ID, response.getId());
        assertEquals(deleterId, response.getDeletedBy());
        assertEquals(deletedTime, response.getDeletedAt());
    }

    @Test
    void update_DeletedRecordThrowsIllegalStateException() {
        entity.setDeletedAt(java.time.LocalDateTime.now());
        entity.setDeletedBy(USER_ID);
        when(cctvRepository.findById(ID)).thenReturn(Optional.of(entity));

        UpdateCctvRequest req = new UpdateCctvRequest();
        req.setId(ID);
        req.setDeviceName("X");

        assertThrows(IllegalStateException.class, () -> service.update(req));
    }

    @Test
    void softDelete_AlreadyDeletedRecordThrowsIllegalStateException() {
        entity.setDeletedAt(java.time.LocalDateTime.now());
        entity.setDeletedBy(USER_ID);
        when(cctvRepository.findById(ID)).thenReturn(Optional.of(entity));

        assertThrows(IllegalStateException.class, () -> service.softDelete(ID));
    }

    @Test
    void create_withNullOrgUnitId_throwsAccessDeniedException() {
        CreateCctvRequest req = createRequest(null);
        req.setOrgUnitId(null);
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> service.create(req));
    }

    @Test
    void create_withForbiddenOrgUnitId_throwsAccessDeniedException() {
        UUID forbiddenOrg = UUID.randomUUID();
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.restricted(java.util.List.of(ORG_UNIT_ID)));
        CreateCctvRequest req = createRequest(null);
        req.setOrgUnitId(forbiddenOrg);
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> service.create(req));
    }

    @Test
    void restore_withForbiddenOrgUnitId_throwsAccessDeniedException() {
        entity.setOrgUnitId(UUID.randomUUID());
        when(cctvRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.restricted(java.util.List.of(ORG_UNIT_ID)));
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> service.restore(ID));
        verify(cctvRepository, never()).restoreCctvById(any());
    }

    @Test
    void generateCctvCode_withExistingMax_incrementsCorrectly() {
        when(cctvRepository.findMaxDeviceCodeSequence()).thenReturn(Optional.of(52));
        when(cctvRepository.existsDeviceCodeAnyState("CCTV-000053")).thenReturn(false);

        String code = service.generateCctvCode();
        assertEquals("CCTV-000053", code);
    }

    @Test
    void generateCctvCode_withEmptyDatabase_generatesFirstCode() {
        when(cctvRepository.findMaxDeviceCodeSequence()).thenReturn(Optional.empty());
        when(cctvRepository.existsDeviceCodeAnyState("CCTV-000001")).thenReturn(false);

        String code = service.generateCctvCode();
        assertEquals("CCTV-000001", code);
    }

    @Test
    void generateCctvCode_whenQueryThrowsException_fallsBackGracefully() {
        when(cctvRepository.findMaxDeviceCodeSequence()).thenThrow(new RuntimeException("SQL syntax error"));
        when(cctvRepository.count()).thenReturn(10L);
        when(cctvRepository.existsDeviceCodeAnyState("CCTV-000011")).thenReturn(false);

        String code = service.generateCctvCode();
        assertEquals("CCTV-000011", code);
    }

    @Test
    void generateCctvCode_whenCodeExists_skipsToNextAvailable() {
        when(cctvRepository.findMaxDeviceCodeSequence()).thenReturn(Optional.of(5));
        when(cctvRepository.existsDeviceCodeAnyState("CCTV-000006")).thenReturn(true);
        when(cctvRepository.existsDeviceCodeAnyState("CCTV-000007")).thenReturn(false);

        String code = service.generateCctvCode();
        assertEquals("CCTV-000007", code);
    }

    @Test
    void updateApproved_withoutChanges_shouldNotRecordHistory() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        entity.setDeviceName("Camera cảng Hải Phòng");
        entity.setQuantity(1);
        when(cctvRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(cctvRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateCctvRequest req = new UpdateCctvRequest();
        req.setId(ID);
        req.setDeviceName("Camera cảng Hải Phòng");
        req.setQuantity(1);
        req.setApprovalStatus(ApprovalStatus.APPROVED);

        CctvResponse result = service.update(req);

        assertEquals(ApprovalStatus.APPROVED, result.getApprovalStatus());
        verify(historyRepository, never()).save(any());
    }

    @Test
    void updateApproved_withWhitespaceOnlyDifference_shouldNotRecordHistory() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        entity.setDeviceName("Camera cảng Hải Phòng");
        when(cctvRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(cctvRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateCctvRequest req = new UpdateCctvRequest();
        req.setId(ID);
        req.setDeviceName("  Camera cảng Hải Phòng  ");
        req.setApprovalStatus(ApprovalStatus.APPROVED);

        CctvResponse result = service.update(req);

        assertEquals(ApprovalStatus.APPROVED, result.getApprovalStatus());
        verify(historyRepository, never()).save(any());
    }

    @Test
    void deleteAttachment_onDraftEntity_shouldNotRecordHistory() {
        entity.setApprovalStatus(ApprovalStatus.DRAFT);
        when(cctvRepository.findById(ID)).thenReturn(Optional.of(entity));
        UUID attId = UUID.randomUUID();
        com.hanghai.kchtg.port.entity.Attachment att = new com.hanghai.kchtg.port.entity.Attachment();
        att.setId(attId);
        att.setEntityType("CCTV");
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
        when(cctvRepository.findById(ID)).thenReturn(Optional.of(entity));
        UUID attId = UUID.randomUUID();
        com.hanghai.kchtg.port.entity.Attachment att = new com.hanghai.kchtg.port.entity.Attachment();
        att.setId(attId);
        att.setEntityType("CCTV");
        att.setEntityId(ID);
        att.setFileName("doc.pdf");
        att.setFilePath("target/test.pdf");
        when(attachmentRepository.findById(attId)).thenReturn(Optional.of(att));

        service.deleteAttachment(ID, attId, USER_ID);

        verify(attachmentRepository).delete(att);
        verify(historyRepository).save(any());
    }

    @Test
    void findAll_whenApprovalStatusNull_shouldPassIsDeletedFalse() {
        when(cctvRepository.searchCctv(
                org.mockito.ArgumentMatchers.eq(Boolean.FALSE),
                any(Boolean.class), any(), any(Boolean.class), any(),
                any(), any(), any(), org.mockito.ArgumentMatchers.isNull(), any(), any(), any(), any(), any(), any(), any(), any()
        )).thenReturn(new org.springframework.data.domain.PageImpl<>(java.util.List.of(entity)));

        org.springframework.data.domain.Page<CctvResponse> page = service.findAll(
                0, 20, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);

        assertEquals(1, page.getTotalElements());
        verify(cctvRepository).searchCctv(
                org.mockito.ArgumentMatchers.eq(Boolean.FALSE),
                any(Boolean.class), any(), any(Boolean.class), any(),
                any(), any(), any(), org.mockito.ArgumentMatchers.isNull(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void findAll_whenApprovalStatusArchived_shouldPassIsDeletedTrue() {
        when(cctvRepository.searchCctv(
                org.mockito.ArgumentMatchers.eq(Boolean.TRUE),
                any(Boolean.class), any(), any(Boolean.class), any(),
                any(), any(), any(), org.mockito.ArgumentMatchers.isNull(), any(), any(), any(), any(), any(), any(), any(), any()
        )).thenReturn(new org.springframework.data.domain.PageImpl<>(java.util.List.of()));

        org.springframework.data.domain.Page<CctvResponse> page = service.findAll(
                0, 20, null, null, null, null, null, "ARCHIVED", null, null, null, null, null, null, null, null, null);

        assertEquals(0, page.getTotalElements());
        verify(cctvRepository).searchCctv(
                org.mockito.ArgumentMatchers.eq(Boolean.TRUE),
                any(Boolean.class), any(), any(Boolean.class), any(),
                any(), any(), any(), org.mockito.ArgumentMatchers.isNull(), any(), any(), any(), any(), any(), any(), any(), any());
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

        when(cctvRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(cctvRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateCctvRequest req = new UpdateCctvRequest();
        req.setId(ID);
        req.setGeometryType(null);
        req.setCoordinates(null);

        CctvResponse result = service.update(req);

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

        when(cctvRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(cctvRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(gisSpatialObjectService.findById(spatialId)).thenReturn(Optional.of(oldSpatial));

        UpdateCctvRequest req = new UpdateCctvRequest();
        req.setId(ID);
        req.setGeometryType(null);
        req.setCoordinates(null);
        req.setApprovalStatus(ApprovalStatus.APPROVED);

        CctvResponse result = service.update(req);

        assertEquals(ApprovalStatus.APPROVED, result.getApprovalStatus());
        assertNull(result.getSpatialId());
        assertNull(result.getCoordinates());
        assertNull(result.getGeometryType());
        assertNull(result.getMapSymbolId());
        verify(gisSpatialObjectService).delete(spatialId);
        verify(changeHistoryService).insertChangeRecord(
                org.mockito.ArgumentMatchers.eq("CCTV"),
                org.mockito.ArgumentMatchers.eq(ID),
                org.mockito.ArgumentMatchers.eq("coordinates"),
                org.mockito.ArgumentMatchers.eq("POINT(106.68 20.86)"),
                org.mockito.ArgumentMatchers.eq("Chưa có"),
                org.mockito.ArgumentMatchers.anyString());
        verify(changeHistoryService).insertChangeRecord(
                org.mockito.ArgumentMatchers.eq("CCTV"),
                org.mockito.ArgumentMatchers.eq(ID),
                org.mockito.ArgumentMatchers.eq("geometryType"),
                org.mockito.ArgumentMatchers.eq("POINT"),
                org.mockito.ArgumentMatchers.eq("Chưa có"),
                org.mockito.ArgumentMatchers.anyString());
        verify(changeHistoryService).recordChanges(any(), any(), any(), any(), any());
    }

    @Test
    void update_clearDetailedLocation_setsFieldToNullAndRecordsHistory() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        entity.setDetailedLocation("Địa điểm cũ");
        when(cctvRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(cctvRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateCctvRequest req = new UpdateCctvRequest();
        req.setId(ID);
        req.setDeviceName("Camera cảng Hải Phòng");
        req.setDetailedLocation(null);
        req.setApprovalStatus(ApprovalStatus.APPROVED);

        CctvResponse result = service.update(req);

        assertNull(entity.getDetailedLocation());
        assertNull(result.getDetailedLocation());
        verify(changeHistoryService).recordChanges(any(), any(), any(), any(), any());
    }

    @Test
    void update_clearMultipleOptionalFields_setsFieldsToNull() {
        entity.setApprovalStatus(ApprovalStatus.DRAFT);
        entity.setDetailedLocation("Địa điểm cũ");
        entity.setModel("Model cũ");
        entity.setManufacturer("Hãng cũ");
        entity.setNote("Ghi chú cũ");
        entity.setSpecifications("Thông số cũ");
        when(cctvRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(cctvRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateCctvRequest req = new UpdateCctvRequest();
        req.setId(ID);
        req.setDeviceName("Camera cảng Hải Phòng");
        req.setDetailedLocation("");
        req.setModel("");
        req.setManufacturer("");
        req.setNote("");
        req.setSpecifications("");

        CctvResponse result = service.update(req);

        assertNull(entity.getDetailedLocation());
        assertNull(entity.getModel());
        assertNull(entity.getManufacturer());
        assertNull(entity.getNote());
        assertNull(entity.getSpecifications());
        assertNull(result.getDetailedLocation());
    }
}
