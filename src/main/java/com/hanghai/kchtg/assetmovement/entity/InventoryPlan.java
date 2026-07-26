package com.hanghai.kchtg.assetmovement.entity;

import java.util.UUID;

import com.hanghai.kchtg.common.entity.BaseEntity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.SQLRestriction;

/**
 * Entity kế hoạch kiểm kê tài sản KCHTGT (F-125).
 */
@Entity
@Table(name = "inventory_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
@lombok.experimental.SuperBuilder
@lombok.EqualsAndHashCode(callSuper = true)
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
