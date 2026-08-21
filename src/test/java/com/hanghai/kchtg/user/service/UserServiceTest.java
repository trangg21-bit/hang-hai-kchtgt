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
    @Mock private com.hanghai.kchtg.orgunit.service.OrgUnitScopeService orgUnitScopeService;
    @Mock private UserPermissionService userPermissionService;
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
                passwordHistoryRepository, userStatusLogRepository, entityManager,
                orgUnitCacheService, orgUnitScopeService, userPermissionService);


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
    // BR-003: Delete guard — System-Admin protection
    // =========================================================================

    @Test
    void delete_shouldAllowWhenSystemAdminDeletesSystemAdmin() {
        // Given: current user is system-admin
        mockCurrentUserAuthorities("ROLE_SYSTEM_ADMIN");

        // Target user is a system-admin
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

    @Test
    void updateMyProfile_shouldRejectPrivilegeEscalation_whenGroupIdsSupplied() {
        mockCurrentUserAuthorities("user:update", "admin:manage");
        when(authentication.getName()).thenReturn("regular");
        when(userRepository.findByUsernameWithRelations("regular")).thenReturn(Optional.of(regularUser));

        UpdateUserRequest request = new UpdateUserRequest();
        request.setGroupIds(List.of(UUID.randomUUID()));

        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> userService.updateMyProfile(request));
    }

    @Test
    void updateMyProfile_shouldRejectPrivilegeEscalation_whenOrgUnitSupplied() {
        mockCurrentUserAuthorities("user:update", "admin:manage");
        when(authentication.getName()).thenReturn("regular");
        when(userRepository.findByUsernameWithRelations("regular")).thenReturn(Optional.of(regularUser));

        UpdateUserRequest request = new UpdateUserRequest();
        request.setOrgUnitId(UUID.randomUUID());

        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> userService.updateMyProfile(request));
    }

    @Test
    void updateMyProfile_shouldAllowUpdatingSelfPersonalInformation() {
        mockCurrentUserAuthorities("user:update");
        when(authentication.getName()).thenReturn("regular");
        when(userRepository.findByUsernameWithRelations("regular")).thenReturn(Optional.of(regularUser));
        when(userRepository.save(any(User.class))).thenReturn(regularUser);

        UpdateUserRequest request = new UpdateUserRequest();
        request.setFullName("Updated Full Name");
        request.setPhone("0987654321");
        request.setAddress("New Address");

        com.hanghai.kchtg.user.dto.UserResponse response = userService.updateMyProfile(request);

        assertNotNull(response);
        assertEquals("Updated Full Name", regularUser.getFullName());
        assertEquals("0987654321", regularUser.getPhone());
        assertEquals("New Address", regularUser.getAddress());
        verify(permissionCacheService).invalidateCache(regularUser.getId());
    }

    @Test
    void create_shouldRejectGroupAssignment_withoutGroupManagePermission() {
        mockCurrentUserAuthorities("user:create");

        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("newuser");
        request.setEmail("newuser@example.com");
        request.setPassword("Secure@123");
        request.setGroupIds(List.of(UUID.randomUUID()));

        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> userService.create(request));
    }

    @Test
    void create_shouldReject_whenOrgUnitOutsideScope() {
        mockCurrentUserAuthorities("user:create");
        UUID outsideOrgUnitId = UUID.randomUUID();

        when(orgUnitScopeService.currentUserScope())
                .thenReturn(com.hanghai.kchtg.orgunit.service.OrgUnitScopeService.Scope.restricted(List.of(UUID.randomUUID())));

        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("scopeuser");
        request.setEmail("scopeuser@example.com");
        request.setPassword("Secure@123");
        request.setOrgUnitId(outsideOrgUnitId);

        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> userService.create(request));
    }

    @Test
    void update_shouldReject_whenTargetUserOutsideOrgUnitScope() {
        mockCurrentUserAuthorities("user:update");
        UUID targetOrgUnitId = UUID.randomUUID();
        com.hanghai.kchtg.orgunit.entity.OrgUnit targetOrgUnit = new com.hanghai.kchtg.orgunit.entity.OrgUnit();
        targetOrgUnit.setId(targetOrgUnitId);
        regularUser.setOrgUnit(targetOrgUnit);

        when(userRepository.findByIdWithRelations(regularUser.getId())).thenReturn(Optional.of(regularUser));
        when(orgUnitScopeService.currentUserScope())
                .thenReturn(com.hanghai.kchtg.orgunit.service.OrgUnitScopeService.Scope.restricted(List.of(UUID.randomUUID())));

        UpdateUserRequest request = new UpdateUserRequest();
        request.setFullName("Unauthorized update");

        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> userService.update(regularUser.getId(), request));
    }

    @Test
    void update_shouldReject_whenTargetOrgUnitOutsideOrgUnitScope() {
        mockCurrentUserAuthorities("user:update");
        UUID allowedOrgUnitId = UUID.randomUUID();
        UUID targetNewOrgUnitId = UUID.randomUUID();

        com.hanghai.kchtg.orgunit.entity.OrgUnit currentOrgUnit = new com.hanghai.kchtg.orgunit.entity.OrgUnit();
        currentOrgUnit.setId(allowedOrgUnitId);
        regularUser.setOrgUnit(currentOrgUnit);

        when(userRepository.findByIdWithRelations(regularUser.getId())).thenReturn(Optional.of(regularUser));
        when(orgUnitScopeService.currentUserScope())
                .thenReturn(com.hanghai.kchtg.orgunit.service.OrgUnitScopeService.Scope.restricted(List.of(allowedOrgUnitId)));

        UpdateUserRequest request = new UpdateUserRequest();
        request.setOrgUnitId(targetNewOrgUnitId);

        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> userService.update(regularUser.getId(), request));
    }

    @Test
    void update_shouldReject_clearingGroupIds_withoutGroupManagePermission() {
        mockCurrentUserAuthorities("user:update");
        when(userRepository.findByIdWithRelations(regularUser.getId())).thenReturn(Optional.of(regularUser));

        UpdateUserRequest request = new UpdateUserRequest();
        request.setGroupIds(Collections.emptyList());

        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> userService.update(regularUser.getId(), request));
    }

    @Test
    void delete_shouldReject_whenTargetUserOutsideOrgUnitScope() {
        mockCurrentUserAuthorities("user:delete");
        UUID targetOrgUnitId = UUID.randomUUID();
        com.hanghai.kchtg.orgunit.entity.OrgUnit targetOrgUnit = new com.hanghai.kchtg.orgunit.entity.OrgUnit();
        targetOrgUnit.setId(targetOrgUnitId);
        regularUser.setOrgUnit(targetOrgUnit);

        when(userRepository.findById(regularUser.getId())).thenReturn(Optional.of(regularUser));
        when(orgUnitScopeService.currentUserScope())
                .thenReturn(com.hanghai.kchtg.orgunit.service.OrgUnitScopeService.Scope.restricted(List.of(UUID.randomUUID())));

        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> userService.delete(regularUser.getId()));
    }

    @Test
    void update_whenPermissionsAndGroupAndOrgUnitChange_shouldIncrementPermissionVersionExactlyOnce() {
        mockCurrentUserAuthorities("user:update", "groupmember:manage", "ROLE_SUPER_ADMIN");
        regularUser.setPermissionVersion(5);

        UUID orgUnitId = UUID.randomUUID();
        com.hanghai.kchtg.orgunit.entity.OrgUnit newOrgUnit = new com.hanghai.kchtg.orgunit.entity.OrgUnit();
        newOrgUnit.setId(orgUnitId);

        UUID groupId = UUID.randomUUID();
        com.hanghai.kchtg.group.entity.UserGroup group = new com.hanghai.kchtg.group.entity.UserGroup();
        group.setId(groupId);

        when(userRepository.findByIdWithRelations(regularUser.getId())).thenReturn(Optional.of(regularUser));
        when(orgUnitRepository.findById(orgUnitId)).thenReturn(Optional.of(newOrgUnit));
        when(groupRepository.findAllById(List.of(groupId))).thenReturn(List.of(group));
        when(orgUnitScopeService.currentUserScope())
                .thenReturn(com.hanghai.kchtg.orgunit.service.OrgUnitScopeService.Scope.allScope());
        when(userPermissionService.syncDirectPermissionsInternal(eq(regularUser), anyList()))
                .thenReturn(true);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserRequest request = new UpdateUserRequest();
        request.setOrgUnitId(orgUnitId);
        request.setGroupIds(List.of(groupId));
        request.setPermissionCodes(List.of("vtssystem:read"));

        User result = userService.update(regularUser.getId(), request);

        // Version MUST be oldVersion (5) + 1 = 6 exactly, not double-incremented
        assertEquals(6, result.getPermissionVersion());
        verify(permissionCacheService, times(1)).invalidateCache(regularUser.getId());
        verify(permissionCacheService, never()).invalidateAndIncrementVersion(any());
    }

    @Test
    void update_whenOnlyProfileDataChanges_shouldNotIncrementPermissionVersion() {
        mockCurrentUserAuthorities("user:update");
        regularUser.setPermissionVersion(5);

        when(userRepository.findByIdWithRelations(regularUser.getId())).thenReturn(Optional.of(regularUser));
        when(orgUnitScopeService.currentUserScope())
                .thenReturn(com.hanghai.kchtg.orgunit.service.OrgUnitScopeService.Scope.allScope());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserRequest request = new UpdateUserRequest();
        request.setFullName("Updated Profile Name");
        request.setPhone("0912345678");

        User result = userService.update(regularUser.getId(), request);

        // Version remains exactly 5
        assertEquals(5, result.getPermissionVersion());
        verify(permissionCacheService, times(1)).invalidateCache(regularUser.getId());
        verify(permissionCacheService, never()).invalidateAndIncrementVersion(any());
    }

    @Test
    void update_whenAssigningSystemWideGroupAndCallerIsScoped_shouldThrowAccessDeniedException() {
        mockCurrentUserAuthorities("user:update", "groupmember:manage");
        UUID userOrgUnitId = UUID.randomUUID();
        com.hanghai.kchtg.orgunit.entity.OrgUnit userOrgUnit = new com.hanghai.kchtg.orgunit.entity.OrgUnit();
        userOrgUnit.setId(userOrgUnitId);
        regularUser.setOrgUnit(userOrgUnit);

        UUID groupId = UUID.randomUUID();
        com.hanghai.kchtg.group.entity.UserGroup systemGroup = new com.hanghai.kchtg.group.entity.UserGroup();
        systemGroup.setId(groupId);
        systemGroup.setOrganizationId(null); // System-wide group

        when(userRepository.findByIdWithRelations(regularUser.getId())).thenReturn(Optional.of(regularUser));
        when(groupRepository.findAllById(List.of(groupId))).thenReturn(List.of(systemGroup));
        // Caller has restricted unit scope containing target user, but not all-scope
        when(orgUnitScopeService.currentUserScope())
                .thenReturn(com.hanghai.kchtg.orgunit.service.OrgUnitScopeService.Scope.restricted(List.of(userOrgUnitId)));

        UpdateUserRequest request = new UpdateUserRequest();
        request.setGroupIds(List.of(groupId));

        org.springframework.security.access.AccessDeniedException ex = assertThrows(
                org.springframework.security.access.AccessDeniedException.class,
                () -> userService.update(regularUser.getId(), request));
        assertTrue(ex.getMessage().contains("Bạn không có quyền gán nhóm toàn hệ thống khi bị giới hạn phạm vi đơn vị"));
    }

    @Test
    void update_whenAssigningSystemWideGroupAndCallerIsSuperAdmin_shouldAllow() {
        mockCurrentUserAuthorities("user:update", "groupmember:manage", "ROLE_SUPER_ADMIN");
        UUID groupId = UUID.randomUUID();
        com.hanghai.kchtg.group.entity.UserGroup systemGroup = new com.hanghai.kchtg.group.entity.UserGroup();
        systemGroup.setId(groupId);
        systemGroup.setOrganizationId(null); // System-wide group

        when(userRepository.findByIdWithRelations(regularUser.getId())).thenReturn(Optional.of(regularUser));
        when(groupRepository.findAllById(List.of(groupId))).thenReturn(List.of(systemGroup));
        when(orgUnitScopeService.currentUserScope())
                .thenReturn(com.hanghai.kchtg.orgunit.service.OrgUnitScopeService.Scope.allScope());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserRequest request = new UpdateUserRequest();
        request.setGroupIds(List.of(groupId));

        assertDoesNotThrow(() -> userService.update(regularUser.getId(), request));
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
