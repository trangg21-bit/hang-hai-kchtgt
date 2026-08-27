package com.hanghai.kchtg.gis.spatial.entity;

import lombok.Getter;

@Getter
public enum GisSpatialObjectType {
    // Point types (10-14)
    POINT_PORT(10, "Cảng"),
    POINT_LIGHTHOUSE(11, "Hải đăng/Đèn biển"),
    POINT_BUOY(12, "Phao tiêu"),
    POINT_BEACON(13, "Tiêu"),
    POINT_OTHER(14, "Điểm khác"),

    // Line types (20-23)
    LINE_COASTLINE(20, "Đường bờ biển"),
    LINE_SHIPPING_ROUTE(21, "Luồng hàng hải"),
    LINE_WATERWAY(22, "Tuyến đường thủy"),
    LINE_OTHER(23, "Đường khác"),

    // Polygon types (30-35)
    POLYGON_WATER_ZONE(30, "Vùng nước cảng biển"),
    POLYGON_ANCHORAGE(31, "Khu neo đậu"),
    POLYGON_TRANSSHIPMENT(36, "Khu chuyển tải"),
    POLYGON_STORM_SHELTER(32, "Khu tránh trú bão"),
    POLYGON_BUOY_BERTH(37, "Bến phao"),
    POLYGON_RESTRICTED_AREA(33, "Vùng cấm/Hạn chế"),
    POLYGON_LIMITED_ZONE(34, "Khu vực giới hạn"),
    POLYGON_OTHER(35, "Vùng khác");

    private final int value;
    private final String label;

    GisSpatialObjectType(int value, String label) {
        this.value = value;
        this.label = label;
    }
}
