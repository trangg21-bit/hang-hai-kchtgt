package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.security.service.PermissionCacheService;
import com.hanghai.kchtg.user.dto.GrantUserPermissionRequest;
import com.hanghai.kchtg.user.dto.UserPermissionOverrideResponse;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserPermissionOverride;
import com.hanghai.kchtg.user.repository.PermissionRepository;
import com.hanghai.kchtg.user.repository.UserPermissionOverrideRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class UserPermissionService {

    private final UserRepository userRepository;
    private final PermissionRepository permissionRepository;
    private final UserPermissionOverrideRepository overrideRepository;
    private final PermissionCacheService permissionCacheService;
    private final OrgUnitScopeService orgUnitScopeService;

    public List<UserPermissionOverrideResponse> list(UUID userId) {
        assertAuthenticated();
        assertSuperAdmin();
        assertTargetUserInScope(userId);
        return overrideRepository.findActiveByUserId(userId).stream()
                .map(UserPermissionOverrideResponse::from)
                .collect(Collectors.toList());
    }

    public List<UserPermissionOverrideResponse> listDirectPermissions(UUID userId) {
        return list(userId);
    }

    public UserPermissionOverrideResponse grant(UUID userId, GrantUserPermissionRequest request) {
        assertAuthenticated();
        assertSuperAdmin();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng"));
        assertTargetUserInScope(user);

        String code = request.getPermissionCode().trim().toLowerCase(Locale.ROOT);
        if (permissionRepository.findByCode(code).isEmpty()) {
            throw new IllegalArgumentException("Mã quyền không tồn tại: " + code);
        }
        assertCanGrantPermission(user, Set.of(code));

        Optional<UserPermissionOverride> existingOverride = overrideRepository
                .findByUserIdAndPermissionCode(userId, code);
        UserPermissionOverride override = existingOverride.orElseGet(UserPermissionOverride::new);
        boolean permissionChanged = existingOverride.isEmpty() || override.getDeletedAt() != null;
        String reason = request.getReason() == null ? null : request.getReason().trim();
        boolean metadataChanged = !Objects.equals(override.getReason(), reason);

        if (!permissionChanged && !metadataChanged) {
            return UserPermissionOverrideResponse.from(override);
        }

        override.setUser(user);
        override.setPermissionCode(code);
        override.setReason(reason);
        override.setDeletedAt(null);
        override.setDeletedBy(null);
        UserPermissionOverride saved = overrideRepository.save(override);
        if (permissionChanged) {
            user.incrementPermissionVersion();
            userRepository.save(user);
            permissionCacheService.invalidateCache(userId);
        }
        return UserPermissionOverrideResponse.from(saved);
    }

    /**
     * Validate permission codes upfront before creating or updating user.
     * Throws IllegalArgumentException or AccessDeniedException if invalid.
     */
    public void validateDirectPermissionsAssignment(User targetUser, List<String> permissionCodes) {
        if (permissionCodes == null || permissionCodes.isEmpty()) {
            return;
        }
        assertAuthenticated();
        assertSuperAdmin();
        if (targetUser != null) {
            assertTargetUserInScope(targetUser);
        }
        Set<String> requested = permissionCodes.stream()
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
            if (targetUser != null) {
                assertCanGrantPermission(targetUser, requested);
            }
        }
    }

    /**
     * Đồng bộ danh sách quyền trực tiếp của user trong cùng transaction của caller.
     * Trả về true nếu có thay đổi thực sự về quyền trực tiếp, false nếu không đổi.
     */
    public boolean syncDirectPermissionsInternal(User user, List<String> permissionCodes) {
        if (permissionCodes == null) {
            return false;
        }
        assertAuthenticated();
        assertSuperAdmin();
        assertTargetUserInScope(user);

        UUID userId = user.getId();
        Set<String> requested = permissionCodes.stream()
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
            assertCanGrantPermission(user, requested);
        }

        List<UserPermissionOverride> current = overrideRepository.findActiveByUserId(userId);
        Set<String> currentCodes = current.stream()
                .map(override -> override.getPermissionCode().toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());

        if (currentCodes.equals(requested)) {
            return false;
        }

        for (UserPermissionOverride override : current) {
            String code = override.getPermissionCode().toLowerCase(Locale.ROOT);
            if (!requested.contains(code)) {
                assertCanRevokePermission(user, code);
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

        return true;
    }

    /**
     * Thay thế toàn bộ permission trực tiếp của một user.
     * Dùng cho form tạo/cập nhật user; null nghĩa là không thay đổi, còn danh
     * sách rỗng nghĩa là thu hồi toàn bộ quyền trực tiếp.
     */
    public void replaceDirectPermissions(UUID userId, List<String> permissionCodes) {
        assertAuthenticated();
        assertSuperAdmin();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng"));
        assertTargetUserInScope(user);

        boolean changed = syncDirectPermissionsInternal(user, permissionCodes);
        if (!changed) {
            return;
        }

        user.incrementPermissionVersion();
        userRepository.save(user);
        permissionCacheService.invalidateCache(userId);
    }

    /**
     * Package-private system method for assigning permissions without authentication context (e.g. system seeders).
     * Restricted to internal service package to prevent unintended external invocations.
     */
    void replaceDirectPermissionsSystem(UUID userId, List<String> permissionCodes) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng"));

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
        Set<String> currentCodes = current.stream()
                .map(override -> override.getPermissionCode().toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());
        if (currentCodes.equals(requested)) {
            return;
        }

        for (UserPermissionOverride override : current) {
            String code = override.getPermissionCode().toLowerCase(Locale.ROOT);
            if (!requested.contains(code)) {
                override.softDelete(null);
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
            override.setReason("Cấp quyền hệ thống");
            overrideRepository.save(override);
        }

        user.incrementPermissionVersion();
        userRepository.save(user);
        permissionCacheService.invalidateCache(userId);
    }

    public void revoke(UUID userId, String permissionCode) {
        assertAuthenticated();
        assertSuperAdmin();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng"));
        assertTargetUserInScope(user);
        String code = permissionCode.trim().toLowerCase(Locale.ROOT);
        assertCanRevokePermission(user, code);

        UserPermissionOverride override = overrideRepository
                .findByUserIdAndPermissionCode(userId, code)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy quyền cấp trực tiếp"));
        override.softDelete(SecurityUtils.getCurrentUserId());
        overrideRepository.save(override);
        permissionCacheService.invalidateCache(userId);
        user.incrementPermissionVersion();
        userRepository.save(user);
    }

    private void assertAuthenticated() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AccessDeniedException("Yêu cầu xác thực người dùng để thực hiện phân quyền");
        }
    }

    private void assertSuperAdmin() {
        if (!SecurityUtils.isElevatedAdministrator()) {
            throw new AccessDeniedException(
                    "Chỉ Quản trị viên cấp cao (Super Admin) mới có quyền cấp hoặc thu hồi quyền trực tiếp cho người dùng");
        }
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

    private void assertCanGrantPermission(User targetUser, Set<String> requestedPermissions) {
        assertAuthenticated();
        assertSuperAdmin();
    }

    private void assertCanRevokePermission(User targetUser, String permissionCode) {
        assertAuthenticated();
        assertSuperAdmin();
    }
}
