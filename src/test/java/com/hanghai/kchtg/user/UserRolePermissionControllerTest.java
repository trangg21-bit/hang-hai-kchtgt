package com.hanghai.kchtg.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import com.hanghai.kchtg.security.JwtUtil;
import com.hanghai.kchtg.security.service.JwtSessionService;
import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.security.service.TokenValidationService;
import com.hanghai.kchtg.user.controller.UserController;
import com.hanghai.kchtg.user.dto.GrantUserPermissionRequest;
import com.hanghai.kchtg.user.dto.UserPermissionOverrideResponse;
import com.hanghai.kchtg.user.dto.UserPageResponse;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.user.service.UserPermissionService;
import com.hanghai.kchtg.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;

@WebMvcTest(controllers = UserController.class)
@org.springframework.test.context.ContextConfiguration(classes = com.hanghai.kchtg.KchtgApplication.class)
@AutoConfigureMockMvc(addFilters = false)
class UserRolePermissionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JpaMetamodelMappingContext jpaMappingContext;

    @MockBean
    private UserService userService;

    @MockBean
    private UserPermissionService userPermissionService;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private TokenService tokenService;

    @MockBean
    private TokenValidationService tokenValidationService;

    @MockBean
    private JwtSessionService jwtSessionService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private AccessLogRepository accessLogRepository;

    @MockBean
    private AsyncLogAppender asyncLogAppender;

    @MockBean
    private AdminAuditLogRepository adminAuditLogRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private UUID userId;
    private User testUser;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        testUser = new User();
        testUser.setId(userId);
        testUser.setUsername("testuser");
        testUser.setEmail("test@domain.com");
    }

    @Test
    void listWithoutSort_shouldUseDefaultSortInsteadOfFailingOnNullSortField() throws Exception {
        when(userService.findAllWithCounts(any(), any(), any()))
                .thenReturn(new UserPageResponse(List.of(), 0, 20, 0, 0, java.util.Map.of()));

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void listDirectPermissions_shouldReturnList() throws Exception {
        UserPermissionOverrideResponse resp = new UserPermissionOverrideResponse(
                UUID.randomUUID(), userId, "document:read", "Reason", LocalDateTime.now());
        when(userPermissionService.list(userId)).thenReturn(List.of(resp));

        mockMvc.perform(get("/api/users/{id}/permissions", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].permissionCode").value("document:read"));
    }

    @Test
    void grantDirectPermission_shouldReturnOverride() throws Exception {
        UserPermissionOverrideResponse resp = new UserPermissionOverrideResponse(
                UUID.randomUUID(), userId, "document:read", "Reason", LocalDateTime.now());
        when(userPermissionService.grant(eq(userId), any())).thenReturn(resp);

        GrantUserPermissionRequest req = new GrantUserPermissionRequest();
        req.setPermissionCode("document:read");
        req.setReason("Testing");

        mockMvc.perform(post("/api/users/{id}/permissions", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void replaceDirectPermissions_shouldReturnUpdatedList() throws Exception {
        UserPermissionOverrideResponse resp = new UserPermissionOverrideResponse(
                UUID.randomUUID(), userId, "document:read", null, LocalDateTime.now());
        doNothing().when(userPermissionService).replaceDirectPermissions(eq(userId), anyList());
        when(userPermissionService.list(userId)).thenReturn(List.of(resp));

        mockMvc.perform(put("/api/users/{id}/permissions", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of("document:read"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].permissionCode").value("document:read"));
    }

    @Test
    void revokeDirectPermission_shouldReturnSuccess() throws Exception {
        doNothing().when(userPermissionService).revoke(userId, "document:read");

        mockMvc.perform(delete("/api/users/{id}/permissions/{code}", userId, "document:read"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
