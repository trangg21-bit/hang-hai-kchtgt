package com.hanghai.kchtg.group.dto;

import java.util.List;

/**
 * Paginated group member response with total count.
 */
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

    public List<GroupMemberResponse> getItems() { return items; }
    public void setItems(List<GroupMemberResponse> items) { this.items = items; }
    public long getTotal() { return total; }
    public void setTotal(long total) { this.total = total; }
    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }
    public int getPageSize() { return pageSize; }
    public void setPageSize(int pageSize) { this.pageSize = pageSize; }
    public int getTotalPages() { return totalPages; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }
}
