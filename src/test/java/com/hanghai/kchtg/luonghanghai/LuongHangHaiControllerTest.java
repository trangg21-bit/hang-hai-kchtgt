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
@WithMockUser
class LuongHangHaiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private LuongHangHaiService luongHangHaiService;

    private LuongHangHaiResponse testResponse;
    private LuongHangHaiCreateRequest createRequest;

    @BeforeEach
    void setUp() {
        testResponse = LuongHangHaiResponse.builder()
                .id(1L)
                .tenLuongHangHai("Tau cau cuoc Hai Phong")
                .soHieu("HH-001")
                .thoiGianDuKien(LocalDate.of(2026, 1, 1))
                .donViQuanLy("Cuc Quang bao Hai quan")
                .diaChi("Hai Phong")
                .tinhTrang(TinhTrang.HOAT_DONG)
                .trangThaiPheDuyet(TrangThaiPheDuyet.PROPOSED)
                .nguoiTao("Admin")
                .build();

        createRequest = LuongHangHaiCreateRequest.builder()
                .tenLuongHangHai("Tau cau cuoc moi")
                .soHieu("HH-002")
                .donViQuanLy("Cuc Quang bao")
                .diaChi("Ha Noi")
                .tinhTrang(TinhTrang.DANG_XAY_DUNG)
                .nguoiTao("User1")
                .build();
    }

    @Test
    void listLuongHangHai_shouldReturnPaginated() throws Exception {
        when(luongHangHaiService.findAll(0, 20))
                .thenReturn(new PageImpl<>(List.of(testResponse)));

        mockMvc.perform(get("/api/luong-hang-hai")
                        .param("page", "0").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].tenLuongHangHai").value("Tau cau cuoc Hai Phong"));
    }

    @Test
    void createLuongHangHai_shouldReturnCreated() throws Exception {
        when(luongHangHaiService.create(any(LuongHangHaiCreateRequest.class)))
                .thenReturn(testResponse);

        mockMvc.perform(post("/api/luong-hang-hai")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Tao luong hang hai thanh cong"))
                .andExpect(jsonPath("$.data.tenLuongHangHai").value("Tau cau cuoc Hai Phong"));
    }

    @Test
    void createLuongHangHai_shouldRejectNull() throws Exception {
        LuongHangHaiCreateRequest nullRequest = LuongHangHaiCreateRequest.builder()
                .tenLuongHangHai(null)
                .build();

        mockMvc.perform(post("/api/luong-hang-hai")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(nullRequest)))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void getLuongHangHai_shouldReturnOne() throws Exception {
        when(luongHangHaiService.getById(1L)).thenReturn(testResponse);

        mockMvc.perform(get("/api/luong-hang-hai/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tenLuongHangHai").value("Tau cau cuoc Hai Phong"));
    }

    @Test
    void updateLuongHangHai_shouldReturnUpdated() throws Exception {
        LuongHangHaiResponse updated = LuongHangHaiResponse.builder()
                .id(1L)
                .tenLuongHangHai("Da cap nhat")
                .build();
        when(luongHangHaiService.update(eq(1L), any(LuongHangHaiCreateRequest.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/luong-hang-hai/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tenLuongHangHai").value("Da cap nhat"));
    }

    @Test
    void deleteLuongHangHai_shouldReturnOk() throws Exception {
        doNothing().when(luongHangHaiService).delete(1L);

        mockMvc.perform(delete("/api/luong-hang-hai/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isEmpty());
    }

    @Test
    void approveLuongHangHai_shouldReturnApproved() throws Exception {
        PheDuyetResponse approveResp = PheDuyetResponse.builder()
                .luongHangHaiId(1L)
                .capPheDuyet("PHONG")
                .trangThai("UNDER_REVIEW")
                .nguoiPheDuyet("Truong Phong")
                .build();

        when(luongHangHaiService.approve(eq(1L), any(PheDuyetRequest.class)))
                .thenReturn(approveResp);

        PheDuyetRequest request = PheDuyetRequest.builder()
                .capPheDuyet("PHONG")
                .trangThai("APPROVED")
                .nguoiPheDuyet("Truong Phong")
                .build();

        mockMvc.perform(post("/api/luong-hang-hai/1/approve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.trangThai").value("UNDER_REVIEW"));
    }

    @Test
    void getHistory_shouldReturnHistoryEntries() throws Exception {
        List<HistoryEntry> history = List.of(
                HistoryEntry.builder()
                        .thoiGian("2026-06-01T10:00:00")
                        .nguoiThucHien("Admin")
                        .tuTrangThai(null)
                        .sangTrangThai("PROPOSED")
                        .ghiChu("Tao moi luong hang hai")
                        .build()
        );
        when(luongHangHaiService.getHistory(1L)).thenReturn(history);

        mockMvc.perform(get("/api/luong-hang-hai/1/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].sangTrangThai").value("PROPOSED"));
    }

    @Test
    void filterByApprovalStatus_shouldReturnResults() throws Exception {
        when(luongHangHaiService.findByTrangThaiPheDuyet(TrangThaiPheDuyet.APPROVED))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/luong-hang-hai/status-phe-duyet/APPROVED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].id").value(1));
    }

    @Test
    void filterByStatus_shouldReturnResults() throws Exception {
        when(luongHangHaiService.findByTinhTrang(TinhTrang.HOAT_DONG))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/luong-hang-hai/status/HOAT_DONG"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].tinhTrang").value("HOAT_DONG"));
    }

    @Test
    void searchDocuments_shouldReturnPaginatedResults() throws Exception {
        KetQuaTimKiemResponse searchResult = KetQuaTimKiemResponse.builder()
                .results(List.of(testResponse))
                .totalElements(1L)
                .totalPages(1)
                .currentPage(0)
                .pageSize(20)
                .build();

        when(luongHangHaiService.searchDocuments(
                eq("Tau"), eq("Cuc"), any(), any(), eq(0), eq(20)))
                .thenReturn(searchResult);

        mockMvc.perform(get("/api/luong-hang-hai/search")
                        .param("keyword", "Tau")
                        .param("donVi", "Cuc")
                        .param("page", "0").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.results[0].tenLuongHangHai").value("Tau cau cuoc Hai Phong"));
    }

    @Test
    void searchDocuments_shouldReturnEmptyWhenNoMatch() throws Exception {
        KetQuaTimKiemResponse emptyResult = KetQuaTimKiemResponse.builder()
                .results(List.of())
                .totalElements(0L)
                .totalPages(0)
                .currentPage(0)
                .pageSize(20)
                .build();

        when(luongHangHaiService.searchDocuments(
                eq("NonExistent"), eq(null), any(), any(), eq(0), eq(20)))
                .thenReturn(emptyResult);

        mockMvc.perform(get("/api/luong-hang-hai/search")
                        .param("keyword", "NonExistent"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(0));
    }

    @Test
    void filterByInvalidApprovalStatus_shouldThrow400() throws Exception {
        mockMvc.perform(get("/api/luong-hang-hai/status-phe-duyet/INVALID_STATUS"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void filterByInvalidStatus_shouldThrow400() throws Exception {
        mockMvc.perform(get("/api/luong-hang-hai/status/INVALID_TINH_TRANG"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void approveLuongHangHaiCuc_shouldTransitionToApproved() throws Exception {
        PheDuyetResponse approvedResp = PheDuyetResponse.builder()
                .luongHangHaiId(1L)
                .capPheDuyet("CUC")
                .trangThai("APPROVED")
                .nguoiPheDuyet("Giam Doc")
                .build();

        when(luongHangHaiService.approve(eq(1L), any(PheDuyetRequest.class)))
                .thenReturn(approvedResp);

        PheDuyetRequest request = PheDuyetRequest.builder()
                .capPheDuyet("CUC")
                .trangThai("APPROVED")
                .nguoiPheDuyet("Giam Doc")
                .build();

        mockMvc.perform(post("/api/luong-hang-hai/1/approve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.trangThai").value("APPROVED"));
    }
}
