package com.hanghai.kchtg.tramradar.service;

import com.hanghai.kchtg.tramradar.dto.*;
import com.hanghai.kchtg.tramradar.entity.*;
import com.hanghai.kchtg.tramradar.repository.PheDuyetLichSuRepository;
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

import org.springframework.data.domain.Pageable;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TramRadarServiceTest {

    @Mock
    private TramRadarRepository repository;

    @Mock
    private PheDuyetLichSuRepository historyRepository;

    @InjectMocks
    private TramRadarService service;

    private TramRadar entity;
    private TramRadarCreateRequest createRequest;

    @BeforeEach
    void setUp() {
        entity = TramRadar.builder()
                .id(1L)
                .tenTram("Tram ABC")
                .viTri("Hà Nội")
                .trangThai("PROPOSED")
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
                .id(1L).tenTram("Tram ABC").viTri("Hà Nội").trangThai("PROPOSED")
                .pheDuyetC1(false).pheDuyetC2(false).isDeleted(false)
                .nguoiTao("user1").attachments(new java.util.ArrayList<>()).build();

        when(repository.save(any())).thenReturn(saved);
        when(historyRepository.save(any())).thenReturn(mock(PheDuyetLichSu.class));

        TramRadarResponse response = service.create(createRequest, "user1");
        assertNotNull(response);
        assertEquals("PROPOSED", response.getTrangThai());
        verify(repository, times(1)).save(any());
    }

    @Test
    void testGetById() {
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        TramRadarResponse response = service.getById(1L);
        assertNotNull(response);
        assertEquals(1L, response.getId());
    }

    @Test
    void testGetById_NotFound() {
        when(repository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.getById(999L));
    }

    @Test
    void testUpdate() {
        TramRadarUpdateRequest updateReq = TramRadarUpdateRequest.builder()
                .tenTram("Tram mới").build();
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(PheDuyetLichSu.class));

        TramRadarResponse response = service.update(1L, updateReq, "user1");
        assertNotNull(response);
        verify(repository, times(1)).save(any());
    }

    @Test
    void testDelete_ApprovedEntity() {
        TramRadar approvedEntity = TramRadar.builder()
                .id(1L).tenTram("ABC").viTri("Hà Nội").trangThai("APPROVED")
                .pheDuyetC1(false).pheDuyetC2(false).isDeleted(false)
                .nguoiTao("test").attachments(new java.util.ArrayList<>()).build();

        when(repository.findById(1L)).thenReturn(Optional.of(approvedEntity));
        when(repository.save(any())).thenReturn(approvedEntity);
        when(historyRepository.save(any())).thenReturn(mock(PheDuyetLichSu.class));

        service.delete(1L, "user1");
        assertTrue(approvedEntity.getIsDeleted());
    }

    @Test
    void testDelete_NotApprovedEntity_Throws() {
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        assertThrows(RuntimeException.class, () -> service.delete(1L, "user1"));
    }

    @Test
    void testApproveC1_Approve() {
        PheDuyetRequest req = PheDuyetRequest.builder().quyetDinh("APPROVED").build();
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(PheDuyetLichSu.class));

        TramRadarResponse response = service.approveC1(1L, req, "admin");
        assertEquals("UNDER_REVIEW", entity.getTrangThai());
        assertTrue(entity.getPheDuyetC1());
    }

    @Test
    void testApproveC2_Approve() {
        entity.setTrangThai("UNDER_REVIEW");
        PheDuyetRequest req = PheDuyetRequest.builder().quyetDinh("APPROVED").build();
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(PheDuyetLichSu.class));

        TramRadarResponse response = service.approveC2(1L, req, "director");
        assertEquals("APPROVED", entity.getTrangThai());
        assertTrue(entity.getPheDuyetC2());
    }

    @Test
    void testApproveC2_sameActorAsC1_throwsException() {
        entity.setTrangThai("UNDER_REVIEW");
        entity.setPheDuyetC1(true);
        entity.setNguoiPheDuyetC1("user1");
        PheDuyetRequest req = PheDuyetRequest.builder().quyetDinh("APPROVED").build();

        when(repository.findById(1L)).thenReturn(Optional.of(entity));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> service.approveC2(1L, req, "user1"));
        assertTrue(ex.getMessage().contains("Nguoi phe duyet C2 khong duoc trung voi nguoi phe duyet C1"));
    }

    @Test
    void testRejectC1() {
        PheDuyetRequest req = PheDuyetRequest.builder().quyetDinh("REJECTED").lyDo("Không đủ điều kiện").build();
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(PheDuyetLichSu.class));

        TramRadarResponse response = service.approveC1(1L, req, "admin");
        assertEquals("REJECTED", entity.getTrangThai());
        assertEquals("Không đủ điều kiện", entity.getLyDoTuChoi());
    }

    @Test
    void testGetHistory() {
        PheDuyetLichSu history = PheDuyetLichSu.builder()
                .id(1L).tramRadarId(1L).capPheDuyet(1)
                .trangThai("APPROVED").nguoiPheDuyet("admin")
                .ngayPheDuyet(LocalDateTime.now()).lyDo("Duyệt").build();
        when(historyRepository.findByTramRadarIdOrderByNgayPheDuyetDesc(1L)).thenReturn(Arrays.asList(history));

        List<HistoryEntry> entries = service.getHistory(1L);
        assertNotNull(entries);
        assertEquals(1, entries.size());
        assertEquals("admin", entries.get(0).getNguoiPheDuyet());
    }

    @Test
    void testSearch() {
        when(repository.search(null, null, null, Pageable.unpaged())).thenReturn(org.springframework.data.domain.Page.empty());
        List<TramRadarResponse> responses = service.search(null, null, null);
        assertNotNull(responses);
        assertTrue(responses.isEmpty());
    }
}
