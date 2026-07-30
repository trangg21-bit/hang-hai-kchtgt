package com.hanghai.kchtg.gis.search.dto;

import com.hanghai.kchtg.gis.search.entity.SearchQuery.QueryType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchHistoryResponse {

    private UUID id;
    private Long userId;
    private QueryType queryType;
    private String queryText;
    private Integer resultCount;
    private Long durationMs;
    private LocalDateTime executedAt;
}
