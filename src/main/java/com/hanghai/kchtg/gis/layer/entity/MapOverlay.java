package com.hanghai.kchtg.gis.layer.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "map_overlays")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MapOverlay extends BaseEntity {

    @NotBlank(message = "Tên overlay không được để trống")
    @Column(nullable = false, length = 100)
    private String name;

    @NotBlank(message = "URL không được để trống")
    @Column(nullable = false, length = 500)
    private String url;

    @Column(name = "layer_name", nullable = false, length = 100)
    private String layerName;

    @Column(length = 20)
    @Builder.Default
    private String format = "image/png";

    @Column(nullable = false)
    @Builder.Default
    private Boolean visible = false;

    @Column(nullable = false)
    @Builder.Default
    private Double opacity = 1.0;

    @Column
    @Builder.Default
    private Integer zIndex = 0;
}
