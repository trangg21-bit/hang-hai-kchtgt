package com.hanghai.kchtg.assetmovement.entity;

import com.fasterxml.jackson.annotation.JsonValue;

public enum AssetStatus {
    PENDING(0),
    MANAGED(1),
    CANCELED(2),
    DISSOLVED(3),
    DEMOLISHED(4),
    DECOMMISSIONED(5);

    private final int value;

    AssetStatus(int value) {
        this.value = value;
    }

    @JsonValue
    public int getValue() {
        return value;
    }
}
