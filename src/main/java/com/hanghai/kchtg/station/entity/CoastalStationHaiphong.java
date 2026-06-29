package com.hanghai.kchtg.station.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.Accessors;
import org.hibernate.annotations.SQLRestriction;

import java.util.UUID;

/**
 * Haiphong Maritime Affairs Authority coastal station entity.
 * Manages stations operated by the Haiphong Maritime Department for local coastal communication.
 */
@Entity
@Table(name = "coastal_station_haiphong")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
@SQLRestriction("deleted_at IS NULL")
public class CoastalStationHaiphong extends BaseStation {

    private String portName;
    private String district;
    private String ward;
    private String operationalLicense;
    private String licenseExpiry;
    private String inspectorName;
    private String inspectorPhone;
    private String lastInspectionDate;
    private String nextInspectionDate;
    private String coverageArea;
    private String equipmentType;
    private String communicationFrequency;

    @Column(length = 1000)
    private String locationAddress;

    private String contactPerson;
    private String contactPhone;

    @PrePersist
    @Override
    protected void onCreate() {
        super.onCreate();
        setDefaultStatus();
    }

    @PreUpdate
    @Override
    protected void onUpdate() {
        super.onUpdate();
    }

    private void setDefaultStatus() {
        this.status = StationStatus.PENDING_APPROVAL;
        this.approvalStatus = StationApprovalStatus.PENDING;
    }
}
