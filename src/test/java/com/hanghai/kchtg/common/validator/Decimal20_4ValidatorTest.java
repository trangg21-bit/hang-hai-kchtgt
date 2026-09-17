package com.hanghai.kchtg.common.validator;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.BigInteger;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class Decimal20_4ValidatorTest {

    private Decimal20_4Validator validator;

    @BeforeEach
    void setUp() {
        validator = new Decimal20_4Validator();
    }

    @Test
    void testNullAndEmpty() {
        assertTrue(validator.isValid(null, null));
        assertTrue(validator.isValid("", null));
        assertTrue(validator.isValid("   ", null));
    }

    @Test
    void testNoDot_Max20Digits() {
        // 1 digit
        assertTrue(validator.isValid("0", null));
        assertTrue(validator.isValid(0, null));
        assertTrue(validator.isValid(123456L, null));

        // 20 digits
        assertTrue(validator.isValid("99999999999999999999", null));
        assertTrue(validator.isValid(new BigInteger("99999999999999999999"), null));
        assertTrue(validator.isValid(new BigDecimal("99999999999999999999"), null));

        // 20 digits with negative sign (21 characters, but only 20 digits)
        assertTrue(validator.isValid("-99999999999999999999", null));
        assertTrue(validator.isValid(new BigDecimal("-99999999999999999999"), null));

        // 20 digits with positive sign
        assertTrue(validator.isValid("+99999999999999999999", null));

        // 21 digits: MUST BE REJECTED
        assertFalse(validator.isValid("100000000000000000000", null));
        assertFalse(validator.isValid("-100000000000000000000", null));
        assertFalse(validator.isValid(new BigDecimal("100000000000000000000"), null));
        assertFalse(validator.isValid(new BigInteger("100000000000000000000"), null));
    }

    @Test
    void testWithDot_Max16BeforeDot_Max4AfterDot() {
        // 16 integer digits, 4 fractional digits
        assertTrue(validator.isValid("1234567890123456.1234", null));
        assertTrue(validator.isValid(new BigDecimal("1234567890123456.1234"), null));

        // 16 integer digits with minus sign, 4 fractional digits
        assertTrue(validator.isValid("-1234567890123456.1234", null));
        assertTrue(validator.isValid(new BigDecimal("-1234567890123456.1234"), null));

        // 1 integer digit, 1 fractional digit
        assertTrue(validator.isValid("0.5", null));
        assertTrue(validator.isValid("12.34", null));
        assertTrue(validator.isValid(12.34, null));

        // > 16 integer digits: MUST BE REJECTED
        assertFalse(validator.isValid("12345678901234567.1234", null));
        assertFalse(validator.isValid(new BigDecimal("12345678901234567.1234"), null));

        // > 4 fractional digits: MUST BE REJECTED
        assertFalse(validator.isValid("12.12345", null));
        assertFalse(validator.isValid(new BigDecimal("12.12345"), null));
        assertFalse(validator.isValid("1234567890123456.12345", null));
    }

    @Test
    void testInvalidCharacters() {
        assertFalse(validator.isValid("abc", null));
        assertFalse(validator.isValid("12.34.56", null));
        assertFalse(validator.isValid("--123", null));
        assertFalse(validator.isValid("12..34", null));
        assertFalse(validator.isValid("12a.34", null));
        assertFalse(validator.isValid(".", null));
    }
}