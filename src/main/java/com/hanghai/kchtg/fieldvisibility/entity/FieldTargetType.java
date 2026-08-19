package com.hanghai.kchtg.fieldvisibility.entity;

/**
 * Target of a field-visibility rule.
 * <p>
 * Declaration order == ordinal == DDL value (SMALLINT): 0=FIELD 1=GROUP 2=ALL.
 * Append-only: never reorder or insert mid-list (threat-model F-07).
 * </p>
 */
public enum FieldTargetType {
    /** A single JSON property name in {@code targetKey}. */
    FIELD,
    /** A named group of JSON properties in {@code targetKey}. */
    GROUP,
    /** Every field of the resource ({@code targetKey} is {@code '*'}). */
    ALL
}
