package com.hanghai.kchtg.dikerevetment;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;

import com.hanghai.kchtg.dikerevetment.dto.*;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetment;
import com.hanghai.kchtg.common.entity.ApprovalHistory;
import com.hanghai.kchtg.common.enums.ApprovalHistoryStatus;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentType;
import com.hanghai.kchtg.common.repository.ApprovalHistoryRepository;
import com.hanghai.kchtg.dikerevetment.repository.DikeRevetmentAttachmentRepository;
import com.hanghai.kchtg.dikerevetment.repository.DikeRevetmentRepository;
import com.hanghai.kchtg.dikerevetment.service.DikeRevetmentService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.port.service.PortCacheService;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DikeRevetmentServiceTest {

    private static final UUID TEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID TEST_ID_2 = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock DikeRevetmentRepository repo;
    @Mock DikeRevetmentAttachmentRepository attachmentRepo;
    @Mock ApprovalHistoryRepository approvalHistoryRepo;
    @Mock com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService gisSpatialObjectService;
    @Mock OrgUnitCacheService orgUnitCacheService;
    @Mock PortCacheService portCacheService;
    @Mock UserResolverService userResolverService;
    DikeRevetmentService service;

    private DikeRevetment testEntity;
    private DikeRevetmentCreateRequest createReq;

    @BeforeEach void setUp() {
        service = new DikeRevetmentService(
                repo, attachmentRepo, approvalHistoryRepo, gisSpatialObjectService, orgUnitCacheService,
                portCacheService, userResolverService);
        testEntity = DikeRevetment.builder()
                .id(TEST_ID)
                .dikeRevetmentType(DikeRevetmentType.RIVER_DIKE)
                .location("Bac Giang")
                .length(150.5)
                .crestElevation(10.0)
                .height(5.0)
                .surfaceMaterial("Betong")
                .status("Tot")
                .approvalStatus(ApprovalStatus.PROPOSED)
                .isApprovedLevel1(false)
                .isApprovedLevel2(false)
                .createdBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .createdAt(LocalDateTime.of(2026, 6, 1, 10, 0))
                .build();
        createReq = DikeRevetmentCreateRequest.builder()
                .dikeRevetmentType(DikeRevetmentType.SAND_DIKE)
                .location("Ha Noi")
                .length(200.0)
                .crestElevation(20.0)
                .height(8.0)
                .surfaceMaterial("Thep")
                .status("Tot")
                .build();
    }

    @Test void create_shouldSaveEntity() {
        when(repo.save(any())).thenReturn(testEntity);
        DikeRevetmentResponse r = service.create(createReq, java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertThat(r).isNotNull();
        assertThat(r.getDikeRevetmentType()).isEqualTo(DikeRevetmentType.RIVER_DIKE);
        assertThat(r.getApprovalStatus()).isEqualTo(ApprovalStatus.PROPOSED);
        verify(repo, times(1)).save(any());
    }

    @Test void create_shouldSetDefaultStatusToProposed() {
        when(repo.save(any())).thenReturn(testEntity);
        assertThat(service.create(createReq, java.util.UUID.fromString("00000000-0000-0000-0000-000000000001")).getApprovalStatus())
                .isEqualTo(ApprovalStatus.PROPOSED);
    }

    @Test void getById_shouldReturnResponse() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        assertThat(service.getById(TEST_ID).getDikeRevetmentType()).isEqualTo(DikeRevetmentType.RIVER_DIKE);
    }

    @Test void getById_shouldThrowWhenNotFound() {
        when(repo.findById(TEST_ID_2)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getById(TEST_ID_2))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Khong tim thay");
    }

    @Test void findAll_shouldReturnSorted() {
        when(repo.findByDeletedAtIsNull(any(Sort.class))).thenReturn(List.of(testEntity));
        assertThat(service.findAll()).hasSize(1);
    }

    @Test void softDelete_shouldMarkDeleted() {
        testEntity.setApprovalStatus(ApprovalStatus.APPROVED);
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);
        service.softDelete(TEST_ID);
        verify(repo, times(1)).save(any());
    }

    @Test void softDelete_shouldThrowWhenNotApproved() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        assertThatThrownBy(() -> service.softDelete(TEST_ID))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Chi co de ke da duyet moi co the xoa mem");
    }

    @Test void approveC1_shouldTransitionProposedToUnderReview() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        ApprovalHistory hist = ApprovalHistory.builder().id(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001")).build();
        when(approvalHistoryRepo.save(any())).thenReturn(hist);
        ApprovalResponse r = service.approveC1(TEST_ID, ApprovalRequest.builder()
                .decision("APPROVED")
                .reason("Phe cap 1")
                .build(), java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertThat(r.getStatus()).isEqualTo("PENDING_APPROVAL");
        assertThat(r.getApprovalLevel()).isEqualTo(com.hanghai.kchtg.common.enums.ApprovalLevel.LEVEL_1);
    }

    @Test void approveC2_shouldTransitionUnderReviewToApproved() {
        testEntity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        ApprovalHistory hist = ApprovalHistory.builder().id(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001")).build();
        when(approvalHistoryRepo.save(any())).thenReturn(hist);
        ApprovalResponse r = service.approveC2(TEST_ID, ApprovalRequest.builder()
                .decision("APPROVED")
                .reason("Phe cap 2")
                .build(), java.util.UUID.fromString("00000000-0000-0000-0000-000000000002"));
        assertThat(r.getStatus()).isEqualTo("APPROVED");
        assertThat(r.getApprovalLevel()).isEqualTo(com.hanghai.kchtg.common.enums.ApprovalLevel.LEVEL_2);
    }

    @Test void getApprovalHistory_shouldReturnEntries() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        ApprovalHistory hist = ApprovalHistory.builder()
                .id(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .refId(testEntity.getId())
                .refType(InfrastructureType.DIKE_REVETMENT)
                .approvalLevel(com.hanghai.kchtg.common.enums.ApprovalLevel.LEVEL_1)
                .status(ApprovalHistoryStatus.UNDER_REVIEW)
                .approvedBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .approvedDate(LocalDateTime.of(2026, 6, 1, 10, 0))
                .reason("Phe cap 1")
                .build();
        when(approvalHistoryRepo.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.DIKE_REVETMENT, TEST_ID)).thenReturn(List.of(hist));
        List<HistoryEntry> h = service.getApprovalHistory(TEST_ID);
        assertThat(h).hasSize(1);
        assertThat(h.get(0).getStatus()).isEqualTo("UNDER_REVIEW");
    }

    @Test void findByApprovalStatus_shouldReturnFiltered() {
        when(repo.findByApprovalStatusAndDeletedAtIsNull(ApprovalStatus.APPROVED))
                .thenReturn(List.of(testEntity));
        assertThat(service.findByApprovalStatus(ApprovalStatus.APPROVED)).hasSize(1);
    }
}

