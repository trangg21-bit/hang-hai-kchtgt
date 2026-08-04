package com.hanghai.kchtg.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import com.hanghai.kchtg.security.JwtUtil;
import com.hanghai.kchtg.security.service.JwtSessionService;
import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.security.service.TokenValidationService;
import com.hanghai.kchtg.user.controller.RoleController;
import com.hanghai.kchtg.user.entity.Permission;
import com.hanghai.kchtg.user.entity.Role;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.user.service.RoleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;

@WebMvcTest(RoleController.class)
@AutoConfigureMockMvc(addFilters = false)
class RolePermissionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JpaMetamodelMappingContext jpaMappingContext;

    @MockBean
    private RoleService roleService;

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

    private UUID roleId;
    private Role role;
    private Permission p1;

    @BeforeEach
    void setUp() {
        roleId = UUID.randomUUID();
        p1 = new Permission();
        p1.setId(UUID.randomUUID());
        p1.setCode("document:read");
        p1.setName("Doc Read");

        role = new Role();
        role.setId(roleId);
        role.setCode("ROLE_ANALYST");
        role.setName("Analyst");
        role.setPermissions(Set.of(p1));
    }

    @Test
    void getRolePermissions_shouldReturnList() throws Exception {
        when(roleService.findById(roleId)).thenReturn(role);

        mockMvc.perform(get("/api/roles/{id}/permissions", roleId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].code").value("document:read"));
    }

    @Test
    void assignRolePermissions_shouldReturnUpdatedRole() throws Exception {
        when(roleService.update(eq(roleId), any())).thenReturn(role);

        mockMvc.perform(post("/api/roles/{id}/permissions", roleId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of("document:read", "document:create"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").value("ROLE_ANALYST"));
    }

    @Test
    void revokeRolePermission_shouldReturnUpdatedRole() throws Exception {
        when(roleService.findById(roleId)).thenReturn(role);
        when(roleService.update(eq(roleId), any())).thenReturn(role);

        mockMvc.perform(delete("/api/roles/{id}/permissions/{permissionId}", roleId, p1.getCode()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
