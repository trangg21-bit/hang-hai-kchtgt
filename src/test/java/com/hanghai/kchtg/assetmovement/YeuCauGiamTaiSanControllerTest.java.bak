package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.assetmovement.controller.YeuCauGiamTaiSanController;
import com.hanghai.kchtg.assetmovement.dto.YeuCauGiamTaiSanRequest;
import com.hanghai.kchtg.assetmovement.dto.YeuCauGiamTaiSanResponse;
import com.hanghai.kchtg.assetmovement.service.YeuCauGiamTaiSanService;
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

@WebMvcTest(YeuCauGiamTaiSanController.class)
@AutoConfigureMockMvc(addFilters = false)
class YeuCauGiamTaiSanControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private YeuCauGiamTaiSanService yeuCauService;

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

    private YeuCauGiamTaiSanResponse makeResponse() {
        return YeuCauGiamTaiSanResponse.builder()
                .id(UUID.randomUUID())
                .taiSanId(UUID.randomUUID())
                .tenTaiSan("Tai san giam")
                .soLuong(5)
                .donViTinh("cai")
                .lyDo("Giam de tiet kiem")
                .trangThai("CHO_PHE_DUYET")
                .nguyenNhanGiam("KHONG_SU_DUNG")
                .createdBy(UUID.randomUUID())
                .createdByName("Quan tri vien")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/asset/yeu-cau-giam — creates and returns 201")
    void testCreateReturns201() throws Exception {
        YeuCauGiamTaiSanResponse response = makeResponse();
        when(yeuCauService.create(any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/asset/yeu-cau-giam")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            { "taiSanId": "00000000-0000-0000-0000-000000000001", "soLuong": 5 }
                            """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));

        verify(yeuCauService).create(any());
    }

    @Test
    @DisplayName("GET /api/v1/asset/yeu-cau-giam/{id} — returns 200")
    void testGetByIdReturns200() throws Exception {
        YeuCauGiamTaiSanResponse response = makeResponse();
        when(yeuCauService.getById(any(UUID.class))).thenReturn(response);

        mockMvc.perform(get("/api/v1/asset/yeu-cau-giam/" + response.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(yeuCauService).getById(any(UUID.class));
    }

    @Test
    @DisplayName("GET /api/v1/asset/yeu-cau-giam — returns 200 with paginated list")
    void testFindAllReturns200() throws Exception {
        Page<YeuCauGiamTaiSanResponse> page = new PageImpl<>(List.of(makeResponse()));
        Pageable pageable = PageRequest.of(0, 20, Sort.by("createdAt").descending());
        when(yeuCauService.findAll(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/asset/yeu-cau-giam")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalElements").value(1));

        verify(yeuCauService).findAll(pageable);
    }

    @Test
    @DisplayName("PUT /api/v1/asset/yeu-cau-giam/{id} — updates and returns 200")
    void testUpdateReturns200() throws Exception {
        YeuCauGiamTaiSanResponse response = makeResponse();
        when(yeuCauService.update(any(UUID.class), any())).thenReturn(response);

        mockMvc.perform(put("/api/v1/asset/yeu-cau-giam/" + response.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            { "taiSanId": "00000000-0000-0000-0000-000000000001", "soLuong": 3 }
                            """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(yeuCauService).update(any(UUID.class), any());
    }

    @Test
    @DisplayName("DELETE /api/v1/asset/yeu-cau-giam/{id} — deletes and returns 200")
    void testDeleteReturns200() throws Exception {
        doNothing().when(yeuCauService).delete(any(UUID.class));

        mockMvc.perform(delete("/api/v1/asset/yeu-cau-giam/" + UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(yeuCauService).delete(any(UUID.class));
    }
}
