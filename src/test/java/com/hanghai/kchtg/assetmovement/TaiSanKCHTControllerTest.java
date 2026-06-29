package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.assetmovement.controller.TaiSanKCHTController;
import com.hanghai.kchtg.assetmovement.dto.TaiSanKCHTRequest;
import com.hanghai.kchtg.assetmovement.dto.TaiSanKCHTResponse;
import com.hanghai.kchtg.assetmovement.service.TaiSanKCHTService;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TaiSanKCHTController.class)
@AutoConfigureMockMvc(addFilters = false)
class TaiSanKCHTControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TaiSanKCHTService taiSanService;

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

    private TaiSanKCHTResponse makeTaiSanResponse() {
        return TaiSanKCHTResponse.builder()
                .id(UUID.randomUUID())
                .maTaiSan("TS-001")
                .loaiTaiSanId(UUID.randomUUID())
                .tenTaiSan("Tai san thu 1")
                .moTa("Mo ta tai san")
                .giaTri(new java.math.BigDecimal("1000000"))
                .trangThai("HAY_DUNG")
                .createdBy(UUID.randomUUID())
                .createdByName("Quan tri vien")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/asset/tai-san — creates and returns 201")
    void testCreateReturns201() throws Exception {
        TaiSanKCHTResponse response = makeTaiSanResponse();
        when(taiSanService.create(any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/asset/tai-san")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                              "maTaiSan": "TS-001",
                              "tenTaiSan": "Tai san thu 1",
                              "trangThai": "HAY_DUNG"
                            }
                            """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.maTaiSan").value("TS-001"));

        verify(taiSanService).create(any());
    }

    @Test
    @DisplayName("GET /api/v1/asset/tai-san/{id} — returns 200 with TaiSanKCHT by id")
    void testGetByIdReturns200() throws Exception {
        TaiSanKCHTResponse response = makeTaiSanResponse();
        when(taiSanService.getById(any(UUID.class))).thenReturn(response);

        mockMvc.perform(get("/api/v1/asset/tai-san/" + response.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.maTaiSan").value("TS-001"));

        verify(taiSanService).getById(any(UUID.class));
    }

    @Test
    @DisplayName("GET /api/v1/asset/tai-san — returns 200 with paginated list")
    void testFindAllReturns200() throws Exception {
        Page<TaiSanKCHTResponse> page = new PageImpl<>(List.of(makeTaiSanResponse()));
        Pageable pageable = PageRequest.of(0, 20, Sort.by("createdAt").descending());
        when(taiSanService.findAll(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/asset/tai-san")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalElements").value(1));

        verify(taiSanService).findAll(pageable);
    }

    @Test
    @DisplayName("PUT /api/v1/asset/tai-san/{id} — updates and returns 200")
    void testUpdateReturns200() throws Exception {
        TaiSanKCHTResponse response = makeTaiSanResponse();
        when(taiSanService.update(any(UUID.class), any())).thenReturn(response);

        mockMvc.perform(put("/api/v1/asset/tai-san/" + response.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                              "maTaiSan": "TS-001",
                              "tenTaiSan": "Tai san da cap nhat"
                            }
                            """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.maTaiSan").value("TS-001"));

        verify(taiSanService).update(any(UUID.class), any());
    }

    @Test
    @DisplayName("DELETE /api/v1/asset/tai-san/{id} — deletes and returns 200")
    void testDeleteReturns200() throws Exception {
        doNothing().when(taiSanService).delete(any(UUID.class));

        mockMvc.perform(delete("/api/v1/asset/tai-san/" + UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(taiSanService).delete(any(UUID.class));
    }
}
