package com.hanghai.kchtg.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO returned after verification attempt.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VerifyResponse {

    private boolean verified;
    private String message;
    private String previousStatus;
    private String newStatus;
}