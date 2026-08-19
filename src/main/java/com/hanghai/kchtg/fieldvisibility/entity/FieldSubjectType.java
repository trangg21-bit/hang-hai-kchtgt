package com.hanghai.kchtg.fieldvisibility.entity;

/**
 * Subject of a field-visibility rule.
 * <p>
 * Declaration order == ordinal == DDL value (SMALLINT). Append-only:
 * never reorder or insert mid-list (threat-model F-07).
 * </p>
 */
public enum FieldSubjectType {
    /** Permission code (e.g. {@code vts:read}). */
    PERMISSION,
    /** User group UUID. */
    GROUP,
    /** User UUID. */
    USER
}
