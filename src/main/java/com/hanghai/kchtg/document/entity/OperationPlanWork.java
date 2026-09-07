package com.hanghai.kchtg.document.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.util.UUID;

/**
 * Công trình trong kế hoạch vận hành — danh sách công trình (F-129 #11–14).
 */
@Entity
@Table(name = "operation_plan_work")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class OperationPlanWork {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "operation_plan_id")
    private UUID operationPlanId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operation_plan_id", insertable = false, updatable = false)
    private OperationPlan operationPlan;

    @Column(name = "infrastructure_id")
    private UUID infrastructureId;

    @Column(name = "infrastructure_name", length = 255)
    private String infrastructureName;

    @Column(name = "location", length = 255)
    private String location;

    @Column(name = "port_name", length = 255)
    private String portName;
}
