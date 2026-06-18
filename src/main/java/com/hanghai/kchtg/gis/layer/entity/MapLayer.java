package com.hanghai.kchtg.gis.layer.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "map_layers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MapLayer extends BaseEntity {

    public enum LayerType {
        POINT,
        LINE,
        POLYGON,
        BASEMAP,
        OVERLAY
    }

    public enum Status {
        ACTIVE,
        INACTIVE
    }

    @NotBlank(message = "Ten layer khong duoc de trong")
    @Size(max = 100, message = "Ten toi da 100 ky tu")
    @Column(nullable = false, length = 100)
    private String name;

    @NotBlank(message = "Ma layer khong duoc de trong")
    @Size(max = 50, message = "Ma toi da 50 ky tu")
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LayerType layerType;

    @Column(length = 200)
    private String source;

    @Column(nullable = false)
    @Builder.Default
    private Boolean visible = false;

    @Column(nullable = false)
    @Builder.Default
    private Double opacity = 1.0;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer order = 0;

    @Column(name = "style_config", columnDefinition = "TEXT")
    private String styleConfig;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private Status status = Status.ACTIVE;
}
