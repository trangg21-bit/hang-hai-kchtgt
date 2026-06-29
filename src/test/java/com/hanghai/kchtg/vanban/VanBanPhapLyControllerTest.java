package com.hanghai.kchtg.vanban;

import com.hanghai.kchtg.vanban.controller.VanBanPhapLyController;
import com.hanghai.kchtg.vanban.dto.*;
import com.hanghai.kchtg.vanban.entity.*;
import com.hanghai.kchtg.vanban.service.VanBanPhapLyService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
class VanBanPhapLyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private VanBanPhapLyService vanBanPhapLyService;

    private VanBanPhapLyResponse testResponse;
    private VanBanPhapLyCreateRequest createRequest;

    @BeforeEach
    void setUp() {
        testResponse = VanBanPhapLyResponse.builder()
                .id(1L)
                .tenVanBan("Luật Giao thông đường thủy nội địa")
                .soHieu("50/2014/QH13")
                .coQuanBanHanh("Quốc hội")
                .ngayBanHanh(LocalDate.of(2014, 6, 25))
                .ngayCoHieuLuc(LocalDate.of(2015, 1, 1))
                .loaiVanBan(LoaiVanBan.LUAT)
                .linhVucApDung("Giao thông đường thủy")
                .tinhTrangHieuLuc(TinhTrangHieuLuc.CON_HIEU_LUC)
                .nguoiTao("Admin")
                .build();

        createRequest = VanBanPhapLyCreateRequest.builder()
                .tenVanBan("Nghị định mới")
                .soHieu("01/2026/NĐ")
                .coQuanBanHanh("Chính phủ")
                .ngayBanHanh(LocalDate.of(2026, 1, 1))
                .loaiVanBan(LoaiVanBan.NGHI_DINH)
                .tinhTrangHieuLuc(TinhTrangHieuLuc.CON_HIEU_LUC)
                .nguoiTao("User1")
                .build();
    }

    @Test
    void listVanBan_shouldReturnAll() throws Exception {
        when(vanBanPhapLyService.findAll(anyInt(), anyInt()))
                .thenReturn(new PageImpl<>(List.of(testResponse)));

        mockMvc.perform(get("/api/v1/van-ban-phap-ly")
                        .param("page", "0").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].tenVanBan").value("Luật Giao thông đường thủy nội địa"));
    }

    @Test
    void createVanBan_shouldReturnCreated() throws Exception {
        when(vanBanPhapLyService.create(any(VanBanPhapLyCreateRequest.class)))
                .thenReturn(testResponse);

        mockMvc.perform(post("/api/v1/van-ban-phap-ly")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.tenVanBan").value("Luật Giao thông đường thủy nội địa"));
    }

    @Test
    void getVanBan_shouldReturnOne() throws Exception {
        when(vanBanPhapLyService.getById(1L)).thenReturn(testResponse);

        mockMvc.perform(get("/api/v1/van-ban-phap-ly/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tenVanBan").value("Luật Giao thông đường thủy nội địa"));
    }

    @Test
    void updateVanBan_shouldReturnUpdated() throws Exception {
        VanBanPhapLyResponse updated = VanBanPhapLyResponse.builder()
                .id(1L)
                .tenVanBan("Văn bản đã sửa đổi")
                .build();
        when(vanBanPhapLyService.update(eq(1L), any(VanBanPhapLyCreateRequest.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/v1/van-ban-phap-ly/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tenVanBan").value("Văn bản đã sửa đổi"));
    }

    @Test
    void deleteVanBan_shouldReturnOk() throws Exception {
        doNothing().when(vanBanPhapLyService).delete(1L);

        mockMvc.perform(delete("/api/v1/van-ban-phap-ly/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
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

        when(vanBanPhapLyService.searchDocuments(
                eq("Luật"), eq("Quốc hội"), any(), any(), any(), any(), eq(0), eq(20)))
                .thenReturn(searchResult);

        mockMvc.perform(get("/api/v1/van-ban-phap-ly/search")
                        .param("keyword", "Luật")
                        .param("coQuan", "Quốc hội")
                        .param("page", "0").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.results[0].tenVanBan").value("Luật Giao thông đường thủy nội địa"));
    }
}
