package com.hanghai.kchtg.group.dto;

import com.hanghai.kchtg.group.entity.GroupStatus;
import com.hanghai.kchtg.group.entity.UserGroup;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO trả về khi truy vấn thông tin nhóm người dùng.
 * <p>
 * Sử dụng {@code @Value} (immutable) để phản chiếu triết lý của {@code ApiResponse}.
 * </p>
 */
@Value
public class GroupResponse {

    UUID id;
    String name;
    String code;
    String description;
    List<String> permissions;
    GroupStatus status;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    /**
     * Map từ entity sang response DTO.
     */
    public static GroupResponse from(UserGroup entity) {
        return new GroupResponse(
                entity.getId(),
                entity.getName(),
                entity.getCode(),
                entity.getDescription(),
                entity.getPermissions(),
                entity.getStatus(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
