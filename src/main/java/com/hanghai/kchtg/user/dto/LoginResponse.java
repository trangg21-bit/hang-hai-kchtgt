package com.hanghai.kchtg.user.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class LoginResponse {

    private String token;
    private String tokenType = "Bearer";
    private String username;
    private String fullName;
    private String role;
    private String status;
    private String message;

    public LoginResponse(String token, String tokenType, String username, String fullName, String role, String status) {
        this.token = token;
        this.tokenType = tokenType;
        this.username = username;
        this.fullName = fullName;
        this.role = role;
        this.status = status;
    }

    public static LoginResponse of(String token, String username, String fullName, String role) {
        return new LoginResponse(token, "Bearer", username, fullName, role, "authenticated");
    }

    public static LoginResponse totpSetupRequired(String username, String fullName, String role) {
        return new LoginResponse(null, null, username, fullName, role, "totp_setup_required");
    }

    public static LoginResponse error(String message) {
        LoginResponse resp = new LoginResponse();
        resp.setStatus("error");
        resp.setMessage(message);
        return resp;
    }
}