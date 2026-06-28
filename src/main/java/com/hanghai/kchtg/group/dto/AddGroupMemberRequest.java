package com.hanghai.kchtg.group.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Request body cho việc thêm thành viên vào nhóm.
 */
public class AddGroupMemberRequest {

    @NotNull(message = "ID người dùng không được để trống")
    private UUID userId;

    @Size(max = 30, message = "Vai trò nhóm tối đa 30 ký tự")
    private String roleInGroup = "member";

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getRoleInGroup() { return roleInGroup; }
    public void setRoleInGroup(String roleInGroup) { this.roleInGroup = roleInGroup; }
}
