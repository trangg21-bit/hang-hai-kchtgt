package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.assetmovement.controller.KeHoachKiemKeController;
import com.hanghai.kchtg.assetmovement.dto.KeHoachKiemKeRequest;
import com.hanghai.kchtg.assetmovement.dto.KeHoachKiemKeResponse;
import com.hanghai.kchtg.assetmovement.service.KeHoachKiemKeService;
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

@WebMvcTest(KeHoachKiemKeController.class)
@AutoConfigureMockMvc(addFilters = false)
class KeHoachKiemKeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private KeHoachKiemKeService keHoachService;

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

    private KeHoachKiemKeResponse makeResponse() {
        return KeHoachKiemKeResponse.builder()
                .id(UUID.randomUUID())
                .tenKeHoach("Ke hoach kiem ke 2025")
                .moTa("Kiem ke toan bo tai san")
                .trangThai("CHO_PHE_DUYET")
                .createdBy(UUID.randomUUID())
                .createdByName("Quan tri vien")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/asset/ke-hoach-kiem-ke — creates and returns 201")
    void testCreateReturns201() throws Exception {
        KeHoachKiemKeResponse response = makeResponse();
        when(keHoachService.create(any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/asset/ke-hoach-kiem-ke")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            { "tenKeHoach": "Ke hoach kiem ke 2025" }
                            """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));

        verify(keHoachService).create(any());
    }

    @Test
    @DisplayName("GET /api/v1/asset/ke-hoach-kiem-ke/{id} — returns 200")
    void testGetByIdReturns200() throws Exception {
        KeHoachKiemKeResponse response = makeResponse();
        when(keHoachService.getById(any(UUID.class))).thenReturn(response);

        mockMvc.perform(get("/api/v1/asset/ke-hoach-kiem-ke/" + response.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(keHoachService).getById(any(UUID.class));
    }

    @Test
    @DisplayName("GET /api/v1/asset/ke-hoach-kiem-ke — returns 200 with paginated list")
    void testFindAllReturns200() throws Exception {
        Page<KeHoachKiemKeResponse> page = new PageImpl<>(List.of(makeResponse()));
        Pageable pageable = PageRequest.of(0, 20, Sort.by("createdAt").descending());
        when(keHoachService.findAll(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/asset/ke-hoach-kiem-ke")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalElements").value(1));

        verify(keHoachService).findAll(pageable);
    }

    @Test
    @DisplayName("PUT /api/v1/asset/ke-hoach-kiem-ke/{id} — updates and returns 200")
    void testUpdateReturns200() throws Exception {
        KeHoachKiemKeResponse response = makeResponse();
        when(keHoachService.update(any(UUID.class), any())).thenReturn(response);

        mockMvc.perform(put("/api/v1/asset/ke-hoach-kiem-ke/" + response.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            { "tenKeHoach": "Ke hoach da cap nhat" }
                            """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(keHoachService).update(any(UUID.class), any());
    }

    @Test
    @DisplayName("DELETE /api/v1/asset/ke-hoach-kiem-ke/{id} — deletes and returns 200")
    void testDeleteReturns200() throws Exception {
        doNothing().when(keHoachService).delete(any(UUID.class));

        mockMvc.perform(delete("/api/v1/asset/ke-hoach-kiem-ke/" + UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(keHoachService).delete(any(UUID.class));
    }
}
