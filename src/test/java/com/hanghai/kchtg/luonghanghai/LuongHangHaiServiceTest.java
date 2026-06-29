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

    @Mock LuongHangHaiRepository repo;
    @InjectMocks LuongHangHaiService service;

    private LuongHangHai testEntity;
    private LuongHangHaiCreateRequest createReq;

    @BeforeEach void setUp() {
        testEntity = LuongHangHai.builder()
                .id(1L).tenLuongHangHai("Tau test")
                .soHieu("HH-001").thoiGianDuKien(LocalDate.of(2026,1,1))
                .donViQuanLy("Cuc").diaChi("Ha Noi")
                .tinhTrang(TinhTrang.HOAT_DONG)
                .trangThaiPheDuyet(TrangThaiPheDuyet.PROPOSED)
                .nguoiTao("Admin")
                .ngayTao(LocalDateTime.of(2026,6,1,10,0)).build();
        createReq = LuongHangHaiCreateRequest.builder()
                .tenLuongHangHai("Tau moi").donViQuanLy("Cuc").diaChi("DN")
                .tinhTrang(TinhTrang.DANG_XAY_DUNG).nguoiTao("User1").build();
    }

    @Test void create_shouldSaveEntity() {
        when(repo.save(any())).thenReturn(testEntity);
        LuongHangHaiResponse r = service.create(createReq);
        assertThat(r).isNotNull();
        assertThat(r.getTenLuongHangHai()).isEqualTo("Tau test");
        assertThat(r.getTrangThaiPheDuyet()).isEqualTo(TrangThaiPheDuyet.PROPOSED);
        verify(repo, times(1)).save(any());
    }

    @Test void create_shouldSetDefaultStatusToProposed() {
        when(repo.save(any())).thenReturn(testEntity);
        assertThat(service.create(createReq).getTrangThaiPheDuyet()).isEqualTo(TrangThaiPheDuyet.PROPOSED);
    }

    @Test void getById_shouldReturnResponse() {
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        assertThat(service.getById(1L).getTenLuongHangHai()).isEqualTo("Tau test");
    }

    @Test void getById_shouldThrowWhenNotFound() {
        when(repo.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getById(99L))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Khong tim thay");
    }

    @Test void findAll_shouldReturnSorted() {
        when(repo.findAll(any(Sort.class))).thenReturn(List.of(testEntity));
        assertThat(service.findAll()).hasSize(1);
    }

    @Test void findAllPage_shouldReturnPage() {
        when(repo.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(testEntity)));
        assertThat(service.findAll(0,20).getContent()).hasSize(1);
    }

    @Test void update_shouldUpdateFields() {
        LuongHangHaiUpdateRequest ur = LuongHangHaiUpdateRequest.builder()
                .tenLuongHangHai("Da cap nhat").diaChi("Da Nang").build();
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);
        LuongHangHaiResponse r = service.update(1L, ur);
        assertThat(r.getTenLuongHangHai()).isEqualTo("Da cap nhat");
        verify(repo, times(1)).save(any());
    }

    @Test void update_shouldThrowWhenNotFound() {
        when(repo.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, LuongHangHaiUpdateRequest.builder().build()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test void delete_shouldRemoveEntity() {
        when(repo.existsById(1L)).thenReturn(true);
        doNothing().when(repo).deleteById(1L);
        service.delete(1L);
        verify(repo, times(1)).deleteById(1L);
    }

    @Test void delete_shouldThrowWhenNotFound() {
        when(repo.existsById(99L)).thenReturn(false);
        assertThatThrownBy(() -> service.delete(99L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test void approveC1_shouldTransitionProposedToUnderReview() {
        testEntity.setTrangThaiPheDuyet(TrangThaiPheDuyet.PROPOSED);
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);
        PheDuyetResponse r = service.approve(1L, PheDuyetRequest.builder()
                .capPheDuyet("PHONG").trangThai("APPROVED").nguoiPheDuyet("Truong").build());
        assertThat(r.getTrangThai()).isEqualTo("UNDER_REVIEW");
        assertThat(r.getCapPheDuyet()).isEqualTo("PHONG");
    }

    @Test void approveC2_shouldTransitionUnderReviewToApproved() {
        testEntity.setTrangThaiPheDuyet(TrangThaiPheDuyet.UNDER_REVIEW);
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);
        PheDuyetResponse r = service.approve(1L, PheDuyetRequest.builder()
                .capPheDuyet("CUC").trangThai("APPROVED").nguoiPheDuyet("Giam Doc").build());
        assertThat(r.getTrangThai()).isEqualTo("APPROVED");
        assertThat(r.getCapPheDuyet()).isEqualTo("CUC");
    }

    @Test void approveC2_shouldTransitionUnderReviewToRejected() {
        testEntity.setTrangThaiPheDuyet(TrangThaiPheDuyet.UNDER_REVIEW);
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);
        PheDuyetResponse r = service.approve(1L, PheDuyetRequest.builder()
                .capPheDuyet("CUC").trangThai("REJECTED").nguoiPheDuyet("Giam Doc").ghiChu("Khong phu hop").build());
        assertThat(r.getTrangThai()).isEqualTo("REJECTED");
    }

    @Test void approve_shouldThrowWhenNotFound() {
        when(repo.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.approve(99L, PheDuyetRequest.builder().build()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test void approve_shouldDefaultCapPheDuyetToPhong() {
        testEntity.setTrangThaiPheDuyet(TrangThaiPheDuyet.PROPOSED);
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);
        PheDuyetResponse r = service.approve(1L, PheDuyetRequest.builder()
                .nguoiPheDuyet("Truong").build());
        assertThat(r.getCapPheDuyet()).isEqualTo("PHONG");
    }

    @Test void getHistory_shouldReturnEntries() {
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        List<HistoryEntry> h = service.getHistory(1L);
        assertThat(h).isNotEmpty();
        assertThat(h.get(0).getSangTrangThai()).isEqualTo("PROPOSED");
    }

    @Test void getHistory_shouldThrowWhenNotFound() {
        when(repo.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getHistory(99L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test void findByTrangThaiPheDuyet_shouldReturnFiltered() {
        when(repo.findByTrangThaiPheDuyet(TrangThaiPheDuyet.APPROVED)).thenReturn(List.of(testEntity));
        assertThat(service.findByTrangThaiPheDuyet(TrangThaiPheDuyet.APPROVED)).hasSize(1);
    }

    @Test void findByTinhTrang_shouldReturnFiltered() {
        when(repo.findByTinhTrang(TinhTrang.HOAT_DONG)).thenReturn(List.of(testEntity));
        assertThat(service.findByTinhTrang(TinhTrang.HOAT_DONG)).hasSize(1);
    }

    @Test void searchByTenLuongHangHaiContaining_shouldReturnResults() {
        when(repo.findByTenLuongHangHaiContaining("Tau")).thenReturn(List.of(testEntity));
        assertThat(service.searchByTenLuongHangHaiContaining("Tau")).hasSize(1);
    }

    @Test void searchByDonViQuanLyContaining_shouldReturnResults() {
        when(repo.findByDonViQuanLyContaining("Cuc")).thenReturn(List.of(testEntity));
        assertThat(service.searchByDonViQuanLyContaining("Cuc")).hasSize(1);
    }

    @Test void searchDocuments_shouldReturnPaginated() {
        Page<LuongHangHai> p = new PageImpl<>(List.of(testEntity));
        when(repo.searchDocuments(eq("Tau"), eq("Cuc"), any(TinhTrang.class), any(TrangThaiPheDuyet.class), any(Pageable.class))).thenReturn(p);
        KetQuaTimKiemResponse r = service.searchDocuments("Tau","Cuc","HOAT_DONG","APPROVED",0,20);
        assertThat(r.getTotalElements()).isEqualTo(1);
    }

    @Test void searchDocuments_shouldHandleInvalidEnums() {
        // Invalid enums result in null params passed to repo — suppress ambiguity warning
        Page<LuongHangHai> p = new PageImpl<>(List.of(testEntity));
        when(repo.searchDocuments(eq(null), eq(null), (TinhTrang)null, (TrangThaiPheDuyet)null, any(Pageable.class))).thenReturn(p);
        KetQuaTimKiemResponse r = service.searchDocuments(null,null,"INVALID","INVALID",0,20);
        assertThat(r).isNotNull();
    }
}