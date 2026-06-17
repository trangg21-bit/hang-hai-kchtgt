package com.hanghai.kchtg.group.dto;

import com.hanghai.kchtg.group.entity.GroupStatus;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * DTO dùng khi cập nhật nhóm người dùng — PATCH semantics.
 * <p>
 * Tất cả các trường đều tuỳ chọn; chỉ cập nhật những trường được gửi (khác {@code null}).
 * Mã nhóm (code) không được thay đổi sau khi tạo.
 * </p>
 */
@Data
public class UpdateGroupRequest {

    @Size(max = 150, message = "Tên nhóm không được vượt quá 150 ký tự")
    private String name;

    @Size(max = 500, message = "Mô tả không được vượt quá 500 ký tự")
    private String description;

    private List<String> permissions;

    private GroupStatus status;
}
