package com.hanghai.kchtg.assetmovement.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
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

    public int getValue() {
        return value;
    }

    @JsonCreator
    public static AssetStatus fromValue(Object input) {
        if (input == null) return null;
        String str = input.toString().trim();
        if (str.matches("^\\d+$")) {
            int num = Integer.parseInt(str);
            for (AssetStatus status : values()) {
                if (status.value == num) return status;
            }
        }
        for (AssetStatus status : values()) {
            if (status.name().equalsIgnoreCase(str)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Trạng thái tài sản không hợp lệ: " + input);
    }

    @JsonValue
    public String toJson() {
        return this.name();
    }
}
