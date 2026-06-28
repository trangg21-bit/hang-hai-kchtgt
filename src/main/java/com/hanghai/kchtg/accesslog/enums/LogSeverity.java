package com.hanghai.kchtg.accesslog.enums;

/**
 * Severity levels for access-log entries.
 * Auto-assigned by the interceptor based on action outcome.
 */
public enum LogSeverity {

    /** Default / informational events. */
    INFO("info"),

    /** Warning-level events (e.g. login failures). */
    WARNING("warning"),

    /** Error-level events (e.g. system errors). */
    ERROR("error"),

    /** Critical events (e.g. security breaches). */
    CRITICAL("critical");

    private final String value;

    LogSeverity(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    /**
     * Resolve a string value to the matching enum constant.
     */
    public static LogSeverity fromValue(String value) {
        for (LogSeverity sev : values()) {
            if (sev.value.equalsIgnoreCase(value)) {
                return sev;
            }
        }
        return INFO; // safe default
    }
}
