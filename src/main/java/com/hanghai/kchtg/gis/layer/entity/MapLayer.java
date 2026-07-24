package com.hanghai.kchtg.gis.layer.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.util.Arrays;

@Entity
@Table(name = "map_layers")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MapLayer extends BaseEntity {

    @Getter
    public enum LayerType {
        POINT(1),
        LINE(2),
        POLYGON(3),
        BASEMAP(4),
        OVERLAY(5);

        private final int value;

        LayerType(int value) {
            this.value = value;
        }

        @JsonValue
        public int getValue() {
            return value;
        }

        @JsonCreator
        public static LayerType fromValue(Object input) {
            if (input == null) return null;
            if (input instanceof Number) {
                int val = ((Number) input).intValue();
                return Arrays.stream(values())
                        .filter(v -> v.value == val)
                        .findFirst()
                        .orElse(null);
            }
            String str = input.toString().trim();
            try {
                int val = Integer.parseInt(str);
                return Arrays.stream(values())
                        .filter(v -> v.value == val)
                        .findFirst()
                        .orElse(null);
            } catch (NumberFormatException ex) {
                return Arrays.stream(values())
                        .filter(v -> v.name().equalsIgnoreCase(str))
                        .findFirst()
                        .orElse(null);
            }
        }
    }

    @Converter(autoApply = true)
    public static class LayerTypeConverter implements AttributeConverter<LayerType, Integer> {
        @Override
        public Integer convertToDatabaseColumn(LayerType attribute) {
            return attribute != null ? attribute.getValue() : null;
        }

        @Override
        public LayerType convertToEntityAttribute(Integer dbData) {
            return dbData != null ? LayerType.fromValue(dbData) : null;
        }
    }

    @NotBlank(message = "Tên lớp bản đồ không được để trống")
    @Size(max = 100, message = "Tên tối đa 100 ký tự")
    @Column(nullable = false, length = 100)
    private String name;

    @NotBlank(message = "Mã lớp bản đồ không được để trống")
    @Size(max = 50, message = "Mã tối đa 50 ký tự")
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @NotNull(message = "Loại lớp bản đồ không được để trống")
    @Column(name = "layer_type", nullable = false)
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

    @Column(nullable = false)
    @Builder.Default
    private Boolean status = true;
}
