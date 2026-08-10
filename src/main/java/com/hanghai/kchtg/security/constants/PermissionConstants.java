package com.hanghai.kchtg.security.constants;

/**
 * Hằng số quản lý các Permission Action chuẩn của hệ thống,
 * thay thế hoàn toàn các chuỗi hardcode thô (Raw Strings).
 */
public final class PermissionConstants {

    private PermissionConstants() {}

    public static final String ACTION_READ = "read";
    public static final String ACTION_CREATE = "create";
    public static final String ACTION_UPDATE = "update";
    public static final String ACTION_DELETE = "delete";
    public static final String ACTION_APPROVE = "approve";
    public static final String ACTION_APPROVE_C1 = "approvec1";
    public static final String ACTION_APPROVE_C2 = "approvec2";
    public static final String ACTION_MANAGE = "manage";
    public static final String ACTION_WRITE = "write";
    public static final String ACTION_HISTORY = "history";
    public static final String ACTION_WILDCARD = "*";

    /**
     * Tạo mã permission đầy đủ dạng resource:action
     */
    public static String build(String resource, String action) {
        return resource + ":" + action;
    }
}
