package com.hanghai.kchtg.group.dto;

import com.hanghai.kchtg.group.entity.GroupStatus;
import com.hanghai.kchtg.group.entity.GroupType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Request body cho việc tạo mới UserGroup (BR-012: groupType).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
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

    /** Đơn vị quản lý của nhóm (bắt buộc). */
    @NotNull(message = "Đơn vị không được để trống")
    private UUID organizationId;

    /** Trang thai: ACTIVE hoac INACTIVE. */
    private GroupStatus status;
}
