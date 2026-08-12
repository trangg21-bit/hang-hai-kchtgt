package com.hanghai.kchtg.user.dto;

import com.hanghai.kchtg.user.entity.Permission;
import com.hanghai.kchtg.user.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * DTO trả về khi query role.
 */
@NoArgsConstructor
@AllArgsConstructor
@Data
public class RoleResponse {

    private String id;
    private String name;
    private String code;
    private String description;
    private List<String> permissions;
    private String status;
    private int userCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static RoleResponse from(Role role) {
        RoleResponse resp = new RoleResponse();
        resp.setId(role.getId().toString());
        resp.setName(role.getName());
        resp.setCode(role.getCode());
        resp.setDescription(role.getDescription());
        List<String> permCodes = role.getPermissions().stream().map(Permission::getCode).collect(Collectors.toList());
        resp.setPermissions(permCodes);
        resp.setStatus(role.getStatus() != null ? role.getStatus().name() : null);
        resp.setUserCount(role.getUserCount());
        resp.setCreatedAt(role.getCreatedAt());
        resp.setUpdatedAt(role.getUpdatedAt());
        return resp;
    }
}
