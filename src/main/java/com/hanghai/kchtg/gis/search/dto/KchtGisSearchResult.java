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
    private UUID id;
    private String name;
    private String ma;
    private String orgName;
    private String kchtTypeLabel;
    private String diaDiem;
    private String diaChiChiTiet;
    private Double latitude;
    private Double longitude;
}
