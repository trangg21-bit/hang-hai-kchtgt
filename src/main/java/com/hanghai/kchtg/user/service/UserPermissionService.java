package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.user.dto.GrantUserPermissionRequest;
import com.hanghai.kchtg.user.dto.UserPermissionOverrideResponse;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserPermissionOverride;
import com.hanghai.kchtg.user.repository.PermissionRepository;
import com.hanghai.kchtg.user.repository.UserPermissionOverrideRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.security.service.PermissionCacheService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class UserPermissionService {

    private final UserRepository userRepository;
    private final PermissionRepository permissionRepository;
    private final UserPermissionOverrideRepository overrideRepository;
    private final PermissionCacheService permissionCacheService;

    @Transactional(readOnly = true)
    public List<UserPermissionOverrideResponse> list(UUID userId) {
        return overrideRepository.findByUserId(userId).stream()
                .map(UserPermissionOverrideResponse::from)
                .toList();
    }

    public UserPermissionOverrideResponse grant(UUID userId, GrantUserPermissionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng"));
        String code = request.getPermissionCode().trim().toLowerCase(Locale.ROOT);
        permissionRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Quyền không tồn tại: " + code));

        UserPermissionOverride override = overrideRepository
                .findByUserIdAndPermissionCode(userId, code)
                .orElseGet(UserPermissionOverride::new);
        override.setUser(user);
        override.setPermissionCode(code);
        override.setReason(request.getReason() == null ? null : request.getReason().trim());
        override.setDeletedAt(null);
        override.setDeletedBy(null);
        UserPermissionOverride saved = overrideRepository.save(override);
        permissionCacheService.invalidateCache(userId);
        user.incrementPermissionVersion();
        userRepository.save(user);
        return UserPermissionOverrideResponse.from(saved);
    }

    public void revoke(UUID userId, String permissionCode) {
        UserPermissionOverride override = overrideRepository
                .findByUserIdAndPermissionCode(userId, permissionCode.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy quyền cấp trực tiếp"));
        override.softDelete(SecurityUtils.getCurrentUserId());
        overrideRepository.save(override);
        permissionCacheService.invalidateCache(userId);
        userRepository.findById(userId).ifPresent(user -> {
            user.incrementPermissionVersion();
            userRepository.save(user);
        });
    }
}
