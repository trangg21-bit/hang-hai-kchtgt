package com.hanghai.kchtg.vanban;

import com.hanghai.kchtg.vanban.controller.QuyHoachBenCangController;
import com.hanghai.kchtg.vanban.dto.*;
import com.hanghai.kchtg.vanban.entity.*;
import com.hanghai.kchtg.vanban.service.QuyHoachBenCangService;
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
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
class QuyHoachBenCangControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private QuyHoachBenCangService quyHoachBenCangService;

    private QuyHoachBenCangResponse testResponse;
    private QuyHoachBenCangCreateRequest createRequest;

    @BeforeEach
    void setUp() {
        testResponse = QuyHoachBenCangResponse.builder()
                .id(1L)
                .tenDoAn("Quy hoạch Bến Cảng A giai đoạn 2")
                .coQuanPheDuyet("Bộ Giao thông vận tải")
                .ngayPheDuyet(LocalDate.of(2025, 12, 15))
                .phamViApDung("Khu vực Bắc Bến Cảng A")
                .tiLeBanDo("1/500")
                .tinhTrang(TinhTrangQuyHoach.HIEN_HANH)
                .duongDanFile("/files/quy-hoach-a-gd2.pdf")
                .nguoiTao("Admin")
                .build();

        createRequest = QuyHoachBenCangCreateRequest.builder()
                .tenDoAn("Quy hoạch Bến Cảng B giai đoạn 1")
                .coQuanPheDuyet("Ủy ban nhân dân tỉnh")
                .ngayPheDuyet(LocalDate.of(2026, 1, 10))
                .phamViApDung("Khu vực Nam Bến Cảng B")
                .tiLeBanDo("1/1000")
                .tinhTrang(TinhTrangQuyHoach.HIEN_HANH)
                .duongDanFile("/files/quy-hoach-b-gd1.pdf")
                .nguoiTao("User1")
                .build();
    }

    @Test
    void listPlans_shouldReturnAll() throws Exception {
        when(quyHoachBenCangService.findAll(anyInt(), anyInt()))
                .thenReturn(new PageImpl<>(List.of(testResponse)));

        mockMvc.perform(get("/api/v1/quy-hoach-ben-cang")
                        .param("page", "0").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].tenDoAn").value("Quy hoạch Bến Cảng A giai đoạn 2"));
    }

    @Test
    void createPlan_shouldReturnCreated() throws Exception {
        when(quyHoachBenCangService.create(any(QuyHoachBenCangCreateRequest.class)))
                .thenReturn(testResponse);

        mockMvc.perform(post("/api/v1/quy-hoach-ben-cang")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.tenDoAn").value("Quy hoạch Bến Cảng A giai đoạn 2"));
    }

    @Test
    void getPlan_shouldReturnOne() throws Exception {
        when(quyHoachBenCangService.getById(1L)).thenReturn(testResponse);

        mockMvc.perform(get("/api/v1/quy-hoach-ben-cang/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tenDoAn").value("Quy hoạch Bến Cảng A giai đoạn 2"));
    }

    @Test
    void updatePlan_shouldReturnUpdated() throws Exception {
        QuyHoachBenCangResponse updated = QuyHoachBenCangResponse.builder()
                .id(1L)
                .tenDoAn("Quy hoạch Bến Cảng A giai đoạn 2 - Đã sửa đổi")
                .build();
        when(quyHoachBenCangService.update(eq(1L), any(QuyHoachBenCangCreateRequest.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/v1/quy-hoach-ben-cang/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tenDoAn").value("Quy hoạch Bến Cảng A giai đoạn 2 - Đã sửa đổi"));
    }

    @Test
    void deletePlan_shouldReturnOk() throws Exception {
        doNothing().when(quyHoachBenCangService).delete(1L);

        mockMvc.perform(delete("/api/v1/quy-hoach-ben-cang/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void filterByStatus_shouldReturnMatchingPlans() throws Exception {
        when(quyHoachBenCangService.findByTinhTrang(any(TinhTrangQuyHoach.class)))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/quy-hoach-ben-cang/status/HIEN_HANH"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void searchByName_shouldReturnMatchingPlans() throws Exception {
        when(quyHoachBenCangService.searchByTenDoAnContaining("Bến Cảng A", 0, 20))
                .thenReturn(new PageImpl<>(List.of(testResponse)));

        mockMvc.perform(get("/api/v1/quy-hoach-ben-cang/name-search")
                        .param("keyword", "Bến Cảng A")
                        .param("page", "0").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].tenDoAn").value("Quy hoạch Bến Cảng A giai đoạn 2"));
    }

    @Test
    void filterByDateRange_shouldReturnMatchingPlans() throws Exception {
        when(quyHoachBenCangService.findByNgayPheDuyetBetween(
                LocalDate.of(2025, 1, 1), LocalDate.of(2025, 12, 31)))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/quy-hoach-ben-cang/date-range")
                        .param("start", "2025-01-01")
                        .param("end", "2025-12-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].ngayPheDuyet").value("2025-12-15"));
    }

    @Test
    void searchPlans_withKeyword_shouldReturnResults() throws Exception {
        KetQuaTraCuuResponse searchResult = KetQuaTraCuuResponse.builder()
                .results(List.of(testResponse))
                .totalElements(1L)
                .totalPages(1)
                .currentPage(0)
                .pageSize(20)
                .build();

        when(quyHoachBenCangService.traCuu(
                eq("Bến Cảng A"), eq("HIEN_HANH"), eq(LocalDate.of(2025, 1, 1)), eq(LocalDate.of(2025, 12, 31)), eq(0), eq(20)))
                .thenReturn(searchResult);

        mockMvc.perform(get("/api/v1/quy-hoach-ben-cang/search")
                        .param("keyword", "Bến Cảng A")
                        .param("status", "HIEN_HANH")
                        .param("yearStart", "2025-01-01")
                        .param("yearEnd", "2025-12-31")
                        .param("page", "0").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.results[0].tenDoAn").value("Quy hoạch Bến Cảng A giai đoạn 2"));
    }
}
