package com.hanghai.kchtg.common.util;

import java.math.BigDecimal;
import java.util.Locale;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Compares WKT coordinate values by geometry content rather than their editor
 * serialization. This prevents audit entries caused only by formatting.
 */
public final class WktCoordinateUtils {

    private static final Pattern WKT_NUMBER = Pattern.compile("[-+]?(?:\\d+\\.?\\d*|\\.\\d+)(?:[eE][-+]?\\d+)?");

    private WktCoordinateUtils() {
    }

    public static boolean coordinatesEqual(String first, String second) {
        return Objects.equals(normalize(first), normalize(second));
    }

    static String normalize(String coordinates) {
        if (coordinates == null || coordinates.isBlank()) {
            return null;
        }

        String compact = coordinates.trim()
                .replaceFirst("(?i)^SRID=\\d+\\s*;", "")
                .replaceAll("\\s+", " ")
                .replaceAll("\\s*([(),])\\s*", "$1")
                .toUpperCase(Locale.ROOT);
        Matcher matcher = WKT_NUMBER.matcher(compact);
        StringBuffer normalized = new StringBuffer();
        while (matcher.find()) {
            String numeric = new BigDecimal(matcher.group()).stripTrailingZeros().toPlainString();
            matcher.appendReplacement(normalized, Matcher.quoteReplacement(numeric));
        }
        matcher.appendTail(normalized);
        return normalized.toString();
    }
}
