package com.hanghai.kchtg.dikerevetment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Search result wrapper for paginated search results (F-048).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchResultResponse {

    private List<DikeRevetmentResponse> results;
    private long totalElements;
    private int totalPages;
    private int currentPage;
    private int pageSize;
}
