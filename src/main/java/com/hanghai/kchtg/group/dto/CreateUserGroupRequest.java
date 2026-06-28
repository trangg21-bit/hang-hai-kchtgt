package com.hanghai.kchtg.group.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Request body cho việc tạo mới UserGroup (BR-012: groupType).
 */
public class CreateUserGroupRequest {

    @NotBlank(message = "Tên nhóm không được để trống")
    @Size(max = 100, message = "Tên nhóm tối đa 100 ký tự")
    private String name;

    @NotBlank(message = "Mã nhóm không được để trống")
    @Size(max = 50, message = "Mã nhóm tối đa 50 ký tự")
    private String code;

    @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
    private String description;

    /** Loai nhom: department, project, custom (BR-012). */
    @NotBlank(message = "Loại nhóm không được để trống")
    @Size(max = 30, message = "Loại nhóm tối đa 30 ký tự")
    private String groupType;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getGroupType() { return groupType; }
    public void setGroupType(String groupType) { this.groupType = groupType; }
}
