package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import com.hanghai.kchtg.security.service.PermissionCacheService;
import com.hanghai.kchtg.user.dto.CreateRoleRequest;
import com.hanghai.kchtg.user.dto.UpdateRoleRequest;
import com.hanghai.kchtg.user.entity.Permission;
import com.hanghai.kchtg.user.entity.Role;
import com.hanghai.kchtg.user.entity.RoleStatus;
import com.hanghai.kchtg.user.repository.PermissionRepository;
import com.hanghai.kchtg.user.repository.RoleRepository;
import com.hanghai.kchtg.user.repository.SystemMenuRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoleServiceTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PermissionRepository permissionRepository;

    @Mock
    private SystemMenuRepository systemMenuRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PermissionCacheService permissionCacheService;

    @Mock
    private AdminAuditLogRepository adminAuditLogRepository;

    @InjectMocks
    private RoleService roleService;

    private UUID roleId;
    private Role normalRole;
    private Role systemRole;

    @BeforeEach
    void setUp() {
        roleId = UUID.randomUUID();

        normalRole = new Role();
        normalRole.setId(roleId);
        normalRole.setCode("ROLE_MANAGER");
        normalRole.setName("Manager");
        normalRole.setIsSystem(false);
        normalRole.setStatus(RoleStatus.ACTIVE);

        systemRole = new Role();
        systemRole.setId(UUID.randomUUID());
        systemRole.setCode("ROLE_SYSTEM_ADMIN");
        systemRole.setName("System Admin");
        systemRole.setIsSystem(true);
        systemRole.setStatus(RoleStatus.ACTIVE);
    }

    @Test
    @DisplayName("create_shouldAllowCreatingRoleWhenCodeIsUnique")
    void create_shouldAllowCreatingRoleWhenCodeIsUnique() {
        CreateRoleRequest request = new CreateRoleRequest();
        request.setCode("ROLE_AUDITOR");
        request.setName("Auditor");
        request.setDescription("Audit role");
        request.setPermissions(List.of("user:read"));

        Permission perm = new Permission();
        perm.setCode("user:read");

        when(roleRepository.findByCodeIncludeDeleted("ROLE_AUDITOR")).thenReturn(Optional.empty());
        when(permissionRepository.findByCode("user:read")).thenReturn(Optional.of(perm));
        when(roleRepository.save(any(Role.class))).thenAnswer(inv -> {
            Role r = inv.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });

        Role result = roleService.create(request);

        assertNotNull(result);
        assertEquals("ROLE_AUDITOR", result.getCode());
        assertEquals("Auditor", result.getName());
        verify(roleRepository).save(any(Role.class));
    }

    @Test
    @DisplayName("create_shouldThrowWhenRoleCodeExists")
    void create_shouldThrowWhenRoleCodeExists() {
        CreateRoleRequest request = new CreateRoleRequest();
        request.setCode("ROLE_MANAGER");
        request.setName("Manager");

        when(roleRepository.findByCodeIncludeDeleted("ROLE_MANAGER")).thenReturn(Optional.of(normalRole));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> roleService.create(request));

        assertTrue(ex.getMessage().contains("Mã vai trò đã tồn tại"));
        verify(roleRepository, never()).save(any(Role.class));
    }

    @Test
    @DisplayName("update_shouldUpdateRoleInformationAndInvalidateCache")
    void update_shouldUpdateRoleInformationAndInvalidateCache() {
        UpdateRoleRequest request = new UpdateRoleRequest();
        request.setName("Updated Manager");
        request.setPermissions(List.of("user:read"));

        Permission perm = new Permission();
        perm.setCode("user:read");

        UUID userId = UUID.randomUUID();

        when(roleRepository.findById(roleId)).thenReturn(Optional.of(normalRole));
        when(permissionRepository.findByCode("user:read")).thenReturn(Optional.of(perm));
        when(roleRepository.save(any(Role.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findIdsByRoleId(roleId)).thenReturn(List.of(userId));

        Role result = roleService.update(roleId, request);

        assertEquals("Updated Manager", result.getName());
        verify(permissionCacheService).invalidateAndIncrementVersion(userId);
        verify(roleRepository).save(any(Role.class));
    }

    @Test
    @DisplayName("delete_shouldSoftDeleteRoleWhenNotSystem")
    void delete_shouldSoftDeleteRoleWhenNotSystem() {
        when(roleRepository.findById(roleId)).thenReturn(Optional.of(normalRole));
        when(roleRepository.save(any(Role.class))).thenAnswer(inv -> inv.getArgument(0));

        Role result = roleService.delete(roleId);

        assertEquals(RoleStatus.DELETED, result.getStatus());
        verify(roleRepository).save(normalRole);
    }

    @Test
    @DisplayName("delete_shouldSetStatusInactiveWhenSystemRole")
    void delete_shouldSetStatusInactiveWhenSystemRole() {
        when(roleRepository.findById(systemRole.getId())).thenReturn(Optional.of(systemRole));
        when(roleRepository.save(any(Role.class))).thenAnswer(inv -> inv.getArgument(0));

        Role result = roleService.delete(systemRole.getId());

        assertEquals(RoleStatus.INACTIVE, result.getStatus());
        assertNotEquals(RoleStatus.DELETED, result.getStatus());
        verify(roleRepository).save(systemRole);
    }
}
