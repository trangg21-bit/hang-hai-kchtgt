package com.hanghai.kchtg.lockout.exception;

/**
 * Thrown when the lockout policy singleton is not found.
 */
public class LockoutPolicyNotFoundException extends RuntimeException {

    public LockoutPolicyNotFoundException() {
        super("Chính sách giới hạn đăng nhập không được cấu hình");
    }
}