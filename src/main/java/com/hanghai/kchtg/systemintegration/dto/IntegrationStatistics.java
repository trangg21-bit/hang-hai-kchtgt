package com.hanghai.kchtg.systemintegration.dto;

import java.io.Serializable;

public class IntegrationStatistics implements Serializable {
    private long totalCount;
    private long successCount;
    private long failedCount;
    private long pendingCount;
    private long retryingCount;
    private double successRate;

    public long getTotalCount() { return totalCount; }
    public void setTotalCount(long totalCount) { this.totalCount = totalCount; }
    public long getSuccessCount() { return successCount; }
    public void setSuccessCount(long successCount) { this.successCount = successCount; }
    public long getFailedCount() { return failedCount; }
    public void setFailedCount(long failedCount) { this.failedCount = failedCount; }
    public long getPendingCount() { return pendingCount; }
    public void setPendingCount(long pendingCount) { this.pendingCount = pendingCount; }
    public long getRetryingCount() { return retryingCount; }
    public void setRetryingCount(long retryingCount) { this.retryingCount = retryingCount; }
    public double getSuccessRate() { return successRate; }
    public void setSuccessRate(double successRate) { this.successRate = successRate; }
}
