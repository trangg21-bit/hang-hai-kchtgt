package com.hanghai.kchtg.navigationchannel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Search result wrapper for paginated search results (F-042).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KetQuaTimKiemResponse {

    private List<NavigationChannelResponse> results;
    private long totalElements;
    private int totalPages;
    private int currentPage;
    private int pageSize;
}
