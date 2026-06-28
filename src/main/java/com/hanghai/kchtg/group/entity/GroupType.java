package com.hanghai.kchtg.group.entity;

/**
 * Loai nhom nguoi dung (Group Type).
 */
public enum GroupType {

    /** Nhom don vi to chuc. */
    DEPARTMENT,

    /** Nhom du an. */
    PROJECT,

    /** Nhom co dinh (do nguoi dung tu tao). */
    CUSTOM;

    /**
     * Parse string value to GroupType enum.
     * Case-insensitive matching.
     *
     * @param value string value
     * @return GroupType enum
     * @throws IllegalArgumentException if value is not a valid group type
     */
    public static GroupType fromValue(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Group type cannot be null or empty");
        }
        try {
            return valueOf(value.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                "Invalid group type: '" + value + "'. Must be one of: department, project, custom");
        }
    }

    /**
     * Convert to lowercase string (for JSON serialization).
     */
    public String toValue() {
        return name().toLowerCase();
    }
}
