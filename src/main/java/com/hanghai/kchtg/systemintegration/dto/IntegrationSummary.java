package com.hanghai.kchtg.systemintegration.dto;

import java.io.Serializable;
import java.util.List;

public class IntegrationSummary implements Serializable {
    private String integrationType;
    private int totalRecords;
    private int successRecords;
    private int failedRecords;
    private List<String> recentErrors;

    public String getIntegrationType() { return integrationType; }
    public void setIntegrationType(String integrationType) { this.integrationType = integrationType; }
    public int getTotalRecords() { return totalRecords; }
    public void setTotalRecords(int totalRecords) { this.totalRecords = totalRecords; }
    public int getSuccessRecords() { return successRecords; }
    public void setSuccessRecords(int successRecords) { this.successRecords = successRecords; }
    public int getFailedRecords() { return failedRecords; }
    public void setFailedRecords(int failedRecords) { this.failedRecords = failedRecords; }
    public List<String> getRecentErrors() { return recentErrors; }
    public void setRecentErrors(List<String> recentErrors) { this.recentErrors = recentErrors; }
}
