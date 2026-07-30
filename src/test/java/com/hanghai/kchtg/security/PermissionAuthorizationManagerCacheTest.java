package com.hanghai.kchtg.security;

import com.hanghai.kchtg.security.service.PermissionCacheService;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;

import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

/**
 * Verifies the Redis permission cache in {@link PermissionAuthorizationManager} is a
 * pure best-effort optimization: a cache hit short-circuits, and any cache failure
 * degrades gracefully to the database so an authorization decision is never broken.
 */
class PermissionAuthorizationManagerCacheTest {

    private final UUID userId = UUID.randomUUID();

    private Authentication authenticationFor(User user) {
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getPrincipal()).thenReturn(user);
        return auth;
    }

    @Test
    @DisplayName("Cache hit is returned without recomputing from the database")
    void cacheHit_shortCircuits() {
        UserRepository userRepository = mock(UserRepository.class);
        PermissionCacheService cache = mock(PermissionCacheService.class);
        when(cache.getPermissionsFromCache(userId)).thenReturn(Set.of("cached:perm"));

        User user = mock(User.class);
        when(user.getId()).thenReturn(userId);

        PermissionAuthorizationManager manager = new PermissionAuthorizationManager(userRepository, cache);
        Set<String> result = manager.extractPermissions(authenticationFor(user));

        assertEquals(Set.of("cached:perm"), result);
    }

    @Test
    @DisplayName("Cache miss computes from the user and populates the cache")
    void cacheMiss_computesAndCaches() {
        UserRepository userRepository = mock(UserRepository.class);
        PermissionCacheService cache = mock(PermissionCacheService.class);
        when(cache.getPermissionsFromCache(userId)).thenReturn(null);

        User user = mock(User.class);
        when(user.getId()).thenReturn(userId);
        when(user.getAllPermissions()).thenReturn(Set.of("db:perm"));

        PermissionAuthorizationManager manager = new PermissionAuthorizationManager(userRepository, cache);
        Set<String> result = manager.extractPermissions(authenticationFor(user));

        assertEquals(Set.of("db:perm"), result);
        verify(cache).cachePermissions(userId, Set.of("db:perm"));
    }

    @Test
    @DisplayName("Redis failure falls back to database permissions (authz never breaks)")
    void cacheFailure_fallsBackToDatabase() {
        UserRepository userRepository = mock(UserRepository.class);
        PermissionCacheService cache = mock(PermissionCacheService.class);
        when(cache.getPermissionsFromCache(userId)).thenThrow(new RuntimeException("Redis down"));

        User user = mock(User.class);
        when(user.getId()).thenReturn(userId);
        when(user.getAllPermissions()).thenReturn(Set.of("db:perm"));

        PermissionAuthorizationManager manager = new PermissionAuthorizationManager(userRepository, cache);
        Set<String> result = manager.extractPermissions(authenticationFor(user));

        assertEquals(Set.of("db:perm"), result, "Must degrade to DB when Redis is unavailable");
    }
}
