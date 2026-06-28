package com.hanghai.kchtg.group.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * Lich su thay doi cua nhom - ghi lai moi thao tac CREATE / UPDATE / DELETE
 * de phuc vu viec audit va khoi phuc neu can.
 * <p>
 * M-001 F-002: Aligned with SA spec — action, performedBy, performedAt, notes.
 * </p>
 */
@Entity
@Table(name = "group_histories")
@Getter
@Setter
@NoArgsConstructor
public class GroupHistory extends BaseEntity {

    /** ID cua nhom bi thay doi. */
    @Column(name = "user_group_id", nullable = false)
    private UUID userGroupId;

    /** Ten nhom tai thoi diem thay doi (denormalized). */
    @Column(length = 100)
    private String groupName;

    /** Ma code cua nhom tai thoi diem thay doi (denormalized). */
    @Column(length = 50)
    private String groupCode;

    /** Hanh dong da thuc hien: CREATED, UPDATED, DELETED, MEMBER_ADDED, MEMBER_REMOVED, COPIED. */
    @Column(nullable = false, length = 30)
    private String action;

    /** Noi dung chi tiet cua thay doi (mo ta text). */
    @Column(columnDefinition = "TEXT")
    private String notes;

    /** Nguoi thuc hien thay doi (UUID FK to User). */
    @Column(name = "performed_by", nullable = false)
    private UUID performedBy;

    /** Ten nguoi thuc hien (denormalized cho query nhanh). */
    @Column(length = 100)
    private String performedByName;

    /** Thoi diem thay doi (khac voi createdAt cua BaseEntity). */
    @Column(name = "performed_at", nullable = false)
    private java.time.LocalDateTime performedAt;

    /**
     * Create a new GroupHistory entry.
     */
    public static GroupHistory create(UUID userGroupId, String action, String notes,
                                      UUID performedBy, String performedByName) {
        GroupHistory history = new GroupHistory();
        history.setUserGroupId(userGroupId);
        history.setAction(action);
        history.setNotes(notes);
        history.setPerformedBy(performedBy);
        history.setPerformedByName(performedByName);
        history.setPerformedAt(java.time.LocalDateTime.now());
        return history;
    }
}
