package com.hanghai.kchtg.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import com.hanghai.kchtg.security.JwtUtil;
import com.hanghai.kchtg.security.service.JwtSessionService;
import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.security.service.TokenValidationService;
import com.hanghai.kchtg.user.controller.ApprovalController;
import com.hanghai.kchtg.user.dto.ApprovalDecisionRequest;
import com.hanghai.kchtg.user.dto.PendingApprovalResponse;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.user.service.ApprovalService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ApprovalController.class)
@org.springframework.test.context.ContextConfiguration(classes = com.hanghai.kchtg.KchtgApplication.class)
@AutoConfigureMockMvc(addFilters = false)
class ApprovalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private JpaMetamodelMappingContext jpaMappingContext;

    @MockBean
    private ApprovalService approvalService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private TokenService tokenService;

    @MockBean
    private TokenValidationService tokenValidationService;

    @MockBean
    private JwtSessionService jwtSessionService;

    @MockBean
    private AccessLogRepository accessLogRepository;

    @MockBean
    private AdminAuditLogRepository adminAuditLogRepository;

    @MockBean
    private AsyncLogAppender asyncLogAppender;

    @Test
    void listPending_returnsPage() throws Exception {
        UUID id = UUID.randomUUID();
        PendingApprovalResponse resp = new PendingApprovalResponse(
                id.toString(), "alice", "alice@example.com", "Alice Nguyen", "0901234567",
                "pending", LocalDateTime.now()
        );
        when(approvalService.listPending(any())).thenReturn(new PageImpl<>(List.of(resp)));

        mockMvc.perform(get("/api/approvals/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].username").value("alice"));
    }

    @Test
    void getById_returnsDetail() throws Exception {
        UUID id = UUID.randomUUID();
        PendingApprovalResponse resp = new PendingApprovalResponse(
                id.toString(), "alice", "alice@example.com", "Alice Nguyen", "0901234567",
                "pending", LocalDateTime.now()
        );
        when(approvalService.getById(id)).thenReturn(resp);

        mockMvc.perform(get("/api/approvals/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.username").value("alice"));
    }

    @Test
    void approve_returnsSuccess() throws Exception {
        UUID id = UUID.randomUUID();
        ApprovalDecisionRequest req = new ApprovalDecisionRequest();
        req.setReason("Approved");

        PendingApprovalResponse resp = new PendingApprovalResponse(
                id.toString(), "alice", "alice@example.com", "Alice Nguyen", "0901234567",
                "approved", LocalDateTime.now()
        );
        when(approvalService.approve(eq(id), any())).thenReturn(resp);

        mockMvc.perform(post("/api/approvals/" + id + "/approve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("approved"));
    }

    @Test
    void reject_returnsSuccess() throws Exception {
        UUID id = UUID.randomUUID();
        ApprovalDecisionRequest req = new ApprovalDecisionRequest();
        req.setReason("Rejected due to invalid info");

        PendingApprovalResponse resp = new PendingApprovalResponse(
                id.toString(), "alice", "alice@example.com", "Alice Nguyen", "0901234567",
                "rejected", LocalDateTime.now()
        );
        when(approvalService.reject(eq(id), any(), eq("Rejected due to invalid info"))).thenReturn(resp);

        mockMvc.perform(post("/api/approvals/" + id + "/reject")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("rejected"));
    }
}
