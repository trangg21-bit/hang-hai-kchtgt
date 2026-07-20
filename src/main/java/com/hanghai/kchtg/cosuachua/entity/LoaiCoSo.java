package com.hanghai.kchtg.cosuachua.entity;

public enum LoaiCoSo {
    CS_SUA_CHUA(1, "Cơ sở sửa chữa"),
    CS_DONG_TAU(2, "Cơ sở đóng tàu"),
    CS_SUA_CHUA_DONG_TAU(3, "Cơ sở sửa chữa & đóng tàu"),
    KHAC(4, "Khác");

    private final int value;
    private final String displayName;

    LoaiCoSo(int value, String displayName) {
        this.value = value;
        this.displayName = displayName;
    }

    public int getValue() {
        return value;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static LoaiCoSo fromValue(int value) {
        for (LoaiCoSo type : values()) {
            if (type.getValue() == value) {
                return type;
            }
        }
        return KHAC; // Safe default
    }
}
