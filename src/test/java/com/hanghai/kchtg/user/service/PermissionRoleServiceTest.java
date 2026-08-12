package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.user.entity.Permission;
import com.hanghai.kchtg.user.entity.Role;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PermissionRoleServiceTest {

    @Mock
    private UserRepository userRepository;

    private PermissionRoleService permissionRoleService;
    private UUID userId;

    @BeforeEach
    void setUp() {
        permissionRoleService = new PermissionRoleService(userRepository);
        ReflectionTestUtils.setField(permissionRoleService, "superAdminRoleCode", "ROLE_SYSTEM_ADMIN");
        userId = UUID.randomUUID();
    }

    @Test
    void aggregateManagePermissionGrantsMiddlewareActionsForSameResource() {
        User user = userWithPermission("group:manage");
        when(userRepository.findByIdWithRelations(userId)).thenReturn(Optional.of(user));

        assertThat(permissionRoleService.checkPermission(userId, "group", "read")).isTrue();
        assertThat(permissionRoleService.checkPermission(userId, "group", "write")).isTrue();
        assertThat(permissionRoleService.checkPermission(userId, "group", "delete")).isTrue();
    }

    @Test
    void aggregateManagePermissionDoesNotGrantAnotherResource() {
        User user = userWithPermission("group:manage");
        when(userRepository.findByIdWithRelations(userId)).thenReturn(Optional.of(user));

        assertThat(permissionRoleService.checkPermission(userId, "orgunit", "read")).isFalse();
    }

    @Test
    void superAdminRoleBypassesAllPermissions() {
        User user = userWithRole("ROLE_SUPER_ADMIN");
        when(userRepository.findByIdWithRelations(userId)).thenReturn(Optional.of(user));

        assertThat(permissionRoleService.checkPermission(userId, "vts", "delete")).isTrue();
    }

    private User userWithPermission(String permissionCode) {
        Permission permission = new Permission();
        permission.setCode(permissionCode);

        Role role = new Role();
        role.setCode("ROLE_ADMIN");
        role.setPermissions(Set.of(permission));

        User user = new User();
        user.setId(userId);
        user.setRoles(Set.of(role));
        return user;
    }

    private User userWithRole(String roleCode) {
        Role role = new Role();
        role.setCode(roleCode);

        User user = new User();
        user.setId(userId);
        user.setRoles(Set.of(role));
        return user;
    }
}
