package com.hanghai.kchtg.gis.layer.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "map_layers")
@SQLRestriction("deleted_at IS NULL")
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

    @NotBlank(message = "Tên lớp bản đồ không được để trống")
    @Size(max = 100, message = "Tên tối đa 100 ký tự")
    @Column(nullable = false, length = 100)
    private String name;

    @NotBlank(message = "Mã lớp bản đồ không được để trống")
    @Size(max = 50, message = "Mã tối đa 50 ký tự")
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