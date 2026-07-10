package com.hanghai.kchtg.mapicon.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum MapSymbolStatus {
    INACTIVE(0),
    ACTIVE(1),
    DEPRECATED(2);

    private final int value;

    MapSymbolStatus(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    @JsonCreator
    public static MapSymbolStatus fromString(String name) {
        if (name == null) return null;
        try {
            if (name.trim().matches("^\\d+$")) {
                int val = Integer.parseInt(name.trim());
                for (MapSymbolStatus st : values()) {
                    if (st.getValue() == val) return st;
                }
            }
            return MapSymbolStatus.valueOf(name.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Trạng thái ký hiệu không hợp lệ: " + name);
        }
    }

    @JsonValue
    public String toJson() {
        return this.name();
    }
}
