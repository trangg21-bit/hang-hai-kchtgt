package com.hanghai.kchtg.group.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.util.UUID;

/**
 * Request body cho việc tạo mới UserGroup.
 */
@Data
public class CreateGroupRequest {

    @NotBlank(message = "Tên nhóm không được để trống")
    @Size(max = 150, message = "Tên nhóm tối đa 150 ký tự")
    private String name;

    @NotBlank(message = "Code nhóm không được để trống")
    @Size(max = 50, message = "Code nhóm tối đa 50 ký tự")
    private String code;

    @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
    private String description;

    private UUID organizationId;

    private List<String> permissions;
    private String status;

}
