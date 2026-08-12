package com.hanghai.kchtg.user;

import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import com.hanghai.kchtg.security.service.PermissionCacheService;
import com.hanghai.kchtg.user.controller.UserController;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.user.entity.Role;
import com.hanghai.kchtg.user.entity.RoleStatus;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.user.repository.PermissionRepository;
import com.hanghai.kchtg.user.repository.RoleRepository;
import com.hanghai.kchtg.user.repository.SystemMenuRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.user.service.RoleService;
import com.hanghai.kchtg.user.service.UserPermissionService;
import com.hanghai.kchtg.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.access.AccessDeniedException;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@org.junit.jupiter.api.extension.ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
public class BusinessRules275Test {

    private RoleRepository roleRepository;
    private PermissionRepository permissionRepository;
    private SystemMenuRepository systemMenuRepository;
    private UserRepository userRepository;
    private PermissionCacheService permissionCacheService;
    private AdminAuditLogRepository adminAuditLogRepository;
    private OrgUnitRepository orgUnitRepository;
    private OrgUnitCacheService orgUnitCacheService;

    private RoleService roleService;
    private UserService userService;
    private UserController userController;

    @BeforeEach
    void setUp() {
        roleRepository = mock(RoleRepository.class);
        permissionRepository = mock(PermissionRepository.class);
        systemMenuRepository = mock(SystemMenuRepository.class);
        userRepository = mock(UserRepository.class);
        permissionCacheService = mock(PermissionCacheService.class);
        adminAuditLogRepository = mock(AdminAuditLogRepository.class);
        orgUnitRepository = mock(OrgUnitRepository.class);

        roleService = new RoleService(roleRepository, permissionRepository, systemMenuRepository, userRepository, permissionCacheService, adminAuditLogRepository);
        orgUnitCacheService = mock(OrgUnitCacheService.class);
        userController = new UserController(userService, mock(UserPermissionService.class), adminAuditLogRepository, permissionCacheService, userRepository, orgUnitCacheService);
    }

    @Test
    void testBR275_03_systemRole_cannotBeDeleted_onlyDisabled() {
        UUID roleId = UUID.randomUUID();
        Role systemRole = new Role();
        systemRole.setId(roleId);
        systemRole.setCode("ROLE_SYSTEM_ADMIN");
        systemRole.setIsSystem(true);
        systemRole.setStatus(RoleStatus.ACTIVE);

        when(roleRepository.findById(roleId)).thenReturn(Optional.of(systemRole));
        when(roleRepository.save(any(Role.class))).thenAnswer(i -> i.getArgument(0));

        Role result = roleService.delete(roleId);

        // System role must NOT be soft deleted, status must be INACTIVE
        assertEquals(RoleStatus.INACTIVE, result.getStatus());
        assertNull(result.getDeletedAt());

        // Audit log must be saved
        verify(adminAuditLogRepository, times(1)).save(any());
    }

    @Test
    void testBR275_03_nonSystemRole_softDeleted() {
        UUID roleId = UUID.randomUUID();
        Role customRole = new Role();
        customRole.setId(roleId);
        customRole.setCode("ROLE_CUSTOM");
        customRole.setIsSystem(false);
        customRole.setStatus(RoleStatus.ACTIVE);

        when(roleRepository.findById(roleId)).thenReturn(Optional.of(customRole));
        when(roleRepository.save(any(Role.class))).thenAnswer(i -> i.getArgument(0));

        Role result = roleService.delete(roleId);

        assertEquals(RoleStatus.DELETED, result.getStatus());
        verify(adminAuditLogRepository, times(1)).save(any());
    }

    @Test
    void testBR275_06_revokeLastRole_clearsPermissionsAndIncrementsVersion() {
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setUsername("testuser");
        user.setPermissionVersion(1);

        Role role = new Role();
        role.setCode("ROLE_ADMIN");
        user.getRoles().add(role);

        UserService userServiceMock = mock(UserService.class);
        when(userServiceMock.findById(userId)).thenReturn(user);
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        UserController controller = new UserController(userServiceMock, mock(UserPermissionService.class), adminAuditLogRepository, permissionCacheService, userRepository, orgUnitCacheService);

        controller.revokeUserRole(userId, "ROLE_ADMIN");

        assertTrue(user.getRoles().isEmpty());
        assertEquals(2, user.getPermissionVersion());
        verify(permissionCacheService, times(1)).invalidateAndIncrementVersion(userId);
        verify(adminAuditLogRepository, times(1)).save(any());
    }
}
