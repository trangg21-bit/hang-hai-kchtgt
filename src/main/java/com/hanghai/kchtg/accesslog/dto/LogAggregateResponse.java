package com.hanghai.kchtg.accesslog.dto;

/**
 * Response DTO for aggregate statistics endpoint.
 */
public class LogAggregateResponse {

    private Long id;
    private String date;
    private Long totalAccesses;
    private Long uniqueUsers;
    private String successRate;
    private Integer avgDuration;
    private String createdAt;

    public LogAggregateResponse() {}

    public LogAggregateResponse(Long id, String date, Long totalAccesses,
                                Long uniqueUsers, String successRate,
                                Integer avgDuration, String createdAt) {
        this.id = id;
        this.date = date;
        this.totalAccesses = totalAccesses;
        this.uniqueUsers = uniqueUsers;
        this.successRate = successRate;
        this.avgDuration = avgDuration;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public Long getTotalAccesses() { return totalAccesses; }
    public void setTotalAccesses(Long totalAccesses) { this.totalAccesses = totalAccesses; }
    public Long getUniqueUsers() { return uniqueUsers; }
    public void setUniqueUsers(Long uniqueUsers) { this.uniqueUsers = uniqueUsers; }
    public String getSuccessRate() { return successRate; }
    public void setSuccessRate(String successRate) { this.successRate = successRate; }
    public Integer getAvgDuration() { return avgDuration; }
    public void setAvgDuration(Integer avgDuration) { this.avgDuration = avgDuration; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
