package com.hanghai.kchtg.gis.search.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KchtGisSearchResult {
    private String id;
    private String name;
    private String code;
    private UUID orgUnitId;
    private String orgName;
    private InfrastructureType infrastructureType;
    private String kchtTypeLabel;
    private Integer provinceId;
    private String location;
    private String diaChiChiTiet;
    private String geometryType;
    private String coordinates;
    private Double latitude;
    private Double longitude;
}
