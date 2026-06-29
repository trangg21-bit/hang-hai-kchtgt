package com.hanghai.kchtg.station.entity;
import lombok.experimental.Accessors;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.util.UUID;

@Entity
@Table(name = "coastal_station_vts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
@SQLRestriction("deleted_at IS NULL")
public class CoastalStationVTS extends BaseStation {

    private String frequencyBand;
    private Double transmitPower;
    private String equipmentType;

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
