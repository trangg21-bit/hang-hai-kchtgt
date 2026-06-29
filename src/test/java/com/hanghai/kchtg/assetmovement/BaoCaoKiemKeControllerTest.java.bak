package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.assetmovement.controller.BaoCaoKiemKeController;
import com.hanghai.kchtg.assetmovement.dto.BaoCaoKiemKeRequest;
import com.hanghai.kchtg.assetmovement.dto.BaoCaoKiemKeResponse;
import com.hanghai.kchtg.assetmovement.service.BaoCaoKiemKeService;
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

@WebMvcTest(BaoCaoKiemKeController.class)
@AutoConfigureMockMvc(addFilters = false)
class BaoCaoKiemKeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BaoCaoKiemKeService baoCaoService;

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

    private BaoCaoKiemKeResponse makeResponse() {
        return BaoCaoKiemKeResponse.builder()
                .id(UUID.randomUUID())
                .keHoachId(UUID.randomUUID())
                .tenBaoCao("Bao cao kiem ke 2025")
                .tongSoLuong(500)
                .soLuongChenhLech(5)
                .ketQua("HOAN_THANH")
                .moTa("Kiem ke hoan tat")
                .createdBy(UUID.randomUUID())
                .createdByName("Quan tri vien")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/asset/bao-cao-kiem-ke — creates and returns 201")
    void testCreateReturns201() throws Exception {
        BaoCaoKiemKeResponse response = makeResponse();
        when(baoCaoService.create(any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/asset/bao-cao-kiem-ke")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            { "tenBaoCao": "Bao cao kiem ke 2025" }
                            """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));

        verify(baoCaoService).create(any());
    }

    @Test
    @DisplayName("GET /api/v1/asset/bao-cao-kiem-ke/{id} — returns 200")
    void testGetByIdReturns200() throws Exception {
        BaoCaoKiemKeResponse response = makeResponse();
        when(baoCaoService.getById(any(UUID.class))).thenReturn(response);

        mockMvc.perform(get("/api/v1/asset/bao-cao-kiem-ke/" + response.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(baoCaoService).getById(any(UUID.class));
    }

    @Test
    @DisplayName("GET /api/v1/asset/bao-cao-kiem-ke — returns 200 with paginated list")
    void testFindAllReturns200() throws Exception {
        Page<BaoCaoKiemKeResponse> page = new PageImpl<>(List.of(makeResponse()));
        Pageable pageable = PageRequest.of(0, 20, Sort.by("createdAt").descending());
        when(baoCaoService.findAll(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/asset/bao-cao-kiem-ke")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalElements").value(1));

        verify(baoCaoService).findAll(pageable);
    }

    @Test
    @DisplayName("PUT /api/v1/asset/bao-cao-kiem-ke/{id} — updates and returns 200")
    void testUpdateReturns200() throws Exception {
        BaoCaoKiemKeResponse response = makeResponse();
        when(baoCaoService.update(any(UUID.class), any())).thenReturn(response);

        mockMvc.perform(put("/api/v1/asset/bao-cao-kiem-ke/" + response.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            { "tenBaoCao": "Bao cao da cap nhat" }
                            """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(baoCaoService).update(any(UUID.class), any());
    }

    @Test
    @DisplayName("DELETE /api/v1/asset/bao-cao-kiem-ke/{id} — deletes and returns 200")
    void testDeleteReturns200() throws Exception {
        doNothing().when(baoCaoService).delete(any(UUID.class));

        mockMvc.perform(delete("/api/v1/asset/bao-cao-kiem-ke/" + UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(baoCaoService).delete(any(UUID.class));
    }
}
