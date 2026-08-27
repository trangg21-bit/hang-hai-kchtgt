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

import java.util.UUID;

/**
 * Khu nước neo buộc tàu — con của Khu tránh, trú bão (StormShelterArea).
 * Bảng: storm_shelter_mooring_water_areas.
 */
@Entity
@Table(name = "storm_shelter_mooring_water_areas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
public class StormShelterMooringWaterArea extends BaseEntity {

    @Column(name = "storm_shelter_area_id", nullable = false)
    private UUID stormShelterAreaId;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "geometry_type", length = 20)
    private String geometryType;

    @Column(name = "map_symbol_id")
    private UUID mapSymbolId;

    @Column(name = "coordinate_system")
    private Integer coordinateSystem;

    @Column(name = "display_rule", length = 255)
    private String displayRule;
}
