package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.security.service.PermissionCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.user.dto.GrantUserPermissionRequest;
import com.hanghai.kchtg.user.entity.Permission;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserPermissionOverride;
import com.hanghai.kchtg.user.repository.PermissionRepository;
import com.hanghai.kchtg.user.repository.UserPermissionOverrideRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserPermissionServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PermissionRepository permissionRepository;
    @Mock private UserPermissionOverrideRepository overrideRepository;
    @Mock private PermissionCacheService permissionCacheService;
    @Mock private OrgUnitScopeService orgUnitScopeService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void replaceDirectPermissionsReplacesOnlyDirectUserGrants() {
        UUID callerId = UUID.randomUUID();
        User superAdmin = new User();
        superAdmin.setId(callerId);
        superAdmin.setUsername("superadmin");
        var auth = new UsernamePasswordAuthenticationToken(superAdmin, "n/a", List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setPermissionVersion(2);

        UserPermissionOverride oldGrant = new UserPermissionOverride();
        oldGrant.setUser(user);
        oldGrant.setPermissionCode("vts:read");

        Permission newPermission = new Permission();
        newPermission.setCode("vts:update");

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(permissionRepository.findByCodeIn(any())).thenReturn(List.of(newPermission));
        when(overrideRepository.findActiveByUserId(userId)).thenReturn(List.of(oldGrant));
        when(overrideRepository.findByUserIdAndPermissionCode(userId, "vts:update"))
                .thenReturn(Optional.empty());
        when(overrideRepository.save(any(UserPermissionOverride.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.allScope());

        new UserPermissionService(userRepository, permissionRepository, overrideRepository, permissionCacheService,
                orgUnitScopeService)
                .replaceDirectPermissions(userId, List.of(" vts:update "));

        assertThat(oldGrant.getDeletedAt()).isNotNull();
        ArgumentCaptor<UserPermissionOverride> captor = ArgumentCaptor.forClass(UserPermissionOverride.class);
        verify(overrideRepository, atLeastOnce()).save(captor.capture());
        assertThat(captor.getAllValues().stream().map(UserPermissionOverride::getPermissionCode))
                .contains("vts:read", "vts:update");
        assertThat(user.getPermissionVersion()).isEqualTo(3);
        verify(permissionCacheService).invalidateCache(userId);
    }

    @Test
    void unauthenticatedCallThrowsAccessDenied() {
        SecurityContextHolder.clearContext();
        UUID userId = UUID.randomUUID();

        UserPermissionService service = new UserPermissionService(userRepository, permissionRepository,
                overrideRepository, permissionCacheService, orgUnitScopeService);

        GrantUserPermissionRequest request = new GrantUserPermissionRequest();
        request.setPermissionCode("vts:read");

        assertThatThrownBy(() -> service.grant(userId, request))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Yêu cầu xác thực người dùng");
    }

    @Test
    void nonSuperAdminCannotGrantDirectPermissions() {
        UUID callerId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        User caller = new User();
        caller.setId(callerId);
        caller.setUsername("regular_manager");
        var auth = new UsernamePasswordAuthenticationToken(caller, "n/a", List.of(new SimpleGrantedAuthority("user:manage")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        UserPermissionService service = new UserPermissionService(userRepository, permissionRepository,
                overrideRepository, permissionCacheService, orgUnitScopeService);

        GrantUserPermissionRequest request = new GrantUserPermissionRequest();
        request.setPermissionCode("vts:create");

        assertThatThrownBy(() -> service.grant(targetId, request))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Chỉ Quản trị viên cấp cao (Super Admin) mới có quyền cấp hoặc thu hồi quyền trực tiếp");
    }

    @Test
    void superAdminCanGrantAnyPermissionIncludingSpecial() {
        UUID callerId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        User superAdmin = new User();
        superAdmin.setId(callerId);
        superAdmin.setUsername("superadmin");
        var auth = new UsernamePasswordAuthenticationToken(superAdmin, "n/a", List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        User targetUser = new User();
        targetUser.setId(targetId);

        when(userRepository.findById(targetId)).thenReturn(Optional.of(targetUser));
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.allScope());
        when(permissionRepository.findByCode("admin:all")).thenReturn(Optional.of(new Permission()));
        when(overrideRepository.findByUserIdAndPermissionCode(targetId, "admin:all")).thenReturn(Optional.empty());
        when(overrideRepository.save(any(UserPermissionOverride.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserPermissionService service = new UserPermissionService(userRepository, permissionRepository,
                overrideRepository, permissionCacheService, orgUnitScopeService);

        GrantUserPermissionRequest request = new GrantUserPermissionRequest();
        request.setPermissionCode("admin:all");

        var response = service.grant(targetId, request);
        assertThat(response.getPermissionCode()).isEqualTo("admin:all");
        verify(permissionCacheService).invalidateCache(targetId);
    }

    @Test
    void grant_whenPermissionIsAlreadyActiveAndMetadataUnchanged_shouldNotWriteOrIncrementVersion() {
        UUID callerId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        User superAdmin = new User();
        superAdmin.setId(callerId);
        var auth = new UsernamePasswordAuthenticationToken(superAdmin, "n/a",
                List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        User targetUser = new User();
        targetUser.setId(targetId);
        targetUser.setPermissionVersion(4);

        UserPermissionOverride existing = new UserPermissionOverride();
        existing.setUser(targetUser);
        existing.setPermissionCode("vts:read");
        existing.setReason("Nhu cầu nghiệp vụ");

        when(userRepository.findById(targetId)).thenReturn(Optional.of(targetUser));
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.allScope());
        when(permissionRepository.findByCode("vts:read")).thenReturn(Optional.of(new Permission()));
        when(overrideRepository.findByUserIdAndPermissionCode(targetId, "vts:read"))
                .thenReturn(Optional.of(existing));

        GrantUserPermissionRequest request = new GrantUserPermissionRequest();
        request.setPermissionCode("vts:read");
        request.setReason("Nhu cầu nghiệp vụ");

        new UserPermissionService(userRepository, permissionRepository, overrideRepository, permissionCacheService,
                orgUnitScopeService).grant(targetId, request);

        assertThat(targetUser.getPermissionVersion()).isEqualTo(4);
        verify(overrideRepository, never()).save(any());
        verify(userRepository, never()).save(any());
        verify(permissionCacheService, never()).invalidateCache(any());
    }

    @Test
    void grant_whenOnlyReasonChanges_shouldUpdateMetadataWithoutIncrementingVersionOrInvalidatingCache() {
        UUID callerId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        User superAdmin = new User();
        superAdmin.setId(callerId);
        var auth = new UsernamePasswordAuthenticationToken(superAdmin, "n/a",
                List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        User targetUser = new User();
        targetUser.setId(targetId);
        targetUser.setPermissionVersion(4);

        UserPermissionOverride existing = new UserPermissionOverride();
        existing.setUser(targetUser);
        existing.setPermissionCode("vts:read");
        existing.setReason("Lý do cũ");

        when(userRepository.findById(targetId)).thenReturn(Optional.of(targetUser));
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.allScope());
        when(permissionRepository.findByCode("vts:read")).thenReturn(Optional.of(new Permission()));
        when(overrideRepository.findByUserIdAndPermissionCode(targetId, "vts:read"))
                .thenReturn(Optional.of(existing));
        when(overrideRepository.save(existing)).thenReturn(existing);

        GrantUserPermissionRequest request = new GrantUserPermissionRequest();
        request.setPermissionCode("vts:read");
        request.setReason("Lý do mới");

        new UserPermissionService(userRepository, permissionRepository, overrideRepository, permissionCacheService,
                orgUnitScopeService).grant(targetId, request);

        assertThat(existing.getReason()).isEqualTo("Lý do mới");
        assertThat(targetUser.getPermissionVersion()).isEqualTo(4);
        verify(overrideRepository).save(existing);
        verify(userRepository, never()).save(any());
        verify(permissionCacheService, never()).invalidateCache(any());
    }

    @Test
    void replaceDirectPermissions_whenPermissionSetIsUnchanged_shouldNotWriteOrInvalidate() {
        UUID callerId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        User superAdmin = new User();
        superAdmin.setId(callerId);
        var auth = new UsernamePasswordAuthenticationToken(superAdmin, "n/a",
                List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        User targetUser = new User();
        targetUser.setId(targetId);
        targetUser.setPermissionVersion(7);

        UserPermissionOverride existing = new UserPermissionOverride();
        existing.setUser(targetUser);
        existing.setPermissionCode("vts:read");

        Permission permission = new Permission();
        permission.setCode("vts:read");

        when(userRepository.findById(targetId)).thenReturn(Optional.of(targetUser));
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.allScope());
        when(permissionRepository.findByCodeIn(any())).thenReturn(List.of(permission));
        when(overrideRepository.findActiveByUserId(targetId)).thenReturn(List.of(existing));

        new UserPermissionService(userRepository, permissionRepository, overrideRepository, permissionCacheService,
                orgUnitScopeService).replaceDirectPermissions(targetId, List.of("vts:read"));

        assertThat(targetUser.getPermissionVersion()).isEqualTo(7);
        verify(overrideRepository, never()).save(any());
        verify(userRepository, never()).save(any());
        verify(permissionCacheService, never()).invalidateCache(any());
    }

    @Test
    void replaceDirectPermissionsSystem_worksWithoutAuthContext() {
        SecurityContextHolder.clearContext();
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setPermissionVersion(1);

        Permission perm = new Permission();
        perm.setCode("vts:read");

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(permissionRepository.findByCodeIn(any())).thenReturn(List.of(perm));
        when(overrideRepository.findActiveByUserId(userId)).thenReturn(List.of());
        when(overrideRepository.findByUserIdAndPermissionCode(userId, "vts:read")).thenReturn(Optional.empty());
        when(overrideRepository.save(any(UserPermissionOverride.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserPermissionService service = new UserPermissionService(userRepository, permissionRepository,
                overrideRepository, permissionCacheService, orgUnitScopeService);

        service.replaceDirectPermissionsSystem(userId, List.of("vts:read"));

        assertThat(user.getPermissionVersion()).isEqualTo(2);
        verify(permissionCacheService).invalidateCache(userId);
    }

    @Test
    void replaceDirectPermissionsSystem_whenPermissionSetIsUnchanged_shouldNotWriteOrInvalidate() {
        SecurityContextHolder.clearContext();
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setPermissionVersion(3);

        UserPermissionOverride existing = new UserPermissionOverride();
        existing.setUser(user);
        existing.setPermissionCode("vts:read");

        Permission permission = new Permission();
        permission.setCode("vts:read");

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(permissionRepository.findByCodeIn(any())).thenReturn(List.of(permission));
        when(overrideRepository.findActiveByUserId(userId)).thenReturn(List.of(existing));

        new UserPermissionService(userRepository, permissionRepository, overrideRepository, permissionCacheService,
                orgUnitScopeService).replaceDirectPermissionsSystem(userId, List.of("vts:read"));

        assertThat(user.getPermissionVersion()).isEqualTo(3);
        verify(overrideRepository, never()).save(any());
        verify(userRepository, never()).save(any());
        verify(permissionCacheService, never()).invalidateCache(any());
    }
}
