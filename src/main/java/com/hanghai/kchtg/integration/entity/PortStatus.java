package com.hanghai.kchtg.integration.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * Stores operational status, capacity, and structural statistics for ports.
 */
@Entity
@Table(name = "kchtgt_port_status")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortStatus extends BaseEntity {

    @Column(name = "port_code", nullable = false, unique = true, length = 100)
    private String portCode;

    @Column(name = "port_name", nullable = false, length = 200)
    private String portName;

    @Column(name = "berth_count")
    private Integer berthCount;

    @Column(name = "operational_status", nullable = false, length = 50)
    private String operationalStatus; // ACTIVE, MAINTENANCE, CLOSED

    @Column(name = "current_capacity_tons")
    private Double currentCapacityTons;
}
