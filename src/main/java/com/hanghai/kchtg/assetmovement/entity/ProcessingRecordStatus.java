package com.hanghai.kchtg.assetmovement.entity;

import com.fasterxml.jackson.annotation.JsonValue;

public enum ProcessingRecordStatus {
    PENDING(0),
    APPROVED(1),
    REJECTED(2);

    private final int value;

    ProcessingRecordStatus(int value) {
        this.value = value;
    }

    @JsonValue
    public int getValue() {
        return value;
    }
}
