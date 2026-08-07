package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.group.repository.GroupRepository;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.security.service.PermissionCacheService;
import com.hanghai.kchtg.password.repository.PasswordHistoryRepository;
import com.hanghai.kchtg.user.dto.CreateUserRequest;
import com.hanghai.kchtg.user.dto.UpdateUserRequest;
import com.hanghai.kchtg.user.entity.Role;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.repository.RoleRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.user.repository.UserStatusLogRepository;
import jakarta.persistence.EntityManager;
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
    @Mock private PasswordHistoryRepository passwordHistoryRepository;
    @Mock private UserStatusLogRepository userStatusLogRepository;
    @Mock private EntityManager entityManager;
    @Mock private com.hanghai.kchtg.orgunit.service.OrgUnitCacheService orgUnitCacheService;
    @Mock private Authentication authentication;
    @Mock private SecurityContext securityContext;

    private UserService userService;

    private Role systemAdminRole;
    private Role userRole;
    private User systemAdminUser;
    private User regularUser;

    @BeforeEach
    void setUp() {
        userService = new UserService(
                userRepository, roleRepository, orgUnitRepository, groupRepository,
                passwordEncoder, passwordPolicyValidator, permissionCacheService,
                passwordHistoryRepository, userStatusLogRepository, entityManager, orgUnitCacheService);


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
        regularUser.setStatus(UserStatus.ACTIVE);
        regularUser.setRoles(new HashSet<>(Set.of(userRole)));

        jakarta.persistence.Query mockQuery = mock(jakarta.persistence.Query.class);
        lenient().when(mockQuery.getResultList()).thenReturn(Collections.emptyList());
        lenient().when(mockQuery.setParameter(anyString(), any())).thenReturn(mockQuery);
        lenient().when(mockQuery.getSingleResult()).thenReturn(0L);
        lenient().when(entityManager.createNativeQuery(anyString())).thenReturn(mockQuery);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
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
        when(userRepository.existsByEmailIgnoreCaseAndDeletedAtIsNull("newadmin@test.com")).thenReturn(false);
        doNothing().when(passwordPolicyValidator).validate("SecurePass1");

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
        when(userRepository.existsByEmailIgnoreCaseAndDeletedAtIsNull("newadmin@test.com")).thenReturn(false);
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
        when(userRepository.existsByEmailIgnoreCaseAndDeletedAtIsNull("regular@test.com")).thenReturn(false);
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

    @Test
    void create_shouldRejectEmailThatDiffersOnlyByCase() {
        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("anotheruser");
        request.setPassword("SecurePass1");
        request.setEmail("Loan@Gmail.com");
        request.setFullName("Another User");

        when(userRepository.existsByUsername("anotheruser")).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCaseAndDeletedAtIsNull("loan@gmail.com")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userService.create(request));

        assertEquals("Email đã tồn tại: loan@gmail.com", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void create_shouldThrowWhenUsernameExists() {
        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("existinguser");
        request.setPassword("SecurePass1");
        request.setEmail("newemail@test.com");

        when(userRepository.existsByUsername("existinguser")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userService.create(request));

        assertTrue(ex.getMessage().contains("Tên đăng nhập đã tồn tại"));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void update_shouldThrowWhenUserNotFound() {
        UUID nonExistentId = UUID.randomUUID();
        UpdateUserRequest request = new UpdateUserRequest();
        request.setFullName("Updated Name");

        when(userRepository.findByIdWithRelations(nonExistentId)).thenReturn(Optional.empty());

        assertThrows(jakarta.persistence.EntityNotFoundException.class,
                () -> userService.update(nonExistentId, request));
    }

    @Test
    void update_shouldChangeStatusAndWriteStatusAuditLog() {
        UpdateUserRequest request = new UpdateUserRequest();
        request.setStatus(UserStatus.INACTIVE);
        when(userRepository.findByIdWithRelations(regularUser.getId())).thenReturn(Optional.of(regularUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = userService.update(regularUser.getId(), request);

        assertEquals(UserStatus.INACTIVE, result.getStatus());
        verify(userStatusLogRepository).save(argThat(logEntry ->
                logEntry.getOldStatus() == UserStatus.ACTIVE
                        && logEntry.getNewStatus() == UserStatus.INACTIVE));
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

        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        lenient().when(authentication.getAuthorities())
                .thenReturn((java.util.Collection) grantedAuthorities);
        SecurityContextHolder.setContext(securityContext);
    }
}
