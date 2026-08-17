package com.hanghai.kchtg.config;

import com.hanghai.kchtg.user.entity.Permission;
import com.hanghai.kchtg.user.repository.PermissionRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
@Order(1)
@Profile({"local", "local-h2", "prod"})
@RequiredArgsConstructor
@Slf4j
public class PermissionSeeder implements CommandLineRunner {

    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void run(String... args) {
        userRepository.findByUsername("admin").ifPresent(adminUser -> {
            adminUser.setPassword(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("admin123"));
            adminUser.setStatus(com.hanghai.kchtg.user.entity.UserStatus.ACTIVE);
            adminUser.setAccountLockedUntil(null);
            adminUser.setFailedLoginCount(0);
            adminUser.setFailedTotpCount(0);
            userRepository.save(adminUser);
        });

        Map<String, Permission> definitions = new LinkedHashMap<>();
        seedPermission(definitions, "user", "manage");
        seedPermission(definitions, "user", "read");
        seedPermission(definitions, "user", "approve");
        seedPermission(definitions, "orgunit", "manage");
        seedPermission(definitions, "orgunit", "read");
        seedPermission(definitions, "orgunit", "approve");
        seedPermission(definitions, "group", "manage");
        seedPermission(definitions, "group", "create");
        seedPermission(definitions, "group", "edit");
        seedPermission(definitions, "group", "delete");
        seedPermission(definitions, "group", "permission");
        seedPermission(definitions, "groupmember", "manage");
        seedPermission(definitions, "group", "lock");
        seedPermission(definitions, "group", "read");
        seedPermission(definitions, "document", "read");
        seedPermission(definitions, "document", "create");
        seedPermission(definitions, "document", "update");
        seedPermission(definitions, "document", "delete");
        seedPermission(definitions, "admin", "all");
        seedPermission(definitions, "admin", "manage");
        seedPermission(definitions, "admin", "view");
        seedPermission(definitions, "log", "manage");
        seedPermission(definitions, "map", "manage");
        seedPermission(definitions, "data", "approve");
        seedPermission(definitions, "data", "create");
        seedPermission(definitions, "data", "update");
        seedPermission(definitions, "data", "read");
        seedPermission(definitions, "data", "write");
        seedPermission(definitions, "report", "read");
        seedPermission(definitions, "check", "read");
        seedPermission(definitions, "approve", "action");
        seedPermission(definitions, "connection", "manage");
        seedPermission(definitions, "connection", "read");
        seedPermission(definitions, "api", "share");
        seedPermission(definitions, "security", "monitor");
        seedPermission(definitions, "security", "read");
        seedPermission(definitions, "navigationchannel", "create");
        seedPermission(definitions, "navigationchannel", "read");
        seedPermission(definitions, "navigationchannel", "update");
        seedPermission(definitions, "navigationchannel", "delete");
        seedPermission(definitions, "navigationchannel", "approvec1");
        seedPermission(definitions, "navigationchannel", "approvec2");
        seedPermission(definitions, "navigationchannel", "history");
        seedPermission(definitions, "dikerevetment", "create");
        seedPermission(definitions, "dikerevetment", "read");
        seedPermission(definitions, "dikerevetment", "update");
        seedPermission(definitions, "dikerevetment", "delete");
        seedPermission(definitions, "dikerevetment", "approvec1");
        seedPermission(definitions, "dikerevetment", "approvec2");
        seedPermission(definitions, "dikerevetment", "history");
        seedPermission(definitions, "shiprepair", "create");
        seedPermission(definitions, "shiprepair", "read");
        seedPermission(definitions, "shiprepair", "update");
        seedPermission(definitions, "shiprepair", "delete");
        seedPermission(definitions, "shiprepair", "approvec1");
        seedPermission(definitions, "shiprepair", "approvec2");
        seedPermission(definitions, "shiprepair", "history");
        seedPermission(definitions, "radarstation", "create");
        seedPermission(definitions, "radarstation", "read");
        seedPermission(definitions, "radarstation", "update");
        seedPermission(definitions, "radarstation", "delete");
        seedPermission(definitions, "radarstation", "approvec1");
        seedPermission(definitions, "radarstation", "approvec2");
        seedPermission(definitions, "radarstation", "history");
        seedPermission(definitions, "vts", "create");
        seedPermission(definitions, "vts", "read");
        seedPermission(definitions, "vts", "update");
        seedPermission(definitions, "vts", "delete");
        seedPermission(definitions, "vts", "approvec1");
        seedPermission(definitions, "vts", "approvec2");
        seedPermission(definitions, "vts", "history");

        int inserted = 0;
        for (Permission definition : definitions.values()) {
            if (permissionRepository.findByCode(definition.getCode()).isEmpty()) {
                permissionRepository.save(definition);
                inserted++;
            }
        }
        if (inserted > 0) {
            log.info("Seeded {} missing permissions", inserted);
        }
    }

    private void seedPermission(Map<String, Permission> definitions, String resource, String action) {
        String code = resource + ":" + action;
        if (definitions.containsKey(code)) return;

        Permission permission = new Permission();
        permission.setCode(code);
        permission.setName(code);
        permission.setDescription("Permission " + code);
        permission.setResource(resource);
        permission.setAction(action);
        definitions.put(code, permission);
    }
}

