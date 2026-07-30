package com.hanghai.kchtg.datasharing;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import com.hanghai.kchtg.datasharing.controller.ShareWorkflowController;
import com.hanghai.kchtg.datasharing.entity.ShareHistory;
import com.hanghai.kchtg.datasharing.entity.SharedData;
import com.hanghai.kchtg.datasharing.service.ShareWorkflowService;
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
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ShareWorkflowController.class)
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(roles = "SYSTEM_ADMIN")
@DisplayName("ShareWorkflowController Web MVC Tests — M-018 Wave 3")
class ShareWorkflowControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ShareWorkflowService shareWorkflowService;

    // Global interceptor / security dependencies mock
    @MockBean
    private AsyncLogAppender asyncLogAppender;

    @MockBean
    private AccessLogRepository accessLogRepository;

    @MockBean
    private UserRepository userRepository;
    @MockBean
    private AdminAuditLogRepository adminAuditLogRepository;


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

    // ------------------------------------------------------------------
    // POST /{id}/submit
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-018-WC-01: submit_returns200 — POST /api/v1/datasharing/shares/00000000-0000-0000-0000-000000000001/submit")
    void submit_returns200() throws Exception {
        SharedData data = SharedData.builder()
                .id(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .sharedWith("KCHTGT-CN")
                .sharedCreated(Instant.now())
                .build();

        when(shareWorkflowService.submitForShare(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"), java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"), "Gửi chia sẻ")).thenReturn(data);

        mockMvc.perform(post("/api/v1/datasharing/shares/00000000-0000-0000-0000-000000000001/submit")
                        .param("actor", "00000000-0000-0000-0000-000000000001")
                        .param("comments", "Gửi chia sẻ"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(shareWorkflowService).submitForShare(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"), java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"), "Gửi chia sẻ");
    }

    // ------------------------------------------------------------------
    // POST /{id}/approve
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-018-WC-02: approve_returns200 — POST /api/v1/datasharing/shares/00000000-0000-0000-0000-000000000002/approve")
    void approve_returns200() throws Exception {
        SharedData data = SharedData.builder()
                .id(java.util.UUID.fromString("00000000-0000-0000-0000-000000000002"))
                .sharedWith("VTS-DNAI")
                .approvedBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000002"))
                .sharedCreated(Instant.now())
                .build();

        when(shareWorkflowService.approveShare(java.util.UUID.fromString("00000000-0000-0000-0000-000000000002"), java.util.UUID.fromString("00000000-0000-0000-0000-000000000002"), "Phê duyệt")).thenReturn(data);

        mockMvc.perform(post("/api/v1/datasharing/shares/00000000-0000-0000-0000-000000000002/approve")
                        .param("actor", "00000000-0000-0000-0000-000000000002")
                        .param("comments", "Phê duyệt"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(shareWorkflowService).approveShare(java.util.UUID.fromString("00000000-0000-0000-0000-000000000002"), java.util.UUID.fromString("00000000-0000-0000-0000-000000000002"), "Phê duyệt");
    }

    // ------------------------------------------------------------------
    // POST /{id}/revoke
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-018-WC-03: revoke_returns200 — POST /api/v1/datasharing/shares/00000000-0000-0000-0000-000000000003/revoke")
    void revoke_returns200() throws Exception {
        SharedData data = SharedData.builder()
                .id(java.util.UUID.fromString("00000000-0000-0000-0000-000000000003"))
                .sharedWith("KCHTGT-TH")
                .sharedCreated(Instant.now())
                .build();

        when(shareWorkflowService.revokeShare(java.util.UUID.fromString("00000000-0000-0000-0000-000000000003"), java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"), "Thu hồi")).thenReturn(data);

        mockMvc.perform(post("/api/v1/datasharing/shares/00000000-0000-0000-0000-000000000003/revoke")
                        .param("actor", "00000000-0000-0000-0000-000000000001")
                        .param("comments", "Thu hồi"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(shareWorkflowService).revokeShare(java.util.UUID.fromString("00000000-0000-0000-0000-000000000003"), java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"), "Thu hồi");
    }

    // ------------------------------------------------------------------
    // GET /{id}/history
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-018-WC-04: history_returns200 — GET /api/v1/datasharing/shares/00000000-0000-0000-0000-000000000004/history")
    void history_returns200() throws Exception {
        ShareHistory h1 = ShareHistory.builder()
                .id(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001")).sharedDataId(java.util.UUID.fromString("00000000-0000-0000-0000-000000000004")).action("SHARE").actor(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .createdAt(Instant.now().minusSeconds(200)).build();
        ShareHistory h2 = ShareHistory.builder()
                .id(java.util.UUID.fromString("00000000-0000-0000-0000-000000000002")).sharedDataId(java.util.UUID.fromString("00000000-0000-0000-0000-000000000004")).action("APPROVE").actor(java.util.UUID.fromString("00000000-0000-0000-0000-000000000002"))
                .createdAt(Instant.now().minusSeconds(100)).build();

        when(shareWorkflowService.getHistory(java.util.UUID.fromString("00000000-0000-0000-0000-000000000004"))).thenReturn(List.of(h1, h2));

        mockMvc.perform(get("/api/v1/datasharing/shares/00000000-0000-0000-0000-000000000004/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].action").value("SHARE"))
                .andExpect(jsonPath("$.data[1].action").value("APPROVE"));

        verify(shareWorkflowService).getHistory(java.util.UUID.fromString("00000000-0000-0000-0000-000000000004"));
    }
}
