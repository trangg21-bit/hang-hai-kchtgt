package com.hanghai.kchtg.group.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Request body cho việc thêm thành viên vào nhóm.
 */
public class AddGroupMemberRequest {

    @NotNull(message = "ID người dùng không được để trống")
    private UUID userId;

    private String role = "member";

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}