package com.hanghai.kchtg.lockout.exception;

/**
 * Exception thrown when an account is locked (F-277).
 */
public class AccountLockedException extends RuntimeException {

    public AccountLockedException(String message) {
        super(message);
    }
}