package com.hanghai.kchtg.accesslog.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "log_retention_policies")
@Getter
@Setter
@NoArgsConstructor
public class LogRetentionPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Positive
    @Column(name = "retention_days", nullable = false)
    private Integer retentionDays = 90;

    @NotNull
    @Positive
    @Column(name = "max_export_rows", nullable = false)
    private Integer maxExportRows = 10000;

    @NotNull
    @Column(name = "cleanup_schedule", length = 50, nullable = false)
    private String cleanupSchedule = "0 0 2 * * ?";

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public Integer getRetentionDays() { return retentionDays; }
    public Integer getMaxExportRows() { return maxExportRows; }
    public String getCleanupSchedule() { return cleanupSchedule; }
    public Boolean getIsActive() { return isActive; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void setId(Long id) { this.id = id; }
    public void setRetentionDays(Integer retentionDays) { this.retentionDays = retentionDays; }
    public void setMaxExportRows(Integer maxExportRows) { this.maxExportRows = maxExportRows; }
    public void setCleanupSchedule(String cleanupSchedule) { this.cleanupSchedule = cleanupSchedule; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
