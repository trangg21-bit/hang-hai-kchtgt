package com.hanghai.kchtg.password.exception;

import com.hanghai.kchtg.common.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Global exception handler for password-related exceptions (F-276).
 */
@RestControllerAdvice
public class GlobalPasswordExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalPasswordExceptionHandler.class);

    @ExceptionHandler(PasswordExpiredException.class)
    public ApiResponse<Void> handlePasswordExpired(PasswordExpiredException ex) {
        log.warn("Password expired: {}", ex.getMessage());
        return ApiResponse.error(ex.getMessage());
    }

    @ExceptionHandler(PasswordComplexityException.class)
    public ApiResponse<Void> handlePasswordComplexity(PasswordComplexityException ex) {
        log.warn("Password complexity violation: {}", ex.getMessage());
        return ApiResponse.error(ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ApiResponse<Void> handleGeneric(Exception ex) {
        log.error("Unexpected password error", ex);
        return ApiResponse.error("Đổi mật khẩu không thành công");
    }
}
