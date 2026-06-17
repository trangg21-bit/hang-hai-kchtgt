package com.hanghai.kchtg.orgunit.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * L?ch s? thay d?i c?a don v? t? ch?c — ghi l?i m?i thao tác CREATE / UPDATE / DELETE / APPROVE / REJECT
 * d? ph?c v? vi?c audit và khôi ph?c n?u c?n.
 */
@Entity
@Table(name = "unit_history")
@Getter
@Setter
@NoArgsConstructor
public class UnitHistory extends BaseEntity {

    /** ID c?a don v? b? thay d?i. */
    @Column(name = "unit_id", nullable = false)
    private UUID unitId;

    /** Tên don v? t?i th?i di?m thay d?i. */
    @Column(length = 200)
    private String unitName;

    /** Mă code c?a don v? t?i th?i di?m thay d?i. */
    @Column(length = 50)
    private String unitCode;

    /** Hành d?ng dă th?c hi?n: CREATED, UPDATED, DELETED, APPROVED, REJECTED. */
    @Column(nullable = false, length = 20)
    private String action;

    /** N?i dung chi ti?t c?a thay d?i (JSON ho?c mô t? text). */
    @Column(columnDefinition = "TEXT")
    private String details;

    /** Ngu?i th?c hi?n thay d?i. */
    @Column(name = "performed_by", nullable = false)
    private UUID performedBy;

    /** Tên ngu?i th?c hi?n (denormalized cho query nhanh). */
    @Column(length = 100)
    private String performedByName;

    /** Timestamp t?o record. */
    @Column(name = "performed_at", nullable = false)
    private java.time.LocalDateTime performedAt;

    /**
     * T?o m?i record UnitHistory.
     */
    public static UnitHistory create(UUID unitId, String action, String details,
                                     UUID performedBy, String performedByName) {
        UnitHistory history = new UnitHistory();
        history.setUnitId(unitId);
        history.setAction(action);
        history.setDetails(details);
        history.setPerformedBy(performedBy);
        history.setPerformedByName(performedByName);
        history.setPerformedAt(java.time.LocalDateTime.now());
        return history;
    }
}
