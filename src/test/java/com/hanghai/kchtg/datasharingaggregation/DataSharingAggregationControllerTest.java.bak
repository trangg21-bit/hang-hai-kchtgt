package com.hanghai.kchtg.datasharingaggregation;

import com.hanghai.kchtg.datasharingaggregation.controller.DataSharingAggregationController;
import com.hanghai.kchtg.datasharingaggregation.dto.*;
import com.hanghai.kchtg.datasharingaggregation.enums.SharingStatus;
import com.hanghai.kchtg.datasharingaggregation.enums.SharingType;
import com.hanghai.kchtg.datasharingaggregation.service.DataSharingAggregationService;
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

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DataSharingAggregationController.class)
@ExtendWith(MockitoExtension.class)
@AutoConfigureMockMvc(addFilters = false)
class DataSharingAggregationControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DataSharingAggregationService service;

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
    void create_shouldReturnResponse() throws Exception {
        DataSharingAggregationResponse resp = new DataSharingAggregationResponse();
        resp.setId("test-id");
        resp.setSharingType(SharingType.DE_CHAN_SONG_DE_CHAN_CAT);
        resp.setStatus(SharingStatus.PENDING);

        when(service.create(any())).thenReturn(resp);

        mockMvc.perform(post("/api/v1/data-sharing-aggregation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sharingType\":\"DE_CHAN_SONG_DE_CHAN_CAT\",\"dataPayload\":\"{\\\"test\\\":\\\"data\\\"}\",\"createdBy\":\"admin\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("test-id"))
                .andExpect(jsonPath("$.sharingType").value("DE_CHAN_SONG_DE_CHAN_CAT"));
    }

    @Test
    void getById_shouldReturnRecord() throws Exception {
        DataSharingAggregationResponse resp = new DataSharingAggregationResponse();
        resp.setId("test-id");
        resp.setSharingType(SharingType.DE_CHAN_SONG_DE_CHAN_CAT);
        resp.setStatus(SharingStatus.SUCCESS);
        when(service.getById("test-id")).thenReturn(resp);

        mockMvc.perform(get("/api/v1/data-sharing-aggregation/test-id"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("test-id"));
    }

    @Test
    void getAll_shouldReturnList() throws Exception {
        when(service.getAll()).thenReturn(List.of());
        mockMvc.perform(get("/api/v1/data-sharing-aggregation"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void filter_shouldReturnFiltered() throws Exception {
        when(service.filter(any())).thenReturn(List.of());
        mockMvc.perform(post("/api/v1/data-sharing-aggregation/filter")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sharingType\":\"DE_CHAN_SONG_DE_CHAN_CAT\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void getSummary_shouldReturnSummary() throws Exception {
        DataSharingAggregationSummary summary = new DataSharingAggregationSummary();
        summary.setTotalCount(10);
        when(service.getSummary()).thenReturn(summary);
        mockMvc.perform(get("/api/v1/data-sharing-aggregation/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCount").value(10));
    }

    @Test
    void update_shouldReturnUpdated() throws Exception {
        DataSharingAggregationResponse resp = new DataSharingAggregationResponse();
        resp.setId("test-id");
        resp.setStatus(SharingStatus.SUCCESS);
        when(service.update(eq("test-id"), any())).thenReturn(resp);
        mockMvc.perform(put("/api/v1/data-sharing-aggregation/test-id")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SUCCESS\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"));
    }

    @Test
    void delete_shouldReturnNoContent() throws Exception {
        mockMvc.perform(delete("/api/v1/data-sharing-aggregation/test-id"))
                .andExpect(status().isNoContent());
    }
}
