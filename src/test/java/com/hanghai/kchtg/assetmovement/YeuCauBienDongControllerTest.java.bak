package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.assetmovement.controller.YeuCauBienDongController;
import com.hanghai.kchtg.assetmovement.dto.YeuCauBienDongRequest;
import com.hanghai.kchtg.assetmovement.dto.YeuCauBienDongResponse;
import com.hanghai.kchtg.assetmovement.entity.LoaiBienDong;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiYeuCau;
import com.hanghai.kchtg.assetmovement.service.YeuCauBienDongService;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(YeuCauBienDongController.class)
@AutoConfigureMockMvc(addFilters = false)
class YeuCauBienDongControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private YeuCauBienDongService yeuCauService;

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

    private YeuCauBienDongResponse makeResponse() {
        return YeuCauBienDongResponse.builder()
                .id(UUID.randomUUID())
                .loaiBienDong("TANG")
                .taiSanId(UUID.randomUUID())
                .soLuong(5)
                .trangThai("CHO_PHE_DUYET")
                .moTa("Bien dong tai san")
                .createdAt(java.time.LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("F-127: POST /api/v1/asset/yeu-cau-bien-dong — creates request, returns 201")
    void testCreateReturns201() throws Exception {
        YeuCauBienDongResponse response = makeResponse();
        when(yeuCauService.create(any(YeuCauBienDongRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/asset/yeu-cau-bien-dong")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "loaiBienDong": "TANG_GIAM",
                                  "taiSanId": "%s",
                                  "soLuong": 5,
                                  "lyDo": "Bien dong tai san"
                                }
                                """.formatted(response.getTaiSanId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.loaiBienDong").value("TANG"));

        verify(yeuCauService).create(any(YeuCauBienDongRequest.class));
    }

    @Test
    @DisplayName("F-127: GET /api/v1/asset/yeu-cau-bien-dong/{id} — returns 200 with request details")
    void testGetByIdReturns200() throws Exception {
        YeuCauBienDongResponse response = makeResponse();
        when(yeuCauService.getById(response.getId())).thenReturn(response);

        mockMvc.perform(get("/api/v1/asset/yeu-cau-bien-dong/" + response.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.loaiBienDong").value("TANG"));

        verify(yeuCauService).getById(response.getId());
    }

    @Test
    @DisplayName("F-127: GET /api/v1/asset/yeu-cau-bien-dong — returns 200 with paginated list")
    void testGetAllReturns200() throws Exception {
        Page<YeuCauBienDongResponse> page = new PageImpl<>(List.of(makeResponse()));
        Pageable pageable = PageRequest.of(0, 20, Sort.by("createdAt").descending());
        when(yeuCauService.findAll(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/asset/yeu-cau-bien-dong")
                        .param("page", "0")
                        .param("size", "20")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalElements").value(1));

        verify(yeuCauService).findAll(any(Pageable.class));
    }

    @Test
    @DisplayName("F-127: PUT /api/v1/asset/yeu-cau-bien-dong/{id} — updates request, returns 200")
    void testUpdateReturns200() throws Exception {
        YeuCauBienDongResponse response = makeResponse();
        when(yeuCauService.update(any(UUID.class), any(YeuCauBienDongRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/v1/asset/yeu-cau-bien-dong/" + response.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "loaiBienDong": "CHUYEN_THUOC",
                                  "taiSanId": "%s",
                                  "soLuong": 10,
                                  "lyDo": "Cap nhat loai bien dong"
                                }
                                """.formatted(response.getTaiSanId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Yeu cau bien dong da duoc cap nhat"));

        verify(yeuCauService).update(any(UUID.class), any(YeuCauBienDongRequest.class));
    }

    @Test
    @DisplayName("F-127: DELETE /api/v1/asset/yeu-cau-bien-dong/{id} — deletes request, returns 200")
    void testDeleteReturns200() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete("/api/v1/asset/yeu-cau-bien-dong/" + id)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Yeu cau bien dong da duoc xoa"));

        verify(yeuCauService).delete(id);
    }
}
