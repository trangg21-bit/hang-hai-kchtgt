package com.hanghai.kchtg.vanban.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Search result response DTO for document search (F-135).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KetQuaTimKiemResponse {

    private List<VanBanPhapLyResponse> results;
    private long totalElements;
    private int totalPages;
    private int currentPage;
    private int pageSize;
}
