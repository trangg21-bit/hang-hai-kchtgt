package com.hanghai.kchtg.vtssystem.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;
import lombok.experimental.SuperBuilder;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.UUID;

@Entity
@Table(name = "vts_zone")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
@EqualsAndHashCode(callSuper = true, exclude = "vtsSystem")
public class VtsZone extends BaseEntity {

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "condition_status", columnDefinition = "SMALLINT")
    private ConditionStatus conditionStatus;

    @Column(name = "geometry_type")
    private GisGeometryType geometryType;

    @Column(name = "coordinates", columnDefinition = "TEXT")
    private String coordinates;

    @Column(name = "spatial_id")
    private UUID spatialId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vts_system_id", nullable = false)
    @JsonIgnore
    private VtsSystem vtsSystem;
}
