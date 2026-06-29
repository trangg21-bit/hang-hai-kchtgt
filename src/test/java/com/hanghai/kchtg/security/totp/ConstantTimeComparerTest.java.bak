package com.hanghai.kchtg.security.totp;

import com.hanghai.kchtg.security.totp.util.ConstantTimeComparer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit tests for {@link ConstantTimeComparer}.
 */
class ConstantTimeComparerTest {

    @Test
    @DisplayName("equals returns true for identical arrays")
    void testEqualsSame() {
        byte[] a = new byte[]{1, 2, 3, 4, 5};
        byte[] b = new byte[]{1, 2, 3, 4, 5};
        assertTrue(ConstantTimeComparer.equals(a, b));
    }

    @Test
    @DisplayName("equals returns false for different arrays")
    void testEqualsDifferent() {
        byte[] a = new byte[]{1, 2, 3, 4, 5};
        byte[] b = new byte[]{1, 2, 3, 4, 6};
        assertFalse(ConstantTimeComparer.equals(a, b));
    }

    @Test
    @DisplayName("equals returns false for different lengths")
    void testEqualsDifferentLength() {
        byte[] a = new byte[]{1, 2, 3};
        byte[] b = new byte[]{1, 2, 3, 4};
        assertFalse(ConstantTimeComparer.equals(a, b));
    }

    @Test
    @DisplayName("equals returns true for empty arrays")
    void testEqualsEmpty() {
        byte[] a = new byte[0];
        byte[] b = new byte[0];
        assertTrue(ConstantTimeComparer.equals(a, b));
    }

    @Test
    @DisplayName("equals returns true for all-zeros arrays")
    void testEqualsZeros() {
        byte[] a = new byte[256];
        byte[] b = new byte[256];
        assertTrue(ConstantTimeComparer.equals(a, b));
    }

    @Test
    @DisplayName("equals returns true for random data")
    void testEqualsRandomData() {
        byte[] data = new byte[]{(byte) 0xAB, (byte) 0xCD, (byte) 0xEF, (byte) 0x01};
        assertTrue(ConstantTimeComparer.equals(data, data));
    }

    @Test
    @DisplayName("comparison does not short-circuit on first byte mismatch")
    void testNoShortCircuit() {
        // Two arrays that differ only in the last byte
        byte[] a = new byte[]{0, 0, 0, 0, 1};
        byte[] b = new byte[]{0, 0, 0, 0, 2};
        assertFalse(ConstantTimeComparer.equals(a, b));
    }
}
