package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.group.entity.GroupStatus;
import com.hanghai.kchtg.group.entity.UserGroup;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserPermissionOverride;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
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
    void directGlobalPermissionBypassesAllPermissions() {
        User user = userWithPermission("admin:all");
        when(userRepository.findByIdWithRelations(userId)).thenReturn(Optional.of(user));

        assertThat(permissionRoleService.checkPermission(userId, "vts", "delete")).isTrue();
    }

    @Test
    void directAndActiveGroupPermissionsAreCombined() {
        User user = userWithPermission("vts:update");
        UserGroup group = new UserGroup();
        group.setStatus(GroupStatus.ACTIVE);
        group.setPermissions(java.util.List.of("vts:read", "VTS:history"));
        user.setGroups(java.util.List.of(group));
        when(userRepository.findByIdWithRelations(userId)).thenReturn(Optional.of(user));

        assertThat(permissionRoleService.checkPermission(userId, "vts", "update")).isTrue();
        assertThat(permissionRoleService.checkPermission(userId, "vts", "read")).isTrue();
        assertThat(permissionRoleService.checkPermission(userId, "vts", "history")).isTrue();
    }

    @Test
    void inactiveGroupPermissionsAreNotEffective() {
        User user = userWithPermission("vts:update");
        UserGroup group = new UserGroup();
        group.setStatus(GroupStatus.INACTIVE);
        group.setPermissions(java.util.List.of("vts:read"));
        user.setGroups(java.util.List.of(group));
        when(userRepository.findByIdWithRelations(userId)).thenReturn(Optional.of(user));

        assertThat(permissionRoleService.checkPermission(userId, "vts", "update")).isTrue();
        assertThat(permissionRoleService.checkPermission(userId, "vts", "read")).isFalse();
    }

    private User userWithPermission(String permissionCode) {
        User user = new User();
        user.setId(userId);
        UserPermissionOverride override = new UserPermissionOverride();
        override.setUser(user);
        override.setPermissionCode(permissionCode);
        user.setPermissionOverrides(java.util.List.of(override));
        return user;
    }
}
