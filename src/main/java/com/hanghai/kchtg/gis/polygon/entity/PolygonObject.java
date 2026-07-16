package com.hanghai.kchtg.gis.polygon.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "gis_spatial_objects")
@SQLRestriction("geometry_type = 3 AND deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PolygonObject extends BaseEntity {

    @Getter
    public enum ObjectType {
        WATER_ZONE(30),
        ANCHORAGE(31),
        STORM_SHELTER(32),
        RESTRICTED_AREA(33),
        LIMITED_ZONE(34),
        OTHER(35);

        private final int value;

        ObjectType(int value) {
            this.value = value;
        }
    }

    @Getter
    public enum Status {
        DRAFT(0),
        PENDING_APPROVAL(1),
        APPROVED_L1(2),
        APPROVED_L2(3),
        PUBLISHED(4),
        REJECTED(5),
        DELETED(6);

        private final int value;

        Status(int value) {
            this.value = value;
        }
    }

    @Getter
    public enum ApprovalStatus {
        PENDING(0),
        APPROVED(1),
        REJECTED(2);

        private final int value;

        ApprovalStatus(int value) {
            this.value = value;
        }
    }

    @NotBlank(message = "Tên đối tượng không được để trống")
    @Size(max = 200, message = "Tên tối đa 200 ký tự")
    @Column(nullable = false, length = 200)
    private String name;

    @NotBlank(message = "Mã đối tượng không được để trống")
    @Size(max = 50, message = "Mã tối đa 50 ký tự")
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "geometry_type", nullable = false)
    @Builder.Default
    private Integer geometryType = 3;

    @Column(name = "object_type", nullable = false)
    private ObjectType objectType;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "bieu_tuong_id")
    private java.util.UUID fillSymbolId;

    @Column(name = "coordinates", nullable = false, columnDefinition = "TEXT")
    private String coordinates;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.DRAFT;

    @Column(name = "unit_id")
    private java.util.UUID unitId;

    @Column(name = "ref_id")
    private java.util.UUID refId;

    @Column(name = "ref_type")
    private Integer refType;

    @Column
    private Double area;

    @Column(length = 500)
    private String purpose;

    @Column(name = "restriction_level", length = 50)
    private String restrictionLevel;

    @Column(name = "approval_status")
    @Builder.Default
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "approved_date")
    private java.time.LocalDateTime approvedDate;

    @PrePersist
    @PreUpdate
    public void prePersist() {
        this.geometryType = 3;
    }
}
