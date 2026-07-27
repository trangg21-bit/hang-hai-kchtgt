package com.hanghai.kchtg.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Search result response DTO for port planning query (F-133).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LookupResultResponse {

    private List<PortPlanningResponse> results;
    private long totalElements;
    private int totalPages;
    private int currentPage;
    private int pageSize;
}
