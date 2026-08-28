package com.hanghai.kchtg.port.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Điểm neo — con của Khu nước neo buộc tàu (TransferAreaMooringWaterArea).
 * Bảng: transfer_area_mooring_water_area_anchor_points.
 */
@Entity
@Table(name = "transfer_area_mooring_water_area_anchor_points")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
public class TransferAreaMooringWaterAreaAnchorPoint extends BaseEntity {

    @Column(name = "transfer_area_mooring_water_area_id", nullable = false)
    private UUID transferAreaMooringWaterAreaId;

    @Column(name = "name", length = 255)
    private String name;

    @Column(name = "latitude")
    private BigDecimal latitude;

    @Column(name = "longitude")
    private BigDecimal longitude;
}
