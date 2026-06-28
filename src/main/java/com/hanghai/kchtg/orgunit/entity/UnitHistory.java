package com.hanghai.kchtg.orgunit.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Audit trail entity for organisational unit changes.
 * Append-only — records CREATE, UPDATE, DELETE, APPROVE, REJECT, MOVE actions.
 */
@Entity
@Table(name = "unit_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UnitHistory extends BaseEntity {

    /** ID of the unit that was changed. */
    @Column(name = "unit_id", nullable = false)
    private UUID unitId;

    /** Unit name at time of change. */
    @Column(length = 200)
    private String unitName;

    /** Unit code at time of change. */
    @Column(length = 50)
    private String unitCode;

    /** Action type: CREATED, UPDATED, DELETED, APPROVED, REJECTED, MOVED. */
    @Column(nullable = false, length = 20)
    private String action;

    /** Detailed description of the change (JSON or text). */
    @Column(columnDefinition = "TEXT")
    private String details;

    /** User who performed the action (FK → User.id, stored as UUID). */
    @Column(name = "performed_by", nullable = false)
    private UUID performedBy;

    /** Username who performed the action (denormalized for fast queries). */
    @Column(length = 100)
    private String performedByName;

    /** Timestamp of when the action was performed. */
    @Column(name = "performed_at", nullable = false)
    private java.time.LocalDateTime performedAt;

    /**
     * Factory method to create a new UnitHistory record.
     */
    public static UnitHistory create(UUID unitId, String action, String details,
                                     UUID performedBy, String performedByName) {
        return UnitHistory.builder()
                .unitId(unitId)
                .action(action)
                .details(details)
                .performedBy(performedBy)
                .performedByName(performedByName)
                .performedAt(java.time.LocalDateTime.now())
                .build();
    }
}
