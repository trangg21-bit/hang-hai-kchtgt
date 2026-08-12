package com.hanghai.kchtg.user.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.repository.UserListProjection;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/** Minimal response for the user list. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserListItemResponse {
    private UUID id;
    private String username;
    private String email;
    private String fullName;
    private UUID orgUnitId;
    private String orgUnitName;
    private String role;
    private UserStatus status;
    private LocalDateTime lastLoginAt;

    public static UserListItemResponse from(UserListProjection item, OrgUnitCacheService cache) {
        String orgUnitName = cache == null || item.getOrgUnitId() == null
                ? null
                : cache.getName(item.getOrgUnitId());
        return new UserListItemResponse(
                item.getId(), item.getUsername(), item.getEmail(), item.getFullName(),
                item.getOrgUnitId(), orgUnitName, item.getRoleCode(), item.getStatus(), item.getLastLoginAt());
    }
}
