package com.hanghai.kchtg.group.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Request body cho việc tạo mới UserGroup.
 */
public class CreateGroupRequest {

    @NotBlank(message = "Tên nhóm không được để trống")
    @Size(max = 150, message = "Tên nhóm tối đa 150 ký tự")
    private String name;

    @NotBlank(message = "Code nhóm không được để trống")
    @Size(max = 50, message = "Code nhóm tối đa 50 ký tự")
    private String code;

    @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
    private String description;

    private List<String> permissions;
    private String status;

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
}