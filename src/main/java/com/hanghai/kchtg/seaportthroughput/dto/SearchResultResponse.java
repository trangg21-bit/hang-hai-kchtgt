package com.hanghai.kchtg.seaportthroughput.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Search result wrapper cho danh sách phân trang sản lượng cảng biển. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchResultResponse {

    private List<SeaportThroughputResponse> results;
    private long totalElements;
    private int totalPages;
    private int currentPage;
    private int pageSize;
}
