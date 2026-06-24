package com.hanghai.kchtg.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO tra ve sau khi xac thuc 2-pha thanh cong.
 * Chua access_token, refresh_token va thong tin user.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TwoFactorLoginResponse {

    /** JWT access token (15 phút) */
    private String accessToken;

    /** JWT refresh token (7 ngày) */
    private String refreshToken;

    /** Token type */
    private String tokenType = "Bearer";

    /** Thong tin user co ban */
    private UserInfo user;

    /** Thoi han het hạn cua access token (epoch ms) */
    private long accessTokenExpiresIn;

    /** Thoi han het hạn cua refresh token (epoch ms) */
    private long refreshTokenExpiresIn;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private java.util.UUID id;
        private String username;
        private String fullName;
        private String email;
        private String role;
        private boolean totpEnabled;
    }
}