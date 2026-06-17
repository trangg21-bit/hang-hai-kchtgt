package com.hanghai.kchtg.dataconnection.dto;

import lombok.Builder;
import lombok.Value;

/**
 * Result of a connectivity test for a data connection.
 */
@Value
@Builder
public class TestConnectionResponse {
    boolean success;
    String message;
    long responseTimeMs;
    int responseCode;
}