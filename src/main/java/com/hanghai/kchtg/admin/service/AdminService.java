package com.hanghai.kchtg.admin.service;

import com.hanghai.kchtg.admin.entity.AdminAccount;
import com.hanghai.kchtg.admin.entity.AdminAuditLog;
import com.hanghai.kchtg.admin.entity.AdminPermission;
import com.hanghai.kchtg.admin.entity.AdminRecoveryToken;
import com.hanghai.kchtg.admin.entity.AdminStatus;
import com.hanghai.kchtg.admin.repository.AdminAccountRepository;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import com.hanghai.kchtg.admin.repository.AdminPermissionRepository;
import com.hanghai.kchtg.admin.repository.AdminRecoveryTokenRepository;
import com.hanghai.kchtg.user.entity.User;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service quản lý tài khoản admin với tính năng MFA reset,
 * audit log management và phân quyền module.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);

    private final AdminAccountRepository adminRepo;
    private final AdminAuditLogRepository auditLogRepo;
    private final AdminPermissionRepository permRepo;
    private final AdminRecoveryTokenRepository recoveryTokenRepo;
    private final EntityManager entityManager;

    // ── Query ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AdminAccount> findAll() {
        return adminRepo.findAll();
    }

    @Transactional(readOnly = true)
    public AdminAccount findById(UUID id) {
        return adminRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Admin account not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<AdminAuditLog> findAuditLogs(UUID adminId, int page, int size) {
        return auditLogRepo.findByAdminIdOrderByCreatedAtDesc(adminId)
                .stream()
                .skip((long) page * size)
                .limit(size)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AdminAuditLog> findAllAuditLogs() {
        return auditLogRepo.findAll(Sort.by("createdAt").descending());
    }

    // ── MFA Reset ────────────────────────────────────────────────────

    /**
     * Tạo yêu cầu khôi phục MFA cho admin - tạo recovery token.
     */
    public AdminRecoveryToken requestMfaReset(UUID adminId, UUID requestBy, String requestByName) {
        AdminAccount admin = adminRepo.findByUserId(adminId)
                .orElseThrow(() -> new EntityNotFoundException("Admin account not found for userId: " + adminId));

        // Xóa các token cũ chưa dùng
        recoveryTokenRepo.deleteByAdminId(adminId);

        // Tạo token mới
        String token = UUID.randomUUID().toString().replace("-", "");
        AdminRecoveryToken recoveryToken = AdminRecoveryToken.create(adminId, token);
        recoveryTokenRepo.save(recoveryToken);

        // Ghi audit log
        auditLogRepo.save(AdminAuditLog.create(
                admin.getId(), "MFA Reset Requested", "MFA",
                "Yêu cầu khôi phục MFA cho userId: " + adminId,
                "Bởi: " + requestByName, "0.0.0.0", "System"));

        log.info("MFA reset requested for adminId: {}", adminId);
        return recoveryToken;
    }

    /**
     * Xác thực recovery token và hoàn tất MFA reset.
     */
    @Transactional
    public boolean resetMfaWithToken(String token, UUID adminId) {
        Optional<AdminRecoveryToken> tokenOpt = recoveryTokenRepo.findByTokenAndUsedFalse(token);
        if (tokenOpt.isEmpty()) {
            return false;
        }

        AdminRecoveryToken recoveryToken = tokenOpt.get();
        if (recoveryToken.isExpired()) {
            return false;
        }

        if (!recoveryToken.getAdminId().equals(adminId)) {
            return false;
        }

        // Đánh dấu đã dùng
        recoveryToken.setUsed(true);
        recoveryTokenRepo.save(recoveryToken);

        // Xóa token sau khi dùng
        recoveryTokenRepo.delete(recoveryToken);

        // Ghi audit log
        AdminAccount admin = adminRepo.findByUserId(adminId).orElse(null);
        if (admin != null) {
            auditLogRepo.save(AdminAuditLog.create(
                    admin.getId(), admin.getUser().getUsername(),
                    "MFA_RESET", "MFA đã được khôi phục thành công",
                    "Sử dụng recovery token", "0.0.0.0", "System"));
        }

        log.info("MFA reset completed for adminId: {}", adminId);
        return true;
    }

    /**
     * Super-admin approve MFA reset request.
     */
    @Transactional
    public AdminAccount approveMfaReset(UUID adminId, UUID superAdminId, String superAdminName) {
        AdminAccount admin = adminRepo.findByUserId(adminId)
                .orElseThrow(() -> new EntityNotFoundException("Admin account not found: " + adminId));

        // Reset MFA secret/key về null (disable MFA)
        // Trong thực tế sẽ cần thêm field mfaSecret vào AdminAccount/User

        auditLogRepo.save(AdminAuditLog.create(
                superAdminId, superAdminName,
                "MFA_APPROVED", "Approve MFA reset cho userId: " + adminId,
                null, "0.0.0.0", "System"));

        log.info("MFA reset approved for adminId: {} by {}", adminId, superAdminName);
        return admin;
    }

    // ── Permissions ──────────────────────────────────────────────────

    /**
     * Cấp permissions cho admin theo module.
     */
    @Transactional
    public AdminPermission grantPermission(UUID adminId, String moduleId, List<String> permissions) {
        AdminAccount admin = adminRepo.findByUserId(adminId)
                .orElseThrow(() -> new EntityNotFoundException("Admin account not found: " + adminId));

        // Xóa permissions cũ của module này
        List<AdminPermission> existing = permRepo.findByAdminIdAndModuleId(adminId, moduleId);
        existing.forEach(permRepo::delete);

        AdminPermission newPerm = AdminPermission.create(adminId, moduleId, permissions);
        AdminPermission saved = permRepo.save(newPerm);

        auditLogRepo.save(AdminAuditLog.create(
                admin.getId(), admin.getUser().getUsername(),
                "PERMISSION_GRANT", "Module: " + moduleId,
                permissions != null ? String.join(", ", permissions) : null,
                "0.0.0.0", "System"));

        return saved;
    }

    /**
     * Thu hồi permissions của admin theo module.
     */
    @Transactional
    public void revokePermission(UUID adminId, String moduleId) {
        AdminAccount admin = adminRepo.findByUserId(adminId)
                .orElseThrow(() -> new EntityNotFoundException("Admin account not found: " + adminId));

        List<AdminPermission> existing = permRepo.findByAdminIdAndModuleId(adminId, moduleId);
        existing.forEach(permRepo::delete);

        auditLogRepo.save(AdminAuditLog.create(
                admin.getId(), admin.getUser().getUsername(),
                "PERMISSION_REVOKE", "Module: " + moduleId,
                null, "0.0.0.0", "System"));
    }

    /**
     * Lấy tất cả permissions của admin.
     */
    @Transactional(readOnly = true)
    public List<AdminPermission> getPermissions(UUID adminId) {
        return permRepo.findByAdminId(adminId);
    }

    /**
     * Kiểm tra admin có permission cụ thể trong module không.
     */
    @Transactional(readOnly = true)
    public boolean hasPermission(UUID adminId, String moduleId, String permission) {
        return permRepo.hasPermission(adminId, moduleId, permission);
    }

    // ── Lock/Unlock Admin ────────────────────────────────────────────

    @Transactional
    public AdminAccount lockAdmin(UUID adminId, String reason) {
        AdminAccount admin = findById(adminId);
        admin.setStatus(AdminStatus.LOCKED);
        AdminAccount saved = adminRepo.save(admin);

        auditLogRepo.save(AdminAuditLog.create(
                admin.getId(), admin.getUser().getUsername(),
                "LOCKED", "Admin account locked",
                reason, "0.0.0.0", "System"));

        log.info("Locked admin account: {}", adminId);
        return saved;
    }

    @Transactional
    public AdminAccount unlockAdmin(UUID adminId, String reason) {
        AdminAccount admin = findById(adminId);
        admin.setStatus(AdminStatus.ACTIVE);
        AdminAccount saved = adminRepo.save(admin);

        auditLogRepo.save(AdminAuditLog.create(
                admin.getId(), admin.getUser().getUsername(),
                "UNLOCKED", "Admin account unlocked",
                reason, "0.0.0.0", "System"));

        log.info("Unlocked admin account: {}", adminId);
        return saved;
    }
}