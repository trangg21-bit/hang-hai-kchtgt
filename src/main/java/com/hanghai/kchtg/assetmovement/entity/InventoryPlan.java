package com.hanghai.kchtg.assetmovement.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.util.UUID;

/**
 * Entity kế hoạch kiểm kê tài sản KCHTGT (F-125).
 */
@Entity
@Table(name = "inventory_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class InventoryPlan extends BaseEntity {

    @Column(length = 200)
    private String planName;

    @Column(length = 50)
    private InventoryType inventoryType;

    @Column(length = 500)
    private String scope;

    private Instant startDate;
    private Instant endDate;

    @Column(length = 200)
    private String inventoryLeader;

    @Column(length = 1000)
    private String description;

    @Column(length = 50)
    private PlanStatus status;

    private UUID approvedBy;
    private Instant approvedAt;

    @Column(length = 1000)
    private String approvedRemarks;

    private UUID unapprovedBy;
    private Instant unapprovedAt;

    @Column(length = 1000)
    private String unapprovedRemarks;

    @Version
    private Integer lockVersion;
}
