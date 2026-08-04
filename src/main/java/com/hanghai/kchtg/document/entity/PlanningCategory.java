package com.hanghai.kchtg.document.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Hàm mục quy hoạch — planning target metrics.
 * Used by F-132 Quản lý quy hoạch bến cảng.
 */
@Entity
@Table(name = "planning_categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanningCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "port_planning_id", nullable = false)
    private PortPlanning portPlanning;

    @Column(name = "category_name", nullable = false, length = 200)
    private String categoryName;

    @Column(name = "unit_of_measure", length = 50)
    private String unitOfMeasure;

    @Column(name = "planned_value", precision = 15, scale = 2)
    private BigDecimal plannedValue;

    @Column(name = "actual_value", precision = 15, scale = 2)
    private BigDecimal actualValue;

    @Column(name = "status", length = 50)
    private String status;
}
