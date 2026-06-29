package com.hanghai.kchtg.datasharingaggregation;

import com.hanghai.kchtg.datasharingaggregation.controller.CoastalFacilitySharingController;
import com.hanghai.kchtg.datasharingaggregation.dto.DataSharingAggregationResponse;
import com.hanghai.kchtg.datasharingaggregation.enums.SharingStatus;
import com.hanghai.kchtg.datasharingaggregation.enums.SharingType;
import com.hanghai.kchtg.datasharingaggregation.service.CoastalFacilitySharingService;
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

@WebMvcTest(CoastalFacilitySharingController.class)
@ExtendWith(MockitoExtension.class)
@AutoConfigureMockMvc(addFilters = false)
class CoastalFacilitySharingControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CoastalFacilitySharingService service;

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
    void shareDeChanSongDeChanCat() throws Exception {
        DataSharingAggregationResponse resp = new DataSharingAggregationResponse();
        resp.setId("test-id");
        resp.setSharingType(SharingType.DE_CHAN_SONG_DE_CHAN_CAT);
        when(service.shareDeChanSongDeChanCat(any())).thenReturn(resp);
        mockMvc.perform(post("/api/v1/data-sharing-aggregation/coastal/de-chan-song-de-chan-cat")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("{\"type\":\"de-chan-song\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sharingType").value("DE_CHAN_SONG_DE_CHAN_CAT"));
    }

    @Test
    void shareLuongHangHai() throws Exception {
        DataSharingAggregationResponse resp = new DataSharingAggregationResponse();
        resp.setId("test-id");
        resp.setSharingType(SharingType.LUONG_HANG_HAI);
        when(service.shareLuongHangHai(any())).thenReturn(resp);
        mockMvc.perform(post("/api/v1/data-sharing-aggregation/coastal/luong-hang-hai")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("payload"))
                .andExpect(status().isOk());
    }

    @Test
    void shareHeThongDeKe() throws Exception {
        DataSharingAggregationResponse resp = new DataSharingAggregationResponse();
        resp.setId("test-id");
        resp.setSharingType(SharingType.TONG_HOP_KCHTGT_HE_THONG_DE_KE);
        when(service.shareHeThongDeKe(any())).thenReturn(resp);
        mockMvc.perform(post("/api/v1/data-sharing-aggregation/coastal/he-thong-de-ke")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("payload"))
                .andExpect(status().isOk());
    }

    @Test
    void getRecords() throws Exception {
        when(service.getCoastalFacilities(any())).thenReturn(List.of());
        mockMvc.perform(get("/api/v1/data-sharing-aggregation/coastal")
                        .param("status", "SUCCESS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}
