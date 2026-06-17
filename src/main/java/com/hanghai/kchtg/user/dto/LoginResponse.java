package com.hanghai.kchtg.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO returned after successful login.
 * Contains the JWT token and basic user information.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    private String token;
    private String tokenType = "Bearer";
    private String username;
    private String fullName;
    private String role;

    public static LoginResponse of(String token, String username, String fullName, String role) {
        return new LoginResponse(token, "Bearer", username, fullName, role);
    }
}
