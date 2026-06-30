package com.hanghai.kchtg.statistics;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.security.JwtUtil;
import com.hanghai.kchtg.security.service.JwtSessionService;
import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.security.service.TokenValidationService;
import com.hanghai.kchtg.statistics.controller.FormApprovalController;
import com.hanghai.kchtg.statistics.entity.FormApprovalHistory;
import com.hanghai.kchtg.statistics.entity.StatFormStatus;
import com.hanghai.kchtg.statistics.entity.StatisticsForm;
import com.hanghai.kchtg.statistics.service.FormApprovalService;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(FormApprovalController.class)
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(roles = "SYSTEM_ADMIN")
class FormApprovalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FormApprovalService formApprovalService;

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

    @Test
    void submit_returns200() throws Exception {
        StatisticsForm form = new StatisticsForm();
        form.setId(1L);
        form.setFormCode("TK-001");
        form.setFormStatus(StatFormStatus.SUBMITTED);

        when(formApprovalService.submitForm(eq(1L), eq("actor1"), eq("comment"))).thenReturn(form);

        mockMvc.perform(post("/api/v1/statistics/forms/1/submit")
                        .param("actor", "actor1")
                        .param("comments", "comment"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1L))
                .andExpect(jsonPath("$.data.formCode").value("TK-001"))
                .andExpect(jsonPath("$.data.formStatus").value("SUBMITTED"));

        verify(formApprovalService, times(1)).submitForm(eq(1L), eq("actor1"), eq("comment"));
    }

    @Test
    void approve_returns200() throws Exception {
        StatisticsForm form = new StatisticsForm();
        form.setId(1L);
        form.setFormCode("TK-001");
        form.setFormStatus(StatFormStatus.APPROVED);

        when(formApprovalService.approveForm(eq(1L), eq("actor2"), eq("approve comment"))).thenReturn(form);

        mockMvc.perform(post("/api/v1/statistics/forms/1/approve")
                        .param("actor", "actor2")
                        .param("comments", "approve comment"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1L))
                .andExpect(jsonPath("$.data.formStatus").value("APPROVED"));

        verify(formApprovalService, times(1)).approveForm(eq(1L), eq("actor2"), eq("approve comment"));
    }

    @Test
    void reject_returns200() throws Exception {
        StatisticsForm form = new StatisticsForm();
        form.setId(1L);
        form.setFormCode("TK-001");
        form.setFormStatus(StatFormStatus.REJECTED);

        when(formApprovalService.rejectForm(eq(1L), eq("actor3"), eq("reject comment"))).thenReturn(form);

        mockMvc.perform(post("/api/v1/statistics/forms/1/reject")
                        .param("actor", "actor3")
                        .param("comments", "reject comment"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1L))
                .andExpect(jsonPath("$.data.formStatus").value("REJECTED"));

        verify(formApprovalService, times(1)).rejectForm(eq(1L), eq("actor3"), eq("reject comment"));
    }

    @Test
    void getHistory_returns200() throws Exception {
        FormApprovalHistory history = FormApprovalHistory.builder()
                .id(1L)
                .formId(1L)
                .action("SUBMIT")
                .actor("actor1")
                .comments("comment")
                .build();

        when(formApprovalService.getHistory(1L)).thenReturn(List.of(history));

        mockMvc.perform(get("/api/v1/statistics/forms/1/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(1L))
                .andExpect(jsonPath("$.data[0].action").value("SUBMIT"));

        verify(formApprovalService, times(1)).getHistory(1L);
    }
}
