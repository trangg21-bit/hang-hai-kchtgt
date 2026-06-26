package com.hanghai.kchtg.gis.layer.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "map_views")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MapView extends BaseEntity {

    @NotBlank(message = "Tên map view không được để trống")
    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "center_lon", nullable = false)
    private Double centerLon;

    @Column(name = "center_lat", nullable = false)
    private Double centerLat;

    @Column(nullable = false)
    private Integer zoom;

    @Column(name = "visible_layers", columnDefinition = "TEXT")
    private String visibleLayers;

    @Column(name = "layer_order", columnDefinition = "TEXT")
    private String layerOrder;

    @Column(name = "style_configs", columnDefinition = "TEXT")
    private String styleConfigs;
}
