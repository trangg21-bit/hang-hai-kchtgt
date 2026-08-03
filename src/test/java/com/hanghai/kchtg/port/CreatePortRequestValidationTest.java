package com.hanghai.kchtg.port;

import com.hanghai.kchtg.port.dto.port.CreatePortRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Bean Validation tests for CreatePortRequest (F-008).
 * Verifies GPS range constraints and positive-area constraint.
 */
@DisplayName("CreatePortRequest Bean Validation — F-008")
class CreatePortRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    private CreatePortRequest validRequest() {
        CreatePortRequest req = new CreatePortRequest();
        req.setPortCode("CB-TEST");
        req.setPortName("Cảng hợp lệ");
        req.setArea(new BigDecimal("1000.00"));
        return req;
    }

    // ── GPS latitude ───────────────────────────────────────────────────────

    @Test
    @DisplayName("F-008: valid request — no violations")
    void validRequest_noViolations() {
        Set<ConstraintViolation<CreatePortRequest>> violations = validator.validate(validRequest());
        assertTrue(violations.isEmpty(), "Expected no violations for valid request but got: " + violations);
    }



    // ── Area (area) ────────────────────────────────────────────────────

    @Test
    @DisplayName("F-008: area = 0 — violation (must be > 0)")
    void area_zero_violation() {
        CreatePortRequest req = validRequest();
        req.setArea(BigDecimal.ZERO);

        Set<ConstraintViolation<CreatePortRequest>> violations = validator.validate(req);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("area")));
    }

    @Test
    @DisplayName("F-008: area = -1 — violation (must be > 0)")
    void area_negative_violation() {
        CreatePortRequest req = validRequest();
        req.setArea(new BigDecimal("-1"));

        Set<ConstraintViolation<CreatePortRequest>> violations = validator.validate(req);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("area")));
    }

    @Test
    @DisplayName("F-008: area = 0.01 — accepted (positive)")
    void area_smallPositive_accepted() {
        CreatePortRequest req = validRequest();
        req.setArea(new BigDecimal("0.01"));

        Set<ConstraintViolation<CreatePortRequest>> violations = validator.validate(req);

        assertTrue(violations.stream().noneMatch(v -> v.getPropertyPath().toString().equals("area")));
    }

    @Test
    @DisplayName("F-008: area = null — accepted (optional field)")
    void area_null_accepted() {
        CreatePortRequest req = validRequest();
        req.setArea(null);

        Set<ConstraintViolation<CreatePortRequest>> violations = validator.validate(req);

        assertTrue(violations.stream().noneMatch(v -> v.getPropertyPath().toString().equals("area")));
    }

    // ── Required fields ────────────────────────────────────────────────────

    @Test
    @DisplayName("F-008: portCode blank — violation")
    void portCode_blank_violation() {
        CreatePortRequest req = validRequest();
        req.setPortCode("  ");

        Set<ConstraintViolation<CreatePortRequest>> violations = validator.validate(req);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("portCode")));
    }

    @Test
    @DisplayName("F-008: portName blank — violation")
    void portName_blank_violation() {
        CreatePortRequest req = validRequest();
        req.setPortName("");

        Set<ConstraintViolation<CreatePortRequest>> violations = validator.validate(req);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("portName")));
    }
}
