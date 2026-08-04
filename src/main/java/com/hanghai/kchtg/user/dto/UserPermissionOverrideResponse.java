package com.hanghai.kchtg.user.dto;

import com.hanghai.kchtg.user.entity.UserPermissionOverride;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class UserPermissionOverrideResponse {
    private UUID id;
    private UUID userId;
    private String permissionCode;
    private String reason;
    private LocalDateTime createdAt;

    public static UserPermissionOverrideResponse from(UserPermissionOverride value) {
        return new UserPermissionOverrideResponse(value.getId(), value.getUser().getId(),
                value.getPermissionCode(), value.getReason(), value.getCreatedAt());
    }
}
