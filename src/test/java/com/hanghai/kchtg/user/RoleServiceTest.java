package com.hanghai.kchtg.user;

import com.hanghai.kchtg.user.entity.Role;
import com.hanghai.kchtg.user.entity.RoleStatus;
import com.hanghai.kchtg.user.repository.RoleRepository;
import com.hanghai.kchtg.user.service.RoleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoleServiceTest {

    @Mock
    private RoleRepository roleRepository;

    @InjectMocks
    private RoleService roleService;

    private Role testRole;

    @BeforeEach
    void setUp() {
        testRole = new Role();
        testRole.setId(1L);
        testRole.setName("Admin");
        testRole.setCode("ADMIN");
        testRole.setDescription("Administrator role");
        testRole.setPermissions("{\"users\":\"RW\",\"roles\":\"R\",\"orgs\":\"R\"}");
        testRole.setStatus(RoleStatus.ACTIVE);
        testRole.setIsSystem(true);
    }

    // ==================== CREATE ROLE TESTS ====================

    @Test
    void createRole_shouldReturnRole() {
        // Arrange
        var request = new com.hanghai.kchtg.user.dto.CreateRoleRequest();
        request.setName("Manager");
        request.setCode("MANAGER");
        request.setDescription("Manager role");
        request.setPermissions("{\"users\":\"R\",\"roles\":\"R\",\"orgs\":\"RW\"}");

        when(roleRepository.existsByName("Manager")).thenReturn(false);
        when(roleRepository.existsByCode("MANAGER")).thenReturn(false);
        when(roleRepository.save(any(Role.class))).thenReturn(testRole);

        // Act
        Role result = roleService.createRole(request);

        // Assert
        assertNotNull(result);
        assertEquals("Manager", result.getName());
        assertEquals("MANAGER", result.getCode());
        verify(roleRepository).save(any(Role.class));
    }

    @Test
    void createRole_shouldThrowWhenNameExists() {
        // Arrange
        var request = new com.hanghai.kchtg.user.dto.CreateRoleRequest();
        request.setName("Admin");
        request.setCode("ADMIN");

        when(roleRepository.existsByName("Admin")).thenReturn(true);

        // Act & Assert
        assertThrows(RuntimeException.class, () -> roleService.createRole(request));
        verify(roleRepository, never()).save(any());
    }

    @Test
    void createRole_shouldThrowWhenCodeExists() {
        // Arrange
        var request = new com.hanghai.kchtg.user.dto.CreateRoleRequest();
        request.setName("Manager");
        request.setCode("ADMIN");

        when(roleRepository.existsByName("Manager")).thenReturn(false);
        when(roleRepository.existsByCode("ADMIN")).thenReturn(true);

        // Act & Assert
        assertThrows(RuntimeException.class, () -> roleService.createRole(request));
    }

    // ==================== READ ROLE TESTS ====================

    @Test
    void getRoleById_shouldReturnRole() {
        when(roleRepository.findById(1L)).thenReturn(Optional.of(testRole));

        Role result = roleService.getRoleById(1L);

        assertNotNull(result);
        assertEquals("Admin", result.getName());
        verify(roleRepository).findById(1L);
    }

    @Test
    void getRoleById_shouldThrowWhenNotFound() {
        when(roleRepository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> roleService.getRoleById(999L));
    }

    @Test
    void listRoles_shouldReturnAllRoles() {
        List<Role> roles = List.of(testRole);
        when(roleRepository.findAllByIsSystemFalse()).thenReturn(roles);

        Page<Role> result = roleService.listRoles(PageRequest.of(0, 20));

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }

    // ==================== UPDATE ROLE TESTS ====================

    @Test
    void updateRole_shouldChangeName() {
        Role existing = new Role(testRole);
        existing.setName("Admin");
        existing.setCode("ADMIN");

        var request = new com.hanghai.kchtg.user.dto.UpdateRoleRequest();
        request.setName("System Admin");
        request.setDescription("System administrator");

        when(roleRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(roleRepository.existsByNameIgnoringId("System Admin", 1L)).thenReturn(false);
        when(roleRepository.save(any(Role.class))).thenReturn(existing);

        Role result = roleService.updateRole(1L, request);

        assertEquals("System Admin", result.getName());
        verify(roleRepository).save(existing);
    }

    // ==================== DELETE ROLE TESTS ====================

    @Test
    void deleteRole_shouldThrowForSystemRole() {
        when(roleRepository.findById(1L)).thenReturn(Optional.of(testRole));
        testRole.setIsSystem(true);

        assertThrows(RuntimeException.class, () -> roleService.deleteRole(1L));
        verify(roleRepository, never()).deleteById(any());
    }

    @Test
    void deleteRole_shouldSoftDeleteNonSystemRole() {
        Role existing = new Role(testRole);
        existing.setId(1L);
        existing.setName("Custom");
        existing.setCode("CUSTOM");
        existing.setIsSystem(false);

        when(roleRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(roleRepository.save(any(Role.class))).thenReturn(existing);

        roleService.deleteRole(1L);

        assertNotNull(existing.getDeletedAt());
    }

    // ==================== PERMISSION TESTS ====================

    @Test
    void getRolePermissions_shouldReturnMap() {
        when(roleRepository.findById(1L)).thenReturn(Optional.of(testRole));

        Map<String, String> permissions = roleService.getRolePermissions(1L);

        assertNotNull(permissions);
        assertEquals("RW", permissions.get("users"));
        assertEquals("R", permissions.get("roles"));
    }

    @Test
    void getRolePermissions_shouldReturnEmptyWhenNoPermissions() {
        testRole.setPermissions("{}");
        when(roleRepository.findById(1L)).thenReturn(Optional.of(testRole));

        Map<String, String> permissions = roleService.getRolePermissions(1L);

        assertNotNull(permissions);
        assertTrue(permissions.isEmpty());
    }
}
