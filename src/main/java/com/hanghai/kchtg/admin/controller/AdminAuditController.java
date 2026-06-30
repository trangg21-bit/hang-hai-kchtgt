package com.hanghai.kchtg.admin.controller;

import com.hanghai.kchtg.admin.entity.AdminAuditLog;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import com.hanghai.kchtg.admin.service.AdminService;
import com.hanghai.kchtg.common.dto.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller quan ly audit logs cua admin.
 * <p>
 * Base path: {@code /api/admins/audit}
 * </p>
 */
@RestController
@RequestMapping("/api/admins/audit")
public class AdminAuditController {

    private final AdminService adminService;
    private final AdminAuditLogRepository auditLogRepo;

    public AdminAuditController(AdminService adminService, AdminAuditLogRepository auditLogRepo) {
        this.adminService = adminService;
        this.auditLogRepo = auditLogRepo;
    }

    /**
     * Lay danh sach audit logs cua mot admin (phan trang).
     */
    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<List<AdminAuditLog>>> list(
            @RequestParam UUID adminId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String result,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        List<AdminAuditLog> logs = adminService.findAuditLogs(adminId, action, result, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    /**
     * Lay tat ca audit logs (khong filter admin).
     */
    @GetMapping("/all")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<List<AdminAuditLog>>> listAll(
            @RequestParam(required = false) String action,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Specification<AdminAuditLog> spec = null;
        if (action != null && !action.isBlank()) {
            final String finalAction = action;
            spec = Specification.where((root, query, cb) -> cb.equal(root.get("action"), finalAction));
        }
        Page<AdminAuditLog> result;
        if (spec != null) {
            result = auditLogRepo.findAll(spec, pageable);
        } else {
            result = auditLogRepo.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(result.getContent()));
    }

    /**
     * Lay chi tiet mot audit log entry.
     */
    @GetMapping("/{logId}")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<AdminAuditLog>> getById(@PathVariable UUID logId) {
        List<AdminAuditLog> all = auditLogRepo.findAll(Sort.by("createdAt").descending());
        AdminAuditLog found = all.stream()
                .filter(log -> log.getId().equals(logId))
                .findFirst()
                .orElse(null);
        return ResponseEntity.ok(ApiResponse.success(found));
    }
}