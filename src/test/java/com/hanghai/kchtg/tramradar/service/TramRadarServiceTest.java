package com.hanghai.kchtg.tramradar.service;

import com.hanghai.kchtg.tramradar.dto.*;
import com.hanghai.kchtg.tramradar.entity.*;
import com.hanghai.kchtg.tramradar.repository.ApprovalHistoryRepository;
import com.hanghai.kchtg.tramradar.repository.TramRadarRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TramRadarServiceTest {

    private static final UUID TEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID TEST_ID_2 = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock
    private TramRadarRepository repository;

    @Mock
    private ApprovalHistoryRepository historyRepository;

    @Mock
    private com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService gisSpatialObjectService;

    @InjectMocks
    private TramRadarService service;

    private TramRadar entity;
    private TramRadarCreateRequest createRequest;

    @BeforeEach
    void setUp() {
        lenient().when(gisSpatialObjectService.createOrUpdate(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenAnswer(inv -> {
                    com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject spatial = new com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject();
                    spatial.setId(UUID.randomUUID());
                    return spatial;
                });
        entity = TramRadar.builder()
                .id(TEST_ID)
                .tenTram("Tram ABC")
                .viTri("Hà Nội")
                .trangThai(com.hanghai.kchtg.tramradar.entity.TramRadarApprovalStatus.PROPOSED)
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(false)
                .nguoiTao("test")
                .ngayTao(LocalDateTime.now())
                .attachments(new java.util.ArrayList<>())
                .build();

        createRequest = TramRadarCreateRequest.builder()
                .tenTram("Tram ABC")
                .viTri("Hà Nội")
                .build();
    }

    @Test
    void testCreate() {
        TramRadar saved = TramRadar.builder()
                .id(TEST_ID).tenTram("Tram ABC").viTri("Hà Nội").trangThai(com.hanghai.kchtg.tramradar.entity.TramRadarApprovalStatus.PROPOSED)
                .pheDuyetC1(false).pheDuyetC2(false).isDeleted(false)
                .nguoiTao("user1").attachments(new java.util.ArrayList<>()).build();

        when(repository.save(any())).thenReturn(saved);
        when(historyRepository.save(any())).thenReturn(mock(ApprovalHistory.class));

        TramRadarResponse response = service.create(createRequest, "user1");
        assertNotNull(response);
        assertEquals(com.hanghai.kchtg.tramradar.entity.TramRadarApprovalStatus.PROPOSED, response.getTrangThai());
        verify(repository, times(1)).save(any());
    }

    @Test
    void testGetById() {
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        TramRadarResponse response = service.getById(TEST_ID);
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
        TramRadarUpdateRequest updateReq = TramRadarUpdateRequest.builder()
                .tenTram("Tram mới").build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(ApprovalHistory.class));

        TramRadarResponse response = service.update(TEST_ID, updateReq, "user1");
        assertNotNull(response);
        verify(repository, times(1)).save(any());
    }

    @Test
    void testDelete_ApprovedEntity() {
        TramRadar approvedEntity = TramRadar.builder()
                .id(TEST_ID).tenTram("ABC").viTri("Hà Nội").trangThai(com.hanghai.kchtg.tramradar.entity.TramRadarApprovalStatus.APPROVED)
                .pheDuyetC1(false).pheDuyetC2(false).isDeleted(false)
                .nguoiTao("test").attachments(new java.util.ArrayList<>()).build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(approvedEntity));
        when(repository.save(any())).thenReturn(approvedEntity);
        when(historyRepository.save(any())).thenReturn(mock(ApprovalHistory.class));

        service.delete(TEST_ID, "user1");
        assertTrue(approvedEntity.getIsDeleted());
    }

    @Test
    void testDelete_NotApprovedEntity_Throws() {
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        assertThrows(RuntimeException.class, () -> service.delete(TEST_ID, "user1"));
    }

    @Test
    void testApproveC1_Approve() {
        ApprovalRequest req = ApprovalRequest.builder().quyetDinh("APPROVED").build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(ApprovalHistory.class));

        TramRadarResponse response = service.approveC1(TEST_ID, req, "admin");
        assertEquals(com.hanghai.kchtg.tramradar.entity.TramRadarApprovalStatus.UNDER_REVIEW, entity.getTrangThai());
        assertTrue(entity.getPheDuyetC1());
    }

    @Test
    void testApproveC2_Approve() {
        entity.setTrangThai(com.hanghai.kchtg.tramradar.entity.TramRadarApprovalStatus.UNDER_REVIEW);
        ApprovalRequest req = ApprovalRequest.builder().quyetDinh("APPROVED").build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(ApprovalHistory.class));

        TramRadarResponse response = service.approveC2(TEST_ID, req, "director");
        assertEquals(com.hanghai.kchtg.tramradar.entity.TramRadarApprovalStatus.APPROVED, entity.getTrangThai());
        assertTrue(entity.getPheDuyetC2());
    }

    @Test
    void testApproveC2_sameActorAsC1_throwsException() {
        entity.setTrangThai(com.hanghai.kchtg.tramradar.entity.TramRadarApprovalStatus.UNDER_REVIEW);
        entity.setPheDuyetC1(true);
        entity.setNguoiPheDuyetC1("user1");
        ApprovalRequest req = ApprovalRequest.builder().quyetDinh("APPROVED").build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> service.approveC2(TEST_ID, req, "user1"));
        assertTrue(ex.getMessage().contains("Nguoi phe duyet C2 khong duoc trung"));
    }

    @Test
    void testRejectC1() {
        ApprovalRequest req = ApprovalRequest.builder().quyetDinh("REJECTED").reason("Không đủ điều kiện").build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(ApprovalHistory.class));

        TramRadarResponse response = service.approveC1(TEST_ID, req, "admin");
        assertEquals(com.hanghai.kchtg.tramradar.entity.TramRadarApprovalStatus.REJECTED, entity.getTrangThai());
        assertEquals("Không đủ điều kiện", entity.getLyDoTuChoi());
    }

    @Test
    void testGetHistory() {
        ApprovalHistory history = ApprovalHistory.builder()
                .id(1L).tramRadarId(TEST_ID).approvalLevel(1)
                .status("APPROVED").approvedBy("admin")
                .approvedDate(LocalDateTime.now()).reason("Duyệt").build();
        when(historyRepository.findByTramRadarIdOrderByApprovedDateDesc(TEST_ID)).thenReturn(Arrays.asList(history));

        List<HistoryEntry> entries = service.getHistory(TEST_ID);
        assertNotNull(entries);
        assertEquals(1, entries.size());
        assertEquals("admin", entries.get(0).getApprovedBy());
    }

    @Test
    void testSearch() {
        when(repository.search(null, null, null, null, Pageable.unpaged())).thenReturn(org.springframework.data.domain.Page.empty());
        List<TramRadarResponse> responses = service.search(null, null, null, null);
        assertNotNull(responses);
        assertTrue(responses.isEmpty());
    }
}
