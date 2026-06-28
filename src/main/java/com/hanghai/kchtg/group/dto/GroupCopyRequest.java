package com.hanghai.kchtg.group.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body cho việc sao chép nhóm (BR-014).
 */
public class GroupCopyRequest {

    @NotBlank(message = "Tên nhóm sao chép không được để trống")
    @Size(max = 100, message = "Tên nhóm tối đa 100 ký tự")
    private String name;

    @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
    private String description;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
