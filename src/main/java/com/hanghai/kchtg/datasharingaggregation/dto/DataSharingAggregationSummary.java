package com.hanghai.kchtg.datasharingaggregation.dto;

import java.util.List;

public class DataSharingAggregationSummary {

    private long totalCount;
    private long successCount;
    private long failedCount;
    private long pendingCount;
    private long byType;
    private List<SharingTypeStats> bySharingType;

    public long getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(long totalCount) {
        this.totalCount = totalCount;
    }

    public long getSuccessCount() {
        return successCount;
    }

    public void setSuccessCount(long successCount) {
        this.successCount = successCount;
    }

    public long getFailedCount() {
        return failedCount;
    }

    public void setFailedCount(long failedCount) {
        this.failedCount = failedCount;
    }

    public long getPendingCount() {
        return pendingCount;
    }

    public void setPendingCount(long pendingCount) {
        this.pendingCount = pendingCount;
    }

    public long getByType() {
        return byType;
    }

    public void setByType(long byType) {
        this.byType = byType;
    }

    public List<SharingTypeStats> getBySharingType() {
        return bySharingType;
    }

    public void setBySharingType(List<SharingTypeStats> bySharingType) {
        this.bySharingType = bySharingType;
    }

    public static class SharingTypeStats {
        private String type;
        private long count;

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public long getCount() {
            return count;
        }

        public void setCount(long count) {
            this.count = count;
        }
    }
}
