package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.user.entity.LoginAttemptResult;
import com.hanghai.kchtg.user.entity.LoginAttemptType;
import com.hanghai.kchtg.user.entity.LoginAuditLog;
import com.hanghai.kchtg.user.repository.LoginAuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Service ghi nhật ký mỗi lần đăng nhập (CREDENTIALS / TOTP).
 * <p>
 * Lấy IP thực từ HttpServletRequest (Spring Security filter context).
 * </p>
 */
@Service
public class LoginAuditLogService {

    private static final Logger log = LoggerFactory.getLogger(LoginAuditLogService.class);

    private final LoginAuditLogRepository repository;

    public LoginAuditLogService(LoginAuditLogRepository repository) {
        this.repository = repository;
    }

    /**
     * Ghi nhận một lần đăng nhập.
     *
     * @param userId        UUID người dùng (null nếu chưa xác thực được)
     * @param username      tên đăng nhập (ghi lại để dễ tra cứu)
     * @param attemptType   loại đăng nhập (attempt type)
     * @param result        kết quả
     * @param failureReason lý do thất bại (null nếu thành công)
     * @param request       HttpServletRequest để lấy IP + User-Agent
     */
    @Transactional
    public void logAttempt(UUID userId, String username, LoginAttemptType attemptType,
                           LoginAttemptResult result, String failureReason,
                           HttpServletRequest request) {
        LoginAuditLog entry = new LoginAuditLog();
        entry.setUserId(userId);
        entry.setUsername(username);
        entry.setAttemptType(attemptType);
        entry.setResult(result);
        entry.setFailureReason(failureReason);
        entry.setIpAddress(extractIpAddress(request));
        entry.setUserAgent(extractUserAgent(request));
        entry.setAttemptedAt(LocalDateTime.now());

        repository.save(entry);
        log.info("Login audit: user={} type={} result={} reason={}",
                username, attemptType, result, failureReason);
    }

    /**
     * Lấy IP thực của client từ HttpServletRequest (xử lý proxy headers).
     */
    public String extractIpAddress(HttpServletRequest request) {
        return com.hanghai.kchtg.common.util.IpUtils.getClientIp(request);
    }

    /**
     * Lấy User-Agent từ request header.
     */
    public String extractUserAgent(HttpServletRequest request) {
        return request.getHeader("User-Agent");
    }
}