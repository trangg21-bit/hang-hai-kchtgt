package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.assetmovement.controller.HoSoXuLyTaiSanController;
import com.hanghai.kchtg.assetmovement.dto.HoSoXuLyTaiSanRequest;
import com.hanghai.kchtg.assetmovement.dto.HoSoXuLyTaiSanResponse;
import com.hanghai.kchtg.assetmovement.service.HoSoXuLyTaiSanService;
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
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(HoSoXuLyTaiSanController.class)
@AutoConfigureMockMvc(addFilters = false)
class HoSoXuLyTaiSanControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private HoSoXuLyTaiSanService hoSoService;

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

    private HoSoXuLyTaiSanResponse makeResponse() {
        return HoSoXuLyTaiSanResponse.builder()
                .id(UUID.randomUUID())
                .taiSanId(UUID.randomUUID())
                .tenTaiSan("Tai san xu ly")
                .loaiXuLy("THANHLy")
                .moTa("Mo ta xu ly")
                .trangThaiHoSo("CHO_XU_LY")
                .createdBy("admin")
                .createdByName("Quan tri vien")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/asset/ho-so-xu-ly — creates and returns 201")
    void testCreateReturns201() throws Exception {
        HoSoXuLyTaiSanResponse response = makeResponse();
        when(hoSoService.create(any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/asset/ho-so-xu-ly")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            { "taiSanId": "00000000-0000-0000-0000-000000000001", "loaiXuLy": "THANHLy" }
                            """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));

        verify(hoSoService).create(any());
    }

    @Test
    @DisplayName("GET /api/v1/asset/ho-so-xu-ly/{id} — returns 200")
    void testGetByIdReturns200() throws Exception {
        HoSoXuLyTaiSanResponse response = makeResponse();
        when(hoSoService.getById(any(UUID.class))).thenReturn(response);

        mockMvc.perform(get("/api/v1/asset/ho-so-xu-ly/" + response.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(hoSoService).getById(any(UUID.class));
    }

    @Test
    @DisplayName("GET /api/v1/asset/ho-so-xu-ly — returns 200 with paginated list")
    void testFindAllReturns200() throws Exception {
        Page<HoSoXuLyTaiSanResponse> page = new PageImpl<>(List.of(makeResponse()));
        Pageable pageable = PageRequest.of(0, 20, Sort.by("createdAt").descending());
        when(hoSoService.findAll(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/asset/ho-so-xu-ly")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalElements").value(1));

        verify(hoSoService).findAll(pageable);
    }

    @Test
    @DisplayName("PUT /api/v1/asset/ho-so-xu-ly/{id} — updates and returns 200")
    void testUpdateReturns200() throws Exception {
        HoSoXuLyTaiSanResponse response = makeResponse();
        when(hoSoService.update(any(UUID.class), any())).thenReturn(response);

        mockMvc.perform(put("/api/v1/asset/ho-so-xu-ly/" + response.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            { "taiSanId": "00000000-0000-0000-0000-000000000001", "loaiXuLy": "DIEUCHUYEN" }
                            """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(hoSoService).update(any(UUID.class), any());
    }

    @Test
    @DisplayName("DELETE /api/v1/asset/ho-so-xu-ly/{id} — deletes and returns 200")
    void testDeleteReturns200() throws Exception {
        doNothing().when(hoSoService).delete(any(UUID.class));

        mockMvc.perform(delete("/api/v1/asset/ho-so-xu-ly/" + UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(hoSoService).delete(any(UUID.class));
    }
}
