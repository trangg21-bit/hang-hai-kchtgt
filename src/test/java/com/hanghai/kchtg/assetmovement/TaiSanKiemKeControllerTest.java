package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.assetmovement.controller.TaiSanKiemKeController;
import com.hanghai.kchtg.assetmovement.dto.TaiSanKiemKeRequest;
import com.hanghai.kchtg.assetmovement.dto.TaiSanKiemKeResponse;
import com.hanghai.kchtg.assetmovement.service.TaiSanKiemKeService;
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

@WebMvcTest(TaiSanKiemKeController.class)
@AutoConfigureMockMvc(addFilters = false)
class TaiSanKiemKeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TaiSanKiemKeService taiSanKiemKeService;

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

    private TaiSanKiemKeResponse makeResponse() {
        return TaiSanKiemKeResponse.builder()
                .id(UUID.randomUUID())
                .keHoachId(UUID.randomUUID())
                .taiSanId(UUID.randomUUID())
                .tenTaiSan("Tai san kiem ke 1")
                .trangThaiKiemKe("DA_KIEM_KE")
                .soLuongKyHienTai(100)
                .soLuongKyThucTe(100)
                .moTa("Kiem ke hoan tat")
                .createdBy(UUID.randomUUID())
                .createdByName("Quan tri vien")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/asset/tai-san-kiem-ke — creates and returns 201")
    void testCreateReturns201() throws Exception {
        TaiSanKiemKeResponse response = makeResponse();
        when(taiSanKiemKeService.create(any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/asset/tai-san-kiem-ke")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            { "tenTaiSan": "Tai san kiem ke 1", "trangThaiKiemKe": "DA_KIEM_KE" }
                            """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));

        verify(taiSanKiemKeService).create(any());
    }

    @Test
    @DisplayName("GET /api/v1/asset/tai-san-kiem-ke/{id} — returns 200")
    void testGetByIdReturns200() throws Exception {
        TaiSanKiemKeResponse response = makeResponse();
        when(taiSanKiemKeService.getById(any(UUID.class))).thenReturn(response);

        mockMvc.perform(get("/api/v1/asset/tai-san-kiem-ke/" + response.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(taiSanKiemKeService).getById(any(UUID.class));
    }

    @Test
    @DisplayName("GET /api/v1/asset/tai-san-kiem-ke — returns 200 with paginated list")
    void testFindAllReturns200() throws Exception {
        Page<TaiSanKiemKeResponse> page = new PageImpl<>(List.of(makeResponse()));
        Pageable pageable = PageRequest.of(0, 20, Sort.by("createdAt").descending());
        when(taiSanKiemKeService.findAll(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/asset/tai-san-kiem-ke")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalElements").value(1));

        verify(taiSanKiemKeService).findAll(pageable);
    }

    @Test
    @DisplayName("PUT /api/v1/asset/tai-san-kiem-ke/{id} — updates and returns 200")
    void testUpdateReturns200() throws Exception {
        TaiSanKiemKeResponse response = makeResponse();
        when(taiSanKiemKeService.update(any(UUID.class), any())).thenReturn(response);

        mockMvc.perform(put("/api/v1/asset/tai-san-kiem-ke/" + response.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            { "tenTaiSan": "Tai san da cap nhat", "trangThaiKiemKe": "DA_KIEM_KE" }
                            """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(taiSanKiemKeService).update(any(UUID.class), any());
    }

    @Test
    @DisplayName("DELETE /api/v1/asset/tai-san-kiem-ke/{id} — deletes and returns 200")
    void testDeleteReturns200() throws Exception {
        doNothing().when(taiSanKiemKeService).delete(any(UUID.class));

        mockMvc.perform(delete("/api/v1/asset/tai-san-kiem-ke/" + UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(taiSanKiemKeService).delete(any(UUID.class));
    }
}
