package com.hanghai.kchtg.assetmovement.entity;

import com.fasterxml.jackson.annotation.JsonValue;

public enum InventoryType {
    PERIODIC(0),
    UNEXPECTED(1);

    private final int value;

    InventoryType(int value) {
        this.value = value;
    }

    @JsonValue
    public int getValue() {
        return value;
    }
}
