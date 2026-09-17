package com.hanghai.kchtg.common.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class EntityUpdateUtilsTest {

    @Test
    @DisplayName("Both null or null vs empty string are equal")
    void testNullAndEmpty() {
        assertTrue(EntityUpdateUtils.areEqual(null, null));
        assertTrue(EntityUpdateUtils.areEqual(null, ""));
        assertTrue(EntityUpdateUtils.areEqual("", null));
        assertTrue(EntityUpdateUtils.areEqual("   ", null));
        assertTrue(EntityUpdateUtils.areEqual(null, "   "));
        assertFalse(EntityUpdateUtils.areEqual(null, "abc"));
        assertFalse(EntityUpdateUtils.areEqual("abc", null));
    }

    @Test
    @DisplayName("BigDecimal with different scale are equal")
    void testBigDecimalScale() {
        assertTrue(EntityUpdateUtils.areEqual(new BigDecimal("5555.0000"), new BigDecimal("5555")));
        assertTrue(EntityUpdateUtils.areEqual(new BigDecimal("25.0"), new BigDecimal("25.0000")));
        assertFalse(EntityUpdateUtils.areEqual(new BigDecimal("25.0"), new BigDecimal("25.1")));
    }

    @Test
    @DisplayName("Numeric strings with scale or comma differences are equal")
    void testNumericStrings() {
        assertTrue(EntityUpdateUtils.areEqual("5555.0000", "5555"));
        assertTrue(EntityUpdateUtils.areEqual("5,555", "5555"));
        assertTrue(EntityUpdateUtils.areEqual("5,555.00", "5555"));
        assertTrue(EntityUpdateUtils.areEqual("5,555", "5,555"));
        assertTrue(EntityUpdateUtils.areEqual("25.0000", "25"));
        assertFalse(EntityUpdateUtils.areEqual("5555", "5556"));
    }

    @Test
    @DisplayName("Number vs String numeric comparisons are equal")
    void testNumberVsString() {
        assertTrue(EntityUpdateUtils.areEqual(new BigDecimal("5555.0000"), "5555"));
        assertTrue(EntityUpdateUtils.areEqual("5555", new BigDecimal("5555.0000")));
        assertTrue(EntityUpdateUtils.areEqual(new BigDecimal("5555"), "5,555"));
        assertTrue(EntityUpdateUtils.areEqual(25, "25.0000"));
        assertTrue(EntityUpdateUtils.areEqual("25.0000", 25));
    }

    @Test
    @DisplayName("Standard string comparisons work as expected")
    void testStandardStrings() {
        assertTrue(EntityUpdateUtils.areEqual("Trạm Radar 1", "  Trạm Radar 1  "));
        assertFalse(EntityUpdateUtils.areEqual("Trạm Radar 1", "Trạm Radar 2"));
    }
}
