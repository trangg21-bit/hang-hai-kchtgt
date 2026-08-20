package com.hanghai.kchtg.security.service;

import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

/** Redis-safe authentication snapshot without JPA relations or proxies. */
public record UserSecuritySnapshot(
        UUID userId,
        String username,
        String email,
        String fullName,
        String phone,
        String address,
        String department,
        String position,
        String note,
        UserStatus status,
        LocalDateTime accountLockedUntil,
        Integer permissionVersion,
        UUID orgUnitId,
        String orgUnitName,
        Set<String> permissions) {

    public static UserSecuritySnapshot from(User user) {
        return new UserSecuritySnapshot(
                user.getId(), user.getUsername(), user.getEmail(), user.getFullName(),
                user.getPhone(), user.getAddress(), user.getDepartment(), user.getPosition(),
                user.getNote(), user.getStatus(), user.getAccountLockedUntil(),
                user.getPermissionVersion(),
                user.getOrgUnit() == null ? null : user.getOrgUnit().getId(),
                user.getOrgUnit() == null ? null : user.getOrgUnit().getName(),
                Set.copyOf(user.getAllPermissions()));
    }
}
