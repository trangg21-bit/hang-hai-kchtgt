package com.hanghai.kchtg.gis.spatial.entity;

import java.util.UUID;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.UUID;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;

@Entity
@Table(name = "gis_spatial_objects")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GisSpatialObject extends BaseEntity {

    @NotBlank(message = "Tên đối tượng không được để trống")
    @Size(max = 200, message = "Tên tối đa 200 ký tự")
    @Column(nullable = false, length = 200)
    private String name;

    @NotBlank(message = "Mã đối tượng không được để trống")
    @Size(max = 50, message = "Mã tối đa 50 ký tự")
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @NotNull(message = "Loại hình học không được để trống")
    @Column(name = "geometry_type", nullable = false)
    private GisGeometryType geometryType;

    @NotNull(message = "Loại đối tượng không được để trống")
    @Column(name = "object_type", nullable = false)
    private GisSpatialObjectType objectType;

    @Column(name = "category_id")
    private Long categoryId;

    @NotBlank(message = "Tọa độ không được để trống")
    @Column(name = "coordinates", nullable = false, columnDefinition = "TEXT")
    private String coordinates;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private GisSpatialStatus status = GisSpatialStatus.DRAFT;

    @Column(name = "approval_status")
    @Builder.Default
    private GisSpatialApprovalStatus approvalStatus = GisSpatialApprovalStatus.PENDING;

    @Column(name = "unit_id")
    private UUID unitId;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_date")
    private LocalDateTime approvedDate;

    // Specific fields for points
    @Column(name = "cong_nang_khai_thac", length = 255)
    private String operationalCapacity;

    // Specific fields for lines
    @Column(name = "length")
    private Double length;

    @Column(name = "material", length = 100)
    private String material;

    @Column(name = "year_built")
    private Integer yearBuilt;

    // Specific fields for polygons
    @Column(name = "area")
    private Double area;

    @Column(name = "purpose", length = 500)
    private String purpose;

    @Column(name = "restriction_level", length = 50)
    private String restrictionLevel;

    // Reference fields to business tables
    @Column(name = "ref_id")
    private UUID refId;

    @Column(name = "ref_type")
    private InfrastructureType refType;
}
