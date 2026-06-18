package com.hanghai.kchtg.gis.search.dto;

import com.hanghai.kchtg.gis.search.entity.SearchQuery.QueryType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchRequest {

    @Size(max = 1000, message = "Tu khoa toi da 1000 ky tu")
    private String query;

    @NotNull(message = "Query type khong duoc de trong")
    private QueryType queryType;

    private Double centerLon;
    private Double centerLat;

    @DecimalMin(value = "50.0", message = "Ban kinh toi thieu 50m")
    @DecimalMax(value = "10000.0", message = "Ban kinh toi da 10km")
    private Double radius;

    private String coordinates;

    @Size(max = 100, message = "Toi da 100 type")
    private String layerTypes;

    private String statuses;
    private Long unitId;

    @Builder.Default
    private Integer page = 0;

    @Builder.Default
    private Integer size = 20;
}
