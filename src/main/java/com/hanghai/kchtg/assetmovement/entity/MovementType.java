package com.hanghai.kchtg.assetmovement.entity;

import com.fasterxml.jackson.annotation.JsonValue;

public enum MovementType {
    INCREASE(0),
    DECREASE(1),
    PROCESSING(2),
    INVENTORY(3);

    private final int value;

    MovementType(int value) {
        this.value = value;
    }

    @JsonValue
    public int getValue() {
        return value;
    }
}
