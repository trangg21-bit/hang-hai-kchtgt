package com.hanghai.kchtg.gis.line.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "line_objects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LineObject extends BaseEntity {

    public enum ObjectType {
        COASTLINE,
        SHIPPING_ROUTE,
        WATERWAY,
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

    @NotBlank(message = "Ten doi tuong khong duoc de trong")
    @Size(max = 200, message = "Ten toi da 200 ky tu")
    @Column(nullable = false, length = 200)
    private String name;

    @NotBlank(message = "Ma doi tuong khong duoc de trong")
    @Size(max = 50, message = "Ma toi da 50 ky tu")
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ObjectType objectType;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "line_symbol_id")
    private Long lineSymbolId;

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
    private Double length;

    @Column(length = 100)
    private String material;

    @Column(name = "year_built")
    private Integer yearBuilt;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", length = 20)
    @Builder.Default
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "approved_date")
    private java.time.LocalDateTime approvedDate;
}
