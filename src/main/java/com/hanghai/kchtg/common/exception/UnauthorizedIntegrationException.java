package com.hanghai.kchtg.common.exception;

/**
 * Thrown when validation of the pre-shared integration token fails.
 */
public class UnauthorizedIntegrationException extends RuntimeException {

    public UnauthorizedIntegrationException(String message) {
        super(message);
    }
}
