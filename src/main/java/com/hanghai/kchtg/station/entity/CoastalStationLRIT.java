package com.hanghai.kchtg.station.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.Accessors;
import org.hibernate.annotations.SQLRestriction;

import java.util.UUID;

/**
 * LRIT (Long Range Identification and Tracking) coastal station entity.
 * Manages LRIT data terminal stations used for maritime vessel tracking.
 */
@Entity
@Table(name = "coastal_station_lrit")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
@SQLRestriction("deleted_at IS NULL")
public class CoastalStationLRIT extends BaseStation {

    private String terminalId;
    private String imoNumber;
    private Integer reportingInterval;
    private Double antennaHeight;
    private Double powerOutput;
    private String antennaType;

    @Column(length = 1000)
    private String locationAddress;

    private String contactPerson;
    private String contactPhone;
    private String dataFormat;
    private String communicationChannel;
    private String coverageArea;

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
