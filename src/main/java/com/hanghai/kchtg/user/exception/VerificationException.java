package com.hanghai.kchtg.user.exception;

/**
 * Ném khi xử lý token xác minh thất bại (hết hạn, không tồn tại, đã dùng).
 */
public class VerificationException extends RegistrationException {

    public VerificationException(String message) {
        super(message, "VERIFICATION_ERROR");
    }

    public VerificationException(String message, Throwable cause) {
        super(message, cause);
    }
}