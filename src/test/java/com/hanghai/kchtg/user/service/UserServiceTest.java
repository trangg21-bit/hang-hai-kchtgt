package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.group.repository.GroupRepository;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.security.service.PermissionCacheService;
import com.hanghai.kchtg.password.repository.PasswordHistoryRepository;
import com.hanghai.kchtg.user.dto.CreateUserRequest;
import com.hanghai.kchtg.user.dto.UpdateUserRequest;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.user.repository.UserStatusLogRepository;
import jakarta.persistence.EntityManager;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
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

    private User systemAdminUser;
    private User regularUser;

    @BeforeEach
    void setUp() {
        userService = new UserService(
                userRepository, orgUnitRepository, groupRepository,
                passwordEncoder, passwordPolicyValidator, permissionCacheService,
                passwordHistoryRepository, userStatusLogRepository, entityManager, orgUnitCacheService);


        // Setup users
        systemAdminUser = new User();
        systemAdminUser.setId(UUID.randomUUID());
        systemAdminUser.setUsername("sysadmin");

        regularUser = new User();
        regularUser.setId(UUID.randomUUID());
        regularUser.setUsername("regular");
        regularUser.setStatus(UserStatus.ACTIVE);

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
    void create_shouldAllowAdminToCreateUserWithDirectPermissions() {
        mockCurrentUserAuthorities("admin:manage");

        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("newadmin");
        request.setPassword("SecurePass1");
        request.setEmail("newadmin@test.com");
        request.setFullName("New Admin");
        request.setPermissionCodes(List.of("user:read"));

        when(userRepository.existsByUsername("newadmin")).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCaseAndDeletedAtIsNull("newadmin@test.com")).thenReturn(false);
        doNothing().when(passwordPolicyValidator).validate("SecurePass1");
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
        mockCurrentUserAuthorities("admin:manage");

        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("regularuser");
        request.setPassword("SecurePass1");
        request.setEmail("regular@test.com");
        request.setFullName("Regular User");
        request.setPermissionCodes(List.of("user:read"));

        when(userRepository.existsByUsername("regularuser")).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCaseAndDeletedAtIsNull("regular@test.com")).thenReturn(false);
        doNothing().when(passwordPolicyValidator).validate("SecurePass1");
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
    void create_shouldPersistRequestStatusInsteadOfHardcodedActive() {
        // Given: the create form chose status INACTIVE (BR-001-19 / AC-001-12)
        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("statususer");
        request.setPassword("SecurePass1");
        request.setEmail("statususer@test.com");
        request.setFullName("Status User");
        request.setStatus(UserStatus.INACTIVE);

        when(userRepository.existsByUsername("statususer")).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCaseAndDeletedAtIsNull("statususer@test.com")).thenReturn(false);
        doNothing().when(passwordPolicyValidator).validate("SecurePass1");
        when(passwordEncoder.encode("SecurePass1")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        // When
        User result = userService.create(request);

        // Then: the persisted entity carries the form-chosen status, not a hardcoded ACTIVE
        ArgumentCaptor<User> savedCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(savedCaptor.capture());
        assertEquals(UserStatus.INACTIVE, savedCaptor.getValue().getStatus());
        assertEquals(UserStatus.INACTIVE, result.getStatus());
    }

    @Test
    void createUserRequest_shouldRejectNullStatusByBeanValidation() {
        // Given: request without status (BR-001-19 / AC-001-16)
        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("nostatus");
        request.setPassword("SecurePass1");
        request.setEmail("nostatus@test.com");
        // status intentionally left null

        // When/Then: @NotNull on status rejects with the required message
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            Set<ConstraintViolation<CreateUserRequest>> violations = factory.getValidator().validate(request);
            assertTrue(violations.stream().anyMatch(v ->
                    "status".equals(v.getPropertyPath().toString())
                            && "Vui lòng chọn trạng thái".equals(v.getMessage())));
        }
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
    void delete_shouldAllowWhenSystemAdminDeletesSystemAdmin() {
        mockCurrentUserAuthorities("admin:manage");

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
        mockCurrentUserAuthorities("admin:manage");

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
