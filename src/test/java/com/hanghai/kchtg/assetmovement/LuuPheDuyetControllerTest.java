package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.assetmovement.controller.LuuPheDuyetController;
import com.hanghai.kchtg.assetmovement.dto.LuuPheDuyetRequest;
import com.hanghai.kchtg.assetmovement.dto.LuuPheDuyetResponse;
import com.hanghai.kchtg.assetmovement.entity.KetQuaPheDuyet;
import com.hanghai.kchtg.assetmovement.service.LuuPheDuyetService;
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

@WebMvcTest(LuuPheDuyetController.class)
@AutoConfigureMockMvc(addFilters = false)
class LuuPheDuyetControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private LuuPheDuyetService luuPheService;

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

    private LuuPheDuyetResponse makeResponse() {
        return LuuPheDuyetResponse.builder()
                .id(UUID.randomUUID())
                .yeuCauId(UUID.randomUUID())
                .ketQua("PHE_DUYET")
                .ghiChu("Phe duyet OK")
                .createdAt(java.time.LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("F-127: POST /api/v1/asset/luu-phe-duyet — creates approval record, returns 201")
    void testCreateReturns201() throws Exception {
        LuuPheDuyetResponse response = makeResponse();
        when(luuPheService.create(any(LuuPheDuyetRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/asset/luu-phe-duyet")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "yeuCauId": "%s",
                                  "ketQua": "DUYET",
                                  "ghiChu": "Phe duyet OK"
                                }
                                """.formatted(response.getYeuCauId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.ketQua").value("PHE_DUYET"));

        verify(luuPheService).create(any(LuuPheDuyetRequest.class));
    }

    @Test
    @DisplayName("F-127: GET /api/v1/asset/luu-phe-duyet/{id} — returns 200 with approval details")
    void testGetByIdReturns200() throws Exception {
        LuuPheDuyetResponse response = makeResponse();
        when(luuPheService.getById(response.getId())).thenReturn(response);

        mockMvc.perform(get("/api/v1/asset/luu-phe-duyet/" + response.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.ketQua").value("PHE_DUYET"));

        verify(luuPheService).getById(response.getId());
    }

    @Test
    @DisplayName("F-127: GET /api/v1/asset/luu-phe-duyet — returns 200 with paginated list")
    void testGetAllReturns200() throws Exception {
        Page<LuuPheDuyetResponse> page = new PageImpl<>(List.of(makeResponse()));
        Pageable pageable = PageRequest.of(0, 20, Sort.by("createdAt").descending());
        when(luuPheService.findAll(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/asset/luu-phe-duyet")
                        .param("page", "0")
                        .param("size", "20")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalElements").value(1));

        verify(luuPheService).findAll(any(Pageable.class));
    }

    @Test
    @DisplayName("F-127: PUT /api/v1/asset/luu-phe-duyet/{id} — updates approval, returns 200")
    void testUpdateReturns200() throws Exception {
        LuuPheDuyetResponse response = makeResponse();
        when(luuPheService.update(any(UUID.class), any(LuuPheDuyetRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/v1/asset/luu-phe-duyet/" + response.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "yeuCauId": "%s",
                                  "ketQua": "TU_CHOI",
                                  "ghiChu": "Cap nhat ket qua"
                                }
                                """.formatted(response.getYeuCauId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Luu phe duyet da duoc cap nhat"));

        verify(luuPheService).update(any(UUID.class), any(LuuPheDuyetRequest.class));
    }

    @Test
    @DisplayName("F-127: DELETE /api/v1/asset/luu-phe-duyet/{id} — deletes approval, returns 200")
    void testDeleteReturns200() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete("/api/v1/asset/luu-phe-duyet/" + id)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Luu phe duyet da duoc xoa"));

        verify(luuPheService).delete(id);
    }
}
