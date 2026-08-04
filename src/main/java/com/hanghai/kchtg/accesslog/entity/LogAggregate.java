package com.hanghai.kchtg.accesslog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "log_aggregates", uniqueConstraints = {
        @UniqueConstraint(name = "uk_aggregate_date", columnNames = "date")
})
@Getter
@Setter
@NoArgsConstructor
public class LogAggregate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date", nullable = false, unique = true)
    private LocalDate date;

    @Column(name = "total_accesses", nullable = false)
    private Long totalAccesses = 0L;

    @Column(name = "unique_users", nullable = false)
    private Long uniqueUsers = 0L;

    @Column(name = "success_rate", precision = 5, scale = 2, nullable = false)
    private BigDecimal successRate = BigDecimal.ZERO;

    @Column(name = "avg_duration", nullable = false)
    private Integer avgDuration = 0;

    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public LocalDate getDate() { return date; }
    public Long getTotalAccesses() { return totalAccesses; }
    public Long getUniqueUsers() { return uniqueUsers; }
    public BigDecimal getSuccessRate() { return successRate; }
    public Integer getAvgDuration() { return avgDuration; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setDate(LocalDate date) { this.date = date; }
    public void setTotalAccesses(Long totalAccesses) { this.totalAccesses = totalAccesses; }
    public void setUniqueUsers(Long uniqueUsers) { this.uniqueUsers = uniqueUsers; }
    public void setSuccessRate(BigDecimal successRate) { this.successRate = successRate; }
    public void setAvgDuration(Integer avgDuration) { this.avgDuration = avgDuration; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
