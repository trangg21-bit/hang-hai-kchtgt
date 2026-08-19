package com.hanghai.kchtg.fieldvisibility.entity;

/**
 * Effect applied to a matching field.
 * <p>
 * Declaration order == ordinal == DDL value (SMALLINT): 0=HIDE 1=READONLY.
 * Append-only: never reorder or insert mid-list (threat-model F-07).
 * </p>
 */
public enum FieldEffect {
    /** Strip the field from the serialized response. */
    HIDE,
    /** Keep the field but expose it as read-only (write rejection is out of PoC scope). */
    READONLY,
    /** Explicitly allow the field (overrides lower-specificity/priority HIDE rules). */
    ALLOW
}
