package com.hanghai.kchtg.luonghanghai;

import com.hanghai.kchtg.luonghanghai.dto.*;
import com.hanghai.kchtg.luonghanghai.entity.*;
import com.hanghai.kchtg.luonghanghai.repository.LuongHangHaiRepository;
import com.hanghai.kchtg.luonghanghai.repository.PheDuyetLichSuRepository;
import com.hanghai.kchtg.luonghanghai.service.LuongHangHaiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
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
@MockitoSettings(strictness = Strictness.LENIENT)
class LuongHangHaiServiceTest {

    @Mock LuongHangHaiRepository repo;
    @Mock PheDuyetLichSuRepository pheDuyetLichSuRepo;
    LuongHangHaiService service;

    private LuongHangHai testEntity;
    private LuongHangHaiCreateRequest createReq;

    @BeforeEach void setUp() {
        service = new LuongHangHaiService(repo, pheDuyetLichSuRepo);
        testEntity = LuongHangHai.builder()
                .id(1L)
                .loaiTau("Tau ca cuoc")
                .soLuong(100)
                .ngayGhiNhan(LocalDate.of(2026, 1, 1))
                .gioDien("12:00")
                .taiTrong("1000")
                .dienTichDangBo("200")
                .ghiChu("Test ghi chu")
                .approvalStatus(LuongHangHaiApprovalStatus.PROPOSED)
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(false)
                .createdBy("Admin")
                .createdAt(LocalDateTime.of(2026, 6, 1, 10, 0))
                .build();
        createReq = LuongHangHaiCreateRequest.builder()
                .loaiTau("Tau moi")
                .soLuong(50)
                .ngayGhiNhan(LocalDate.of(2026, 6, 15))
                .gioDien("14:00")
                .taiTrong("800")
                .dienTichDangBo("150")
                .ghiChu("Create test")
                .createdBy("User1")
                .build();
    }

    @Test void create_shouldSaveEntity() {
        when(repo.save(any())).thenReturn(testEntity);
        LuongHangHaiResponse r = service.create(createReq);
        assertThat(r).isNotNull();
        assertThat(r.getLoaiTau()).isEqualTo("Tau ca cuoc");
        assertThat(r.getApprovalStatus()).isEqualTo(LuongHangHaiApprovalStatus.PROPOSED);
        verify(repo, times(1)).save(any());
    }

    @Test void create_shouldSetDefaultStatusToProposed() {
        when(repo.save(any())).thenReturn(testEntity);
        assertThat(service.create(createReq).getApprovalStatus()).isEqualTo(LuongHangHaiApprovalStatus.PROPOSED);
    }

    @Test void getById_shouldReturnResponse() {
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        assertThat(service.getById(1L).getLoaiTau()).isEqualTo("Tau ca cuoc");
    }

    @Test void getById_shouldThrowWhenNotFound() {
        when(repo.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getById(99L))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Khong tim thay");
    }

    @Test void findAll_shouldReturnSorted() {
        when(repo.findByIsDeletedFalse(any(Sort.class))).thenReturn(List.of(testEntity));
        assertThat(service.findAll()).hasSize(1);
    }

    @Test void findAllPage_shouldReturnPage() {
        when(repo.findByIsDeletedFalse(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(testEntity)));
        assertThat(service.findAll(0, 20).getContent()).hasSize(1);
    }

    @Test void update_shouldUpdateFields() {
        LuongHangHaiUpdateRequest ur = LuongHangHaiUpdateRequest.builder()
                .loaiTau("Da cap nhat")
                .taiTrong("Da Nang")
                .build();
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);
        LuongHangHaiResponse r = service.update(1L, ur);
        assertThat(r.getLoaiTau()).isEqualTo("Da cap nhat");
        verify(repo, times(1)).save(any());
    }

    @Test void update_shouldThrowWhenNotFound() {
        when(repo.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, LuongHangHaiUpdateRequest.builder().build()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test void softDelete_shouldMarkDeleted() {
        testEntity.setApprovalStatus(LuongHangHaiApprovalStatus.APPROVED);
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);
        service.softDelete(1L);
        verify(repo, times(1)).save(any());
    }

    @Test void softDelete_shouldThrowWhenNotApproved() {
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        assertThatThrownBy(() -> service.softDelete(1L))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("Chi co luong hang hai da duyet");
    }

    @Test void softDelete_shouldThrowWhenNotFound() {
        when(repo.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.softDelete(99L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test void approveC1_shouldTransitionProposedToUnderReview() {
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        PheDuyetLichSu hist = PheDuyetLichSu.builder().id(1L).build();
        when(pheDuyetLichSuRepo.save(any())).thenReturn(hist);
        PheDuyetResponse r = service.approveC1(1L, PheDuyetRequest.builder()
                .trangThai("APPROVED")
                .nguoiPheDuyet("Truong Phong")
                .lyDo("Phe cap 1")
                .build());
        assertThat(r.getTrangThai()).isEqualTo("UNDER_REVIEW");
        assertThat(r.getCapPheDuyet()).isEqualTo(1);
    }

    @Test void approveC1_shouldRejectWhenProposed() {
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        PheDuyetLichSu hist = PheDuyetLichSu.builder().id(1L).build();
        when(pheDuyetLichSuRepo.save(any())).thenReturn(hist);
        PheDuyetResponse r = service.approveC1(1L, PheDuyetRequest.builder()
                .trangThai("REJECTED")
                .nguoiPheDuyet("Truong Phong")
                .lyDo("Tu choi cap 1")
                .build());
        assertThat(r.getTrangThai()).isEqualTo("REJECTED");
    }

    @Test void approveC2_shouldTransitionUnderReviewToApproved() {
        testEntity.setApprovalStatus(LuongHangHaiApprovalStatus.UNDER_REVIEW);
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        PheDuyetLichSu hist = PheDuyetLichSu.builder().id(1L).build();
        when(pheDuyetLichSuRepo.save(any())).thenReturn(hist);
        PheDuyetResponse r = service.approveC2(1L, PheDuyetRequest.builder()
                .trangThai("APPROVED")
                .nguoiPheDuyet("Giam Doc")
                .lyDo("Phe cap 2")
                .build());
        assertThat(r.getTrangThai()).isEqualTo("APPROVED");
        assertThat(r.getCapPheDuyet()).isEqualTo(2);
    }

    @Test void approveC2_shouldTransitionUnderReviewToRejected() {
        testEntity.setApprovalStatus(LuongHangHaiApprovalStatus.UNDER_REVIEW);
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        PheDuyetLichSu hist = PheDuyetLichSu.builder().id(1L).build();
        when(pheDuyetLichSuRepo.save(any())).thenReturn(hist);
        PheDuyetResponse r = service.approveC2(1L, PheDuyetRequest.builder()
                .trangThai("REJECTED")
                .nguoiPheDuyet("Giam Doc")
                .lyDo("Tu choi cap 2")
                .build());
        assertThat(r.getTrangThai()).isEqualTo("REJECTED");
    }

    @Test void approveC2_shouldThrowWhenNotUnderReview() {
        testEntity.setApprovalStatus(LuongHangHaiApprovalStatus.PROPOSED);
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        assertThatThrownBy(() -> service.approveC2(1L, PheDuyetRequest.builder().build()))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("UNDER_REVIEW");
    }

    @Test void approveC1_shouldThrowWhenNotFound() {
        when(repo.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.approveC1(99L, PheDuyetRequest.builder().build()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test void approveC2_shouldThrowWhenNotFound() {
        when(repo.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.approveC2(99L, PheDuyetRequest.builder().build()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test void reject_shouldRejectAndSetLyDo() {
        testEntity.setApprovalStatus(LuongHangHaiApprovalStatus.UNDER_REVIEW);
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        PheDuyetLichSu hist = PheDuyetLichSu.builder().id(1L).build();
        when(pheDuyetLichSuRepo.save(any())).thenReturn(hist);
        PheDuyetResponse r = service.reject(1L, PheDuyetRequest.builder()
                .capPheDuyet(2)
                .trangThai("REJECTED")
                .nguoiPheDuyet("Giam Doc")
                .lyDo("Tu choi")
                .build());
        assertThat(r.getTrangThai()).isEqualTo("REJECTED");
        assertThat(r.getCapPheDuyet()).isEqualTo(2);
    }

    @Test void getApprovalHistory_shouldReturnEntries() {
        testEntity.setApprovalStatus(LuongHangHaiApprovalStatus.APPROVED);
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        PheDuyetLichSu hist = PheDuyetLichSu.builder()
                .id(1L).luongHangHai(testEntity).capPheDuyet(1)
                .trangThai("UNDER_REVIEW").nguoiPheDuyet("Truong")
                .ngayPheDuyet(LocalDate.of(2026, 6, 1)).lyDo("Phe cap 1")
                .build();
        when(pheDuyetLichSuRepo.findByLuongHangHaiIdOrderByNgayPheDuyetDesc(1L)).thenReturn(List.of(hist));
        List<HistoryEntry> h = service.getApprovalHistory(1L);
        assertThat(h).hasSize(1);
        assertThat(h.get(0).getTrangThai()).isEqualTo("UNDER_REVIEW");
    }

    @Test void getApprovalHistory_shouldThrowWhenNotFound() {
        when(repo.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getApprovalHistory(99L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test void findByApprovalStatus_shouldReturnFiltered() {
        when(repo.findByApprovalStatusAndIsDeletedFalse(LuongHangHaiApprovalStatus.APPROVED))
                .thenReturn(List.of(testEntity));
        assertThat(service.findByApprovalStatus(LuongHangHaiApprovalStatus.APPROVED)).hasSize(1);
    }

    @Test void searchByLoaiTauContaining_shouldReturnResults() {
        when(repo.findByLoaiTauContainingAndIsDeletedFalse("Tau")).thenReturn(List.of(testEntity));
        assertThat(service.searchByLoaiTauContaining("Tau")).hasSize(1);
    }

    @Test void searchDocuments_shouldReturnPaginated() {
        Page<LuongHangHai> p = new PageImpl<>(List.of(testEntity));
        when(repo.searchDocuments(eq("Tau"), eq("12:00"), eq("1000"),
                eq(LuongHangHaiApprovalStatus.APPROVED), any(Pageable.class))).thenReturn(p);
        KetQuaTimKiemResponse r = service.searchDocuments("Tau", "12:00", "1000", "APPROVED", 0, 20);
        assertThat(r.getTotalElements()).isEqualTo(1);
    }

    @Test void searchDocuments_shouldHandleNullKeyword() {
        Page<LuongHangHai> p = new PageImpl<>(List.of(testEntity));
        when(repo.searchDocuments(eq(null), eq(null), eq(null), eq(null), any(Pageable.class))).thenReturn(p);
        KetQuaTimKiemResponse r = service.searchDocuments(null, null, null, null, 0, 20);
        assertThat(r).isNotNull();
    }

    @Test void searchDocuments_shouldHandleInvalidEnum() {
        Page<LuongHangHai> p = new PageImpl<>(List.of(testEntity));
        when(repo.searchDocuments(eq(null), eq(null), eq(null), eq(null), any(Pageable.class))).thenReturn(p);
        KetQuaTimKiemResponse r = service.searchDocuments(null, null, null, "INVALID", 0, 20);
        assertThat(r).isNotNull();
    }
}