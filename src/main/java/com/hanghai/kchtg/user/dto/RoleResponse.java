package com.hanghai.kchtg.user.dto;

import com.hanghai.kchtg.user.entity.Role;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO tráº£ vá» khi query role.
 */
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

    public RoleResponse() {}

    public static RoleResponse from(Role role) {
        RoleResponse resp = new RoleResponse();
        resp.setId(role.getId().toString());
        resp.setName(role.getName());
        resp.setCode(role.getCode());
        resp.setDescription(role.getDescription());
        resp.setPermissions(role.getPermissions());
        resp.setStatus(role.getStatus() != null ? role.getStatus().name() : null);
        resp.setUserCount(role.getUserCount());
        resp.setCreatedAt(role.getCreatedAt());
        resp.setUpdatedAt(role.getUpdatedAt());
        return resp;
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public List<String> getPermissions() { return permissions; }
    public void setPermissions(List<String> permissions) { this.permissions = permissions; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getUserCount() { return userCount; }
    public void setUserCount(int userCount) { this.userCount = userCount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
