package com.hanghai.kchtg.luonghanghai;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.luonghanghai.controller.LuongHangHaiController;
import com.hanghai.kchtg.luonghanghai.dto.*;
import com.hanghai.kchtg.luonghanghai.entity.LuongHangHaiApprovalStatus;
import com.hanghai.kchtg.luonghanghai.service.LuongHangHaiService;
import com.hanghai.kchtg.security.PermissionAuthorizationManager;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(username = "admin", roles = "SYSTEM_ADMIN")
class LuongHangHaiControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean LuongHangHaiService service;
    @MockBean PermissionAuthorizationManager auth;

    private LuongHangHaiResponse testResp;
    private LuongHangHaiCreateRequest createReq;

    @BeforeEach void setUp() {
        when(auth.check(any(), anyString())).thenReturn(true);

        testResp = LuongHangHaiResponse.builder()
                .id(1L)
                .loaiTau("Tau ca cuoc Hai Phong")
                .soLuong(100)
                .ngayGhiNhan(LocalDate.of(2026, 1, 1))
                .gioDien("12:00")
                .taiTrong("1000")
                .dienTichDangBo("200")
                .ghiChu("Test ghi chu")
                .approvalStatus(LuongHangHaiApprovalStatus.PROPOSED)
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .createdBy("Admin")
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

    @Test void list_shouldReturnPaginated() throws Exception {
        when(service.findAll(0, 20)).thenReturn(new PageImpl<>(List.of(testResp)));
        mockMvc.perform(get("/api/v1/luong-hang-hai").param("page", "0").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].loaiTau").value("Tau ca cuoc Hai Phong"));
    }

    @Test void create_shouldReturnCreated() throws Exception {
        when(service.create(any())).thenReturn(testResp);
        mockMvc.perform(post("/api/v1/luong-hang-hai")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Tao luong hang hai thanh cong"))
                .andExpect(jsonPath("$.data.loaiTau").value("Tau ca cuoc Hai Phong"));
    }

    @Test void create_shouldRejectNull() throws Exception {
        LuongHangHaiCreateRequest bad = LuongHangHaiCreateRequest.builder().loaiTau(null).build();
        mockMvc.perform(post("/api/v1/luong-hang-hai")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(bad)))
                .andExpect(status().isBadRequest());
    }

    @Test void get_shouldReturnOne() throws Exception {
        when(service.getById(1L)).thenReturn(testResp);
        mockMvc.perform(get("/api/v1/luong-hang-hai/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.loaiTau").value("Tau ca cuoc Hai Phong"));
    }

    @Test void update_shouldReturnUpdated() throws Exception {
        LuongHangHaiResponse up = LuongHangHaiResponse.builder().id(1L).loaiTau("Da cap nhat").build();
        when(service.update(eq(1L), any())).thenReturn(up);
        mockMvc.perform(put("/api/v1/luong-hang-hai/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.loaiTau").value("Da cap nhat"));
    }

    @Test void softDelete_shouldReturnOk() throws Exception {
        doNothing().when(service).softDelete(1L);
        mockMvc.perform(delete("/api/v1/luong-hang-hai/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test void approveC1_shouldReturnUnderReview() throws Exception {
        PheDuyetResponse resp = PheDuyetResponse.builder()
                .luongHangHaiId(1L)
                .capPheDuyet(1)
                .trangThai("UNDER_REVIEW")
                .nguoiPheDuyet("Truong Phong")
                .build();
        when(service.approveC1(eq(1L), any())).thenReturn(resp);
        PheDuyetRequest req = PheDuyetRequest.builder()
                .trangThai("APPROVED")
                .nguoiPheDuyet("Truong Phong")
                .lyDo("Phe cap 1")
                .build();
        mockMvc.perform(post("/api/v1/luong-hang-hai/1/approve/c1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.trangThai").value("UNDER_REVIEW"));
    }

    @Test void approveC2_shouldReturnApproved() throws Exception {
        PheDuyetResponse resp = PheDuyetResponse.builder()
                .luongHangHaiId(1L)
                .capPheDuyet(2)
                .trangThai("APPROVED")
                .nguoiPheDuyet("Giam Doc")
                .build();
        when(service.approveC2(eq(1L), any())).thenReturn(resp);
        PheDuyetRequest req = PheDuyetRequest.builder()
                .trangThai("APPROVED")
                .nguoiPheDuyet("Giam Doc")
                .lyDo("Phe cap 2")
                .build();
        mockMvc.perform(post("/api/v1/luong-hang-hai/1/approve/c2")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.trangThai").value("APPROVED"));
    }

    @Test void history_shouldReturnEntries() throws Exception {
        when(service.getApprovalHistory(1L)).thenReturn(List.of(
                HistoryEntry.builder().luongHangHaiId(1L).trangThai("PROPOSED").lyDo("Tao moi").build()));
        mockMvc.perform(get("/api/v1/luong-hang-hai/1/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].trangThai").value("PROPOSED"));
    }

    @Test void filterByApprovalStatus_shouldReturnResults() throws Exception {
        LuongHangHaiResponse approvedResp = LuongHangHaiResponse.builder()
                .id(1L)
                .loaiTau("Tau da duyet")
                .approvalStatus(LuongHangHaiApprovalStatus.APPROVED)
                .build();
        when(service.findByApprovalStatus(LuongHangHaiApprovalStatus.APPROVED)).thenReturn(List.of(approvedResp));
        mockMvc.perform(get("/api/v1/luong-hang-hai/status-phe-duyet/APPROVED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].approvalStatus").value("APPROVED"));
    }

    @Test void search_shouldReturnResults() throws Exception {
        KetQuaTimKiemResponse sr = KetQuaTimKiemResponse.builder()
                .results(List.of(testResp))
                .totalElements(1L)
                .totalPages(1)
                .currentPage(0)
                .pageSize(20)
                .build();
        when(service.searchDocuments(eq("Tau"), eq(null), eq(null), eq(null), eq(0), eq(20)))
                .thenReturn(sr);
        mockMvc.perform(get("/api/v1/luong-hang-hai/search")
                .param("keyword", "Tau")
                .param("page", "0")
                .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.results[0].loaiTau").value("Tau ca cuoc Hai Phong"));
    }

    @Test void filterByInvalidStatus_shouldThrow400() throws Exception {
        mockMvc.perform(get("/api/v1/luong-hang-hai/status-phe-duyet/INVALID"))
                .andExpect(status().isBadRequest());
    }

    @Test void approveC1_shouldThrowWhenNotFound() throws Exception {
        when(service.approveC1(eq(99L), any())).thenThrow(new IllegalArgumentException("Khong tim thay"));
        PheDuyetRequest req = PheDuyetRequest.builder().nguoiPheDuyet("Truong").build();
        mockMvc.perform(post("/api/v1/luong-hang-hai/99/approve/c1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test void list_defaultPage_shouldWork() throws Exception {
        when(service.findAll(0, 20)).thenReturn(new PageImpl<>(List.of()));
        mockMvc.perform(get("/api/v1/luong-hang-hai"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data").isEmpty());
    }
}