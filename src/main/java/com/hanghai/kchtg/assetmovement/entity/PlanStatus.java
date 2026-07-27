package com.hanghai.kchtg.assetmovement.entity;

import com.fasterxml.jackson.annotation.JsonValue;

public enum PlanStatus {
    PENDING(0),
    APPROVED(1),
    IN_PROGRESS(2),
    COMPLETED(3),
    REJECTED(4);

    private final int value;

    PlanStatus(int value) {
        this.value = value;
    }

    @JsonValue
    public int getValue() {
        return value;
    }
}
