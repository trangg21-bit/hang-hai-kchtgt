package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.user.dto.CreateRoleRequest;
import com.hanghai.kchtg.user.dto.UpdateRoleRequest;
import com.hanghai.kchtg.user.entity.Role;
import com.hanghai.kchtg.user.entity.RoleStatus;
import com.hanghai.kchtg.user.repository.RoleRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service quan ly vai trò (Role) trong he thong.
 */
@Service
@Transactional
public class RoleService {

    private static final Logger log = LoggerFactory.getLogger(RoleService.class);

    private final RoleRepository roleRepository;

    public RoleService(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Transactional(readOnly = true)
    public List<Role> findAll() {
        return roleRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Role findById(UUID id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Khong tim thay vai trò voi id: " + id));
    }

    @Transactional(readOnly = true)
    public Role findByCode(String code) {
        return roleRepository.findByCode(code)
                .orElseThrow(() -> new EntityNotFoundException("Khong tim thay vai trò voi code: " + code));
    }

    @Transactional(readOnly = true)
    public List<Role> findActiveRoles() {
        return roleRepository.findByStatus(RoleStatus.ACTIVE);
    }

    /**
     * Tao moi vai trò.
     *
     * @throws IllegalArgumentException neu code da ton tai
     */
    public Role create(CreateRoleRequest request) {
        if (roleRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Code vai trò da ton tai: " + request.getCode());
        }

        Role role = new Role();
        role.setName(request.getName());
        role.setCode(request.getCode());
        role.setDescription(request.getDescription());
        role.setPermissions(request.getPermissions() != null ? new java.util.ArrayList<>(request.getPermissions()) : new java.util.ArrayList<>());
        role.setStatus(RoleStatus.ACTIVE);
        role.setUserCount(0);

        Role saved = roleRepository.save(role);
        log.info("Created role: {} ({})", saved.getCode(), saved.getId());
        return saved;
    }

    /**
     * Cap nhat vai trò.
     *
     * @throws EntityNotFoundException neu khong tim thay role
     * @throws IllegalArgumentException neu code moi da duoc dung
     */
    public Role update(UUID id, UpdateRoleRequest request) {
        Role role = findById(id);

        if (request.getName() != null) {
            role.setName(request.getName());
        }
        if (request.getCode() != null && !request.getCode().equals(role.getCode())) {
            if (roleRepository.existsByCodeAndIdNot(request.getCode(), id)) {
                throw new IllegalArgumentException("Code vai trò da ton tai: " + request.getCode());
            }
            role.setCode(request.getCode());
        }
        if (request.getDescription() != null) {
            role.setDescription(request.getDescription());
        }
        if (request.getPermissions() != null) {
            role.setPermissions(new java.util.ArrayList<>(request.getPermissions()));
        }

        Role saved = roleRepository.save(role);
        log.info("Updated role: {} ({})", saved.getCode(), saved.getId());
        return saved;
    }

    /**
     * Xoa vai trò (soft delete — dung BaseEntity.softDelete()).
     *
     * @throws EntityNotFoundException neu khong tim thay role
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
     * Cap nhat so luong nguoi dung cua role.
     */
    @Transactional(readOnly = true)
    public void updateUserCount(UUID id) {
        Role role = findById(id);
        // Đếm users có role này
        long count = 0;
        // Trong thuc te se dung UserRepository.countByRole()
        role.setUserCount((int) count);
        roleRepository.save(role);
    }
}
