package com.hanghai.kchtg.group.dto;

import java.util.UUID;

import com.hanghai.kchtg.group.entity.GroupStatus;
import com.hanghai.kchtg.group.entity.GroupType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

import lombok.Getter;
import lombok.Setter;

/**
 * Request body cho việc tạo mới UserGroup (BR-012: groupType).
 */
@Getter
@Setter
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
    @NotNull(message = "Loại nhóm không được để trống")
    private GroupType groupType;

    /** Trang thai: ACTIVE hoac INACTIVE. */
    private GroupStatus status;
}
