package com.hanghai.kchtg.password.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body for PUT /api/admin/password-policy (partial update).
 */
@NoArgsConstructor
@AllArgsConstructor
@Data
public class PasswordPolicyUpdateRequest {

    @Min(value = 8, message = "Độ dài tối thiểu phải từ 8")
    @Max(value = 64, message = "Độ dài tối thiểu tối đa 64")
    private Integer minLength;

    private Boolean requireUppercase;
    private Boolean requireLowercase;
    private Boolean requireDigit;
    private Boolean requireSpecialChar;
    private String specialCharSet;

    @Min(value = 1, message = "Chu kỳ tối thiểu phải từ 1")
    @Max(value = 365, message = "Chu kỳ tối đa 365 ngày")
    private Integer maxAgeDays;

    @Min(value = 0, message = "Chiều sâu lịch sử phải từ 0")
    @Max(value = 50, message = "Chiều sâu lịch sử tối đa 50")
    private Integer historyDepth;

    private Boolean blockUsernameInPassword;
}
