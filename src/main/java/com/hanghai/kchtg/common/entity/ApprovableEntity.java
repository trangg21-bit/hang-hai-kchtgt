package com.hanghai.kchtg.common.entity;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Interface chuẩn cho mọi thực thể Kết cấu hạ tầng hàng hải (KCHT)
 * tham gia vào quy trình phê duyệt tối đa 2 cấp theo tài liệu M-1006.
 */
public interface ApprovableEntity {

    UUID getId();

    ApprovalStatus getApprovalStatus();

    void setApprovalStatus(ApprovalStatus status);

    String getRejectionReason();

    void setRejectionReason(String reason);

    UUID getApproverLevel1();

    void setApproverLevel1(UUID userId);

    default void setApprovedDateLevel1(LocalDateTime date) {
    }

    UUID getApproverLevel2();

    void setApproverLevel2(UUID userId);

    default void setApprovedDateLevel2(LocalDateTime date) {
    }

    default UUID getCreatedBy() {
        return null;
    }

    default UUID getOrgUnitId() {
        return null;
    }

    /**
     * Workflow timestamp when the record was submitted for approval (#50).
     * Default no-op so generic approval services can write it for any ApprovableEntity;
     * only BaseApprovableEntity stores it.
     */
    default void setSubmittedAt(LocalDateTime submittedAt) {
    }

    /**
     * User who submitted the record for approval (#51).
     */
    default void setSubmittedBy(UUID userId) {
    }

    /**
     * Content of the level-1 approval/rejection decision (#54).
     */
    default void setLevel1ApprovalContent(String content) {
    }

    /**
     * Content of the level-2 approval/rejection decision (#57).
     */
    default void setLevel2ApprovalContent(String content) {
    }
}
