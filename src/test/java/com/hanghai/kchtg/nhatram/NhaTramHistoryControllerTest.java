package com.hanghai.kchtg.nhatram;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.nhatram.controller.NhaTramHistoryController;
import com.hanghai.kchtg.nhatram.dto.history.NhaTramHistoryResponse;
import com.hanghai.kchtg.nhatram.entity.NhaTramHistoryActionType;
import com.hanghai.kchtg.nhatram.entity.NhaTramType;
import com.hanghai.kchtg.nhatram.service.NhaTramHistoryService;
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
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NhaTramHistoryController.class)
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(roles = "SYSTEM_ADMIN")
class NhaTramHistoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NhaTramHistoryService historyService;

    @MockBean
    private AsyncLogAppender asyncLogAppender;

    @MockBean
    private AccessLogRepository accessLogRepository;

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

    @Test
    @DisplayName("GET /api/v1/nhatram/history — returns paginated history for PHAO")
    void testGetHistoryPhao() throws Exception {
        Page<NhaTramHistoryResponse> emptyPage = Page.empty();
        when(historyService.getHistoryFiltered(eq(NhaTramType.PHAO), any(), any(), any(), any(), any(), any()))
                .thenReturn(emptyPage);

        mockMvc.perform(get("/api/v1/nhatram/history")
                        .param("type", "PHAO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalElements").value(0));

        verify(historyService).getHistoryFiltered(eq(NhaTramType.PHAO), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("GET /api/v1/nhatram/history — returns paginated history for DEN")
    void testGetHistoryDen() throws Exception {
        Page<NhaTramHistoryResponse> emptyPage = Page.empty();
        when(historyService.getHistoryFiltered(eq(NhaTramType.DEN), any(), any(), any(), any(), any(), any()))
                .thenReturn(emptyPage);

        mockMvc.perform(get("/api/v1/nhatram/history")
                        .param("type", "DEN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(0));

        verify(historyService).getHistoryFiltered(eq(NhaTramType.DEN), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("GET /api/v1/nhatram/history — filters by action type")
    void testGetHistoryByActionType() throws Exception {
        Page<NhaTramHistoryResponse> emptyPage = Page.empty();
        when(historyService.getHistoryFiltered(eq(NhaTramType.PHAO), any(), eq(NhaTramHistoryActionType.CREATE), any(), any(), any(), any()))
                .thenReturn(emptyPage);

        mockMvc.perform(get("/api/v1/nhatram/history")
                        .param("type", "PHAO")
                        .param("actionType", "CREATE"))
                .andExpect(status().isOk());

        verify(historyService).getHistoryFiltered(eq(NhaTramType.PHAO), any(), eq(NhaTramHistoryActionType.CREATE), any(), any(), any(), any());
    }

    @Test
    @DisplayName("GET /api/v1/nhatram/history — filters by entity id")
    void testGetHistoryByEntityId() throws Exception {
        Page<NhaTramHistoryResponse> emptyPage = Page.empty();
        String entityId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
        when(historyService.getHistoryFiltered(eq(NhaTramType.PHAO), eq(java.util.UUID.fromString(entityId)), any(), any(), any(), any(), any()))
                .thenReturn(emptyPage);

        mockMvc.perform(get("/api/v1/nhatram/history")
                        .param("type", "PHAO")
                        .param("entityId", entityId))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/v1/nhatram/history — paginated with page and size")
    void testGetHistoryPagination() throws Exception {
        Page<NhaTramHistoryResponse> emptyPage = Page.empty();
        when(historyService.getHistoryFiltered(eq(NhaTramType.PHAO), any(), any(), any(), any(), any(), any()))
                .thenReturn(emptyPage);

        mockMvc.perform(get("/api/v1/nhatram/history")
                        .param("type", "PHAO")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalPages").value(1));
    }

    @Test
    @DisplayName("GET /api/v1/nhatram/history — filters by date range")
    void testGetHistoryByDateRange() throws Exception {
        Page<NhaTramHistoryResponse> emptyPage = Page.empty();
        when(historyService.getHistoryFiltered(eq(NhaTramType.PHAO), any(), any(), any(), any(), any(), any()))
                .thenReturn(emptyPage);

        mockMvc.perform(get("/api/v1/nhatram/history")
                        .param("type", "PHAO")
                        .param("from", "2025-01-01T00:00:00")
                        .param("to", "2025-12-31T23:59:59"))
                .andExpect(status().isOk());
    }
}
