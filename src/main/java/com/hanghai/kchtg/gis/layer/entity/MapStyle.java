package com.hanghai.kchtg.gis.layer.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "map_styles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MapStyle extends BaseEntity {

    @Column(name = "layer_id", nullable = false)
    private String layerId;

    @Column(length = 20)
    private String fillColor;

    @Column(length = 20)
    private String strokeColor;

    @Column
    private Double strokeWidth;

    @Column(name = "point_radius")
    private Double pointRadius;

    @Column(name = "icon_size")
    private Double iconSize;

    @Column
    private Double opacity;

    @Column(name = "min_zoom")
    private Integer minZoom;

    @Column(name = "max_zoom")
    private Integer maxZoom;
}