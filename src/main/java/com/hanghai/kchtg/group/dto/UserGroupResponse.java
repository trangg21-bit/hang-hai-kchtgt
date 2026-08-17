package com.hanghai.kchtg.group.dto;

import com.hanghai.kchtg.group.entity.GroupStatus;
import com.hanghai.kchtg.group.entity.UserGroup;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO trả về khi truy vấn thông tin nhóm người dùng.
 * <p>
 * Immutable record-style DTO using @Value (Lombok).
 * </p>
 */
@Value
public class UserGroupResponse {

    UUID id;
    String name;
    String code;
    String description;
    GroupStatus status;
    UUID organizationId;
    String organizationName;
    String createdByName;
    String updatedByName;
    long memberCount;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    /**
     * Map from entity to response DTO, counting active members.
     */
    public static UserGroupResponse from(UserGroup entity, long memberCount) {
        return new UserGroupResponse(
                entity.getId(),
                entity.getName(),
                entity.getCode(),
                entity.getDescription(),
                entity.getStatus(),
                null,
                null,
                null,
                null,
                memberCount,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    /**
     * Map from entity to response DTO with organization name resolved.
     */
    public static UserGroupResponse from(UserGroup entity, long memberCount, String organizationName) {
        return from(entity, memberCount, organizationName, null, null);
    }

    /**
     * Map from entity to response DTO with organization and creator display names resolved.
     */
    public static UserGroupResponse from(UserGroup entity, long memberCount, String organizationName,
            String createdByName) {
        return from(entity, memberCount, organizationName, createdByName, null);
    }

    public static UserGroupResponse from(UserGroup entity, long memberCount, String organizationName,
            String createdByName, String updatedByName) {
        return new UserGroupResponse(
                entity.getId(),
                entity.getName(),
                entity.getCode(),
                entity.getDescription(),
                entity.getStatus(),
                entity.getOrganizationId(),
                organizationName,
                createdByName,
                updatedByName,
                memberCount,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
