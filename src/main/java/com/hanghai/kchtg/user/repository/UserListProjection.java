package com.hanghai.kchtg.user.repository;

import com.hanghai.kchtg.user.entity.UserStatus;

import java.time.LocalDateTime;
import java.util.UUID;

/** Scalar projection used by the paged user list; it deliberately excludes roles, groups and audit details. */
public interface UserListProjection {
    UUID getId();
    String getUsername();
    String getEmail();
    String getFullName();
    UUID getOrgUnitId();
    UserStatus getStatus();
    LocalDateTime getLastLoginAt();
    String getRoleCode();
}
