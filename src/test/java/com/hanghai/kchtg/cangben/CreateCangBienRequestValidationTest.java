package com.hanghai.kchtg.cangben;

import com.hanghai.kchtg.cangben.dto.cangbien.CreateCangBienRequest;
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
 * Bean Validation tests for CreateCangBienRequest (F-008).
 * Verifies GPS range constraints and positive-area constraint.
 */
@DisplayName("CreateCangBienRequest Bean Validation — F-008")
class CreateCangBienRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    private CreateCangBienRequest validRequest() {
        CreateCangBienRequest req = new CreateCangBienRequest();
        req.setMaCang("CB-TEST");
        req.setTenCang("Cảng hợp lệ");
        req.setViDo(new BigDecimal("20.845"));
        req.setKinhDo(new BigDecimal("106.688"));
        req.setDienTich(new BigDecimal("1000.00"));
        return req;
    }

    // ── GPS latitude ───────────────────────────────────────────────────────

    @Test
    @DisplayName("F-008: valid request — no violations")
    void validRequest_noViolations() {
        Set<ConstraintViolation<CreateCangBienRequest>> violations = validator.validate(validRequest());
        assertTrue(violations.isEmpty(), "Expected no violations for valid request but got: " + violations);
    }

    @Test
    @DisplayName("F-008: latitude = 91 — violation")
    void latitude_91_violation() {
        CreateCangBienRequest req = validRequest();
        req.setViDo(new BigDecimal("91"));

        Set<ConstraintViolation<CreateCangBienRequest>> violations = validator.validate(req);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("viDo")),
                "Expected violation on viDo");
    }

    @Test
    @DisplayName("F-008: latitude = -91 — violation")
    void latitude_negative91_violation() {
        CreateCangBienRequest req = validRequest();
        req.setViDo(new BigDecimal("-91"));

        Set<ConstraintViolation<CreateCangBienRequest>> violations = validator.validate(req);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("viDo")));
    }

    @Test
    @DisplayName("F-008: latitude = 90 — boundary accepted")
    void latitude_90_accepted() {
        CreateCangBienRequest req = validRequest();
        req.setViDo(new BigDecimal("90"));

        Set<ConstraintViolation<CreateCangBienRequest>> violations = validator.validate(req);

        assertTrue(violations.stream().noneMatch(v -> v.getPropertyPath().toString().equals("viDo")),
                "Latitude 90 should be valid");
    }

    @Test
    @DisplayName("F-008: latitude = -90 — boundary accepted")
    void latitude_negative90_accepted() {
        CreateCangBienRequest req = validRequest();
        req.setViDo(new BigDecimal("-90"));

        Set<ConstraintViolation<CreateCangBienRequest>> violations = validator.validate(req);

        assertTrue(violations.stream().noneMatch(v -> v.getPropertyPath().toString().equals("viDo")));
    }

    // ── GPS longitude ──────────────────────────────────────────────────────

    @Test
    @DisplayName("F-008: longitude = 181 — violation")
    void longitude_181_violation() {
        CreateCangBienRequest req = validRequest();
        req.setKinhDo(new BigDecimal("181"));

        Set<ConstraintViolation<CreateCangBienRequest>> violations = validator.validate(req);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("kinhDo")));
    }

    @Test
    @DisplayName("F-008: longitude = -181 — violation")
    void longitude_negative181_violation() {
        CreateCangBienRequest req = validRequest();
        req.setKinhDo(new BigDecimal("-181"));

        Set<ConstraintViolation<CreateCangBienRequest>> violations = validator.validate(req);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("kinhDo")));
    }

    @Test
    @DisplayName("F-008: longitude = 180 — boundary accepted")
    void longitude_180_accepted() {
        CreateCangBienRequest req = validRequest();
        req.setKinhDo(new BigDecimal("180"));

        Set<ConstraintViolation<CreateCangBienRequest>> violations = validator.validate(req);

        assertTrue(violations.stream().noneMatch(v -> v.getPropertyPath().toString().equals("kinhDo")));
    }

    // ── Area (dienTich) ────────────────────────────────────────────────────

    @Test
    @DisplayName("F-008: dienTich = 0 — violation (must be > 0)")
    void dienTich_zero_violation() {
        CreateCangBienRequest req = validRequest();
        req.setDienTich(BigDecimal.ZERO);

        Set<ConstraintViolation<CreateCangBienRequest>> violations = validator.validate(req);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("dienTich")));
    }

    @Test
    @DisplayName("F-008: dienTich = -1 — violation (must be > 0)")
    void dienTich_negative_violation() {
        CreateCangBienRequest req = validRequest();
        req.setDienTich(new BigDecimal("-1"));

        Set<ConstraintViolation<CreateCangBienRequest>> violations = validator.validate(req);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("dienTich")));
    }

    @Test
    @DisplayName("F-008: dienTich = 0.01 — accepted (positive)")
    void dienTich_smallPositive_accepted() {
        CreateCangBienRequest req = validRequest();
        req.setDienTich(new BigDecimal("0.01"));

        Set<ConstraintViolation<CreateCangBienRequest>> violations = validator.validate(req);

        assertTrue(violations.stream().noneMatch(v -> v.getPropertyPath().toString().equals("dienTich")));
    }

    @Test
    @DisplayName("F-008: dienTich = null — accepted (optional field)")
    void dienTich_null_accepted() {
        CreateCangBienRequest req = validRequest();
        req.setDienTich(null);

        Set<ConstraintViolation<CreateCangBienRequest>> violations = validator.validate(req);

        assertTrue(violations.stream().noneMatch(v -> v.getPropertyPath().toString().equals("dienTich")));
    }

    // ── Required fields ────────────────────────────────────────────────────

    @Test
    @DisplayName("F-008: maCang blank — violation")
    void maCang_blank_violation() {
        CreateCangBienRequest req = validRequest();
        req.setMaCang("  ");

        Set<ConstraintViolation<CreateCangBienRequest>> violations = validator.validate(req);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("maCang")));
    }

    @Test
    @DisplayName("F-008: tenCang blank — violation")
    void tenCang_blank_violation() {
        CreateCangBienRequest req = validRequest();
        req.setTenCang("");

        Set<ConstraintViolation<CreateCangBienRequest>> violations = validator.validate(req);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("tenCang")));
    }
}
