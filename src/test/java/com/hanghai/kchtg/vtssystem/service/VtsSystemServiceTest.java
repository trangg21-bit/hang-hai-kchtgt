package com.hanghai.kchtg.vtssystem.service;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;

import com.hanghai.kchtg.vtssystem.dto.*;
import com.hanghai.kchtg.common.entity.ApprovalHistory;
import com.hanghai.kchtg.common.enums.ApprovalHistoryStatus;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.vtssystem.entity.VtsSystem;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.common.repository.ApprovalHistoryRepository;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.vtssystem.repository.VtsSystemRepository;
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
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VtsSystemServiceTest {

    private static final UUID TEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID TEST_ID_2 = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock
    private VtsSystemRepository repository;

    @Mock
    private ApprovalHistoryRepository historyRepository;

    @Mock
    private InfrastructureAttachmentRepository attachmentRepository;

    @Mock
    private OrgUnitCacheService orgUnitCacheService;

    @Mock
    private com.hanghai.kchtg.user.repository.UserRepository userRepository;

    @InjectMocks
    private VtsSystemService service;

    private VtsSystem entity;
    private VtsSystemCreateRequest createRequest;

    @BeforeEach
    void setUp() {
        entity = VtsSystem.builder()
                .systemName("VTS ABC")
                .location("Hà Nội")
                .approvalStatus(ApprovalStatus.PROPOSED)
                .approvedLevel1(false)
                .approvedLevel2(false)
                .build();
        entity.setId(TEST_ID);

        createRequest = VtsSystemCreateRequest.builder()
                .systemName("VTS ABC")
                .location("Hà Nội")
                .build();
    }

    @Test
    void testCreate() {
        VtsSystem saved = VtsSystem.builder()
                .systemName("VTS ABC").location("Hà Nội").approvalStatus(ApprovalStatus.PROPOSED)
                .approvedLevel1(false).approvedLevel2(false).build();
        saved.setId(TEST_ID);

        when(repository.save(any())).thenReturn(saved);
        when(historyRepository.save(any())).thenReturn(mock(ApprovalHistory.class));

        VtsSystemResponse response = service.create(createRequest, java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertNotNull(response);
        assertEquals(ApprovalStatus.PROPOSED, response.getApprovalStatus());
        verify(repository, times(1)).save(any());
    }

    @Test
    void testGetById() {
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        VtsSystemResponse response = service.getById(TEST_ID);
        assertNotNull(response);
        assertEquals(TEST_ID, response.getId());
    }

    @Test
    void testGetById_NotFound() {
        when(repository.findById(TEST_ID_2)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.getById(TEST_ID_2));
    }

    @Test
    void testUpdate() {
        VtsSystemUpdateRequest updateReq = VtsSystemUpdateRequest.builder()
                .systemName("VTS mới").build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(ApprovalHistory.class));

        VtsSystemResponse response = service.update(TEST_ID, updateReq, java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertNotNull(response);
        verify(repository, times(1)).save(any());
    }

    @Test
    void testUpdate_ApprovedEntity_ThrowsAndKeepsApprovedStatus() {
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        VtsSystemUpdateRequest updateReq = VtsSystemUpdateRequest.builder()
                .systemName("VTS mới").build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));

        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> service.update(TEST_ID, updateReq,
                        java.util.UUID.fromString("00000000-0000-0000-0000-000000000001")));

        assertTrue(exception.getMessage().contains("không thể cập nhật trực tiếp"));
        assertEquals(ApprovalStatus.APPROVED, entity.getApprovalStatus());
        verify(repository, never()).save(any());
        verify(historyRepository, never()).save(any());
    }

    @Test
    void testUpdate_RejectedEntity_ResubmitsAsProposedAndResetsApproval() {
        entity.setApprovalStatus(ApprovalStatus.REJECTED);
        entity.setRejectionReason("Cần bổ sung thông tin");
        entity.setApprovedLevel1(true);
        entity.setApproverLevel1(UUID.fromString("00000000-0000-0000-0000-000000000001"));
        entity.setApprovedLevel2(true);
        entity.setApproverLevel2(UUID.fromString("00000000-0000-0000-0000-000000000002"));
        VtsSystemUpdateRequest updateReq = VtsSystemUpdateRequest.builder()
                .systemName("VTS đã bổ sung").build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(ApprovalHistory.class));

        service.update(TEST_ID, updateReq,
                UUID.fromString("00000000-0000-0000-0000-000000000003"));

        assertEquals(ApprovalStatus.PROPOSED, entity.getApprovalStatus());
        assertNull(entity.getRejectionReason());
        assertFalse(entity.getApprovedLevel1());
        assertFalse(entity.getApprovedLevel2());
        assertNull(entity.getApproverLevel1());
        assertNull(entity.getApproverLevel2());
    }

    @Test
    void testDelete_ApprovedEntity() {
        VtsSystem approvedEntity = VtsSystem.builder()
                .systemName("ABC").location("Hà Nội").approvalStatus(ApprovalStatus.APPROVED)
                .approvedLevel1(false).approvedLevel2(false).build();
        approvedEntity.setId(TEST_ID);

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(approvedEntity));
        when(repository.save(any())).thenReturn(approvedEntity);
        when(historyRepository.save(any())).thenReturn(mock(ApprovalHistory.class));

        service.delete(TEST_ID, java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));
        // softDelete() stamps deletedAt
        assertNotNull(approvedEntity.getDeletedAt());
    }

    @Test
    void testDelete_NotApprovedEntity_Throws() {
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        assertThrows(RuntimeException.class, () -> service.delete(TEST_ID, java.util.UUID.fromString("00000000-0000-0000-0000-000000000001")));
    }

    @Test
    void testApproveC1_Approve() {
        ApprovalRequest req = ApprovalRequest.builder().quyetDinh("APPROVED").build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(ApprovalHistory.class));

        service.approveC1(TEST_ID, req, java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertEquals(ApprovalStatus.PENDING_APPROVAL, entity.getApprovalStatus());
        assertTrue(entity.getApprovedLevel1());
    }

    @Test
    void testApproveC1_SystemAdminStillRequiresC2() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "admin", null, List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN"))));
        try {
            ApprovalRequest req = ApprovalRequest.builder().quyetDinh("APPROVED").build();
            when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
            when(repository.save(any())).thenReturn(entity);
            when(historyRepository.save(any())).thenReturn(mock(ApprovalHistory.class));

            service.approveC1(TEST_ID, req,
                    java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));

            assertEquals(ApprovalStatus.PENDING_APPROVAL, entity.getApprovalStatus());
            assertFalse(entity.getApprovedLevel2());
            verify(historyRepository, times(1)).save(any());
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    @Test
    void testApproveC2_Approve() {
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        ApprovalRequest req = ApprovalRequest.builder().quyetDinh("APPROVED").build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(ApprovalHistory.class));

        service.approveC2(TEST_ID, req, java.util.UUID.fromString("00000000-0000-0000-0000-000000000002"));
        assertEquals(ApprovalStatus.APPROVED, entity.getApprovalStatus());
        assertTrue(entity.getApprovedLevel2());
    }

    @Test
    void testApproveC2_sameActorAsC1_throwsException() {
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        entity.setApprovedLevel1(true);
        entity.setApproverLevel1(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));
        ApprovalRequest req = ApprovalRequest.builder().quyetDinh("APPROVED").build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> service.approveC2(TEST_ID, req, java.util.UUID.fromString("00000000-0000-0000-0000-000000000001")));
        assertTrue(ex.getMessage().contains("Nguoi phe duyet C2 khong duoc trung"));
    }

    @Test
    void testRejectC1() {
        ApprovalRequest req = ApprovalRequest.builder().quyetDinh("REJECTED").reason("Không đủ điều kiện").build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(ApprovalHistory.class));

        service.approveC1(TEST_ID, req, java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertEquals(ApprovalStatus.REJECTED, entity.getApprovalStatus());
        assertEquals("Không đủ điều kiện", entity.getRejectionReason());
    }

    @Test
    void testGetHistory() {
        ApprovalHistory history = ApprovalHistory.builder()
                .id(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001")).refId(TEST_ID).refType(InfrastructureType.VTS_SYSTEM).approvalLevel(com.hanghai.kchtg.common.enums.ApprovalLevel.LEVEL_1)
                .status(ApprovalHistoryStatus.fromValue("APPROVED")).approvedBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .approvedDate(LocalDateTime.now()).reason("Duyệt").build();
        when(historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.VTS_SYSTEM, TEST_ID)).thenReturn(Arrays.asList(history));
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));

        List<HistoryEntry> entries = service.getHistory(TEST_ID);
        assertNotNull(entries);
        assertEquals(1, entries.size());
        assertEquals("00000000-0000-0000-0000-000000000001", entries.get(0).getApprovedBy());
    }

    @Test
    void testSearch() {
        when(repository.search(null, null, null, null, org.springframework.data.domain.PageRequest.of(0, 100))).thenReturn(org.springframework.data.domain.Page.empty());
        List<VtsSystemResponse> responses = service.search(null, null, null, null);
        assertNotNull(responses);
        assertTrue(responses.isEmpty());
    }
}

