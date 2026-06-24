package com.hanghai.kchtg.user.entity;

/**
 * Trạng thái của vai trò.
 */
public enum RoleStatus {
    /** Vai trò đang hoạt động. */
    ACTIVE,
    /** Vai trò bị vô hiệu hóa (không thể gán cho người dùng mới). */
    INACTIVE,
    /** Vai trò bị xóa (soft delete). */
    DELETED
}