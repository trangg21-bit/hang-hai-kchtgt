package com.hanghai.kchtg.gis.search.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchResponse {

    private List<SearchResultItem> results;
    private long totalResults;
    private int page;
    private int size;
    private long durationMs;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SearchResultItem {
        private String objectId;
        private String objectType;
        private String name;
        private String code;
        private Double distance;
        private String layerType;
    }
}
