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
 * Lịch sử thay đổi của đơn vị tổ chức - ghi lại mọi thao tác CREATE / UPDATE / DELETE / APPROVE / REJECT
 * để phục vụ việc audit và khôi phục nếu cần.
 */
@Entity
@Table(name = "unit_history")
@Getter
@Setter
@NoArgsConstructor
public class UnitHistory extends BaseEntity {

    /** ID của đơn vị bị thay đổi. */
    @Column(name = "unit_id", nullable = false)
    private UUID unitId;

    /** Tên đơn vị tại thời điểm thay đổi. */
    @Column(length = 200)
    private String unitName;

    /** Mã code của đơn vị tại thời điểm thay đổi. */
    @Column(length = 50)
    private String unitCode;

    /** Hành động đã thực hiện: CREATED, UPDATED, DELETED, APPROVED, REJECTED. */
    @Column(nullable = false, length = 20)
    private String action;

    /** Nội dung chi tiết của thay đổi (JSON hoặc mô tả text). */
    @Column(columnDefinition = "TEXT")
    private String details;

    /** Người thực hiện thay đổi. */
    @Column(name = "performed_by", nullable = false)
    private UUID performedBy;

    /** Tên người thực hiện (denormalized cho query nhanh). */
    @Column(length = 100)
    private String performedByName;

    /** Timestamp tạo record. */
    @Column(name = "performed_at", nullable = false)
    private java.time.LocalDateTime performedAt;

    /**
     * Tạo mới record UnitHistory.
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