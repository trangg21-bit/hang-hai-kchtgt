package com.hanghai.kchtg.password.exception;

import lombok.Getter;

import java.util.List;

/**
 * Exception thrown when password does not meet complexity requirements (F-276).
 */
@Getter
public class PasswordComplexityException extends RuntimeException {

    private final List<String> violations;

    public PasswordComplexityException(String message, List<String> violations) {
        super(message);
        this.violations = violations;
    }

}
