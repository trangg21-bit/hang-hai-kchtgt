package com.hanghai.kchtg.gis.polygon.entity;

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
@Table(name = "polygon_objects")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PolygonObject extends BaseEntity {

    public enum ObjectType {
        WATER_ZONE,
        ANCHORAGE,
        STORM_SHELTER,
        RESTRICTED_AREA,
        LIMITED_ZONE,
        OTHER
    }

    public enum Status {
        DRAFT,
        PENDING_APPROVAL,
        APPROVED_L1,
        APPROVED_L2,
        PUBLISHED,
        REJECTED,
        DELETED
    }

    public enum ApprovalStatus {
        PENDING,
        APPROVED,
        REJECTED
    }

    @NotBlank(message = "Tên đối tượng không được để trống")
    @Size(max = 200, message = "Tên tối đa 200 ký tự")
    @Column(nullable = false, length = 200)
    private String name;

    @NotBlank(message = "Mã đối tượng không được để trống")
    @Size(max = 50, message = "Mã tối đa 50 ký tự")
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ObjectType objectType;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "fill_symbol_id")
    private Long fillSymbolId;

    @Column(name = "coordinates", nullable = false, columnDefinition = "TEXT")
    private String coordinates;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.DRAFT;

    @Column(name = "unit_id")
    private Long unitId;

    @Column
    private Double area;

    @Column(length = 500)
    private String purpose;

    @Column(name = "restriction_level", length = 50)
    private String restrictionLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", length = 20)
    @Builder.Default
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "approved_date")
    private java.time.LocalDateTime approvedDate;
}