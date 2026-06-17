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

    @NotNull(message = "userId is required")
    private UUID userId;

    @NotNull(message = "role is required")
    private AdminRole role;

    private List<String> modules;

    @NotNull(message = "status is required")
    private AdminStatus status = AdminStatus.ACTIVE;
}
