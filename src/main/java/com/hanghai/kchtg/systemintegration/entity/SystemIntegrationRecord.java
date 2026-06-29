package com.hanghai.kchtg.systemintegration.entity;

import com.hanghai.kchtg.systemintegration.enums.IntegrationType;
import com.hanghai.kchtg.systemintegration.enums.IntegrationStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "system_integration_record")
public class SystemIntegrationRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(name = "integration_type", nullable = false)
    private IntegrationType integrationType;

    @Column(name = "source_system", nullable = false, length = 100)
    private String sourceSystem;

    @Column(name = "target_system", nullable = false, length = 100)
    private String targetSystem;

    @Column(name = "data_payload", columnDefinition = "TEXT")
    private String dataPayload;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private IntegrationStatus status;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "integration_date", nullable = false)
    private LocalDateTime integrationDate;

    @Column(name = "retry_count", nullable = false)
    private int retryCount;

    @Column(name = "created_by", length = 50)
    private String createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_by", length = 50)
    private String updatedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public IntegrationType getIntegrationType() { return integrationType; }
    public void setIntegrationType(IntegrationType integrationType) { this.integrationType = integrationType; }
    public String getSourceSystem() { return sourceSystem; }
    public void setSourceSystem(String sourceSystem) { this.sourceSystem = sourceSystem; }
    public String getTargetSystem() { return targetSystem; }
    public void setTargetSystem(String targetSystem) { this.targetSystem = targetSystem; }
    public String getDataPayload() { return dataPayload; }
    public void setDataPayload(String dataPayload) { this.dataPayload = dataPayload; }
    public IntegrationStatus getStatus() { return status; }
    public void setStatus(IntegrationStatus status) { this.status = status; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public LocalDateTime getIntegrationDate() { return integrationDate; }
    public void setIntegrationDate(LocalDateTime integrationDate) { this.integrationDate = integrationDate; }
    public int getRetryCount() { return retryCount; }
    public void setRetryCount(int retryCount) { this.retryCount = retryCount; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
