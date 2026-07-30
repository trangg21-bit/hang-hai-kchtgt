package com.hanghai.kchtg.radarstation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchResultResponse {
    private Long total;
    private String searchTerm;
    private List<RadarStationResponse> items;
}
