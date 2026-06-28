package com.hanghai.kchtg.accesslog.enums;

/**
 * Structured log type categories defined in the BA spec (5 groups).
 */
public enum LogType {

    /** User visits to pages, API endpoints, and system resources. */
    ACCESS("access"),

    /** Authentication events: login success / failure. */
    LOGIN("login"),

    /** System errors, unhandled exceptions. */
    ERROR("error"),

    /** Account lifecycle: create, update, lock/unlock, password reset. */
    ACCOUNT("account"),

    /** System configuration changes. */
    CONFIGURATION("configuration");

    private final String value;

    LogType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    /**
     * Resolve a string value to the matching enum constant.
     */
    public static LogType fromValue(String value) {
        for (LogType type : values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        return ACCESS; // safe default
    }
}
