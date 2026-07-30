package com.hanghai.kchtg.user.dto;

import com.hanghai.kchtg.user.entity.UserStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO yêu cầu thay đổi trạng thái tài khoản.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChangeStatusRequest {

    @NotNull(message = "Trạng thái không được để trống")
    private UserStatus status;

    private String reason;
}
