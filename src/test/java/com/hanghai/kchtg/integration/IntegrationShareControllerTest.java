package com.hanghai.kchtg.integration;

import com.hanghai.kchtg.gis.line.entity.LineObject;
import com.hanghai.kchtg.gis.line.repository.LineObjectRepository;
import com.hanghai.kchtg.gis.point.entity.PointObject;
import com.hanghai.kchtg.gis.point.repository.PointObjectRepository;
import com.hanghai.kchtg.gis.polygon.entity.PolygonObject;
import com.hanghai.kchtg.gis.polygon.repository.PolygonObjectRepository;
import com.hanghai.kchtg.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(roles = "ADMIN")
@ActiveProfiles("test")
class IntegrationShareControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private PointObjectRepository pointRepository;

    @MockBean
    private LineObjectRepository lineRepository;

    @MockBean
    private PolygonObjectRepository polygonRepository;

    @BeforeEach
    void setUp() {
        when(pointRepository.findByStatus(eq(PointObject.Status.PUBLISHED), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));
        when(lineRepository.findByStatus(eq(LineObject.Status.PUBLISHED), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));
        when(polygonRepository.findByStatus(eq(PolygonObject.Status.PUBLISHED), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));
    }

    @Test
    @DisplayName("Should return 401 when token is missing")
    void sharePoints_missingToken_unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/integration/share/points")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Should return 401 when token is invalid")
    void sharePoints_invalidToken_unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/integration/share/points")
                        .header("X-Integration-Token", "wrong-token")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should return 200 and data when token is valid")
    void sharePoints_validToken_success() throws Exception {
        mockMvc.perform(get("/api/v1/integration/share/points")
                        .header("X-Integration-Token", "integration-secret-token-2026")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}