package com.hanghai.kchtg.report.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Port operation entity for F-103: Báo cáo khánh tác cảng.
 * Records vessel arrival/departure and cargo handling operations at ports.
 */
@Entity
@Table(name = "port_operations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortOperation extends BaseEntity {

    public enum OperationType {
        BOC,
        DONG
    }

    @Column(name = "port_code", nullable = false, length = 50)
    private String portCode;

    @Column(name = "arrival_time", nullable = false)
    private LocalDateTime arrivalTime;

    @Column(name = "departure_time")
    private LocalDateTime departureTime;

    @Column(name = "cargo_quantity")
    private Long cargoQuantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "operation_type", nullable = false, length = 10)
    private OperationType operationType;
}
