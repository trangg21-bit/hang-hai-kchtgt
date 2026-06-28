package com.hanghai.kchtg.group.dto;

import jakarta.validation.constraints.Size;

/**
 * Request body cho việc cập nhật UserGroup (BR-012: groupType).
 */
public class UpdateUserGroupRequest {

    @Size(max = 100, message = "Tên nhóm tối đa 100 ký tự")
    private String name;

    @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
    private String description;

    @Size(max = 30, message = "Loại nhóm tối đa 30 ký tự")
    private String groupType;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getGroupType() { return groupType; }
    public void setGroupType(String groupType) { this.groupType = groupType; }
}
