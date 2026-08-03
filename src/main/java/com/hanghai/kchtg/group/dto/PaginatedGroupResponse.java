package com.hanghai.kchtg.group.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Paginated group response with total count.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaginatedGroupResponse {

    private List<GroupResponse> items;
    private long total;
    private int page;
    private int pageSize;
    private int totalPages;
    private long activeCount;
    private long inactiveCount;

}
