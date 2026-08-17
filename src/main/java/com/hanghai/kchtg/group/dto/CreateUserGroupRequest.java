package com.hanghai.kchtg.group.dto;

import com.hanghai.kchtg.group.entity.GroupStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Request body cho việc tạo mới UserGroup.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserGroupRequest {

    @NotBlank(message = "Tên nhóm không được để trống")
    @Size(min = 2, max = 100, message = "Tên nhóm phải từ 2 đến 100 ký tự")
    private String name;

    @NotBlank(message = "Mã nhóm không được để trống")
    @Size(min = 2, max = 30, message = "Mã nhóm phải từ 2 đến 30 ký tự")
    @Pattern(regexp = "^[A-Z0-9_]{2,30}$", message = "Mã nhóm chỉ gồm chữ hoa, số và dấu gạch dưới")
    private String code;

    @Size(max = 1000, message = "Mô tả tối đa 1000 ký tự")
    private String description;

    /** Đơn vị quản lý của nhóm (bắt buộc). */
    @NotNull(message = "Đơn vị không được để trống")
    private UUID organizationId;

    /** Trang thai: ACTIVE hoac INACTIVE. */
    private GroupStatus status;
}
