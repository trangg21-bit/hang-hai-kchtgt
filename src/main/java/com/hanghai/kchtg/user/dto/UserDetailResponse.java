package com.hanghai.kchtg.user.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.user.entity.User;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** Complete user detail response, including authorization and audit metadata. */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserDetailResponse {
    private UUID id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private UUID orgUnitId;
    private String orgUnitName;
    private List<UUID> groupIds;
    private List<String> groupNames;
    private List<String> permissionCodes;
    private com.hanghai.kchtg.user.entity.UserStatus status;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;
    private String createdByName;
    private UUID updatedBy;
    private String updatedByName;
    private UUID deletedBy;

    public static UserDetailResponse from(User user, OrgUnitCacheService cache, java.util.Map<UUID, String> auditNames) {
        UserDetailResponse response = new UserDetailResponse();
        response.id = user.getId();
        response.username = user.getUsername();
        response.email = user.getEmail();
        response.fullName = user.getFullName();
        response.phone = user.getPhone();
        response.orgUnitId = user.getOrgUnit() == null ? null : user.getOrgUnit().getId();
        response.orgUnitName = response.orgUnitId == null || cache == null ? null : cache.getName(response.orgUnitId);
        if (response.orgUnitName == null && user.getOrgUnit() != null) response.orgUnitName = user.getOrgUnit().getName();
        response.groupIds = user.getGroups() == null ? List.of() : user.getGroups().stream().map(g -> g.getId()).toList();
        response.groupNames = user.getGroups() == null ? List.of() : user.getGroups().stream().map(g -> g.getName()).toList();
        response.permissionCodes = user.getAllPermissions().stream().sorted().toList();
        response.status = user.getStatus();
        response.lastLoginAt = user.getLastLoginAt();
        response.createdAt = user.getCreatedAt();
        response.updatedAt = user.getUpdatedAt();
        response.createdBy = user.getCreatedBy();
        response.updatedBy = user.getUpdatedBy();
        response.deletedBy = user.getDeletedBy();
        response.createdByName = auditNames == null ? null : auditNames.get(user.getCreatedBy());
        response.updatedByName = auditNames == null ? null : auditNames.get(user.getUpdatedBy());
        return response;
    }
}
