package com.hanghai.kchtg.datasharingaggregation.dto;

import com.hanghai.kchtg.datasharingaggregation.enums.SharingStatus;

public class UpdateDataSharingAggregationRequest {

    private String targetSystem;

    private String sharePeriod;

    private String dataPayload;

    private SharingStatus status;

    private String errorMessage;

    private String updatedBy;

    public String getTargetSystem() {
        return targetSystem;
    }

    public void setTargetSystem(String targetSystem) {
        this.targetSystem = targetSystem;
    }

    public String getSharePeriod() {
        return sharePeriod;
    }

    public void setSharePeriod(String sharePeriod) {
        this.sharePeriod = sharePeriod;
    }

    public String getDataPayload() {
        return dataPayload;
    }

    public void setDataPayload(String dataPayload) {
        this.dataPayload = dataPayload;
    }

    public SharingStatus getStatus() {
        return status;
    }

    public void setStatus(SharingStatus status) {
        this.status = status;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
}
