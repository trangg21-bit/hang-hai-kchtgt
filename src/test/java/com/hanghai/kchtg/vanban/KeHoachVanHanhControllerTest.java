package com.hanghai.kchtg.vanban;

import com.hanghai.kchtg.vanban.controller.KeHoachVanHanhController;
import com.hanghai.kchtg.vanban.dto.*;
import com.hanghai.kchtg.vanban.entity.*;
import com.hanghai.kchtg.vanban.service.KeHoachVanHanhService;
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

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.security.test.context.support.WithMockUser;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(roles = "SYSTEM_ADMIN")
class KeHoachVanHanhControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private KeHoachVanHanhService keHoachVanHanhService;

    private KeHoachVanHanhResponse testResponse;
    private KeHoachVanHanhCreateRequest createRequest;

    @BeforeEach
    void setUp() {
        testResponse = KeHoachVanHanhResponse.builder()
                .id(1L)
                .ngayVanHanh(LocalDate.of(2026, 7, 15))
                .cauCang("Bến Cảng A")
                .thietBi("Cần trục 01")
                .thoiGianBatDau(LocalTime.of(8, 0))
                .thoiGianKetThuc(LocalTime.of(17, 0))
                .tinhTrang(TinhTrangVanHanh.DA_PHE_DUYET)
                .nguoiTao("Admin")
                .build();

        createRequest = KeHoachVanHanhCreateRequest.builder()
                .ngayVanHanh(LocalDate.of(2026, 7, 16))
                .cauCang("Bến Cảng B")
                .thietBi("Cần trục 02")
                .thoiGianBatDau(LocalTime.of(9, 0))
                .thoiGianKetThuc(LocalTime.of(16, 0))
                .tinhTrang(TinhTrangVanHanh.DA_PHE_DUYET)
                .nguoiTao("User1")
                .build();
    }

    @Test
    void listPlans_shouldReturnAll() throws Exception {
        when(keHoachVanHanhService.findAll(anyInt(), anyInt()))
                .thenReturn(new PageImpl<>(List.of(testResponse)));

        mockMvc.perform(get("/api/v1/van-hanh")
                        .param("page", "0").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].cauCang").value("Bến Cảng A"));
    }

    @Test
    void createPlan_shouldReturnCreated() throws Exception {
        when(keHoachVanHanhService.create(any(KeHoachVanHanhCreateRequest.class)))
                .thenReturn(testResponse);

        mockMvc.perform(post("/api/v1/van-hanh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.cauCang").value("Bến Cảng A"));
    }

    @Test
    void getPlan_shouldReturnOne() throws Exception {
        when(keHoachVanHanhService.getById(1L)).thenReturn(testResponse);

        mockMvc.perform(get("/api/v1/van-hanh/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.thietBi").value("Cần trục 01"));
    }

    @Test
    void updatePlan_shouldReturnUpdated() throws Exception {
        KeHoachVanHanhResponse updated = KeHoachVanHanhResponse.builder()
                .id(1L)
                .cauCang("Bến Cảng C - Đã cập nhật")
                .build();
        when(keHoachVanHanhService.update(eq(1L), any(KeHoachVanHanhCreateRequest.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/v1/van-hanh/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cauCang").value("Bến Cảng C - Đã cập nhật"));
    }

    @Test
    void deletePlan_shouldReturnOk() throws Exception {
        doNothing().when(keHoachVanHanhService).delete(1L);

        mockMvc.perform(delete("/api/v1/van-hanh/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void filterByDate_shouldReturnMatchingPlans() throws Exception {
        when(keHoachVanHanhService.findByNgayVanHanh(LocalDate.of(2026, 7, 15)))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/van-hanh/date/2026-07-15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].ngayVanHanh").value("2026-07-15"));
    }

    @Test
    void filterByStatus_shouldReturnMatchingPlans() throws Exception {
        when(keHoachVanHanhService.findByTinhTrang(any(TinhTrangVanHanh.class)))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/van-hanh/status/DA_PHE_DUYET"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void filterByCauCang_shouldReturnMatchingPlans() throws Exception {
        when(keHoachVanHanhService.findByCauCang("Bến Cảng A"))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/van-hanh/caucang/Bến Cảng A"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].cauCang").value("Bến Cảng A"));
    }

    @Test
    void filterByThietBi_shouldReturnMatchingPlans() throws Exception {
        when(keHoachVanHanhService.findByThietBi("Cần trục 01"))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/van-hanh/thietbi/Cần trục 01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].thietBi").value("Cần trục 01"));
    }

    @Test
    void checkConflict_shouldReturnFalse() throws Exception {
        when(keHoachVanHanhService.hasConflictSchedule(
                any(LocalDate.class), any(LocalTime.class), any(LocalTime.class), any(), any()))
                .thenReturn(false);

        mockMvc.perform(get("/api/v1/van-hanh/conflict")
                        .param("ngayVanHanh", "2026-07-15")
                        .param("thoiGianBatDau", "08:00:00")
                        .param("thoiGianKetThuc", "17:00:00")
                        .param("cauCang", "Bến Cảng A")
                        .param("thietBi", "Cần trục 01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(false));
    }

    @Test
    void checkConflict_shouldReturnTrue() throws Exception {
        when(keHoachVanHanhService.hasConflictSchedule(
                any(LocalDate.class), any(LocalTime.class), any(LocalTime.class), any(), any()))
                .thenReturn(true);

        mockMvc.perform(get("/api/v1/van-hanh/conflict")
                        .param("ngayVanHanh", "2026-07-15")
                        .param("thoiGianBatDau", "08:00:00")
                        .param("thoiGianKetThuc", "17:00:00")
                        .param("cauCang", "Bến Cảng A")
                        .param("thietBi", "Cần trục 01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(true));
    }
}
