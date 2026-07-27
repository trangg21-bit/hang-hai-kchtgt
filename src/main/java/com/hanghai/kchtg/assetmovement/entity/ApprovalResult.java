package com.hanghai.kchtg.assetmovement.entity;

import com.fasterxml.jackson.annotation.JsonValue;

public enum ApprovalResult {
    APPROVED(0),
    REJECTED(1);

    private final int value;

    ApprovalResult(int value) {
        this.value = value;
    }

    @JsonValue
    public int getValue() {
        return value;
    }
}
