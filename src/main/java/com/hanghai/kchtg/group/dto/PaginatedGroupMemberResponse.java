package com.hanghai.kchtg.group.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Paginated group member response with total count.
 */
@Data
public class PaginatedGroupMemberResponse {

    private List<GroupMemberResponse> items;
    private long total;
    private int page;
    private int pageSize;
    private int totalPages;

    public PaginatedGroupMemberResponse() {}

    public PaginatedGroupMemberResponse(List<GroupMemberResponse> items, long total, int page, int pageSize) {
        this.items = items;
        this.total = total;
        this.page = page;
        this.pageSize = pageSize;
        this.totalPages = pageSize > 0 ? (int) Math.ceil((double) total / pageSize) : 0;
    }
}
