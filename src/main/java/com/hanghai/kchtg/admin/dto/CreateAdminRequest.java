package com.hanghai.kchtg.admin.dto;

import com.hanghai.kchtg.admin.entity.AdminRole;
import com.hanghai.kchtg.admin.entity.AdminStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class CreateAdminRequest {

    @NotNull(message = "ID người dùng không được để trống")
    private UUID userId;

    @NotNull(message = "Vai trò không được để trống")
    private AdminRole role;

    private List<String> modules;

    @NotNull(message = "Trạng thái không được để trống")
    private AdminStatus status = AdminStatus.ACTIVE;
}