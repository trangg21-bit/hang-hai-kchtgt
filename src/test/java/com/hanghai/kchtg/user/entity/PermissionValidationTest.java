package com.hanghai.kchtg.user.entity;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

class PermissionValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "user:read",
            "user:manage",
            "vts:read:restricted",
            "vts:read:confidential",
            "navigationchannel:create",
            "org_unit:manage"
    })
    void validPermissionCodes_shouldPassValidation(String code) {
        Permission permission = new Permission();
        permission.setCode(code);
        permission.setName("Valid Permission " + code);
        permission.setResource("test");
        permission.setAction("read");

        var violations = validator.validate(permission);
        assertTrue(violations.isEmpty(), "Code should be valid: " + code);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "USER:READ",
            "user:",
            ":read",
            "user::read",
            "user read",
            "user@read",
            "1user:read"
    })
    void invalidPermissionCodes_shouldFailValidation(String code) {
        Permission permission = new Permission();
        permission.setCode(code);
        permission.setName("Invalid Permission");
        permission.setResource("test");
        permission.setAction("read");

        var violations = validator.validate(permission);
        assertFalse(violations.isEmpty(), "Code should be invalid: " + code);
    }

    @Test
    void testGetResourceAndActionWithHierarchicalCode() {
        Permission permission = new Permission();
        permission.setCode("vts:read:restricted");
        assertEquals("vts", permission.getResource());
        assertEquals("read:restricted", permission.getAction());
    }
}
