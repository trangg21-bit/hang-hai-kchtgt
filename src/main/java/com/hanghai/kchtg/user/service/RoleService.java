package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.user.dto.CreateRoleRequest;
import com.hanghai.kchtg.user.dto.UpdateRoleRequest;
import com.hanghai.kchtg.user.entity.Permission;
import com.hanghai.kchtg.user.entity.Role;
import com.hanghai.kchtg.user.entity.RoleStatus;
import com.hanghai.kchtg.user.repository.PermissionRepository;
import com.hanghai.kchtg.user.repository.RoleRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service quản lý vai trò (Role) trong hệ thống.
 */
@Service
@Transactional
public class RoleService {

    private static final Logger log = LoggerFactory.getLogger(RoleService.class);

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;

    public RoleService(RoleRepository roleRepository, PermissionRepository permissionRepository, UserRepository userRepository) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public List<Role> findAll() {
        List<Role> roles = roleRepository.findByStatusNot(RoleStatus.DELETED);
        
        java.util.Map<UUID, Long> countsMap = userRepository.countUsersGroupByRoleId().stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> (Long) row[1]
                ));

        for (Role role : roles) {
            role.setUserCount(countsMap.getOrDefault(role.getId(), 0L).intValue());
        }
        return roles;
    }

    @Transactional
    public Page<Role> findAll(Pageable pageable) {
        Page<Role> roles = roleRepository.findByStatusNot(RoleStatus.DELETED, pageable);
        
        java.util.Map<UUID, Long> countsMap = userRepository.countUsersGroupByRoleId().stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> (Long) row[1]
                ));

        for (Role role : roles) {
            role.setUserCount(countsMap.getOrDefault(role.getId(), 0L).intValue());
        }
        return roles;
    }

    @Transactional(readOnly = true)
    public Role findById(UUID id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vai trò với id: " + id));
    }

    @Transactional(readOnly = true)
    public Role findByCode(String code) {
        return roleRepository.findByCode(code)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vai trò với mã: " + code));
    }

    @Transactional(readOnly = true)
    public List<Role> findActiveRoles() {
        return roleRepository.findByStatus(RoleStatus.ACTIVE);
    }

    private Set<Permission> resolvePermissions(List<String> permissionCodes) {
        if (permissionCodes == null) {
            return new HashSet<>();
        }
        return permissionCodes.stream()
                .map(code -> permissionRepository.findByCode(code.trim())
                        .orElseThrow(() -> new IllegalArgumentException("Permission không tồn tại: " + code)))
                .collect(Collectors.toSet());
    }

    /**
     * Tạo mới vai trò.
     *
     * @throws IllegalArgumentException nếu code đã tồn tại
     */
    public Role create(CreateRoleRequest request) {
        if (roleRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Mã vai trò đã tồn tại: " + request.getCode());
        }

        Role role = new Role();
        role.setName(request.getName());
        role.setCode(request.getCode());
        role.setDescription(request.getDescription());
        role.setPermissions(resolvePermissions(request.getPermissions()));
        role.setStatus(RoleStatus.ACTIVE);
        role.setUserCount(0);

        Role saved = roleRepository.save(role);
        log.info("Created role: {} ({})", saved.getCode(), saved.getId());
        return saved;
    }

    /**
     * Cập nhật vai trò.
     *
     * @throws EntityNotFoundException nếu không tìm thấy role
     * @throws IllegalArgumentException nếu code mới đã được dùng
     */
    public Role update(UUID id, UpdateRoleRequest request) {
        Role role = findById(id);

        if (request.getName() != null) {
            role.setName(request.getName());
        }
        if (request.getCode() != null && !request.getCode().equals(role.getCode())) {
            if (roleRepository.existsByCodeAndIdNot(request.getCode(), id)) {
                throw new IllegalArgumentException("Mã vai trò đã tồn tại: " + request.getCode());
            }
            role.setCode(request.getCode());
        }
        if (request.getDescription() != null) {
            role.setDescription(request.getDescription());
        }
        if (request.getPermissions() != null) {
            role.setPermissions(resolvePermissions(request.getPermissions()));
        }

        Role saved = roleRepository.save(role);
        log.info("Updated role: {} ({})", saved.getCode(), saved.getId());
        return saved;
    }

    /**
     * Xóa vai trò (soft delete - dùng BaseEntity.softDelete()).
     *
     * @throws EntityNotFoundException nếu không tìm thấy role
     */
    public Role delete(UUID id) {
        Role role = findById(id);
        role.setStatus(RoleStatus.DELETED);
        role.softDelete();
        Role saved = roleRepository.save(role);
        log.info("Soft-deleted role: {} ({})", saved.getCode(), saved.getId());
        return saved;
    }

    /**
     * Cập nhật số lượng người dùng của role.
     */
    @Transactional
    public void updateUserCount(UUID id) {
        Role role = findById(id);
        long count = userRepository.countByRoleId(id);
        role.setUserCount((int) count);
        roleRepository.save(role);
    }
}