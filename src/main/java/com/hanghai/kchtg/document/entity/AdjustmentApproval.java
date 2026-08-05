package com.hanghai.kchtg.document.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Phê duyệt điều chỉnh — approval records for planning adjustments.
 * Used by F-134 Cập nhật quy hoạch bến cảng.
 */
@Entity
@Table(name = "adjustment_approvals")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdjustmentApproval {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "planning_adjustment_id", nullable = false)
    private PlanningAdjustment planningAdjustment;

    @Column(name = "approval_level", length = 100)
    private String approvalLevel;

    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "approved_by", length = 100)
    private String approver;

    @Column(name = "approved_at")
    private LocalDate approvalDate;

    @Column(name = "notes", length = 500)
    private String notes;
}
