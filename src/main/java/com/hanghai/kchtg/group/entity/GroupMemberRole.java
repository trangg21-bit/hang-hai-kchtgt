package com.hanghai.kchtg.group.entity;

public enum GroupMemberRole {
    OWNER("owner"),     // 0
    ADMIN("admin"),     // 1
    MEMBER("member"),   // 2
    VIEWER("viewer");   // 3

    private final String value;

    GroupMemberRole(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static GroupMemberRole fromValue(String value) {
        if (value == null) return MEMBER;
        for (GroupMemberRole role : values()) {
            if (role.value.equalsIgnoreCase(value)) {
                return role;
            }
        }
        return MEMBER;
    }
}
