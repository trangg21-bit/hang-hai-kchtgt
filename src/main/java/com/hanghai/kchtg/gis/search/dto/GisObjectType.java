package com.hanghai.kchtg.gis.search.dto;

import lombok.Getter;

@Getter
public enum GisObjectType {
    POINT("POINT"),
    LINE("LINE"),
    POLYGON("POLYGON");

    private final String dbValue;

    GisObjectType(String dbValue) {
        this.dbValue = dbValue;
    }
}
