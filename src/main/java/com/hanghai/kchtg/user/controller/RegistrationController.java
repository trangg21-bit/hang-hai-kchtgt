package com.hanghai.kchtg.user.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.user.dto.RegisterAccountRequest;
import com.hanghai.kchtg.user.dto.RegisterResponse;
import com.hanghai.kchtg.user.service.RegistrationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Registration controller - handles POST /api/register.
 */
@RestController
@RequestMapping("/api/register")
public class RegistrationController {

    private static final Logger log = LoggerFactory.getLogger(RegistrationController.class);

    private final RegistrationService registrationService;

    public RegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    /**
     * Registers a new account.
     *
     * @param request registration data
     * @param requestInfo HTTP servlet request for IP/user-agent extraction
     * @return registration result
     */
    @PostMapping
    public ResponseEntity<ApiResponse<RegisterResponse>> register(
            @Valid @RequestBody RegisterAccountRequest request,
            HttpServletRequest requestInfo) {

        String ipAddress = getClientIp(requestInfo);
        String userAgent = requestInfo.getHeader("User-Agent");

        log.info("Registration request from IP={}, username={}", ipAddress, request.getUsername());

        RegisterResponse response = registrationService.register(request, ipAddress, userAgent);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng ký thành công", response));
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isEmpty()) {
            return xfHeader.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}