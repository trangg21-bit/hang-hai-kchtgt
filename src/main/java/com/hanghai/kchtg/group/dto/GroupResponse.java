package com.hanghai.kchtg.group.dto;

import com.hanghai.kchtg.group.entity.GroupStatus;
import com.hanghai.kchtg.group.entity.UserGroup;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO tráº£ vá» khi truy váº¥n thĂ´ng tin nhĂ³m ngÆ°á»i dĂ¹ng.
 * <p>
 * Sá»­ dá»¥ng {@code @Value} (immutable) Ä‘á»ƒ pháº£n chiáº¿u triáº¿t lĂ½ cá»§a {@code ApiResponse}.
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
     * Map tá»« entity sang response DTO.
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
