package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.security.TotpValidator;
import com.hanghai.kchtg.user.dto.MfaChallengeResponse;
import com.hanghai.kchtg.user.dto.TotpLoginRequest;
import com.hanghai.kchtg.user.dto.TwoFactorLoginResponse;
import com.hanghai.kchtg.user.entity.LoginAttemptResult;
import com.hanghai.kchtg.user.entity.LoginAttemptType;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Điều phối (Orchestrator) 2 bước đăng nhập với TOTP (F-273 Wave 1).
 * <p>
 * <b>Giai đoạn 1 (Phase 1)</b> - {@link #authenticateCredentials(String, String, HttpServletRequest)}:
 * xác thực username + password, trả về MfaChallengeResponse (yêu cầu TOTP hay không).<br>
 * <b>Giai đoạn 2 (Phase 2)</b> - {@link #verifyTotp(TotpLoginRequest, HttpServletRequest)}:
 * xác thực code TOTP, trả về access+refresh JWT.
 * </p>
 * <p>
 * "Always-compute" chống dò tìm tài khoản: luôn chạy {@code passwordEncoder.matches()}
 * (với dummy hash) nếu user không tồn tại, để tránh rò rỉ (leak) thông tin user.
 * </p>
 */
@Service
public class TotpAuthService {

    private static final Logger log = LoggerFactory.getLogger(TotpAuthService.class);

    /** Ngưỡng thất bại TOTP trước khi khóa tài khoản */
    private static final int MAX_TOTP_ATTEMPTS = 5;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TotpValidator totpValidator;
    private final TokenService tokenService;
    private final LoginAuditLogService auditLogService;

    public TotpAuthService(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           TotpValidator totpValidator,
                           TokenService tokenService,
                           LoginAuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.totpValidator = totpValidator;
        this.tokenService = tokenService;
        this.auditLogService = auditLogService;
    }

    // =========================================================================

    /**
     * Giai đoạn 1: Xác thực username + password.
     * <p>
     * Nếu thành công: kiểm tra TOTP - nếu user đã kích hoạt (enable) TOTP thì trả về
     * MfaChallengeResponse (yêu cầu mã 2 yếu tố). Nếu chưa kích hoạt thì trả về
     * MfaChallengeResponse với totpRequired=false (bỏ qua bước TOTP, client
     * có thể trả về JWT từ session - phase 1.5 nếu cần).
     * </p>
     *
     * @param username tên đăng nhập
     * @param password mật khẩu
     * @param request  HttpServletRequest để log IP + User-Agent
     * @return MfaChallengeResponse
     * @throws IllegalArgumentException nếu sai tài khoản/mật khẩu, tài khoản bị khóa, ...
     */
    @Transactional
    public MfaChallengeResponse authenticateCredentials(String username, String password,
                                                        HttpServletRequest request) {

        // =========================================================================
        // =========================================================================
        User user = userRepository.findByUsernameOrEmail(username)
                .orElse(null);

        // Luôn chạy password check để tránh timing leak
        // Nếu user = null, dùng dummy hash
        String passwordToCheck = user != null ? user.getPassword() : "$2a$dummy$never";
        passwordEncoder.matches(password, passwordToCheck);

        // =========================================================================
        if (user == null) {
            auditLogService.logAttempt(null, username, LoginAttemptType.CREDENTIALS,
                    LoginAttemptResult.FAIL, "User not found", request);
            throw new IllegalArgumentException("Invalid username or password");
        }

        // =========================================================================
        if (user.getStatus() == UserStatus.LOCKED) {
            auditLogService.logAttempt(user.getId(), user.getUsername(),
                    LoginAttemptType.CREDENTIALS, LoginAttemptResult.FAIL,
                    "Account locked", request);
            throw new IllegalArgumentException("Account is locked");
        }

        if (user.getAccountLockedUntil() != null
                && LocalDateTime.now().isBefore(user.getAccountLockedUntil())) {
            auditLogService.logAttempt(user.getId(), user.getUsername(),
                    LoginAttemptType.CREDENTIALS, LoginAttemptResult.FAIL,
                    "Account locked until " + user.getAccountLockedUntil(), request);
            throw new IllegalArgumentException(
                    "Account is locked until " + user.getAccountLockedUntil().toString());
        }

        // =========================================================================
        if (!passwordEncoder.matches(password, user.getPassword())) {
            // Tăng failedLoginCount
            user.setFailedLoginCount(user.getFailedLoginCount() + 1);
            userRepository.save(user);

            auditLogService.logAttempt(user.getId(), user.getUsername(),
                    LoginAttemptType.CREDENTIALS, LoginAttemptResult.FAIL,
                    "Invalid password (attempt " + user.getFailedLoginCount() + ")", request);

            throw new IllegalArgumentException("Invalid username or password");
        }

        // =========================================================================
        user.setFailedLoginCount(0);

        // =========================================================================
        if (Boolean.TRUE.equals(user.getTotpEnabled())) {
            // Yêu cầu phase 2 (mã TOTP)
            MfaChallengeResponse response = MfaChallengeResponse.requireChallenge(user.getId());
            auditLogService.logAttempt(user.getId(), user.getUsername(),
                    LoginAttemptType.CREDENTIALS, LoginAttemptResult.SUCCESS,
                    null, request);
            return response;
        }

        // =========================================================================
        // Client có thể gọi endpoint login/totp với totpRequired=false để lấy JWT
        MfaChallengeResponse response = MfaChallengeResponse.skipChallenge(user.getId());
        auditLogService.logAttempt(user.getId(), user.getUsername(),
                LoginAttemptType.CREDENTIALS, LoginAttemptResult.SUCCESS,
                null, request);
        return response;
    }

    // =========================================================================

    /**
     * Giai đoạn 2: Xác thực mã TOTP, trả về dual JWT (access + refresh).
     *
     * @param request DTO chứa userId + totpCode
     * @param requestHttp HttpServletRequest để log IP + User-Agent
     * @return TwoFactorLoginResponse với access_token + refresh_token
     * @throws IllegalArgumentException nếu sai TOTP, tài khoản bị khóa, ...
     */
    @Transactional
    public TwoFactorLoginResponse verifyTotp(TotpLoginRequest request,
                                              HttpServletRequest requestHttp) {

        UUID userId = request.getUserId();
        String totpCode = request.getTotpCode();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid user ID"));

        // =========================================================================
        if (user.getStatus() == UserStatus.LOCKED) {
            auditLogService.logAttempt(user.getId(), user.getUsername(),
                    LoginAttemptType.TOTP, LoginAttemptResult.FAIL,
                    "Account locked", requestHttp);
            throw new IllegalArgumentException("Account is locked");
        }

        if (user.getAccountLockedUntil() != null
                && LocalDateTime.now().isBefore(user.getAccountLockedUntil())) {
            auditLogService.logAttempt(user.getId(), user.getUsername(),
                    LoginAttemptType.TOTP, LoginAttemptResult.FAIL,
                    "Account locked until " + user.getAccountLockedUntil(), requestHttp);
            throw new IllegalArgumentException(
                    "Account is locked until " + user.getAccountLockedUntil().toString());
        }

        // =========================================================================
        if (!Boolean.TRUE.equals(user.getTotpEnabled())) {
            auditLogService.logAttempt(user.getId(), user.getUsername(),
                    LoginAttemptType.TOTP, LoginAttemptResult.FAIL,
                    "TOTP not enabled for this account", requestHttp);
            throw new IllegalArgumentException("TOTP is not enabled for this account");
        }

        // =========================================================================
        if (totpCode == null || totpCode.length() != 6) {
            auditLogService.logAttempt(user.getId(), user.getUsername(),
                    LoginAttemptType.TOTP, LoginAttemptResult.FAIL,
                    "Invalid TOTP code format", requestHttp);
            throw new IllegalArgumentException("Invalid TOTP code");
        }

        boolean totpValid = totpValidator.isValid(user.getTotpSecret(), totpCode);

        if (!totpValid) {
            // Tăng failedTotpCount
            int newCount = user.getFailedTotpCount() + 1;
            user.setFailedTotpCount(newCount);

            // Nếu đạt ngưỡng -> khóa tài khoản 15 phút
            if (newCount >= MAX_TOTP_ATTEMPTS) {
                user.setAccountLockedUntil(LocalDateTime.now().plusMinutes(15));
            }

            userRepository.save(user);

            auditLogService.logAttempt(user.getId(), user.getUsername(),
                    LoginAttemptType.TOTP, LoginAttemptResult.FAIL,
                    "Invalid TOTP (attempt " + newCount + "/" + MAX_TOTP_ATTEMPTS + ")", requestHttp);

            throw new IllegalArgumentException("Invalid TOTP code");
        }

        // =========================================================================
        user.setFailedTotpCount(0);
        user.setLastTotpCode(totpCode);
        user.setTotpVerifiedAt(LocalDateTime.now());
        user.setLastLoginAt(LocalDateTime.now());
        // Xóa khóa (lock) nếu có (user đã xác thực thành công)
        user.setAccountLockedUntil(null);
        userRepository.save(user);

        // =========================================================================
        String accessToken = tokenService.createAccessToken(user);
        String refreshToken = tokenService.createRefreshToken(user);

        TwoFactorLoginResponse.UserInfo userInfo = new TwoFactorLoginResponse.UserInfo();
        userInfo.setId(user.getId());
        userInfo.setUsername(user.getUsername());
        userInfo.setFullName(user.getFullName());
        userInfo.setEmail(user.getEmail());
        userInfo.setRole(user.getRole() != null ? user.getRole() : "ROLE_USER");
        userInfo.setTotpEnabled(Boolean.TRUE.equals(user.getTotpEnabled()));

        TwoFactorLoginResponse response = new TwoFactorLoginResponse();
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setTokenType("Bearer");
        response.setUser(userInfo);
        response.setAccessTokenExpiresIn(tokenService.getAccessTokenExpiration());
        response.setRefreshTokenExpiresIn(tokenService.getRefreshTokenExpiration());

        auditLogService.logAttempt(user.getId(), user.getUsername(),
                LoginAttemptType.TOTP, LoginAttemptResult.SUCCESS,
                null, requestHttp);

        log.info("User logged in with 2FA: {} (userId={})", user.getUsername(), userId);
        return response;
    }

    /**
     * Refresh token endpoint - dùng refresh token để lấy access token mới.
     *
     * @param refreshToken JWT refresh token
     * @param requestHttp HttpServletRequest để log IP
     * @return JWT access token mới
     */
    @Transactional
    public String refreshToken(String refreshToken, HttpServletRequest requestHttp) {
        try {
            var claims = tokenService.validateToken(refreshToken);
            // Check token type claim
            String type = claims.get("type", String.class);
            if (!"refresh".equals(type)) {
                throw new IllegalArgumentException("Invalid token type - not a refresh token");
            }

            String username = claims.getSubject();
            String userIdStr = claims.get("user_id", String.class);
            UUID userId = UUID.fromString(userIdStr);

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            if (user.getStatus() == UserStatus.LOCKED) {
                throw new IllegalArgumentException("Account is locked");
            }

            String newAccessToken = tokenService.createAccessToken(user);
            auditLogService.logAttempt(user.getId(), user.getUsername(),
                    LoginAttemptType.CREDENTIALS, LoginAttemptResult.SUCCESS,
                    "Token refresh", requestHttp);
            return newAccessToken;

        } catch (Exception e) {
            auditLogService.logAttempt(null, "unknown", LoginAttemptType.CREDENTIALS,
                    LoginAttemptResult.FAIL, "Token refresh failed: " + e.getMessage(), requestHttp);
            throw new IllegalArgumentException("Invalid or expired refresh token");
        }
    }
}