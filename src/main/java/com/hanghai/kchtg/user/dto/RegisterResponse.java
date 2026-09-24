package com.hanghai.kchtg.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO returned after successful account registration.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterResponse {

    private UUID id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private UUID orgUnitId;
    private String orgUnitName;
    private String department;
    private String position;
    private String status;
    private String message;
}
