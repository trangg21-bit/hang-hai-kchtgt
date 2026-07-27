package com.hanghai.kchtg.assetmovement.entity;

import com.fasterxml.jackson.annotation.JsonValue;

public enum ProcessingType {
    TRANSFER(0),
    HANDOVER(1),
    LIQUIDATION(2),
    DEMOLITION(3);

    private final int value;

    ProcessingType(int value) {
        this.value = value;
    }

    @JsonValue
    public int getValue() {
        return value;
    }
}
