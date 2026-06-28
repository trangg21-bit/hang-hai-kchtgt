package com.hanghai.kchtg.group.dto;

import com.hanghai.kchtg.group.entity.GroupMember;
import com.hanghai.kchtg.group.entity.GroupMemberStatus;
import com.hanghai.kchtg.group.entity.GroupStatus;
import com.hanghai.kchtg.group.entity.UserGroup;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO trả về khi truy vấn thông tin nhóm người dùng (with groupType and memberCount).
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
    String groupType;
    GroupStatus status;
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
                entity.getGroupType(),
                entity.getStatus(),
                memberCount,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
