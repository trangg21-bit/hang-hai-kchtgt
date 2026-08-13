package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.user.dto.GrantUserPermissionRequest;
import com.hanghai.kchtg.user.dto.UserPermissionOverrideResponse;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserPermissionOverride;
import com.hanghai.kchtg.user.repository.PermissionRepository;
import com.hanghai.kchtg.user.repository.UserPermissionOverrideRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.security.service.PermissionCacheService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UserPermissionService {

    private final UserRepository userRepository;
    private final PermissionRepository permissionRepository;
    private final UserPermissionOverrideRepository overrideRepository;
    private final PermissionCacheService permissionCacheService;
    private final OrgUnitScopeService orgUnitScopeService;

    @Transactional(readOnly = true)
    public List<UserPermissionOverrideResponse> list(UUID userId) {
        assertTargetUserInScope(userId);
        return overrideRepository.findActiveByUserId(userId).stream()
                .map(UserPermissionOverrideResponse::from)
                .toList();
    }

    public UserPermissionOverrideResponse grant(UUID userId, GrantUserPermissionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng"));
        assertTargetUserInScope(user);
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

    /**
     * Thay thế toàn bộ permission trực tiếp của một user.
     * Dùng cho form tạo/cập nhật user; null nghĩa là không thay đổi, còn danh
     * sách rỗng nghĩa là thu hồi toàn bộ quyền trực tiếp.
     */
    public void replaceDirectPermissions(UUID userId, List<String> permissionCodes) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng"));
        assertTargetUserInScope(user);

        java.util.stream.Stream<String> requestedStream = permissionCodes == null
                ? java.util.stream.Stream.empty()
                : permissionCodes.stream();
        Set<String> requested = requestedStream
                .filter(code -> code != null && !code.isBlank())
                .map(code -> code.trim().toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());

        if (!requested.isEmpty()) {
            Set<String> known = permissionRepository.findByCodeIn(requested).stream()
                    .map(permission -> permission.getCode().toLowerCase(Locale.ROOT))
                    .collect(Collectors.toSet());
            if (known.size() != requested.size()) {
                throw new IllegalArgumentException("Danh sách quyền chứa mã quyền không tồn tại");
            }
        }

        List<UserPermissionOverride> current = overrideRepository.findActiveByUserId(userId);
        for (UserPermissionOverride override : current) {
            String code = override.getPermissionCode().toLowerCase(Locale.ROOT);
            if (!requested.contains(code)) {
                override.softDelete(SecurityUtils.getCurrentUserId());
                overrideRepository.save(override);
            }
        }

        for (String code : requested) {
            UserPermissionOverride override = overrideRepository
                    .findByUserIdAndPermissionCode(userId, code)
                    .orElseGet(UserPermissionOverride::new);
            override.setUser(user);
            override.setPermissionCode(code);
            override.setDeletedAt(null);
            override.setDeletedBy(null);
            override.setReason("Cấp trực tiếp từ hồ sơ người dùng");
            overrideRepository.save(override);
        }

        user.incrementPermissionVersion();
        userRepository.save(user);
        permissionCacheService.invalidateCache(userId);
    }

    public void revoke(UUID userId, String permissionCode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng"));
        assertTargetUserInScope(user);
        UserPermissionOverride override = overrideRepository
                .findByUserIdAndPermissionCode(userId, permissionCode.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy quyền cấp trực tiếp"));
        override.softDelete(SecurityUtils.getCurrentUserId());
        overrideRepository.save(override);
        permissionCacheService.invalidateCache(userId);
        user.incrementPermissionVersion();
        userRepository.save(user);
    }

    private void assertTargetUserInScope(UUID userId) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng"));
        assertTargetUserInScope(target);
    }

    private void assertTargetUserInScope(User target) {
        UUID targetOrgUnitId = target.getOrgUnit() == null ? null : target.getOrgUnit().getId();
        if (!orgUnitScopeService.currentUserScope().allows(targetOrgUnitId)) {
            throw new AccessDeniedException("Bạn không có quyền phân quyền cho người dùng ngoài phạm vi đơn vị");
        }
    }
}
