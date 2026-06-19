package com.hanghai.kchtg.admin;

import com.hanghai.kchtg.admin.entity.AdminAccount;
import com.hanghai.kchtg.admin.entity.AdminAuditLog;
import com.hanghai.kchtg.admin.entity.AdminPermission;
import com.hanghai.kchtg.admin.entity.AdminRecoveryToken;
import com.hanghai.kchtg.admin.entity.AdminStatus;
import com.hanghai.kchtg.admin.repository.AdminAccountRepository;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import com.hanghai.kchtg.admin.repository.AdminPermissionRepository;
import com.hanghai.kchtg.admin.repository.AdminRecoveryTokenRepository;
import com.hanghai.kchtg.admin.service.AdminService;
import com.hanghai.kchtg.user.entity.User;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private AdminAccountRepository adminRepo;
    @Mock
    private AdminAuditLogRepository auditLogRepo;
    @Mock
    private AdminPermissionRepository permRepo;
    @Mock
    private AdminRecoveryTokenRepository recoveryTokenRepo;
    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private AdminService adminService;

    private AdminAccount testAdmin;
    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setUsername("superadmin");

        testAdmin = new AdminAccount();
        testAdmin.setId(UUID.randomUUID());
        testAdmin.setUser(testUser);
        testAdmin.setStatus(AdminStatus.ACTIVE);
        testAdmin.setUser(testUser);
    }

    @Nested
    @DisplayName("Find Admin")
    class FindTests {

        @Test
        @DisplayName("Should find admin by ID")
        void findById_success() {
            when(adminRepo.findById(testAdmin.getId())).thenReturn(Optional.of(testAdmin));

            AdminAccount found = adminService.findById(testAdmin.getId());
            assertNotNull(found);
            assertEquals(testUser.getUsername(), found.getUser().getUsername());
        }

        @Test
        @DisplayName("Should throw when admin not found")
        void findById_notFound_throws() {
            when(adminRepo.findById(any(UUID.class))).thenReturn(Optional.empty());

            assertThrows(jakarta.persistence.EntityNotFoundException.class, () ->
                    adminService.findById(UUID.randomUUID()));
        }

        @Test
        @DisplayName("Should find all admins")
        void findAll_success() {
            when(adminRepo.findAll()).thenReturn(Arrays.asList(testAdmin));

            List<AdminAccount> result = adminService.findAll();
            assertEquals(1, result.size());
        }
    }

    @Nested
    @DisplayName("MFA Reset")
    class MfaTests {

        @Test
        @DisplayName("Should request MFA reset")
        void requestMfaReset_success() {
            when(adminRepo.findByUserId(testAdmin.getId())).thenReturn(Optional.of(testAdmin));
            doNothing().when(recoveryTokenRepo).deleteByAdminId(testAdmin.getId());
            when(recoveryTokenRepo.save(any(AdminRecoveryToken.class))).thenAnswer(inv -> inv.getArgument(0));

            AdminRecoveryToken token = adminService.requestMfaReset(testAdmin.getId(), UUID.randomUUID(), "System");

            assertNotNull(token);
            verify(recoveryTokenRepo).save(any(AdminRecoveryToken.class));
        }

        @Test
        @DisplayName("Should validate and use recovery token")
        void resetMfaWithToken_success() {
            AdminRecoveryToken token = AdminRecoveryToken.create(testAdmin.getId(), "test-token-123");
            when(recoveryTokenRepo.findByTokenAndUsedFalse("test-token-123")).thenReturn(Optional.of(token));
            when(adminRepo.findByUserId(testAdmin.getId())).thenReturn(Optional.of(testAdmin));
            when(auditLogRepo.save(any(AdminAuditLog.class))).thenReturn(null);

            assertTrue(adminService.resetMfaWithToken("test-token-123", testAdmin.getId()));
            assertTrue(token.isUsed());
        }

        @Test
        @DisplayName("Should reject invalid token")
        void resetMfaWithToken_invalid() {
            when(recoveryTokenRepo.findByTokenAndUsedFalse("bad-token")).thenReturn(Optional.empty());

            assertFalse(adminService.resetMfaWithToken("bad-token", testAdmin.getId()));
        }
    }

    @Nested
    @DisplayName("Permissions")
    class PermissionTests {

        @Test
        @DisplayName("Should grant permission to admin")
        void grantPermission_success() {
            when(adminRepo.findByUserId(testAdmin.getId())).thenReturn(Optional.of(testAdmin));
            when(permRepo.findByAdminIdAndModuleId(any(UUID.class), anyString())).thenReturn(Collections.emptyList());
            when(permRepo.save(any(AdminPermission.class))).thenAnswer(inv -> inv.getArgument(0));
            when(auditLogRepo.save(any(AdminAuditLog.class))).thenReturn(null);

            AdminPermission result = adminService.grantPermission(testAdmin.getId(), "M-001", List.of("user.view", "user.create"));

            assertNotNull(result);
            verify(permRepo).save(any(AdminPermission.class));
        }

        @Test
        @DisplayName("Should revoke permission from admin")
        void revokePermission_success() {
            when(adminRepo.findByUserId(testAdmin.getId())).thenReturn(Optional.of(testAdmin));
            when(permRepo.findByAdminIdAndModuleId(any(UUID.class), anyString())).thenReturn(Collections.emptyList());
            when(auditLogRepo.save(any(AdminAuditLog.class))).thenReturn(null);

            assertDoesNotThrow(() -> adminService.revokePermission(testAdmin.getId(), "M-001"));
            verify(auditLogRepo).save(any(AdminAuditLog.class));
        }

        @Test
        @DisplayName("Should get admin permissions")
        void getPermissions_success() {
            when(permRepo.findByAdminId(testAdmin.getId())).thenReturn(Collections.emptyList());

            List<AdminPermission> perms = adminService.getPermissions(testAdmin.getId());
            assertEquals(0, perms.size());
        }
    }

    @Nested
    @DisplayName("Lock/Unlock")
    class LockUnlockTests {

        @Test
        @DisplayName("Should lock admin account")
        void lockAdmin_success() {
            when(adminRepo.findById(testAdmin.getId())).thenReturn(Optional.of(testAdmin));
            when(adminRepo.save(any(AdminAccount.class))).thenAnswer(inv -> inv.getArgument(0));
            when(auditLogRepo.save(any(AdminAuditLog.class))).thenReturn(null);

            AdminAccount locked = adminService.lockAdmin(testAdmin.getId(), "Suspicious activity");

            assertEquals(AdminStatus.LOCKED, locked.getStatus());
            verify(adminRepo).save(any(AdminAccount.class));
        }

        @Test
        @DisplayName("Should unlock admin account")
        void unlockAdmin_success() {
            when(adminRepo.findById(testAdmin.getId())).thenReturn(Optional.of(testAdmin));
            when(adminRepo.save(any(AdminAccount.class))).thenAnswer(inv -> inv.getArgument(0));
            when(auditLogRepo.save(any(AdminAuditLog.class))).thenReturn(null);

            AdminAccount unlocked = adminService.unlockAdmin(testAdmin.getId(), "Access restored");

            assertEquals(AdminStatus.ACTIVE, unlocked.getStatus());
            verify(adminRepo).save(any(AdminAccount.class));
        }
    }

    @Nested
    @DisplayName("Audit Logs")
    class AuditTests {

        @Test
        @DisplayName("Should find audit logs for admin")
        void findAuditLogs_success() {
            when(auditLogRepo.findByAdminIdOrderByCreatedAtDesc(testAdmin.getId())).thenReturn(Collections.emptyList());

            List<AdminAuditLog> logs = adminService.findAuditLogs(testAdmin.getId(), 0, 10);
            assertEquals(0, logs.size());
        }

        @Test
        @DisplayName("Should find all audit logs")
        void findAllAuditLogs_success() {
            when(auditLogRepo.findAll(any(org.springframework.data.domain.Sort.class))).thenReturn(Collections.emptyList());

            List<AdminAuditLog> logs = adminService.findAllAuditLogs();
            assertEquals(0, logs.size());
        }
    }
}
