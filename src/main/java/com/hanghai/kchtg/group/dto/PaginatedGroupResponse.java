package com.hanghai.kchtg.group.dto;

import com.hanghai.kchtg.group.dto.GroupResponse;

import java.util.List;

/**
 * Paginated group response with total count.
 */
public class PaginatedGroupResponse {

    private List<GroupResponse> items;
    private long total;
    private int page;
    private int pageSize;
    private int totalPages;

    public PaginatedGroupResponse() {}

    public PaginatedGroupResponse(List<GroupResponse> items, long total, int page, int pageSize) {
        this.items = items;
        this.total = total;
        this.page = page;
        this.pageSize = pageSize;
        this.totalPages = pageSize > 0 ? (int) Math.ceil((double) total / pageSize) : 0;
    }

    public List<GroupResponse> getItems() { return items; }
    public void setItems(List<GroupResponse> items) { this.items = items; }
    public long getTotal() { return total; }
    public void setTotal(long total) { this.total = total; }
    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }
    public int getPageSize() { return pageSize; }
    public void setPageSize(int pageSize) { this.pageSize = pageSize; }
    public int getTotalPages() { return totalPages; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }
}
