package com.hanghai.kchtg.cangben;

import com.hanghai.kchtg.cangben.dto.cangbien.CreateCangBienRequest;
import com.hanghai.kchtg.cangben.dto.cangcan.CreateCangCanRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

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

    // ── CreateCangCanRequest GPS tests ────────────────────────────────────────

    @Test
    @DisplayName("CreateCangCanRequest — viDo set, kinhDo null → gpsPaired violation")
    void createCangCanRequest_gpsPartial_viDoSetKinhDoNull_invalid() {
        CreateCangCanRequest request = new CreateCangCanRequest();
        request.setMaCangCan("CC-001");
        request.setTenCangCan("Cảng cạn test");
        request.setViDo(new BigDecimal("21.028"));
        request.setKinhDo(null); // partial — triggers violation

        Set<ConstraintViolation<CreateCangCanRequest>> violations = validator.validate(request);

        boolean hasGpsPairedViolation = violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().contains("gpsPaired"));
        assertTrue(hasGpsPairedViolation,
                "Expected gpsPaired violation but got: " + violations);
    }

    @Test
    @DisplayName("CreateCangCanRequest — both GPS null → valid (no gpsPaired violation)")
    void createCangCanRequest_bothGpsNull_valid() {
        CreateCangCanRequest request = new CreateCangCanRequest();
        request.setMaCangCan("CC-001");
        request.setTenCangCan("Cảng cạn test");
        request.setViDo(null);
        request.setKinhDo(null);

        Set<ConstraintViolation<CreateCangCanRequest>> violations = validator.validate(request);

        boolean hasGpsPairedViolation = violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().contains("gpsPaired"));
        assertFalse(hasGpsPairedViolation,
                "Expected no gpsPaired violation but got: " + violations);
    }

    @Test
    @DisplayName("CreateCangCanRequest — both GPS set → valid (no gpsPaired violation)")
    void createCangCanRequest_bothGpsSet_valid() {
        CreateCangCanRequest request = new CreateCangCanRequest();
        request.setMaCangCan("CC-001");
        request.setTenCangCan("Cảng cạn test");
        request.setViDo(new BigDecimal("21.028"));
        request.setKinhDo(new BigDecimal("105.854"));

        Set<ConstraintViolation<CreateCangCanRequest>> violations = validator.validate(request);

        boolean hasGpsPairedViolation = violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().contains("gpsPaired"));
        assertFalse(hasGpsPairedViolation,
                "Expected no gpsPaired violation but got: " + violations);
    }

    // ── CreateCangBienRequest GPS tests ───────────────────────────────────────

    @Test
    @DisplayName("CreateCangBienRequest — viDo set, kinhDo null → gpsPaired violation")
    void createCangBienRequest_gpsPartial_viDoSet_kinhDoNull_invalid() {
        CreateCangBienRequest request = new CreateCangBienRequest();
        request.setMaCang("CB-001");
        request.setTenCang("Cảng biển test");
        request.setViDo(new BigDecimal("20.845"));
        request.setKinhDo(null); // partial — triggers violation

        Set<ConstraintViolation<CreateCangBienRequest>> violations = validator.validate(request);

        boolean hasGpsPairedViolation = violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().contains("gpsPaired"));
        assertTrue(hasGpsPairedViolation,
                "Expected gpsPaired violation but got: " + violations);
    }

    @Test
    @DisplayName("CreateCangBienRequest — both GPS set → valid (no gpsPaired violation)")
    void createCangBienRequest_bothGpsSet_valid() {
        CreateCangBienRequest request = new CreateCangBienRequest();
        request.setMaCang("CB-001");
        request.setTenCang("Cảng biển test");
        request.setViDo(new BigDecimal("20.845"));
        request.setKinhDo(new BigDecimal("106.688"));

        Set<ConstraintViolation<CreateCangBienRequest>> violations = validator.validate(request);

        boolean hasGpsPairedViolation = violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().contains("gpsPaired"));
        assertFalse(hasGpsPairedViolation,
                "Expected no gpsPaired violation but got: " + violations);
    }
}
