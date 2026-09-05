package com.hanghai.kchtg.document.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Công trình trong kế hoạch bảo trì (F-130 #14–18) — danh sách công trình + kinh phí từng dòng.
 */
@Entity
@Table(name = "maintenance_plan_work")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class MaintenancePlanWork {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "maintenance_plan_id")
    private UUID maintenancePlanId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maintenance_plan_id", insertable = false, updatable = false)
    private MaintenancePlan maintenancePlan;

    @Column(name = "infrastructure_id")
    private UUID infrastructureId;

    @Column(name = "infrastructure_name", length = 255)
    private String infrastructureName;

    @Column(name = "port_name", length = 255)
    private String portName;

    @Column(name = "location", length = 255)
    private String location;

    @Column(name = "cost", precision = 15, scale = 2)
    private BigDecimal cost;
}
