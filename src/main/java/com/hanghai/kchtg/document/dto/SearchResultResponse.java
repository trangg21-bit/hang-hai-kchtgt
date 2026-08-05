package com.hanghai.kchtg.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Search result response DTO for document search (F-135).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchResultResponse {

    private List<LegalDocumentResponse> results;
    private long totalElements;
    private int totalPages;
    private int currentPage;
    private int pageSize;
    private Map<String, Long> statusCounts;
}
