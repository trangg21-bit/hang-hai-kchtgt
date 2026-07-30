package com.hanghai.kchtg.gis.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.util.UUID;

@Entity
@Table(name = "enc_features")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChartFeature extends BaseEntity {

    public enum GeometryType {
        POINT,
        LINE,
        POLYGON
    }

    @NotNull(message = "Cell ID không được để trống")
    @Column(name = "cell_id", nullable = false)
    private UUID cellId;

    @Size(max = 200, message = "Tên đối tượng tối đa 200 ký tự")
    @Column(name = "feature_name", length = 200)
    private String featureName;

    @NotBlank(message = "Mã đối tượng không được để trống")
    @Size(max = 50, message = "Mã đối tượng tối đa 50 ký tự")
    @Column(name = "feature_code", nullable = false, length = 50)
    private String featureCode; // e.g. BOYSPP, DEPCNT, LNDARE

    @Enumerated(EnumType.STRING)
    @Column(name = "geometry_type", nullable = false, length = 20)
    private GeometryType geometryType;

    @NotBlank(message = "Tọa độ không được để trống")
    @Column(nullable = false, columnDefinition = "TEXT")
    private String coordinates; // WKT or GeoJSON

    @Column(name = "attributes_json", columnDefinition = "TEXT")
    private String attributesJson; // JSON representation of standard S-57 attributes
}
