package com.hanghai.kchtg.port;

import com.hanghai.kchtg.port.dto.dryport.CreateDryPortRequest;
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
 * Bean Validation unit tests — GPS @AssertTrue paired-field constraint.
 * Uses jakarta.validation.Validator directly, no Spring context needed.
 */
@DisplayName("ValidationExtended — GPS paired-field @AssertTrue constraint")
class ValidationExtendedTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    // ── CreateDryPortRequest GPS tests ────────────────────────────────────────

    @Test
    @DisplayName("CreateDryPortRequest — latitude set, longitude null → gpsPaired violation")
    void createDryPortRequest_gpsPartial_latitudeSetLongitudeNull_invalid() {
        CreateDryPortRequest request = new CreateDryPortRequest();
        request.setDryPortCode("CC-001");
        request.setDryPortName("Cảng cạn test");
        request.setLatitude(new BigDecimal("20.0"));
        // partial — triggers violation

        Set<ConstraintViolation<CreateDryPortRequest>> violations = validator.validate(request);

        boolean hasGpsPairedViolation = violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().contains("gpsPaired"));
        assertTrue(hasGpsPairedViolation,
                "Expected gpsPaired violation but got: " + violations);
    }

    @Test
    @DisplayName("CreateDryPortRequest — both GPS null → valid (no gpsPaired violation)")
    void createDryPortRequest_bothGpsNull_valid() {
        CreateDryPortRequest request = new CreateDryPortRequest();
        request.setDryPortCode("CC-001");
        request.setDryPortName("Cảng cạn test");
        Set<ConstraintViolation<CreateDryPortRequest>> violations = validator.validate(request);

        boolean hasGpsPairedViolation = violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().contains("gpsPaired"));
        assertFalse(hasGpsPairedViolation,
                "Expected no gpsPaired violation but got: " + violations);
    }

    @Test
    @DisplayName("CreateDryPortRequest — both GPS set → valid (no gpsPaired violation)")
    void createDryPortRequest_bothGpsSet_valid() {
        CreateDryPortRequest request = new CreateDryPortRequest();
        request.setDryPortCode("CC-001");
        request.setDryPortName("Cảng cạn test");
        Set<ConstraintViolation<CreateDryPortRequest>> violations = validator.validate(request);

        boolean hasGpsPairedViolation = violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().contains("gpsPaired"));
        assertFalse(hasGpsPairedViolation,
                "Expected no gpsPaired violation but got: " + violations);
    }

    // ── CreatePortRequest GPS tests ───────────────────────────────────────

    @Test
    @DisplayName("CreatePortRequest — latitude set, longitude null → gpsPaired violation")
    void createPortRequest_gpsPartial_latitudeSet_longitudeNull_invalid() {
        CreatePortRequest request = new CreatePortRequest();
        request.setPortCode("CB-001");
        request.setPortName("Cảng biển test");
        request.setLatitude(new BigDecimal("20.0"));
        // partial — triggers violation

        Set<ConstraintViolation<CreatePortRequest>> violations = validator.validate(request);

        boolean hasGpsPairedViolation = violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().contains("gpsPaired"));
        assertTrue(hasGpsPairedViolation,
                "Expected gpsPaired violation but got: " + violations);
    }

    @Test
    @DisplayName("CreatePortRequest — both GPS set → valid (no gpsPaired violation)")
    void createPortRequest_bothGpsSet_valid() {
        CreatePortRequest request = new CreatePortRequest();
        request.setPortCode("CB-001");
        request.setPortName("Cảng biển test");
        Set<ConstraintViolation<CreatePortRequest>> violations = validator.validate(request);

        boolean hasGpsPairedViolation = violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().contains("gpsPaired"));
        assertFalse(hasGpsPairedViolation,
                "Expected no gpsPaired violation but got: " + violations);
    }
}
