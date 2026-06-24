package com.hanghai.kchtg.user.dto;

import com.hanghai.kchtg.user.entity.UserStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO yêu cầu thay đổi trạng thái tài khoản.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChangeStatusRequest {

    @NotNull(message = "Trạng thái không được để trống")
    private UserStatus status;
}