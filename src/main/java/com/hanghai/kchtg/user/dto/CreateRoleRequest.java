package com.hanghai.kchtg.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * Request body cho việc tạo mới Role.
 */
@Data
public class CreateRoleRequest {

    @NotBlank(message = "Tên vai trò không được để trống")
    @Size(max = 100, message = "Tên vai trò tối đa 100 ký tự")
    private String name;

    @NotBlank(message = "Code vai trò không được để trống")
    @Size(max = 50, message = "Code vai trò tối đa 50 ký tự")
    private String code;

    @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
    private String description;

    private List<String> permissions;

}
