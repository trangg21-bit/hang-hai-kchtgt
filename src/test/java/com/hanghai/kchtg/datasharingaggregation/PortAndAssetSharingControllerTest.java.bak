package com.hanghai.kchtg.datasharingaggregation;

import com.hanghai.kchtg.datasharingaggregation.controller.PortAndAssetSharingController;
import com.hanghai.kchtg.datasharingaggregation.dto.DataSharingAggregationResponse;
import com.hanghai.kchtg.datasharingaggregation.enums.SharingStatus;
import com.hanghai.kchtg.datasharingaggregation.enums.SharingType;
import com.hanghai.kchtg.datasharingaggregation.service.PortAndAssetSharingService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.security.service.JwtSessionService;
import com.hanghai.kchtg.security.service.TokenValidationService;
import com.hanghai.kchtg.security.JwtUtil;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PortAndAssetSharingController.class)
@ExtendWith(MockitoExtension.class)
@AutoConfigureMockMvc(addFilters = false)
class PortAndAssetSharingControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PortAndAssetSharingService service;

    @MockBean
    private AsyncLogAppender asyncLogAppender;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private TokenService tokenService;

    @MockBean
    private JwtSessionService jwtSessionService;

    @MockBean
    private TokenValidationService tokenValidationService;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private JpaMetamodelMappingContext jpaMetamodelMappingContext;

    @Test
    void shareCangCan() throws Exception {
        DataSharingAggregationResponse resp = new DataSharingAggregationResponse();
        resp.setSharingType(SharingType.CANG_CAN);
        when(service.shareCangCan(any())).thenReturn(resp);
        mockMvc.perform(post("/api/v1/data-sharing-aggregation/port-assets/cang-can")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("payload"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sharingType").value("CANG_CAN"));
    }

    @Test
    void shareTrangThaiHoatDongKCHTGT() throws Exception {
        DataSharingAggregationResponse resp = new DataSharingAggregationResponse();
        resp.setSharingType(SharingType.TRANG_THAI_HOAT_DONG_KCHTGT);
        when(service.shareTrangThaiHoatDongKCHTGT(any())).thenReturn(resp);
        mockMvc.perform(post("/api/v1/data-sharing-aggregation/port-assets/trang-thai-hoat-dong")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("payload"))
                .andExpect(status().isOk());
    }

    @Test
    void shareThongTinTaiSanKCHTGT() throws Exception {
        DataSharingAggregationResponse resp = new DataSharingAggregationResponse();
        resp.setSharingType(SharingType.THONG_TIN_TAI_SAN_KCHTGT);
        when(service.shareThongTinTaiSanKCHTGT(any())).thenReturn(resp);
        mockMvc.perform(post("/api/v1/data-sharing-aggregation/port-assets/thong-tin-tai-san")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("payload"))
                .andExpect(status().isOk());
    }

    @Test
    void shareThongTinTongHopKCHTGT() throws Exception {
        DataSharingAggregationResponse resp = new DataSharingAggregationResponse();
        resp.setSharingType(SharingType.THONG_TIN_TONG_HOP_KCHTGT);
        when(service.shareThongTinTongHopKCHTGT(any())).thenReturn(resp);
        mockMvc.perform(post("/api/v1/data-sharing-aggregation/port-assets/thong-tin-tong-hop")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("payload"))
                .andExpect(status().isOk());
    }

    @Test
    void shareThongTinBaoTriKCHTGT() throws Exception {
        DataSharingAggregationResponse resp = new DataSharingAggregationResponse();
        resp.setSharingType(SharingType.THONG_TIN_BAO_TRI_KCHTGT);
        when(service.shareThongTinBaoTriKCHTGT(any())).thenReturn(resp);
        mockMvc.perform(post("/api/v1/data-sharing-aggregation/port-assets/thong-tin-bao-tri")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("payload"))
                .andExpect(status().isOk());
    }

    @Test
    void shareTongHopKCHTGT_CangBien() throws Exception {
        DataSharingAggregationResponse resp = new DataSharingAggregationResponse();
        resp.setSharingType(SharingType.TONG_HOP_KCHTGT_CANG_BIEN);
        when(service.shareTongHopKCHTGT_CangBien(any())).thenReturn(resp);
        mockMvc.perform(post("/api/v1/data-sharing-aggregation/port-assets/tong-hop-cang-bien")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("payload"))
                .andExpect(status().isOk());
    }

    @Test
    void shareTongHopKCHTGT_BenCangCauCang() throws Exception {
        DataSharingAggregationResponse resp = new DataSharingAggregationResponse();
        resp.setSharingType(SharingType.TONG_HOP_KCHTGT_BEN_CANG_CAU_CANG);
        when(service.shareTongHopKCHTGT_BenCangCauCang(any())).thenReturn(resp);
        mockMvc.perform(post("/api/v1/data-sharing-aggregation/port-assets/tong-hop-ben-cang")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("payload"))
                .andExpect(status().isOk());
    }

    @Test
    void shareTongHopKCHTGT_LuongHangHai() throws Exception {
        DataSharingAggregationResponse resp = new DataSharingAggregationResponse();
        resp.setSharingType(SharingType.TONG_HOP_KCHTGT_LUONG_HANG_HAI);
        when(service.shareTongHopKCHTGT_LuongHangHai(any())).thenReturn(resp);
        mockMvc.perform(post("/api/v1/data-sharing-aggregation/port-assets/tong-hop-luong-hang-hai")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("payload"))
                .andExpect(status().isOk());
    }

    @Test
    void shareTongHopKCHTGT_KhuChuyenTaiNeuDau() throws Exception {
        DataSharingAggregationResponse resp = new DataSharingAggregationResponse();
        resp.setSharingType(SharingType.TONG_HOP_KCHTGT_KHU_CHUYEN_TAI_NEU_DAU);
        when(service.shareTongHopKCHTGT_KhuChuyenTaiNeuDau(any())).thenReturn(resp);
        mockMvc.perform(post("/api/v1/data-sharing-aggregation/port-assets/tong-hop-khu-chuyen-tai")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("payload"))
                .andExpect(status().isOk());
    }

    @Test
    void shareTongHopKCHTGT_PhaoTieu() throws Exception {
        DataSharingAggregationResponse resp = new DataSharingAggregationResponse();
        resp.setSharingType(SharingType.TONG_HOP_KCHTGT_PHAO_TIEU);
        when(service.shareTongHopKCHTGT_PhaoTieu(any())).thenReturn(resp);
        mockMvc.perform(post("/api/v1/data-sharing-aggregation/port-assets/tong-hop-phao-tieu")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("payload"))
                .andExpect(status().isOk());
    }

    @Test
    void shareTongHopKCHTGT_HeThongDenBien() throws Exception {
        DataSharingAggregationResponse resp = new DataSharingAggregationResponse();
        resp.setSharingType(SharingType.TONG_HOP_KCHTGT_HE_THONG_DEN_BIEN);
        when(service.shareTongHopKCHTGT_HeThongDenBien(any())).thenReturn(resp);
        mockMvc.perform(post("/api/v1/data-sharing-aggregation/port-assets/tong-hop-den-bien")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("payload"))
                .andExpect(status().isOk());
    }

    @Test
    void getRecords() throws Exception {
        when(service.getPortAndAssetRecords(any())).thenReturn(List.of());
        mockMvc.perform(get("/api/v1/data-sharing-aggregation/port-assets")
                        .param("status", "SUCCESS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}
