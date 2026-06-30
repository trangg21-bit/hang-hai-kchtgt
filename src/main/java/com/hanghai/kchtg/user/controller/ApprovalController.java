package com.hanghai.kchtg.user.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.user.dto.ApprovalDecisionRequest;
import com.hanghai.kchtg.user.dto.PendingApprovalResponse;
import com.hanghai.kchtg.user.dto.PendingApprovalRequest;
import com.hanghai.kchtg.user.service.ApprovalService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Approval controller for self-registration pending accounts.
 * <p>
 * Endpoints:
 * - GET /api/approvals/pending — list pending approvals (admin only)
 * - POST /api/approvals/{id}/approve — approve a pending request
 * - POST /api/approvals/{id}/reject — reject a pending request
 * - POST /api/users/pending — self-registration (public)
 * </p>
 */
@RestController
@RequestMapping("/api/approvals")
public class ApprovalController {

    private final ApprovalService approvalService;

    public ApprovalController(ApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    /**
     * GET /api/approvals/pending — Danh sach yeu ca dang ky dang cho phep duyet (phan trang).
     * @PreAuthorize for ADMIN_OPERATION or SYSTEM_ADMIN.
     */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN_OPERATION') or hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<Page<PendingApprovalResponse>>> listPending(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int actualSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(page, actualSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<PendingApprovalResponse> result = approvalService.listPending(pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * GET /api/approvals/{id} — Chi tiet yeu ca phep duyet theo ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN_OPERATION') or hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<PendingApprovalResponse>> getById(@PathVariable UUID id) {
        PendingApprovalResponse result = approvalService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * POST /api/approvals/{id}/approve — Phep duyet yeu ca.
     */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN_OPERATION') or hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<PendingApprovalResponse>> approve(
            @PathVariable UUID id,
            @Valid @RequestBody ApprovalDecisionRequest request) {
        // Extract current user's ID from SecurityContext
        UUID approverId = getCurrentUserId();
        String roleCode = request.getRoleCode();

        PendingApprovalResponse result = approvalService.approve(id, approverId, roleCode);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt thành công", result));
    }

    /**
     * POST /api/approvals/{id}/reject — Tu tuyen yeu ca.
     */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN_OPERATION') or hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<PendingApprovalResponse>> reject(
            @PathVariable UUID id,
            @Valid @RequestBody ApprovalDecisionRequest request) {
        UUID approverId = getCurrentUserId();
        String reason = request.getReason() != null ? request.getReason() : "Khong co ly do";

        PendingApprovalResponse result = approvalService.reject(id, approverId, reason);
        return ResponseEntity.ok(ApiResponse.success("Tu tuyen thành công", result));
    }

    // =========================================================================
    //  HELPERS
    // =========================================================================

    /**
     * Extract the current user's ID from SecurityContext.
     * Returns null if not authenticated.
     */
    private UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getDetails() != null) {
            Object details = auth.getDetails();
            if (details instanceof Map) {
                Object userId = ((Map<?, ?>) details).get("userId");
                if (userId != null) {
                    return UUID.fromString(userId.toString());
                }
            }
        }
        // Fallback: return a dummy ID (dev mode)
        return UUID.fromString("00000000-0000-0000-0000-000000000000");
    }
}
