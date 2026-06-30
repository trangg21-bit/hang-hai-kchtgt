package com.hanghai.kchtg.deke;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.deke.controller.DeKeController;
import com.hanghai.kchtg.deke.dto.*;
import com.hanghai.kchtg.deke.entity.DeKeApprovalStatus;
import com.hanghai.kchtg.deke.service.DeKeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class DeKeControllerTest {

    private DeKeController controller;
    private DeKeService service;
    private ObjectMapper objectMapper;

    private DeKeResponse testResp;
    private DeKeCreateRequest createReq;

    @BeforeEach void setUp() {
        service = mock(DeKeService.class);
        controller = new DeKeController(service);
        objectMapper = new ObjectMapper();

        testResp = DeKeResponse.builder()
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
                .createdBy("Admin")
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

    @Test void create_shouldReturnSuccessResponse() {
        when(service.create(any())).thenReturn(testResp);

        var resp = controller.create(createReq);

        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody().isSuccess()).isTrue();
        assertThat(resp.getBody().getMessage()).isEqualTo("Tao de ke thanh cong");
        assertThat(resp.getBody().getData().getLoaiDe()).isEqualTo("De ke son");
        verify(service, times(1)).create(any());
    }

    // ── getById ─────────────────────────────────────────────────────────

    @Test void getById_shouldReturnResponse() {
        when(service.getById(1L)).thenReturn(testResp);

        var resp = controller.getById(1L);

        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody().getData().getLoaiDe()).isEqualTo("De ke son");
        verify(service, times(1)).getById(1L);
    }

    // ── list ────────────────────────────────────────────────────────────

    @Test void list_shouldReturnPageContent() {
        when(service.findAll(0, 20)).thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(testResp)));

        var resp = controller.list(0, 20);

        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody().getData()).hasSize(1);
        assertThat(resp.getBody().getData().get(0).getLoaiDe()).isEqualTo("De ke son");
        verify(service, times(1)).findAll(0, 20);
    }

    // ── update ──────────────────────────────────────────────────────────

    @Test void update_shouldReturnUpdated() {
        DeKeResponse up = DeKeResponse.builder().id(1L).loaiDe("Da cap nhat").build();
        when(service.update(eq(1L), any())).thenReturn(up);

        DeKeUpdateRequest updateReq = DeKeUpdateRequest.builder()
                .loaiDe("Da cap nhat").viTri("Da Nang").build();
        var resp = controller.update(1L, updateReq);

        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody().getData().getLoaiDe()).isEqualTo("Da cap nhat");
        verify(service, times(1)).update(eq(1L), any());
    }

    // ── softDelete ──────────────────────────────────────────────────────

    @Test void softDelete_shouldReturnOk() {
        doNothing().when(service).softDelete(1L);

        var resp = controller.softDelete(1L);

        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody().isSuccess()).isTrue();
        assertThat(resp.getBody().getMessage()).isEqualTo("Xoa mem de ke thanh cong");
        verify(service, times(1)).softDelete(1L);
    }

    // ── approveC1 ───────────────────────────────────────────────────────

    @Test void approveC1_shouldReturnUnderReview() {
        PheDuyetResponse resp = PheDuyetResponse.builder()
                .deKeId(1L)
                .capPheDuyet(1)
                .trangThai("UNDER_REVIEW")
                .nguoiPheDuyet("Truong Phong")
                .build();
        when(service.approveC1(eq(1L), any())).thenReturn(resp);

        var ctrlResp = controller.approveC1(1L, PheDuyetRequest.builder()
                .quyetDinh("APPROVED")
                .nguoiPheDuyet("Truong Phong")
                .lyDo("Phe cap 1")
                .build());

        assertThat(ctrlResp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(ctrlResp.getBody().getData().getTrangThai()).isEqualTo("UNDER_REVIEW");
        assertThat(ctrlResp.getBody().getData().getCapPheDuyet()).isEqualTo(1);
        verify(service, times(1)).approveC1(eq(1L), any());
    }

    // ── approveC2 ───────────────────────────────────────────────────────

    @Test void approveC2_shouldReturnApproved() {
        PheDuyetResponse resp = PheDuyetResponse.builder()
                .deKeId(1L)
                .capPheDuyet(2)
                .trangThai("APPROVED")
                .nguoiPheDuyet("Giam Doc")
                .build();
        when(service.approveC2(eq(1L), any())).thenReturn(resp);

        var ctrlResp = controller.approveC2(1L, PheDuyetRequest.builder()
                .quyetDinh("APPROVED")
                .nguoiPheDuyet("Giam Doc")
                .lyDo("Phe cap 2")
                .build());

        assertThat(ctrlResp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(ctrlResp.getBody().getData().getTrangThai()).isEqualTo("APPROVED");
        assertThat(ctrlResp.getBody().getData().getCapPheDuyet()).isEqualTo(2);
        verify(service, times(1)).approveC2(eq(1L), any());
    }

    // ── getApprovalHistory ──────────────────────────────────────────────

    @Test void getApprovalHistory_shouldReturnEntries() {
        when(service.getApprovalHistory(1L)).thenReturn(List.of(
                HistoryEntry.builder().deKeId(1L).trangThai("PROPOSED").lyDo("Tao moi").build()));

        var resp = controller.getApprovalHistory(1L);

        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody().getData()).hasSize(1);
        assertThat(resp.getBody().getData().get(0).getTrangThai()).isEqualTo("PROPOSED");
        verify(service, times(1)).getApprovalHistory(1L);
    }

    // ── filterByStatus ──────────────────────────────────────────────────

    @Test void filterByApprovalStatus_shouldReturnResults() {
        DeKeResponse approvedResp = DeKeResponse.builder()
                .id(1L)
                .loaiDe("De ke da duyet")
                .trangThaiPheDuyet(DeKeApprovalStatus.APPROVED)
                .build();
        when(service.findByTrangThaiPheDuyet(DeKeApprovalStatus.APPROVED)).thenReturn(List.of(approvedResp));

        var resp = controller.filterByStatus("APPROVED");

        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody().getData()).hasSize(1);
        assertThat(resp.getBody().getData().get(0).getTrangThaiPheDuyet()).isEqualTo(DeKeApprovalStatus.APPROVED);
        verify(service, times(1)).findByTrangThaiPheDuyet(DeKeApprovalStatus.APPROVED);
    }

    @Test void filterByInvalidStatus_shouldThrowException() {
        when(service.findByTrangThaiPheDuyet(any()))
                .thenThrow(new IllegalArgumentException("No enum constant"));

        assertThatThrownBy(() -> controller.filterByStatus("INVALID"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ── search ──────────────────────────────────────────────────────────

    @Test void search_shouldReturnResults() {
        KetQuaTimKiemResponse sr = KetQuaTimKiemResponse.builder()
                .results(List.of(testResp))
                .totalElements(1L)
                .totalPages(1)
                .currentPage(0)
                .pageSize(20)
                .build();
        when(service.searchDocuments(eq("De ke"), eq(null), eq(null), eq(null), eq(0), eq(20)))
                .thenReturn(sr);

        var resp = controller.search("De ke", null, null, null, 0, 20);

        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody().getData().getTotalElements()).isEqualTo(1);
        assertThat(resp.getBody().getData().getResults()).hasSize(1);
        verify(service, times(1)).searchDocuments(eq("De ke"), eq(null), eq(null), eq(null), eq(0), eq(20));
    }

    // ── error propagation ───────────────────────────────────────────────

    @Test void approveC1_shouldThrowWhenNotFound() {
        when(service.approveC1(eq(99L), any())).thenThrow(new IllegalArgumentException("Khong tim thay"));

        assertThatThrownBy(() -> controller.approveC1(99L, PheDuyetRequest.builder()
                .quyetDinh("APPROVED")
                .nguoiPheDuyet("Truong")
                .build()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Khong tim thay");
        verify(service, times(1)).approveC1(eq(99L), any());
    }
}
