package com.hanghai.kchtg.user.exception;

/**
 * Ném khi cố đăng ký với email/số điện thoại/trực tên đã tồn tại.
 */
public class DuplicateResourceException extends RegistrationException {

    public DuplicateResourceException(String field, String value) {
        super("Đã tồn tại tài khoản với " + field + ": " + value, "DUPLICATE_RESOURCE");
    }
}