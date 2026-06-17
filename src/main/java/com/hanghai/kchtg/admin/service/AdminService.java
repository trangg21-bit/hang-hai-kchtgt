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
 * Service quáº£n lĂ½ tĂ i khoáº£n admin vá»›i tĂ­nh nÄƒng MFA reset,
 * audit log management vĂ  phĂ¢n quyá»n module.
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

    // â”€â”€ Query â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
        return auditLogRepo.findByAdminIdOrderByPerformedAtDesc(adminId)
                .stream()
                .skip((long) page * size)
                .limit(size)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AdminAuditLog> findAllAuditLogs() {
        return auditLogRepo.findAll(Sort.by("performedAt").descending());
    }

    // â”€â”€ MFA Reset â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /**
     * Táº¡o yĂªu cáº§u khĂ´i phá»¥c MFA cho admin â€” táº¡o recovery token.
     */
    public AdminRecoveryToken requestMfaReset(UUID adminId, UUID requestBy, String requestByName) {
        AdminAccount admin = adminRepo.findByUserId(adminId)
                .orElseThrow(() -> new EntityNotFoundException("Admin account not found for userId: " + adminId));

        // XĂ³a cĂ¡c token cÅ© chÆ°a dĂ¹ng
        recoveryTokenRepo.deleteByAdminId(adminId);

        // Táº¡o token má»›i
        String token = UUID.randomUUID().toString().replace("-", "");
        AdminRecoveryToken recoveryToken = AdminRecoveryToken.create(adminId, token);
        recoveryTokenRepo.save(recoveryToken);

        // Ghi audit log
        auditLogRepo.save(AdminAuditLog.create(
                admin.getId(), "MFA Reset Requested", "MFA",
                "YĂªu cáº§u khĂ´i phá»¥c MFA cho userId: " + adminId,
                "Bá»Ÿi: " + requestByName, "0.0.0.0", "System"));

        log.info("MFA reset requested for adminId: {}", adminId);
        return recoveryToken;
    }

    /**
     * XĂ¡c thá»±c recovery token vĂ  hoĂ n táº¥t MFA reset.
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

        // ÄĂ¡nh dáº¥u Ä‘Ă£ dĂ¹ng
        recoveryToken.setUsed(true);
        recoveryTokenRepo.save(recoveryToken);

        // XĂ³a token sau khi dĂ¹ng
        recoveryTokenRepo.delete(recoveryToken);

        // Ghi audit log
        AdminAccount admin = adminRepo.findByUserId(adminId).orElse(null);
        if (admin != null) {
            auditLogRepo.save(AdminAuditLog.create(
                    admin.getId(), admin.getUser().getUsername(),
                    "MFA_RESET", "MFA Ä‘Ă£ Ä‘Æ°á»£c khĂ´i phá»¥c thĂ nh cĂ´ng",
                    "Sá»­ dá»¥ng recovery token", "0.0.0.0", "System"));
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

        // Reset MFA secret/key vá» null (disable MFA)
        // Trong thá»±c táº¿ sáº½ cáº§n thĂªm field mfaSecret vĂ o AdminAccount/User

        auditLogRepo.save(AdminAuditLog.create(
                superAdminId, superAdminName,
                "MFA_APPROVED", "Approve MFA reset cho userId: " + adminId,
                null, "0.0.0.0", "System"));

        log.info("MFA reset approved for adminId: {} by {}", adminId, superAdminName);
        return admin;
    }

    // â”€â”€ Permissions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /**
     * Cáº¥p permissions cho admin theo module.
     */
    @Transactional
    public AdminPermission grantPermission(UUID adminId, String moduleId, List<String> permissions) {
        AdminAccount admin = adminRepo.findByUserId(adminId)
                .orElseThrow(() -> new EntityNotFoundException("Admin account not found: " + adminId));

        // XĂ³a permissions cÅ© cá»§a module nĂ y
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
     * Thu há»“i permissions cá»§a admin theo module.
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
     * Láº¥y táº¥t cáº£ permissions cá»§a admin.
     */
    @Transactional(readOnly = true)
    public List<AdminPermission> getPermissions(UUID adminId) {
        return permRepo.findByAdminId(adminId);
    }

    /**
     * Kiá»ƒm tra admin cĂ³ permission cá»¥ thá»ƒ trong module khĂ´ng.
     */
    @Transactional(readOnly = true)
    public boolean hasPermission(UUID adminId, String moduleId, String permission) {
        return permRepo.hasPermission(adminId, moduleId, permission);
    }

    // â”€â”€ Lock/Unlock Admin â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
