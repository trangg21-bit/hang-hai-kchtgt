package com.hanghai.kchtg.group.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * Request body cho việc cập nhật UserGroup.
 */
@Data
public class UpdateGroupRequest {

    @Size(max = 150, message = "Tên nhóm tối đa 150 ký tự")
    private String name;

    @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
    private String description;

    private List<String> permissions;
    private String status;

}
