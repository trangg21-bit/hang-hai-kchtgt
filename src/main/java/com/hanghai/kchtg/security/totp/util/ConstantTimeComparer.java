package com.hanghai.kchtg.security.totp.util;

/**
 * Constant-time byte-array comparator.
 * <p>
 * Uses XOR accumulation over the full array length so it never
 * short-circuits on the first mismatch - preventing timing side-channels.
 * </p>
 */
public final class ConstantTimeComparer {

    private ConstantTimeComparer() {
        // utility class
    }

    /**
     * Returns {@code true} if and only if the two arrays are equal,
     * performing the comparison in constant time.
     *
     * @param a first array
     * @param b second array
     * @return {@code true} if equal
     */
    public static boolean equals(byte[] a, byte[] b) {
        if (a.length != b.length) {
            return false;
        }

        int result = 0;
        for (int i = 0; i < a.length; i++) {
            result |= a[i] ^ b[i];
        }
        return result == 0;
    }
}