package com.hanghai.kchtg.document.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Điều chỉnh quy hoạch — planning adjustment records.
 * Used by F-134 Cập nhật quy hoạch bến cảng.
 */
@Entity
@Table(name = "planning_adjustments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanningAdjustment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "port_planning_id", nullable = false)
    private PortPlanning portPlanning;

    @Column(name = "adjustment_type", length = 100)
    private String adjustmentType;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "detailed_description", columnDefinition = "TEXT")
    private String detailedDescription;

    @Column(name = "affected_scope", length = 500)
    private String affectedScope;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30)
    private AdjustmentStatus status;

    @Column(name = "registrant", length = 100)
    private String registrant;

    @Column(name = "registered_at")
    private LocalDateTime registeredAt;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "planningAdjustment", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AdjustmentApproval> approvals = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.registeredAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
