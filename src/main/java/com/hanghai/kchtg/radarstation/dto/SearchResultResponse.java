package com.hanghai.kchtg.radarstation.dto;

import lombok.*;
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
