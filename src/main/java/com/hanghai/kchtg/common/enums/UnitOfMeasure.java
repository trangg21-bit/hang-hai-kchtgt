package com.hanghai.kchtg.common.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Đơn vị tính cho thiết bị KCHTGT Hàng hải (1=Bộ, 2=Cái, 3=Hệ thống, 4=Trạm).
 */
public enum UnitOfMeasure {
    SET(1, "Bộ"),
    PIECE(2, "Cái"),
    SYSTEM(3, "Hệ thống"),
    STATION(4, "Trạm");

    private final int value;
    private final String label;

    UnitOfMeasure(int value, String label) {
        this.value = value;
        this.label = label;
    }

    @JsonValue
    public int getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }

    @JsonCreator
    public static UnitOfMeasure fromValue(Object input) {
        if (input == null) return null;
        if (input instanceof Number) {
            int val = ((Number) input).intValue();
            for (UnitOfMeasure u : values()) {
                if (u.value == val) return u;
            }
            return SET;
        }
        String str = input.toString().trim();
        if (str.isEmpty()) return null;
        try {
            int val = Integer.parseInt(str);
            for (UnitOfMeasure u : values()) {
                if (u.value == val) return u;
            }
        } catch (NumberFormatException ignored) {}

        for (UnitOfMeasure u : values()) {
            if (u.name().equalsIgnoreCase(str) || u.label.equalsIgnoreCase(str)) {
                return u;
            }
        }
        return SET;
    }
}
