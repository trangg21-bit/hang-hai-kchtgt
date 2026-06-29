package com.hanghai.kchtg.datasharingaggregation;

import com.hanghai.kchtg.datasharingaggregation.controller.StationSharingController;
import com.hanghai.kchtg.datasharingaggregation.dto.DataSharingAggregationResponse;
import com.hanghai.kchtg.datasharingaggregation.enums.SharingStatus;
import com.hanghai.kchtg.datasharingaggregation.enums.SharingType;
import com.hanghai.kchtg.datasharingaggregation.service.StationSharingService;
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

@WebMvcTest(StationSharingController.class)
@ExtendWith(MockitoExtension.class)
@AutoConfigureMockMvc(addFilters = false)
class StationSharingControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private StationSharingService service;

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
    void shareDaiTTDH() throws Exception {
        DataSharingAggregationResponse resp = new DataSharingAggregationResponse();
        resp.setSharingType(SharingType.DAI_TTDH);
        when(service.shareDaiTTDH(any())).thenReturn(resp);
        mockMvc.perform(post("/api/v1/data-sharing-aggregation/stations/dai-ttdh")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("payload"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sharingType").value("DAI_TTDH"));
    }

    @Test
    void shareDaiInmarsat() throws Exception {
        DataSharingAggregationResponse resp = new DataSharingAggregationResponse();
        resp.setSharingType(SharingType.DAI_INMARSAT);
        when(service.shareDaiInmarsat(any())).thenReturn(resp);
        mockMvc.perform(post("/api/v1/data-sharing-aggregation/stations/dai-inmarsat")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("payload"))
                .andExpect(status().isOk());
    }

    @Test
    void shareDaiCospasSarsat() throws Exception {
        DataSharingAggregationResponse resp = new DataSharingAggregationResponse();
        resp.setSharingType(SharingType.DAI_COSPAS_SARSAT);
        when(service.shareDaiCospasSarsat(any())).thenReturn(resp);
        mockMvc.perform(post("/api/v1/data-sharing-aggregation/stations/dai-cospas-sarsat")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("payload"))
                .andExpect(status().isOk());
    }

    @Test
    void shareDaiLRIT() throws Exception {
        DataSharingAggregationResponse resp = new DataSharingAggregationResponse();
        resp.setSharingType(SharingType.DAI_LRIT);
        when(service.shareDaiLRIT(any())).thenReturn(resp);
        mockMvc.perform(post("/api/v1/data-sharing-aggregation/stations/dai-lrit")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("payload"))
                .andExpect(status().isOk());
    }

    @Test
    void shareDaiHangHaiHN() throws Exception {
        DataSharingAggregationResponse resp = new DataSharingAggregationResponse();
        resp.setSharingType(SharingType.DAI_HANG_HAI_HN);
        when(service.shareDaiHangHaiHN(any())).thenReturn(resp);
        mockMvc.perform(post("/api/v1/data-sharing-aggregation/stations/dai-hang-hai-hn")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("payload"))
                .andExpect(status().isOk());
    }

    @Test
    void getRecords() throws Exception {
        when(service.getStationSharingRecords(any())).thenReturn(List.of());
        mockMvc.perform(get("/api/v1/data-sharing-aggregation/stations")
                        .param("status", "SUCCESS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}
