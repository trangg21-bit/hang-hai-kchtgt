package com.hanghai.kchtg.group.entity;

/**
 * Trạng thái thành viên trong nhóm.
 */
public enum GroupMemberStatus {
    /** Thành viên đang hoạt động. */
    ACTIVE,
    /** Đã rời nhóm. */
    REMOVED,
    /** Bị cấm khỏi nhóm. */
    BANNED
}
