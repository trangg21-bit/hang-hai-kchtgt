package com.hanghai.kchtg.gis.line.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "gis_spatial_objects")
@SQLRestriction("geometry_type = 2 AND deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LineObject extends BaseEntity {

    @Getter
    public enum ObjectType {
        COASTLINE(20),
        SHIPPING_ROUTE(21),
        WATERWAY(22),
        OTHER(23);

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
    private Integer geometryType = 2;

    @Column(name = "object_type", nullable = false)
    private ObjectType objectType;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "bieu_tuong_id")
    private java.util.UUID lineSymbolId;

    @Column(name = "coordinates", nullable = false, columnDefinition = "TEXT")
    private String coordinates;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.DRAFT;

    @Column(name = "unit_id")
    private java.util.UUID unitId;

    @Column
    private Double length;

    @Column(length = 100)
    private String material;

    @Column(name = "year_built")
    private Integer yearBuilt;

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
        this.geometryType = 2;
    }
}
