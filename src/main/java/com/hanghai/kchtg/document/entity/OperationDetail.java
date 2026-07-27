package com.hanghai.kchtg.document.entity;

import java.util.UUID;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Chi tiết vận hành — operational detail records.
 * Used by F-129 Quản lý thông tin vận hành.
 */
@Entity
@Table(name = "operation_details")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OperationDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operation_plan_id", nullable = false)
    private OperationPlan operationPlan;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "estimated_volume", precision = 15, scale = 2)
    private BigDecimal estimatedVolume;

    @Column(name = "actual_volume", precision = 15, scale = 2)
    private BigDecimal actualVolume;

    @Column(name = "notes", length = 500)
    private String notes;
}
