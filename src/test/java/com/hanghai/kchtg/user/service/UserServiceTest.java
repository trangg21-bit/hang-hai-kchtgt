package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.group.repository.GroupRepository;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.security.service.PermissionCacheService;
import com.hanghai.kchtg.user.dto.CreateUserRequest;
import com.hanghai.kchtg.user.entity.Role;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.repository.RoleRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private OrgUnitRepository orgUnitRepository;
    @Mock private GroupRepository groupRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private PasswordPolicyValidator passwordPolicyValidator;
    @Mock private PermissionCacheService permissionCacheService;
    @Mock private Authentication authentication;
    @Mock private SecurityContext securityContext;

    private UserService userService;

    private MockedStatic<SecurityContextHolder> securityContextHolderMock;
    private Role systemAdminRole;
    private Role userRole;
    private User systemAdminUser;
    private User regularUser;

    @BeforeEach
    void setUp() {
        userService = new UserService(
                userRepository, roleRepository, orgUnitRepository, groupRepository,
                passwordEncoder, passwordPolicyValidator, permissionCacheService);

        securityContextHolderMock = mockStatic(SecurityContextHolder.class);

        // Setup roles
        systemAdminRole = new Role();
        systemAdminRole.setCode("ROLE_SYSTEM_ADMIN");
        systemAdminRole.setName("System Admin");

        userRole = new Role();
        userRole.setCode("ROLE_USER");
        userRole.setName("User");

        // Setup users
        systemAdminUser = new User();
        systemAdminUser.setId(UUID.randomUUID());
        systemAdminUser.setUsername("sysadmin");
        systemAdminUser.setRoles(new HashSet<>(Set.of(systemAdminRole)));

        regularUser = new User();
        regularUser.setId(UUID.randomUUID());
        regularUser.setUsername("regular");
        regularUser.setRoles(new HashSet<>(Set.of(userRole)));
    }

    @AfterEach
    void tearDown() {
        if (securityContextHolderMock != null) {
            securityContextHolderMock.close();
        }
    }

    // =========================================================================
    // BR-001-04: Create guard
    // =========================================================================

    @Test
    void create_shouldDenyWhenNonSystemAdminCreatesSystemAdmin() {
        // Given: current user is admin but NOT system-admin
        mockCurrentUserAuthorities("ROLE_ADMIN");

        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("newadmin");
        request.setPassword("SecurePass1");
        request.setEmail("newadmin@test.com");
        request.setFullName("New Admin");
        request.setRole("ROLE_SYSTEM_ADMIN");

        when(userRepository.existsByUsername("newadmin")).thenReturn(false);
        when(userRepository.existsByEmail("newadmin@test.com")).thenReturn(false);
        doNothing().when(passwordPolicyValidator).validate("SecurePass1");
        when(roleRepository.findByCode("ROLE_SYSTEM_ADMIN")).thenReturn(Optional.of(systemAdminRole));

        // When/Then: should throw AccessDeniedException
        AccessDeniedException ex = assertThrows(AccessDeniedException.class,
                () -> userService.create(request));
        assertTrue(ex.getMessage().contains("System Admin"));

        // Verify: user was never saved
        verify(userRepository, never()).save(any());
    }

    @Test
    void create_shouldAllowWhenSystemAdminCreatesSystemAdmin() {
        // Given: current user IS system-admin
        mockCurrentUserAuthorities("ROLE_SYSTEM_ADMIN");

        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("newadmin");
        request.setPassword("SecurePass1");
        request.setEmail("newadmin@test.com");
        request.setFullName("New Admin");
        request.setRole("ROLE_SYSTEM_ADMIN");

        when(userRepository.existsByUsername("newadmin")).thenReturn(false);
        when(userRepository.existsByEmail("newadmin@test.com")).thenReturn(false);
        doNothing().when(passwordPolicyValidator).validate("SecurePass1");
        when(roleRepository.findByCode("ROLE_SYSTEM_ADMIN")).thenReturn(Optional.of(systemAdminRole));
        when(passwordEncoder.encode("SecurePass1")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        // When: create should succeed
        User result = userService.create(request);

        // Then
        assertNotNull(result);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void create_shouldAllowAdminToCreateRegularUser() {
        // Given: current user is regular admin (not system-admin)
        mockCurrentUserAuthorities("ROLE_ADMIN");

        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("regularuser");
        request.setPassword("SecurePass1");
        request.setEmail("regular@test.com");
        request.setFullName("Regular User");
        request.setRole("ROLE_USER");

        when(userRepository.existsByUsername("regularuser")).thenReturn(false);
        when(userRepository.existsByEmail("regular@test.com")).thenReturn(false);
        doNothing().when(passwordPolicyValidator).validate("SecurePass1");
        when(roleRepository.findByCode("ROLE_USER")).thenReturn(Optional.of(userRole));
        when(passwordEncoder.encode("SecurePass1")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        // When: create should succeed — only system-admin creation is restricted
        User result = userService.create(request);

        // Then
        assertNotNull(result);
        verify(userRepository).save(any(User.class));
    }

    // =========================================================================
    // BR-001-04: Delete guard
    // =========================================================================

    @Test
    void delete_shouldDenyWhenNonSystemAdminDeletesSystemAdmin() {
        // Given: current user is admin but NOT system-admin
        mockCurrentUserAuthorities("ROLE_ADMIN");

        // Target user IS system-admin
        when(userRepository.findById(systemAdminUser.getId())).thenReturn(Optional.of(systemAdminUser));

        // When/Then: should throw AccessDeniedException
        AccessDeniedException ex = assertThrows(AccessDeniedException.class,
                () -> userService.delete(systemAdminUser.getId()));
        assertTrue(ex.getMessage().contains("System Admin"));

        // Verify: softDelete was never called
        verify(userRepository, never()).save(any());
    }

    @Test
    void delete_shouldAllowWhenSystemAdminDeletesSystemAdmin() {
        // Given: current user IS system-admin
        mockCurrentUserAuthorities("ROLE_SYSTEM_ADMIN");

        // Target user is also system-admin
        when(userRepository.findById(systemAdminUser.getId())).thenReturn(Optional.of(systemAdminUser));
        when(userRepository.save(any(User.class))).thenReturn(systemAdminUser);

        // When: delete should succeed
        assertDoesNotThrow(() -> userService.delete(systemAdminUser.getId()));

        // Then
        assertEquals(UserStatus.DELETED, systemAdminUser.getStatus());
    }

    @Test
    void delete_shouldAllowAdminToDeleteRegularUser() {
        // Given: current user is regular admin (not system-admin)
        mockCurrentUserAuthorities("ROLE_ADMIN");

        // Target user is a regular user (not system-admin)
        when(userRepository.findById(regularUser.getId())).thenReturn(Optional.of(regularUser));
        when(userRepository.save(any(User.class))).thenReturn(regularUser);

        // When: delete should succeed — only system-admin deletion is restricted
        assertDoesNotThrow(() -> userService.delete(regularUser.getId()));

        // Then
        assertEquals(UserStatus.DELETED, regularUser.getStatus());
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private void mockCurrentUserAuthorities(String... authorities) {
        List<SimpleGrantedAuthority> grantedAuthorities = Arrays.stream(authorities)
                .map(SimpleGrantedAuthority::new)
                .toList();

        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getAuthorities())
                .thenReturn((java.util.Collection) grantedAuthorities);
        securityContextHolderMock.when(SecurityContextHolder::getContext)
                .thenReturn(securityContext);
    }
}
