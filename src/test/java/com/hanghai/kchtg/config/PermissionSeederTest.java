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
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
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
        when(permissionRepository.findByCode(anyString())).thenReturn(Optional.empty());

        permissionSeeder.run();

        ArgumentCaptor<Permission> captor = ArgumentCaptor.forClass(Permission.class);
        verify(permissionRepository, atLeast(100)).save(captor.capture());

        List<Permission> savedPermissions = captor.getAllValues();
        assertThat(savedPermissions).isNotEmpty();

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
                "port:approve",
                "berth:create",
                "berth:read",
                "berth:update",
                "berth:delete",
                "berth:approve",
                "pier:create",
                "pier:read",
                "pier:update",
                "pier:delete",
                "pier:approve",
                "waterzone:create",
                "waterzone:read",
                "waterzone:update",
                "waterzone:delete",
                "waterzone:approve",
                "vts:read:restricted",
                "vts:read:confidential"
        );
    }
}
