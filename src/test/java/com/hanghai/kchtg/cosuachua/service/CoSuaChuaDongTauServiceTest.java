package com.hanghai.kchtg.cosuachua.service;

import com.hanghai.kchtg.cosuachua.dto.*;
import com.hanghai.kchtg.cosuachua.entity.*;
import com.hanghai.kchtg.cosuachua.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CoSuaChuaDongTauServiceTest {

    private static final UUID TEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID TEST_ID_2 = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock
    private CoSuaChuaDongTauRepository repository;

    @Mock
    private CoSuaChuaDongTauAttachmentRepository attachmentRepository;

    @Mock
    private PheDuyetLichSuRepository historyRepository;

    @Mock
    private com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService gisSpatialObjectService;

    @InjectMocks
    private CoSuaChuaDongTauService service;

    private CoSuaChuaDongTau entity;
    private CoSuaChuaDongTauCreateRequest createRequest;

    @BeforeEach
    void setUp() {
        lenient().when(gisSpatialObjectService.createOrUpdate(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenAnswer(inv -> {
                    com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject spatial = new com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject();
                    spatial.setId(UUID.randomUUID());
                    return spatial;
                });
        entity = CoSuaChuaDongTau.builder()
                .id(TEST_ID)
                .tenCoSo("Cơ sở ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo(LoaiCoSo.CS_SUA_CHUA)
                .trangThai(com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.PROPOSED)
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(false)
                .nguoiTao("test")
                .attachments(new java.util.ArrayList<>())
                .build();

        createRequest = CoSuaChuaDongTauCreateRequest.builder()
                .tenCoSo("Cơ sở ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo(LoaiCoSo.CS_SUA_CHUA)
                .build();

        // Mock attachmentRepository to return empty list so toResponse doesn't fail
        lenient().when(attachmentRepository.findByCoSuaChuaDongTauId(any(UUID.class))).thenReturn(Collections.emptyList());
    }

    @Test
    void testCreate() {
        CoSuaChuaDongTau saved = CoSuaChuaDongTau.builder()
                .id(TEST_ID)
                .tenCoSo("Cơ sở ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo(LoaiCoSo.CS_SUA_CHUA)
                .trangThai(com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.PROPOSED)
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(false)
                .nguoiTao("user1")
                .attachments(new java.util.ArrayList<>())
                .build();

        when(repository.save(any())).thenReturn(saved);
        when(historyRepository.save(any())).thenReturn(mock(PheDuyetLichSu.class));

        CoSuaChuaDongTauResponse response = service.create(createRequest, "user1");

        assertNotNull(response);
        assertEquals(com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.PROPOSED, response.getTrangThai());
        assertEquals("user1", response.getNguoiTao());
        verify(repository, times(1)).save(any());
        verify(historyRepository, times(1)).save(any());
    }

    @Test
    void testGetById() {
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));

        CoSuaChuaDongTauResponse response = service.getById(TEST_ID);

        assertNotNull(response);
        assertEquals("Cơ sở ABC", response.getTenCoSo());
        verify(repository, times(1)).findById(TEST_ID);
    }

    @Test
    void testGetById_NotFound() {
        when(repository.findById(TEST_ID_2)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.getById(TEST_ID_2));
    }

    @Test
    void testFindAll() {
        CoSuaChuaDongTau approvedEntity = CoSuaChuaDongTau.builder()
                .id(TEST_ID)
                .tenCoSo("Cơ sở ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo(LoaiCoSo.CS_SUA_CHUA)
                .trangThai(com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.APPROVED)
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(false)
                .nguoiTao("test")
                .attachments(new java.util.ArrayList<>())
                .build();

        List<CoSuaChuaDongTau> entities = Arrays.asList(approvedEntity);
        when(repository.findByTrangThaiAndIsDeletedFalse(com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.APPROVED)).thenReturn(entities);

        List<CoSuaChuaDongTauResponse> responses = service.findAll(0, 20);

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals(com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.APPROVED, responses.get(0).getTrangThai());
        verify(repository, times(1)).findByTrangThaiAndIsDeletedFalse(com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.APPROVED);
    }

    @Test
    void testFindAll_Empty() {
        when(repository.findByTrangThaiAndIsDeletedFalse(com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.APPROVED)).thenReturn(Collections.emptyList());

        List<CoSuaChuaDongTauResponse> responses = service.findAll(0, 20);

        assertNotNull(responses);
        assertTrue(responses.isEmpty());
    }

    @Test
    void testUpdate() {
        CoSuaChuaDongTauUpdateRequest updateReq = CoSuaChuaDongTauUpdateRequest.builder()
                .tenCoSo("Cơ sở mới")
                .diaChi("Đà Nẵng")
                .build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        CoSuaChuaDongTau updatedEntity = CoSuaChuaDongTau.builder()
                .id(TEST_ID)
                .tenCoSo("Cơ sở mới")
                .diaChi("Đà Nẵng")
                .tinhThanh("Hà Nội")
                .loaiCoSo(LoaiCoSo.CS_SUA_CHUA)
                .trangThai(com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.PROPOSED)
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(false)
                .nguoiTao("test")
                .attachments(new java.util.ArrayList<>())
                .build();
        when(repository.save(any())).thenReturn(updatedEntity);
        when(historyRepository.save(any())).thenReturn(mock(PheDuyetLichSu.class));

        CoSuaChuaDongTauResponse response = service.update(TEST_ID, updateReq, "user1");

        assertNotNull(response);
        assertEquals("Cơ sở mới", response.getTenCoSo());
        assertEquals("Đà Nẵng", response.getDiaChi());
        verify(repository, times(1)).save(any());
        verify(historyRepository, times(1)).save(any());
    }

    @Test
    void testUpdate_ApprovedEntity_RevertsToUnderReview() {
        CoSuaChuaDongTau approvedEntity = CoSuaChuaDongTau.builder()
                .id(TEST_ID)
                .tenCoSo("ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo(LoaiCoSo.CS_SUA_CHUA)
                .trangThai(com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.APPROVED)
                .pheDuyetC1(true)
                .pheDuyetC2(true)
                .isDeleted(false)
                .nguoiTao("test")
                .attachments(new java.util.ArrayList<>())
                .build();

        CoSuaChuaDongTauUpdateRequest updateReqDto = CoSuaChuaDongTauUpdateRequest.builder()
                .tenCoSo("ABC mới").build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(approvedEntity));
        when(repository.save(any())).thenReturn(approvedEntity);
        when(historyRepository.save(any())).thenReturn(mock(PheDuyetLichSu.class));

        CoSuaChuaDongTauResponse response = service.update(TEST_ID, updateReqDto, "user1");

        assertEquals(com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.UNDER_REVIEW, response.getTrangThai());
        assertEquals("ABC mới", response.getTenCoSo());
        verify(repository, times(1)).save(any());
    }

    @Test
    void testUpdate_DeletedEntity_Throws() {
        CoSuaChuaDongTau deletedEntity = CoSuaChuaDongTau.builder()
                .id(TEST_ID)
                .tenCoSo("ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo(LoaiCoSo.CS_SUA_CHUA)
                .trangThai(com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.APPROVED)
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(true)
                .nguoiTao("test")
                .attachments(new java.util.ArrayList<>())
                .build();

        CoSuaChuaDongTauUpdateRequest updateReqDto = CoSuaChuaDongTauUpdateRequest.builder()
                .tenCoSo("ABC mới").build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(deletedEntity));

        assertThrows(RuntimeException.class, () -> service.update(TEST_ID, updateReqDto, "user1"));
    }

    @Test
    void testUpdate_NotFound() {
        when(repository.findById(TEST_ID_2)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.update(TEST_ID_2, new CoSuaChuaDongTauUpdateRequest(), "user1"));
    }

    @Test
    void testDelete_ApprovedEntity() {
        CoSuaChuaDongTau approvedEntity = CoSuaChuaDongTau.builder()
                .id(TEST_ID)
                .tenCoSo("ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo(LoaiCoSo.CS_SUA_CHUA)
                .trangThai(com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.APPROVED)
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(false)
                .nguoiTao("test")
                .attachments(new java.util.ArrayList<>())
                .build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(approvedEntity));
        when(repository.save(any())).thenReturn(approvedEntity);
        when(historyRepository.save(any())).thenReturn(mock(PheDuyetLichSu.class));

        service.delete(TEST_ID, "user1");

        assertTrue(approvedEntity.getIsDeleted());
        verify(repository, times(1)).save(any());
        verify(attachmentRepository, times(1)).deleteByCoSuaChuaDongTauId(TEST_ID);
        verify(historyRepository, times(1)).save(any());
    }

    @Test
    void testDelete_NotApprovedEntity_Throws() {
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));

        assertThrows(RuntimeException.class, () -> service.delete(TEST_ID, "user1"));
    }

    @Test
    void testDelete_NotFound() {
        when(repository.findById(TEST_ID_2)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.delete(TEST_ID_2, "user1"));
    }

    @Test
    void testApproveC1_Approve() {
        entity.setTrangThai(com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.PROPOSED);
        PheDuyetRequest req = PheDuyetRequest.builder().quyetDinh("APPROVED").build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(PheDuyetLichSu.class));

        CoSuaChuaDongTauResponse response = service.approveC1(TEST_ID, req, "admin");

        assertEquals(com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.UNDER_REVIEW, entity.getTrangThai());
        assertTrue(entity.getPheDuyetC1());
        assertEquals("admin", entity.getNguoiPheDuyetC1());
        verify(repository, times(1)).save(any());
    }

    @Test
    void testApproveC1_Reject() {
        entity.setTrangThai(com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.PROPOSED);
        PheDuyetRequest req = PheDuyetRequest.builder()
                .quyetDinh("REJECTED")
                .lyDo("Không đủ điều kiện")
                .build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(PheDuyetLichSu.class));

        CoSuaChuaDongTauResponse response = service.approveC1(TEST_ID, req, "admin");

        assertEquals(com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.REJECTED, entity.getTrangThai());
        assertEquals("Không đủ điều kiện", entity.getLyDoTuChoi());
    }

    @Test
    void testApproveC1_WrongStatus_Throws() {
        entity.setTrangThai(com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.UNDER_REVIEW);
        PheDuyetRequest req = PheDuyetRequest.builder().quyetDinh("APPROVED").build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));

        assertThrows(RuntimeException.class, () -> service.approveC1(TEST_ID, req, "admin"));
    }

    @Test
    void testApproveC2_Approve() {
        entity.setTrangThai(com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.UNDER_REVIEW);
        PheDuyetRequest req = PheDuyetRequest.builder().quyetDinh("APPROVED").build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(PheDuyetLichSu.class));

        CoSuaChuaDongTauResponse response = service.approveC2(TEST_ID, req, "director");

        assertEquals(com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.APPROVED, entity.getTrangThai());
        assertTrue(entity.getPheDuyetC2());
        assertEquals("director", entity.getNguoiPheDuyetC2());
        verify(repository, times(1)).save(any());
    }

    @Test
    void testApproveC2_Reject() {
        entity.setTrangThai(com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.UNDER_REVIEW);
        PheDuyetRequest req = PheDuyetRequest.builder()
                .quyetDinh("REJECTED")
                .lyDo("Không phù hợp")
                .build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(PheDuyetLichSu.class));

        CoSuaChuaDongTauResponse response = service.approveC2(TEST_ID, req, "director");

        assertEquals(com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.REJECTED, entity.getTrangThai());
        assertEquals("Không phù hợp", entity.getLyDoTuChoi());
    }

    @Test
    void testApproveC2_WrongStatus_Throws() {
        entity.setTrangThai(com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.PROPOSED);
        PheDuyetRequest req = PheDuyetRequest.builder().quyetDinh("APPROVED").build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));

        assertThrows(RuntimeException.class, () -> service.approveC2(TEST_ID, req, "director"));
    }

    @Test
    void testApproveC2_sameActorAsC1_throwsException() {
        entity.setTrangThai(com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.UNDER_REVIEW);
        entity.setPheDuyetC1(true);
        entity.setNguoiPheDuyetC1("user1");
        PheDuyetRequest req = PheDuyetRequest.builder().quyetDinh("APPROVED").build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> service.approveC2(TEST_ID, req, "user1"));
        assertTrue(ex.getMessage().contains("Nguoi phe duyet C2 khong duoc trung"));
    }

    @Test
    void testGetHistory() {
        PheDuyetLichSu history = PheDuyetLichSu.builder()
                .id(1L)
                .coSuaChuaId(TEST_ID)
                .capPheDuyet(1)
                .trangThai("APPROVED")
                .nguoiPheDuyet("admin")
                .ngayPheDuyet(LocalDateTime.now())
                .lyDo("Duyệt")
                .build();

        when(historyRepository.findByCoSuaChuaIdOrderByNgayPheDuyetDesc(TEST_ID)).thenReturn(Arrays.asList(history));

        List<HistoryEntry> entries = service.getHistory(TEST_ID);

        assertNotNull(entries);
        assertEquals(1, entries.size());
        assertEquals("admin", entries.get(0).getNguoiPheDuyet());
        assertEquals(1, entries.get(0).getCapPheDuyet());
        assertEquals("Duyệt", entries.get(0).getLyDo());
    }

    @Test
    void testGetHistory_Empty() {
        when(historyRepository.findByCoSuaChuaIdOrderByNgayPheDuyetDesc(TEST_ID)).thenReturn(Collections.emptyList());

        List<HistoryEntry> entries = service.getHistory(TEST_ID);

        assertNotNull(entries);
        assertTrue(entries.isEmpty());
    }

    @Test
    void testSearch_WithAllNull() {
        when(repository.search(null, null, null, null, null)).thenReturn(Collections.emptyList());

        List<CoSuaChuaDongTauResponse> responses = service.search(null, null, null, null, null);

        assertNotNull(responses);
        assertTrue(responses.isEmpty());
        verify(repository, times(1)).search(null, null, null, null, null);
    }

    @Test
    void testSearch_WithKeyword() {
        CoSuaChuaDongTau resultEntity = CoSuaChuaDongTau.builder()
                .id(TEST_ID)
                .tenCoSo("Cơ sở ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo(LoaiCoSo.CS_SUA_CHUA)
                .trangThai(com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.APPROVED)
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(false)
                .nguoiTao("test")
                .attachments(new java.util.ArrayList<>())
                .build();

        when(repository.search(null, "%abc%", null, null, null)).thenReturn(Arrays.asList(resultEntity));

        List<CoSuaChuaDongTauResponse> responses = service.search(null, "ABC", null, null, null);

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("Cơ sở ABC", responses.get(0).getTenCoSo());
        verify(repository, times(1)).search(null, "%abc%", null, null, null);
    }

    @Test
    void testSearch_WithTinhThanh() {
        CoSuaChuaDongTau resultEntity = CoSuaChuaDongTau.builder()
                .id(TEST_ID)
                .tenCoSo("Cơ sở ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Đà Nẵng")
                .loaiCoSo(LoaiCoSo.CS_SUA_CHUA)
                .trangThai(com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.APPROVED)
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(false)
                .nguoiTao("test")
                .attachments(new java.util.ArrayList<>())
                .build();

        when(repository.search(null, null, "%đà nẵng%", null, null)).thenReturn(Arrays.asList(resultEntity));

        List<CoSuaChuaDongTauResponse> responses = service.search(null, null, "Đà Nẵng", null, null);

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("Đà Nẵng", responses.get(0).getTinhThanh());
    }

    @Test
    void testSearch_WithTrangThai() {
        CoSuaChuaDongTau resultEntity = CoSuaChuaDongTau.builder()
                .id(TEST_ID)
                .tenCoSo("Cơ sở ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo(LoaiCoSo.CS_SUA_CHUA)
                .trangThai(com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.REJECTED)
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(false)
                .nguoiTao("test")
                .attachments(new java.util.ArrayList<>())
                .build();

        when(repository.search(null, null, null, com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.REJECTED, null)).thenReturn(Arrays.asList(resultEntity));

        List<CoSuaChuaDongTauResponse> responses = service.search(null, null, null, "REJECTED", null);

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals(com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus.REJECTED, responses.get(0).getTrangThai());
    }
}
