package com.hanghai.kchtg.port.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

/**
 * Entity representing infrastructure items of a Port (cơ sở hạ tầng cảng biển).
 * Corresponds to table: port_infrastructures
 */
@Entity
@Table(name = "port_infrastructures")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class PortInfrastructure extends BaseEntity {

    @Column(name = "port_id", nullable = false)
    private UUID portId;

    @Column(name = "sequence_number", nullable = false)
    private Integer sequenceNumber;

    @Column(name = "infrastructure_name", nullable = false, length = 255)
    private String infrastructureName;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;
}
