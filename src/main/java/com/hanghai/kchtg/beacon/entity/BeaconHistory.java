package com.hanghai.kchtg.beacon.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Shared audit trail entity for both BeaconLight and Buoy.
 * Does NOT extend BaseEntity — this entity must always be queryable
 * even for soft-deleted entities (no @SQLRestriction).
 */
@Entity
@Table(name = "beacon_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BeaconHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false, length = 36)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "beacon_type", nullable = false, length = 10)
    private BeaconType beaconType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 20)
    private BeaconHistoryActionType actionType;

    @Column(name = "changed_field", length = 100)
    private String changedField;

    @Column(name = "previous_value", columnDefinition = "TEXT")
    private String previousValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @Column(name = "changed_by", nullable = false)
    private Long changedBy;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;

    @Column(name = "reason", length = 500)
    private String reason;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "diff_data", columnDefinition = "JSON")
    private String diffData;
}
