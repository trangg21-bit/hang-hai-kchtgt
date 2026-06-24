package com.hanghai.kchtg.user.entity;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class PermissionTest {

    private static Validator validator;
    private Permission permission;

    @BeforeAll
    static void initValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @BeforeEach
    void setUp() {
        permission = new Permission();
    }

    // =========================================================================
    // Code Validation Tests
    // =========================================================================

    @Test
    void code_shouldAcceptValidFormat() {
        permission.setCode("manhien:read");
        Set<ConstraintViolation<Permission>> violations = validator.validate(permission);
        assertValid(violations, "code");
    }

    @Test
    void code_shouldAcceptLowercaseWithNumbers() {
        permission.setCode("bao01:export2");
        Set<ConstraintViolation<Permission>> violations = validator.validate(permission);
        assertValid(violations, "code");
    }

    @Test
    void code_shouldRejectUppercase() {
        permission.setCode("Manhien:read");
        Set<ConstraintViolation<Permission>> violations = validator.validate(permission);
        assertViolates(violations, "code");
    }

    @Test
    void code_shouldRejectMissingColon() {
        permission.setCode("manhienread");
        Set<ConstraintViolation<Permission>> violations = validator.validate(permission);
        assertViolates(violations, "code");
    }

    @Test
    void code_shouldRejectEmptyAction() {
        permission.setCode("manhien:");
        Set<ConstraintViolation<Permission>> violations = validator.validate(permission);
        assertViolates(violations, "code");
    }

    @Test
    void code_shouldRejectEmptyResource() {
        permission.setCode(":read");
        Set<ConstraintViolation<Permission>> violations = validator.validate(permission);
        assertViolates(violations, "code");
    }

    @Test
    void code_shouldRejectNull() {
        permission.setCode(null);
        Set<ConstraintViolation<Permission>> violations = validator.validate(permission);
        assertViolates(violations, "code");
    }

    @Test
    void code_shouldRejectSpecialChars() {
        permission.setCode("man-hien:read");
        Set<ConstraintViolation<Permission>> violations = validator.validate(permission);
        assertViolates(violations, "code");
    }

    @Test
    void code_shouldRejectStartsWithNumber() {
        permission.setCode("1manhien:read");
        Set<ConstraintViolation<Permission>> violations = validator.validate(permission);
        assertViolates(violations, "code");
    }

    // =========================================================================
    // Code Generation Tests
    // =========================================================================

    @Test
    void createCode_shouldConcatWithColon() {
        String code = Permission.createCode("manhien", "read");
        assertEquals("manhien:read", code);
    }

    @Test
    void createCode_shouldHandleMultiWordResource() {
        String code = Permission.createCode("bao_cao", "export");
        assertEquals("bao_cao:export", code);
    }

    @Test
    void createCode_shouldHandleNullAction() {
        String code = Permission.createCode("manhien", null);
        assertEquals("manhien:null", code);
    }

    // =========================================================================
    // getResource() Fallback Tests
    // =========================================================================

    @Test
    void getResource_shouldReturnSetResource() {
        permission.setResource("manhien");
        permission.setCode("other:read");
        assertEquals("manhien", permission.getResource());
    }

    @Test
    void getResource_shouldParseFromCodeWhenNull() {
        permission.setResource(null);
        permission.setCode("baocao:export");
        assertEquals("baocao", permission.getResource());
    }

    @Test
    void getResource_shouldReturnCodeWhenResourceNullAndNoColon() {
        permission.setResource(null);
        permission.setCode("solo");
        assertEquals("solo", permission.getResource());
    }

    // =========================================================================
    // getAction() Fallback Tests
    // =========================================================================

    @Test
    void getAction_shouldReturnSetAction() {
        permission.setAction("write");
        permission.setCode("manhien:read");
        assertEquals("write", permission.getAction());
    }

    @Test
    void getAction_shouldParseFromCodeWhenNull() {
        permission.setAction(null);
        permission.setCode("baocao:export");
        assertEquals("export", permission.getAction());
    }

    // =========================================================================
    // permits() Tests
    // =========================================================================

    @Test
    void permits_shouldReturnTrueForMatchingResourceAndAction() {
        permission.setResource("manhien");
        permission.setAction("read");
        assertTrue(permission.permits("manhien", "read"));
    }

    @Test
    void permits_shouldReturnFalseForWrongResource() {
        permission.setResource("manhien");
        permission.setAction("read");
        assertFalse(permission.permits("baocao", "read"));
    }

    @Test
    void permits_shouldReturnFalseForWrongAction() {
        permission.setResource("manhien");
        permission.setAction("read");
        assertFalse(permission.permits("manhien", "write"));
    }

    // =========================================================================
    // Field Constraints Tests
    // =========================================================================

    @Test
    void name_shouldBeNotBlank() {
        permission.setCode("manhien:read");
        permission.setName(null);
        Set<ConstraintViolation<Permission>> violations = validator.validate(permission);
        assertViolates(violations, "name");
    }

    @Test
    void name_shouldRejectTooLong() {
        permission.setCode("manhien:read");
        permission.setName("A".repeat(201));
        Set<ConstraintViolation<Permission>> violations = validator.validate(permission);
        assertViolates(violations, "name");
    }

    @Test
    void name_shouldAcceptMaxLength() {
        permission.setCode("manhien:read");
        permission.setName("A".repeat(200));
        Set<ConstraintViolation<Permission>> violations = validator.validate(permission);
        assertValid(violations, "name");
    }

    @Test
    void resource_shouldBeNotBlank() {
        permission.setCode("manhien:read");
        permission.setResource(null);
        Set<ConstraintViolation<Permission>> violations = validator.validate(permission);
        assertViolates(violations, "resource");
    }

    @Test
    void resource_shouldRejectTooLong() {
        permission.setCode("manhien:read");
        permission.setResource("A".repeat(51));
        Set<ConstraintViolation<Permission>> violations = validator.validate(permission);
        assertViolates(violations, "resource");
    }

    @Test
    void action_shouldBeNotBlank() {
        permission.setCode("manhien:read");
        permission.setAction(null);
        Set<ConstraintViolation<Permission>> violations = validator.validate(permission);
        assertViolates(violations, "action");
    }

    @Test
    void action_shouldRejectTooLong() {
        permission.setCode("manhien:read");
        permission.setAction("A".repeat(31));
        Set<ConstraintViolation<Permission>> violations = validator.validate(permission);
        assertViolates(violations, "action");
    }

    // =========================================================================
    // toString/equals helper
    // =========================================================================

    private void assertValid(Set<ConstraintViolation<Permission>> violations, String field) {
        Set<ConstraintViolation<Permission>> fieldViolations = violations.stream()
                .filter(v -> v.getPropertyPath().toString().equals(field))
                .collect(java.util.stream.Collectors.toSet());
        assertTrue(fieldViolations.isEmpty(),
                "Field '" + field + "' should have no violations but got: " + fieldViolations);
    }

    private void assertViolates(Set<ConstraintViolation<Permission>> violations, String field) {
        Set<ConstraintViolation<Permission>> fieldViolations = violations.stream()
                .filter(v -> v.getPropertyPath().toString().equals(field))
                .collect(java.util.stream.Collectors.toSet());
        assertFalse(fieldViolations.isEmpty(),
                "Field '" + field + "' should have violations but got none");
    }
}
