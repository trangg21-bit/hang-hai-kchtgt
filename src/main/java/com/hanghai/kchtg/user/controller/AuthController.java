package com.hanghai.kchtg.user.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.security.JwtUtil;
import com.hanghai.kchtg.user.dto.LoginRequest;
import com.hanghai.kchtg.user.dto.LoginResponse;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Authentication controller — handles login via JWT.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Authenticates a user by username/password and returns a JWT token.
     *
     * @param request login credentials
     * @return JWT token and user info
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        if (user.getStatus() == com.hanghai.kchtg.user.entity.UserStatus.LOCKED) {
            throw new IllegalArgumentException("Account is locked");
        }

        String role = user.getRole() != null ? user.getRole() : "ROLE_USER";
        String token = jwtUtil.generateToken(user.getUsername(), role);

        LoginResponse response = LoginResponse.of(token, user.getUsername(), user.getFullName(), role);
        log.info("User logged in: {}", user.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }
}
