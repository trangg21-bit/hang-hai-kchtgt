package com.hanghai.kchtg.deke;

import com.hanghai.kchtg.deke.dto.*;
import com.hanghai.kchtg.deke.entity.*;
import com.hanghai.kchtg.deke.repository.DeKeAttachmentRepository;
import com.hanghai.kchtg.deke.repository.DeKeRepository;
import com.hanghai.kchtg.deke.repository.PheDuyetLichSuDeKeRepository;
import com.hanghai.kchtg.deke.service.DeKeService;
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
class DeKeServiceTest {

    @Mock DeKeRepository repo;
    @Mock DeKeAttachmentRepository attachmentRepo;
    @Mock PheDuyetLichSuDeKeRepository pheDuyetLichSuRepo;
    DeKeService service;

    private DeKe testEntity;
    private DeKeCreateRequest createReq;

    @BeforeEach void setUp() {
        service = new DeKeService(repo, attachmentRepo, pheDuyetLichSuRepo);
        testEntity = DeKe.builder()
                .id(1L)
                .loaiDe("De ke son")
                .viTri("Bac Giang")
                .chieuDai(150.5)
                .chieuRong(10.0)
                .chieuCao(5.0)
                .matVatLieu("Betong")
                .tinhTrang("Tot")
                .trangThaiPheDuyet(DeKeApprovalStatus.PROPOSED)
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(false)
                .createdBy("Admin")
                .createdAt(LocalDateTime.of(2026, 6, 1, 10, 0))
                .build();
        createReq = DeKeCreateRequest.builder()
                .loaiDe("De ke tre")
                .viTri("Ha Noi")
                .chieuDai(200.0)
                .chieuRong(20.0)
                .chieuCao(8.0)
                .matVatLieu("Thep")
                .tinhTrang("Tot")
                .createdBy("User1")
                .build();
    }

    // ── create ──────────────────────────────────────────────────────────

    @Test void create_shouldSaveEntity() {
        when(repo.save(any())).thenReturn(testEntity);
        DeKeResponse r = service.create(createReq);
        assertThat(r).isNotNull();
        assertThat(r.getLoaiDe()).isEqualTo("De ke son");
        assertThat(r.getTrangThaiPheDuyet()).isEqualTo(DeKeApprovalStatus.PROPOSED);
        verify(repo, times(1)).save(any());
    }

    @Test void create_shouldSetDefaultStatusToProposed() {
        when(repo.save(any())).thenReturn(testEntity);
        assertThat(service.create(createReq).getTrangThaiPheDuyet())
                .isEqualTo(DeKeApprovalStatus.PROPOSED);
    }

    // ── getById ─────────────────────────────────────────────────────────

    @Test void getById_shouldReturnResponse() {
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        assertThat(service.getById(1L).getLoaiDe()).isEqualTo("De ke son");
    }

    @Test void getById_shouldThrowWhenNotFound() {
        when(repo.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getById(99L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Khong tim thay");
    }

    // ── findAll ─────────────────────────────────────────────────────────

    @Test void findAll_shouldReturnSorted() {
        when(repo.findByIsDeletedFalse(any(Sort.class))).thenReturn(List.of(testEntity));
        assertThat(service.findAll()).hasSize(1);
    }

    @Test void findAllPage_shouldReturnPage() {
        when(repo.findByIsDeletedFalse(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(testEntity)));
        assertThat(service.findAll(0, 20).getContent()).hasSize(1);
    }

    // ── update ──────────────────────────────────────────────────────────

    @Test void update_shouldUpdateFields() {
        DeKeUpdateRequest ur = DeKeUpdateRequest.builder()
                .loaiDe("Da cap nhat")
                .viTri("Da Nang")
                .build();
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);
        DeKeResponse r = service.update(1L, ur);
        assertThat(r.getLoaiDe()).isEqualTo("Da cap nhat");
        verify(repo, times(1)).save(any());
    }

    @Test void update_shouldThrowWhenNotFound() {
        when(repo.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, DeKeUpdateRequest.builder().build()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ── softDelete ──────────────────────────────────────────────────────

    @Test void softDelete_shouldMarkDeleted() {
        testEntity.setTrangThaiPheDuyet(DeKeApprovalStatus.APPROVED);
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);
        service.softDelete(1L);
        verify(repo, times(1)).save(any());
    }

    @Test void softDelete_shouldThrowWhenNotApproved() {
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        assertThatThrownBy(() -> service.softDelete(1L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Chi co de ke da duyet");
    }

    @Test void softDelete_shouldThrowWhenNotFound() {
        when(repo.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.softDelete(99L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ── approveC1 ───────────────────────────────────────────────────────

    @Test void approveC1_shouldTransitionProposedToUnderReview() {
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        PheDuyetLichSu hist = PheDuyetLichSu.builder().id(1L).build();
        when(pheDuyetLichSuRepo.save(any())).thenReturn(hist);
        PheDuyetResponse r = service.approveC1(1L, PheDuyetRequest.builder()
                .quyetDinh("APPROVED")
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
                .quyetDinh("REJECTED")
                .nguoiPheDuyet("Truong Phong")
                .lyDo("Tu choi cap 1")
                .build());
        assertThat(r.getTrangThai()).isEqualTo("REJECTED");
    }

    @Test void approveC1_shouldTransitionRejectedToUnderReview() {
        testEntity.setTrangThaiPheDuyet(DeKeApprovalStatus.REJECTED);
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        PheDuyetLichSu hist = PheDuyetLichSu.builder().id(1L).build();
        when(pheDuyetLichSuRepo.save(any())).thenReturn(hist);
        PheDuyetResponse r = service.approveC1(1L, PheDuyetRequest.builder()
                .quyetDinh("APPROVED")
                .nguoiPheDuyet("Truong Phong")
                .lyDo("Phe cap 1")
                .build());
        assertThat(r.getTrangThai()).isEqualTo("UNDER_REVIEW");
    }

    @Test void approveC1_shouldThrowWhenNotFound() {
        when(repo.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.approveC1(99L, PheDuyetRequest.builder().build()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ── approveC2 ───────────────────────────────────────────────────────

    @Test void approveC2_shouldTransitionUnderReviewToApproved() {
        testEntity.setTrangThaiPheDuyet(DeKeApprovalStatus.UNDER_REVIEW);
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        PheDuyetLichSu hist = PheDuyetLichSu.builder().id(1L).build();
        when(pheDuyetLichSuRepo.save(any())).thenReturn(hist);
        PheDuyetResponse r = service.approveC2(1L, PheDuyetRequest.builder()
                .quyetDinh("APPROVED")
                .nguoiPheDuyet("Giam Doc")
                .lyDo("Phe cap 2")
                .build());
        assertThat(r.getTrangThai()).isEqualTo("APPROVED");
        assertThat(r.getCapPheDuyet()).isEqualTo(2);
    }

    @Test void approveC2_shouldTransitionUnderReviewToRejected() {
        testEntity.setTrangThaiPheDuyet(DeKeApprovalStatus.UNDER_REVIEW);
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        PheDuyetLichSu hist = PheDuyetLichSu.builder().id(1L).build();
        when(pheDuyetLichSuRepo.save(any())).thenReturn(hist);
        PheDuyetResponse r = service.approveC2(1L, PheDuyetRequest.builder()
                .quyetDinh("REJECTED")
                .nguoiPheDuyet("Giam Doc")
                .lyDo("Tu choi cap 2")
                .build());
        assertThat(r.getTrangThai()).isEqualTo("REJECTED");
    }

    @Test void approveC2_shouldThrowWhenNotUnderReview() {
        testEntity.setTrangThaiPheDuyet(DeKeApprovalStatus.PROPOSED);
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        assertThatThrownBy(() -> service.approveC2(1L, PheDuyetRequest.builder().build()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("UNDER_REVIEW");
    }

    @Test void approveC2_shouldThrowWhenNotFound() {
        when(repo.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.approveC2(99L, PheDuyetRequest.builder().build()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ── reject ──────────────────────────────────────────────────────────

    @Test void reject_shouldRejectAndSetLyDo() {
        testEntity.setTrangThaiPheDuyet(DeKeApprovalStatus.UNDER_REVIEW);
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        PheDuyetLichSu hist = PheDuyetLichSu.builder().id(1L).build();
        when(pheDuyetLichSuRepo.save(any())).thenReturn(hist);
        PheDuyetResponse r = service.reject(1L, PheDuyetRequest.builder()
                .capPheDuyet(2)
                .quyetDinh("REJECTED")
                .nguoiPheDuyet("Giam Doc")
                .lyDo("Tu choi")
                .build());
        assertThat(r.getTrangThai()).isEqualTo("REJECTED");
        assertThat(r.getCapPheDuyet()).isEqualTo(2);
    }

    @Test void reject_shouldThrowWhenNotFound() {
        when(repo.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.reject(99L, PheDuyetRequest.builder().build()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ── getApprovalHistory ──────────────────────────────────────────────

    @Test void getApprovalHistory_shouldReturnEntries() {
        testEntity.setTrangThaiPheDuyet(DeKeApprovalStatus.APPROVED);
        when(repo.findById(1L)).thenReturn(Optional.of(testEntity));
        PheDuyetLichSu hist = PheDuyetLichSu.builder()
                .id(1L).deKe(testEntity).capPheDuyet(1)
                .trangThai("UNDER_REVIEW").nguoiPheDuyet("Truong")
                .ngayPheDuyet(LocalDate.of(2026, 6, 1)).lyDo("Phe cap 1")
                .build();
        when(pheDuyetLichSuRepo.findByDeKeIdOrderByNgayPheDuyetDesc(1L)).thenReturn(List.of(hist));
        List<HistoryEntry> h = service.getApprovalHistory(1L);
        assertThat(h).hasSize(1);
        assertThat(h.get(0).getTrangThai()).isEqualTo("UNDER_REVIEW");
    }

    @Test void getApprovalHistory_shouldThrowWhenNotFound() {
        when(repo.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getApprovalHistory(99L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ── findByTrangThaiPheDuyet ────────────────────────────────────────

    @Test void findByTrangThaiPheDuyet_shouldReturnFiltered() {
        when(repo.findByTrangThaiPheDuyetAndIsDeletedFalse(DeKeApprovalStatus.APPROVED))
                .thenReturn(List.of(testEntity));
        assertThat(service.findByTrangThaiPheDuyet(DeKeApprovalStatus.APPROVED)).hasSize(1);
    }

    // ── searchByLoaiDeContaining ────────────────────────────────────────

    @Test void searchByLoaiDeContaining_shouldReturnResults() {
        when(repo.findByLoaiDeContainingAndIsDeletedFalse("De ke"))
                .thenReturn(List.of(testEntity));
        assertThat(service.searchByLoaiDeContaining("De ke")).hasSize(1);
    }

    // ── searchDocuments ─────────────────────────────────────────────────

    @Test void searchDocuments_shouldReturnPaginated() {
        Page<DeKe> p = new PageImpl<>(List.of(testEntity));
        when(repo.searchDocuments(eq("De ke"), eq(null), eq(null), eq(null), any(Pageable.class)))
                .thenReturn(p);
        KetQuaTimKiemResponse r = service.searchDocuments("De ke", null, null, null, 0, 20);
        assertThat(r.getTotalElements()).isEqualTo(1);
    }

    @Test void searchDocuments_shouldHandleNullKeyword() {
        Page<DeKe> p = new PageImpl<>(List.of(testEntity));
        when(repo.searchDocuments(eq(null), eq(null), eq(null), eq(null), any(Pageable.class)))
                .thenReturn(p);
        KetQuaTimKiemResponse r = service.searchDocuments(null, null, null, null, 0, 20);
        assertThat(r).isNotNull();
    }

    @Test void searchDocuments_shouldHandleInvalidEnum() {
        Page<DeKe> p = new PageImpl<>(List.of(testEntity));
        when(repo.searchDocuments(eq(null), eq(null), eq(null), eq(null), any(Pageable.class)))
                .thenReturn(p);
        KetQuaTimKiemResponse r = service.searchDocuments(null, null, null, "INVALID", 0, 20);
        assertThat(r).isNotNull();
    }
}
