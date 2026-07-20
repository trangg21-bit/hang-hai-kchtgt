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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DeKeServiceTest {

    private static final UUID TEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID TEST_ID_2 = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock DeKeRepository repo;
    @Mock DeKeAttachmentRepository attachmentRepo;
    @Mock PheDuyetLichSuDeKeRepository pheDuyetLichSuRepo;
    @Mock com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService gisSpatialObjectService;
    DeKeService service;

    private DeKe testEntity;
    private DeKeCreateRequest createReq;

    @BeforeEach void setUp() {
        service = new DeKeService(repo, attachmentRepo, pheDuyetLichSuRepo, gisSpatialObjectService);
        testEntity = DeKe.builder()
                .id(TEST_ID)
                .loaiDe(LoaiDe.DE_CHAN_SONG)
                .viTri("Bac Giang")
                .chieuDai(150.5)
                .caoTrinhDinh(10.0)
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
                .loaiDe(LoaiDe.DE_CHAN_CAT)
                .viTri("Ha Noi")
                .chieuDai(200.0)
                .caoTrinhDinh(20.0)
                .chieuCao(8.0)
                .matVatLieu("Thep")
                .tinhTrang("Tot")
                .build();
    }

    // ── create ──────────────────────────────────────────────────────────

    @Test void create_shouldSaveEntity() {
        when(repo.save(any())).thenReturn(testEntity);
        DeKeResponse r = service.create(createReq, "testuser");
        assertThat(r).isNotNull();
        assertThat(r.getLoaiDe()).isEqualTo(LoaiDe.DE_CHAN_SONG);
        assertThat(r.getTrangThaiPheDuyet()).isEqualTo(DeKeApprovalStatus.PROPOSED);
        verify(repo, times(1)).save(any());
    }

    @Test void create_shouldSetDefaultStatusToProposed() {
        when(repo.save(any())).thenReturn(testEntity);
        assertThat(service.create(createReq, "testuser").getTrangThaiPheDuyet())
                .isEqualTo(DeKeApprovalStatus.PROPOSED);
    }

    // ── getById ─────────────────────────────────────────────────────────

    @Test void getById_shouldReturnResponse() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        assertThat(service.getById(TEST_ID).getLoaiDe()).isEqualTo(LoaiDe.DE_CHAN_SONG);
    }

    @Test void getById_shouldThrowWhenNotFound() {
        when(repo.findById(TEST_ID_2)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getById(TEST_ID_2))
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
                .loaiDe(LoaiDe.KE_HUONG_DONG)
                .viTri("Da Nang")
                .build();
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);
        DeKeResponse r = service.update(TEST_ID, ur, "testuser");
        assertThat(r.getLoaiDe()).isEqualTo(LoaiDe.KE_HUONG_DONG);
        verify(repo, times(1)).save(any());
    }

    @Test void update_shouldThrowWhenNotFound() {
        when(repo.findById(TEST_ID_2)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(TEST_ID_2, DeKeUpdateRequest.builder().build(), "testuser"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ── softDelete ──────────────────────────────────────────────────────

    @Test void softDelete_shouldMarkDeleted() {
        testEntity.setTrangThaiPheDuyet(DeKeApprovalStatus.APPROVED);
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);
        service.softDelete(TEST_ID);
        verify(repo, times(1)).save(any());
    }

    @Test void softDelete_shouldThrowWhenNotApproved() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        assertThatThrownBy(() -> service.softDelete(TEST_ID))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Chi co de ke da duyet moi co the xoa mem");
    }

    @Test void softDelete_shouldThrowWhenNotFound() {
        when(repo.findById(TEST_ID_2)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.softDelete(TEST_ID_2))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ── approveC1 ───────────────────────────────────────────────────────

    @Test void approveC1_shouldTransitionProposedToUnderReview() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        PheDuyetLichSu hist = PheDuyetLichSu.builder().id(1L).build();
        when(pheDuyetLichSuRepo.save(any())).thenReturn(hist);
        PheDuyetResponse r = service.approveC1(TEST_ID, PheDuyetRequest.builder()
                .quyetDinh("APPROVED")
                .lyDo("Phe cap 1")
                .build(), "Truong Phong");
        assertThat(r.getTrangThai()).isEqualTo("UNDER_REVIEW");
        assertThat(r.getCapPheDuyet()).isEqualTo(1);
    }

    @Test void approveC1_shouldRejectWhenProposed() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        PheDuyetLichSu hist = PheDuyetLichSu.builder().id(1L).build();
        when(pheDuyetLichSuRepo.save(any())).thenReturn(hist);
        PheDuyetResponse r = service.approveC1(TEST_ID, PheDuyetRequest.builder()
                .quyetDinh("REJECTED")
                .lyDo("Tu choi cap 1")
                .build(), "Truong Phong");
        assertThat(r.getTrangThai()).isEqualTo("REJECTED");
    }

    @Test void approveC1_shouldTransitionRejectedToUnderReview() {
        testEntity.setTrangThaiPheDuyet(DeKeApprovalStatus.REJECTED);
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        PheDuyetLichSu hist = PheDuyetLichSu.builder().id(1L).build();
        when(pheDuyetLichSuRepo.save(any())).thenReturn(hist);
        PheDuyetResponse r = service.approveC1(TEST_ID, PheDuyetRequest.builder()
                .quyetDinh("APPROVED")
                .lyDo("Phe cap 1")
                .build(), "Truong Phong");
        assertThat(r.getTrangThai()).isEqualTo("UNDER_REVIEW");
    }

    @Test void approveC1_shouldThrowWhenNotFound() {
        when(repo.findById(TEST_ID_2)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.approveC1(TEST_ID_2, PheDuyetRequest.builder().build(), "system"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ── approveC2 ───────────────────────────────────────────────────────

    @Test void approveC2_shouldTransitionUnderReviewToApproved() {
        testEntity.setTrangThaiPheDuyet(DeKeApprovalStatus.UNDER_REVIEW);
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        PheDuyetLichSu hist = PheDuyetLichSu.builder().id(1L).build();
        when(pheDuyetLichSuRepo.save(any())).thenReturn(hist);
        PheDuyetResponse r = service.approveC2(TEST_ID, PheDuyetRequest.builder()
                .quyetDinh("APPROVED")
                .lyDo("Phe cap 2")
                .build(), "Giam Doc");
        assertThat(r.getTrangThai()).isEqualTo("APPROVED");
        assertThat(r.getCapPheDuyet()).isEqualTo(2);
    }

    @Test void approveC2_shouldTransitionUnderReviewToRejected() {
        testEntity.setTrangThaiPheDuyet(DeKeApprovalStatus.UNDER_REVIEW);
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        PheDuyetLichSu hist = PheDuyetLichSu.builder().id(1L).build();
        when(pheDuyetLichSuRepo.save(any())).thenReturn(hist);
        PheDuyetResponse r = service.approveC2(TEST_ID, PheDuyetRequest.builder()
                .quyetDinh("REJECTED")
                .lyDo("Tu choi cap 2")
                .build(), "Giam Doc");
        assertThat(r.getTrangThai()).isEqualTo("REJECTED");
    }

    @Test void approveC2_shouldThrowWhenNotUnderReview() {
        testEntity.setTrangThaiPheDuyet(DeKeApprovalStatus.PROPOSED);
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        assertThatThrownBy(() -> service.approveC2(TEST_ID, PheDuyetRequest.builder().build(), "system"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("UNDER_REVIEW");
    }

    @Test void approveC2_shouldThrowWhenNotFound() {
        when(repo.findById(TEST_ID_2)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.approveC2(TEST_ID_2, PheDuyetRequest.builder().build(), "system"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test void approveC2_sameActorAsC1_throwsException() {
        testEntity.setTrangThaiPheDuyet(DeKeApprovalStatus.UNDER_REVIEW);
        testEntity.setNguoiPheDuyetC1("user1");
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        assertThatThrownBy(() -> service.approveC2(TEST_ID, PheDuyetRequest.builder()
                .quyetDinh("APPROVED")
                .build(), "user1"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Nguoi phe duyet C2 khong duoc trung");
    }

    // ── reject ──────────────────────────────────────────────────────────

    @Test void reject_shouldRejectAndSetLyDo() {
        testEntity.setTrangThaiPheDuyet(DeKeApprovalStatus.UNDER_REVIEW);
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        PheDuyetLichSu hist = PheDuyetLichSu.builder().id(1L).build();
        when(pheDuyetLichSuRepo.save(any())).thenReturn(hist);
        PheDuyetResponse r = service.reject(TEST_ID, PheDuyetRequest.builder()
                .capPheDuyet(2)
                .quyetDinh("REJECTED")
                .lyDo("Tu choi")
                .build(), "Giam Doc");
        assertThat(r.getTrangThai()).isEqualTo("REJECTED");
        assertThat(r.getCapPheDuyet()).isEqualTo(2);
    }

    @Test void reject_shouldThrowWhenNotFound() {
        when(repo.findById(TEST_ID_2)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.reject(TEST_ID_2, PheDuyetRequest.builder().build(), "system"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ── getApprovalHistory ──────────────────────────────────────────────

    @Test void getApprovalHistory_shouldReturnEntries() {
        testEntity.setTrangThaiPheDuyet(DeKeApprovalStatus.APPROVED);
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        PheDuyetLichSu hist = PheDuyetLichSu.builder()
                .id(1L).deKe(testEntity).capPheDuyet(1)
                .trangThai("UNDER_REVIEW").nguoiPheDuyet("Truong")
                .ngayPheDuyet(LocalDate.of(2026, 6, 1)).lyDo("Phe cap 1")
                .build();
        when(pheDuyetLichSuRepo.findByDeKeIdOrderByNgayPheDuyetDesc(TEST_ID)).thenReturn(List.of(hist));
        List<HistoryEntry> h = service.getApprovalHistory(TEST_ID);
        assertThat(h).hasSize(1);
        assertThat(h.get(0).getTrangThai()).isEqualTo("UNDER_REVIEW");
    }

    @Test void getApprovalHistory_shouldThrowWhenNotFound() {
        when(repo.findById(TEST_ID_2)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getApprovalHistory(TEST_ID_2))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ── findByTrangThaiPheDuyet ────────────────────────────────────────

    @Test void findByTrangThaiPheDuyet_shouldReturnFiltered() {
        when(repo.findByTrangThaiPheDuyetAndIsDeletedFalse(DeKeApprovalStatus.APPROVED))
                .thenReturn(List.of(testEntity));
        assertThat(service.findByTrangThaiPheDuyet(DeKeApprovalStatus.APPROVED)).hasSize(1);
    }

    // ── searchByLoaiDeContaining ────────────────────────────────────────

    @Test void searchByLoaiDe_shouldReturnResults() {
        when(repo.findByLoaiDeAndIsDeletedFalse(LoaiDe.DE_CHAN_SONG))
                .thenReturn(List.of(testEntity));
        assertThat(service.searchByLoaiDe(LoaiDe.DE_CHAN_SONG)).hasSize(1);
    }

    // ── searchDocuments ─────────────────────────────────────────────────

    @Test void searchDocuments_shouldReturnPaginated() {
        Page<DeKe> p = new PageImpl<>(List.of(testEntity));
        when(repo.searchDocuments(eq(null), eq("%de ke%"), eq(null), eq(null), eq(null), any(Pageable.class)))
                .thenReturn(p);
        KetQuaTimKiemResponse r = service.searchDocuments(null, "De ke", null, null, null, 0, 20);
        assertThat(r.getTotalElements()).isEqualTo(1);
    }

    @Test void searchDocuments_shouldHandleNullKeyword() {
        Page<DeKe> p = new PageImpl<>(List.of(testEntity));
        when(repo.searchDocuments(eq(null), eq(null), eq(null), eq(null), eq(null), any(Pageable.class)))
                .thenReturn(p);
        KetQuaTimKiemResponse r = service.searchDocuments(null, null, null, null, null, 0, 20);
        assertThat(r).isNotNull();
    }

    @Test void searchDocuments_shouldHandleInvalidEnum() {
        Page<DeKe> p = new PageImpl<>(List.of(testEntity));
        when(repo.searchDocuments(eq(null), eq(null), eq(null), eq(null), eq(null), any(Pageable.class)))
                .thenReturn(p);
        KetQuaTimKiemResponse r = service.searchDocuments(null, null, null, null, "INVALID", 0, 20);
        assertThat(r).isNotNull();
    }
}
