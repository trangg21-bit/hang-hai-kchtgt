package com.hanghai.kchtg.security;

import com.hanghai.kchtg.security.service.EffectivePermissionService;
import com.hanghai.kchtg.security.service.PermissionCacheService;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class EffectivePermissionServiceTest {

    private UserRepository userRepository;
    private PermissionCacheService permissionCacheService;
    private EffectivePermissionService service;
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        permissionCacheService = mock(PermissionCacheService.class);
        service = new EffectivePermissionService(userRepository, permissionCacheService);
    }

    @Test
    @DisplayName("Super admin bypass: '*' grants all permissions")
    void superAdminBypass() {
        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("*"));

        assertTrue(service.checkPermission(userId, "vts", "create"));
        assertTrue(service.checkPermission(userId, "vts", "delete"));
        assertTrue(service.checkPermission(userId, "unknown", "unknown"));
    }

    @Test
    @DisplayName("Super admin authorities on Authentication grant bypass")
    void superAdminAuthoritiesOnAuthentication() {
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN"))).when(auth).getAuthorities();

        assertTrue(service.checkPermission(auth, "vts:create"));
        assertTrue(service.checkPermission(auth, "anything:special"));
    }

    @Test
    @DisplayName("admin:manage does not grant super-admin wildcard bypass")
    void adminManageDoesNotBypassAll() {
        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("admin:manage"));

        assertTrue(service.checkPermission(userId, "admin", "manage"));
        assertFalse(service.checkPermission(userId, "vts", "create"));
        assertFalse(service.checkPermission(userId, "port", "delete"));
        assertFalse(service.checkPermission(userId, "buoy", "read"));
    }

    @Test
    @DisplayName("ROLE_ADMIN does not grant super-admin wildcard bypass")
    void roleAdminDoesNotBypassAll() {
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))).when(auth).getAuthorities();

        assertFalse(service.checkPermission(auth, "vts:create"));
        assertFalse(service.checkPermission(auth, "port:delete"));
    }

    @Test
    @DisplayName("Exact match and case insensitivity")
    void exactMatch() {
        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("vts:create", "port:read"));

        assertTrue(service.checkPermission(userId, "vts", "create"));
        assertTrue(service.checkPermission(userId, "VTS", "CREATE"));
        assertFalse(service.checkPermission(userId, "vts", "delete"));
    }

    @Test
    @DisplayName("Wildcard resource:* grants all actions")
    void wildcardResourceMatch() {
        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("vts:*"));

        assertTrue(service.checkPermission(userId, "vts", "create"));
        assertTrue(service.checkPermission(userId, "vts", "delete"));
        assertTrue(service.checkPermission(userId, "vts", "view"));
        assertFalse(service.checkPermission(userId, "port", "read"));
    }

    @Test
    @DisplayName("Aggregate resource:manage grants access")
    void aggregateManageMatch() {
        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("vts:manage"));

        assertTrue(service.checkPermission(userId, "vts", "create"));
        assertTrue(service.checkPermission(userId, "vts", "delete"));
        assertTrue(service.checkPermission(userId, "vts", "update"));
    }

    @Test
    @DisplayName("Legacy resource:write grants create, update, and delete")
    void legacyWriteMatch() {
        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("vts:write"));

        assertTrue(service.checkPermission(userId, "vts", "create"));
        assertTrue(service.checkPermission(userId, "vts", "update"));
        assertTrue(service.checkPermission(userId, "vts", "delete"));
        assertFalse(service.checkPermission(userId, "vts", "approve"));
    }

    @Test
    @DisplayName("Approval hierarchy matches approve:c1 and approve:c2")
    void approvalHierarchyMatch() {
        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("vts:approve:c1"));

        assertTrue(service.checkPermission(userId, "vts", "approve"));
        assertTrue(service.checkPermission(userId, "vts", "approve:c1"));
        assertTrue(service.checkPermission(userId, "vts", "approvec1"));
    }

    @Test
    @DisplayName("Strict separation of C1/L1 and C2/L2 permissions")
    void strictApprovalSeparation() {
        // User only has buoy:approvec1
        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("buoy:approvec1"));

        assertTrue(service.checkPermission(userId, "buoy", "approvec1"));
        assertTrue(service.checkPermission(userId, "buoy", "approvel1"));
        assertTrue(service.checkPermission(userId, "buoy", "approve-l1"));
        assertTrue(service.checkPermission(userId, "buoy", "approve")); // generic view

        // Must NOT have C2/L2
        assertFalse(service.checkPermission(userId, "buoy", "approvec2"));
        assertFalse(service.checkPermission(userId, "buoy", "approvel2"));
        assertFalse(service.checkPermission(userId, "buoy", "approve-l2"));
    }

    @Test
    @DisplayName("Generic approve does NOT grant C1 or C2 access")
    void genericApproveDoesNotGrantC1OrC2() {
        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("buoy:approve"));

        assertTrue(service.checkPermission(userId, "buoy", "approve"));
        assertFalse(service.checkPermission(userId, "buoy", "approvec1"));
        assertFalse(service.checkPermission(userId, "buoy", "approvel1"));
        assertFalse(service.checkPermission(userId, "buoy", "approvec2"));
        assertFalse(service.checkPermission(userId, "buoy", "approvel2"));
    }

    @Test
    @DisplayName("Port, berth, and pier are properly gated by permissions (fail-closed when unassigned)")
    void properlyGatedResources() {
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        doReturn(Collections.emptyList()).when(auth).getAuthorities();

        assertFalse(service.checkPermission(auth, "port:read"));
        assertFalse(service.checkPermission(auth, "berth:create"));
        assertFalse(service.checkPermission(auth, "pier:delete"));
    }

    @Test
    @DisplayName("Authenticated User principal reuses its permission snapshot without DB or Redis")
    void authenticatedUserPrincipal_reusesSnapshot() {
        User user = mock(User.class);
        when(user.getAllPermissions()).thenReturn(Set.of("vts:read"));

        Authentication auth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                user, null, List.of(new SimpleGrantedAuthority("vts:read")));

        assertTrue(service.checkPermission(auth, "vts:read"));
        verifyNoInteractions(userRepository, permissionCacheService);
    }

    @Test
    @DisplayName("checkAnyPermission and checkAllPermissions evaluate correctly")
    void checkAnyAndAllPermissions() {
        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("vts:create", "vts:read"));

        assertTrue(service.checkAnyPermission(userId, "vts:create", "vts:delete"));
        assertFalse(service.checkAnyPermission(userId, "vts:update", "vts:delete"));

        assertTrue(service.checkAllPermissions(userId, "vts:create", "vts:read"));
        assertFalse(service.checkAllPermissions(userId, "vts:create", "vts:delete"));
    }

    @Test
    @DisplayName("Cache miss falls back to User DB entity and populates Redis cache")
    void cacheMiss_fallsBackToDbAndPopulatesCache() {
        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(null);

        User user = mock(User.class);
        when(user.getId()).thenReturn(userId);
        when(user.getAllPermissions()).thenReturn(Set.of("vts:create"));
        when(userRepository.findByIdWithRelations(userId)).thenReturn(Optional.of(user));

        Set<String> result = service.getEffectivePermissions(userId);

        assertEquals(Set.of("vts:create"), result);
        verify(permissionCacheService).cachePermissions(userId, Set.of("vts:create"));
    }

    @Test
    @DisplayName("Document domain fallback grants access to portplanning, planningadjustment, operationplan, maintenanceplan")
    void documentDomainFallback() {
        when(permissionCacheService.getPermissionsFromCache(userId))
                .thenReturn(Set.of("document:create", "document:read"));

        assertTrue(service.checkPermission(userId, "portplanning", "create"));
        assertTrue(service.checkPermission(userId, "planningadjustment", "read"));
        assertTrue(service.checkPermission(userId, "operationplan", "create"));
        assertTrue(service.checkPermission(userId, "maintenanceplan", "read"));
    }

    @Test
    @DisplayName("Group manage grants group:lock, group:permission, and groupmember:manage")
    void groupManageGrantsSubActions() {
        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("group:manage"));

        assertTrue(service.checkPermission(userId, "group", "lock"));
        assertTrue(service.checkPermission(userId, "group", "permission"));
        assertTrue(service.checkPermission(userId, "groupmember", "manage"));
    }

    @Test
    @DisplayName("Action alias edit <-> update works bidirectionally")
    void editUpdateAlias() {
        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("group:edit"));

        assertTrue(service.checkPermission(userId, "group", "update"));
        assertTrue(service.checkPermission(userId, "group", "edit"));
    }

    @Test
    @DisplayName("Resource alias connection <-> interconnect works bidirectionally")
    void connectionInterconnectAlias() {
        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("connection:read"));

        assertTrue(service.checkPermission(userId, "interconnect", "read"));
        assertTrue(service.checkPermission(userId, "connection", "read"));
    }

    @Test
    @DisplayName("Empty permissions are cached and do not trigger repeated DB queries")
    void emptyPermissions_areCachedAndDoNotHitDbRepeatedly() {
        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(null);

        User user = mock(User.class);
        when(user.getId()).thenReturn(userId);
        when(user.getAllPermissions()).thenReturn(Collections.emptySet());
        when(userRepository.findByIdWithRelations(userId)).thenReturn(Optional.of(user));

        Set<String> result = service.getEffectivePermissions(userId);

        assertTrue(result.isEmpty());
        verify(permissionCacheService).cachePermissions(userId, Collections.emptySet());

        // Second call with cache hit returning empty set
        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Collections.emptySet());
        Set<String> cachedResult = service.getEffectivePermissions(userId);

        assertTrue(cachedResult.isEmpty());
        // Verify DB was only hit once
        verify(userRepository, times(1)).findByIdWithRelations(userId);
    }

    @Test
    @DisplayName("User with effectivePermissionsSnapshot returns directly without hitting cache or DB")
    void userWithSnapshot_returnsDirectlyWithoutCacheOrDb() {
        User user = new User();
        user.setEffectivePermissionsSnapshot(Set.of("vts:read"));

        Set<String> result = service.getEffectivePermissions(user);

        assertEquals(Set.of("vts:read"), result);
        verifyNoInteractions(permissionCacheService, userRepository);
    }

    @Test
    @DisplayName("Implicit Read: Operational permissions implicitly grant read/view/search")
    void implicitRead_grantedFromOperationalPermissions() {
        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("vts:approvec1"));

        assertTrue(service.checkPermission(userId, "vts:read"));
        assertTrue(service.checkPermission(userId, "vts:view"));
        assertTrue(service.checkPermission(userId, "vts:search"));
        assertFalse(service.checkPermission(userId, "vts:delete"));
        assertFalse(service.checkPermission(userId, "vts:create"));
    }

    @Test
    @DisplayName("Parent Domain Coverage: specialstation grants access to specialized coastal stations")
    void parentDomainCoverage_specialstationGrantsChildStations() {
        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("specialstation:read"));

        assertTrue(service.checkPermission(userId, "coastalstationlrit:read"));
        assertTrue(service.checkPermission(userId, "coastalstationinmarsat:read"));
        assertTrue(service.checkPermission(userId, "coastalstationhaiphong:read"));
        assertTrue(service.checkPermission(userId, "coastalstationcospassarsat:read"));
        assertFalse(service.checkPermission(userId, "port:read"));
    }

    @Test
    @DisplayName("Canonical Resource Mapping: vtssystem and vts alias symmetrically")
    void canonicalResourceMapping_vtsAndVtssystem() {
        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("vtssystem:update"));

        // Has update on vtssystem -> matches vts:update
        assertTrue(service.checkPermission(userId, "vts:update"));
        // Implicit read works across canonical resource
        assertTrue(service.checkPermission(userId, "vts:read"));
        assertFalse(service.checkPermission(userId, "vts:delete"));
    }

    @Test
    @DisplayName("BuoyStation: buoyasset and buoy permissions grant buoystation access")
    void buoyStationEquivalenceAndParentDomains() {
        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("buoyasset:read"));

        assertTrue(service.checkPermission(userId, "buoystation:read"));
        assertTrue(service.checkPermission(userId, "buoy:read"));
        assertFalse(service.checkPermission(userId, "buoystation:delete"));

        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("buoyasset:manage"));
        assertTrue(service.checkPermission(userId, "buoystation:read"));
        assertTrue(service.checkPermission(userId, "buoystation:create"));
        assertTrue(service.checkPermission(userId, "buoystation:delete"));
    }

    @Test
    @DisplayName("BeaconStation: lighthouseasset and lighthouse permissions grant beaconstation access")
    void beaconStationEquivalenceAndParentDomains() {
        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("lighthouseasset:read"));

        assertTrue(service.checkPermission(userId, "beaconstation:read"));
        assertTrue(service.checkPermission(userId, "lighthouse:read"));
        assertTrue(service.checkPermission(userId, "beaconlight:read"));
        assertFalse(service.checkPermission(userId, "beaconstation:delete"));

        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("lighthouseasset:manage"));
        assertTrue(service.checkPermission(userId, "beaconstation:read"));
        assertTrue(service.checkPermission(userId, "beaconstation:create"));
        assertTrue(service.checkPermission(userId, "beaconstation:update"));
        assertTrue(service.checkPermission(userId, "beaconstation:delete"));

        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("beaconstation:manage"));
        assertTrue(service.checkPermission(userId, "lighthouseasset:read"));
        assertTrue(service.checkPermission(userId, "lighthouse:read"));
    }

    @Test
    @DisplayName("Port: stormshelterasset, berthasset, and infraasset permissions grant port read access")
    void portEquivalenceAndParentDomains() {
        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("stormshelterasset:read"));

        assertTrue(service.checkPermission(userId, "port:read"));
        assertTrue(service.checkPermission(userId, "seaport:read"));
        assertFalse(service.checkPermission(userId, "port:delete"));

        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("stormshelterasset:manage"));
        assertTrue(service.checkPermission(userId, "port:read"));

        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("berthasset:read"));
        assertTrue(service.checkPermission(userId, "port:read"));

        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("infraasset:manage"));
        assertTrue(service.checkPermission(userId, "port:read"));
        assertTrue(service.checkPermission(userId, "port:create"));
    }

    @Test
    @DisplayName("CoastalStation: ttxlttasset, lritasset, inmarsatasset, cospassarsatasset grant access to coastal station endpoints")
    void coastalStationEquivalenceAndParentDomains() {
        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("ttxlttasset:read"));

        assertTrue(service.checkPermission(userId, "coastalstationhaiphong:read"));
        assertTrue(service.checkPermission(userId, "ttxltt:read"));
        assertFalse(service.checkPermission(userId, "coastalstationhaiphong:delete"));

        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("ttxlttasset:manage"));
        assertTrue(service.checkPermission(userId, "coastalstationhaiphong:read"));
        assertTrue(service.checkPermission(userId, "coastalstationhaiphong:create"));
        assertTrue(service.checkPermission(userId, "coastalstationhaiphong:update"));
        assertTrue(service.checkPermission(userId, "coastalstationhaiphong:delete"));

        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("coastalstationhaiphong:manage"));
        assertTrue(service.checkPermission(userId, "ttxlttasset:read"));
        assertTrue(service.checkPermission(userId, "ttxltt:read"));

        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("lritasset:read"));
        assertTrue(service.checkPermission(userId, "coastalstationlrit:read"));

        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("inmarsatasset:read"));
        assertTrue(service.checkPermission(userId, "coastalstationinmarsat:read"));

        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("cospassarsatasset:read"));
        assertTrue(service.checkPermission(userId, "coastalstationcospassarsat:read"));
    }

    @Test
    @DisplayName("User: infraasset, data, and admin permissions grant user read access")
    void userEquivalenceAndParentDomains() {
        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("infraasset:read"));
        assertTrue(service.checkPermission(userId, "user:read"));

        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("data:read"));
        assertTrue(service.checkPermission(userId, "user:read"));

        when(permissionCacheService.getPermissionsFromCache(userId)).thenReturn(Set.of("admin:view"));
        assertTrue(service.checkPermission(userId, "user:read"));
    }
}

