package com.hanghai.kchtg.businessintegration.dto;

import java.io.Serializable;
import java.time.LocalDateTime;

public class BusinessDataIntegrationResponse implements Serializable {
    private String id;
    private String integrationType;
    private String sourceSystem;
    private String integrationPeriod;
    private String status;
    private String errorMessage;
    private LocalDateTime integrationDate;
    private int retryCount;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getIntegrationType() { return integrationType; }
    public void setIntegrationType(String integrationType) { this.integrationType = integrationType; }
    public String getSourceSystem() { return sourceSystem; }
    public void setSourceSystem(String sourceSystem) { this.sourceSystem = sourceSystem; }
    public String getIntegrationPeriod() { return integrationPeriod; }
    public void setIntegrationPeriod(String integrationPeriod) { this.integrationPeriod = integrationPeriod; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public LocalDateTime getIntegrationDate() { return integrationDate; }
    public void setIntegrationDate(LocalDateTime integrationDate) { this.integrationDate = integrationDate; }
    public int getRetryCount() { return retryCount; }
    public void setRetryCount(int retryCount) { this.retryCount = retryCount; }
}
