package com.hanghai.kchtg.security;

import com.hanghai.kchtg.user.entity.User;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

/**
 * Sensitivity of a business record. The ordinal is persisted in the database,
 * therefore new values must only be appended.
 * 0: NORMAL, 1: RESTRICTED, 2: CONFIDENTIAL.
 */
public enum RecordSecurityLevel {
    NORMAL,
    RESTRICTED,
    CONFIDENTIAL;

    public static final String RESTRICTED_PERMISSION = "vts:read:restricted";
    public static final String CONFIDENTIAL_PERMISSION = "vts:read:confidential";

    public static RecordSecurityLevel normalize(RecordSecurityLevel level) {
        return level == null ? NORMAL : level;
    }

    public static RecordSecurityLevel maxAllowed(User user) {
        return maxAllowed(user, false);
    }

    public static RecordSecurityLevel maxAllowed(User user, boolean elevatedAdministrator) {
        return maxAllowed(user == null ? Set.of() : user.getAllPermissions(), elevatedAdministrator);
    }

    public static RecordSecurityLevel maxAllowed(Set<String> permissions) {
        return maxAllowed(permissions, false);
    }

    public static RecordSecurityLevel maxAllowed(Set<String> permissions, boolean elevatedAdministrator) {
        return maxAllowed(permissions, null, elevatedAdministrator);
    }

    public static RecordSecurityLevel maxAllowed(Set<String> permissions, String module, boolean elevatedAdministrator) {
        if (elevatedAdministrator) {
            return CONFIDENTIAL;
        }
        if (permissions == null || permissions.isEmpty()) {
            return NORMAL;
        }
        if (permissions.contains("admin:all") || permissions.contains("*")) {
            return CONFIDENTIAL;
        }
        // Module specific check
        if (module != null && !module.isBlank()) {
            String m = module.toLowerCase().trim();
            if (permissions.contains(m + ":read:confidential") || permissions.contains(m + ":confidential")) {
                return CONFIDENTIAL;
            }
            if (permissions.contains(m + ":read:restricted") || permissions.contains(m + ":restricted")) {
                return RESTRICTED;
            }
        }
        // Global or general check
        boolean hasConfidential = permissions.contains(CONFIDENTIAL_PERMISSION)
                || permissions.contains("security:confidential")
                || permissions.contains("security:read:confidential")
                || permissions.stream().anyMatch(p -> p.endsWith(":read:confidential") || p.endsWith(":confidential"));
        if (hasConfidential) {
            return CONFIDENTIAL;
        }

        boolean hasRestricted = permissions.contains(RESTRICTED_PERMISSION)
                || permissions.contains("security:restricted")
                || permissions.contains("security:read:restricted")
                || permissions.stream().anyMatch(p -> p.endsWith(":read:restricted") || p.endsWith(":restricted"));
        if (hasRestricted) {
            return RESTRICTED;
        }

        return NORMAL;
    }

    /**
     * Các mức bảo mật mà tài khoản hiện tại được phép nhìn thấy.
     *
     * Dùng cho mệnh đề {@code IN (:levels)} của truy vấn: JPQL không so sánh được
     * enum bằng {@code <=}, nên trần quyền được quy đổi sẵn thành danh sách mức.
     */
    public static List<RecordSecurityLevel> allowedLevels(Set<String> permissions, String module,
                                                          boolean elevatedAdministrator) {
        RecordSecurityLevel max = maxAllowed(permissions, module, elevatedAdministrator);
        return Arrays.stream(values())
                .filter(level -> level.ordinal() <= max.ordinal())
                .toList();
    }

    public static boolean isAllowed(RecordSecurityLevel recordLevel, User user, boolean elevatedAdministrator) {
        return normalize(recordLevel).ordinal() <= maxAllowed(user, elevatedAdministrator).ordinal();
    }

    public static boolean isAllowed(RecordSecurityLevel recordLevel, Set<String> permissions,
                                    boolean elevatedAdministrator) {
        return isAllowed(recordLevel, permissions, null, elevatedAdministrator);
    }

    public static boolean isAllowed(RecordSecurityLevel recordLevel, Set<String> permissions,
                                    String module, boolean elevatedAdministrator) {
        return normalize(recordLevel).ordinal() <= maxAllowed(permissions, module, elevatedAdministrator).ordinal();
    }

    public static boolean isAllowed(RecordSecurityLevel recordLevel, User user) {
        return isAllowed(recordLevel, user, false);
    }

    public static void validateAssignment(RecordSecurityLevel requestedLevel, Set<String> permissions,
                                           boolean elevatedAdministrator) {
        validateAssignment(requestedLevel, permissions, null, elevatedAdministrator);
    }

    public static void validateAssignment(RecordSecurityLevel requestedLevel, Set<String> permissions,
                                           String module, boolean elevatedAdministrator) {
        RecordSecurityLevel normalized = normalize(requestedLevel);
        if (!isAllowed(normalized, permissions, module, elevatedAdministrator)) {
            throw new IllegalArgumentException("Tài khoản không có quyền gán mức bảo mật " + normalized.name());
        }
    }

    public static void validateAssignment(RecordSecurityLevel requestedLevel, String module,
                                           Set<String> permissions, boolean elevatedAdministrator) {
        validateAssignment(requestedLevel, permissions, module, elevatedAdministrator);
    }
}
