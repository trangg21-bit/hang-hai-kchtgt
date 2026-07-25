package com.hanghai.kchtg.assetmovement.entity;

import com.fasterxml.jackson.annotation.JsonValue;

public enum InfraAssetType {
    BUOY(0),
    RADAR_STATION(1),
    LIGHTHOUSE(2),
    AUXILIARY_EQUIPMENT(3);

    private final int value;

    InfraAssetType(int value) {
        this.value = value;
    }

    @JsonValue
    public int getValue() {
        return value;
    }
}
