package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.security.service.PermissionCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.user.entity.Permission;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserPermissionOverride;
import com.hanghai.kchtg.user.repository.PermissionRepository;
import com.hanghai.kchtg.user.repository.UserPermissionOverrideRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserPermissionServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PermissionRepository permissionRepository;
    @Mock private UserPermissionOverrideRepository overrideRepository;
    @Mock private PermissionCacheService permissionCacheService;
    @Mock private OrgUnitScopeService orgUnitScopeService;

    @Test
    void replaceDirectPermissionsReplacesOnlyDirectUserGrants() {
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
}
