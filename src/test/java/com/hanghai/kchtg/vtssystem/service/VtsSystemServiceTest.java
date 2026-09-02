package com.hanghai.kchtg.vtssystem.service;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;

import com.hanghai.kchtg.vtssystem.dto.*;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.vtssystem.entity.VtsSystem;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.port.service.PortCacheService;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.vtssystem.repository.VtsSystemRepository;
import com.hanghai.kchtg.vtssystem.repository.VtsZoneRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class VtsSystemServiceTest {

    private static final UUID TEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID TEST_ID_2 = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock
    private VtsSystemRepository repository;

    @Mock
    private InfrastructureHistoryRepository historyRepository;

    @Mock
    private InfrastructureAttachmentRepository attachmentRepository;

    @Mock
    private OrgUnitCacheService orgUnitCacheService;

    @Mock
    private PortCacheService portCacheService;

    @Mock
    private com.hanghai.kchtg.user.repository.UserRepository userRepository;

    @Mock
    private VtsZoneRepository zoneRepository;

    private com.hanghai.kchtg.common.service.InfrastructureApprovalService approvalService;

    @InjectMocks
    private VtsSystemService service;

    private VtsSystem entity;
    private VtsSystemCreateRequest createRequest;

    @BeforeEach
    void setUp() {
        approvalService = new com.hanghai.kchtg.common.service.InfrastructureApprovalService(historyRepository, userRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(service, "approvalService", approvalService);

        entity = VtsSystem.builder()
                .systemName("VTS ABC")
                .code("VTS-OLD")
                .orgUnitId(UUID.fromString("00000000-0000-0000-0000-000000000010"))
                .approvalStatus(ApprovalStatus.PENDING_APPROVAL)
                .build();
        entity.setId(TEST_ID);

        createRequest = VtsSystemCreateRequest.builder()
                .systemName("VTS ABC")
                .code("VTS-ABC")
                .conditionStatus(com.hanghai.kchtg.vtssystem.entity.ConditionStatus.OPERATIONAL)
                .orgUnitId(UUID.fromString("00000000-0000-0000-0000-000000000010"))
                .owningOrgId(UUID.fromString("00000000-0000-0000-0000-000000000011"))
                .operatingOrgId(UUID.fromString("00000000-0000-0000-0000-000000000012"))
                .provinceId(1)
                .build();
    }

    @Test
    void testCreate() {
        VtsSystem saved = VtsSystem.builder()
                .systemName("VTS ABC").approvalStatus(ApprovalStatus.PROPOSED)
                .build();
        saved.setId(TEST_ID);

        when(repository.save(any())).thenReturn(saved);

        VtsSystemResponse response = service.create(createRequest, java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertNotNull(response);
        assertEquals(ApprovalStatus.PROPOSED, response.getApprovalStatus());
        assertNotNull(response.getZones());
        assertTrue(response.getZones().isEmpty());
        assertNotNull(response.getAttachments());
        assertTrue(response.getAttachments().isEmpty());
        verify(repository).existsByCode("VTS-ABC");
        verify(repository, times(1)).save(any());
    }

    @Test
    void testCreate_WithZones_DoesNotPreAssignZoneIds() {
        VtsZoneDto zoneDto = VtsZoneDto.builder()
                .code("ZONE_1")
                .name("Vùng 1")
                .build();

        VtsSystemCreateRequest reqWithZones = VtsSystemCreateRequest.builder()
                .systemName("VTS Zone Test")
                .code("VTS-ZONE")
                .conditionStatus(com.hanghai.kchtg.vtssystem.entity.ConditionStatus.OPERATIONAL)
                .orgUnitId(UUID.fromString("00000000-0000-0000-0000-000000000010"))
                .owningOrgId(UUID.fromString("00000000-0000-0000-0000-000000000011"))
                .operatingOrgId(UUID.fromString("00000000-0000-0000-0000-000000000012"))
                .provinceId(1)
                .zones(List.of(zoneDto))
                .build();

        when(repository.save(any())).thenAnswer(invocation -> {
            VtsSystem passedEntity = invocation.getArgument(0);
            assertNotNull(passedEntity.getZones());
            assertEquals(1, passedEntity.getZones().size());
            assertNull(passedEntity.getZones().get(0).getId());
            passedEntity.setId(TEST_ID);
            return passedEntity;
        });

        VtsSystemResponse res = service.create(reqWithZones, UUID.randomUUID());
        assertNotNull(res);
        verify(repository, times(1)).save(any());
    }

    @Test
    void testCreate_RejectsMissingRequiredFieldsBeforePersistence() {
        VtsSystemCreateRequest invalidRequest = VtsSystemCreateRequest.builder()
                .systemName("VTS thiếu dữ liệu")
                .code("VTS-MISSING")
                .build();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> service.create(invalidRequest, UUID.randomUUID()));

        assertEquals("Đơn vị quản lý không được để trống", exception.getMessage());
        verify(repository, never()).existsByCode(anyString());
        verify(repository, never()).save(any());
        verify(historyRepository, never()).save(any());
    }

    @Test
    void testGetById() {
        UUID managingUnitId = entity.getOrgUnitId();
        UUID owningUnitId = UUID.fromString("00000000-0000-0000-0000-000000000011");
        UUID operatingUnitId = UUID.fromString("00000000-0000-0000-0000-000000000012");
        entity.setOwningOrgId(owningUnitId);
        entity.setOperatingOrgId(operatingUnitId);
        when(orgUnitCacheService.getName(managingUnitId)).thenReturn("Đơn vị quản lý");
        when(orgUnitCacheService.getName(owningUnitId)).thenReturn("Đơn vị chủ quản");
        when(orgUnitCacheService.getName(operatingUnitId)).thenReturn("Đơn vị vận hành");
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        VtsSystemResponse response = service.getById(TEST_ID);
        assertNotNull(response);
        assertEquals(TEST_ID, response.getId());
        assertEquals("Đơn vị quản lý", response.getOrgUnitName());
        assertEquals("Đơn vị chủ quản", response.getOwningOrgName());
        assertEquals("Đơn vị vận hành", response.getOperatingOrgName());
    }

    @Test
    void testGetById_NotFound() {
        when(repository.findById(TEST_ID_2)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.getById(TEST_ID_2));
    }

    @Test
    void testUpdate() {
        // Quy tắc 12: chỉ hồ sơ Lưu tạm/Bị trả về mới sửa được — bản mẫu mặc định đang Chờ duyệt
        entity.setApprovalStatus(ApprovalStatus.DRAFT);
        VtsSystemUpdateRequest updateReq = VtsSystemUpdateRequest.builder()
                .systemName("VTS mới").build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);

        VtsSystemResponse response = service.update(TEST_ID, updateReq, java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertNotNull(response);
        assertEquals(ApprovalStatus.DRAFT, entity.getApprovalStatus());
        assertNull(entity.getApproverLevel1());
        assertNull(entity.getApproverLevel2());
        verify(repository, times(1)).save(any());
    }

    @Test
    void testCreate_RejectsDuplicateCode() {
        when(repository.existsByCode("VTS-ABC")).thenReturn(true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> service.create(createRequest, UUID.randomUUID()));

        assertEquals("Mã hệ thống VTS đã tồn tại trong hệ thống", exception.getMessage());
        verify(repository, never()).save(any());
    }

    @Test
    void testUpdate_RejectsWhenAwaitingLevel1Approval() {
        // Quy tắc 12: hồ sơ Chờ Cảng vụ/Chi cục duyệt bị khóa sửa
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        VtsSystemUpdateRequest updateReq = VtsSystemUpdateRequest.builder()
                .systemName("VTS sửa trộm").build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));

        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> service.update(TEST_ID, updateReq, UUID.randomUUID()));

        assertEquals("Không thể sửa hồ sơ đang trong quy trình phê duyệt", exception.getMessage());
        verify(repository, never()).save(any());
    }

    @Test
    void testUpdate_RejectsWhenAwaitingLevel2Approval() {
        // Quy tắc 12: hồ sơ Chờ Cục duyệt cũng bị khóa sửa
        entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
        VtsSystemUpdateRequest updateReq = VtsSystemUpdateRequest.builder()
                .systemName("VTS sửa trộm").build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));

        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> service.update(TEST_ID, updateReq, UUID.randomUUID()));

        assertEquals("Không thể sửa hồ sơ đang trong quy trình phê duyệt", exception.getMessage());
        verify(repository, never()).save(any());
    }

    @Test
    void testUpdate_AllowsWhenRejectedAtLevel1() {
        // Quy tắc 12: hồ sơ bị trả về BẮT BUỘC sửa được, nếu không quy trình sẽ tắc
        entity.setApprovalStatus(ApprovalStatus.REJECTED_LEVEL1);
        VtsSystemUpdateRequest updateReq = VtsSystemUpdateRequest.builder()
                .systemName("VTS đã sửa theo góp ý").build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);

        VtsSystemResponse response = service.update(TEST_ID, updateReq, UUID.randomUUID());

        assertNotNull(response);
        assertEquals("VTS đã sửa theo góp ý", entity.getSystemName());
    }

    @Test
    void testUpdate_RejectsWhenArchived() {
        // Quy tắc 12: hồ sơ đã xóa mềm không sửa được
        entity.setApprovalStatus(ApprovalStatus.ARCHIVED);
        VtsSystemUpdateRequest updateReq = VtsSystemUpdateRequest.builder()
                .systemName("VTS đã xóa").build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));

        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> service.update(TEST_ID, updateReq, UUID.randomUUID()));

        assertEquals("Không thể sửa hồ sơ đã xóa", exception.getMessage());
        verify(repository, never()).save(any());
    }

    @Test
    void testUpdate_RejectsChangingImmutableCode() {
        // Quy tắc 12: chỉ hồ sơ Lưu tạm/Bị trả về mới sửa được — bản mẫu mặc định đang Chờ duyệt
        entity.setApprovalStatus(ApprovalStatus.DRAFT);
        VtsSystemUpdateRequest updateReq = VtsSystemUpdateRequest.builder()
                .code("VTS-NEW")
                .build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> service.update(TEST_ID, updateReq, UUID.randomUUID()));

        assertEquals("Mã hệ thống VTS không được phép thay đổi sau khi tạo", exception.getMessage());
        assertEquals("VTS-OLD", entity.getCode());
        verify(repository, never()).save(any());
        verify(historyRepository, never()).save(any());
    }

    @Test
    void testUpdate_RejectsDuplicateCodeBeforeImmutableCodeCheck() {
        // Quy tắc 12: chỉ hồ sơ Lưu tạm/Bị trả về mới sửa được — bản mẫu mặc định đang Chờ duyệt
        entity.setApprovalStatus(ApprovalStatus.DRAFT);
        VtsSystemUpdateRequest updateReq = VtsSystemUpdateRequest.builder()
                .code("VTS-DUPLICATE")
                .build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.existsByCodeAndIdNot("VTS-DUPLICATE", TEST_ID)).thenReturn(true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> service.update(TEST_ID, updateReq, UUID.randomUUID()));

        assertEquals("Mã hệ thống VTS đã tồn tại trong hệ thống", exception.getMessage());
        verify(repository, never()).save(any());
        verify(repository).existsByCodeAndIdNot("VTS-DUPLICATE", TEST_ID);
    }

    @Test
    void testUpdate_RejectsChangingImmutableManagingUnit() {
        // Quy tắc 12: chỉ hồ sơ Lưu tạm/Bị trả về mới sửa được — bản mẫu mặc định đang Chờ duyệt
        entity.setApprovalStatus(ApprovalStatus.DRAFT);
        VtsSystemUpdateRequest updateReq = VtsSystemUpdateRequest.builder()
                .orgUnitId(UUID.fromString("00000000-0000-0000-0000-000000000099"))
                .build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> service.update(TEST_ID, updateReq, UUID.randomUUID()));

        assertEquals("Đơn vị quản lý không được phép thay đổi sau khi tạo", exception.getMessage());
        assertEquals(UUID.fromString("00000000-0000-0000-0000-000000000010"), entity.getOrgUnitId());
        verify(repository, never()).save(any());
        verify(historyRepository, never()).save(any());
    }

    @Test
    void testUpdate_ApprovedEntity_KeepsApprovedStatusAndRecordsHistory() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        VtsSystemUpdateRequest updateReq = VtsSystemUpdateRequest.builder()
                .systemName("VTS mới").build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(InfrastructureHistory.class));

        VtsSystemResponse response = service.update(TEST_ID, updateReq,
                java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));

        assertNotNull(response);
        assertEquals(ApprovalStatus.APPROVED, entity.getApprovalStatus());
        verify(repository, times(1)).save(any());
        verify(historyRepository, times(1)).save(any());
    }

    @Test
    void testUpdate_RejectedEntity_ResubmitsAsProposedAndResetsApproval() {
        entity.setApprovalStatus(ApprovalStatus.REJECTED);
        entity.setRejectionReason("Cần bổ sung thông tin");
        entity.setApproverLevel1(UUID.fromString("00000000-0000-0000-0000-000000000001"));
        entity.setApproverLevel2(UUID.fromString("00000000-0000-0000-0000-000000000002"));
        VtsSystemUpdateRequest updateReq = VtsSystemUpdateRequest.builder()
                .systemName("VTS đã bổ sung").build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);

        service.update(TEST_ID, updateReq,
                UUID.fromString("00000000-0000-0000-0000-000000000003"));

        assertEquals(ApprovalStatus.REJECTED, entity.getApprovalStatus());
    }

    /**
     * T13 (approval-2-level-spec §3.2): "Lưu tạm" là trạng thái duy nhất xóa
     * được; xóa mềm chuyển hồ sơ sang "Đã xóa (lịch sử)" và giữ lại trong DB.
     */
    @Test
    void testDelete_DraftEntity_ArchivesRecord() {
        VtsSystem draftEntity = VtsSystem.builder()
                .systemName("ABC").approvalStatus(ApprovalStatus.DRAFT)
                .build();
        draftEntity.setId(TEST_ID);

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(draftEntity));
        when(repository.save(any())).thenReturn(draftEntity);
        when(historyRepository.save(any())).thenReturn(mock(InfrastructureHistory.class));

        service.delete(TEST_ID, java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));

        assertEquals(ApprovalStatus.ARCHIVED, draftEntity.getApprovalStatus());
        // softDelete() stamps deletedAt
        assertNotNull(draftEntity.getDeletedAt());
    }

    /** N04: xóa hồ sơ đã duyệt là ca âm tính bắt buộc. */
    @Test
    void testDelete_ApprovedEntity_Throws() {
        VtsSystem approvedEntity = VtsSystem.builder()
                .systemName("ABC").approvalStatus(ApprovalStatus.APPROVED)
                .build();
        approvedEntity.setId(TEST_ID);

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(approvedEntity));

        assertThrows(RuntimeException.class,
                () -> service.delete(TEST_ID, java.util.UUID.fromString("00000000-0000-0000-0000-000000000001")));
        assertNull(approvedEntity.getDeletedAt());
    }

    /** N04: hồ sơ đang chờ duyệt cũng không được xóa. */
    @Test
    void testDelete_PendingEntity_Throws() {
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        assertThrows(RuntimeException.class, () -> service.delete(TEST_ID, java.util.UUID.fromString("00000000-0000-0000-0000-000000000001")));
    }

    @Test
    void testApproveC1_Approve() {
        ApprovalRequest req = ApprovalRequest.builder().decision("APPROVED").build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(InfrastructureHistory.class));

        service.approveC1(TEST_ID, req, java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertEquals(ApprovalStatus.APPROVED_LEVEL1, entity.getApprovalStatus());
        assertNotNull(entity.getApproverLevel1());
    }

    @Test
    void testApproveC1_SystemAdminStillRequiresC2() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "admin", null, List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN"))));
        // Phê duyệt cũng kiểm tra phạm vi đơn vị như sửa/xóa, nên phải nạp được
        // tài khoản đang đăng nhập; admin Cục xem toàn quốc → không giới hạn scope.
        com.hanghai.kchtg.user.entity.User adminUser = mock(com.hanghai.kchtg.user.entity.User.class);
        when(adminUser.getAllPermissions()).thenReturn(java.util.Set.of("orgunit:scope_all"));
        when(userRepository.findByUsernameWithRelations("admin")).thenReturn(Optional.of(adminUser));
        try {
            ApprovalRequest req = ApprovalRequest.builder().decision("APPROVED").build();
            when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
            when(repository.save(any())).thenReturn(entity);
            when(historyRepository.save(any())).thenReturn(mock(InfrastructureHistory.class));

            service.approveC1(TEST_ID, req,
                    java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));

            assertEquals(ApprovalStatus.APPROVED_LEVEL1, entity.getApprovalStatus());
            assertNull(entity.getApproverLevel2());
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    @Test
    void testApproveC2_Approve() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
        entity.setApproverLevel1(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));
        ApprovalRequest req = ApprovalRequest.builder().decision("APPROVED").build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(InfrastructureHistory.class));

        service.approveC2(TEST_ID, req, java.util.UUID.fromString("00000000-0000-0000-0000-000000000002"));
        assertEquals(ApprovalStatus.APPROVED, entity.getApprovalStatus());
        assertNotNull(entity.getApproverLevel2());
    }

    @Test
    void testApproveC2_sameActorAsC1_throwsException() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
        entity.setApproverLevel1(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));
        ApprovalRequest req = ApprovalRequest.builder().decision("APPROVED").build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> service.approveC2(TEST_ID, req, java.util.UUID.fromString("00000000-0000-0000-0000-000000000001")));
        assertTrue(ex.getMessage().contains("Người phê duyệt cấp Cục không được trùng"));
    }

    @Test
    void testRejectC1() {
        ApprovalRequest req = ApprovalRequest.builder().decision("REJECTED").reason("Không đủ điều kiện hợp lệ").build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(InfrastructureHistory.class));

        service.approveC1(TEST_ID, req, java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertEquals(ApprovalStatus.REJECTED_LEVEL1, entity.getApprovalStatus());
        assertEquals("Không đủ điều kiện hợp lệ", entity.getRejectionReason());
    }

    @Test
    void testRejectC2() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
        entity.setApproverLevel1(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));

        ApprovalRequest req = ApprovalRequest.builder().decision("REJECTED").reason("Không đồng ý cấp 2 thẩm định").build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(InfrastructureHistory.class));

        service.approveC2(TEST_ID, req, java.util.UUID.fromString("00000000-0000-0000-0000-000000000002"));
        assertEquals(ApprovalStatus.REJECTED_LEVEL2, entity.getApprovalStatus());
        assertEquals("Không đồng ý cấp 2 thẩm định", entity.getRejectionReason());
    }

    @Test
    void testGetHistory() {
        InfrastructureHistory history = InfrastructureHistory.builder()
                .id(UUID.randomUUID())
                .status(InfrastructureHistoryStatus.fromValue("APPROVED")).approvedBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .approvedDate(LocalDateTime.now())
                .reason("Duyệt")
                .build();
        when(repository.existsById(TEST_ID)).thenReturn(true);
        when(historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.VTS_SYSTEM, TEST_ID)).thenReturn(Arrays.asList(history));

        List<HistoryEntry> entries = service.getHistory(TEST_ID);
        assertNotNull(entries);
        assertEquals(1, entries.size());
        // list-screen-ui-standard §3: không tra được Họ và tên thì để trống,
        // tuyệt đối không trả UUID ra giao diện.
        assertNull(entries.get(0).getApprovedBy());
    }

    @Test
    void testSearch() {
        when(repository.search(false, List.of(), null, null, null, null,
                org.springframework.data.domain.PageRequest.of(0, 200))).thenReturn(org.springframework.data.domain.Page.empty());
        List<VtsSystemResponse> responses = service.search(null, null, null, null);
        assertNotNull(responses);
        assertTrue(responses.isEmpty());
    }

    // ===== Additional missing test cases =====

    @Test
    void testCreate_AcceptsWhitespaceTrimmedCode() {
        VtsSystemCreateRequest req = VtsSystemCreateRequest.builder()
                .systemName("VTS Trim")
                .code("  VTS-TRIM  ")
                .conditionStatus(ConditionStatus.OPERATIONAL)
                .orgUnitId(UUID.fromString("00000000-0000-0000-0000-000000000010"))
                .owningOrgId(UUID.fromString("00000000-0000-0000-0000-000000000011"))
                .operatingOrgId(UUID.fromString("00000000-0000-0000-0000-000000000012"))
                .provinceId(1)
                .build();

        VtsSystem saved = VtsSystem.builder()
                .systemName("VTS Trim").approvalStatus(ApprovalStatus.PROPOSED)
                .build();
        saved.setId(TEST_ID);

        when(repository.save(any())).thenReturn(saved);

        VtsSystemResponse response = service.create(req, UUID.randomUUID());
        assertNotNull(response);
        verify(repository).existsByCode("VTS-TRIM");
    }

    @Test
    void testCreate_CoordinatesNotProvided_SpatialIdIsNull() {
        VtsSystemCreateRequest req = VtsSystemCreateRequest.builder()
                .systemName("VTS No Coords")
                .code("VTS-NOCOORD")
                .conditionStatus(ConditionStatus.OPERATIONAL)
                .orgUnitId(UUID.fromString("00000000-0000-0000-0000-000000000010"))
                .owningOrgId(UUID.fromString("00000000-0000-0000-0000-000000000011"))
                .operatingOrgId(UUID.fromString("00000000-0000-0000-0000-000000000012"))
                .provinceId(1)
                .build();

        VtsSystem saved = VtsSystem.builder()
                .systemName("VTS No Coords").approvalStatus(ApprovalStatus.PROPOSED)
                .build();
        saved.setId(TEST_ID);

        when(repository.save(any())).thenReturn(saved);

        VtsSystemResponse response = service.create(req, UUID.randomUUID());
        assertNotNull(response);
        assertNull(response.getSpatialId());
    }

    @Test
    void testGetZones() {
        when(repository.existsById(TEST_ID)).thenReturn(true);
        when(zoneRepository.findByVtsSystemIdOrderByCreatedAtAsc(TEST_ID))
                .thenReturn(List.of());

        List<VtsZoneDto> zones = service.getZones(TEST_ID);
        assertNotNull(zones);
        assertTrue(zones.isEmpty());
    }

    @Test
    void testGetAttachments() {
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(attachmentRepository.findByRefIdAndRefTypeOrderByUploadedDateDesc(TEST_ID, InfrastructureType.VTS_SYSTEM))
                .thenReturn(List.of());

        List<VtsSystemAttachmentResponse> attachments = service.getAttachments(TEST_ID);
        assertNotNull(attachments);
        assertTrue(attachments.isEmpty());
    }

    @Test
    void testUpdate_ZonesReplaceAllOldZones() {
        VtsZoneDto zoneDto = VtsZoneDto.builder()
                .code("ZONE_NEW")
                .name("Vùng mới")
                .conditionStatus(ConditionStatus.OPERATIONAL)
                .build();

        VtsSystemUpdateRequest updateReq = VtsSystemUpdateRequest.builder()
                .zones(List.of(zoneDto))
                .build();

        VtsSystemUpdateRequest oldReq = VtsSystemUpdateRequest.builder()
                .zones(List.of())
                .build();

        // Quy tắc 12: chỉ hồ sơ Lưu tạm/Bị trả về mới sửa được — bản mẫu mặc định đang Chờ duyệt
        entity.setApprovalStatus(ApprovalStatus.DRAFT);
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);

        service.update(TEST_ID, updateReq, UUID.randomUUID());
        assertNotNull(entity.getZones());
        assertEquals(1, entity.getZones().size());
        assertEquals("ZONE_NEW", entity.getZones().get(0).getCode());
    }

    @Test
    void testApproveC1_RejectsInvalidDecision() {
        ApprovalRequest req = ApprovalRequest.builder()
                .decision("INVALID_STATUS")
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.approveC1(TEST_ID, req, UUID.randomUUID()));
        assertTrue(ex.getMessage().contains("Quyết định phê duyệt không hợp lệ"));
    }

    @Test
    void testApproveC1_RejectRequiresReason() {
        ApprovalRequest req = ApprovalRequest.builder()
                .decision(ApprovalStatus.REJECTED.name())
                .reason(null)
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.approveC1(TEST_ID, req, UUID.randomUUID()));
        assertTrue(ex.getMessage().contains("Lý do từ chối là bắt buộc"));
    }

    @Test
    void testApproveC2_RejectsInvalidDecision() {
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        entity.setApproverLevel1(UUID.randomUUID());

        ApprovalRequest req = ApprovalRequest.builder()
                .decision("INVALID")
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.approveC2(TEST_ID, req, UUID.randomUUID()));
        assertTrue(ex.getMessage().contains("Quyết định phê duyệt không hợp lệ"));
    }

    @Test
    void testDelete_RejectedEntity_Throws() {
        entity.setApprovalStatus(ApprovalStatus.REJECTED);

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));

        assertThrows(RuntimeException.class,
                () -> service.delete(TEST_ID, UUID.randomUUID()));
    }

    @Test
    void testCountByApprovalStatus() {
        java.util.Map<String, Long> counts = service.countByApprovalStatus();
        assertNotNull(counts);
    }

    @Test
    void testCountByApprovalStatus_WithFilters() {
        java.util.Map<String, Long> counts = service.countByApprovalStatus(
                null, null, null);
        assertNotNull(counts);
    }

    @Test
    void testGetById_WithZonesAndAttachments() {
        // Quy tắc 12: chỉ hồ sơ Lưu tạm/Bị trả về mới sửa được — bản mẫu mặc định đang Chờ duyệt
        entity.setApprovalStatus(ApprovalStatus.DRAFT);
        VtsSystemUpdateRequest updateReq = VtsSystemUpdateRequest.builder()
                .zones(List.of())
                .build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);

        service.update(TEST_ID, updateReq, UUID.randomUUID());

        VtsSystemResponse response = service.getById(TEST_ID, true, true);
        assertNotNull(response);
        assertNotNull(response.getZones());
        assertNotNull(response.getAttachments());
    }

    @Test
    void testSearch_WithYear() {
        when(repository.searchByDateRange(false, List.of(), null, null, null,
                null,
                java.time.LocalDate.of(2025, 1, 1),
                java.time.LocalDate.of(2026, 1, 1),
                org.springframework.data.domain.PageRequest.of(0, 200)))
                .thenReturn(org.springframework.data.domain.Page.empty());

        List<VtsSystemResponse> responses = service.search(null, null, null, null, 2025);
        assertNotNull(responses);
        assertTrue(responses.isEmpty());
    }

    @Test
    void testUploadAttachment_RejectsWhenPendingApproval() {
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));

        org.springframework.mock.web.MockMultipartFile file = new org.springframework.mock.web.MockMultipartFile(
                "file", "test.pdf", "application/pdf", "dummy content".getBytes());

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> service.uploadAttachment(TEST_ID, file, UUID.randomUUID()));
        assertTrue(ex.getMessage().contains("Không thể sửa hồ sơ đang trong quy trình phê duyệt"));
    }

    @Test
    void testUploadAttachment_RejectsExceedingSize() {
        entity.setApprovalStatus(ApprovalStatus.DRAFT);
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(attachmentRepository.findByRefIdAndRefTypeOrderByUploadedDateDesc(TEST_ID, InfrastructureType.VTS_SYSTEM))
                .thenReturn(List.of());

        byte[] bigContent = new byte[21 * 1024 * 1024]; // 21MB
        org.springframework.mock.web.MockMultipartFile file = new org.springframework.mock.web.MockMultipartFile(
                "file", "big.pdf", "application/pdf", bigContent);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.uploadAttachment(TEST_ID, file, UUID.randomUUID()));
        assertTrue(ex.getMessage().contains("vượt quá 20MB"));
    }

    @Test
    void testUploadAttachment_RejectsUnsupportedFormat() {
        entity.setApprovalStatus(ApprovalStatus.DRAFT);
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(attachmentRepository.findByRefIdAndRefTypeOrderByUploadedDateDesc(TEST_ID, InfrastructureType.VTS_SYSTEM))
                .thenReturn(List.of());

        org.springframework.mock.web.MockMultipartFile file = new org.springframework.mock.web.MockMultipartFile(
                "file", "script.exe", "application/x-msdownload", "content".getBytes());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.uploadAttachment(TEST_ID, file, UUID.randomUUID()));
        assertTrue(ex.getMessage().contains("không được hỗ trợ"));
    }

    @Test
    void testGetZones_Paged() {
        com.hanghai.kchtg.vtssystem.entity.VtsZone zone = com.hanghai.kchtg.vtssystem.entity.VtsZone.builder()
                .id(UUID.randomUUID())
                .code("Z1")
                .name("Zone 1")
                .conditionStatus(ConditionStatus.OPERATIONAL)
                .build();
        when(repository.existsById(TEST_ID)).thenReturn(true);
        when(zoneRepository.findByVtsSystemId(eq(TEST_ID), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(zone)));

        org.springframework.data.domain.Page<VtsZoneDto> result = service.getZones(TEST_ID, org.springframework.data.domain.PageRequest.of(0, 10));
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Z1", result.getContent().get(0).getCode());
    }

    @Test
    void testCreateZone_Success_And_LogsHistoryWhenApproved() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(zoneRepository.existsByVtsSystemIdAndCode(TEST_ID, "Z-NEW")).thenReturn(false);

        com.hanghai.kchtg.vtssystem.entity.VtsZone savedZone = com.hanghai.kchtg.vtssystem.entity.VtsZone.builder()
                .id(UUID.randomUUID())
                .code("Z-NEW")
                .name("Zone New")
                .conditionStatus(ConditionStatus.OPERATIONAL)
                .vtsSystem(entity)
                .build();
        when(zoneRepository.save(any())).thenReturn(savedZone);

        VtsZoneDto inputDto = VtsZoneDto.builder()
                .code("Z-NEW")
                .name("Zone New")
                .conditionStatus(ConditionStatus.OPERATIONAL)
                .build();

        VtsZoneDto result = service.createZone(TEST_ID, inputDto, UUID.randomUUID());
        assertNotNull(result);
        assertEquals("Z-NEW", result.getCode());
        verify(historyRepository, times(1)).save(any(InfrastructureHistory.class));
    }

    @Test
    void testUpdateZone_Success_And_LogsHistoryWhenApproved() {
        UUID zoneId = UUID.randomUUID();
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));

        com.hanghai.kchtg.vtssystem.entity.VtsZone existingZone = com.hanghai.kchtg.vtssystem.entity.VtsZone.builder()
                .id(zoneId)
                .code("Z-OLD")
                .name("Zone Old")
                .conditionStatus(ConditionStatus.OPERATIONAL)
                .vtsSystem(entity)
                .build();
        when(zoneRepository.findByIdAndVtsSystemId(zoneId, TEST_ID)).thenReturn(Optional.of(existingZone));
        when(zoneRepository.existsByVtsSystemIdAndCodeAndIdNot(TEST_ID, "Z-UPDATED", zoneId)).thenReturn(false);

        com.hanghai.kchtg.vtssystem.entity.VtsZone updatedZone = com.hanghai.kchtg.vtssystem.entity.VtsZone.builder()
                .id(zoneId)
                .code("Z-UPDATED")
                .name("Zone Updated")
                .conditionStatus(ConditionStatus.STOPPED)
                .vtsSystem(entity)
                .build();
        when(zoneRepository.save(any())).thenReturn(updatedZone);

        VtsZoneDto updateDto = VtsZoneDto.builder()
                .code("Z-UPDATED")
                .name("Zone Updated")
                .conditionStatus(ConditionStatus.STOPPED)
                .build();

        VtsZoneDto result = service.updateZone(TEST_ID, zoneId, updateDto, UUID.randomUUID());
        assertNotNull(result);
        assertEquals("Z-UPDATED", result.getCode());
        verify(historyRepository, times(1)).save(any(InfrastructureHistory.class));
    }

    @Test
    void testDeleteZone_Success_And_LogsHistoryWhenApproved() {
        UUID zoneId = UUID.randomUUID();
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));

        com.hanghai.kchtg.vtssystem.entity.VtsZone existingZone = com.hanghai.kchtg.vtssystem.entity.VtsZone.builder()
                .id(zoneId)
                .code("Z-DEL")
                .name("Zone To Delete")
                .conditionStatus(ConditionStatus.OPERATIONAL)
                .vtsSystem(entity)
                .build();
        when(zoneRepository.findByIdAndVtsSystemId(zoneId, TEST_ID)).thenReturn(Optional.of(existingZone));
        doNothing().when(zoneRepository).delete(existingZone);

        service.deleteZone(TEST_ID, zoneId, UUID.randomUUID());
        verify(zoneRepository, times(1)).delete(existingZone);
        verify(historyRepository, times(1)).save(any(InfrastructureHistory.class));
    }

    @Test
    void testUpdate_SmartDeltaDiff_Zones_OnlyLogsDelta() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        UUID unchangedZoneId = UUID.randomUUID();
        UUID modZoneId = UUID.randomUUID();
        UUID delZoneId = UUID.randomUUID();

        com.hanghai.kchtg.vtssystem.entity.VtsZone unchangedZone = com.hanghai.kchtg.vtssystem.entity.VtsZone.builder()
                .id(unchangedZoneId).code("VZ-01").name("Vùng 1").conditionStatus(ConditionStatus.OPERATIONAL).vtsSystem(entity).build();
        com.hanghai.kchtg.vtssystem.entity.VtsZone modZone = com.hanghai.kchtg.vtssystem.entity.VtsZone.builder()
                .id(modZoneId).code("VZ-MOD").name("Vùng Cũ").conditionStatus(ConditionStatus.OPERATIONAL).vtsSystem(entity).build();
        com.hanghai.kchtg.vtssystem.entity.VtsZone delZone = com.hanghai.kchtg.vtssystem.entity.VtsZone.builder()
                .id(delZoneId).code("VZ-DEL").name("Vùng Xóa").conditionStatus(ConditionStatus.OPERATIONAL).vtsSystem(entity).build();

        entity.setZones(new java.util.ArrayList<>(List.of(unchangedZone, modZone, delZone)));
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        VtsZoneDto unchangedDto = VtsZoneDto.builder().id(unchangedZoneId).code("VZ-01").name("Vùng 1").conditionStatus(ConditionStatus.OPERATIONAL).build();
        VtsZoneDto modDto = VtsZoneDto.builder().id(modZoneId).code("VZ-MOD").name("Vùng Mới").conditionStatus(ConditionStatus.OPERATIONAL).build();
        VtsZoneDto newDto = VtsZoneDto.builder().code("VZ-NEW").name("Vùng Mới Thêm").conditionStatus(ConditionStatus.OPERATIONAL).build();

        VtsSystemUpdateRequest updateReq = VtsSystemUpdateRequest.builder()
                .zones(List.of(unchangedDto, modDto, newDto))
                .build();

        VtsSystemResponse response = service.update(TEST_ID, updateReq, UUID.randomUUID());
        assertNotNull(response);

        org.mockito.ArgumentCaptor<InfrastructureHistory> historyCaptor = org.mockito.ArgumentCaptor.forClass(InfrastructureHistory.class);
        verify(historyRepository, times(1)).save(historyCaptor.capture());
        InfrastructureHistory savedHistory = historyCaptor.getValue();

        assertEquals(InfrastructureType.VTS_SYSTEM, savedHistory.getRefType());
        assertTrue(savedHistory.getChangedField().contains("Vùng VTS"));
        // Check that unchanged zone VZ-01 is NOT in the history diff
        assertFalse(savedHistory.getPreviousValue().contains("VZ-01"));
        assertFalse(savedHistory.getNewValue().contains("VZ-01"));
        // Check that removed zone and modified old zone are in previousValue
        assertTrue(savedHistory.getPreviousValue().contains("Xóa Vùng Xóa (VZ-DEL)"));
        assertTrue(savedHistory.getPreviousValue().contains("Cũ: Vùng Cũ (VZ-MOD)"));
        // Check that added zone and modified new zone are in newValue
        assertTrue(savedHistory.getNewValue().contains("Thêm Vùng Mới Thêm (VZ-NEW)"));
        assertTrue(savedHistory.getNewValue().contains("Mới: Vùng Mới (VZ-MOD)"));
    }

    @Test
    void testUpdate_CombinedFieldsZonesAndAttachments_SingleHistoryRecord() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        entity.setSystemName("VTS Cũ");
        entity.setZones(new java.util.ArrayList<>());
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        VtsZoneDto newZone = VtsZoneDto.builder().code("VZ-NEW").name("Vùng Mới").conditionStatus(ConditionStatus.OPERATIONAL).build();

        VtsSystemUpdateRequest updateReq = VtsSystemUpdateRequest.builder()
                .systemName("VTS Mới")
                .zones(List.of(newZone))
                .addedAttachmentNames(List.of("doc_moi.pdf"))
                .removedAttachmentNames(List.of("doc_cu.xlsx"))
                .build();

        VtsSystemResponse response = service.update(TEST_ID, updateReq, UUID.randomUUID());
        assertNotNull(response);

        org.mockito.ArgumentCaptor<InfrastructureHistory> historyCaptor = org.mockito.ArgumentCaptor.forClass(InfrastructureHistory.class);
        verify(historyRepository, times(1)).save(historyCaptor.capture());
        InfrastructureHistory savedHistory = historyCaptor.getValue();

        assertEquals(InfrastructureType.VTS_SYSTEM, savedHistory.getRefType());
        // Verify changedField contains all 3 areas
        assertTrue(savedHistory.getChangedField().contains("Tên hệ thống"));
        assertTrue(savedHistory.getChangedField().contains("Vùng VTS"));
        assertTrue(savedHistory.getChangedField().contains("Tài liệu đính kèm"));

        // Verify previousValue contains old field, old zone, and removed attachment
        assertTrue(savedHistory.getPreviousValue().contains("VTS Cũ"));
        assertTrue(savedHistory.getPreviousValue().contains("Xóa doc_cu.xlsx"));

        // Verify newValue contains new field, new zone, and added attachment
        assertTrue(savedHistory.getNewValue().contains("VTS Mới"));
        assertTrue(savedHistory.getNewValue().contains("Thêm Vùng Mới (VZ-NEW)"));
        assertTrue(savedHistory.getNewValue().contains("Thêm doc_moi.pdf"));
    }
}
