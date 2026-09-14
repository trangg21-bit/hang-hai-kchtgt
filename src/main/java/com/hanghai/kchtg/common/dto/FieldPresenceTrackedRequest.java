package com.hanghai.kchtg.common.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.HashSet;
import java.util.Set;

/**
 * Keeps PATCH-style compatibility while allowing JSON null to mean "clear".
 */
public abstract class FieldPresenceTrackedRequest {

    @JsonIgnore
    private final Set<String> presentFields = new HashSet<>();

    public final void markFieldPresent(String fieldName) {
        presentFields.add(fieldName);
    }

    public final boolean isFieldPresent(String fieldName) {
        return presentFields.contains(fieldName);
    }
}
