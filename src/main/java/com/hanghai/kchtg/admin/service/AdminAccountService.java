package com.hanghai.kchtg.admin.service;

import com.hanghai.kchtg.admin.dto.AdminResponse;
import com.hanghai.kchtg.admin.dto.CreateAdminWithUserRequest;
import com.hanghai.kchtg.admin.dto.UpdateAdminRequest;
import com.hanghai.kchtg.admin.entity.AdminAccount;
import com.hanghai.kchtg.admin.entity.AdminRole;
import com.hanghai.kchtg.admin.entity.AdminStatus;
import com.hanghai.kchtg.admin.repository.AdminAccountRepository;
import com.hanghai.kchtg.user.entity.Role;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.repository.RoleRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminAccountService {

    private final AdminAccountRepository repository;
    private final EntityManager entityManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public List<AdminResponse> findAll() {
        return repository.findAllWithUser().stream()
                .map(AdminResponse::from)
                .toList();
    }

    public AdminResponse findById(UUID id) {
        AdminAccount entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("AdminAccount not found: " + id));
        return AdminResponse.from(entity);
    }

    public AdminResponse findByUserId(UUID userId) {
        AdminAccount entity = repository.findByUserId(userId)
                .orElseThrow(() -> new EntityNotFoundException("AdminAccount not found for userId: " + userId));
        return AdminResponse.from(entity);
    }

    @Transactional
    public AdminResponse create(CreateAdminWithUserRequest request) {
        // 1. Tạo User mới trong app_users
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        // Map admin role string to user role (with ROLE_ prefix for Spring Security)
        String roleKey = request.getRole().toUpperCase();
        String userRoleCode;
        switch (roleKey) {
            case "SYSTEM_ADMIN":
            case "SUPER_ADMIN":
                userRoleCode = "ROLE_SYSTEM_ADMIN";
                break;
            case "ADMIN":
            case "ADMINISTRATOR":
                userRoleCode = "ROLE_ADMIN";
                break;
            case "VIEWER":
                userRoleCode = "ROLE_VIEWER";
                break;
            case "USER":
            default:
                userRoleCode = "ROLE_USER";
                break;
        }
        Role userRole = roleRepository.findByCode(userRoleCode)
                .orElseThrow(() -> new IllegalArgumentException("Vai trò không tồn tại: " + userRoleCode));
        user.getRoles().add(userRole);
        user.setStatus(UserStatus.ACTIVE);
        User savedUser = userRepository.save(user);

        // 2. Tạo AdminAccount liên kết với User vừa tạo
        AdminAccount entity = new AdminAccount();
        entity.setUser(savedUser);
        // Map admin role string to AdminRole enum
        switch (roleKey) {
            case "SYSTEM_ADMIN":
            case "SUPER_ADMIN":
                entity.setRole(AdminRole.SUPER_ADMIN);
                break;
            case "ADMIN":
            case "ADMINISTRATOR":
                entity.setRole(AdminRole.MODULE_ADMIN);
                break;
            case "VIEWER":
                entity.setRole(AdminRole.VIEWER);
                break;
            case "USER":
                entity.setRole(AdminRole.VIEWER);
                break;
            default:
                entity.setRole(AdminRole.VIEWER);
                break;
        }
        entity.setModules(List.of());
        entity.setStatus(AdminStatus.ACTIVE);

        AdminAccount saved = repository.save(entity);
        return AdminResponse.from(saved);
    }

    @Transactional
    public AdminResponse update(UUID id, UpdateAdminRequest request) {
        AdminAccount entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("AdminAccount not found: " + id));

        if (request.getRole() != null) {
            entity.setRole(request.getRole());
        }
        if (request.getModules() != null) {
            entity.setModules(request.getModules());
        }
        if (request.getStatus() != null) {
            entity.setStatus(request.getStatus());
        }
        if (entity.getUser() != null) {
            if (request.getFullName() != null) {
                entity.getUser().setFullName(request.getFullName());
            }
            if (request.getEmail() != null) {
                entity.getUser().setEmail(request.getEmail());
            }
            if (request.getPhone() != null) {
                entity.getUser().setPhone(request.getPhone());
            }
        }

        AdminAccount saved = repository.save(entity);
        return AdminResponse.from(saved);
    }

    @Transactional
    public void delete(UUID id) {
        AdminAccount entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("AdminAccount not found: " + id));
        repository.delete(entity);
    }
}