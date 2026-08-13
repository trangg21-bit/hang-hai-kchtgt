package com.hanghai.kchtg.config;

import com.hanghai.kchtg.user.entity.UserPermissionOverride;
import com.hanghai.kchtg.user.repository.UserPermissionOverrideRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

/**
 * Bootstrap legacy seeded users into direct user permissions.
 * Runtime authorization reads only user_permission_override; this runner does
 * not overwrite users that already have direct grants.
 */
@Component
@Order(3)
@Profile({"local", "local-h2", "prod"})
@RequiredArgsConstructor
@Slf4j
public class DirectPermissionBootstrapSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final UserPermissionOverrideRepository overrideRepository;

    @Override
    @Transactional
    public void run(String... args) {
        int migratedUsers = 0;
        int grantedPermissions = 0;

        for (var user : userRepository.findAll()) {
            if (!overrideRepository.findByUserId(user.getId()).isEmpty() || user.getRoles().isEmpty()) {
                continue;
            }

            Set<String> permissionCodes = new HashSet<>();
            user.getRoles().forEach(role -> role.getPermissions().stream()
                    .filter(permission -> permission.getDeletedAt() == null)
                    .map(permission -> permission.getCode())
                    .forEach(permissionCodes::add));
            if (permissionCodes.isEmpty()) {
                continue;
            }

            var overrides = permissionCodes.stream().map(code -> {
                UserPermissionOverride override = new UserPermissionOverride();
                override.setUser(user);
                override.setPermissionCode(code);
                override.setReason("Khởi tạo quyền trực tiếp từ dữ liệu role hiện hữu");
                return override;
            }).toList();
            overrideRepository.saveAll(overrides);
            user.setPermissionVersion((user.getPermissionVersion() == null ? 0 : user.getPermissionVersion()) + 1);
            userRepository.save(user);
            migratedUsers++;
            grantedPermissions += overrides.size();
        }

        if (migratedUsers > 0) {
            log.info("Đã chuyển quyền role sang quyền trực tiếp cho {} user ({} quyền)",
                    migratedUsers, grantedPermissions);
        }
    }
}
