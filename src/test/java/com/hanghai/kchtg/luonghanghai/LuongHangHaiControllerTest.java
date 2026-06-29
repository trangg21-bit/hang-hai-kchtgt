package com.hanghai.kchtg.luonghanghai;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.luonghanghai.controller.LuongHangHaiController;
import com.hanghai.kchtg.luonghanghai.dto.*;
import com.hanghai.kchtg.luonghanghai.entity.TinhTrang;
import com.hanghai.kchtg.luonghanghai.entity.TrangThaiPheDuyet;
import com.hanghai.kchtg.luonghanghai.service.LuongHangHaiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import com.hanghai.kchtg.security.PermissionAuthorizationManager;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
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

@WebMvcTest(LuongHangHaiController.class)
@WithMockUser(username = "admin", roles = "SYSTEM_ADMIN")
class LuongHangHaiControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean LuongHangHaiService service;
    @MockBean PermissionAuthorizationManager auth;

    @BeforeEach void setUp() {
        when(auth.check(any(), anyString())).thenReturn(true);

    private LuongHangHaiResponse testResp;
    private LuongHangHaiCreateRequest createReq;

    @BeforeEach void setUp() {
        testResp = LuongHangHaiResponse.builder()
                .id(1L).tenLuongHangHai("Tau cau cuoc Hai Phong")
                .soHieu("HH-001").thoiGianDuKien(LocalDate.of(2026,1,1))
                .donViQuanLy("Cuc Quang bao").diaChi("Hai Phong")
                .tinhTrang(TinhTrang.HOAT_DONG)
                .trangThaiPheDuyet(TrangThaiPheDuyet.PROPOSED)
                .nguoiTao("Admin").build();

        createReq = LuongHangHaiCreateRequest.builder()
                .tenLuongHangHai("Tau moi").soHieu("HH-002")
                .donViQuanLy("Cuc").diaChi("Ha Noi")
                .tinhTrang(TinhTrang.DANG_XAY_DUNG).nguoiTao("User1").build();
    }

    @Test void list_shouldReturnPaginated() throws Exception {
        when(service.findAll(0,20)).thenReturn(new PageImpl<>(List.of(testResp)));
        mockMvc.perform(get("/api/luong-hang-hai").param("page","0").param("size","20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].tenLuongHangHai").value("Tau cau cuoc Hai Phong"));
    }

    @Test void create_shouldReturnCreated() throws Exception {
        when(service.create(any())).thenReturn(testResp);
        mockMvc.perform(post("/api/luong-hang-hai")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Tao luong hang hai thanh cong"))
                .andExpect(jsonPath("$.data.tenLuongHangHai").value("Tau cau cuoc Hai Phong"));
    }

    @Test void create_shouldRejectNull() throws Exception {
        LuongHangHaiCreateRequest bad = LuongHangHaiCreateRequest.builder().tenLuongHangHai(null).build();
        mockMvc.perform(post("/api/luong-hang-hai")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(bad)))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test void get_shouldReturnOne() throws Exception {
        when(service.getById(1L)).thenReturn(testResp);
        mockMvc.perform(get("/api/luong-hang-hai/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tenLuongHangHai").value("Tau cau cuoc Hai Phong"));
    }

    @Test void update_shouldReturnUpdated() throws Exception {
        LuongHangHaiResponse up = LuongHangHaiResponse.builder().id(1L).tenLuongHangHai("Da cap nhat").build();
        when(service.update(eq(1L), any())).thenReturn(up);
        mockMvc.perform(put("/api/luong-hang-hai/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tenLuongHangHai").value("Da cap nhat"));
    }

    @Test void delete_shouldReturnOk() throws Exception {
        doNothing().when(service).delete(1L);
        mockMvc.perform(delete("/api/luong-hang-hai/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test void approveC1_shouldTransitionToUnderReview() throws Exception {
        PheDuyetResponse resp = PheDuyetResponse.builder()
                .luongHangHaiId(1L).capPheDuyet("PHONG").trangThai("UNDER_REVIEW").build();
        when(service.approve(eq(1L), any())).thenReturn(resp);
        PheDuyetRequest req = PheDuyetRequest.builder()
                .capPheDuyet("PHONG").trangThai("APPROVED").nguoiPheDuyet("Truong Phong").build();
        mockMvc.perform(post("/api/luong-hang-hai/1/approve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.trangThai").value("UNDER_REVIEW"));
    }

    @Test void approveC2_shouldTransitionToApproved() throws Exception {
        PheDuyetResponse resp = PheDuyetResponse.builder()
                .luongHangHaiId(1L).capPheDuyet("CUC").trangThai("APPROVED").build();
        when(service.approve(eq(1L), any())).thenReturn(resp);
        PheDuyetRequest req = PheDuyetRequest.builder()
                .capPheDuyet("CUC").trangThai("APPROVED").nguoiPheDuyet("Giam Doc").build();
        mockMvc.perform(post("/api/luong-hang-hai/1/approve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.trangThai").value("APPROVED"));
    }

    @Test void history_shouldReturnEntries() throws Exception {
        when(service.getHistory(1L)).thenReturn(List.of(
                HistoryEntry.builder().sangTrangThai("PROPOSED").ghiChu("Tao moi").build()));
        mockMvc.perform(get("/api/luong-hang-hai/1/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].sangTrangThai").value("PROPOSED"));
    }

    @Test void filterByApprovalStatus_shouldReturnResults() throws Exception {
        when(service.findByTrangThaiPheDuyet(TrangThaiPheDuyet.APPROVED)).thenReturn(List.of(testResp));
        mockMvc.perform(get("/api/luong-hang-hai/status-phe-duyet/APPROVED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].trangThaiPheDuyet").value("APPROVED"));
    }

    @Test void filterByStatus_shouldReturnResults() throws Exception {
        when(service.findByTinhTrang(TinhTrang.HOAT_DONG)).thenReturn(List.of(testResp));
        mockMvc.perform(get("/api/luong-hang-hai/status/HOAT_DONG"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].tinhTrang").value("HOAT_DONG"));
    }

    @Test void search_shouldReturnResults() throws Exception {
        KetQuaTimKiemResponse sr = KetQuaTimKiemResponse.builder()
                .results(List.of(testResp)).totalElements(1L).totalPages(1).currentPage(0).pageSize(20).build();
        when(service.searchDocuments(eq("Tau"), eq("Cuc"), eq("HOAT_DONG"), eq("APPROVED"), eq(0), eq(20)))
                .thenReturn(sr);
        mockMvc.perform(get("/api/luong-hang-hai/search")
                .param("keyword","Tau").param("donVi","Cuc")
                .param("tinhTrang","HOAT_DONG").param("trangThaiPheDuyet","APPROVED")
                .param("page","0").param("size","20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.results[0].tenLuongHangHai").value("Tau cau cuoc Hai Phong"));
    }

    @Test void filterByInvalidStatus_shouldThrow400() throws Exception {
        mockMvc.perform(get("/api/luong-hang-hai/status-phe-duyet/INVALID"))
                .andExpect(status().isBadRequest());
    }

    @Test void filterByInvalidTinhTrang_shouldThrow400() throws Exception {
        mockMvc.perform(get("/api/luong-hang-hai/status/INVALID"))
                .andExpect(status().isBadRequest());
    }

    @Test void approve_shouldThrowWhenNotFound() throws Exception {
        when(service.approve(eq(99L), any())).thenThrow(new IllegalArgumentException("Khong tim thay"));
        PheDuyetRequest req = PheDuyetRequest.builder().capPheDuyet("PHONG").nguoiPheDuyet("Truong").build();
        mockMvc.perform(post("/api/luong-hang-hai/99/approve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isInternalServerError());
    }
}