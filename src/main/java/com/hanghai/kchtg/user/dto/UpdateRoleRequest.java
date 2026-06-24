package com.hanghai.kchtg.user.dto;

import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Request body cho việc cập nhật Role.
 * Tất cả các trường đều optional - chỉ những trường khác null sẽ được cập nhật.
 */
public class UpdateRoleRequest {

    @Size(max = 100, message = "Tên vai trò tối đa 100 ký tự")
    private String name;

    @Size(max = 50, message = "Code vai trò tối đa 50 ký tự")
    private String code;

    @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
    private String description;

    private List<String> permissions;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public List<String> getPermissions() { return permissions; }
    public void setPermissions(List<String> permissions) { this.permissions = permissions; }
}