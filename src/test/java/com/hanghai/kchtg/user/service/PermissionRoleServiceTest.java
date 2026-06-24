package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.user.entity.Permission;
import com.hanghai.kchtg.user.entity.Role;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.PermissionRepository;
import com.hanghai.kchtg.user.repository.RoleRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PermissionRoleServiceTest {

    @Mock
    private PermissionRepository permissionRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PermissionRoleService service;

    private Role adminRole;
    private Role userRole;
    private Permission testPermission;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "superAdminRoleCode", "SUPER_ADMIN");

        adminRole = new Role();
        adminRole.setId(UUID.randomUUID());
        adminRole.setCode("ADMIN");
        adminRole.setName("Admin");
        adminRole.setPermissions(new ArrayList<>(List.of("manhien:read", "manhien:write")));

        userRole = new Role();
        userRole.setId(UUID.randomUUID());
        userRole.setCode("USER");
        userRole.setName("User");
        userRole.setPermissions(new ArrayList<>(List.of("manhien:read")));

        testPermission = new Permission();
        testPermission.setId(UUID.randomUUID());
        testPermission.setCode("manhien:read");
        testPermission.setName("Xem mặt hàng");
        testPermission.setResource("manhien");
        testPermission.setAction("read");
    }

    // =========================================================================
    // Permission CRUD Tests
    // =========================================================================

    @Test
    void createPermission_shouldSucceedWithValidCode() {
        when(permissionRepository.existsByCode("baocao:export")).thenReturn(false);
        when(permissionRepository.save(any(Permission.class))).thenAnswer(inv -> inv.getArgument(0));

        Permission result = service.createPermission("baocao:export", "Xuất báo cáo", "Export reports", "baocao", "export");

        assertNotNull(result);
        assertEquals("baocao:export", result.getCode());
        assertEquals("baocao", result.getResource());
        assertEquals("export", result.getAction());
    }

    @Test
    void createPermission_shouldRejectInvalidCodeFormat() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.createPermission("INVALID_CODE", "Bad", null, "INVALID", "CODE"));
        assertTrue(ex.getMessage().contains("định dạng"));
    }

    @Test
    void createPermission_shouldRejectDuplicateCode() {
        when(permissionRepository.existsByCode("manhien:read")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.createPermission("manhien:read", "Dup", null, "manhien", "read"));
        assertTrue(ex.getMessage().contains("đã tồn tại"));
    }

    @Test
    void createPermission_shouldRejectNullCode() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.createPermission(null, "Null", null, null, null));
        assertTrue(ex.getMessage().contains("định dạng"));
    }

    @Test
    void updatePermission_shouldUpdateFields() {
        when(permissionRepository.findById(testPermission.getId())).thenReturn(Optional.of(testPermission));
        when(permissionRepository.save(any(Permission.class))).thenAnswer(inv -> inv.getArgument(0));

        Permission updated = service.updatePermission(testPermission.getId(),
                "Updated name", null, "baocao", "import");

        assertEquals("Updated name", updated.getName());
        assertEquals("baocao:import", updated.getCode());
        assertEquals("baocao", updated.getResource());
        assertEquals("import", updated.getAction());
    }

    @Test
    void updatePermission_shouldThrowWhenCodeAlreadyExists() {
        Permission perm = new Permission();
        perm.setId(UUID.randomUUID());
        perm.setCode("existing:code");

        when(permissionRepository.findById(any())).thenReturn(Optional.of(perm));
        when(permissionRepository.existsByCodeAndIdNot("baocao:export", perm.getId())).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.updatePermission(perm.getId(), "New", null, "baocao", "export"));
        assertTrue(ex.getMessage().contains("đã tồn tại"));
    }

    @Test
    void findById_shouldThrowWhenNotFound() {
        when(permissionRepository.findById(any())).thenReturn(Optional.empty());

        EntityNotFoundException ex = assertThrows(EntityNotFoundException.class,
                () -> service.findById(UUID.randomUUID()));
        assertTrue(ex.getMessage().contains("Không tìm thấy"));
    }

    @Test
    void findByCode_shouldReturnPermission() {
        when(permissionRepository.findByCode("manhien:read")).thenReturn(Optional.of(testPermission));

        Permission result = service.findByCode("manhien:read");
        assertNotNull(result);
        assertEquals("manhien:read", result.getCode());
    }

    @Test
    void deletePermission_shouldDeleteByCode() {
        when(permissionRepository.findByCode("manhien:read")).thenReturn(Optional.of(testPermission));

        service.deletePermission("manhien:read");

        verify(permissionRepository).deleteByCode("manhien:read");
    }

    // =========================================================================
    // Role -> Permission Assignment Tests
    // =========================================================================

    @Test
    void assignPermission_shouldAddCodeToRole() {
        when(roleRepository.save(any(Role.class))).thenAnswer(inv -> inv.getArgument(0));

        Role result = service.assignPermission(adminRole, testPermission);

        assertTrue(result.getPermissions().contains("manhien:read"));
    }

    @Test
    void assignPermission_shouldSkipIfAlreadyPresent() {
        when(roleRepository.save(any(Role.class))).thenAnswer(inv -> inv.getArgument(0));

        Permission newPermission = new Permission();
        newPermission.setCode("new:permission");
        newPermission.setResource("new");
        newPermission.setAction("permission");

        service.assignPermission(adminRole, newPermission);
        verify(roleRepository, times(1)).save(any());

        // Call again - should not duplicate
        service.assignPermission(adminRole, newPermission);
        verify(roleRepository, times(1)).save(any());
    }

    @Test
    void assignPermissionByCode_shouldValidateFormat() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.assignPermissionByCode(userRole, "INVALID"));
        assertTrue(ex.getMessage().contains("không hợp lệ"));
    }

    @Test
    void assignPermissions_shouldAddAllCodes() {
        when(roleRepository.save(any(Role.class))).thenAnswer(inv -> inv.getArgument(0));

        List<String> codes = List.of("manhien:read", "baocao:export", "quanly:admin");
        Role result = service.assignPermissions(userRole, codes);

        assertTrue(result.getPermissions().contains("manhien:read"));
        assertTrue(result.getPermissions().contains("baocao:export"));
        assertTrue(result.getPermissions().contains("quanly:admin"));
    }

    @Test
    void assignPermissions_shouldReturnEarlyWhenEmpty() {
        service.assignPermissions(userRole, Collections.emptyList());
        verify(roleRepository, never()).save(any());
    }

    @Test
    void getRolePermissions_shouldReturnImmutableSet() {
        Set<String> result = service.getRolePermissions(adminRole);
        assertEquals(2, result.size());
        assertInstanceOf(LinkedHashSet.class, result);

        // Mutating result should not affect the role
        result.add("should-fail");
        assertFalse(adminRole.getPermissions().contains("should-fail"));
    }

    @Test
    void getRolePermissions_shouldReturnEmptyForNullPermissions() {
        userRole.setPermissions(null);
        Set<String> result = service.getRolePermissions(userRole);
        assertTrue(result.isEmpty());
    }

    @Test
    void removePermission_shouldThrowWhenNotAssigned() {
        Permission unassignedPerm = new Permission();
        unassignedPerm.setCode("manhien:write");
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.removePermission(userRole, unassignedPerm));
        assertTrue(ex.getMessage().contains("không được gán"));
    }

    // =========================================================================
    // Permission Evaluation Tests
    // =========================================================================

    @Test
    void isSuperAdmin_shouldReturnTrueForSUPER_ADMIN() {
        assertTrue(service.isSuperAdmin("SUPER_ADMIN"));
    }

    @Test
    void isSuperAdmin_shouldReturnTrueForSYSTEM_ADMIN() {
        assertTrue(service.isSuperAdmin("SYSTEM_ADMIN"));
    }

    @Test
    void isSuperAdmin_shouldReturnTrueWithRolePrefix() {
        assertTrue(service.isSuperAdmin("ROLE_SUPER_ADMIN"));
        assertTrue(service.isSuperAdmin("ROLE_SYSTEM_ADMIN"));
    }

    @Test
    void isSuperAdmin_shouldReturnFalseForOtherRoles() {
        assertFalse(service.isSuperAdmin("ADMIN"));
        assertFalse(service.isSuperAdmin("MANAGER"));
        assertFalse(service.isSuperAdmin("USER"));
    }

    @Test
    void isSuperAdmin_shouldReturnFalseForNull() {
        assertFalse(service.isSuperAdmin((String) null));
        assertFalse(service.isSuperAdmin((Role) null));
    }

    @Test
    void roleHasPermission_shouldReturnTrueForExactMatch() {
        assertTrue(service.roleHasPermission(adminRole, "manhien:read"));
        assertTrue(service.roleHasPermission(adminRole, "manhien:write"));
    }

    @Test
    void roleHasPermission_shouldReturnFalseWhenNotAssigned() {
        assertFalse(service.roleHasPermission(userRole, "baocao:export"));
    }

    @Test
    void roleHasPermission_shouldBypassForSuperAdmin() {
        Role superRole = new Role();
        superRole.setCode("SUPER_ADMIN");
        superRole.setPermissions(new ArrayList<>());

        assertTrue(service.roleHasPermission(superRole, "any:permission"));
    }

    @Test
    void checkPermission_shouldReturnTrueForExactMatch() {
        User user = new User();
        user.setRole("ADMIN");
        when(userRepository.findByUsername("admin1")).thenReturn(Optional.of(user));
        when(roleRepository.findByCode("ADMIN")).thenReturn(Optional.of(adminRole));

        assertTrue(service.checkPermission("admin1", "manhien", "read"));
    }

    @Test
    void checkPermission_shouldReturnTrueForWildcard() {
        Role role = new Role();
        role.setCode("MANAGER");
        role.setPermissions(new ArrayList<>(List.of("baocao:*")));

        User user = new User();
        user.setRole("MANAGER");
        when(userRepository.findByUsername("mgr1")).thenReturn(Optional.of(user));
        when(roleRepository.findByCode("MANAGER")).thenReturn(Optional.of(role));

        assertTrue(service.checkPermission("mgr1", "baocao", "export"));
        assertTrue(service.checkPermission("mgr1", "baocao", "any_action"));
    }

    @Test
    void checkPermission_shouldReturnFalseForUnknownUser() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());
        assertFalse(service.checkPermission("ghost", "manhien", "read"));
    }

    @Test
    void checkPermission_shouldReturnFalseForNullArgs() {
        assertFalse(service.checkPermission(null, "manhien", "read"));
        assertFalse(service.checkPermission("user", null, "read"));
        assertFalse(service.checkPermission("user", "manhien", null));
    }

    @Test
    void checkAnyPermission_shouldReturnTrueIfAnyMatch() {
        Role role = new Role();
        role.setCode("USER");
        role.setPermissions(new ArrayList<>(List.of("manhien:read", "baocao:export")));

        User user = new User();
        user.setRole("USER");
        when(userRepository.findByUsername("u1")).thenReturn(Optional.of(user));
        when(roleRepository.findByCode("USER")).thenReturn(Optional.of(role));

        assertTrue(service.checkAnyPermission("u1", "manhien:read", "nonexistent:action"));
    }

    @Test
    void checkAnyPermission_shouldReturnFalseIfNoneMatch() {
        User user = new User();
        user.setRole("USER");
        when(userRepository.findByUsername("u1")).thenReturn(Optional.of(user));
        when(roleRepository.findByCode("USER")).thenReturn(Optional.of(userRole));

        assertFalse(service.checkAnyPermission("u1", "nonexistent:read", "nonexistent:write"));
    }

    @Test
    void checkAllPermissions_shouldReturnTrueIfAllMatch() {
        Role role = new Role();
        role.setCode("ADMIN");
        role.setPermissions(new ArrayList<>(List.of("manhien:read", "baocao:export")));

        User user = new User();
        user.setRole("ADMIN");
        when(userRepository.findByUsername("a1")).thenReturn(Optional.of(user));
        when(roleRepository.findByCode("ADMIN")).thenReturn(Optional.of(role));

        assertTrue(service.checkAllPermissions("a1", "manhien:read", "baocao:export"));
    }

    @Test
    void checkAllPermissions_shouldReturnFalseIfOneMissing() {
        User user = new User();
        user.setRole("USER");
        when(userRepository.findByUsername("u1")).thenReturn(Optional.of(user));
        when(roleRepository.findByCode("USER")).thenReturn(Optional.of(userRole));

        assertFalse(service.checkAllPermissions("u1", "manhien:read", "baocao:export"));
    }

    // =========================================================================
    // Bulk Operations Tests
    // =========================================================================

    @Test
    void setRolePermissions_shouldReplaceAll() {
        when(roleRepository.save(any(Role.class))).thenAnswer(inv -> inv.getArgument(0));

        Role role = new Role();
        role.setCode("TEST");
        role.setPermissions(new ArrayList<>(List.of("old:perm")));
        List<String> newPerms = List.of("new:read", "new:write");

        Role result = service.setRolePermissions(role, newPerms);

        assertEquals(2, result.getPermissions().size());
        assertTrue(result.getPermissions().contains("new:read"));
        assertFalse(result.getPermissions().contains("old:perm"));
    }

    @Test
    void setRolePermissions_shouldThrowForNullRole() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.setRolePermissions(null, List.of("a:b")));
        assertTrue(ex.getMessage().contains("null"));
    }

    @Test
    void clonePermissionsToRole_shouldCopyPerms() {
        when(roleRepository.save(any(Role.class))).thenAnswer(inv -> inv.getArgument(0));

        Role target = new Role();
        target.setCode("TARGET");
        target.setPermissions(new ArrayList<>());

        Role result = service.clonePermissionsToRole(adminRole, target);

        assertEquals(2, result.getPermissions().size());
        assertTrue(result.getPermissions().containsAll(adminRole.getPermissions()));
    }
}
