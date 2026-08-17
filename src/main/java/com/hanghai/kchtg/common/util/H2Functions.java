package com.hanghai.kchtg.common.util;

import java.text.Normalizer;

/**
 * H2 in-memory database helper functions for unit tests.
 * Provides immutable_unaccent alias compatible with PostgreSQL.
 */
public class H2Functions {

    public static String unaccent(String input) {
        if (input == null) {
            return null;
        }
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{M}+", "")
                .replace('\u0111', 'd')
                .replace('\u0110', 'D');
    }
}
