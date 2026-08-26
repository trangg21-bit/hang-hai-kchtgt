package com.hanghai.kchtg.m024;

import com.hanghai.kchtg.config.PermissionSeeder;
import com.hanghai.kchtg.user.entity.Permission;
import com.hanghai.kchtg.user.repository.PermissionRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * M-024 (F-292) — cross-package coverage test for WO-BE-1.
 *
 * Verifies that every permission code in the design's final route->permission map
 * (docs/modules/M-024-tai-cau-truc-menu-navigation/design/00-design-plan.md, section 4.4)
 * is seeded by {@link PermissionSeeder#run()} — exercising the real production class
 * through its public seam. This test lives in a DIFFERENT package (com.hanghai.kchtg.m024)
 * so the import of com.hanghai.kchtg.config.PermissionSeeder is a genuine cross-package
 * import (gate INC-039 test-no-production-import).
 */
@ExtendWith(MockitoExtension.class)
class MenuPermissionCoverageTest {

    @Mock
    private PermissionRepository permissionRepository;

    @Mock
    private UserRepository userRepository;

    private PermissionSeeder permissionSeeder;

    @BeforeEach
    void setUp() {
        permissionSeeder = new PermissionSeeder(permissionRepository, userRepository);
    }

    @Test
    void run_seedsAllMenuPermissionCodesFromDesignSection44() {
        // PermissionSeeder nạp theo lô: findAll() một lần rồi saveAll() các quyền còn thiếu.
        when(permissionRepository.findAll()).thenReturn(List.of());

        permissionSeeder.run();

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Permission>> captor = ArgumentCaptor.forClass(List.class);
        verify(permissionRepository).saveAll(captor.capture());

        List<String> codes = captor.getAllValues().stream()
                        .flatMap(List::stream)
                        .map(Permission::getCode)
                        .toList();
        assertThat(codes).hasSizeGreaterThanOrEqualTo(28);

        // Design 00-design-plan.md §4.4 — final route -> permission map (28 distinct codes).
        assertThat(codes).contains(
                "user:read",
                "orgunit:read",
                "group:read",
                "admin:manage",
                "admin:view",
                "connection:read",
                "data:read",
                "report:read",
                "document:read",
                "port:read",
                "berth:read",
                "pier:read",
                "dryport:read",
                "waterzone:read",
                "navigationchannel:read",
                "dikerevetment:read",
                "shiprepair:read",
                "radarstation:read",
                "vts:read",
                "beaconstation:read",
                "buoystation:read",
                "buoy:read",
                "coastalstation:read",
                "specialstation:read",
                "inventoryasset:manage",
                "assetdecrease:manage",
                "assetincrease:manage",
                "assetexploitation:manage"
        );
    }
}
