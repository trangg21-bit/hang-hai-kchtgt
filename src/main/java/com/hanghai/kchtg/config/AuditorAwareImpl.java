package com.hanghai.kchtg.config;

import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AuditorAwareImpl implements AuditorAware<UUID> {

    private final UserRepository userRepository;
    private static final ThreadLocal<Boolean> IS_LOOKING_UP = ThreadLocal.withInitial(() -> false);

    @Override
    public Optional<UUID> getCurrentAuditor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            return Optional.empty();
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof User) {
            return Optional.of(((User) principal).getId());
        }

        // Prevent infinite recursion during Hibernate auto-flush
        if (IS_LOOKING_UP.get()) {
            return Optional.empty();
        }

        try {
            IS_LOOKING_UP.set(true);
            return userRepository.findByUsername(authentication.getName())
                    .map(User::getId);
        } finally {
            IS_LOOKING_UP.remove();
        }
    }
}
