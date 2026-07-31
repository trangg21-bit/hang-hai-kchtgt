package com.hanghai.kchtg.group.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

/**
 * Request body cho việc thêm thành viên vào nhóm.
 */
@Data
public class AddGroupMemberRequest {

    @NotNull(message = "ID người dùng không được để trống")
    private UUID userId;

}
