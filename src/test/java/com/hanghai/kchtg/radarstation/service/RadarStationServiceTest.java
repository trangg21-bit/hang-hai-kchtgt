package com.hanghai.kchtg.radarstation.service;

import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.radarstation.dto.RadarStationCreateRequest;
import com.hanghai.kchtg.radarstation.dto.RadarStationResponse;
import com.hanghai.kchtg.radarstation.dto.RadarStationUpdateRequest;
import com.hanghai.kchtg.radarstation.entity.RadarStation;
import com.hanghai.kchtg.radarstation.repository.RadarStationRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.*;

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
    private InfrastructureHistoryRepository historyRepository;

    @Mock
    private InfrastructureAttachmentRepository attachmentRepository;

    @Mock
    private GisSpatialObjectService gisSpatialObjectService;

    @Mock
    private OrgUnitCacheService orgUnitCacheService;

    @Mock
    private OrgUnitScopeService orgUnitScopeService;

    @Mock
    private InfrastructureApprovalService approvalService;

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
        lenient().when(orgUnitScopeService.currentUserScope())
                .thenReturn(OrgUnitScopeService.Scope.all());

        entity = RadarStation.builder()
                .id(TEST_ID)
                .stationName("Tram ABC")
                .location("Hà Nội")
                .approvalStatus(ApprovalStatus.DRAFT)
                .createdBy(UUID.fromString("00000000-0000-0000-0000-000000000001"))
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
                .approvalStatus(ApprovalStatus.DRAFT)
                .createdBy(UUID.fromString("00000000-0000-0000-0000-000000000001")).build();

        when(repository.save(any())).thenReturn(saved);
        when(historyRepository.save(any())).thenReturn(mock(InfrastructureHistory.class));

        RadarStationResponse response = service.create(createRequest,
                UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertNotNull(response);
        assertEquals(ApprovalStatus.DRAFT, response.getApprovalStatus());
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

        RadarStationResponse response = service.update(TEST_ID, updateReq,
                UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertNotNull(response);
        verify(repository, times(1)).save(any());
    }

    @Test
    void testDelete() {
        RadarStation draftEntity = RadarStation.builder()
                .id(TEST_ID).stationName("ABC").location("Hà Nội")
                .approvalStatus(ApprovalStatus.DRAFT)
                .createdBy(UUID.fromString("00000000-0000-0000-0000-000000000001")).build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(draftEntity));
        when(repository.save(any())).thenReturn(draftEntity);
        when(historyRepository.save(any())).thenReturn(mock(InfrastructureHistory.class));

        service.delete(TEST_ID, UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertNotNull(draftEntity.getDeletedAt());
        assertEquals(ApprovalStatus.ARCHIVED, draftEntity.getApprovalStatus());
    }

    @Test
    void testSubmitForApproval() {
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);

        service.submitForApproval(TEST_ID,
                UUID.fromString("00000000-0000-0000-0000-000000000001"));
        verify(approvalService, times(1)).submit(eq(entity), eq(InfrastructureType.RADAR_STATION), any());
    }

    @Test
    void testApproveLevel1() {
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);

        service.approveLevel1(TEST_ID,
                UUID.fromString("00000000-0000-0000-0000-000000000002"), "OK");
        verify(approvalService, times(1)).approveC1(eq(entity), eq(InfrastructureType.RADAR_STATION), eq("APPROVED"), eq("OK"), any());
    }

    @Test
    void testApproveLevel2() {
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);

        service.approveLevel2(TEST_ID,
                UUID.fromString("00000000-0000-0000-0000-000000000003"), "OK C2");
        verify(approvalService, times(1)).approveC2(eq(entity), eq(InfrastructureType.RADAR_STATION), eq("APPROVED"), eq("OK C2"), any());
    }

    @Test
    void testRejectLevel1() {
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);

        service.rejectLevel1(TEST_ID,
                UUID.fromString("00000000-0000-0000-0000-000000000002"), "Không đủ điều kiện");
        verify(approvalService, times(1)).approveC1(eq(entity), eq(InfrastructureType.RADAR_STATION), eq("REJECTED"), eq("Không đủ điều kiện"), any());
    }

    @Test
    void testRejectLevel2() {
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);

        service.rejectLevel2(TEST_ID,
                UUID.fromString("00000000-0000-0000-0000-000000000003"), "Lý do cấp 2");
        verify(approvalService, times(1)).approveC2(eq(entity), eq(InfrastructureType.RADAR_STATION), eq("REJECTED"), eq("Lý do cấp 2"), any());
    }

    @Test
    void testGetHistory() {
        InfrastructureHistory history = InfrastructureHistory.builder()
                .id(UUID.fromString("00000000-0000-0000-0000-000000000001")).refId(TEST_ID)
                .refType(InfrastructureType.RADAR_STATION)
                .approvalLevel(ApprovalLevel.LEVEL_1)
                .status(InfrastructureHistoryStatus.APPROVED)
                .approvedBy(UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .approvedDate(LocalDateTime.now()).reason("Duyệt").build();
        when(historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.RADAR_STATION, TEST_ID))
                .thenReturn(List.of(history));

        List<com.hanghai.kchtg.vtssystem.dto.HistoryEntry> entries = service.getHistory(TEST_ID);
        assertNotNull(entries);
        assertEquals(1, entries.size());
    }

    @Test
    void testSearch() {
        when(repository.searchPaged(anyBoolean(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(Page.empty());
        List<RadarStationResponse> responses = service.search(null, null, null, null);
        assertNotNull(responses);
        assertTrue(responses.isEmpty());
    }
}
