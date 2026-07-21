package com.hanghai.kchtg.luonghanghai;

import com.hanghai.kchtg.luonghanghai.dto.*;
import com.hanghai.kchtg.luonghanghai.entity.*;
import com.hanghai.kchtg.luonghanghai.repository.LuongHangHaiRepository;
import com.hanghai.kchtg.luonghanghai.repository.PheDuyetLichSuRepository;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.entity.OrgUnitStatus;
import com.hanghai.kchtg.orgunit.entity.OrgUnitType;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class LuongHangHaiServiceTest {

    private static final UUID TEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID TEST_ID_2 = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock LuongHangHaiRepository repo;
    @Mock PheDuyetLichSuRepository pheDuyetLichSuRepo;
    @Mock com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService gisSpatialObjectService;
    @Mock OrgUnitRepository orgUnitRepository;
    LuongHangHaiService service;

    private LuongHangHai testEntity;
    private LuongHangHaiCreateRequest createReq;

    @BeforeEach void setUp() {
        service = new LuongHangHaiService(repo, pheDuyetLichSuRepo, gisSpatialObjectService, orgUnitRepository);
        OrgUnit mockOrg = OrgUnit.builder()
                .code("TCT")
                .name("TCT")
                .path("/TCT/")
                .level(1)
                .sortOrder(1)
                .type(OrgUnitType.TCT)
                .status(OrgUnitStatus.APPROVED)
                .build();
        when(orgUnitRepository.findById(TEST_ID)).thenReturn(Optional.of(mockOrg));
        testEntity = LuongHangHai.builder()
                .id(TEST_ID)
                .ten("Luong hang hai")
                .soLuongTram(100)
                .thoiDiemSuaChuaTramGanNhat(LocalDate.of(2026, 1, 1))
                .dienTichTram(new java.math.BigDecimal("200"))
                .ghiChu("Test ghi chu")
                .approvalStatus(LuongHangHaiApprovalStatus.PROPOSED)
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(false)
                .createdBy("Admin")
                .createdAt(LocalDateTime.of(2026, 6, 1, 10, 0))
                .build();
        createReq = LuongHangHaiCreateRequest.builder()
                .ten("Luong hang hai moi")
                .soLuongTram(50)
                .thoiDiemSuaChuaTramGanNhat(LocalDate.of(2026, 6, 15))
                .dienTichTram(new java.math.BigDecimal("150"))
                .ghiChu("Create test")
                .donViId(TEST_ID)
                .build();
    }

    @Test void create_shouldSaveEntity() {
        when(repo.save(any())).thenReturn(testEntity);
        LuongHangHaiResponse r = service.create(createReq, "testuser");
        assertThat(r).isNotNull();
        assertThat(r.getTen()).isEqualTo("Luong hang hai");
        assertThat(r.getApprovalStatus()).isEqualTo(LuongHangHaiApprovalStatus.PROPOSED);
        verify(repo, times(1)).save(any());
    }

    @Test void create_shouldSetDefaultStatusToProposed() {
        when(repo.save(any())).thenReturn(testEntity);
        assertThat(service.create(createReq, "testuser").getApprovalStatus()).isEqualTo(LuongHangHaiApprovalStatus.PROPOSED);
    }

    @Test void getById_shouldReturnResponse() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        assertThat(service.getById(TEST_ID).getTen()).isEqualTo("Luong hang hai");
    }

    @Test void getById_shouldThrowWhenNotFound() {
        when(repo.findById(TEST_ID_2)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getById(TEST_ID_2))
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
                .ten("Da cap nhat")
                .build();
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);
        LuongHangHaiResponse r = service.update(TEST_ID, ur, "testuser");
        assertThat(r.getTen()).isEqualTo("Da cap nhat");
        verify(repo, times(1)).save(any());
    }

    @Test void update_shouldThrowWhenNotFound() {
        when(repo.findById(TEST_ID_2)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(TEST_ID_2, LuongHangHaiUpdateRequest.builder().build(), "testuser"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test void softDelete_shouldMarkDeleted() {
        testEntity.setApprovalStatus(LuongHangHaiApprovalStatus.APPROVED);
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);
        service.softDelete(TEST_ID);
        verify(repo, times(1)).save(any());
    }

    @Test void softDelete_shouldThrowWhenNotApproved() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        assertThatThrownBy(() -> service.softDelete(TEST_ID))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("Chi co luong hang hai da duyet moi co the xoa mem");
    }

    @Test void softDelete_shouldThrowWhenNotFound() {
        when(repo.findById(TEST_ID_2)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.softDelete(TEST_ID_2))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test void approveC1_shouldTransitionProposedToUnderReview() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        PheDuyetLichSu hist = PheDuyetLichSu.builder().id(1L).build();
        when(pheDuyetLichSuRepo.save(any())).thenReturn(hist);
        PheDuyetResponse r = service.approveC1(TEST_ID, PheDuyetRequest.builder()
                .trangThai("APPROVED")
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
                .trangThai("REJECTED")
                .lyDo("Tu choi cap 1")
                .build(), "Truong Phong");
        assertThat(r.getTrangThai()).isEqualTo("REJECTED");
    }

    @Test void approveC2_shouldTransitionUnderReviewToApproved() {
        testEntity.setApprovalStatus(LuongHangHaiApprovalStatus.UNDER_REVIEW);
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        PheDuyetLichSu hist = PheDuyetLichSu.builder().id(1L).build();
        when(pheDuyetLichSuRepo.save(any())).thenReturn(hist);
        PheDuyetResponse r = service.approveC2(TEST_ID, PheDuyetRequest.builder()
                .trangThai("APPROVED")
                .lyDo("Phe cap 2")
                .build(), "Giam Doc");
        assertThat(r.getTrangThai()).isEqualTo("APPROVED");
        assertThat(r.getCapPheDuyet()).isEqualTo(2);
    }

    @Test void approveC2_shouldTransitionUnderReviewToRejected() {
        testEntity.setApprovalStatus(LuongHangHaiApprovalStatus.UNDER_REVIEW);
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        PheDuyetLichSu hist = PheDuyetLichSu.builder().id(1L).build();
        when(pheDuyetLichSuRepo.save(any())).thenReturn(hist);
        PheDuyetResponse r = service.approveC2(TEST_ID, PheDuyetRequest.builder()
                .trangThai("REJECTED")
                .lyDo("Tu choi cap 2")
                .build(), "Giam Doc");
        assertThat(r.getTrangThai()).isEqualTo("REJECTED");
    }

    @Test void approveC2_shouldThrowWhenNotUnderReview() {
        testEntity.setApprovalStatus(LuongHangHaiApprovalStatus.PROPOSED);
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        assertThatThrownBy(() -> service.approveC2(TEST_ID, PheDuyetRequest.builder().build(), "system"))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("UNDER_REVIEW");
    }

    @Test void approveC1_shouldThrowWhenNotFound() {
        when(repo.findById(TEST_ID_2)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.approveC1(TEST_ID_2, PheDuyetRequest.builder().build(), "system"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test void approveC2_shouldThrowWhenNotFound() {
        when(repo.findById(TEST_ID_2)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.approveC2(TEST_ID_2, PheDuyetRequest.builder().build(), "system"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test void approveC2_sameActorAsC1_throwsException() {
        testEntity.setApprovalStatus(LuongHangHaiApprovalStatus.UNDER_REVIEW);
        testEntity.setNguoiPheDuyetC1("user1");
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        assertThatThrownBy(() -> service.approveC2(TEST_ID, PheDuyetRequest.builder()
                .trangThai("APPROVED")
                .build(), "user1"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Nguoi phe duyet C2 khong duoc trung");
    }

    @Test void reject_shouldRejectAndSetLyDo() {
        testEntity.setApprovalStatus(LuongHangHaiApprovalStatus.UNDER_REVIEW);
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        PheDuyetLichSu hist = PheDuyetLichSu.builder().id(1L).build();
        when(pheDuyetLichSuRepo.save(any())).thenReturn(hist);
        PheDuyetResponse r = service.reject(TEST_ID, PheDuyetRequest.builder()
                .capPheDuyet(2)
                .trangThai("REJECTED")
                .lyDo("Tu choi")
                .build(), "Giam Doc");
        assertThat(r.getTrangThai()).isEqualTo("REJECTED");
        assertThat(r.getCapPheDuyet()).isEqualTo(2);
    }

    @Test void getApprovalHistory_shouldReturnEntries() {
        testEntity.setApprovalStatus(LuongHangHaiApprovalStatus.APPROVED);
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        PheDuyetLichSu hist = PheDuyetLichSu.builder()
                .id(1L).luongHangHai(testEntity).capPheDuyet(1)
                .trangThai("UNDER_REVIEW").nguoiPheDuyet("Truong")
                .ngayPheDuyet(LocalDate.of(2026, 6, 1)).lyDo("Phe cap 1")
                .build();
        when(pheDuyetLichSuRepo.findByLuongHangHaiIdOrderByNgayPheDuyetDesc(TEST_ID)).thenReturn(List.of(hist));
        List<HistoryEntry> h = service.getApprovalHistory(TEST_ID);
        assertThat(h).hasSize(1);
        assertThat(h.get(0).getTrangThai()).isEqualTo("UNDER_REVIEW");
    }

    @Test void getApprovalHistory_shouldThrowWhenNotFound() {
        when(repo.findById(TEST_ID_2)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getApprovalHistory(TEST_ID_2))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test void findByApprovalStatus_shouldReturnFiltered() {
        when(repo.findByApprovalStatusAndIsDeletedFalse(LuongHangHaiApprovalStatus.APPROVED))
                .thenReturn(List.of(testEntity));
        assertThat(service.findByApprovalStatus(LuongHangHaiApprovalStatus.APPROVED)).hasSize(1);
    }

    @Test void searchByTenContaining_shouldReturnResults() {
        when(repo.findByTenContainingAndIsDeletedFalse("Luong hang hai")).thenReturn(List.of(testEntity));
        assertThat(service.searchByTenContaining("Luong hang hai")).hasSize(1);
    }

    @Test void searchDocuments_shouldReturnPaginated() {
        Page<LuongHangHai> p = new PageImpl<>(List.of(testEntity));
        when(repo.searchDocuments(eq(null), eq("%luong hang hai%"),
                eq(LuongHangHaiApprovalStatus.APPROVED), any(Pageable.class))).thenReturn(p);
        KetQuaTimKiemResponse r = service.searchDocuments(null, "Luong hang hai", "APPROVED", 0, 20);
        assertThat(r.getTotalElements()).isEqualTo(1);
    }

    @Test void searchDocuments_shouldHandleNullKeyword() {
        Page<LuongHangHai> p = new PageImpl<>(List.of(testEntity));
        when(repo.searchDocuments(eq(null), eq(null), eq(null), any(Pageable.class))).thenReturn(p);
        KetQuaTimKiemResponse r = service.searchDocuments(null, null, null, 0, 20);
        assertThat(r).isNotNull();
    }

    @Test void searchDocuments_shouldHandleInvalidEnum() {
        Page<LuongHangHai> p = new PageImpl<>(List.of(testEntity));
        when(repo.searchDocuments(eq(null), eq(null), eq(null), any(Pageable.class))).thenReturn(p);
        KetQuaTimKiemResponse r = service.searchDocuments(null, null, "INVALID", 0, 20);
        assertThat(r).isNotNull();
    }
}
