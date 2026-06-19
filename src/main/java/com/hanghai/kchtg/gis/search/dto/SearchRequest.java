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

    @Size(max = 1000, message = "Từ khóa tối đa 1000 ký tự")
    private String query;

    @NotNull(message = "Loại tìm kiếm không được để trống")
    private QueryType queryType;

    private Double centerLon;
    private Double centerLat;

    @DecimalMin(value = "50.0", message = "Bán kính tối thiểu 50m")
    @DecimalMax(value = "10000.0", message = "Bán kính tối đa 10km")
    private Double radius;

    private String coordinates;

    @Size(max = 100, message = "Tối đa 100 loại")
    private String layerTypes;

    private String statuses;
    private Long unitId;

    @Builder.Default
    private Integer page = 0;

    @Builder.Default
    private Integer size = 20;
}
