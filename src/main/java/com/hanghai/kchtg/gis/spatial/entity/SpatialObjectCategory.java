package com.hanghai.kchtg.gis.spatial.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.hanghai.kchtg.common.entity.BaseEntity;

import java.util.UUID;

@Entity
@Table(name = "spatial_object_categories")
@Getter
@Setter
public class SpatialObjectCategory extends BaseEntity {

    @Column(name = "code", length = 50, nullable = false)
    private String code;

    @Column(name = "name", length = 255, nullable = false)
    private String name;

    @Column(name = "geometry_type", nullable = false)
    private Integer geometryType;

    @Column(name = "icon_id")
    private UUID iconId;

    @Column(name = "status", nullable = false)
    private Integer status = 1;
}
