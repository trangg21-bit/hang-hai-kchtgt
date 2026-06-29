package com.hanghai.kchtg.datasharingaggregation.dto;

import com.hanghai.kchtg.datasharingaggregation.enums.SharingStatus;
import com.hanghai.kchtg.datasharingaggregation.enums.SharingType;
import java.time.LocalDateTime;

public class DataSharingAggregationFilter {

    private SharingType sharingType;

    private SharingStatus status;

    private String targetSystem;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    public SharingType getSharingType() {
        return sharingType;
    }

    public void setSharingType(SharingType sharingType) {
        this.sharingType = sharingType;
    }

    public SharingStatus getStatus() {
        return status;
    }

    public void setStatus(SharingStatus status) {
        this.status = status;
    }

    public String getTargetSystem() {
        return targetSystem;
    }

    public void setTargetSystem(String targetSystem) {
        this.targetSystem = targetSystem;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }

    public LocalDateTime getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDateTime endDate) {
        this.endDate = endDate;
    }
}
