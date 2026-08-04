package com.hanghai.kchtg.radarstation.service;

import com.hanghai.kchtg.gis.search.dto.InfrastructureType;

import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.radarstation.dto.*;
import com.hanghai.kchtg.common.entity.ApprovalHistory;
import com.hanghai.kchtg.common.enums.ApprovalHistoryStatus;
import com.hanghai.kchtg.radarstation.entity.RadarStation;
import com.hanghai.kchtg.common.repository.ApprovalHistoryRepository;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.radarstation.repository.RadarStationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.radarstation.entity.RadarStationApprovalStatus;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RadarStationServiceTest {

    private static final UUID TEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID TEST_ID_2 = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock
    private RadarStationRepository repository;

    @Mock
    private ApprovalHistoryRepository historyRepository;

    @Mock
    private InfrastructureAttachmentRepository attachmentRepository;

    @Mock
    private GisSpatialObjectService gisSpatialObjectService;

    @Mock
    private OrgUnitCacheService orgUnitCacheService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private RadarStationService service;

    private RadarStation entity;
    private RadarStationCreateRequest createRequest;

    @BeforeEach
    void setUp() {
        lenient().when(attachmentRepository.findByRefIdAndRefTypeOrderByUploadedDateDesc(any(), any()))
                .thenReturn(Collections.emptyList());
        lenient().when(gisSpatialObjectService.createOrUpdate(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenAnswer(inv -> {
                    GisSpatialObject spatial = new GisSpatialObject();
                    spatial.setId(UUID.randomUUID());
                    return spatial;
                });
        entity = RadarStation.builder()
                .id(TEST_ID)
                .stationName("Tram ABC")
                .location("Hà Nội")
                .approvalStatus(RadarStationApprovalStatus.PROPOSED)
                .approvedLevel1(false)
                .approvedLevel2(false)
                .createdBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .build();

        createRequest = RadarStationCreateRequest.builder()
                .stationName("Tram ABC")
                .location("Hà Nội")
                .build();
    }

    @Test
    void testCreate() {
        RadarStation saved = RadarStation.builder()
                .id(TEST_ID).stationName("Tram ABC").location("Hà Nội")
                .approvalStatus(com.hanghai.kchtg.radarstation.entity.RadarStationApprovalStatus.PROPOSED)
                .approvedLevel1(false).approvedLevel2(false)
                .createdBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001")).build();

        when(repository.save(any())).thenReturn(saved);
        when(historyRepository.save(any())).thenReturn(mock(ApprovalHistory.class));

        RadarStationResponse response = service.create(createRequest,
                java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertNotNull(response);
        assertEquals(com.hanghai.kchtg.radarstation.entity.RadarStationApprovalStatus.PROPOSED,
                response.getApprovalStatus());
        verify(repository, times(1)).save(any());
    }

    @Test
    void testGetById() {
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        RadarStationResponse response = service.getById(TEST_ID);
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
        RadarStationUpdateRequest updateReq = RadarStationUpdateRequest.builder()
                .stationName("Tram moi").build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(ApprovalHistory.class));

        RadarStationResponse response = service.update(TEST_ID, updateReq,
                java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertNotNull(response);
        verify(repository, times(1)).save(any());
    }

    @Test
    void testDelete_ApprovedEntity() {
        RadarStation approvedEntity = RadarStation.builder()
                .id(TEST_ID).stationName("ABC").location("Hà Nội")
                .approvalStatus(com.hanghai.kchtg.radarstation.entity.RadarStationApprovalStatus.APPROVED)
                .approvedLevel1(false).approvedLevel2(false)
                .createdBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001")).build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(approvedEntity));
        when(repository.save(any())).thenReturn(approvedEntity);
        when(historyRepository.save(any())).thenReturn(mock(ApprovalHistory.class));

        service.delete(TEST_ID, java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertNotNull(approvedEntity.getDeletedAt());
    }

    @Test
    void testDelete_NotApprovedEntity_Throws() {
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        assertThrows(RuntimeException.class,
                () -> service.delete(TEST_ID, java.util.UUID.fromString("00000000-0000-0000-0000-000000000001")));
    }

    @Test
    void testApproveC1_Approve() {
        ApprovalRequest req = ApprovalRequest.builder().quyetDinh("APPROVED").build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(ApprovalHistory.class));

        RadarStationResponse response = service.approveC1(TEST_ID, req,
                java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertEquals(com.hanghai.kchtg.radarstation.entity.RadarStationApprovalStatus.UNDER_REVIEW,
                entity.getApprovalStatus());
        assertTrue(entity.getApprovedLevel1());
    }

    @Test
    void testApproveC2_Approve() {
        entity.setApprovalStatus(com.hanghai.kchtg.radarstation.entity.RadarStationApprovalStatus.UNDER_REVIEW);
        ApprovalRequest req = ApprovalRequest.builder().quyetDinh("APPROVED").build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(ApprovalHistory.class));

        RadarStationResponse response = service.approveC2(TEST_ID, req,
                java.util.UUID.fromString("00000000-0000-0000-0000-000000000002"));
        assertEquals(com.hanghai.kchtg.radarstation.entity.RadarStationApprovalStatus.APPROVED,
                entity.getApprovalStatus());
        assertTrue(entity.getApprovedLevel2());
    }

    @Test
    void testApproveC2_sameActorAsC1_throwsException() {
        entity.setApprovalStatus(com.hanghai.kchtg.radarstation.entity.RadarStationApprovalStatus.UNDER_REVIEW);
        entity.setApprovedLevel1(true);
        entity.setApproverLevel1(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));
        ApprovalRequest req = ApprovalRequest.builder().quyetDinh("APPROVED").build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> service.approveC2(TEST_ID, req,
                        java.util.UUID.fromString("00000000-0000-0000-0000-000000000001")));
        assertTrue(ex.getMessage().contains("Nguoi phe duyet C2 khong duoc trung"));
    }

    @Test
    void testRejectC1() {
        ApprovalRequest req = ApprovalRequest.builder().quyetDinh("REJECTED").reason("Không đủ điều kiện").build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(ApprovalHistory.class));

        RadarStationResponse response = service.approveC1(TEST_ID, req,
                java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertEquals(com.hanghai.kchtg.radarstation.entity.RadarStationApprovalStatus.REJECTED,
                entity.getApprovalStatus());
        assertEquals("Không đủ điều kiện", entity.getRejectionReason());
    }

    @Test
    void testGetHistory() {
        ApprovalHistory history = ApprovalHistory.builder()
                .id(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001")).refId(TEST_ID)
                .refType(InfrastructureType.RADAR_STATION)
                .approvalLevel(com.hanghai.kchtg.common.enums.ApprovalLevel.LEVEL_1)
                .status(ApprovalHistoryStatus.fromValue("APPROVED"))
                .approvedBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .approvedDate(LocalDateTime.now()).reason("Duyệt").build();
        when(historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.RADAR_STATION, TEST_ID))
                .thenReturn(Arrays.asList(history));

        List<HistoryEntry> entries = service.getHistory(TEST_ID);
        assertNotNull(entries);
        assertEquals(1, entries.size());
        assertEquals("00000000-0000-0000-0000-000000000001", entries.get(0).getApprovedBy());
    }

    @Test
    void testSearch() {
        when(repository.search(null, null, null, null, Pageable.unpaged()))
                .thenReturn(org.springframework.data.domain.Page.empty());
        List<RadarStationResponse> responses = service.search(null, null, null, null);
        assertNotNull(responses);
        assertTrue(responses.isEmpty());
    }
}
