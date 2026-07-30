package com.hanghai.kchtg.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO returned after verification attempt.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VerifyResponse {

    private boolean verified;
    private String message;
    private String previousStatus;
    private String newStatus;
}
