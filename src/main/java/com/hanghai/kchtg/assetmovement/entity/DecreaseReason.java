package com.hanghai.kchtg.assetmovement.entity;

import com.fasterxml.jackson.annotation.JsonValue;

public enum DecreaseReason {
    DISSOLVED(0),
    DAMAGED(1),
    DEMOLISHED(2),
    EXPIRED(3);

    private final int value;

    DecreaseReason(int value) {
        this.value = value;
    }

    @JsonValue
    public int getValue() {
        return value;
    }
}
