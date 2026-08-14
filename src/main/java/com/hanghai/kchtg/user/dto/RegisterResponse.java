package com.hanghai.kchtg.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO returned after successful account registration.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterResponse {

    private java.util.UUID id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private String status;
    private String message;
}
