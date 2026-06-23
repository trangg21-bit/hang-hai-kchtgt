package com.hanghai.kchtg.user;

import com.hanghai.kchtg.user.dto.CreateRoleRequest;
import com.hanghai.kchtg.user.dto.UpdateRoleRequest;
import com.hanghai.kchtg.user.entity.Role;
import com.hanghai.kchtg.user.entity.RoleStatus;
import com.hanghai.kchtg.user.repository.RoleRepository;
import com.hanghai.kchtg.user.service.RoleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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
    private UUID testRoleId;

    @BeforeEach
    void setUp() {
        testRoleId = UUID.randomUUID();
        testRole = new Role();
        testRole.setId(testRoleId);
        testRole.setName("Admin");
        testRole.setCode("ADMIN");
        testRole.setDescription("Administrator role");
        testRole.setPermissions(List.of("user.view", "user.create"));
        testRole.setStatus(RoleStatus.ACTIVE);
    }

    @Nested
    @DisplayName("Create Role")
    class CreateTests {

        @Test
        @DisplayName("Should create role successfully")
        void createRole_success() {
            CreateRoleRequest request = new CreateRoleRequest();
            request.setName("Manager");
            request.setCode("MANAGER");
            request.setDescription("Manager role");
            request.setPermissions(List.of("user.view"));

            when(roleRepository.existsByCode("MANAGER")).thenReturn(false);
            when(roleRepository.save(any(Role.class))).thenReturn(testRole);

            Role result = roleService.create(request);

            assertNotNull(result);
            assertEquals("ADMIN", result.getCode()); // returns testRole mock
            verify(roleRepository).save(any(Role.class));
        }

        @Test
        @DisplayName("Should throw when role code already exists")
        void createDuplicateCode_throwsException() {
            CreateRoleRequest request = new CreateRoleRequest();
            request.setName("Manager");
            request.setCode("ADMIN");

            when(roleRepository.existsByCode("ADMIN")).thenReturn(true);

            assertThrows(IllegalArgumentException.class, () -> roleService.create(request));
            verify(roleRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Read Roles")
    class ReadTests {

        @Test
        @DisplayName("Should find role by ID")
        void findById_success() {
            when(roleRepository.findById(testRoleId)).thenReturn(Optional.of(testRole));

            Role result = roleService.findById(testRoleId);
            assertNotNull(result);
            assertEquals(testRoleId, result.getId());
        }

        @Test
        @DisplayName("Should return all roles")
        void findAll_success() {
            when(roleRepository.findAll()).thenReturn(List.of(testRole));

            assertEquals(1, roleService.findAll().size());
        }

        @Test
        @DisplayName("Should find role by code")
        void findByCode_success() {
            when(roleRepository.findByCode("ADMIN")).thenReturn(Optional.of(testRole));

            Role result = roleService.findByCode("ADMIN");
            assertNotNull(result);
            assertEquals("ADMIN", result.getCode());
        }

        @Test
        @DisplayName("Should return active roles")
        void findActiveRoles_success() {
            when(roleRepository.findByStatus(RoleStatus.ACTIVE)).thenReturn(List.of(testRole));

            List<Role> result = roleService.findActiveRoles();
            assertEquals(1, result.size());
        }
    }

    @Nested
    @DisplayName("Update Role")
    class UpdateTests {

        @Test
        @DisplayName("Should update role details")
        void updateRole_success() {
            UpdateRoleRequest request = new UpdateRoleRequest();
            request.setName("New Name");
            request.setCode("ADMIN_NEW");

            when(roleRepository.findById(testRoleId)).thenReturn(Optional.of(testRole));
            when(roleRepository.existsByCodeAndIdNot("ADMIN_NEW", testRoleId)).thenReturn(false);
            when(roleRepository.save(any(Role.class))).thenReturn(testRole);

            Role result = roleService.update(testRoleId, request);

            assertNotNull(result);
            verify(roleRepository).save(any(Role.class));
        }
    }

    @Nested
    @DisplayName("Delete Role")
    class DeleteTests {

        @Test
        @DisplayName("Should delete role (soft delete)")
        void deleteRole_success() {
            when(roleRepository.findById(testRoleId)).thenReturn(Optional.of(testRole));
            when(roleRepository.save(any(Role.class))).thenReturn(testRole);

            Role result = roleService.delete(testRoleId);

            assertEquals(RoleStatus.DELETED, testRole.getStatus());
            assertNotNull(testRole.getDeletedAt());
            verify(roleRepository).save(testRole);
        }
    }
}
