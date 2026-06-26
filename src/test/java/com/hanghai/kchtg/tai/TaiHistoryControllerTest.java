package com.hanghai.kchtg.tai;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.tai.controller.TaiHistoryController;
import com.hanghai.kchtg.tai.dto.history.TaiHistoryResponse;
import com.hanghai.kchtg.tai.entity.TaiHistoryActionType;
import com.hanghai.kchtg.tai.entity.TaiType;
import com.hanghai.kchtg.tai.service.TaiHistoryService;
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
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TaiHistoryController.class)
@AutoConfigureMockMvc(addFilters = false)
class TaiHistoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TaiHistoryService historyService;

    @MockBean
    private com.hanghai.kchtg.accesslog.repository.AccessLogRepository accessLogRepository;

    @MockBean
    private com.hanghai.kchtg.user.repository.UserRepository userRepository;

    @MockBean
    private com.hanghai.kchtg.security.service.TokenService tokenService;

    @MockBean
    private com.hanghai.kchtg.security.service.JwtSessionService jwtSessionService;

    @MockBean
    private com.hanghai.kchtg.security.service.TokenValidationService tokenValidationService;

    @MockBean
    private com.hanghai.kchtg.security.JwtUtil jwtUtil;

    @MockBean
    private com.hanghai.kchtg.user.service.PermissionRoleService permissionRoleService;

    @MockBean
    private org.springframework.data.jpa.mapping.JpaMetamodelMappingContext jpaMetamodelMappingContext;

    private TaiHistoryResponse makeHistoryResponse() {
        return TaiHistoryResponse.builder()
                .id(UUID.randomUUID())
                .entityName("TaiThongTinHangHaiHN")
                .taiType(TaiType.HANOI_HAI)
                .entityId(UUID.randomUUID())
                .actionType(TaiHistoryActionType.CREATE)
                .changedField("action=CREATE")
                .previousValue(null)
                .newValue(null)
                .changedBy(UUID.randomUUID())
                .changedByName("Quan tri vien #1")
                .changedAt(java.time.Instant.now())
                .reason(null)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/tai/history — returns 200 with paginated history")
    void testFindAllHistoryReturns200() throws Exception {
        Page<TaiHistoryResponse> page = new PageImpl<>(
                List.of(makeHistoryResponse(), makeHistoryResponse()));
        Pageable pageable = PageRequest.of(0, 20, Sort.by("changedAt").descending());
        when(historyService.findAllHistory(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/tai/history")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalElements").value(2));

        verify(historyService).findAllHistory(pageable);
    }

    @Test
    @DisplayName("GET /api/v1/tai/history/type/{type} — returns 200 with filtered results")
    void testFindByTypeReturns200() throws Exception {
        Page<TaiHistoryResponse> page = new PageImpl<>(List.of(makeHistoryResponse()));
        Pageable pageable = PageRequest.of(0, 20, Sort.by("changedAt").descending());
        when(historyService.findHistoryByType(TaiType.HANOI_HAI, pageable)).thenReturn(page);

        mockMvc.perform(get("/api/v1/tai/history/type/HANOI_HAI")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalElements").value(1));

        verify(historyService).findHistoryByType(TaiType.HANOI_HAI, pageable);
    }

    @Test
    @DisplayName("GET /api/v1/tai/history/action/{action} — returns 200 with filtered results")
    void testFindByActionReturns200() throws Exception {
        TaiHistoryResponse response = makeHistoryResponse();
        response.setActionType(TaiHistoryActionType.APPROVE);
        Page<TaiHistoryResponse> page = new PageImpl<>(List.of(response));
        Pageable pageable = PageRequest.of(0, 20, Sort.by("changedAt").descending());
        when(historyService.findHistoryByAction(TaiHistoryActionType.APPROVE, pageable)).thenReturn(page);

        mockMvc.perform(get("/api/v1/tai/history/action/APPROVE")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].actionType").value("APPROVE"));

        verify(historyService).findHistoryByAction(TaiHistoryActionType.APPROVE, pageable);
    }
}
