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
import com.hanghai.kchtg.user.entity.Role;
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
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;

@WebMvcTest(UserController.class)
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
        Role role = new Role();
        role.setCode("ROLE_USER");
        role.setName("User");

        testUser = new User();
        testUser.setId(userId);
        testUser.setUsername("testuser");
        testUser.setEmail("test@domain.com");
        testUser.setRoles(new java.util.HashSet<>(Set.of(role)));
    }

    @Test
    void getUserRoles_shouldReturnRoleList() throws Exception {
        when(userService.findById(userId)).thenReturn(testUser);

        mockMvc.perform(get("/api/users/{id}/roles", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].code").value("ROLE_USER"));
    }

    @Test
    void assignUserRole_shouldReturnUpdatedUser() throws Exception {
        when(userService.update(eq(userId), any())).thenReturn(testUser);

        mockMvc.perform(post("/api/users/{id}/roles", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("roleCode", "ROLE_ADMIN"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void revokeUserRole_shouldReturnUpdatedUser() throws Exception {
        when(userService.findById(userId)).thenReturn(testUser);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        mockMvc.perform(delete("/api/users/{id}/roles/{roleId}", userId, "ROLE_ADMIN"))
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
    void revokeDirectPermission_shouldReturnSuccess() throws Exception {
        doNothing().when(userPermissionService).revoke(userId, "document:read");

        mockMvc.perform(delete("/api/users/{id}/permissions/{code}", userId, "document:read"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
