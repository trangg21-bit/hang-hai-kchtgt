package com.hanghai.kchtg.user.dto;

import java.util.List;
import java.util.Map;

/**
 * DTO phan trang nguoi dung kem theo thong ke so luong trang thai (merged response).
 */
public class UserPageResponse {
    private List<UserListItemResponse> content;
    private int pageNumber;
    private int pageSize;
    private long totalElements;
    private int totalPages;
    private Map<String, Long> statusCounts;

    public UserPageResponse() {
    }

    public UserPageResponse(List<UserListItemResponse> content, int pageNumber, int pageSize, long totalElements, int totalPages, Map<String, Long> statusCounts) {
        this.content = content;
        this.pageNumber = pageNumber;
        this.pageSize = pageSize;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.statusCounts = statusCounts;
    }

    public List<UserListItemResponse> getContent() {
        return content;
    }

    public void setContent(List<UserListItemResponse> content) {
        this.content = content;
    }

    public int getPageNumber() {
        return pageNumber;
    }

    public void setPageNumber(int pageNumber) {
        this.pageNumber = pageNumber;
    }

    public int getPageSize() {
        return pageSize;
    }

    public void setPageSize(int pageSize) {
        this.pageSize = pageSize;
    }

    public long getTotalElements() {
        return totalElements;
    }

    public void setTotalElements(long totalElements) {
        this.totalElements = totalElements;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }

    public Map<String, Long> getStatusCounts() {
        return statusCounts;
    }

    public void setStatusCounts(Map<String, Long> statusCounts) {
        this.statusCounts = statusCounts;
    }
}
