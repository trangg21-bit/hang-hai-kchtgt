package com.hanghai.kchtg.common.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ApprovalLevel {
    LEVEL_0(0),
    LEVEL_1(1),
    LEVEL_2(2);

    private final int value;

    ApprovalLevel(int value) {
        this.value = value;
    }

    @JsonValue
    public int getValue() {
        return value;
    }

    @JsonCreator
    public static ApprovalLevel fromInt(Integer val) {
        if (val == null) return LEVEL_0;
        switch (val) {
            case 1:
                return LEVEL_1;
            case 2:
                return LEVEL_2;
            default:
                return LEVEL_0;
        }
    }
}
