package com.hanghai.kchtg.gis.search.dto;

import java.util.UUID;

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
    private String orgName;
    private String kchtTypeLabel;
    private String location;
    private String diaChiChiTiet;    private String geometryType;
    private String coordinates;
}
