package com.hanghai.kchtg.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import com.hanghai.kchtg.security.JwtUtil;
import com.hanghai.kchtg.security.service.JwtSessionService;
import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.security.service.TokenValidationService;
import com.hanghai.kchtg.user.controller.PermissionController;
import com.hanghai.kchtg.user.entity.Permission;
import com.hanghai.kchtg.user.repository.PermissionRepository;
import com.hanghai.kchtg.user.repository.SystemMenuRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.user.service.PermissionRoleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.hamcrest.Matchers.hasItem;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;

@WebMvcTest(controllers = PermissionController.class)
@org.springframework.test.context.ContextConfiguration(classes = com.hanghai.kchtg.KchtgApplication.class)
@AutoConfigureMockMvc(addFilters = false)
class PermissionCrudAndEvaluateTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JpaMetamodelMappingContext jpaMappingContext;

    @MockBean
    private PermissionRepository permissionRepository;

    @MockBean
    private SystemMenuRepository systemMenuRepository;

    @MockBean
    private PermissionRoleService permissionRoleService;

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

    private UUID permId;
    private Permission perm;

    @BeforeEach
    void setUp() {
        permId = UUID.randomUUID();
        perm = new Permission();
        perm.setId(permId);
        perm.setCode("document:read");
        perm.setName("Doc Read");
        perm.setResource("document");
        perm.setAction("read");
    }

    @Test
    void updatePermission_shouldReturnUpdatedPermission() throws Exception {
        when(permissionRepository.findById(permId)).thenReturn(Optional.of(perm));
        when(permissionRepository.save(any())).thenReturn(perm);

        PermissionController.CreatePermissionRequest req = new PermissionController.CreatePermissionRequest();
        req.setName("Updated Name");

        mockMvc.perform(put("/api/permissions/{id}", permId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void deletePermission_shouldReturnSuccess() throws Exception {
        when(permissionRepository.findById(permId)).thenReturn(Optional.of(perm));
        doNothing().when(permissionRepository).delete(perm);

        mockMvc.perform(delete("/api/permissions/{id}", permId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void evaluatePermissions_shouldReturnEffectivePermissionsSet() throws Exception {
        UUID userId = UUID.randomUUID();
        when(permissionRoleService.getUserPermissions(userId)).thenReturn(Set.of("document:read", "document:write"));

        mockMvc.perform(get("/api/permissions/evaluate/{userId}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasItem("document:read")));
    }
}
