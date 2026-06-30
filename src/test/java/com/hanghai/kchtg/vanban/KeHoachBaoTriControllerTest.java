package com.hanghai.kchtg.vanban;

import com.hanghai.kchtg.vanban.controller.KeHoachBaoTriController;
import com.hanghai.kchtg.vanban.dto.*;
import com.hanghai.kchtg.vanban.entity.*;
import com.hanghai.kchtg.vanban.service.KeHoachBaoTriService;
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

import java.math.BigDecimal;
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
class KeHoachBaoTriControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private KeHoachBaoTriService keHoachBaoTriService;

    private KeHoachBaoTriResponse testResponse;
    private KeHoachBaoTriCreateRequest createRequest;
    private KetQuaBaoTriRequest resultRequest;

    @BeforeEach
    void setUp() {
        testResponse = KeHoachBaoTriResponse.builder()
                .id(1L)
                .thietBi("Máy bơm nước 01")
                .loaiBaoTri(LoaiBaoTri.DINH_KY)
                .ngayBatDauDuKien(LocalDate.of(2026, 8, 1))
                .ngayKetThucDuKien(LocalDate.of(2026, 8, 3))
                .tinhTrang(TinhTrangBaoTri.DANG_THUC_HIEN)
                .chiPhiDuKien(new BigDecimal("15000000"))
                .nguoiTao("Admin")
                .build();

        createRequest = KeHoachBaoTriCreateRequest.builder()
                .thietBi("Máy nén khí 02")
                .loaiBaoTri(LoaiBaoTri.SUA_CHUA_KHAN_CAP)
                .ngayBatDauDuKien(LocalDate.of(2026, 8, 5))
                .ngayKetThucDuKien(LocalDate.of(2026, 8, 6))
                .tinhTrang(TinhTrangBaoTri.CHO_DOI_PHUY)
                .chiPhiDuKien(new BigDecimal("8000000"))
                .nguoiTao("User1")
                .build();

        resultRequest = KetQuaBaoTriRequest.builder()
                .keHoachId(1L)
                .thoiGianBatDauThucTe(java.time.LocalDateTime.of(2026, 8, 1, 8, 0))
                .thoiGianKetThucThucTe(java.time.LocalDateTime.of(2026, 8, 1, 12, 0))
                .moTaKetQua("Bảo trì thành công")
                .phuTonThayThe("Đèn LED 02 cái")
                .thoiGianNgungHoatDong(4L)
                .nguoiGhiNhan("Kỹ thuật viên A")
                .ngayGhiNhan(LocalDate.of(2026, 8, 1))
                .build();
    }

    @Test
    void listPlans_shouldReturnAll() throws Exception {
        when(keHoachBaoTriService.findAll(anyInt(), anyInt()))
                .thenReturn(new PageImpl<>(List.of(testResponse)));

        mockMvc.perform(get("/api/v1/ke-hoach-bao-tri")
                        .param("page", "0").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].thietBi").value("Máy bơm nước 01"));
    }

    @Test
    void createPlan_shouldReturnCreated() throws Exception {
        when(keHoachBaoTriService.create(any(KeHoachBaoTriCreateRequest.class)))
                .thenReturn(testResponse);

        mockMvc.perform(post("/api/v1/ke-hoach-bao-tri")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.thietBi").value("Máy bơm nước 01"));
    }

    @Test
    void getPlan_shouldReturnOne() throws Exception {
        when(keHoachBaoTriService.getById(1L)).thenReturn(testResponse);

        mockMvc.perform(get("/api/v1/ke-hoach-bao-tri/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.thietBi").value("Máy bơm nước 01"));
    }

    @Test
    void updatePlan_shouldReturnUpdated() throws Exception {
        KeHoachBaoTriResponse updated = KeHoachBaoTriResponse.builder()
                .id(1L)
                .thietBi("Máy bơm nước 01 - Đã sửa đổi")
                .build();
        when(keHoachBaoTriService.update(eq(1L), any(KeHoachBaoTriCreateRequest.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/v1/ke-hoach-bao-tri/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.thietBi").value("Máy bơm nước 01 - Đã sửa đổi"));
    }

    @Test
    void deletePlan_shouldReturnOk() throws Exception {
        doNothing().when(keHoachBaoTriService).delete(1L);

        mockMvc.perform(delete("/api/v1/ke-hoach-bao-tri/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void recordResult_shouldReturnCreated() throws Exception {
        KetQuaBaoTriResponse resultResponse = KetQuaBaoTriResponse.builder()
                .id(1L)
                .keHoachId(1L)
                .moTaKetQua("Bảo trì thành công")
                .nguoiGhiNhan("Kỹ thuật viên A")
                .build();

        when(keHoachBaoTriService.recordResult(any(KetQuaBaoTriRequest.class)))
                .thenReturn(resultResponse);

        mockMvc.perform(post("/api/v1/ke-hoach-bao-tri/result")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resultRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.moTaKetQua").value("Bảo trì thành công"));
    }

    @Test
    void filterByEquipment_shouldReturnMatchingPlans() throws Exception {
        when(keHoachBaoTriService.findByThietBi("Máy bơm nước 01"))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/ke-hoach-bao-tri/equipment/Máy bơm nước 01"))
                .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[0].thietBi").value("Máy bơm nước 01"));
    }

    @Test
    void filterByStatus_shouldReturnMatchingPlans() throws Exception {
        when(keHoachBaoTriService.findByTinhTrang(any(TinhTrangBaoTri.class)))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/ke-hoach-bao-tri/status/HOAN_THANH"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void filterByType_shouldReturnMatchingPlans() throws Exception {
        when(keHoachBaoTriService.findByLoaiBaoTri(any(LoaiBaoTri.class)))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/ke-hoach-bao-tri/type/DINH_KY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void filterByDateRange_shouldReturnMatchingPlans() throws Exception {
        when(keHoachBaoTriService.findByNgayBatDauDuKienBetween(
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 31)))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/ke-hoach-bao-tri/date-range")
                        .param("start", "2026-08-01")
                        .param("end", "2026-08-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].ngayBatDauDuKien").value("2026-08-01"));
    }
}
