package com.hanghai.kchtg.user.exception;

/**
 * Ném khi dữ liệu đăng ký không đáp ứng chính sách mật khẩu hoặc định dạng.
 */
public class ValidationException extends RegistrationException {

    public ValidationException(String message) {
        super(message, "VALIDATION_ERROR");
    }

    public ValidationException(String message, String detail) {
        super(message + " (" + detail + ")", "VALIDATION_ERROR");
    }
}