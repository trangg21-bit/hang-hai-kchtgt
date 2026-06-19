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
 * Lịch sử thay đổi của nhóm — ghi lại mọi thao tác CREATE / UPDATE / DELETE
 * để phục vụ việc audit và khôi phục nếu cần.
 */
@Entity
@Table(name = "group_history")
@Getter
@Setter
@NoArgsConstructor
public class GroupHistory extends BaseEntity {

    /** ID của nhóm bị thay đổi. */
    @Column(name = "user_group_id", nullable = false)
    private UUID userGroupId;

    /** Tên nhóm tại thời điểm thay đổi. */
    @Column(length = 150)
    private String groupName;

    /** Mã code của nhóm tại thời điểm thay đổi. */
    @Column(length = 50)
    private String groupCode;

    /** Hành động đã thực hiện: CREATED, UPDATED, DELETED. */
    @Column(nullable = false, length = 20)
    private String action;

    /** Nội dung chi tiết của thay đổi (JSON hoặc mô tả text). */
    @Column(columnDefinition = "TEXT")
    private String details;

    /** Người thực hiện thay đổi. */
    @Column(name = "changed_by", nullable = false)
    private UUID changedBy;

    /** Tên người thực hiện (denormalized cho query nhanh). */
    @Column(length = 100)
    private String changedByName;

    /** Timestamp tạo record (khác với createdAt của BaseEntity). */
    @Column(name = "change_timestamp", nullable = false)
    private java.time.LocalDateTime changeTimestamp;

    public static GroupHistory create(UUID userGroupId, String action, String details, UUID changedBy, String changedByName) {
        GroupHistory history = new GroupHistory();
        history.setUserGroupId(userGroupId);
        history.setAction(action);
        history.setDetails(details);
        history.setChangedBy(changedBy);
        history.setChangedByName(changedByName);
        history.setChangeTimestamp(java.time.LocalDateTime.now());
        return history;
    }
}
