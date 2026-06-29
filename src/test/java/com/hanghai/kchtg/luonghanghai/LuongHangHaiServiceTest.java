package com.hanghai.kchtg.luonghanghai;

import com.hanghai.kchtg.luonghanghai.dto.*;
import com.hanghai.kchtg.luonghanghai.entity.*;
import com.hanghai.kchtg.luonghanghai.repository.LuongHangHaiRepository;
import com.hanghai.kchtg.luonghanghai.service.LuongHangHaiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LuongHangHaiServiceTest {

    @Mock
    private LuongHangHaiRepository luongHangHaiRepository;

    @InjectMocks
    private LuongHangHaiService luongHangHaiService;

    private LuongHangHai testEntity;
    private LuongHangHaiCreateRequest createRequest;

    @BeforeEach
    void setUp() {
        testEntity = LuongHangHai.builder()
                .id(1L)
                .tenLuongHangHai("Tau cau cuoc Hai Phong")
                .soHieu("HH-001")
                .thoiGianDuKien(LocalDate.of(2026, 1, 1))
                .donViQuanLy("Cuc Quang bao Hai quan")
                .diaChi("Hai Phong")
                .tinhTrang(TinhTrang.HOAT_DONG)
                .trangThaiPheDuyet(TrangThaiPheDuyet.PROPOSED)
                .nguoiTao("Admin")
                .ngayTao(LocalDateTime.of(2026, 6, 1, 10, 0))
                .build();

        createRequest = LuongHangHaiCreateRequest.builder()
                .tenLuongHangHai("Tau moi")
                .soHieu("HH-002")
                .donViQuanLy("Cuc Quang bao")
                .diaChi("Ha Noi")
                .tinhTrang(TinhTrang.DANG_XAY_DUNG)
                .nguoiTao("User1")
                .build();
    }

    // -- CRUD Tests --

    @Test
    void create_shouldSaveEntity() {
        when(luongHangHaiRepository.save(any(LuongHangHai.class))).thenReturn(testEntity);

        LuongHangHaiResponse result = luongHangHaiService.create(createRequest);

        assertThat(result).isNotNull();
        assertThat(result.getTenLuongHangHai()).isEqualTo("Tau moi");
        assertThat(result.getTrangThaiPheDuyet()).isEqualTo(TrangThaiPheDuyet.PROPOSED);
        verify(luongHangHaiRepository, times(1)).save(any(LuongHangHai.class));
    }

    @Test
    void create_shouldSetDefaultApprovalStatusToProposed() {
        when(luongHangHaiRepository.save(any(LuongHangHai.class))).thenReturn(testEntity);

        LuongHangHaiResponse result = luongHangHaiService.create(createRequest);

        assertThat(result.getTrangThaiPheDuyet()).isEqualTo(TrangThaiPheDuyet.PROPOSED);
    }

    @Test
    void getById_shouldReturnResponse() {
        when(luongHangHaiRepository.findById(1L)).thenReturn(Optional.of(testEntity));

        LuongHangHaiResponse result = luongHangHaiService.getById(1L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getTenLuongHangHai()).isEqualTo("Tau cau cuoc Hai Phong");
    }

    @Test
    void getById_shouldThrowWhenNotFound() {
        when(luongHangHaiRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> luongHangHaiService.getById(99L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Khong tim thay");
    }

    @Test
    void findAll_shouldReturnListSortedByCreatedAtDesc() {
        when(luongHangHaiRepository.findAll(any(Sort.class)))
                .thenReturn(List.of(testEntity));

        List<LuongHangHaiResponse> result = luongHangHaiService.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTenLuongHangHai()).isEqualTo("Tau cau cuoc Hai Phong");
    }

    @Test
    void findAllPage_shouldReturnPage() {
        Page<LuongHangHai> page = new PageImpl<>(List.of(testEntity));
        when(luongHangHaiRepository.findAll(any(Pageable.class))).thenReturn(page);

        Page<LuongHangHaiResponse> result = luongHangHaiService.findAll(0, 20);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    @Test
    void update_shouldUpdateFields() {
        LuongHangHaiUpdateRequest updateReq = LuongHangHaiUpdateRequest.builder()
                .tenLuongHangHai("Da cap nhat")
                .diaChi("Da Nang")
                .build();

        testEntity.setTenLuongHangHai("Da cap nhat");
        testEntity.setDiaChi("Da Nang");
        when(luongHangHaiRepository.findById(1L)).thenReturn(Optional.of(testEntity));
        when(luongHangHaiRepository.save(any(LuongHangHai.class))).thenReturn(testEntity);

        LuongHangHaiResponse result = luongHangHaiService.update(1L, updateReq);

        assertThat(result.getTenLuongHangHai()).isEqualTo("Da cap nhat");
        assertThat(result.getDiaChi()).isEqualTo("Da Nang");
        verify(luongHangHaiRepository, times(1)).save(any(LuongHangHai.class));
    }

    @Test
    void update_shouldThrowWhenNotFound() {
        when(luongHangHaiRepository.findById(99L)).thenReturn(Optional.empty());

        LuongHangHaiUpdateRequest updateReq = LuongHangHaiUpdateRequest.builder()
                .tenLuongHangHai("Fail")
                .build();

        assertThatThrownBy(() -> luongHangHaiService.update(99L, updateReq))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Khong tim thay");
    }

    @Test
    void delete_shouldRemoveEntity() {
        when(luongHangHaiRepository.existsById(1L)).thenReturn(true);
        doNothing().when(luongHangHaiRepository).deleteById(1L);

        luongHangHaiService.delete(1L);

        verify(luongHangHaiRepository, times(1)).deleteById(1L);
    }

    @Test
    void delete_shouldThrowWhenNotFound() {
        when(luongHangHaiRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> luongHangHaiService.delete(99L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Khong tim thay");
    }

    // -- Approval Workflow Tests --

    @Test
    void approveC1_shouldTransitionFromProposedToUnderReview() {
        testEntity.setTrangThaiPheDuyet(TrangThaiPheDuyet.PROPOSED);
        when(luongHangHaiRepository.findById(1L)).thenReturn(Optional.of(testEntity));
        when(luongHangHaiRepository.save(any(LuongHangHai.class))).thenReturn(testEntity);

        PheDuyetRequest request = PheDuyetRequest.builder()
                .capPheDuyet("PHONG")
                .trangThai("APPROVED")
                .nguoiPheDuyet("Truong Phong")
                .build();

        PheDuyetResponse result = luongHangHaiService.approve(1L, request);

        assertThat(result.getTrangThai()).isEqualTo("UNDER_REVIEW");
        assertThat(result.getCapPheDuyet()).isEqualTo("PHONG");
        assertThat(result.getNguoiPheDuyet()).isEqualTo("Truong Phong");
    }

    @Test
    void approveC2_shouldTransitionFromUnderReviewToApproved() {
        testEntity.setTrangThaiPheDuyet(TrangThaiPheDuyet.UNDER_REVIEW);
        when(luongHangHaiRepository.findById(1L)).thenReturn(Optional.of(testEntity));
        when(luongHangHaiRepository.save(any(LuongHangHai.class))).thenReturn(testEntity);

        PheDuyetRequest request = PheDuyetRequest.builder()
                .capPheDuyet("CUC")
                .trangThai("APPROVED")
                .nguoiPheDuyet("Giam Doc")
                .build();

        PheDuyetResponse result = luongHangHaiService.approve(1L, request);

        assertThat(result.getTrangThai()).isEqualTo("APPROVED");
        assertThat(result.getCapPheDuyet()).isEqualTo("CUC");
    }

    @Test
    void approveC2_shouldTransitionFromUnderReviewToRejected() {
        testEntity.setTrangThaiPheDuyet(TrangThaiPheDuyet.UNDER_REVIEW);
        when(luongHangHaiRepository.findById(1L)).thenReturn(Optional.of(testEntity));
        when(luongHangHaiRepository.save(any(LuongHangHai.class))).thenReturn(testEntity);

        PheDuyetRequest request = PheDuyetRequest.builder()
                .capPheDuyet("CUC")
                .trangThai("REJECTED")
                .nguoiPheDuyet("Giam Doc")
                .lyDo("Khong phu hop")
                .build();

        PheDuyetResponse result = luongHangHaiService.approve(1L, request);

        assertThat(result.getTrangThai()).isEqualTo("REJECTED");
    }

    @Test
    void approve_shouldThrowWhenNotFound() {
        when(luongHangHaiRepository.findById(99L)).thenReturn(Optional.empty());

        PheDuyetRequest request = PheDuyetRequest.builder()
                .capPheDuyet("PHONG")
                .nguoiPheDuyet("Truong")
                .build();

        assertThatThrownBy(() -> luongHangHaiService.approve(99L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Khong tim thay");
    }

    @Test
    void approve_shouldDefaultCapPheDuyetToPhong() {
        testEntity.setTrangThaiPheDuyet(TrangThaiPheDuyet.PROPOSED);
        when(luongHangHaiRepository.findById(1L)).thenReturn(Optional.of(testEntity));
        when(luongHangHaiRepository.save(any(LuongHangHai.class))).thenReturn(testEntity);

        PheDuyetRequest request = PheDuyetRequest.builder()
                .trangThai("APPROVED")
                .nguoiPheDuyet("Truong")
                .build();

        PheDuyetResponse result = luongHangHaiService.approve(1L, request);

        assertThat(result.getCapPheDuyet()).isEqualTo("PHONG");
    }

    // -- History Tests --

    @Test
    void getHistory_shouldReturnHistoryEntries() {
        when(luongHangHaiRepository.findById(1L)).thenReturn(Optional.of(testEntity));

        List<HistoryEntry> history = luongHangHaiService.getHistory(1L);

        assertThat(history).isNotEmpty();
        assertThat(history.get(0).getSangTrangThai()).isEqualTo("PROPOSED");
        assertThat(history.get(0).getGhiChu()).isEqualTo("Tao moi luong hang hai");
    }

    @Test
    void getHistory_shouldThrowWhenNotFound() {
        when(luongHangHaiRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> luongHangHaiService.getHistory(99L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Khong tim thay");
    }

    // -- Filter Tests --

    @Test
    void findByTrangThaiPheDuyet_shouldReturnFiltered() {
        when(luongHangHaiRepository.findByTrangThaiPheDuyet(TrangThaiPheDuyet.APPROVED))
                .thenReturn(List.of(testEntity));

        List<LuongHangHaiResponse> result = luongHangHaiService.findByTrangThaiPheDuyet(TrangThaiPheDuyet.APPROVED);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTrangThaiPheDuyet()).isEqualTo(TrangThaiPheDuyet.APPROVED);
    }

    @Test
    void findByTinhTrang_shouldReturnFiltered() {
        when(luongHangHaiRepository.findByTinhTrang(TinhTrang.HOAT_DONG))
                .thenReturn(List.of(testEntity));

        List<LuongHangHaiResponse> result = luongHangHaiService.findByTinhTrang(TinhTrang.HOAT_DONG);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTinhTrang()).isEqualTo(TinhTrang.HOAT_DONG);
    }

    // -- Search Tests --

    @Test
    void searchByTenLuongHangHaiContaining_shouldReturnResults() {
        when(luongHangHaiRepository.findByTenLuongHangHaiContaining("Tau"))
                .thenReturn(List.of(testEntity));

        List<LuongHangHaiResponse> result = luongHangHaiService.searchByTenLuongHangHaiContaining("Tau");

        assertThat(result).hasSize(1);
    }

    @Test
    void searchByDonViQuanLyContaining_shouldReturnResults() {
        when(luongHangHaiRepository.findByDonViQuanLyContaining("Cuc"))
                .thenReturn(List.of(testEntity));

        List<LuongHangHaiResponse> result = luongHangHaiService.searchByDonViQuanLyContaining("Cuc");

        assertThat(result).hasSize(1);
    }

    @Test
    void searchDocuments_shouldReturnPaginatedResults() {
        Page<LuongHangHai> page = new PageImpl<>(List.of(testEntity));
        when(luongHangHaiRepository.searchDocuments(
                eq("Tau"), eq("Cuc"), any(), any(), any(Pageable.class)))
                .thenReturn(page);

        KetQuaTimKiemResponse result = luongHangHaiService.searchDocuments(
                "Tau", "Cuc", "HOAT_DONG", "APPROVED", 0, 20);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getResults()).hasSize(1);
    }

    @Test
    void searchDocuments_shouldHandleInvalidStatusStrings() {
        Page<LuongHangHai> page = new PageImpl<>(List.of(testEntity));
        when(luongHangHaiRepository.searchDocuments(
                eq(null), eq(null), any(), any(), any(Pageable.class)))
                .thenReturn(page);

        KetQuaTimKiemResponse result = luongHangHaiService.searchDocuments(
                null, null, "INVALID", "INVALID", 0, 20);

        // Should not throw, invalid enums are silently ignored
        assertThat(result).isNotNull();
    }
}
