package com.hanghai.kchtg.assetmovement.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum InfraAssetType {
    BUOY(0),
    RADAR_STATION(1),
    LIGHTHOUSE(2),
    AUXILIARY_EQUIPMENT(3),
    PORT_TERMINAL(4),
    LRIT_STATION(5),
    TTDH_STATION(6),
    INMARSAT_STATION(7),
    COSPAS_SARSAT_STATION(8),
    TTXLTT_STATION(9),
    DRY_PORT(10),
    TRANSFER_AREA(11),
    STORM_SHELTER(12),
    BUOY_BERTH(13),
    PIER(14),
    ANCHORAGE(15),
    NAVIGATION_CHANNEL(16),
    DIKE_REVETMENT(17);

    private final int value;

    InfraAssetType(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    @JsonCreator
    public static InfraAssetType fromValue(Object input) {
        if (input == null) return null;
        String str = input.toString().trim();
        if (str.matches("^\\d+$")) {
            int num = Integer.parseInt(str);
            for (InfraAssetType type : values()) {
                if (type.value == num) return type;
            }
        }
        for (InfraAssetType type : values()) {
            if (type.name().equalsIgnoreCase(str)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Loại tài sản không hợp lệ: " + input);
    }

    @JsonValue
    public String toJson() {
        return this.name();
    }
}

