package com.hanghai.kchtg.tai.entity;

/**
 * Enum cho loại đài thông tin.
 * Phân loại 5 trạm đài theo tiêu chuẩn thông tin hàng hải.
 */
public enum TaiType {
    COASTAL("Đài thông tin duyên hải"),
    INMARSAT("Đài Inmarsat"),
    COSPAS_SARSAT("Đài Cospas-Sarsat"),
    LRIT("Đài LRIT"),
    HANOI_HAI("Đài TT hàng hải HN");

    private final String description;

    TaiType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
