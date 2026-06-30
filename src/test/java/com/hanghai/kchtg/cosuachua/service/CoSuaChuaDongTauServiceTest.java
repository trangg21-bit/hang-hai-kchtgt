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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CoSuaChuaDongTauServiceTest {

    @Mock
    private CoSuaChuaDongTauRepository repository;

    @Mock
    private CoSuaChuaDongTauAttachmentRepository attachmentRepository;

    @Mock
    private PheDuyetLichSuRepository historyRepository;

    @InjectMocks
    private CoSuaChuaDongTauService service;

    private CoSuaChuaDongTau entity;
    private CoSuaChuaDongTauCreateRequest createRequest;

    @BeforeEach
    void setUp() {
        entity = CoSuaChuaDongTau.builder()
                .id(1L)
                .tenCoSo("Cơ sở ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo("Sửa chữa")
                .trangThai("PROPOSED")
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
                .loaiCoSo("Sửa chữa")
                .build();

        // Mock attachmentRepository to return empty list so toResponse doesn't fail
        lenient().when(attachmentRepository.findByCoSuaChuaDongTauId(anyLong())).thenReturn(Collections.emptyList());
    }

    @Test
    void testCreate() {
        CoSuaChuaDongTau saved = CoSuaChuaDongTau.builder()
                .id(1L)
                .tenCoSo("Cơ sở ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo("Sửa chữa")
                .trangThai("PROPOSED")
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
        assertEquals("PROPOSED", response.getTrangThai());
        assertEquals("user1", response.getNguoiTao());
        verify(repository, times(1)).save(any());
        verify(historyRepository, times(1)).save(any());
    }

    @Test
    void testCreate_WithOptionalFields() {
        CoSuaChuaDongTauCreateRequest fullReq = CoSuaChuaDongTauCreateRequest.builder()
                .tenCoSo("Cơ sở ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo("Sửa chữa")
                .soDienThoai("0123456789")
                .email("test@example.com")
                .khaNang("Khả năng 100")
                .chuQuan("Bộ Quốc phòng")
                .build();

        CoSuaChuaDongTau saved = CoSuaChuaDongTau.builder()
                .id(1L)
                .tenCoSo("Cơ sở ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo("Sửa chữa")
                .soDienThoai("0123456789")
                .email("test@example.com")
                .khaNang("Khả năng 100")
                .chuQuan("Bộ Quốc phòng")
                .trangThai("PROPOSED")
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(false)
                .nguoiTao("user1")
                .attachments(new java.util.ArrayList<>())
                .build();

        when(repository.save(any())).thenReturn(saved);
        when(historyRepository.save(any())).thenReturn(mock(PheDuyetLichSu.class));

        CoSuaChuaDongTauResponse response = service.create(fullReq, "user1");

        assertNotNull(response);
        assertEquals("0123456789", response.getSoDienThoai());
        assertEquals("test@example.com", response.getEmail());
        assertEquals("Khả năng 100", response.getKhaNang());
        assertEquals("Bộ Quốc phòng", response.getChuQuan());
    }

    @Test
    void testGetById() {
        when(repository.findById(1L)).thenReturn(Optional.of(entity));

        CoSuaChuaDongTauResponse response = service.getById(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Cơ sở ABC", response.getTenCoSo());
        assertEquals("PROPOSED", response.getTrangThai());
    }

    @Test
    void testGetById_NotFound() {
        when(repository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.getById(999L));
    }

    @Test
    void testGetById_Deleted() {
        CoSuaChuaDongTau deletedEntity = CoSuaChuaDongTau.builder()
                .id(1L)
                .tenCoSo("ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo("Sửa chữa")
                .trangThai("APPROVED")
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(true)
                .nguoiTao("test")
                .attachments(new java.util.ArrayList<>())
                .build();

        when(repository.findById(1L)).thenReturn(Optional.of(deletedEntity));

        assertThrows(RuntimeException.class, () -> service.getById(1L));
    }

    @Test
    void testFindAll() {
        CoSuaChuaDongTau approvedEntity = CoSuaChuaDongTau.builder()
                .id(1L)
                .tenCoSo("Cơ sở ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo("Sửa chữa")
                .trangThai("APPROVED")
                .pheDuyetC1(true)
                .pheDuyetC2(true)
                .isDeleted(false)
                .nguoiTao("test")
                .attachments(new java.util.ArrayList<>())
                .build();

        List<CoSuaChuaDongTau> entities = Arrays.asList(approvedEntity);
        when(repository.findByTrangThaiAndIsDeletedFalse("APPROVED")).thenReturn(entities);

        List<CoSuaChuaDongTauResponse> responses = service.findAll(0, 20);

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("APPROVED", responses.get(0).getTrangThai());
        verify(repository, times(1)).findByTrangThaiAndIsDeletedFalse("APPROVED");
    }

    @Test
    void testFindAll_Empty() {
        when(repository.findByTrangThaiAndIsDeletedFalse("APPROVED")).thenReturn(Collections.emptyList());

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

        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        CoSuaChuaDongTau updatedEntity = CoSuaChuaDongTau.builder()
                .id(1L)
                .tenCoSo("Cơ sở mới")
                .diaChi("Đà Nẵng")
                .tinhThanh("Hà Nội")
                .loaiCoSo("Sửa chữa")
                .trangThai("PROPOSED")
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(false)
                .nguoiTao("test")
                .attachments(new java.util.ArrayList<>())
                .build();
        when(repository.save(any())).thenReturn(updatedEntity);
        when(historyRepository.save(any())).thenReturn(mock(PheDuyetLichSu.class));

        CoSuaChuaDongTauResponse response = service.update(1L, updateReq, "user1");

        assertNotNull(response);
        assertEquals("Cơ sở mới", response.getTenCoSo());
        assertEquals("Đà Nẵng", response.getDiaChi());
        verify(repository, times(1)).save(any());
        verify(historyRepository, times(1)).save(any());
    }

    @Test
    void testUpdate_ApprovedEntity_RevertsToUnderReview() {
        CoSuaChuaDongTau approvedEntity = CoSuaChuaDongTau.builder()
                .id(1L)
                .tenCoSo("ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo("Sửa chữa")
                .trangThai("APPROVED")
                .pheDuyetC1(true)
                .pheDuyetC2(true)
                .isDeleted(false)
                .nguoiTao("test")
                .attachments(new java.util.ArrayList<>())
                .build();

        CoSuaChuaDongTauUpdateRequest updateReqDto = CoSuaChuaDongTauUpdateRequest.builder()
                .tenCoSo("ABC mới").build();

        when(repository.findById(1L)).thenReturn(Optional.of(approvedEntity));
        when(repository.save(any())).thenReturn(approvedEntity);
        when(historyRepository.save(any())).thenReturn(mock(PheDuyetLichSu.class));

        CoSuaChuaDongTauResponse response = service.update(1L, updateReqDto, "user1");

        assertEquals("UNDER_REVIEW", response.getTrangThai());
        assertEquals("ABC mới", response.getTenCoSo());
        verify(repository, times(1)).save(any());
    }

    @Test
    void testUpdate_DeletedEntity_Throws() {
        CoSuaChuaDongTau deletedEntity = CoSuaChuaDongTau.builder()
                .id(1L)
                .tenCoSo("ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo("Sửa chữa")
                .trangThai("APPROVED")
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(true)
                .nguoiTao("test")
                .attachments(new java.util.ArrayList<>())
                .build();

        CoSuaChuaDongTauUpdateRequest updateReqDto = CoSuaChuaDongTauUpdateRequest.builder()
                .tenCoSo("ABC mới").build();

        when(repository.findById(1L)).thenReturn(Optional.of(deletedEntity));

        assertThrows(RuntimeException.class, () -> service.update(1L, updateReqDto, "user1"));
    }

    @Test
    void testUpdate_NotFound() {
        when(repository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.update(999L, new CoSuaChuaDongTauUpdateRequest(), "user1"));
    }

    @Test
    void testDelete_ApprovedEntity() {
        CoSuaChuaDongTau approvedEntity = CoSuaChuaDongTau.builder()
                .id(1L)
                .tenCoSo("ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo("Sửa chữa")
                .trangThai("APPROVED")
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(false)
                .nguoiTao("test")
                .attachments(new java.util.ArrayList<>())
                .build();

        when(repository.findById(1L)).thenReturn(Optional.of(approvedEntity));
        when(repository.save(any())).thenReturn(approvedEntity);
        when(historyRepository.save(any())).thenReturn(mock(PheDuyetLichSu.class));

        service.delete(1L, "user1");

        assertTrue(approvedEntity.getIsDeleted());
        verify(repository, times(1)).save(any());
        verify(attachmentRepository, times(1)).deleteByCoSuaChuaDongTauId(1L);
        verify(historyRepository, times(1)).save(any());
    }

    @Test
    void testDelete_NotApprovedEntity_Throws() {
        when(repository.findById(1L)).thenReturn(Optional.of(entity));

        assertThrows(RuntimeException.class, () -> service.delete(1L, "user1"));
    }

    @Test
    void testDelete_NotFound() {
        when(repository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.delete(999L, "user1"));
    }

    @Test
    void testApproveC1_Approve() {
        entity.setTrangThai("PROPOSED");
        PheDuyetRequest req = PheDuyetRequest.builder().quyetDinh("APPROVED").build();

        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(PheDuyetLichSu.class));

        CoSuaChuaDongTauResponse response = service.approveC1(1L, req, "admin");

        assertEquals("UNDER_REVIEW", entity.getTrangThai());
        assertTrue(entity.getPheDuyetC1());
        assertEquals("admin", entity.getNguoiPheDuyetC1());
        verify(repository, times(1)).save(any());
    }

    @Test
    void testApproveC1_Reject() {
        entity.setTrangThai("PROPOSED");
        PheDuyetRequest req = PheDuyetRequest.builder()
                .quyetDinh("REJECTED")
                .lyDo("Không đủ điều kiện")
                .build();

        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(PheDuyetLichSu.class));

        CoSuaChuaDongTauResponse response = service.approveC1(1L, req, "admin");

        assertEquals("REJECTED", entity.getTrangThai());
        assertEquals("Không đủ điều kiện", entity.getLyDoTuChoi());
    }

    @Test
    void testApproveC1_WrongStatus_Throws() {
        entity.setTrangThai("UNDER_REVIEW");
        PheDuyetRequest req = PheDuyetRequest.builder().quyetDinh("APPROVED").build();

        when(repository.findById(1L)).thenReturn(Optional.of(entity));

        assertThrows(RuntimeException.class, () -> service.approveC1(1L, req, "admin"));
    }

    @Test
    void testApproveC2_Approve() {
        entity.setTrangThai("UNDER_REVIEW");
        PheDuyetRequest req = PheDuyetRequest.builder().quyetDinh("APPROVED").build();

        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(PheDuyetLichSu.class));

        CoSuaChuaDongTauResponse response = service.approveC2(1L, req, "director");

        assertEquals("APPROVED", entity.getTrangThai());
        assertTrue(entity.getPheDuyetC2());
        assertEquals("director", entity.getNguoiPheDuyetC2());
        verify(repository, times(1)).save(any());
    }

    @Test
    void testApproveC2_Reject() {
        entity.setTrangThai("UNDER_REVIEW");
        PheDuyetRequest req = PheDuyetRequest.builder()
                .quyetDinh("REJECTED")
                .lyDo("Không phù hợp")
                .build();

        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(historyRepository.save(any())).thenReturn(mock(PheDuyetLichSu.class));

        CoSuaChuaDongTauResponse response = service.approveC2(1L, req, "director");

        assertEquals("REJECTED", entity.getTrangThai());
        assertEquals("Không phù hợp", entity.getLyDoTuChoi());
    }

    @Test
    void testApproveC2_WrongStatus_Throws() {
        entity.setTrangThai("PROPOSED");
        PheDuyetRequest req = PheDuyetRequest.builder().quyetDinh("APPROVED").build();

        when(repository.findById(1L)).thenReturn(Optional.of(entity));

        assertThrows(RuntimeException.class, () -> service.approveC2(1L, req, "director"));
    }

    @Test
    void testGetHistory() {
        PheDuyetLichSu history = PheDuyetLichSu.builder()
                .id(1L)
                .coSuaChuaId(1L)
                .capPheDuyet(1)
                .trangThai("APPROVED")
                .nguoiPheDuyet("admin")
                .ngayPheDuyet(LocalDateTime.now())
                .lyDo("Duyệt")
                .build();

        when(historyRepository.findByCoSuaChuaIdOrderByNgayPheDuyetDesc(1L)).thenReturn(Arrays.asList(history));

        List<HistoryEntry> entries = service.getHistory(1L);

        assertNotNull(entries);
        assertEquals(1, entries.size());
        assertEquals("admin", entries.get(0).getNguoiPheDuyet());
        assertEquals(1, entries.get(0).getCapPheDuyet());
        assertEquals("Duyệt", entries.get(0).getLyDo());
    }

    @Test
    void testGetHistory_Empty() {
        when(historyRepository.findByCoSuaChuaIdOrderByNgayPheDuyetDesc(1L)).thenReturn(Collections.emptyList());

        List<HistoryEntry> entries = service.getHistory(1L);

        assertNotNull(entries);
        assertTrue(entries.isEmpty());
    }

    @Test
    void testSearch_WithAllNull() {
        when(repository.search(null, null, null)).thenReturn(Collections.emptyList());

        List<CoSuaChuaDongTauResponse> responses = service.search(null, null, null);

        assertNotNull(responses);
        assertTrue(responses.isEmpty());
        verify(repository, times(1)).search(null, null, null);
    }

    @Test
    void testSearch_WithKeyword() {
        CoSuaChuaDongTau resultEntity = CoSuaChuaDongTau.builder()
                .id(1L)
                .tenCoSo("Cơ sở ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo("Sửa chữa")
                .trangThai("APPROVED")
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(false)
                .nguoiTao("test")
                .attachments(new java.util.ArrayList<>())
                .build();

        when(repository.search("ABC", null, null)).thenReturn(Arrays.asList(resultEntity));

        List<CoSuaChuaDongTauResponse> responses = service.search("ABC", null, null);

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("Cơ sở ABC", responses.get(0).getTenCoSo());
        verify(repository, times(1)).search("ABC", null, null);
    }

    @Test
    void testSearch_WithTinhThanh() {
        CoSuaChuaDongTau resultEntity = CoSuaChuaDongTau.builder()
                .id(1L)
                .tenCoSo("Cơ sở ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Đà Nẵng")
                .loaiCoSo("Sửa chữa")
                .trangThai("APPROVED")
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(false)
                .nguoiTao("test")
                .attachments(new java.util.ArrayList<>())
                .build();

        when(repository.search(null, "Đà Nẵng", null)).thenReturn(Arrays.asList(resultEntity));

        List<CoSuaChuaDongTauResponse> responses = service.search(null, "Đà Nẵng", null);

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("Đà Nẵng", responses.get(0).getTinhThanh());
    }

    @Test
    void testSearch_WithTrangThai() {
        CoSuaChuaDongTau resultEntity = CoSuaChuaDongTau.builder()
                .id(1L)
                .tenCoSo("Cơ sở ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo("Sửa chữa")
                .trangThai("REJECTED")
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(false)
                .nguoiTao("test")
                .attachments(new java.util.ArrayList<>())
                .build();

        when(repository.search(null, null, "REJECTED")).thenReturn(Arrays.asList(resultEntity));

        List<CoSuaChuaDongTauResponse> responses = service.search(null, null, "REJECTED");

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("REJECTED", responses.get(0).getTrangThai());
    }
}
