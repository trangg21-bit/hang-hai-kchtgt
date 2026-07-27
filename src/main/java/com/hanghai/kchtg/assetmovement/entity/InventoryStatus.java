package com.hanghai.kchtg.assetmovement.entity;

import com.fasterxml.jackson.annotation.JsonValue;

public enum InventoryStatus {
    UNCHECKED(0),
    CHECKED(1),
    SURPLUS(2),
    MISSING(3);

    private final int value;

    InventoryStatus(int value) {
        this.value = value;
    }

    @JsonValue
    public int getValue() {
        return value;
    }
}
