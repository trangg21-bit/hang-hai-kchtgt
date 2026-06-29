package com.hanghai.kchtg.datasharingaggregation.dto;

import com.hanghai.kchtg.datasharingaggregation.enums.SharingType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class CreateDataSharingAggregationRequest {

    @NotNull
    private SharingType sharingType;

    private String targetSystem;

    private String sharePeriod;

    @NotBlank
    private String dataPayload;

    private LocalDateTime shareDate;

    private String createdBy;

    public SharingType getSharingType() {
        return sharingType;
    }

    public void setSharingType(SharingType sharingType) {
        this.sharingType = sharingType;
    }

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

    public LocalDateTime getShareDate() {
        return shareDate;
    }

    public void setShareDate(LocalDateTime shareDate) {
        this.shareDate = shareDate;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
}
