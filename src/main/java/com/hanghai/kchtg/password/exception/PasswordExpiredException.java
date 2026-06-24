package com.hanghai.kchtg.password.exception;

/**
 * Exception thrown when password is expired (F-276).
 */
public class PasswordExpiredException extends RuntimeException {

    public PasswordExpiredException(String message) {
        super(message);
    }
}