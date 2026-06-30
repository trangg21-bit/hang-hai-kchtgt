package com.hanghai.kchtg.deke.dto;

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
public class KetQuaTimKiemResponse {

    private List<DeKeResponse> results;
    private long totalElements;
    private int totalPages;
    private int currentPage;
    private int pageSize;
}
