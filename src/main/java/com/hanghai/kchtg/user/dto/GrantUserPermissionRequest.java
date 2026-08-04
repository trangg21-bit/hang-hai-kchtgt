package com.hanghai.kchtg.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class GrantUserPermissionRequest {

    @NotBlank(message = "Mã quyền không được để trống")
    private String permissionCode;

    private String reason;
}
