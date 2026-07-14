package com.hanghai.kchtg.gis.spatial.entity;

import lombok.Getter;

@Getter
public enum GisGeometryType {
    POINT(1, "Điểm"),
    LINE(2, "Đường"),
    POLYGON(3, "Vùng");

    private final int value;
    private final String label;

    GisGeometryType(int value, String label) {
        this.value = value;
        this.label = label;
    }
}
