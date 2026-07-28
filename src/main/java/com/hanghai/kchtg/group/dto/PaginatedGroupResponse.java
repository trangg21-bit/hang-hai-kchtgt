package com.hanghai.kchtg.group.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * Paginated group response with total count.
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PaginatedGroupResponse {

    private List<GroupResponse> items;
    private long total;
    private int page;
    private int pageSize;
    private int totalPages;
    private long activeCount;
    private long inactiveCount;

}
