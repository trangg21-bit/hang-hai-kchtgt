package com.hanghai.kchtg.port.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Entity representing coordinate points of a Port (toạ độ cảng biển).
 * Corresponds to table: port_coordinates
 */
@Entity
@Table(name = "port_coordinates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class PortCoordinate extends BaseEntity {

    @Column(name = "port_id", nullable = false)
    private UUID portId;

    @Column(name = "latitude", nullable = false, precision = 9, scale = 6)
    private BigDecimal latitude;

    @Column(name = "longitude", nullable = false, precision = 9, scale = 6)
    private BigDecimal longitude;

    @Column(name = "sort_order")
    private Integer sortOrder;
}
