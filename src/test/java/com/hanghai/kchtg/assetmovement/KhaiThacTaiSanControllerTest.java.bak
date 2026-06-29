package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.assetmovement.controller.KhaiThacTaiSanController;
import com.hanghai.kchtg.assetmovement.dto.KhaiThacTaiSanRequest;
import com.hanghai.kchtg.assetmovement.dto.KhaiThacTaiSanResponse;
import com.hanghai.kchtg.assetmovement.service.KhaiThacTaiSanService;
import com.hanghai.kchtg.security.JwtUtil;
import com.hanghai.kchtg.security.service.JwtSessionService;
import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.security.service.TokenValidationService;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(KhaiThacTaiSanController.class)
@AutoConfigureMockMvc(addFilters = false)
class KhaiThacTaiSanControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private KhaiThacTaiSanService khaiThacService;

    @MockBean
    private AccessLogRepository accessLogRepository;

    @MockBean
    private com.hanghai.kchtg.accesslog.service.AsyncLogAppender asyncLogAppender;

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

    private KhaiThacTaiSanResponse makeResponse() {
        return KhaiThacTaiSanResponse.builder()
                .id(UUID.randomUUID())
                .taiSanId(UUID.randomUUID())
                .tenTaiSan("Tai san khai thac")
                .namKhaiThac(2025)
                .doanhThu(new BigDecimal("5000000"))
                .haoMon(new BigDecimal("500000"))
                .moTa("Khai thac nam 2025")
                .createdBy(UUID.randomUUID())
                .createdByName("Quan tri vien")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/asset/khai-thac — creates and returns 201")
    void testCreateReturns201() throws Exception {
        KhaiThacTaiSanResponse response = makeResponse();
        when(khaiThacService.create(any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/asset/khai-thac")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            { "tenTaiSan": "Tai san khai thac", "namKhaiThac": 2025 }
                            """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));

        verify(khaiThacService).create(any());
    }

    @Test
    @DisplayName("GET /api/v1/asset/khai-thac/{id} — returns 200")
    void testGetByIdReturns200() throws Exception {
        KhaiThacTaiSanResponse response = makeResponse();
        when(khaiThacService.getById(any(UUID.class))).thenReturn(response);

        mockMvc.perform(get("/api/v1/asset/khai-thac/" + response.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(khaiThacService).getById(any(UUID.class));
    }

    @Test
    @DisplayName("GET /api/v1/asset/khai-thac — returns 200 with paginated list")
    void testFindAllReturns200() throws Exception {
        Page<KhaiThacTaiSanResponse> page = new PageImpl<>(List.of(makeResponse()));
        Pageable pageable = PageRequest.of(0, 20, Sort.by("createdAt").descending());
        when(khaiThacService.findAll(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/asset/khai-thac")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalElements").value(1));

        verify(khaiThacService).findAll(pageable);
    }

    @Test
    @DisplayName("PUT /api/v1/asset/khai-thac/{id} — updates and returns 200")
    void testUpdateReturns200() throws Exception {
        KhaiThacTaiSanResponse response = makeResponse();
        when(khaiThacService.update(any(UUID.class), any())).thenReturn(response);

        mockMvc.perform(put("/api/v1/asset/khai-thac/" + response.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            { "tenTaiSan": "Tai san da cap nhat", "namKhaiThac": 2026 }
                            """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(khaiThacService).update(any(UUID.class), any());
    }

    @Test
    @DisplayName("DELETE /api/v1/asset/khai-thac/{id} — deletes and returns 200")
    void testDeleteReturns200() throws Exception {
        doNothing().when(khaiThacService).delete(any(UUID.class));

        mockMvc.perform(delete("/api/v1/asset/khai-thac/" + UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(khaiThacService).delete(any(UUID.class));
    }
}
