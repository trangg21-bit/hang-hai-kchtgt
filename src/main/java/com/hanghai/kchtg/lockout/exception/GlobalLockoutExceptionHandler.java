package com.hanghai.kchtg.lockout.exception;

import com.hanghai.kchtg.common.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Global exception handler for lockout-related exceptions (F-277).
 */
@RestControllerAdvice
public class GlobalLockoutExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalLockoutExceptionHandler.class);

    @ExceptionHandler(AccountLockedException.class)
    public ApiResponse<Void> handleAccountLocked(AccountLockedException ex) {
        log.warn("Account locked: {}", ex.getMessage());
        return ApiResponse.error(ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ApiResponse<Void> handleGeneric(Exception ex) {
        log.error("Unexpected lockout error", ex);
        return ApiResponse.error("Lỗi hệ thống");
    }
}
