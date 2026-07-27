package com.hanghai.kchtg.shiprepairfacility.entity;

public enum FacilityType {
    REPAIR(1, "Cơ sở sửa chữa"),
    SHIPBUILDING(2, "Cơ sở đóng tàu"),
    REPAIR_AND_SHIPBUILDING(3, "Cơ sở sửa chữa & đóng tàu"),
    KHAC(4, "Khác");

    private final int value;
    private final String displayName;

    FacilityType(int value, String displayName) {
        this.value = value;
        this.displayName = displayName;
    }

    public int getValue() {
        return value;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static FacilityType fromValue(int value) {
        for (FacilityType type : values()) {
            if (type.getValue() == value) {
                return type;
            }
        }
        return KHAC; // Safe default
    }
}
