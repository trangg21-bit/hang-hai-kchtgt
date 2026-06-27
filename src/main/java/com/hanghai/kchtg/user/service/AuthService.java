package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.security.JwtUtil;
import com.hanghai.kchtg.security.totp.service.TotpService;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final TotpService totpService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       TotpService totpService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.totpService = totpService;
    }

    public AuthResult authenticate(String identifier, String password) {
        Optional<User> userOpt = userRepository.findByUsername(identifier);
        if (!userOpt.isPresent()) {
            userOpt = userRepository.findByEmail(identifier);
        }
        if (!userOpt.isPresent() && identifier.matches("^\\+?[0-9]+$")) {
            userOpt = userRepository.findAll().stream()
                    .filter(u -> u.getPhone() != null && u.getPhone().equals(identifier))
                    .findFirst();
        }

        final User[] userArr = new User[1];
        userOpt.ifPresent(u -> userArr[0] = u);

        if (userArr[0] == null) {
            return new AuthError("Invalid username, email, or password");
        }

        User user = userArr[0];

        if (!passwordEncoder.matches(password, user.getPassword())) {
            return new AuthError("Invalid username, email, or password");
        }

        if (user.getStatus() == com.hanghai.kchtg.user.entity.UserStatus.LOCKED) {
            return new AuthError("Account is locked");
        }

        String role = user.getPrimaryRoleCode() != null ? user.getPrimaryRoleCode() : "ROLE_USER";

        if (Boolean.TRUE.equals(user.getTotpEnabled())) {
            return new TotpSetupRequired(user.getId().toString(), user.getUsername(), user.getFullName(), role);
        }

        String token = jwtUtil.generateTokenWithMfa(user.getUsername(), role, false);
        log.info("User logged in (no MFA): {}", user.getUsername());
        return new Authenticated(token, "Bearer", user.getUsername(), user.getFullName(), role);
    }

    /**
     * Sealed interface representing possible outcomes of authentication.
     */
    public sealed interface AuthResult {
        String userId();
        String username();
        String fullName();
        String role();
    }

    public record TotpSetupRequired(
            String userId,
            String username,
            String fullName,
            String role
    ) implements AuthResult {
    }

    public record Authenticated(
            String token,
            String tokenType,
            String username,
            String fullName,
            String role
    ) implements AuthResult {
        @Override
        public String userId() {
            return null;
        }
    }

    public record AuthError(String message) implements AuthResult {
        @Override public String userId() { return null; }
        @Override public String username() { return null; }
        @Override public String fullName() { return null; }
        @Override public String role() { return null; }
    }
}