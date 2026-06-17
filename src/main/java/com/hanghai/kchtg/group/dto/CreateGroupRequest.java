package com.hanghai.kchtg.group.dto;

import com.hanghai.kchtg.group.entity.GroupStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * DTO dùng khi tạo mới nhóm người dùng.
 */
@Data
public class CreateGroupRequest {

    @NotBlank(message = "Tên nhóm không được để trống")
    @Size(max = 150, message = "Tên nhóm không được vượt quá 150 ký tự")
    private String name;

    @NotBlank(message = "Mã nhóm không được để trống")
    @Size(max = 50, message = "Mã nhóm không được vượt quá 50 ký tự")
    private String code;

    @Size(max = 500, message = "Mô tả không được vượt quá 500 ký tự")
    private String description;

    private List<String> permissions = new ArrayList<>();

    private GroupStatus status = GroupStatus.ACTIVE;
}
