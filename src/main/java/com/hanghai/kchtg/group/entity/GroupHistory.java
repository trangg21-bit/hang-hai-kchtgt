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
 * Lá»‹ch sá»­ thay Ä‘á»•i cá»§a nhĂ³m â€” ghi láº¡i má»i thao tĂ¡c CREATE / UPDATE / DELETE
 * Ä‘á»ƒ phá»¥c vá»¥ viá»‡c audit vĂ  khĂ´i phá»¥c náº¿u cáº§n.
 */
@Entity
@Table(name = "group_history")
@Getter
@Setter
@NoArgsConstructor
public class GroupHistory extends BaseEntity {

    /** ID cá»§a nhĂ³m bá»‹ thay Ä‘á»•i. */
    @Column(name = "user_group_id", nullable = false)
    private UUID userGroupId;

    /** TĂªn nhĂ³m táº¡i thá»i Ä‘iá»ƒm thay Ä‘á»•i. */
    @Column(length = 150)
    private String groupName;

    /** MĂ£ code cá»§a nhĂ³m táº¡i thá»i Ä‘iá»ƒm thay Ä‘á»•i. */
    @Column(length = 50)
    private String groupCode;

    /** HĂ nh Ä‘á»™ng Ä‘Ă£ thá»±c hiá»‡n: CREATED, UPDATED, DELETED. */
    @Column(nullable = false, length = 20)
    private String action;

    /** Ná»™i dung chi tiáº¿t cá»§a thay Ä‘á»•i (JSON hoáº·c mĂ´ táº£ text). */
    @Column(columnDefinition = "TEXT")
    private String details;

    /** NgÆ°á»i thá»±c hiá»‡n thay Ä‘á»•i. */
    @Column(name = "changed_by", nullable = false)
    private UUID changedBy;

    /** TĂªn ngÆ°á»i thá»±c hiá»‡n (denormalized cho query nhanh). */
    @Column(length = 100)
    private String changedByName;

    /** Timestamp táº¡o record (khĂ¡c vá»›i createdAt cá»§a BaseEntity). */
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
