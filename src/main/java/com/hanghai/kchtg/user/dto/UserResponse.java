package com.hanghai.kchtg.user.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO trả về thông tin người dùng (không chứa mật khẩu).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponse {

    private UUID id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private String role;
    private UUID orgUnitId;
    private String orgUnitName;
    private List<UUID> groupIds;
    private List<String> groupNames;
    private UserStatus status;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Chuyển đổi từ {@link User} entity sang DTO response.
     * <p>
     * Gọi trong transaction để tránh LazyInitializationException.
     * </p>
     */
    public static UserResponse from(User user) {
        UUID oId = null;
        String oName = null;
        if (user.getOrgUnit() != null) {
            oId = user.getOrgUnit().getId();
            oName = user.getOrgUnit().getName();
        }

        List<UUID> gIds = List.of();
        List<String> gNames = List.of();
        if (user.getGroups() != null && !user.getGroups().isEmpty()) {
            gIds = user.getGroups().stream().map(g -> g.getId()).toList();
            gNames = user.getGroups().stream().map(g -> g.getName()).toList();
        }

        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getRole(),
                oId,
                oName,
                gIds,
                gNames,
                user.getStatus(),
                user.getLastLoginAt(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
