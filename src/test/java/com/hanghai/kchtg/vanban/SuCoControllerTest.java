package com.hanghai.kchtg.vanban;

import com.hanghai.kchtg.vanban.controller.SuCoController;
import com.hanghai.kchtg.vanban.dto.*;
import com.hanghai.kchtg.vanban.entity.*;
import com.hanghai.kchtg.vanban.service.SuCoService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.security.test.context.support.WithMockUser;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser
class SuCoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SuCoService suCoService;

    private SuCoResponse testResponse;
    private SuCoCreateRequest createRequest;
    private TienDoXuLyRequest progressRequest;

    @BeforeEach
    void setUp() {
        testResponse = SuCoResponse.builder()
                .id(1L)
                .thoiGianPhatHien(LocalDateTime.of(2026, 6, 29, 14, 30))
                .viTri("Bến Cảng A - Khu vực xếp dỡ")
                .mucDoNghiemTrong(MucDoNghiemTrong.NGHIEM_TRONG)
                .moTa("Rò rỉ dầu tại cần trục 01")
                .tinhTrangXuLy(TinhTrangXuLy.DANG_XU_LY)
                .nguoiBaoCao("Kỹ thuật viên A")
                .build();

        createRequest = SuCoCreateRequest.builder()
                .viTri("Bến Cảng B - Khu vực tiếp nhận")
                .mucDoNghiemTrong(MucDoNghiemTrong.NHE)
                .moTa("Hư hỏng hệ thống chiếu sáng")
                .nguoiBaoCao("Nhân viên B")
                .build();

        progressRequest = TienDoXuLyRequest.builder()
                .suCoId(1L)
                .moTaTienDo("Đã thay thế seal dầu")
                .nguoiCapNhat("Kỹ thuật viên C")
                .build();
    }

    @Test
    void listIncidents_shouldReturnAll() throws Exception {
        when(suCoService.findAll(anyInt(), anyInt()))
                .thenReturn(new PageImpl<>(List.of(testResponse)));

        mockMvc.perform(get("/api/v1/su-co")
                        .param("page", "0").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].viTri").value("Bến Cảng A - Khu vực xếp dỡ"));
    }

    @Test
    void createIncident_shouldReturnCreated() throws Exception {
        when(suCoService.create(any(SuCoCreateRequest.class)))
                .thenReturn(testResponse);

        mockMvc.perform(post("/api/v1/su-co")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.moTa").value("Rò rỉ dầu tại cần trục 01"));
    }

    @Test
    void getIncident_shouldReturnOne() throws Exception {
        when(suCoService.getById(1L)).thenReturn(testResponse);

        mockMvc.perform(get("/api/v1/su-co/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.viTri").value("Bến Cảng A - Khu vực xếp dỡ"));
    }

    @Test
    void updateIncident_shouldReturnUpdated() throws Exception {
        SuCoResponse updated = SuCoResponse.builder()
                .id(1L)
                .moTa("Đã sửa đổi mô tả sự cố")
                .build();
        when(suCoService.update(eq(1L), any(SuCoCreateRequest.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/v1/su-co/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.moTa").value("Đã sửa đổi mô tả sự cố"));
    }

    @Test
    void deleteIncident_shouldReturnOk() throws Exception {
        doNothing().when(suCoService).delete(1L);

        mockMvc.perform(delete("/api/v1/su-co/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void addProgress_shouldReturnCreated() throws Exception {
        TienDoXuLyResponse progressResponse = TienDoXuLyResponse.builder()
                .id(1L)
                .suCoId(1L)
                .moTaTienDo("Đã thay thế seal dầu")
                .nguoiCapNhat("Kỹ thuật viên C")
                .build();

        when(suCoService.addProgress(any(TienDoXuLyRequest.class)))
                .thenReturn(progressResponse);

        mockMvc.perform(post("/api/v1/su-co/progress")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(progressRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.moTaTienDo").value("Đã thay thế seal dầu"));
    }

    @Test
    void getProgress_shouldReturnHistory() throws Exception {
        TienDoXuLyResponse progressResponse = TienDoXuLyResponse.builder()
                .id(1L)
                .suCoId(1L)
                .moTaTienDo("Đã thay thế seal dầu")
                .nguoiCapNhat("Kỹ thuật viên C")
                .build();

        when(suCoService.getProgressBySuCo(1L))
                .thenReturn(List.of(progressResponse));

        mockMvc.perform(get("/api/v1/su-co/1/progress"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].moTaTienDo").value("Đã thay thế seal dầu"));
    }

    @Test
    void filterByStatus_shouldReturnMatchingIncidents() throws Exception {
        when(suCoService.findByTinhTrangXuLy(any(TinhTrangXuLy.class)))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/su-co/status/DANG_XU_LY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void filterBySeverity_shouldReturnMatchingIncidents() throws Exception {
        when(suCoService.findByMucDoNghiemTrong(any(MucDoNghiemTrong.class)))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/su-co/severity/NGHIEM_TRONG"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void searchByLocation_shouldReturnMatchingIncidents() throws Exception {
        when(suCoService.searchByViTriContaining("Bến Cảng A", 0, 20))
                .thenReturn(new PageImpl<>(List.of(testResponse)));

        mockMvc.perform(get("/api/v1/su-co/search/location")
                        .param("location", "Bến Cảng A")
                        .param("page", "0").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].viTri").value("Bến Cảng A - Khu vực xếp dỡ"));
    }

    @Test
    void searchByDescription_shouldReturnMatchingIncidents() throws Exception {
        when(suCoService.searchByMoTaContaining("rò rỉ", 0, 20))
                .thenReturn(new PageImpl<>(List.of(testResponse)));

        mockMvc.perform(get("/api/v1/su-co/search/description")
                        .param("description", "rò rỉ")
                        .param("page", "0").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].moTa").value("Rò rỉ dầu tại cần trục 01"));
    }
}
