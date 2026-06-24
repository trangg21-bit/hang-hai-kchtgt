package com.hanghai.kchtg.user.exception;

/**
 * Exception cơ sở cho tất cả lỗiiiiiii đăng ký tài khoản.
 */
public class RegistrationException extends RuntimeException {

    private final String errorCode;

    public RegistrationException(String message) {
        super(message);
        this.errorCode = "REGISTRATION_ERROR";
    }

    public RegistrationException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public RegistrationException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = "REGISTRATION_ERROR";
    }

    public String getErrorCode() {
        return errorCode;
    }
}