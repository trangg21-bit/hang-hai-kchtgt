package com.hanghai.kchtg.config;

import com.hanghai.kchtg.user.entity.Permission;
import com.hanghai.kchtg.user.repository.PermissionRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PermissionSeederTest {

    @Mock
    private PermissionRepository permissionRepository;

    @Mock
    private UserRepository userRepository;

    private PermissionSeeder permissionSeeder;
    private Validator validator;

    @BeforeEach
    void setUp() {
        permissionSeeder = new PermissionSeeder(permissionRepository, userRepository);
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void run_seedsAllPermissionsAndAllPassValidation() {
        when(permissionRepository.findAll()).thenReturn(List.of());

        permissionSeeder.run();

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Permission>> captor = ArgumentCaptor.forClass(List.class);
        verify(permissionRepository).saveAll(captor.capture());

        List<Permission> savedPermissions = captor.getValue();
        assertThat(savedPermissions).isNotEmpty();
        assertThat(savedPermissions.size()).isGreaterThanOrEqualTo(100);

        for (Permission p : savedPermissions) {
            var violations = validator.validate(p);
            assertThat(violations)
                    .as("Permission %s should have no validation errors", p.getCode())
                    .isEmpty();
        }

        // Verify key domains are present
        List<String> codes = savedPermissions.stream().map(Permission::getCode).toList();
        assertThat(codes).contains(
                "movementrequest:manage",
                "inventoryplan:manage",
                "inventoryreport:manage",
                "security:manage",
                "port:create",
                "port:read",
                "port:update",
                "port:delete",
                "port:approvec1",
                "port:approvec2",
                "berth:create",
                "berth:read",
                "berth:update",
                "berth:delete",
                "berth:approvec1",
                "berth:approvec2",
                "pier:create",
                "pier:read",
                "pier:update",
                "pier:delete",
                "pier:approvec1",
                "pier:approvec2",
                "waterzone:create",
                "waterzone:read",
                "waterzone:update",
                "waterzone:delete",
                "waterzone:approvec1",
                "waterzone:approvec2",
                "radarstation:manage",
                "radarstation:read",
                "radarstation:create",
                "radarstation:update",
                "radarstation:delete",
                "radarstation:approvec1",
                "radarstation:approvec2",
                "radarstation:history",
                "cctv:manage",
                "cctv:read",
                "cctv:create",
                "cctv:update",
                "cctv:delete",
                "cctv:approvec1",
                "cctv:approvec2",
                "cctv:history",
                "scada:manage",
                "scada:read",
                "scada:create",
                "scada:update",
                "scada:delete",
                "scada:approvec1",
                "scada:approvec2",
                "scada:history",
                "transmission:manage",
                "transmission:read",
                "transmission:create",
                "transmission:update",
                "transmission:delete",
                "transmission:approvec1",
                "transmission:approvec2",
                "transmission:history",
                "vtsassist:manage",
                "vtsassist:read",
                "vtsassist:create",
                "vtsassist:update",
                "vtsassist:delete",
                "vtsassist:approvec1",
                "vtsassist:approvec2",
                "vtsassist:history",
                "shiprepairyard:manage",
                "shiprepairyard:read",
                "shiprepairyard:create",
                "shiprepairyard:update",
                "shiprepairyard:delete",
                "shiprepairyard:approvec1",
                "shiprepairyard:approvec2",
                "shiprepairyard:history",
                "shiprepair:manage",
                "shiprepairfacility:manage",
                "anchorage:manage",
                "anchorage:read",
                "anchorage:create",
                "anchorage:update",
                "anchorage:delete",
                "anchorage:approvec1",
                "anchorage:approvec2",
                "anchorage:history",
                "transferarea:manage",
                "transferarea:read",
                "transferarea:create",
                "transferarea:update",
                "transferarea:delete",
                "transferarea:approvec1",
                "transferarea:approvec2",
                "transferarea:history",
                "dryport:manage",
                "dryport:read",
                "dryport:create",
                "dryport:update",
                "dryport:delete",
                "dryport:approvec1",
                "dryport:approvec2",
                "dryport:history",
                "vts:read:restricted",
                "vts:read:confidential"
        );

        assertThat(codes).doesNotContain(
                "port:approve",
                "berth:approve",
                "pier:approve",
                "waterzone:approve",
                "radarstation:approve",
                "cctv:approve",
                "cctvasset:approve",
                "scada:approve",
                "scadaasset:approve",
                "transmission:approve",
                "transmissionasset:approve",
                "vtsassist:approve",
                "vtsassistasset:approve",
                "shiprepairyard:approve",
                "shiprepair:approve",
                "shiprepairfacility:approve",
                "anchorage:approve",
                "anchoragearea:approve",
                "anchorageasset:approve"
        );
    }
}
