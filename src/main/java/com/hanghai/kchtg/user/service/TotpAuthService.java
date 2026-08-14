package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.lockout.dto.enums.LockoutStatus;
import com.hanghai.kchtg.password.service.PasswordHashService;
import com.hanghai.kchtg.lockout.service.LockoutService;
import com.hanghai.kchtg.security.TotpValidator;
import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.user.dto.MfaChallengeResponse;
import com.hanghai.kchtg.user.dto.TotpLoginRequest;
import com.hanghai.kchtg.user.dto.TwoFactorLoginResponse;
import com.hanghai.kchtg.user.entity.LoginAttemptResult;
import com.hanghai.kchtg.user.entity.LoginAttemptType;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final PasswordHashService passwordHashService;
    private final TotpValidator totpValidator;
    private final TokenService tokenService;
    private final LoginAuditLogService auditLogService;
    private final LockoutService lockoutService;

    public TotpAuthService(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           PasswordHashService passwordHashService,
                           TotpValidator totpValidator,
                           TokenService tokenService,
                           LoginAuditLogService auditLogService,
                           LockoutService lockoutService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordHashService = passwordHashService;
        this.totpValidator = totpValidator;
        this.tokenService = tokenService;
        this.auditLogService = auditLogService;
        this.lockoutService = lockoutService;
    }
    // =========================================================================

    /**
     * Giai đoạn 1: Xác thực username + password.
     * <p>
     * Nếu thành công: kiểm tra TOTP - nếu user đã kích hoạt (enable) TOTP thì trả về
     * MfaChallengeResponse (yêu cầu mã 2 yếu tố). Nếu chưa kích hoạt thì trả về
     * MfaChallengeResponse với skipTotp=true (bỏ qua bước TOTP, client
     * có thể trả về JWT từ session - phase 1.5 nếu cần).
     * </p>
     *
     * @param username tên đăng nhập
     * @param password mật khẩu
     * @param request  HttpServletRequest để log IP + User-Agent
     * @return MfaChallengeResponse
     * @throws IllegalArgumentException nếu sai tài khoản/mật khẩu, tài khoản bị khóa, ...
     */
    @Transactional(noRollbackFor = IllegalArgumentException.class)
    public MfaChallengeResponse authenticateCredentials(String username, String password,
                                                        HttpServletRequest request) {

        User user = userRepository.findByUsernameOrEmail(username)
                .orElse(null);

        // Always compute password match to avoid timing leaks
        boolean passwordValid = user != null
                ? passwordHashService.verify(user.getUsername(), password, user.getPassword())
                : passwordEncoder.matches(password, "$2a$dummy$never");

        // =========================================================================
        if (user == null) {
            auditLogService.logAttempt(null, username, LoginAttemptType.CREDENTIALS,
                    LoginAttemptResult.FAIL, "Không tìm thấy người dùng", request);
            throw new IllegalArgumentException("Tên đăng nhập hoặc mật khẩu không hợp lệ");
        }

        LockoutStatus lockoutStatus = lockoutService.checkLockout(user);
        if (lockoutStatus == LockoutStatus.LOCKED || user.getStatus() == UserStatus.LOCKED) {
            auditLogService.logAttempt(user.getId(), user.getUsername(),
                    LoginAttemptType.CREDENTIALS, LoginAttemptResult.FAIL,
                    "Tài khoản bị khóa", request);
            throw new IllegalArgumentException("Tài khoản đã bị khóa");
        }

        if (!passwordValid) {
            LockoutStatus failureStatus = lockoutService.recordFailure(
                    user, "Mật khẩu không hợp lệ", request);
            if (failureStatus == LockoutStatus.LOCKED) {
                throw new IllegalArgumentException(
                        "Tài khoản đã bị khóa trong 30 phút do đăng nhập sai 5 lần");
            }
            throw new IllegalArgumentException("Tên đăng nhập hoặc mật khẩu không hợp lệ");
        }

        // Lazy Upgrade: If password matches and stored password was a legacy hash, upgrade it to BCrypt
        if (!passwordHashService.isBcrypt(user.getPassword())) {
            String newBcryptHash = passwordHashService.hash(password);
            user.setPassword(newBcryptHash);
            userRepository.save(user);
            log.info("Automatically upgraded legacy password hash to BCrypt for user: {}", user.getUsername());
        }

        lockoutService.recordSuccess(user, request);

        // =========================================================================
        if (Boolean.TRUE.equals(user.getTotpEnabled())) {
            // Yêu cầu phase 2 (mã TOTP)
            MfaChallengeResponse response = MfaChallengeResponse.requireChallenge(user.getId());
            return response;
        }

        // =========================================================================
        // Client có thể gọi endpoint login/totp với skipTotp=true để lấy JWT
        MfaChallengeResponse response = MfaChallengeResponse.skipChallenge(user.getId());
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
    @Transactional(noRollbackFor = IllegalArgumentException.class)
    public TwoFactorLoginResponse verifyTotp(TotpLoginRequest request,
                                              HttpServletRequest requestHttp) {

        UUID userId = request.getUserId();
        String totpCode = request.getTotpCode();

        User user = userRepository.findByIdWithRelations(userId)
                .orElseThrow(() -> new IllegalArgumentException("ID người dùng không hợp lệ"));

        LockoutStatus lockoutStatus = lockoutService.checkLockout(user);
        if (lockoutStatus == LockoutStatus.LOCKED || user.getStatus() == UserStatus.LOCKED) {
            auditLogService.logAttempt(user.getId(), user.getUsername(),
                    LoginAttemptType.TOTP, LoginAttemptResult.FAIL,
                    "Tài khoản bị khóa", requestHttp);
            throw new IllegalArgumentException("Tài khoản đã bị khóa");
        }

        if (!Boolean.TRUE.equals(user.getTotpEnabled())) {
            auditLogService.logAttempt(user.getId(), user.getUsername(),
                    LoginAttemptType.TOTP, LoginAttemptResult.FAIL,
                    "Xác thực hai lớp (TOTP) chưa được kích hoạt cho tài khoản này", requestHttp);
            throw new IllegalArgumentException("Xác thực hai lớp (TOTP) chưa được kích hoạt cho tài khoản này");
        }

        // =========================================================================
        if (totpCode == null || totpCode.length() != 6) {
            auditLogService.logAttempt(user.getId(), user.getUsername(),
                    LoginAttemptType.TOTP, LoginAttemptResult.FAIL,
                    "Định dạng mã TOTP không hợp lệ", requestHttp);
            throw new IllegalArgumentException("Mã xác thực hai lớp (TOTP) không hợp lệ");
        }

        boolean totpValid = totpValidator.isValid(user.getTotpSecret(), totpCode);

        if (!totpValid) {
            // Tăng failedTotpCount
            int newCount = user.getFailedTotpCount() + 1;
            user.setFailedTotpCount(newCount);

            // Nếu đạt ngưỡng -> khóa tài khoản 30 phút
            if (newCount >= MAX_TOTP_ATTEMPTS) {
                user.setAccountLockedUntil(LocalDateTime.now().plusMinutes(30));
                user.setStatus(UserStatus.LOCKED);
            }

            userRepository.save(user);

            auditLogService.logAttempt(user.getId(), user.getUsername(),
                    LoginAttemptType.TOTP, LoginAttemptResult.FAIL,
                    "Mã TOTP không hợp lệ (lần thử " + newCount + "/" + MAX_TOTP_ATTEMPTS + ")", requestHttp);

            throw new IllegalArgumentException("Mã xác thực hai lớp (TOTP) không hợp lệ");
        }

        // =========================================================================
        user.setFailedTotpCount(0);
        user.setTotpVerifiedAt(LocalDateTime.now());
        user.setLastLoginAt(LocalDateTime.now());
        // Xóa khóa (lock) nếu có (user đã xác thực thành công)
        lockoutService.recordSuccess(user, requestHttp);

        // =========================================================================
        String accessToken = tokenService.createAccessToken(user);
        String refreshToken = tokenService.createRefreshToken(user);

        TwoFactorLoginResponse.UserInfo userInfo = new TwoFactorLoginResponse.UserInfo();
        userInfo.setId(user.getId());
        userInfo.setUsername(user.getUsername());
        userInfo.setFullName(user.getFullName());
        userInfo.setEmail(user.getEmail());
        userInfo.setRole(null);
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
                throw new IllegalArgumentException("Loại token không hợp lệ - không phải là refresh token");
            }

            String username = claims.getSubject();
            String userIdStr = claims.get("user_id", String.class);
            UUID userId = UUID.fromString(userIdStr);

            User user = userRepository.findByIdWithRelations(userId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));

            if (user.getStatus() == UserStatus.LOCKED) {
                throw new IllegalArgumentException("Tài khoản đã bị khóa");
            }

            String newAccessToken = tokenService.createAccessToken(user);
            auditLogService.logAttempt(user.getId(), user.getUsername(),
                    LoginAttemptType.CREDENTIALS, LoginAttemptResult.SUCCESS,
                    "Làm mới token", requestHttp);
            return newAccessToken;

        } catch (Exception e) {
            auditLogService.logAttempt(null, "unknown", LoginAttemptType.CREDENTIALS,
                    LoginAttemptResult.FAIL, "Làm mới token failed: " + e.getMessage(), requestHttp);
            throw new IllegalArgumentException("Refresh token không hợp lệ hoặc đã hết hạn");
        }
    }
}
