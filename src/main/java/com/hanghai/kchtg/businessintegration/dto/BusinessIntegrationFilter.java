package com.hanghai.kchtg.businessintegration.dto;

import java.io.Serializable;
import java.time.LocalDateTime;

public class BusinessIntegrationFilter implements Serializable {
    private String integrationType;
    private String status;
    private String sourceSystem;
    private String integrationPeriod;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private int page = 0;
    private int size = 20;

    public String getIntegrationType() { return integrationType; }
    public void setIntegrationType(String integrationType) { this.integrationType = integrationType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSourceSystem() { return sourceSystem; }
    public void setSourceSystem(String sourceSystem) { this.sourceSystem = sourceSystem; }
    public String getIntegrationPeriod() { return integrationPeriod; }
    public void setIntegrationPeriod(String integrationPeriod) { this.integrationPeriod = integrationPeriod; }
    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }
    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }
    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }
    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }
}
