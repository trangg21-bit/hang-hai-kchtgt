package com.hanghai.kchtg.password.exception;

/**
 * Thrown when a password matches a previously used password in history.
 */
public class PasswordHistoryException extends RuntimeException {

    public PasswordHistoryException(String message) {
        super(message);
    }
}